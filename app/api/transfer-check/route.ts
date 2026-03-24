import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface DncResult {
  status: string;
  data?: {
    tcpa_litigator?: string[];
    federal_dnc?: string[];
    invalid?: string[];
    cleaned_number?: string[];
  };
}

async function checkDNC(phone: string): Promise<{ allowed: boolean; info: string; type: 'info' | 'error' }> {
  try {
    const supabaseUrl = 'https://akdryqadcxhzqcqhssok.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrZHJ5cWFkY3hoenFjcWhzc29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Mjg5MDQsImV4cCI6MjA2OTMwNDkwNH0.36poCyc_PGl2EnGM3283Hj5_yxRYQU2IetYl8aUA3r4';

    const response = await fetch(`${supabaseUrl}/functions/v1/dnc-lookup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ mobileNumber: phone })
    });

    const result: DncResult = await response.json();

    if (result.status === 'success' && result.data?.tcpa_litigator?.includes(phone)) {
      return {
        allowed: false,
        info: 'TCPA LITIGATOR DETECTED - NO CONTACT PERMITTED. This number is flagged as a TCPA litigator. All transfers and contact attempts are strictly prohibited.',
        type: 'error'
      };
    }

    const blacklistResponse = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/blacklist-check?number=${phone}`);
    const blacklistData = await blacklistResponse.json();

    if (blacklistData?.blacklisted === true) {
      return {
        allowed: false,
        info: 'BLACKLISTED NUMBER DETECTED - NO CONTACT PERMITTED. This number is flagged as a TCPA litigator. All transfers and contact attempts are strictly prohibited.',
        type: 'error'
      };
    }

    let info = '';
    if (result.status === 'success' && result.data) {
      if (result.data.federal_dnc?.includes(phone)) {
        info += 'This number is on the Federal DNC list. ';
      }
      if (result.data.invalid?.includes(phone)) {
        info += 'This number is invalid. ';
      }
      if (result.data.cleaned_number?.includes(phone)) {
        info += 'This number is valid and not on DNC lists.';
      }
      if (!info) info = 'This number is valid.';
    } else {
      info = 'Could not verify DNC status.';
    }

    return { allowed: true, info, type: 'info' };
  } catch (err) {
    return { allowed: true, info: 'Error checking DNC status.', type: 'info' };
  }
}

function normalizePhone(phone: string | null): string | null {
  if (!phone || typeof phone !== 'string') return null;
  let digits = phone.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) return null;
  if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1);
  return digits.length === 10 ? digits : null;
}

