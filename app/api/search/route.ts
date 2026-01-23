import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const phone = searchParams.get('phone');
        const term = searchParams.get('term');

        if (phone) {
            // Secure search for phone (via transfer_check_view)
            const { data, error } = await supabase.from('transfer_check_view').select('*');
            if (error) throw error;
            return NextResponse.json(data);
        } else if (term) {
            // Full term search logic moved to server to bypass regional blocks
            const searchTerm = term.trim();
            // This is simplified but effective for the proxy
            const { data: rows, error } = await supabase
                .from('transfer_check_view')
                .select('*')
                .ilike('opportunity_name', `%${searchTerm}%`)
                .limit(200);
            
            if (error) throw error;
            return NextResponse.json(rows);
        }

        return NextResponse.json({ error: 'Missing search parameters' }, { status: 400 });
    } catch (error: any) {
        console.error('API Search error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
