'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth';
import FloatingDots from '@/components/FloatingDots';
import FormParticles from '@/components/FormParticles';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Redirect if already logged in
    if (authService.isAuthenticated()) {
      router.push('/');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const success = await authService.login(username, password);
    
    if (success) {
      router.push('/');
    } else {
      setError('Invalid username or password');
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
            <nav className="flex justify-center items-center py-4">
                <figure className="flex items-center space-x-2 hover-scale">
                    <img src="https://msgsndr-private.storage.googleapis.com/companyPhotos/4f1160a0-676f-4984-b05b-6186ed7d27d4.png" alt="Logo" className="h-32 w-60 object-contain flex justify-center items-center transition-all duration-500 hover:filter hover:brightness-110" />
                </figure>
            </nav>
            
            <section className="mt-16 mb-20 text-center">
                <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight animate-float text-gradient">
                    Secure Access Portal
                </h1>
                <p className="text-lg md:text-xl text-primary-100 max-w-2xl mx-auto mb-8 animate-fade-in">
                    Please login to access the User Information Portal
                </p>
            </section>
        </div>
        

      </header>
      
      <main className="w-full max-w-md px-4 sm:px-6 lg:px-8 -mt-16 relative z-20 mb-16 mx-auto">
        <article className="glass-effect rounded-xl shadow-xl p-8 border border-gray-200 animate-fade-in form-container w-full mx-auto relative">
            <FormParticles />
            <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-primary-500 animate-bounce-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-gradient">Login</span>
                </h2>
                
                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="input-wrapper group">
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <input 
                                type="text" 
                                id="username" 
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 fancy-input"
                                placeholder="Enter your username"
                                required
                            />
                        </div>
                    </div>
                    
                    <div className="input-wrapper group">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                            </div>
                            <input 
                                type={showPassword ? "text" : "password"}
                                id="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 fancy-input"
                                placeholder="Enter your password"
                                required
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                <button 
                                    type="button" 
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full px-6 py-3 btn-gradient search-button text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-300 flex items-center justify-center shadow-md group disabled:opacity-70"
                    >
                        {loading ? (
                            <div className="inline-block h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></div>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 search-button-icon transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                                <polyline points="10,17 15,12 10,7"/>
                                <line x1="15" y1="12" x2="3" y2="12"/>
                            </svg>
                        )}
                        <span className="relative z-10">{loading ? 'Authenticating...' : 'Login'}</span>
                    </button>
                </form>
            </section>

            {error && (
                <section className="p-4 rounded-lg animate-slide-up error-message transition-all duration-300 bg-red-50 border border-red-200">
                    <div className="flex items-start">
                        <div className="flex-shrink-0 bg-red-100 rounded-full p-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="15" y1="9" x2="9" y2="15"/>
                                <line x1="9" y1="9" x2="15" y2="15"/>
                            </svg>
                        </div>
                        <p className="ml-3 text-red-600">{error}</p>
                    </div>
                </section>
            )}
            
        </article>
      </main>

      <footer className="mt-auto bg-gradient-to-r from-gray-900 to-gray-800 text-white py-6 relative overflow-hidden">
        <div className="relative z-10">
            <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-center text-gray-400 hover:text-white transition-colors duration-300">&copy; 2025 UNLIMITED INSURANCE. All rights reserved.</p>
            </div>
        </div>
      </footer>
    </div>
  );
}