async function searchDatabase(phone: string): Promise<{ record: any; meta: any } | null> {
  const normalizedSearchDigits = normalizePhone(phone);
  if (!normalizedSearchDigits) return null;

  const area = normalizedSearchDigits.slice(0, 3);
  const exchange = normalizedSearchDigits.slice(3, 6);
  const number = normalizedSearchDigits.slice(6);

  const phoneVariations = [
    normalizedSearchDigits,
    `1${normalizedSearchDigits}`,
    `(${area}) ${exchange}-${number}`,
    `${area}-${exchange}-${number}`,
    `+1${normalizedSearchDigits}`,
    `${area}.${exchange}.${number}`,
  ];

  let leads: any[] = [];

  for (const phoneVar of phoneVariations) {
    const { data: phoneLeads } = await supabase
      .from('leads')
      .select('id, phone, full_name, created_at')
      .eq('phone', phoneVar)
      .limit(20);

    if (phoneLeads && phoneLeads.length > 0) {
      leads = phoneLeads;
      break;
    }
  }

  if (leads.length === 0) {
    const digitPattern = `%${normalizedSearchDigits.slice(0, 3)}%${normalizedSearchDigits.slice(3, 6)}%${normalizedSearchDigits.slice(6)}%`;
    const { data: patternLeads } = await supabase
      .from('leads')
      .select('id, phone, full_name')
      .like('phone', digitPattern)
      .limit(50);

    if (patternLeads) {
      leads = patternLeads.filter((lead: any) => normalizePhone(lead.phone) === normalizedSearchDigits);
    }
  }

  let opportunities: any[] = [];

  if (leads.length > 0) {
    const leadIds = leads.map(l => l.id);
    const { data: ops } = await supabase
      .from('opportunities')
      .select('id, lead_id, current_stage, opportunity_status, opportunity_name, status_updated_at, created_at')
      .in('lead_id', leadIds)
      .order('created_at', { ascending: false })
      .limit(500);

    if (ops && ops.length > 0) {
      opportunities = ops.map((op: any) => {
        const lead = leads.find(l => l.id === op.lead_id);
        return {
          opportunity_id: op.id,
          opportunity_name: op.opportunity_name,
          current_stage: op.current_stage,
          opportunity_status: op.opportunity_status,
          transfer_status: op.opportunity_status,
          phone: lead?.phone,
          full_name: lead?.full_name,
          status_updated_at: op.status_updated_at,
          opportunity_created_at: op.created_at,
          created_at: op.created_at
        };
      });
    }
  }

  if (opportunities.length === 0) {
    const { data: rows } = await supabase
      .from('transfer_check_view')
      .select('*')
      .ilike('opportunity_name', `%${phone}%`)
      .limit(200);

    if (rows) opportunities = rows;
  }

  if (opportunities.length === 0) return { record: null, meta: { foundCount: 0 } };

  const isDQStage = (s: string) => {
    if (!s || typeof s !== 'string') return false;
    const dqRegex = /\b(dq\b|dq'd|disqualif|disqualified|chargeback\s*dq|returned to center\s*-?\s*dq)\b/i;
    return dqRegex.test(s);
  };

  const dqMatch = opportunities.find(r => isDQStage(r.current_stage) || isDQStage(r.opportunity_status) || isDQStage(r.transfer_status));

  if (dqMatch) {
    return { record: dqMatch, meta: { foundCount: opportunities.length, dqPrioritized: true } };
  }

  opportunities.sort((a, b) => {
    const dateA = new Date(a.created_at || a.opportunity_created_at || 0).getTime();
    const dateB = new Date(b.created_at || b.opportunity_created_at || 0).getTime();
    return dateB - dateA;
  });

  return { record: opportunities[0], meta: { foundCount: opportunities.length, dqPrioritized: false } };
}

function mapLeadToLegacyFormat(record: any): any {
  if (!record) return {};
  return {
    Mobile: record.phone || record.leads?.phone || '-',
    Name: record.full_name || record.leads?.full_name || '-',
    'Policy Status': record.opportunity_status || record.transfer_status || '-',
    'GHL Pipeline Stage': record.current_stage || '-',
    Status: record.opportunity_status || '-',
    Phone: record.phone || record.leads?.phone || '-',
    'Full Name': record.full_name || record.leads?.full_name || '-'
  };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { 
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    const normalizedPhone = phone.replace(/\D/g, '');

    const dncResult = await checkDNC(normalizedPhone);

    const searchResult = await searchDatabase(normalizedPhone);

    const response: any = {
      phone: normalizedPhone,
      dnc: {
        allowed: dncResult.allowed,
        message: dncResult.info,
        type: dncResult.type
      }
    };

    if (!dncResult.allowed) {
      response.status = 'blocked';
      response.message = 'Number is blocked due to DNC/Tcpa litigator';
      return NextResponse.json(response, {
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (!searchResult || !searchResult.record) {
      response.status = 'not_found';
      response.message = 'Customer not found in system - Approved for Transfer';
      response.approved = true;
      return NextResponse.json(response, {
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const userData = mapLeadToLegacyFormat(searchResult.record);

    response.status = 'found';
    response.data = userData;
    response.warnings = {};

    if (searchResult.meta.dqPrioritized) {
      response.warnings.dq = true;
      response.message = 'The Transfer will not be accepted from this customer. It is currently disqualified from our agency.';
    }

    const policyStatus = (userData['Policy Status'] || '').toLowerCase();

    if (policyStatus.includes('customer has current policy')) {
      response.warnings.policy = true;
      response.warningMessage = 'Customer has current existing policies with us. They must be notified that this is additional coverage, not a new or first policy.';
    } else if (policyStatus.includes('customer has already been dq from our agency')) {
      response.warnings.dq = true;
    }

    if (policyStatus.includes('approved') || (policyStatus.includes('can be sent') && policyStatus.includes('approved'))) {
      response.warnings.existing = true;
      response.existingMessage = 'An existing customer in our database but not a current customer and has approved for transfer for sale';
    }

    return NextResponse.json(response, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { 
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}