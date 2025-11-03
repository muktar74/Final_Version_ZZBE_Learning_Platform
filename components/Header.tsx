import React, { useState, useRef, useEffect } from 'react';
import { User, Notification, UserRole, AdminTab } from '../types';
import { BookOpenIcon, UserCircleIcon, LogoutIcon, BellIcon, XMarkIcon, UsersIcon, ChartBarIcon, DocumentTextIcon, TagIcon, TrophyIcon, Bars3Icon } from './icons';

interface HeaderProps {
  user: User;
  notifications: Notification[];
  onMarkNotificationsRead: () => void;
  onLogout: () => void;
  onNavigate: (view: 'dashboard' | 'admin' | 'leaderboard' | 'resources' | 'courses' | 'profile' | 'certificates') => void;
  activeAdminTab: AdminTab;
  onNavigateAdminTab: (tab: AdminTab) => void;
}

const ADMIN_TABS_CONFIG = [
    { id: 'courses', label: 'Courses', icon: <BookOpenIcon className="h-5 w-5"/> },
    { id: 'users', label: 'Users', icon: <UsersIcon className="h-5 w-5"/> },
    { id: 'categories', label: 'Categories', icon: <TagIcon className="h-5 w-5"/> },
    { id: 'resources', label: 'Resources', icon: <BookOpenIcon className="h-5 w-5"/> },
    { id: 'leaderboard', label: 'Leaderboard', icon: <TrophyIcon className="h-5 w-5"/> },
    { id: 'analytics', label: 'Analytics', icon: <ChartBarIcon className="h-5 w-5"/> },
    { id: 'reports', label: 'Reports', icon: <DocumentTextIcon className="h-5 w-5"/> },
    { id: 'notifications', label: 'Notifications', icon: <BellIcon className="h-5 w-5"/> },
] as const;


const Header: React.FC<HeaderProps> = ({ user, notifications, onMarkNotificationsRead, onLogout, onNavigate, activeAdminTab, onNavigateAdminTab }) => {
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
    // The call to onMarkNotificationsRead is now handled by a dedicated button inside the dropdown.
  };

  const handleUserMenuClick = () => {
    setShowUserMenu(prev => !prev);
    if (showNotifications) setShowNotifications(false);
  };

  const handleAdminNav = (tab: AdminTab) => {
    onNavigate('admin');
    onNavigateAdminTab(tab);
    setIsMobileMenuOpen(false);
  }
  
  const handleEmployeeNav = (view: 'dashboard' | 'courses' | 'leaderboard' | 'resources' | 'certificates') => {
      onNavigate(view);
      setIsMobileMenuOpen(false);
  }

  const handleProfileNav = () => {
      onNavigate('profile');
      setIsMobileMenuOpen(false);
      closeAllDropdowns();
  }

  const getRoleSpecificView = () => {
    return user.role === 'Admin' ? 'admin' : 'dashboard';
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div 
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => onNavigate(getRoleSpecificView())}
            aria-label="Go to homepage"
          >
            <BookOpenIcon className="h-8 w-8 text-zamzam-teal-600" />
            <h1 className="text-xl md:text-2xl font-bold text-zamzam-teal-700">
              Zamzam Bank <span className="font-light hidden sm:inline">E-Learning</span>
            </h1>
          </div>
          <nav className="hidden lg:flex items-center space-x-1">
            {user.role === UserRole.ADMIN ? (
                 ADMIN_TABS_CONFIG.map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => handleAdminNav(tab.id)}
                        className={`text-sm font-semibold transition px-3 py-2 rounded-md flex items-center space-x-2 ${
                            activeAdminTab === tab.id ? 'bg-zamzam-teal-50 text-zamzam-teal-700' : 'text-slate-600 hover:text-zamzam-teal-600'
                        }`}
                    >
                      {React.cloneElement(tab.icon, { className: 'h-5 w-5' })}
                      <span>{tab.label}</span>
                    </button>
                 ))
            ) : (
              <>
                <button onClick={() => handleEmployeeNav('dashboard')} className="text-sm font-semibold text-slate-600 hover:text-zamzam-teal-600 transition px-3 py-2 rounded-md">Dashboard</button>
                <button onClick={() => handleEmployeeNav('courses')} className="text-sm font-semibold text-slate-600 hover:text-zamzam-teal-600 transition px-3 py-2 rounded-md">Courses</button>
                <button onClick={() => handleEmployeeNav('certificates')} className="text-sm font-semibold text-slate-600 hover:text-zamzam-teal-600 transition px-3 py-2 rounded-md">My Certificates</button>
                <button onClick={() => handleEmployeeNav('leaderboard')} className="text-sm font-semibold text-slate-600 hover:text-zamzam-teal-600 transition px-3 py-2 rounded-md">Leaderboard</button>
                <button onClick={() => handleEmployeeNav('resources')} className="text-sm font-semibold text-slate-600 hover:text-zamzam-teal-600 transition px-3 py-2 rounded-md">Resource Library</button>
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
                        <div className="p-3 border-b flex justify-between items-center">
                            <h3 className="font-semibold text-slate-800">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={onMarkNotificationsRead}
                                    className="text-xs font-semibold text-zamzam-teal-600 hover:text-zamzam-teal-800 transition focus:outline-none"
                                >
                                    Mark all as read
                                </button>
                            )}
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
                                <button onClick={handleProfileNav} className="w-full text-left flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
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
                    <Bars3Icon className="h-6 w-6 text-slate-600"/>
                </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`fixed inset-0 bg-white z-40 transform ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 ease-in-out lg:hidden`}>
        <div className="flex justify-between items-center h-20 px-4 border-b">
             <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate(getRoleSpecificView())}>
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
                {user.role === UserRole.ADMIN ? (
                    ADMIN_TABS_CONFIG.map(tab => (
                        <button key={tab.id} onClick={() => handleAdminNav(tab.id)} className={`text-left font-semibold hover:bg-slate-100 p-3 rounded-md flex items-center space-x-3 ${activeAdminTab === tab.id ? 'text-zamzam-teal-700 bg-zamzam-teal-50' : 'text-slate-700'}`}>
                           {React.cloneElement(tab.icon, { className: 'h-6 w-6' })}
                           <span>{tab.label}</span>
                        </button>
                    ))
                ) : (
                  <>
                    <button onClick={() => handleEmployeeNav('dashboard')} className="text-left font-semibold text-slate-700 hover:bg-slate-100 p-3 rounded-md">Dashboard</button>
                    <button onClick={() => handleEmployeeNav('courses')} className="text-left font-semibold text-slate-700 hover:bg-slate-100 p-3 rounded-md">Courses</button>
                    <button onClick={() => handleEmployeeNav('certificates')} className="text-left font-semibold text-slate-700 hover:bg-slate-100 p-3 rounded-md">My Certificates</button>
                    <button onClick={() => handleEmployeeNav('leaderboard')} className="text-left font-semibold text-slate-700 hover:bg-slate-100 p-3 rounded-md">Leaderboard</button>
                    <button onClick={() => handleEmployeeNav('resources')} className="text-left font-semibold text-slate-700 hover:bg-slate-100 p-3 rounded-md">Resource Library</button>
                  </>
                )}
                <button onClick={handleProfileNav} className="text-left font-semibold text-slate-700 hover:bg-slate-100 p-3 rounded-md border-t pt-4 mt-2">Profile</button>
                <button onClick={onLogout} className="text-left font-semibold text-red-600 hover:bg-red-50 p-3 rounded-md">Logout</button>
            </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
