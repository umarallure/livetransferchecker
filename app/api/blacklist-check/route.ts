import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const number = searchParams.get('number');

    if (!number) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Get API key from environment variable
    const apiKey = process.env.BLACKLIST_ALLIANCE_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Format phone number for API (ensure it has + prefix for international format)
    // If it's 10 digits, assume US number and add +1
    // If it's 11 digits and starts with 1, add +
    // Otherwise, ensure it has + prefix
    const normalizedNumber = number.replace(/\D/g, '');
    let formattedPhone = normalizedNumber;
    if (normalizedNumber.length === 10) {
      formattedPhone = `+1${normalizedNumber}`;
    } else if (normalizedNumber.length === 11 && normalizedNumber.startsWith('1')) {
      formattedPhone = `+${normalizedNumber}`;
    } else if (!number.startsWith('+')) {
      formattedPhone = `+${normalizedNumber}`;
    } else {
      formattedPhone = number; // Already has + prefix
    }

    // URL encode the phone number
    const encodedPhone = encodeURIComponent(formattedPhone);

    // Call Blacklist Alliance API with correct format
    // Use 'key' and 'phone' parameters (not 'apiKey' and 'number')
    const response = await fetch(
      `https://api.blacklistalliance.net/lookup?key=${apiKey}&phone=${encodedPhone}`,
      {
        headers: {
          'accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Blacklist Alliance API error' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Blacklist Alliance indicates blacklist via message, code, or results. If any is true → blacklisted.
    const isBlacklisted =
      (data && typeof data.message === 'string' && data.message.toLowerCase() === 'blacklisted') ||
      (data && data.code) ||
      (data && typeof data.results === 'number' && data.results >= 1);

    return NextResponse.json({
      ...data,
      blacklisted: !!isBlacklisted,
    });
  } catch (error) {
    console.error('Blacklist check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

