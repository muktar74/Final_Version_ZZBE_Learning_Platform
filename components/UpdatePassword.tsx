import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { BookOpenIcon } from './icons';
import type { Toast } from '../types';

interface UpdatePasswordProps {
  addToast: (message: string, type: Toast['type']) => void;
  setPage: (page: 'login') => void;
}

const UpdatePassword: React.FC<UpdatePasswordProps> = ({ addToast, setPage }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      addToast('Passwords do not match.', 'error');
      return;
    }
    if (password.length < 6) {
        addToast('Password must be at least 6 characters long.', 'error');
        return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsLoading(false);

    if (error) {
      addToast(`Error updating password: ${error.message}`, 'error');
    } else {
      addToast('Password updated successfully! You can now log in.', 'success');
      setPage('login');
    }
  };

  return (
    <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
        <div className="flex flex-col items-center mb-6">
            <div className="flex items-center space-x-3 mb-4">
                <BookOpenIcon className="h-10 w-10 text-zamzam-teal-600" />
                <h1 className="text-3xl font-bold text-zamzam-teal-700">
                    Reset Your Password
                </h1>
            </div>
            <p className="text-slate-500 text-center">Enter and confirm your new password below.</p>
        </div>

        <form onSubmit={handleSubmit}>
            <div className="mb-4">
                <label htmlFor="password"className="block text-sm font-medium text-slate-700 mb-1">
                    New Password
                </label>
                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zamzam-teal-500 bg-white"
                    placeholder="••••••••"
                />
            </div>
            <div className="mb-6">
                <label htmlFor="confirmPassword"className="block text-sm font-medium text-slate-700 mb-1">
                    Confirm New Password
                </label>
                <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zamzam-teal-500 bg-white"
                    placeholder="••••••••"
                />
            </div>
            
            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-zamzam-teal-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-zamzam-teal-700 transition duration-300 disabled:bg-slate-400"
            >
                {isLoading ? 'Updating...' : 'Update Password'}
            </button>
        </form>
    </div>
  );
};

export default UpdatePassword;
