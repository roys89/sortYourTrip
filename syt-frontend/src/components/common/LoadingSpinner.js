import { Player } from '@lottiefiles/react-lottie-player';
import React from 'react';

const LoadingSpinner = ({ 
  message = 'Planning Your Adventure...'
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#fdf2e9]">
      {/* Main Content Container */}
      <div className="flex flex-col items-center p-8">
        {/* Lottie Animation Container */}
        <div className="w-64 h-64 mb-8">
          <Player
            autoplay
            loop
            src="/assets/animations/Animation - 1734433500912.json"
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        {/* Message */}
        <h2 className="text-xl font-semibold text-blue-600 mt-4 animate-pulse text-center">
          {message}
        </h2>
      </div>
    </div>
  );
};

export default LoadingSpinner;