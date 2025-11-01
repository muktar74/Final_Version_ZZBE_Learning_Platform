import React from 'react';
import { Course, User, NotificationType, Toast, AllUserProgress, ExternalResource, CourseCategory, UserRole, AdminTab } from '../types';
import UserManagement from './UserManagement';
import CourseManagement from './admin/CourseManagement';
import AdminAnalytics from './admin/AdminAnalytics';
import AdminReports from './admin/AdminReports';
import AdminNotifications from './admin/AdminNotifications';
import ResourceManagement from './admin/ResourceManagement';
import CategoryManagement from './admin/CategoryManagement';
import Leaderboard from './Leaderboard';

interface AdminDashboardProps {
  activeTab: AdminTab;
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


const AdminDashboard: React.FC<AdminDashboardProps> = (props) => {
  const { activeTab } = props;

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
      {renderContent()}
    </div>
  );
};

export default AdminDashboard;