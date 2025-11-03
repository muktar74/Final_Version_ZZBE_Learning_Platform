import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { BookOpenIcon } from './icons';

interface ForgotPasswordProps {
  setPage: (page: 'login' | 'register' | 'forgotPassword') => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ setPage }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin, // Send user back to the app's root to handle the update
    });

    setIsLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setIsSubmitted(true);
    }
  };

  return (
    <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
        <div className="flex flex-col items-center mb-6">
            <div className="flex items-center space-x-3 mb-4">
                <BookOpenIcon className="h-10 w-10 text-zamzam-teal-600" />
                <h1 className="text-3xl font-bold text-zamzam-teal-700">
                    Forgot Password
                </h1>
            </div>
            <p className="text-slate-500 text-center">Enter your email to receive a password reset link.</p>
        </div>

      {isSubmitted ? (
        <div className="text-center">
            <p className="text-green-700 bg-green-50 p-4 rounded-lg">A password reset link has been sent to your email. Please check your inbox.</p>
            <button onClick={() => setPage('login')} className="font-semibold text-zamzam-teal-600 hover:text-zamzam-teal-700 mt-4">
                &larr; Back to Login
            </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
            <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                    Email Address
                </label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zamzam-teal-500 bg-white"
                    placeholder="employee@zamzambank.com"
                />
            </div>

            {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-zamzam-teal-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-zamzam-teal-700 transition duration-300 disabled:bg-slate-400"
            >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
        </form>
      )}
       <p className="text-center text-sm text-slate-600 mt-6">
            Remember your password?{' '}
            <button onClick={() => setPage('login')} className="font-semibold text-zamzam-teal-600 hover:text-zamzam-teal-700">
                Login here
            </button>
        </p>
    </div>
  );
};

export default ForgotPassword;
