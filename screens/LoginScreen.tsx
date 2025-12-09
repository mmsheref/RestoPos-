
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signIn, getFirebaseErrorMessage } from '../firebase';
import { StoreIcon } from '../constants';

const LoginScreen: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await signIn(email, password);
            // The onAuthStateChanged listener in AppContext will handle navigation
        } catch (err) {
            setError(getFirebaseErrorMessage(err));
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-surface-muted relative overflow-hidden px-4">
            {/* Background Decoration */}
            <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
                 <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-3xl"></div>
                 <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-3xl"></div>
            </div>

            <div className="w-full max-w-md bg-surface rounded-2xl shadow-xl border border-border z-10 overflow-hidden">
                <div className="p-8 pb-6 text-center border-b border-border/50">
                     <div className="mx-auto h-14 w-14 bg-primary rounded-xl shadow-lg flex items-center justify-center mb-5 transform rotate-3">
                        <StoreIcon className="h-8 w-8 text-primary-content" />
                     </div>
                     <h1 className="text-2xl font-bold text-text-primary tracking-tight">Welcome Back</h1>
                     <p className="text-sm text-text-secondary mt-2">Sign in to access your Point of Sale</p>
                </div>

                <div className="p-8 pt-6 space-y-6">
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-1">
                            <label htmlFor="email" className="block text-xs font-bold text-text-secondary uppercase tracking-wider ml-1">Email Address</label>
                            <input 
                                id="email" 
                                type="email" 
                                required 
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-text-primary placeholder:text-text-muted/50" 
                            />
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between items-center ml-1">
                                <label htmlFor="password" className="block text-xs font-bold text-text-secondary uppercase tracking-wider">Password</label>
                            </div>
                            <input 
                                id="password" 
                                type="password" 
                                required 
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-text-primary placeholder:text-text-muted/50" 
                            />
                        </div>
                        
                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm text-center font-medium animate-fadeIn">
                                {error}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full px-6 py-3.5 text-base font-bold text-primary-content bg-primary rounded-xl hover:bg-primary-hover focus:outline-none focus:ring-4 focus:ring-primary/20 shadow-lg shadow-primary/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"/>
                                    Logging in...
                                </span>
                            ) : 'Sign In'}
                        </button>
                    </form>
                    
                    <div className="text-center pt-2">
                        <p className="text-sm text-text-secondary">
                            New to the platform?{' '}
                            <Link to="/signup" className="font-semibold text-primary hover:text-primary-hover hover:underline transition-colors">
                                Create an account
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
