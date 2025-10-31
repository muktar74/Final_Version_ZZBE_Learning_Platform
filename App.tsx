import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { User, Course, UserRole, UserProgress, CertificateData, Notification, NotificationType, AiMessage, Review, Toast as ToastType, AllUserProgress, ExternalResource, CourseCategory } from './types';
import { BADGE_DEFINITIONS } from './constants';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import CourseView from './components/CourseView';
import CertificateView from './components/CertificateView';
import AdminDashboard from './components/AdminDashboard';
import Footer from './components/Footer';
import Login from './components/Login';
import HomePage from './components/HomePage';
import Register from './components/Register';
import PublicHeader from './components/PublicHeader';
import AiAssistant from './components/AiAssistant';
import Leaderboard from './components/Leaderboard';
import ResourceLibrary from './components/ResourceLibrary';
import ErrorBoundary from './components/ErrorBoundary';
import Toast from './components/Toast';
import UserProfile from './components/UserProfile';
import Spinner from './components/Spinner';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
import type { Session, RealtimeChannel } from '@supabase/supabase-js';


type View = 'dashboard' | 'course' | 'certificate' | 'admin' | 'leaderboard' | 'resources' | 'courses' | 'profile';
type Page = 'home' | 'login' | 'register' | 'app';

const App: React.FC = () => {
  // Add configuration check at the very top.
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4 font-sans">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-lg mx-auto">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Application Configuration Error</h1>
          <p className="text-slate-600">
            The connection to the backend service is not configured. The application cannot start.
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Please contact an administrator to ensure the `SUPABASE_URL` and `SUPABASE_ANON_KEY` environment variables are set correctly.
          </p>
        </div>
      </div>
    );
  }

  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseCategories, setCourseCategories] = useState<CourseCategory[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [allUserProgress, setAllUserProgress] = useState<AllUserProgress>({});
  const [externalResources, setExternalResources] = useState<ExternalResource[]>([]);

  const [aiChatHistory, setAiChatHistory] = useState<AiMessage[]>([]);
  const [toasts, setToasts] = useState<ToastType[]>([]);

  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null);
  
  const addToast = useCallback((message: string, type: ToastType['type']) => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const fetchAppData = useCallback(async (user: User) => {
    try {
        const isAdmin = user.role === UserRole.ADMIN;

        // Common fetches for both roles
        const fetchCourses = supabase.from('courses').select('*, reviews(*)').order('created_at', { ascending: false });
        const fetchResources = supabase.from('external_resources').select('*').order('created_at', { ascending: false });
        const fetchCategories = supabase.from('course_categories').select('*').order('name', { ascending: true });
        const fetchNotifications = supabase.from('notifications').select('*').eq('user_id', user.id).order('timestamp', { ascending: false });

        // Role-specific fetches
        // Admin gets all data. Employees get all users for the leaderboard, but only their own progress.
        const fetchUsers = supabase.from('users').select('*');
        const fetchProgress = isAdmin
            ? supabase.from('user_progress').select('*') // Admin gets all progress
            : supabase.from('user_progress').select('*').eq('user_id', user.id); // Employee gets only their own progress

        const [
            { data: coursesData, error: coursesError },
            { data: resourcesData, error: resourcesError },
            { data: categoriesData, error: categoriesError },
            { data: notificationsData, error: notificationsError },
            { data: usersData, error: usersError },
            { data: progressData, error: progressError }
        ] = await Promise.all([fetchCourses, fetchResources, fetchCategories, fetchNotifications, fetchUsers, fetchProgress]);


        if (usersError) throw usersError;
        if (coursesError) throw coursesError;
        if (progressError) throw progressError;
        if (resourcesError) throw resourcesError;
        if (notificationsError) throw notificationsError;
        if (categoriesError) throw categoriesError;
        
        // Transform progress data into the nested object structure the app uses
        const progressObject = (progressData || []).reduce((acc: AllUserProgress, prog) => {
            if (!acc[prog.user_id]) acc[prog.user_id] = {};
            acc[prog.user_id][prog.course_id] = {
                completedModules: prog.completed_modules || [],
                quizScore: prog.quiz_score,
                rating: prog.rating,
                recentlyViewed: prog.recently_viewed,
                completionDate: prog.completion_date,
            };
            return acc;
        }, {});

        setUsers(usersData || []);
        setCourses((coursesData as Course[]) || []);
        // For employees, this will only contain their own progress, which is what the dashboard needs.
        // For admins, it will contain everyone's progress.
        setAllUserProgress(progressObject);
        setExternalResources(resourcesData || []);
        setNotifications(notificationsData || []);
        setCourseCategories(categoriesData || []);
        
    } catch (error: any) {
        const message = (error && typeof error === 'object' && typeof error.message === 'string')
            ? error.message
            : 'An unknown error occurred. Check the console for details.';
        
        addToast(`Error loading data: ${message}`, 'error');
        console.error("Error fetching app data:", error);
    }
  }, [addToast]);
  
  // Handle auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        setSession(session);
        if (session?.user) {
          // Fetch the user profile using the secure RPC call.
          // This is more robust against RLS race conditions than a direct select.
          const { data: profile, error } = await supabase
              .rpc('get_user_profile')
              .single();
          
          if (error || !profile) {
              console.error('Error fetching user profile via RPC:', error?.message || 'Profile not found.');
              addToast('Could not load your profile. Please try logging in again.', 'error');
              await supabase.auth.signOut();
              return;
          }

          // Admins should always be allowed in, regardless of 'approved' status.
          if (!profile.approved && profile.role !== UserRole.ADMIN) {
              // This case should ideally be caught by handleLogin on a fresh sign-in,
              // but it's a good safeguard for session restoration if approval status changes.
              addToast('Your account is pending approval.', 'error');
              await supabase.auth.signOut();
          } else {
              const sanitizedProfile = {
                ...profile,
                badges: profile.badges || [], // Ensure badges is always an array
              };
              setCurrentUser(sanitizedProfile as User);
              setCurrentPage('app');
              setCurrentView(sanitizedProfile.role === UserRole.ADMIN ? 'admin' : 'dashboard');
              await fetchAppData(sanitizedProfile as User);
          }
        } else {
          // This block now serves as a safety net for non-manual sign-outs (e.g., token expiration).
          // Manual sign-out cleanup is handled directly in `handleLogout`.
          setCurrentUser(null);
          setCurrentPage('home');
        }
      } catch (e) {
          console.error("Error in onAuthStateChange listener:", e);
          addToast("An unexpected authentication error occurred. Please try again.", "error");
          await supabase.auth.signOut();
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, [addToast, fetchAppData]);
  
   // Realtime notifications subscription
   useEffect(() => {
    let channel: RealtimeChannel | null = null;
    if (currentUser) {
        channel = supabase
            .channel(`public:notifications:user_id=eq.${currentUser.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUser.id}` }, 
            (payload) => {
                setNotifications(prev => [payload.new as Notification, ...prev]);
                addToast("You have a new notification!", 'info');
            })
            .subscribe();
    }
    return () => {
        if (channel) {
            supabase.removeChannel(channel);
        }
    };
   }, [currentUser, addToast]);


  const handleLogout = async () => {
    // Immediately and synchronously clear all user-specific state.
    // This is the single source of truth for logout cleanup.
    setCurrentUser(null);
    setCurrentPage('home');
    setUsers([]);
    setCourses([]);
    setNotifications([]);
    setAllUserProgress({});
    setExternalResources([]);
    setCourseCategories([]);
    setAiChatHistory([]);
    setSelectedCourse(null);
    setCertificateData(null);
    
    const { error } = await supabase.auth.signOut();
    if (error) {
        addToast(`Error logging out: ${error.message}`, 'error');
    }
    // The onAuthStateChange listener will still run, but all critical state has already been cleared.
  };
  
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleMarkNotificationsRead = useCallback(async () => {
      if (!currentUser) return;
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      if (unreadIds.length === 0) return;

      // Optimistically update UI
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));

      const { error } = await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
      if (error) {
          addToast('Could not mark notifications as read on the server.', 'error');
          // Revert optimistic update on error
          setNotifications(prev => prev.map(n => unreadIds.includes(n.id) ? { ...n, read: false } : n));
      }
  }, [currentUser, notifications, addToast]);


  const createNotification = useCallback(async (userId: string, type: NotificationType, message: string) => {
    // This function is called by admins (for other users) and by employees (for themselves).
    // A direct client-side insert fails RLS when an admin tries to create a notification for another user.
    // The correct, secure pattern is to use a Supabase RPC (Remote Procedure Call) function.
    // This RPC function (`create_notification`) must be created in the Supabase SQL editor.
    // It should run with elevated privileges (`SECURITY DEFINER`) and contain logic to verify
    // that the caller is either an admin or is creating a notification for themselves.
    const { error } = await supabase.rpc('create_notification', {
        p_user_id: userId,
        p_type: type,
        p_message: message,
    });

    if (error) {
        addToast(`Error creating notification: ${error.message}`, 'error');
    }
    // Realtime subscription will handle UI updates for the recipient.
  }, [addToast]);

  const handleLogin = async (email: string, password: string) => {
    // 1. Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
        addToast(authError.message, 'error');
        throw authError;
    }
    
    // 2. If authentication is successful, immediately check for profile approval.
    // This is crucial to prevent the login button from getting stuck for unapproved users.
    if (authData.user) {
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('approved, role')
            .eq('id', authData.user.id)
            .single();

        if (profileError || !profile) {
            // Couldn't find a profile, something is wrong. Sign out and show error.
            await supabase.auth.signOut();
            const errorMessage = "Login failed: Could not retrieve user profile.";
            addToast(errorMessage, 'error');
            throw new Error(errorMessage);
        }

        // Admins can log in regardless of approval status.
        if (!profile.approved && profile.role !== UserRole.ADMIN) {
            // Profile found but not approved. Sign out and show specific error.
            await supabase.auth.signOut();
            const errorMessage = "Your account is pending approval.";
            addToast(errorMessage, 'error');
            throw new Error(errorMessage);
        }
    }
    // 3. If approved, the onAuthStateChange listener will take over from here.
    // No need to do anything else. The promise resolves successfully.
  };
  
  const handleRegister = async (name: string, email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
            data: {
                name: name,
            }
        }
    });
    if (error) addToast(error.message, 'error');
    else {
        addToast('Registration successful! Your account now requires administrator approval before you can log in.', 'success');
        setCurrentPage('login');
    }
  };

  const setView = (view: View) => {
    setSelectedCourse(null);
    setCertificateData(null);
    setCurrentView(view);
  };
  
  const setPage = (page: Page) => {
    setCurrentPage(page);
  };

  const awardPoints = useCallback(async (userId: string, points: number) => {
    const { error } = await supabase.rpc('increment_points', { user_id: userId, points_to_add: points });
    if (error) {
        addToast(`Error awarding points: ${error.message}`, 'error');
    } else {
        setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, points: u.points + points } : u));
        if (currentUser?.id === userId) {
            setCurrentUser(prev => prev ? { ...prev, points: prev.points + points } : null);
        }
    }
  }, [addToast, currentUser]);

  const handleSelectCourse = useCallback(async (course: Course) => {
    setSelectedCourse(course);
    setCurrentView('course');
    // Just update recently viewed timestamp if already enrolled/viewed
    if (currentUser && allUserProgress[currentUser.id]?.[course.id]) {
        const { error } = await supabase.from('user_progress').update({
            recently_viewed: new Date().toISOString()
        }).match({ user_id: currentUser.id, course_id: course.id });
        
        if (error) {
            addToast(`Error updating progress: ${error.message}`, 'error');
        } else {
             setAllUserProgress(prev => ({
                ...prev,
                [currentUser.id]: {
                    ...prev[currentUser.id],
                    [course.id]: {
                        ...prev[currentUser.id][course.id],
                        recentlyViewed: new Date().toISOString(),
                    }
                }
             }));
        }
    }
  }, [currentUser, allUserProgress, addToast]);

  const handleEnroll = useCallback(async (courseId: string) => {
    if (!currentUser) return;

    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    const { error } = await supabase.from('user_progress').upsert({
        user_id: currentUser.id,
        course_id: courseId,
        recently_viewed: new Date().toISOString()
    }, { onConflict: 'user_id, course_id' });
    
    if (error) {
        addToast(`Error enrolling in course: ${error.message}`, 'error');
        return;
    }

    addToast(`Successfully enrolled in "${course.title}"!`, 'info');

    // also update local state for immediate feedback
    setAllUserProgress(prev => {
        const currentUserProgress = prev[currentUser.id] || {};
        const updatedUserProgress = {
            ...currentUserProgress,
            [courseId]: {
                ...(currentUserProgress[courseId] || { completedModules: [], quizScore: null }),
                recentlyViewed: new Date().toISOString(),
            }
        };
        return { ...prev, [currentUser.id]: updatedUserProgress };
    });
  }, [currentUser, courses, addToast]);


  const handleCourseComplete = useCallback(async (course: Course, score: number) => {
    if (!currentUser) return;
    
    // Always save the latest quiz score
    const { error: progressSaveError } = await supabase.from('user_progress').upsert({
        user_id: currentUser.id,
        course_id: course.id,
        quiz_score: score,
    }, { onConflict: 'user_id, course_id' });

    if (progressSaveError) {
        addToast(`Error saving quiz score: ${progressSaveError.message}`, 'error');
        return;
    }

    setAllUserProgress(prev => ({
        ...prev,
        [currentUser.id]: {
            ...prev[currentUser.id],
            [course.id]: {
                ...prev[currentUser.id]?.[course.id],
                quizScore: score,
            }
        }
    }));
    
    // Check if the user passed
    if (score < course.passingScore) {
        addToast(`You scored ${score}%. The passing score is ${course.passingScore}%. Please review the material and try again.`, 'error');
        setView('course'); // Stay on the course view
        return;
    }
    
    // --- PASSED ---
    addToast(`Congratulations, you passed with a score of ${score}%!`, 'success');

    const isFirstCompletion = !allUserProgress[currentUser.id]?.[course.id]?.completionDate;
    const completionDate = isFirstCompletion ? new Date().toISOString() : allUserProgress[currentUser.id]?.[course.id]?.completionDate;

    if (isFirstCompletion) {
        const { error } = await supabase.from('user_progress').upsert({
            user_id: currentUser.id,
            course_id: course.id,
            completion_date: completionDate
        }, { onConflict: 'user_id, course_id' });

        if (error) {
            addToast(`Error saving completion date: ${error.message}`, 'error');
        } else {
             setAllUserProgress(prev => ({
                ...prev,
                [currentUser.id]: {
                    ...prev[currentUser.id],
                    [course.id]: { ...prev[currentUser.id]?.[course.id], completionDate }
                }
            }));
            await awardPoints(currentUser.id, 100);
            await createNotification(currentUser.id, NotificationType.CERTIFICATE, `Congratulations! You earned a certificate for "${course.title}".`);
        }
    }

    setCertificateData({
      courseId: course.id,
      employeeName: currentUser.name,
      courseName: course.title,
      completionDate: new Date(completionDate!).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    });
    setCurrentView('certificate');

    // Check for new badges
    const userProgressAfterUpdate = { // Use fresh data for badge calculation
        ...allUserProgress,
        [currentUser.id]: {
            ...allUserProgress[currentUser.id],
            [course.id]: { ...allUserProgress[currentUser.id]?.[course.id], quizScore: score, completionDate }
        }
    };

    const completedCourses = Object.values(userProgressAfterUpdate[currentUser.id] || {}).filter((p: UserProgress[string]) => p.completionDate);
    const completedCount = completedCourses.length;
    
    const currentBadges = currentUser.badges || [];
    const newBadges: string[] = [];
    if (completedCount >= 1 && !currentBadges.includes('first-course')) newBadges.push('first-course');
    if (completedCount >= 3 && !currentBadges.includes('prolific-learner')) newBadges.push('prolific-learner');
    if (score === 100 && !currentBadges.includes('quiz-master')) newBadges.push('quiz-master');
    if (courses.length > 0 && completedCount === courses.length && !currentBadges.includes('completionist')) newBadges.push('completionist');

    if (newBadges.length > 0) {
        let pointsToAddForBadges = 0;
        newBadges.forEach(badgeId => {
            const badge = BADGE_DEFINITIONS[badgeId];
            if (badge) {
                pointsToAddForBadges += badge.points;
                addToast(`Badge Unlocked: ${badge.name}!`, 'success');
                createNotification(currentUser.id, NotificationType.BADGE, `You earned the "${badge.name}" badge and ${badge.points} points!`);
            }
        });
        
        const updatedBadges = [...currentBadges, ...newBadges];
        const { error: userUpdateError } = await supabase.from('users').update({ badges: updatedBadges }).eq('id', currentUser.id);
        if (userUpdateError) { addToast('Error awarding badge.', 'error'); return; }
        
        await awardPoints(currentUser.id, pointsToAddForBadges);

        setCurrentUser(prev => prev ? { ...prev, badges: updatedBadges } : null);
    }
  }, [currentUser, allUserProgress, awardPoints, createNotification, courses, addToast]);


  const updateProgress = useCallback(async (courseId: string, moduleId: string) => {
    if (!currentUser) return;

    // Get the most up-to-date progress for the specific course.
    const currentCourseProgress = allUserProgress[currentUser.id]?.[courseId] || { completedModules: [], quizScore: null };

    // Prevent re-processing if the module is already completed.
    if (!currentCourseProgress.completedModules.includes(moduleId)) {
      
      const updatedCompletedModules = [...currentCourseProgress.completedModules, moduleId];

      // Persist the new list of completed modules to the database.
      const { error } = await supabase.from('user_progress').upsert({
        user_id: currentUser.id,
        course_id: courseId,
        completed_modules: updatedCompletedModules,
      }, { onConflict: 'user_id, course_id' });

      if (error) {
        addToast(`Error updating progress: ${error.message}`, 'error');
        return;
      }
      
      // Award points for the new module completion *after* successful save.
      await awardPoints(currentUser.id, 10);
      
      // Update the local state for immediate UI feedback.
      // Using a functional update ensures we are modifying the most recent state.
      setAllUserProgress(prev => {
        const userProgress = prev[currentUser.id] || {};
        const courseProgress = userProgress[courseId] || { completedModules: [], quizScore: null };
        
        return {
          ...prev,
          [currentUser.id]: {
            ...userProgress,
            [courseId]: {
              ...courseProgress,
              completedModules: updatedCompletedModules,
            },
          },
        };
      });
    }
  }, [currentUser, allUserProgress, awardPoints, addToast]);

  const handleRateCourse = useCallback(async (courseId: string, rating: number, comment: string) => {
    if (!currentUser) return;
    
    try {
        const { data: savedReview, error: reviewError } = await supabase.from('reviews').insert({
            author_id: currentUser.id,
            author_name: currentUser.name,
            rating,
            comment,
            timestamp: new Date().toISOString(),
            course_id: courseId
        }).select().single();

        if(reviewError || !savedReview) {
            throw reviewError || new Error("Failed to save review.");
        }
        
        // Step 2: Update the user's progress with their rating
        const { error: progressError } = await supabase.from('user_progress').upsert({
            user_id: currentUser.id,
            course_id: courseId,
            rating: rating,
        }, { onConflict: 'user_id, course_id' });

        if (progressError) {
            // If this fails, we should ideally roll back the review insert, but for now, we'll just log the error.
            console.error("Failed to save rating to progress, but review was saved:", progressError);
        }

        // Step 3: Optimistically update all local state
        setAllUserProgress(prev => ({ ...prev, [currentUser.id]: { ...prev[currentUser.id], [courseId]: { ...prev[currentUser.id]?.[courseId], rating: rating }}}));
        setCourses(prevCourses => prevCourses.map(c => 
            c.id === courseId ? { ...c, reviews: [...c.reviews, savedReview as Review] } : c
        ));
        addToast('Thank you for your review!', 'success');
        
    } catch (error: any) {
        addToast(error.message || 'An error occurred while submitting your review.', 'error');
    }
  }, [currentUser, addToast]);

  const handleUpdateUser = async (updatedUser: User) => {
    const { error } = await supabase.from('users').update({
        name: updatedUser.name,
        email: updatedUser.email,
        profileImageUrl: updatedUser.profileImageUrl,
    }).eq('id', updatedUser.id);

    if (error) {
        addToast(`Error updating profile: ${error.message}`, 'error');
    } else {
        setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
        if (currentUser?.id === updatedUser.id) {
            setCurrentUser(updatedUser);
        }
        addToast('Profile updated successfully!', 'success');
    }
  };

  const renderAppContent = () => {
    if (!currentUser) return null;
    const currentUserProgress = allUserProgress[currentUser.id] || {};

    // Handle common views accessible to all roles first
    if (currentView === 'profile') {
      const dashboardView = currentUser.role === UserRole.ADMIN ? 'admin' : 'dashboard';
      return <UserProfile user={currentUser} onUpdateUser={handleUpdateUser} onBack={() => setView(dashboardView)} addToast={addToast} />;
    }

    // Handle role-specific views
    if (currentUser.role === UserRole.ADMIN) {
      // The AdminDashboard is the primary view for an admin.
      // Other views like 'profile' are handled above.
      return <AdminDashboard 
        courses={courses} 
        setCourses={setCourses} 
        users={users}
        setUsers={setUsers}
        createNotification={createNotification}
        addToast={addToast}
        allUserProgress={allUserProgress}
        externalResources={externalResources}
        setExternalResources={setExternalResources}
        courseCategories={courseCategories}
        setCourseCategories={setCourseCategories}
      />;
    }

    // Default to Employee views
    switch (currentView) {
      case 'course':
        return (
          <CourseView
            key={selectedCourse?.id} // Add key to force re-mount on course change
            course={selectedCourse}
            setCourses={setCourses}
            currentUser={currentUser}
            userProgress={selectedCourse ? currentUserProgress[selectedCourse.id] : undefined}
            onModuleComplete={updateProgress}
            onCourseComplete={(score) => selectedCourse && handleCourseComplete(selectedCourse, score)}
            onBack={() => setView('dashboard')}
            addToast={addToast}
            onEnroll={handleEnroll}
          />
        );
      case 'certificate':
        return certificateData && (
          <CertificateView
            data={certificateData}
            onBackToDashboard={() => setView('dashboard')}
            onRateCourse={handleRateCourse}
            userRating={currentUserProgress[certificateData.courseId]?.rating}
            userReview={courses.find(c => c.id === certificateData.courseId)?.reviews.find(r => r.author_id === currentUser.id)}
            addToast={addToast}
          />
        );
      case 'leaderboard':
        return <Leaderboard users={users.filter(u => u.role === UserRole.EMPLOYEE)} onBack={() => setView('dashboard')} />;
      case 'resources':
        return <ResourceLibrary onBack={() => setView('dashboard')} resources={externalResources} />;
      case 'courses':
        return (
            <Dashboard 
                user={currentUser}
                courses={courses} 
                onSelectCourse={handleSelectCourse}
                userProgress={currentUserProgress}
                onViewLeaderboard={() => setView('leaderboard')}
                onViewResources={() => setView('resources')}
                courseCategories={courseCategories}
                showOverview={false}
            />
        );
      case 'dashboard':
      default:
        return (
            <Dashboard 
                user={currentUser}
                courses={courses} 
                onSelectCourse={handleSelectCourse}
                userProgress={currentUserProgress}
                onViewLeaderboard={() => setView('leaderboard')}
                onViewResources={() => setView('resources')}
                courseCategories={courseCategories}
            />
        );
    }
  };
  
  const renderPage = () => {
    switch (currentPage) {
        case 'login':
            return <div className="min-h-screen bg-zamzam-teal-50 font-sans text-slate-800 flex flex-col">
                <PublicHeader setPage={setPage} />
                <main className="flex-grow flex items-center justify-center p-4">
                    <Login onLogin={handleLogin} setPage={setPage} />
                </main>
                <Footer />
            </div>;
        case 'register':
            return <div className="min-h-screen bg-zamzam-teal-50 font-sans text-slate-800 flex flex-col">
                <PublicHeader setPage={setPage} />
                <main className="flex-grow flex items-center justify-center p-4">
                    <Register onRegister={handleRegister} setPage={setPage}/>
                </main>
                <Footer />
            </div>;
        case 'app':
             if (!currentUser) {
                return (
                    <div className="min-h-screen bg-zamzam-teal-50 flex items-center justify-center">
                        <Spinner />
                    </div>
                );
             }
             return (
                <div className="min-h-screen bg-zamzam-teal-50 font-sans text-slate-800 flex flex-col">
                  <Header
                    user={currentUser}
                    onLogout={handleLogout}
                    notifications={notifications}
                    onMarkNotificationsRead={handleMarkNotificationsRead}
                    onNavigate={setView}
                  />
                  <main className="container mx-auto p-4 sm:p-6 lg:p-8 flex-grow">
                    {renderAppContent()}
                  </main>
                  {currentUser.role === UserRole.EMPLOYEE && 
                    <AiAssistant 
                        history={aiChatHistory} 
                        setHistory={setAiChatHistory}
                        courseContext={selectedCourse ? {title: selectedCourse.title, description: selectedCourse.description} : undefined}
                    />
                  }
                  <Footer />
                </div>
              );
        case 'home':
        default:
            return <HomePage setPage={setPage} />;
    }
  }

  return (
    <ErrorBoundary>
        <div className="fixed top-5 right-5 z-[100] space-y-2">
            {toasts.map(toast => (
                <Toast key={toast.id} toast={toast} onRemove={removeToast} />
            ))}
        </div>
        {renderPage()}
    </ErrorBoundary>
  );
};

export default App;