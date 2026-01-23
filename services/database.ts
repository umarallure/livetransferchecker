// Types
export interface Lead {
    id: string;
    phone: string;
    full_name: string;
    created_at?: string;
}

export interface Opportunity {
    id: string;
    opportunity_name: string;
    current_stage: string;
    opportunity_status: string;
    leads?: {
        phone: string;
        full_name: string;
    };
}

class DatabaseService {
    // Normalize phone number for consistent searching
    normalizePhoneNumber(phone: string | null): string | null {
        if (!phone || typeof phone !== 'string') return null;
        
        // Extract digits only, handling extensions and international formats
        let digits = phone.replace(/\D/g, '');
        
        // Handle edge cases
        if (digits.length < 10) return null; // Too short to be valid US phone
        if (digits.length > 15) return null; // Too long, likely has extension or invalid
        
        // Remove leading country codes
        if (digits.length === 11 && digits.startsWith('1')) {
            digits = digits.slice(1);
        } else if (digits.length === 12 && digits.startsWith('01')) {
            digits = digits.slice(2); // Remove "01" international prefix
        } else if (digits.length > 11) {
            // Likely has extension, take first 10 digits after country code
            if (digits.startsWith('1') && digits.length >= 11) {
                digits = digits.slice(1, 11);
            } else {
                digits = digits.slice(0, 10);
            }
        }
        
        // Validate final result is 10 digits
        return digits.length === 10 ? digits : null;
    }

    // Extract phone number from opportunity name (format: "Name-(phone)")
    extractPhoneFromOpportunityName(opportunityName: string): string | null {
        if (!opportunityName) return null;
        
        // Look for phone pattern like "-(757) 627-1618" or "-7576271618" at the end
        const phoneMatch = opportunityName.match(/-\(?(\d{3})\)?[\s.-]?(\d{3})[\s.-]?(\d{4})$/);
        if (phoneMatch) {
            return phoneMatch[1] + phoneMatch[2] + phoneMatch[3]; // Return as 10 digits
        }
        
        // Alternative pattern: look for any 10-digit number in parentheses or dashes
        const altPhoneMatch = opportunityName.match(/[^\d]*(\d{10})[^\d]*$/);
        if (altPhoneMatch) {
            return altPhoneMatch[1];
        }
        
        return null;
    }

    // Map database record to legacy format for UI compatibility
    mapLeadToLegacyFormat(record: any): any {
        if (!record) return {};
        return {
            "Mobile": record.phone || record.leads?.phone || '-',
            "Name": record.full_name || record.leads?.full_name || '-',
            "Policy Status": record.opportunity_status || record.transfer_status || '-',
            "GHL Pipeline Stage": record.current_stage || '-',
            "Status": record.opportunity_status || '-',
            "Phone": record.phone || record.leads?.phone || '-',
            "Full Name": record.full_name || record.leads?.full_name || '-'
        };
    }

    // Search for opportunities by a free-text term (name or number) - via Server Proxy
    async searchOpportunityByTerm(term: string): Promise<{ record: any, meta: any } | null> {
        if (!term) return null;

        const searchTerm = term.trim();
        let opportunities: any[] = [];

        try {
            // Call our internal API route which proxies the request to Supabase
            const response = await fetch(`/api/search?term=${encodeURIComponent(searchTerm)}`);
            
            if (!response.ok) {
                throw new Error('Database search failed via proxy');
            }

            opportunities = await response.json();

            if (opportunities.length === 0) {
                return { record: null, meta: { foundCount: 0 } };
            }


            // DQ detection logic
            const isDQStage = (s: string) => {
                if (!s || typeof s !== 'string') return false;
                const dqRegex = /\b(dq\b|dq'd|disqualif|disqualified|chargeback\s*dq|returned to center\s*-?\s*dq)\b/i;
                return dqRegex.test(s);
            };

            const dqMatch = opportunities.find(r => isDQStage(r.current_stage) || isDQStage(r.opportunity_status) || isDQStage(r.transfer_status));
            
            if (dqMatch) {
                return {
                    record: dqMatch,
                    meta: { foundCount: opportunities.length, dqPrioritized: true }
                };
            }

            // Default to most recent
            // Sort by created_at descending if available
            opportunities.sort((a, b) => {
                const dateA = new Date(a.created_at || a.opportunity_created_at || 0).getTime();
                const dateB = new Date(b.created_at || b.opportunity_created_at || 0).getTime();
                return dateB - dateA;
            });

            return {
                record: opportunities[0],
                meta: { foundCount: opportunities.length, dqPrioritized: false }
            };

        } catch (error) {
            console.error('Search error:', error);
            throw error;
        }
    }

    // Search for opportunities by phone number (SECURE VERSION - via Server Proxy)
    async searchOpportunityByPhone(phoneNumber: string): Promise<Opportunity | null> {
        try {
            const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
            
            // Call our internal API route which proxies the request to Supabase
            const response = await fetch(`/api/search?phone=${encodeURIComponent(phoneNumber)}`);
            
            if (!response.ok) {
                throw new Error('Database search failed via proxy');
            }

            const transferChecks = await response.json();

            // Find matching opportunity by extracting phone from opportunity_name
            const matchingTransferCheck = transferChecks?.find((check: any) => {
                const extractedPhone = this.extractPhoneFromOpportunityName(check.opportunity_name);
                const normalized = extractedPhone ? this.normalizePhoneNumber(extractedPhone) : null;
                return normalized && normalized === normalizedPhone;
            });

            // Convert secure view data to expected format
            if (matchingTransferCheck) {
                return {
                    id: matchingTransferCheck.opportunity_id,
                    opportunity_name: matchingTransferCheck.opportunity_name,
                    current_stage: matchingTransferCheck.current_stage,
                    opportunity_status: matchingTransferCheck.transfer_status, // Use computed secure status
                    leads: {
                        phone: matchingTransferCheck.phone,
                        full_name: matchingTransferCheck.full_name,
                        // No other sensitive fields exposed
                    }
                };
            }

            return null;
        } catch (error) {
            throw error;
        }
    }
}

export const dbService = new DatabaseService();
