import { supabase } from '@/lib/supabase';

class AuthService {
    private sessionKey = 'unlimitedInsuranceAuth';
    private userKey = 'unlimitedInsuranceUser';
    private loginTimeKey = 'unlimitedInsuranceLoginTime';
    private sessionTimeout = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

    // Check if user is authenticated
    isAuthenticated(): boolean {
        if (typeof window === 'undefined') return false;
        
        const authStatus = localStorage.getItem(this.sessionKey);
        const loginTime = localStorage.getItem(this.loginTimeKey);
        
        if (!authStatus || authStatus !== 'authenticated') {
            return false;
        }

        // Check session timeout
        if (loginTime) {
            const loginTimestamp = new Date(loginTime).getTime();
            const currentTime = new Date().getTime();
            
            if (currentTime - loginTimestamp > this.sessionTimeout) {
                // Session expired, clear storage
                this.logout();
                return false;
            }
        }

        return true;
    }

    // Get current user
    getCurrentUser(): string | null {
        if (this.isAuthenticated()) {
            return localStorage.getItem(this.userKey);
        }
        return null;
    }

    // Login user using Supabase authentication
    async login(username: string, password: string): Promise<boolean> {
        try {
            // Call the secure authentication function
            const { data, error } = await supabase
                .rpc('authenticate_user', {
                    input_username: username,
                    input_password: password
                });

            if (error) {
                console.error('Authentication error:', error);
                return false;
            }

            // Check if authentication was successful
            if (data && data.success) {
                if (typeof window !== 'undefined') {
                    // Store authentication data
                    localStorage.setItem(this.sessionKey, 'authenticated');
                    localStorage.setItem(this.userKey, data.user.username);
                    localStorage.setItem(this.loginTimeKey, new Date().toISOString());
                    
                    // Store additional user info (optional)
                    localStorage.setItem('unlimitedInsuranceUserRole', data.user.role);
                    localStorage.setItem('unlimitedInsuranceUserEmail', data.user.email || '');
                }
                return true;
            }

            return false;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    }

    // Logout user
    logout(): void {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(this.sessionKey);
            localStorage.removeItem(this.userKey);
            localStorage.removeItem(this.loginTimeKey);
            localStorage.removeItem('unlimitedInsuranceUserRole');
            localStorage.removeItem('unlimitedInsuranceUserEmail');
        }
    }

    // Get session info
    getSessionInfo() {
        if (!this.isAuthenticated()) {
            return null;
        }

        const loginTime = localStorage.getItem(this.loginTimeKey);
        const user = localStorage.getItem(this.userKey);
        const role = localStorage.getItem('unlimitedInsuranceUserRole');
        const email = localStorage.getItem('unlimitedInsuranceUserEmail');
        
        return {
            user: user,
            role: role,
            email: email,
            loginTime: loginTime,
            isAuthenticated: true,
            timeRemaining: this.getTimeRemaining()
        };
    }

    // Get remaining session time in minutes
    getTimeRemaining(): number {
        if (typeof window === 'undefined') return 0;
        
        const loginTime = localStorage.getItem(this.loginTimeKey);
        if (!loginTime) return 0;

        const loginTimestamp = new Date(loginTime).getTime();
        const currentTime = new Date().getTime();
        const elapsed = currentTime - loginTimestamp;
        const remaining = Math.max(0, this.sessionTimeout - elapsed);
        
        return Math.floor(remaining / (60 * 1000)); // Return minutes
    }
}

export const authService = new AuthService();
