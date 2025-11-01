import React from 'react';
import { User, Course, UserProgress } from '../types';
import { ChevronLeftIcon, AcademicCapIcon } from './icons';

interface MyCertificatesProps {
    user: User;
    courses: Course[];
    userProgress: UserProgress;
    onViewCertificate: (courseId: string) => void;
    onBack: () => void;
}

const MyCertificates: React.FC<MyCertificatesProps> = ({ user, courses, userProgress, onViewCertificate, onBack }) => {
    const completedCourses = courses.filter(course => userProgress[course.id]?.completionDate);

    return (
        <div>
            <button onClick={onBack} className="flex items-center text-sm font-medium text-zamzam-teal-600 hover:text-zamzam-teal-800 mb-6 transition">
                <ChevronLeftIcon className="h-5 w-5 mr-1" />
                Back to Dashboard
            </button>

            <div className="bg-white p-8 rounded-xl shadow-lg">
                <div className="text-center mb-8">
                    <AcademicCapIcon className="h-16 w-16 mx-auto text-zamzam-teal-600" />
                    <h2 className="text-3xl font-bold text-slate-800 mt-4">My Certificates</h2>
                    <p className="text-lg text-slate-600">A collection of all your earned achievements.</p>
                </div>

                {completedCourses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {completedCourses.map(course => {
                            const progress = userProgress[course.id];
                            if (!progress || !progress.completionDate) return null;
                            
                            return (
                                <div key={course.id} className="bg-slate-50 rounded-lg shadow p-6 flex flex-col items-center text-center group">
                                    <div className="w-20 h-20 mb-4 bg-white rounded-full flex items-center justify-center border-4 border-zamzam-teal-200">
                                         <AcademicCapIcon className="h-10 w-10 text-zamzam-teal-600"/>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800">{course.title}</h3>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Completed on: {new Date(progress.completionDate).toLocaleDateString()}
                                    </p>
                                    <button
                                        onClick={() => onViewCertificate(course.id)}
                                        className="mt-6 w-full bg-zamzam-teal-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-zamzam-teal-700 transition duration-300"
                                    >
                                        View Certificate
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16 px-6">
                        <h3 className="text-xl font-semibold text-slate-700">No Certificates Yet</h3>
                        <p className="text-slate-500 mt-2">Complete a course and pass the final quiz to earn your first certificate!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyCertificates;
