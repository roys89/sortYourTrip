import React from 'react';
import DestinationForm from '../../DestinationForm/DestinationForm';
import SortyourtripReview from '../SortyourtripReview/SortyourtripReview';
import TestimonialCarousel from '../TestimonialCarousel/TestimonialCarousel';

const Hero = () => {
  return (
    <div className="relative">
      {/* Hero Section with Video */}
      <div className="relative h-[85vh] w-full overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="object-cover w-full h-full"
          >
            <source src="/assets/images/hero/79806-570766597.mp4" type="video/mp4" />
          </video>
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* Content */}
        <div className="relative h-full z-20 flex items-center justify-center py-12">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="space-y-8">
              {/* Text Content */}
              <div className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white animate-fade-in">
                  SEE THE WORLD IN A NEW LIGHT
                </h1>
              </div>

              {/* Destination Form */}
              <div className="relative z-30 w-full max-w-4xl mx-auto animate-fade-in-delay">
                <DestinationForm />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Container for Review and Testimonial */}
      <div className="relative">
        {/* Review Section - Positioned to overlap */}
        <div className="absolute -top-12 left-0 right-0 z-50">
          <SortyourtripReview />
        </div>
        
        {/* Testimonial Section */}
        <div className="relative pt-12">
          <TestimonialCarousel />
        </div>
      </div>
    </div>
  );
};

export default Hero;