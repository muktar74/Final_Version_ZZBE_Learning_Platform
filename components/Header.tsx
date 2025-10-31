import React, { useState, useRef, useEffect } from 'react';
import { User, Notification } from '../types';
import { BookOpenIcon, UserCircleIcon, LogoutIcon, BellIcon, XMarkIcon, TrophyIcon, UsersIcon } from './icons';

interface HeaderProps {
  user: User;
  notifications: Notification[];
  onMarkNotificationsRead: () => void;
  onLogout: () => void;
  onNavigate: (view: 'dashboard' | 'admin' | 'leaderboard' | 'resources' | 'courses' | 'profile') => void;
}

const Header: React.FC<HeaderProps> = ({ user, notifications, onMarkNotificationsRead, onLogout, onNavigate }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const closeAllDropdowns = () => {
    setShowNotifications(false);
    setShowUserMenu(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBellClick = () => {
    setShowNotifications(prev => !prev);
    if (showUserMenu) setShowUserMenu(false);
    if (!showNotifications && unreadCount > 0) {
        onMarkNotificationsRead();
    }
  };

  const handleUserMenuClick = () => {
    setShowUserMenu(prev => !prev);
    if (showNotifications) setShowNotifications(false);
  };

  const handleNavigate = (view: 'dashboard' | 'admin' | 'leaderboard' | 'resources' | 'courses' | 'profile') => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
    closeAllDropdowns();
  };

  const getRoleSpecificView = () => {
    return user.role === 'Admin' ? 'admin' : 'dashboard';
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div 
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => handleNavigate(getRoleSpecificView())}
            aria-label="Go to homepage"
          >
            <BookOpenIcon className="h-8 w-8 text-zamzam-teal-600" />
            <h1 className="text-xl md:text-2xl font-bold text-zamzam-teal-700">
              Zamzam Bank <span className="font-light hidden sm:inline">E-Learning</span>
            </h1>
          </div>
          <nav className="hidden lg:flex items-center space-x-4">
            {user.role === 'Employee' && (
              <>
                <button onClick={() => handleNavigate('dashboard')} className="text-sm font-semibold text-slate-600 hover:text-zamzam-teal-600 transition px-3 py-2 rounded-md">Dashboard</button>
                <button onClick={() => handleNavigate('courses')} className="text-sm font-semibold text-slate-600 hover:text-zamzam-teal-600 transition px-3 py-2 rounded-md">Courses</button>
                <button onClick={() => handleNavigate('leaderboard')} className="text-sm font-semibold text-slate-600 hover:text-zamzam-teal-600 transition px-3 py-2 rounded-md">Leaderboard</button>
                <button onClick={() => handleNavigate('resources')} className="text-sm font-semibold text-slate-600 hover:text-zamzam-teal-600 transition px-3 py-2 rounded-md">Resource Library</button>
              </>
            )}
          </nav>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="relative" ref={notificationRef}>
                <button onClick={handleBellClick} className="relative p-2 rounded-full hover:bg-slate-100" aria-label={`Notifications (${unreadCount} unread)`}>
                    <BellIcon className="h-6 w-6 text-slate-500" />
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                            {unreadCount}
                        </span>
                    )}
                </button>
                {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden">
                        <div className="p-3 border-b">
                            <h3 className="font-semibold text-slate-800">Notifications</h3>
                        </div>
                        <ul className="max-h-96 overflow-y-auto">
                            {notifications.length > 0 ? notifications.map(notif => (
                                <li key={notif.id} className={`border-b p-3 ${notif.read ? 'opacity-70' : ''} hover:bg-slate-50`}>
                                    <p className={`text-sm text-slate-700 ${!notif.read ? 'font-semibold' : ''}`}>{notif.message}</p>
                                    <p className="text-xs text-slate-400 mt-1 font-normal">{new Date(notif.timestamp).toLocaleString()}</p>
                                </li>
                            )) : (
                                <li className="p-4 text-center text-sm text-slate-500">No new notifications.</li>
                            )}
                        </ul>
                    </div>
                )}
            </div>
            
            <div className="relative hidden lg:block" ref={userMenuRef}>
                <button onClick={handleUserMenuClick} className="flex items-center space-x-2 p-1 rounded-full hover:bg-slate-100" aria-haspopup="true" aria-expanded={showUserMenu}>
                    {user.profileImageUrl ? (
                        <img src={user.profileImageUrl} alt="Profile" className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                        <UserCircleIcon className="h-9 w-9 text-slate-500" />
                    )}
                    <div className="text-right hidden sm:block">
                        <p className="font-semibold text-slate-700 text-sm">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.role}</p>
                    </div>
                </button>
                {showUserMenu && (
                     <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden">
                        <ul>
                            <li>
                                <button onClick={() => handleNavigate('profile')} className="w-full text-left flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                                    <UserCircleIcon className="h-5 w-5 text-slate-500" />
                                    <span>View Profile</span>
                                </button>
                            </li>
                             <li>
                                <button onClick={onLogout} className="w-full text-left flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                                    <LogoutIcon className="h-5 w-5 text-slate-500" />
                                    <span>Logout</span>
                                </button>
                            </li>
                        </ul>
                     </div>
                )}
            </div>
            
            {/* Mobile Menu Button */}
            <div className="lg:hidden">
                <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 rounded-md hover:bg-slate-100" aria-label="Open menu">
                    <svg className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`fixed inset-0 bg-white z-40 transform ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 ease-in-out lg:hidden`}>
        <div className="flex justify-between items-center h-20 px-4 border-b">
             <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleNavigate(getRoleSpecificView())}>
                <BookOpenIcon className="h-8 w-8 text-zamzam-teal-600" />
                <h1 className="text-xl font-bold text-zamzam-teal-700">Zamzam E-Learning</h1>
             </div>
             <button onClick={() => setIsMobileMenuOpen(false)} className="p-2" aria-label="Close menu">
                <XMarkIcon className="h-7 w-7 text-slate-600" />
             </button>
        </div>
        <div className="p-4">
            <div className="flex items-center space-x-4 p-4 border-b">
                 {user.profileImageUrl ? (
                    <img src={user.profileImageUrl} alt="Profile" className="h-12 w-12 rounded-full object-cover" />
                ) : (
                    <UserCircleIcon className="h-12 w-12 text-slate-400" />
                )}
                <div>
                    <p className="font-bold text-slate-800">{user.name}</p>
                    <p className="text-sm text-slate-500">{user.role}</p>
                </div>
            </div>
            <nav className="mt-4 flex flex-col space-y-2">
                {user.role === 'Employee' && (
                  <>
                    <button onClick={() => handleNavigate('dashboard')} className="text-left font-semibold text-slate-700 hover:bg-slate-100 p-3 rounded-md">Dashboard</button>
                    <button onClick={() => handleNavigate('courses')} className="text-left font-semibold text-slate-700 hover:bg-slate-100 p-3 rounded-md">Courses</button>
                    <button onClick={() => handleNavigate('leaderboard')} className="text-left font-semibold text-slate-700 hover:bg-slate-100 p-3 rounded-md">Leaderboard</button>
                    <button onClick={() => handleNavigate('resources')} className="text-left font-semibold text-slate-700 hover:bg-slate-100 p-3 rounded-md">Resource Library</button>
                  </>
                )}
                <button onClick={() => handleNavigate('profile')} className="text-left font-semibold text-slate-700 hover:bg-slate-100 p-3 rounded-md border-t pt-4 mt-2">Profile</button>
                <button onClick={onLogout} className="text-left font-semibold text-red-600 hover:bg-red-50 p-3 rounded-md">Logout</button>
            </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;