import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json({ success: false, error: 'Username and password are required' }, { status: 400 });
        }

        const { data, error } = await supabase.rpc('authenticate_user', {
            input_username: username,
            input_password: password
        });

        if (error) {
            console.error('Auth error:', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Server Login error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
