import { NextRequest, NextResponse } from 'next/server';
import { SUPABASE_CONFIG } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { mobileNumber } = body;

        if (!mobileNumber) {
            return NextResponse.json({ status: 'error', message: 'Mobile number is required' }, { status: 400 });
        }

        const functionUrl = `${SUPABASE_CONFIG.url}/functions/v1/dnc-lookup`;

        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
            },
            body: JSON.stringify({ mobileNumber })
        });

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('DNC Lookup Proxy Error:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
