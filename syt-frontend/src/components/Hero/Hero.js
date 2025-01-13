import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import DestinationForm from '../DestinationForm/DestinationForm';

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  
  const images = [
    '/assets/images/hero/w1.jpg',
    '/assets/images/hero/w2.jpg',
    '/assets/images/hero/w3.jpg',
    '/assets/images/hero/w4.jpg',
    '/assets/images/hero/w5.jpg'
  ];

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? -100 : 100,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      x: direction < 0 ? -100 : 100,
      opacity: 0
    })
  };

  const handleNavigation = useCallback((newDirection) => {
    setDirection(newDirection);
    if (newDirection > 0) {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    } else {
      setCurrentSlide((prev) => (prev - 1 + images.length) % images.length);
    }
  }, [images.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      handleNavigation(1);
    }, 3000);

    return () => clearInterval(timer);
  }, [handleNavigation]);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Navigation Arrows */}
      <button 
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 transition-colors duration-200"
        onClick={() => handleNavigation(-1)}
      >
        <ChevronLeft className="w-8 h-8 text-white" />
      </button>
      
      <button 
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 transition-colors duration-200"
        onClick={() => handleNavigation(1)}
      >
        <ChevronRight className="w-8 h-8 text-white" />
      </button>

      {/* Background Images Carousel */}
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentSlide}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "tween", duration: 0.8, ease: "easeInOut" },
            opacity: { duration: 0.8 }
          }}
          className="absolute inset-0 w-full h-full"
        >
          <motion.div
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            exit={{ scale: 1.1 }}
            transition={{ duration: 1.2 }}
            className="w-full h-full"
          >
            <div
              className="w-full h-full bg-cover bg-center"
              style={{
                backgroundImage: `url(${images[currentSlide]})`,
              }}
            >
              <div className="absolute inset-0 bg-black/30" />
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Fixed Content */}
      <div className="relative z-20 h-full flex items-center justify-center">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            SEE THE WORLD IN A NEW LIGHT
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-white mb-8">
            One-Stop Shop for Your Personalized and Customizable Travel Experience
          </p>

          {/* Progress Bars */}
          <div className="flex justify-center gap-3 mt-12">
            {images.map((_, index) => (
              <motion.button
                key={index}
                initial={false}
                animate={{
                  width: currentSlide === index ? '2rem' : '0.75rem',
                  opacity: currentSlide === index ? 1 : 0.7,
                }}
                transition={{ duration: 0.3 }}
                className="h-2 rounded-full bg-white cursor-pointer"
                onClick={() => {
                  const newDirection = index > currentSlide ? 1 : -1;
                  setDirection(newDirection);
                  setCurrentSlide(index);
                }}
              />
            ))}
          </div>

          {/* Destination Form */}
          <div className="mt-8 relative z-30">
            <DestinationForm />
          </div>
        </div>
      </div>

      {/* Slide Counter */}
      <div className="absolute bottom-8 right-8 z-20 text-white/90 font-medium">
        <span className="text-2xl">{currentSlide + 1}</span>
        <span className="text-lg opacity-60">/{images.length}</span>
      </div>
    </div>
  );
};

export default HeroCarousel;