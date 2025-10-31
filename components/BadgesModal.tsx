import React from 'react';
import { BADGE_DEFINITIONS } from '../constants';
import { XMarkIcon, TrophyIcon } from './icons';

interface BadgesModalProps {
    isOpen: boolean;
    onClose: () => void;
    userBadges: string[];
}

const BadgesModal: React.FC<BadgesModalProps> = ({ isOpen, onClose, userBadges }) => {
    if (!isOpen) return null;

    const earnedBadges = userBadges.map(id => BADGE_DEFINITIONS[id]).filter(Boolean);

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 transition-opacity"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-xl shadow-xl w-full max-w-2xl transform transition-transform scale-95 duration-300"
                style={{ transform: isOpen ? 'scale(1)' : 'scale(0.95)' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <TrophyIcon className="h-7 w-7 text-amber-500" />
                        <h2 className="text-2xl font-bold text-slate-800">My Badges</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
                        <XMarkIcon className="h-6 w-6 text-slate-500" />
                    </button>
                </div>
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {earnedBadges.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {earnedBadges.map(badge => {
                                const Icon = badge.icon;
                                return (
                                    <div key={badge.id} className="bg-slate-50 rounded-lg p-4 flex items-start space-x-4">
                                        <div className="flex-shrink-0 bg-white p-3 rounded-full border border-slate-200">
                                            <Icon className="h-8 w-8 text-zamzam-teal-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800">{badge.name}</h3>
                                            <p className="text-sm text-slate-600">{badge.description}</p>
                                            <p className="text-xs font-semibold text-amber-600 mt-1">+{badge.points} Points</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-slate-500">You haven't earned any badges yet. Keep learning!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BadgesModal;