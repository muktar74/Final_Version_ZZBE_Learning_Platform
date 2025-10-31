import React, { useState } from 'react';
import { BookOpenIcon, XMarkIcon } from './icons';

interface PublicHeaderProps {
  setPage: (page: 'home' | 'login' | 'register') => void;
}

const PublicHeader: React.FC<PublicHeaderProps> = ({ setPage }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavigate = (page: 'home' | 'login' | 'register') => {
    setPage(page);
    setIsMobileMenuOpen(false);
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div 
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => handleNavigate('home')}
            aria-label="Go to homepage"
          >
            <BookOpenIcon className="h-8 w-8 text-zamzam-teal-600" />
            <h1 className="text-xl md:text-2xl font-bold text-zamzam-teal-700">
              Zamzam Bank <span className="font-light hidden sm:inline">E-Learning</span>
            </h1>
          </div>
          <div className="hidden md:flex items-center space-x-4">
             <button
              onClick={() => handleNavigate('login')}
              className="text-sm font-semibold text-slate-700 hover:text-zamzam-teal-600 transition px-3 py-2 rounded-md"
            >
              Login
            </button>
            <button
              onClick={() => handleNavigate('register')}
              className="rounded-md bg-zamzam-teal-600 py-2 px-4 text-sm font-semibold text-white hover:bg-zamzam-teal-700 transition"
            >
              Register
            </button>
          </div>
          {/* Mobile Menu Button */}
          <div className="md:hidden">
              <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 rounded-md hover:bg-slate-100" aria-label="Open menu">
                  <svg className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
              </button>
          </div>
        </div>
      </div>
      {/* Mobile Menu */}
      <div className={`fixed inset-0 bg-white z-40 transform ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 ease-in-out md:hidden`}>
        <div className="flex justify-between items-center h-20 px-4 border-b">
             <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleNavigate('home')}>
                <BookOpenIcon className="h-8 w-8 text-zamzam-teal-600" />
                <h1 className="text-xl font-bold text-zamzam-teal-700">Zamzam E-Learning</h1>
             </div>
             <button onClick={() => setIsMobileMenuOpen(false)} className="p-2" aria-label="Close menu">
                <XMarkIcon className="h-7 w-7 text-slate-600" />
             </button>
        </div>
         <div className="p-6">
            <nav className="flex flex-col space-y-4">
                 <button
                  onClick={() => handleNavigate('login')}
                  className="text-left font-semibold text-slate-700 hover:bg-slate-100 p-3 rounded-md text-lg"
                >
                  Login
                </button>
                <button
                  onClick={() => handleNavigate('register')}
                  className="w-full rounded-md bg-zamzam-teal-600 py-3 px-4 text-lg font-semibold text-white hover:bg-zamzam-teal-700 transition"
                >
                  Register
                </button>
            </nav>
         </div>
      </div>
    </header>
  );
};

export default PublicHeader;