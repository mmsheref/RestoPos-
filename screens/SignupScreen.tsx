
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUp, getFirebaseErrorMessage } from '../firebase';
import { StoreIcon } from '../constants';

const SignupScreen: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        setError('');
        setIsLoading(true);
        try {
            await signUp(email, password);
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
                 <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-3xl"></div>
                 <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-3xl"></div>
            </div>

            <div className="w-full max-w-md bg-surface rounded-2xl shadow-xl border border-border z-10 overflow-hidden">
                <div className="p-8 pb-6 text-center border-b border-border/50">
                     <div className="mx-auto h-12 w-12 bg-surface-muted rounded-xl flex items-center justify-center mb-4 text-text-secondary">
                        <StoreIcon className="h-6 w-6" />
                     </div>
                     <h1 className="text-2xl font-bold text-text-primary tracking-tight">Create Account</h1>
                     <p className="text-sm text-text-secondary mt-2">Get started with your free POS account</p>
                </div>

                <div className="p-8 pt-6 space-y-6">
                    <form onSubmit={handleSignup} className="space-y-4">
                        <div className="space-y-1">
                            <label htmlFor="email" className="block text-xs font-bold text-text-secondary uppercase tracking-wider ml-1">Email</label>
                            <input id="email" type="email" required placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-text-primary" />
                        </div>
                        <div className="space-y-1">
                            <label htmlFor="password" className="block text-xs font-bold text-text-secondary uppercase tracking-wider ml-1">Password</label>
                            <input id="password" type="password" required placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-text-primary" />
                        </div>
                        <div className="space-y-1">
                            <label htmlFor="confirm-password" className="block text-xs font-bold text-text-secondary uppercase tracking-wider ml-1">Confirm Password</label>
                            <input id="confirm-password" type="password" required placeholder="Repeat password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-text-primary" />
                        </div>
                        
                        {error && <p className="text-sm text-red-600 dark:text-red-400 text-center font-medium">{error}</p>}
                        
                        <button type="submit" disabled={isLoading} className="w-full px-6 py-3.5 text-base font-bold text-primary-content bg-primary rounded-xl hover:bg-primary-hover focus:outline-none focus:ring-4 focus:ring-primary/20 shadow-lg shadow-primary/30 transition-all active:scale-[0.98] disabled:opacity-70 mt-2">
                           {isLoading ? 'Creating account...' : 'Sign Up'}
                        </button>
                    </form>
                    <div className="text-center pt-2">
                        <p className="text-sm text-text-secondary">
                            Already have an account?{' '}
                            <Link to="/login" className="font-semibold text-primary hover:text-primary-hover hover:underline">Login</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignupScreen;
