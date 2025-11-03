
import React, { useState } from 'react';
import { BookOpenIcon, UserCircleIcon, LockClosedIcon } from './icons';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<void>;
  setPage: (page: 'home' | 'login' | 'register' | 'forgotPassword') => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, setPage }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onLogin(email, password);
      // On success, the main App component will handle navigation,
      // and this component will unmount. No need to reset state here.
    } catch (error) {
      // If onLogin throws an error, we catch it here and reset the loading state
      // so the user can try again.
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
        <div className="flex flex-col items-center mb-6">
            <div className="flex items-center space-x-3 mb-4">
                <BookOpenIcon className="h-10 w-10 text-zamzam-teal-600" />
                <h1 className="text-3xl font-bold text-zamzam-teal-700">
                    Zamzam E-Learning
                </h1>
            </div>
            <p className="text-slate-500">Sign in to continue your training</p>
        </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
            Email Address
          </label>
          <div className="relative">
             <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <UserCircleIcon className="h-5 w-5 text-slate-400" />
            </span>
            <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zamzam-teal-500 bg-white"
                placeholder="employee@zamzambank.com"
            />
          </div>
        </div>
        <div className="mb-2">
          <label htmlFor="password"className="block text-sm font-medium text-slate-700 mb-1">
            Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <LockClosedIcon className="h-5 w-5 text-slate-400" />
            </span>
            <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zamzam-teal-500 bg-white"
                placeholder="••••••••"
            />
          </div>
        </div>
        <div className="flex items-center justify-end mb-6">
            <button 
                type="button" 
                onClick={() => setPage('forgotPassword')} 
                className="text-sm font-semibold text-zamzam-teal-600 hover:text-zamzam-teal-700 transition"
            >
                Forgot Password?
            </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-zamzam-teal-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-zamzam-teal-700 transition duration-300 disabled:bg-slate-400"
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
       <p className="text-center text-sm text-slate-600 mt-6">
            Don't have an account?{' '}
            <button onClick={() => setPage('register')} className="font-semibold text-zamzam-teal-600 hover:text-zamzam-teal-700">
                Register here
            </button>
        </p>
    </div>
  );
};

export default Login;