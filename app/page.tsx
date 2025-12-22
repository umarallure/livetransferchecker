'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth';
import { dbService, Opportunity } from '@/services/database';
import FloatingDots from '@/components/FloatingDots';
import FormParticles from '@/components/FormParticles';

export default function Dashboard() {
  const router = useRouter();
  const [mobileNumber, setMobileNumber] = useState('');
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<string | null>(null);
  
  // New state variables for UI logic
  const [showApprovedMessage, setShowApprovedMessage] = useState(false);
  const [dncInfo, setDncInfo] = useState<{ visible: boolean; text: string; type: 'info' | 'error' }>({ visible: false, text: '', type: 'info' });
  const [warnings, setWarnings] = useState({
    policy: false,
    dq: false,
    existing: false
  });

  // Auth Check
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
    } else {
        const userInfo = authService.getSessionInfo();
        if (userInfo) {
            setUser(userInfo.user);
        }
    }
  }, [router]);

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
        authService.logout();
        router.push('/login');
    }
  };

  const checkDNCStatus = async (phone: string) => {
    // Reset DNC info
    setDncInfo({ visible: false, text: '', type: 'info' });

    if (!/^[0-9]{10}$/.test(phone)) {
        setDncInfo({ visible: true, text: 'Please enter a valid 10-digit US/Canada number for DNC check.', type: 'info' });
        return true;
    }

    try {
        const response = await fetch('https://akdryqadcxhzqcqhssok.supabase.co/functions/v1/dnc-lookup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrZHJ5cWFkY3hoenFjcWhzc29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Mjg5MDQsImV4cCI6MjA2OTMwNDkwNH0.36poCyc_PGl2EnGM3283Hj5_yxRYQU2IetYl8aUA3r4'
            },
            body: JSON.stringify({ mobileNumber: phone })
        });
        const result = await response.json();

        if (result.status === 'success' && result.data && result.data.tcpa_litigator && result.data.tcpa_litigator.includes(phone)) {
            setDncInfo({ 
                visible: true, 
                text: '⚠️ TCPA LITIGATOR DETECTED - NO CONTACT PERMITTED. This number is flagged as a TCPA litigator. All transfers and contact attempts are strictly prohibited.', 
                type: 'error' 
            });
            return false; // Block
        }

        let info = '';
        if (result.status === 'success' && result.data) {
            if (result.data.federal_dnc && result.data.federal_dnc.includes(phone)) {
                info += '🚫 This number is on the Federal DNC list.\n';
            }
            if (result.data.invalid && result.data.invalid.includes(phone)) {
                info += '❌ This number is invalid.\n';
            }
            if (result.data.cleaned_number && result.data.cleaned_number.includes(phone)) {
                info += '✅ This number is valid and not on DNC lists.';
            }
            if (!info) info = '✅ This number is valid.';
        } else {
            info = 'Could not verify DNC status.';
        }

        setDncInfo({ visible: true, text: info, type: 'info' });
        return true; // Allow
    } catch (err) {
        setDncInfo({ visible: true, text: 'Error checking DNC status.', type: 'info' });
        return true; // Allow on error
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileNumber) return;

    // Normalize phone number: remove all non-numeric characters
    const normalizedPhone = mobileNumber.replace(/\D/g, '');

    setLoading(true);
    setError('');
    setResult(null);
    setShowApprovedMessage(false);
    setWarnings({ policy: false, dq: false, existing: false });
    setDncInfo({ visible: false, text: '', type: 'info' });

    try {
      // 1. Check DNC
      const allowUserInfo = await checkDNCStatus(normalizedPhone);
      if (!allowUserInfo) {
        setLoading(false);
        return;
      }

      // 2. Search DB
      const searchRes = await dbService.searchOpportunityByTerm(normalizedPhone);
      
      if (!searchRes || !searchRes.record) {
        setShowApprovedMessage(true);
        setLoading(false);
        return;
      }

      const { record, meta } = searchRes;
      const userData = dbService.mapLeadToLegacyFormat(record);
      setResult(userData);

      // 3. Handle DQ Prioritization
      if (meta && meta.dqPrioritized) {
        setWarnings(prev => ({ ...prev, dq: true }));
        setShowApprovedMessage(false); // Explicitly hide approved message
        setLoading(false);
        return;
      }

      // 4. Handle Status Warnings
      const userPolicyStatus = (userData['Policy Status'] || '').toLowerCase();
      
      if (userPolicyStatus.includes('customer has current policy')) {
        setWarnings(prev => ({ ...prev, policy: true }));
      } else if (userPolicyStatus.includes("customer has already been dq from our agency")) {
        setWarnings(prev => ({ ...prev, dq: true }));
      }

      if (userPolicyStatus.includes('approved') || (userPolicyStatus.includes('can be sent') && userPolicyStatus.includes('approved'))) {
        setWarnings(prev => ({ ...prev, existing: true }));
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while searching');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-gradient-to-r from-gray-900 to-gray-800 text-white relative overflow-hidden">
        <FloatingDots />
        <div className="absolute inset-0 opacity-10">
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
                <defs>
                    <pattern id="pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                        <circle cx="20" cy="20" r="1.5" fill="white" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#pattern)" />
            </svg>
        </div>
        
        <section className="rotate-bg top-20 left-10 animate-spin-slow opacity-70"></section>
        <section className="rotate-bg bottom-10 right-10 animate-spin-slow opacity-70" style={{ animationDelay: '2s' }}></section>
        
        <figure className="absolute top-20 left-10 w-64 h-64 bg-primary-500/20 rounded-full filter blur-3xl animate-pulse-slow"></figure>
        <figure className="absolute bottom-10 right-10 w-96 h-96 bg-primary-400/20 rounded-full filter blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></figure>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <nav className="flex justify-between items-center py-4">
                <figure className="flex items-center space-x-2 hover-scale">
                    <img src="https://msgsndr-private.storage.googleapis.com/companyPhotos/4f1160a0-676f-4984-b05b-6186ed7d27d4.png" alt="Logo" className="h-32 w-60 object-contain flex justify-center items-center transition-all duration-500 hover:filter hover:brightness-110" />
                </figure>
                
                <div className="flex items-center space-x-4 text-white">
                    <div className="hidden sm:flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-sm font-medium">Welcome, {user || 'User'}</span>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 hover:border-red-400/50 transition-all duration-300 text-sm font-medium"
                        title="Logout"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="hidden sm:inline">Logout</span>
                    </button>
                </div>
            </nav>
            
            <section className="mt-16 mb-20 text-center">
                <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight animate-float text-gradient">
                    Find User Information <br className="hidden sm:block" /> in Seconds
                </h1>
                <p className="text-lg md:text-xl text-primary-100 max-w-2xl mx-auto mb-8 animate-fade-in">
                    Enter a mobile number to instantly retrieve user details from our database.
                </p>
            </section>
        </div>
        

      </header>
      
      <main className="w-full max-w-4xl px-4 sm:px-6 lg:px-8 -mt-16 relative z-20 mb-16 mx-auto">
        <article className="glass-effect rounded-xl shadow-xl p-8 border border-gray-200 animate-fade-in form-container w-full mx-auto lg:px-20 relative">
            <FormParticles />
            <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-primary-500 animate-bounce-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="text-gradient">Search User by Mobile Number</span>
                </h2>
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-grow relative input-wrapper group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 transition-all duration-300 input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                            </svg>
                        </div>
                        <input 
                            type="tel" 
                            value={mobileNumber}
                            onChange={(e) => {
                                const cleaned = e.target.value.replace(/\D/g, '');
                                setMobileNumber(cleaned);
                            }}
                            placeholder="Enter mobile number" 
                            pattern="[0-9]*"
                            inputMode="numeric"
                            className="w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none fancy-input transition-all duration-300"
                        />
                    </div>
                    
                    <button 
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 btn-gradient search-button text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-300 flex items-center justify-center shadow-md group disabled:opacity-70"
                    >
                        {loading ? (
                            <div className="inline-block h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></div>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 search-button-icon transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        )}
                        <span className="relative z-10">{loading ? 'Searching...' : 'Search'}</span>
                    </button>
                </form>
            </section>

            {/* DNC Info Section */}
            {dncInfo.visible && (
                <section className={`mt-6 p-6 rounded-lg shadow-lg ${dncInfo.type === 'error' ? 'bg-red-50 border-2 border-red-500' : 'bg-blue-50 border border-blue-200'}`}>
                    <div className={`flex items-center ${dncInfo.type === 'error' ? 'text-red-700' : 'text-blue-700'}`}>
                        {dncInfo.type === 'error' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                        <span className="text-lg font-semibold whitespace-pre-line">{dncInfo.text}</span>
                    </div>
                </section>
            )}

            {/* Approved Message */}
            {showApprovedMessage && (
                <section className="p-6 rounded-lg animate-slide-up transition-all duration-300 bg-green-50 border border-green-200 mt-8">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 bg-green-100 rounded-full p-2 animate-bounce-subtle">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="ml-3 text-green-600 font-medium text-lg">Customer not found in system – Approved for Transfer.</p>
                    </div>
                </section>
            )}

            {error && (
                <section className="p-6 rounded-lg animate-slide-up error-message transition-all duration-300 bg-red-50 border border-red-200 mb-8 mt-8">
                    <div className="flex items-start">
                        <div className="flex-shrink-0 bg-red-100 rounded-full p-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                        </div>
                        <p className="ml-3 text-red-600">{error}</p>
                    </div>
                </section>
            )}

            {result && (
                <section className="mt-8 border border-green-200 rounded-lg bg-green-50 p-6 animate-slide-up transition-all duration-500 hover:shadow-lg hover:border-green-300">
                    <header className="flex items-center mb-6">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-3 shadow-sm animate-bounce-subtle">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800">User Information</h2>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <article className="result-card rounded-lg p-4 shadow-sm transition-all duration-300 bg-white">
                            <h3 className="block text-sm font-medium result-card-label mb-1 text-gray-500">Mobile Number</h3>
                            <p className="text-gray-800 font-medium result-card-value">{result['Mobile'] || '-'}</p>
                        </article>

                        <article className="result-card rounded-lg p-4 shadow-sm transition-all duration-300 bg-white">
                            <h3 className="block text-sm font-medium result-card-label mb-1 text-gray-500">Name</h3>
                            <p className="text-gray-800 font-medium result-card-value">{result['Name'] || '-'}</p>
                        </article>

                        <article className="result-card rounded-lg p-4 shadow-sm transition-all duration-300 bg-white">
                            <h3 className="block text-sm font-medium result-card-label mb-1 text-gray-500">Policy Status</h3>
                            <p className="text-gray-800 font-medium result-card-value">{result['Policy Status'] || '-'}</p>
                        </article>

                        <article className="result-card rounded-lg p-4 shadow-sm transition-all duration-300 bg-white">
                            <h3 className="block text-sm font-medium result-card-label mb-1 text-gray-500">GHL Pipeline Stage</h3>
                            <p className="text-gray-800 font-medium result-card-value">{result['GHL Pipeline Stage'] || '-'}</p>
                        </article>
                    </div>

                    {/* Warnings */}
                    {warnings.dq && (
                        <aside className="mt-6 p-6 rounded-lg bg-red-50 border-2 border-red-500 shadow-lg">
                            <div className="flex items-center text-red-700">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-lg font-semibold">The Transfer will not be excepted from this customer.its currently disqualified from our agency.</span>
                            </div>
                        </aside>
                    )}

                    {warnings.policy && (
                        <aside className="mt-6 p-6 rounded-lg bg-yellow-50 border-2 border-yellow-400 shadow-lg">
                            <div className="flex items-center text-yellow-700">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span className="text-lg font-semibold">
                                    Customer has current existing policies with us. They must be notified that this is additional coverage, not a new or first policy.
                                </span>
                            </div>
                        </aside>
                    )}

                    {warnings.existing && (
                        <aside className="mt-6 p-6 rounded-lg bg-green-50 border border-green-200 shadow-lg">
                            <div className="flex items-center text-green-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-lg font-semibold">An existing customer in our database but it’s not a current customer and has approved for transfer for sale</span>
                            </div>
                        </aside>
                    )}
                </section>
            )}
        </article>
      </main>

      <footer className="mt-auto bg-gradient-to-r from-gray-900 to-gray-800 text-white py-6 relative overflow-hidden">
        <div className="relative z-10">
            <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-center text-gray-400 hover:text-white transition-colors duration-300">&copy; 2025 UNLIMITED INSURNACE. All rights reserved.</p>
            </div>
        </div>
      </footer>
    </div>
  );
}
