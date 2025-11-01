import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Course, User, Toast, UserProgress } from '../types';
import QuizView from './QuizView';
import DiscussionForum from './DiscussionForum';
import { ChevronLeftIcon, DocumentTextIcon, CheckCircleIcon, LockClosedIcon, ChatBubbleLeftRightIcon, AcademicCapIcon, StarIcon, BookOpenIcon as DownloadIcon, VideoCameraIcon } from './icons';
import ReviewsTab from './ReviewsTab';
import { supabase } from '../services/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface CourseViewProps {
  course: Course | null;
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  currentUser: User;
  userProgress?: UserProgress[string];
  onModuleComplete: (courseId: string, moduleId: string) => void;
  onCourseComplete: (score: number) => void;
  onBack: () => void;
  addToast: (message: string, type: Toast['type']) => void;
  onEnroll: (courseId: string) => void;
}

type CourseTab = 'content' | 'discussion' | 'reviews';

const CourseView: React.FC<CourseViewProps> = ({ course, setCourses, currentUser, userProgress, onModuleComplete, onCourseComplete, onBack, addToast, onEnroll }) => {
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [activeTab, setActiveTab] = useState<CourseTab>('content');
  const completionFiredRef = useRef<Set<string>>(new Set());
  
  const completedModules = userProgress?.completedModules || [];
  const isEnrolled = !!userProgress;

  useEffect(() => {
    if (course) {
      completionFiredRef.current.clear();
      if (course.modules && course.modules.length > 0) {
        setActiveModuleId(course.modules[0].id);
      }
    }
  }, [course]);
  
  useEffect(() => {
    let channel: RealtimeChannel | null = null;
    if(course) {
        channel = supabase
            .channel(`public:courses:id=eq.${course.id}`)
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'courses', filter: `id=eq.${course.id}`},
            () => {
                addToast('This course is no longer available.', 'error');
                onBack();
            })
            .subscribe();
    }
    return () => {
        if(channel) {
            supabase.removeChannel(channel);
        }
    }
  }, [course, addToast, onBack]);

  const activeModule = course?.modules.find(m => m.id === activeModuleId);
  const activeModuleIndex = course?.modules.findIndex(m => m.id === activeModuleId) ?? -1;
  const allModulesCompleted = course ? completedModules.length === course.modules.length : false;
  const hasQuiz = course && course.quiz && course.quiz.length > 0;

  useEffect(() => {
    if (activeModuleId && course && isEnrolled && !completedModules.includes(activeModuleId)) {
      if (!completionFiredRef.current.has(activeModuleId)) {
        completionFiredRef.current.add(activeModuleId);
        onModuleComplete(course.id, activeModuleId);
        addToast('Module complete! You earned 10 points.', 'success');
      }
    }
  }, [activeModuleId, course, completedModules, onModuleComplete, addToast, isEnrolled]);
  
  const handleNextModule = useCallback(() => {
    if (course && activeModuleIndex < course.modules.length - 1) {
        const nextModule = course.modules[activeModuleIndex + 1];
        setActiveModuleId(nextModule.id);
    }
  }, [course, activeModuleIndex]);

  const handlePrevModule = useCallback(() => {
    if (course && activeModuleIndex > 0) {
        const prevModule = course.modules[activeModuleIndex - 1];
        setActiveModuleId(prevModule.id);
    }
  }, [course, activeModuleIndex]);
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'ArrowRight') handleNextModule();
        else if (event.key === 'ArrowLeft') handlePrevModule();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextModule, handlePrevModule]);

  if (!course) {
    return (
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Course Not Found</h2>
            <p className="text-slate-600">The course you are looking for does not exist.</p>
            <button onClick={onBack} className="mt-6 bg-zamzam-teal-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-zamzam-teal-700 transition">
                Return to Dashboard
            </button>
        </div>
    );
  }

  if (showQuiz) {
    return <QuizView course={course} onQuizComplete={onCourseComplete} />;
  }
  
  const TabButton: React.FC<{tab: CourseTab, label: string, icon: React.ReactNode}> = ({tab, label, icon}) => (
    <button
        onClick={() => setActiveTab(tab)}
        className={`flex items-center space-x-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === tab
                ? 'border-zamzam-teal-600 text-zamzam-teal-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
        }`}
    >
        {icon}
        <span>{label}</span>
    </button>
  );
  
  const VideoPlayer = React.memo(({ src, title, type }: { src: string; title: string; type?: 'embed' | 'upload'}) => {
      const videoContainerStyle: React.CSSProperties = { position: 'relative', width: '100%', paddingTop: '56.25%' };
      const videoStyle: React.CSSProperties = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' };

      if (type === 'upload') {
          return <video key={src} src={src} controls playsInline style={videoStyle}>Your browser does not support the video tag.</video>;
      }
      return <iframe src={src} title={title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={videoStyle}></iframe>;
  });

  const hasCompletedCourse = !!userProgress?.completionDate;
  const hasTakenQuiz = userProgress?.quizScore !== null;

  const getQuizButton = () => {
    if (!hasQuiz) {
        return <button disabled className="w-full py-3 px-4 rounded-lg font-semibold text-white transition bg-slate-400 cursor-not-allowed">Quiz Not Available</button>;
    }
    
    if (!allModulesCompleted) {
        return <button disabled className="w-full py-3 px-4 rounded-lg font-semibold text-white transition bg-slate-300 cursor-not-allowed flex items-center justify-center space-x-2"><LockClosedIcon className="h-5 w-5"/><span>Complete modules to unlock</span></button>;
    }
    
    const buttonText = hasTakenQuiz ? "Retake Final Quiz" : "Start Final Quiz";
    const buttonColor = hasCompletedCourse 
        ? "bg-sky-600 hover:bg-sky-700" // A different color for retakes after completion
        : "bg-zamzam-teal-600 hover:bg-zamzam-teal-700"; // Standard color for first time/pre-completion retakes

    return <button onClick={() => setShowQuiz(true)} className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition ${buttonColor}`}>{buttonText}</button>;
  };


  return (
    <div className="bg-white p-4 sm:p-8 rounded-xl shadow-lg">
      <button onClick={onBack} className="flex items-center text-sm font-medium text-zamzam-teal-600 hover:text-zamzam-teal-800 mb-6 transition">
        <ChevronLeftIcon className="h-5 w-5 mr-1" />
        Back to Dashboard
      </button>
      
      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-1/3 border-r-0 lg:border-r lg:pr-8 flex-shrink-0">
            <p className="text-sm font-semibold text-zamzam-teal-600 uppercase mb-1">{course.category}</p>
            <h2 className="text-2xl font-bold mb-4">{course.title}</h2>
            <ul className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
                {course.modules.map((module) => {
                const isCompleted = completedModules.includes(module.id);
                const isActive = activeModuleId === module.id && activeTab === 'content';
                const Icon = module.type === 'video' ? VideoCameraIcon : DocumentTextIcon;
                return (
                    <li key={module.id}>
                    <button
                        onClick={() => { if(isEnrolled) { setActiveModuleId(module.id); setActiveTab('content'); } }}
                        disabled={!isEnrolled}
                        className={`w-full text-left flex items-center p-3 rounded-md transition ${
                        isActive ? 'bg-zamzam-teal-100 text-zamzam-teal-800 font-semibold'
                        : isEnrolled ? 'hover:bg-slate-100' : 'opacity-60 cursor-not-allowed'
                        }`}
                    >
                        {isCompleted ? <CheckCircleIcon className="h-5 w-5 mr-3 text-green-500 flex-shrink-0" />
                        : !isEnrolled ? <LockClosedIcon className="h-5 w-5 mr-3 text-slate-400 flex-shrink-0" />
                        : <Icon className="h-5 w-5 mr-3 text-slate-400 flex-shrink-0" />}
                        <span className={isCompleted && !isActive ? 'text-slate-500' : ''}>{module.title}</span>
                    </button>
                    </li>
                );
                })}
                {course.modules.length === 0 && <li className="p-3 text-sm text-slate-500 text-center bg-slate-50 rounded-md">This course has no modules yet.</li>}
            </ul>

            <div className="mt-6 space-y-4 border-t pt-6">
                {course.textbookUrl && 
                    <a href={course.textbookUrl} download={course.textbookName} target="_blank" rel="noopener noreferrer" className="w-full py-3 px-4 rounded-lg font-semibold text-zamzam-teal-800 bg-zamzam-teal-100 hover:bg-zamzam-teal-200 transition flex items-center justify-center space-x-2">
                        <DownloadIcon className="h-5 w-5"/>
                        <span>Download Textbook</span>
                    </a>
                }
                {isEnrolled ? getQuizButton() : (
                    <button onClick={() => onEnroll(course.id)} className="w-full py-3 px-4 rounded-lg font-semibold text-white transition bg-zamzam-teal-600 hover:bg-zamzam-teal-700">Enroll in Course</button>
                )}
            </div>
        </aside>

        <main className="lg:w-2/3 min-w-0">
            <div className="border-b border-slate-200 mb-6">
                <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto">
                    <TabButton tab="content" label="Content" icon={<AcademicCapIcon className="h-5 w-5"/>} />
                    <TabButton tab="discussion" label="Discussion" icon={<ChatBubbleLeftRightIcon className="h-5 w-5"/>} />
                    <TabButton tab="reviews" label="Reviews" icon={<StarIcon className="h-5 w-5"/>} />
                </div>
            </div>

          {activeTab === 'content' && (
             activeModule && isEnrolled ? (
                <div>
                    <h3 className="text-3xl font-bold text-slate-800 mb-4">{activeModule.title}</h3>
                    {activeModule.type === 'video' ? <div className="bg-black rounded-lg overflow-hidden shadow-lg"><VideoPlayer src={activeModule.content} title={activeModule.title} type={activeModule.videoType}/></div>
                    : <div className="prose max-w-none prose-p:text-slate-700 prose-p:leading-relaxed prose-strong:text-slate-800 prose-ul:list-disc prose-ul:ml-6 prose-img:rounded-md prose-img:shadow-sm prose-a:text-zamzam-teal-600 prose-a:font-semibold hover:prose-a:text-zamzam-teal-700"><div dangerouslySetInnerHTML={{ __html: activeModule.content }} /></div>}
                     <div className="flex justify-between mt-8 border-t pt-4">
                        <button onClick={handlePrevModule} disabled={activeModuleIndex <= 0} className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed">Previous Module</button>
                        <button onClick={handleNextModule} disabled={activeModuleIndex >= course.modules.length - 1} className="px-4 py-2 text-sm font-semibold text-white bg-zamzam-teal-600 rounded-md hover:bg-zamzam-teal-700 transition disabled:bg-slate-300 disabled:cursor-not-allowed">Next Module</button>
                      </div>
                </div>
              ) : (
                <div className="prose max-w-none">
                    <h3 className="text-3xl font-bold text-slate-800 mb-4">Course Overview</h3>
                    <p>{course.description}</p>
                    {!isEnrolled && <p><strong>Enroll in this course to access the modules and take the final quiz.</strong></p>}
                </div>
              )
          )}
          {activeTab === 'discussion' && <DiscussionForum courseId={course.id} posts={course.discussion} currentUser={currentUser} setCourses={setCourses} addToast={addToast} />}
          {activeTab === 'reviews' && <ReviewsTab reviews={course.reviews} />}
        </main>
      </div>
    </div>
  );
};

export default CourseView;