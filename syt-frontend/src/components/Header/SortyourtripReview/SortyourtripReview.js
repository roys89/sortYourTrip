import React from 'react';

const SortyourtripReview = () => {
  return (
    <div className="relative -mt-16 mx-auto max-w-md px-4 z-30">
      <div className="w-full bg-white py-6 px-6 rounded-xl shadow-lg">
        <div className="flex flex-col items-center gap-4">
          {/* Rating Row */}
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gray-800">Excellent 4.6</span>
            <span className="text-2xl text-gray-500">/5</span>
            {/* Stars */}
            <div className="flex gap-0.5 ml-2">
              {[1, 2, 3, 4].map((_, index) => (
                <div 
                  key={index}
                  className="w-7 h-7 bg-[#00B67A] flex items-center justify-center"
                >
                  <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
              ))}
              <div className="w-7 h-7 bg-[#DCDCE6] flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Review Count Row */}
          <div className="flex items-center gap-2 text-lg">
            <span className="text-gray-600">See our</span>
            <span className="font-semibold text-xl">306</span>
            <span className="text-gray-600">reviews on</span>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 bg-[#00B67A] flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <span className="font-bold text-[#00B67A] text-xl">Trustpilot</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SortyourtripReview;