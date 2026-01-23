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
    
    // Check if the number is blacklisted (TCPA litigator)
    // Based on Blacklist Alliance API response format:
    // - results: 0 = not blacklisted, > 0 = blacklisted (found matches)
    // - code: "none" = not blacklisted, any other value = blacklisted/flagged
    const isBlacklisted = data && (
      (data.results !== undefined && data.results > 0) ||  // Found in blacklist (primary indicator)
      (data.code && data.code !== "none" && data.code !== "NONE" && data.code !== "")  // Has a flag code (secondary indicator)
    );
    
    // Return standardized response format for frontend
    return NextResponse.json({
      blacklisted: isBlacklisted,
      tcpa_litigator: isBlacklisted, // Alias for consistency
      rawResponse: data, // Include raw response for debugging
    });
  } catch (error) {
    console.error('Blacklist check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

