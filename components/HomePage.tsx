import React, { useState, useEffect } from 'react';
import { Course, AiMessage, mapSupabaseCourse } from '../types';
import CourseCard from './CourseCard';
import Footer from './Footer';
import PublicHeader from './PublicHeader';
import { BookOpenIcon, CheckCircleIcon, StarIcon, ShieldCheckIcon, TrophyIcon, UsersIcon } from './icons';
import AiAssistant from './AiAssistant';
import { supabase } from '../services/supabaseClient';
import Spinner from './Spinner';

interface HomePageProps {
  setPage: (page: 'home' | 'login' | 'register') => void;
}

const Feature: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
    <div className="text-center">
        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-zamzam-teal-100 text-zamzam-teal-600 mx-auto mb-4">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-600">{description}</p>
    </div>
);


const HomePage: React.FC<HomePageProps> = ({ setPage }) => {
  const [aiChatHistory, setAiChatHistory] = useState<AiMessage[]>([]);
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedCourses = async () => {
      try {
        setIsLoading(true);
        // The previous query joined reviews, which likely failed due to RLS for anon users.
        // This new query just gets the public course data. The CourseCard component will gracefully handle the missing reviews array.
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3);

        if (error) {
          throw error;
        }
        
        setFeaturedCourses((data?.map(mapSupabaseCourse) as Course[]) || []);
      } catch (error) {
        console.error("Error fetching featured courses:", error);
        // Silently fail, so the section just doesn't show up.
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedCourses();
  }, []);


  return (
    <div className="bg-white font-sans text-slate-800">
      <PublicHeader setPage={setPage} />
      
      <main>
        {/* Hero Section */}
        <div className="bg-zamzam-teal-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 text-center">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-zamzam-teal-800 mb-4 leading-tight">
                    Unlock Your Potential in Islamic Finance
                </h1>
                <p className="text-lg md:text-xl text-slate-700 max-w-3xl mx-auto mb-8">
                    Join Zamzam Bank's dedicated e-learning platform to enhance your expertise, master IFB principles, and accelerate your career growth.
                </p>
                <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
                    <button
                        onClick={() => setPage('login')}
                        className="w-full sm:w-auto bg-zamzam-teal-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-zamzam-teal-700 transition shadow-lg text-lg"
                    >
                        Employee Login
                    </button>
                    <button
                        onClick={() => setPage('register')}
                        className="w-full sm:w-auto bg-white text-zamzam-teal-700 font-bold py-3 px-8 rounded-lg hover:bg-zamzam-teal-100 transition border border-zamzam-teal-200 text-lg"
                    >
                        Register Now
                    </button>
                </div>
            </div>
        </div>

        {/* Features Section */}
        <section className="py-16 sm:py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-800">Why Choose Our Platform?</h2>
                    <p className="text-lg text-slate-600 mt-2">A learning experience designed for excellence.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                   <Feature 
                        icon={<BookOpenIcon className="h-8 w-8" />} 
                        title="Expert-Led Content"
                        description="Access comprehensive courses on Murabaha, Ijarah, and more, all curated by industry experts."
                   />
                   <Feature 
                        icon={<CheckCircleIcon className="h-8 w-8" />} 
                        title="Interactive Quizzes"
                        description="Test your understanding and solidify your knowledge with engaging quizzes after each course."
                   />
                   <Feature 
                        icon={<StarIcon className="h-8 w-8" />} 
                        title="Earn Certificates"
                        description="Receive official certificates upon course completion to showcase your achievements and skills."
                   />
                </div>
            </div>
        </section>

        {/* Why ZamZam Bank Academy Section */}
        <section className="bg-slate-50 py-16 sm:py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="order-2 md:order-1">
                        <h2 className="text-3xl font-bold text-slate-800 mb-4">Why ZamZam Bank Academy?</h2>
                        <p className="text-lg text-slate-600 mb-8">Investing in our most valuable asset: our people. Our academy is more than just training; it's a commitment to shared growth and ethical excellence.</p>
                        <ul className="space-y-6">
                            <li className="flex items-start space-x-4">
                                <div className="flex-shrink-0 bg-zamzam-teal-100 text-zamzam-teal-600 p-3 rounded-full">
                                    <ShieldCheckIcon className="h-6 w-6"/>
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold text-slate-800">Shariah-Compliant Expertise</h4>
                                    <p className="text-slate-600">Deepen your understanding of Islamic finance principles with content that is meticulously aligned with Shariah standards.</p>
                                </div>
                            </li>
                             <li className="flex items-start space-x-4">
                                <div className="flex-shrink-0 bg-zamzam-teal-100 text-zamzam-teal-600 p-3 rounded-full">
                                    <TrophyIcon className="h-6 w-6"/>
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold text-slate-800">Career Advancement</h4>
                                    <p className="text-slate-600">Gain the skills and certifications necessary to progress within Zamzam Bank and the broader financial industry.</p>
                                </div>
                            </li>
                             <li className="flex items-start space-x-4">
                                <div className="flex-shrink-0 bg-zamzam-teal-100 text-zamzam-teal-600 p-3 rounded-full">
                                    <UsersIcon className="h-6 w-6"/>
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold text-slate-800">Unified Knowledge Base</h4>
                                    <p className="text-slate-600">Ensure consistent, bank-wide understanding of our products, services, and ethical commitments, fostering a cohesive team culture.</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                     <div className="order-1 md:order-2">
                        <img 
                            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1471&auto=format&fit=crop" 
                            alt="Professionals collaborating in a modern learning environment"
                            className="rounded-xl shadow-lg w-full h-full object-cover"
                            loading="lazy"
                        />
                    </div>
                </div>
            </div>
        </section>

        {/* Featured Courses Section */}
        <section className="bg-white py-16 sm:py-20">
             <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-zamzam-teal-800">Featured Courses</h2>
                    <p className="text-lg text-slate-600 mt-2">Get a glimpse of our most recently added training material.</p>
                </div>
                {isLoading ? (
                    <div className="flex justify-center items-center py-10">
                        <Spinner />
                    </div>
                ) : featuredCourses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {featuredCourses.map(course => (
                            <CourseCard
                            key={course.id}
                            course={course}
                            progress={{ completedModules: [], quizScore: null }}
                            onSelectCourse={() => setPage('login')} // Prompt login on click
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-slate-500">
                        <p>New courses are coming soon. Please check back later!</p>
                    </div>
                )}
             </div>
        </section>
      </main>

      <AiAssistant history={aiChatHistory} setHistory={setAiChatHistory} />

      <Footer />
    </div>
  );
};

export default HomePage;