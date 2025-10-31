import React, { useState } from 'react';
import { Course, User, NotificationType, Toast, AllUserProgress, ExternalResource, CourseCategory, UserRole } from '../types';
import UserManagement from './UserManagement';
import { BookOpenIcon, UsersIcon, ChartBarIcon, DocumentTextIcon, BellIcon, BookOpenIcon as LibraryIcon, TagIcon, TrophyIcon, Bars3Icon, XMarkIcon } from './icons';
import CourseManagement from './admin/CourseManagement';
import AdminAnalytics from './admin/AdminAnalytics';
import AdminReports from './admin/AdminReports';
import AdminNotifications from './admin/AdminNotifications';
import ResourceManagement from './admin/ResourceManagement';
import CategoryManagement from './admin/CategoryManagement';
import Leaderboard from './Leaderboard';

interface AdminDashboardProps {
  courses: Course[];
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  createNotification: (userId: string, type: NotificationType, message: string) => void;
  addToast: (message: string, type: Toast['type']) => void;
  allUserProgress: AllUserProgress;
  externalResources: ExternalResource[];
  setExternalResources: React.Dispatch<React.SetStateAction<ExternalResource[]>>;
  courseCategories: CourseCategory[];
  setCourseCategories: React.Dispatch<React.SetStateAction<CourseCategory[]>>;
}

type AdminTab = 'courses' | 'users' | 'analytics' | 'reports' | 'notifications' | 'resources' | 'categories' | 'leaderboard';

const AdminDashboard: React.FC<AdminDashboardProps> = (props) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('courses');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleTabClick = (tab: AdminTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  }

  const TabButton: React.FC<{tab: AdminTab, label: string, icon: React.ReactNode, isMobile?: boolean}> = ({tab, label, icon, isMobile = false}) => {
    const baseClasses = "flex items-center space-x-3 text-sm font-semibold transition";
    const activeClasses = "border-zamzam-teal-600 text-zamzam-teal-600";
    const inactiveClasses = "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50";
    const mobileClasses = "p-4 w-full rounded-lg";
    const desktopClasses = "flex-shrink-0 px-4 py-3 border-b-2";

    return (
        <button
            onClick={() => handleTabClick(tab)}
            className={`${baseClasses} ${activeTab === tab ? activeClasses : inactiveClasses} ${isMobile ? mobileClasses : desktopClasses}`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
  };
  
  const TABS_CONFIG = [
    { id: 'courses', label: 'Courses', icon: <BookOpenIcon className="h-5 w-5"/> },
    { id: 'users', label: 'Users', icon: <UsersIcon className="h-5 w-5"/> },
    { id: 'categories', label: 'Categories', icon: <TagIcon className="h-5 w-5"/> },
    { id: 'resources', label: 'Resources', icon: <LibraryIcon className="h-5 w-5"/> },
    { id: 'leaderboard', label: 'Leaderboard', icon: <TrophyIcon className="h-5 w-5"/> },
    { id: 'analytics', label: 'Analytics', icon: <ChartBarIcon className="h-5 w-5"/> },
    { id: 'reports', label: 'Reports', icon: <DocumentTextIcon className="h-5 w-5"/> },
    { id: 'notifications', label: 'Notifications', icon: <BellIcon className="h-5 w-5"/> },
  ] as const;


  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement {...props} />;
      case 'categories':
        return <CategoryManagement 
                    courseCategories={props.courseCategories} 
                    setCourseCategories={props.setCourseCategories} 
                    courses={props.courses}
                    setCourses={props.setCourses}
                    addToast={props.addToast}
                />;
      case 'analytics':
        return <AdminAnalytics {...props} />;
      case 'reports':
        return <AdminReports {...props} />;
      case 'notifications':
        return <AdminNotifications {...props} />;
      case 'resources':
        return <ResourceManagement {...props} />;
      case 'leaderboard':
        return <Leaderboard users={props.users.filter(u => u.role === UserRole.EMPLOYEE)} />;
      case 'courses':
      default:
        return <CourseManagement {...props} />;
    }
  };

  return (
    <div>
        {/* Navigation Header */}
        <div className="bg-white rounded-t-xl shadow sticky top-20 z-20">
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-2 px-6" aria-label="Tabs">
                {TABS_CONFIG.map(tab => (
                    <TabButton key={tab.id} tab={tab.id} label={tab.label} icon={tab.icon} />
                ))}
            </nav>
            {/* Mobile Navigation */}
            <div className="md:hidden flex justify-between items-center p-4">
                 <div>
                    <h2 className="text-lg font-bold text-slate-800">Admin Menu</h2>
                    <p className="text-sm text-slate-500 capitalize">{activeTab}</p>
                 </div>
                 <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 rounded-md hover:bg-slate-100">
                    <Bars3Icon className="h-6 w-6 text-slate-600"/>
                 </button>
            </div>
        </div>

        {/* Mobile Menu Drawer */}
         <div className={`fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMobileMenuOpen(false)}></div>
         <div className={`fixed top-0 right-0 h-full w-4/5 max-w-sm bg-white z-50 transform transition-transform duration-300 ease-in-out md:hidden ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex justify-between items-center p-4 border-b">
                <h3 className="font-bold text-slate-800">Dashboard Menu</h3>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2">
                    <XMarkIcon className="h-6 w-6 text-slate-500" />
                </button>
            </div>
            <nav className="p-4 space-y-2">
                {TABS_CONFIG.map(tab => (
                    <TabButton key={tab.id} tab={tab.id} label={tab.label} icon={tab.icon} isMobile />
                ))}
            </nav>
         </div>
      
      <div className="mt-8">
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;