import React from 'react';

const Spinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
        <div 
            className="w-12 h-12 rounded-full animate-spin border-4 border-solid border-zamzam-teal-500 border-t-transparent"
            role="status"
            aria-label="Loading"
        ></div>
        <span className="text-slate-600 font-medium">Loading...</span>
    </div>
  );
};

export default Spinner;