import { useTheme } from '@mui/material/styles';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useCallback, useEffect, useState } from 'react';

const testimonials = [
  {
    name: 'Clara Benson',
    avatar: '/assets/testimony/avatar/1f.jpg',
    images: [
      '/assets/testimony/images/001.jpg',
      '/assets/testimony/images/002.jpg',
      '/assets/testimony/images/003.jpg',
      '/assets/testimony/images/004.jpg'
    ],
    rating: 5,
    quote: "Lorem Ipsum Dolor sit amet, consectur at cupidator",
    testimony: 'Lorem ipsum dolor sit amet, consectetur at cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam.'
  },
  {
    name: 'John Smith',
    avatar: '/assets/testimony/avatar/1m.jpg',
    images: [
      '/assets/testimony/images/005.jpg',
      '/assets/testimony/images/006.jpg',
      '/assets/testimony/images/007.jpg',
      '/assets/testimony/images/008.jpg'
    ],
    rating: 5,
    quote: "Another amazing experience",
    testimony: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam.'
  },
  {
    name: 'Sarah Parker',
    avatar: '/assets/testimony/avatar/2f.jpg',
    images: [
      '/assets/testimony/images/009.jpg',
      '/assets/testimony/images/010.jpg',
      '/assets/testimony/images/011.jpg',
      '/assets/testimony/images/012.jpg'
    ],
    rating: 5,
    quote: "The best travel experience ever",
    testimony: 'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam.'
  }
];

const ImageCard = ({ 
  image, 
  stackPosition, 
  totalImages,
  direction,
  isChangingTestimonial,
  isMobile
}) => {
  const theme = useTheme();
  const cardWidth = isMobile ? 'w-72' : 'w-96';
  const cardHeight = isMobile ? 'h-[400px]' : 'h-[550px]';
  const stackOffset = isMobile ? 16 : 30;

  return (
    <motion.div
      className={`absolute rounded-3xl overflow-hidden shadow-2xl ${cardWidth} ${cardHeight}`}
      style={{
        left: isMobile ? stackPosition * stackOffset : 'auto',
        right: isMobile ? 'auto' : stackPosition * stackOffset,
        top: stackPosition * stackOffset,
        zIndex: totalImages - stackPosition,
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
      initial={{ 
        x: isChangingTestimonial ? (direction === 1 ? '100%' : '-100%') : 0,
        scale: isChangingTestimonial ? 0.8 : (1 - stackPosition * 0.05),
        opacity: isChangingTestimonial ? 0 : 1
      }}
      animate={{ 
        x: 0,
        scale: 1 - stackPosition * 0.05,
        opacity: 1
      }}
      exit={{ 
        x: isChangingTestimonial ? (direction === 1 ? '-100%' : '100%') : 0,
        scale: isChangingTestimonial ? 0.8 : (1 - stackPosition * 0.05),
        opacity: 0
      }}
      transition={{
        duration: 0.4,
        ease: [0.32, 0.72, 0, 1],
        delay: isChangingTestimonial ? 0.3 + (stackPosition * 0.1) : 0
      }}
    >
      <img
        src={image}
        alt="Travel moment"
        className="w-full h-full object-cover"
      />
    </motion.div>
  );
};

const TestimonialContent = ({ testimonial, direction, isMobile }) => {
  const theme = useTheme();
  
  return (
    <motion.div 
      className="text-left w-full pr-0 sm:pr-4 flex flex-col justify-between h-full"
      initial={{ 
        x: direction === 1 ? '100%' : '-100%',
        opacity: 0
      }}
      animate={{ 
        x: 0,
        opacity: 1
      }}
      exit={{ 
        x: direction === 1 ? '-100%' : '100%',
        opacity: 0
      }}
      transition={{
        duration: 0.4,
        ease: [0.32, 0.72, 0, 1]
      }}
    >
      <h1 
        className="text-5xl sm:text-6xl lg:text-7xl font-light leading-tight"
        style={{ color: theme.palette.text.primary }}
      >
        Hear from
        <br />
        <span className="text-6xl sm:text-7xl lg:text-8xl block">our happiest</span>
        <span className="text-4xl sm:text-5xl lg:text-6xl block">travellers</span>
      </h1>
      
      <div className="mt-8">
        <div className="flex gap-2">
          {'★'.repeat(testimonial.rating).split('').map((star, i) => (
            <span 
              key={i} 
              className="text-2xl sm:text-3xl"
              style={{ color: theme.palette.primary.dark }}
            >
              {star}
            </span>
          ))}
        </div>
        
        <h2 
          className="text-2xl sm:text-3xl font-medium mt-4"
          style={{ color: theme.palette.text.special }}
        >
          {testimonial.quote}
        </h2>
        
        <p 
          className="text-lg sm:text-xl leading-relaxed mt-4"
          style={{ color: theme.palette.text.secondary }}
        >
          {testimonial.testimony}
        </p>
        
        <p 
          className="text-xl sm:text-2xl font-medium mt-4"
          style={{ color: theme.palette.primary.main }}
        >
          {testimonial.name}
        </p>
      </div>
    </motion.div>
  );
};

const Testimony = () => {
  const theme = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [navigationDirection, setNavigationDirection] = useState(1);
  const [isChangingTestimonial, setIsChangingTestimonial] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const currentImages = testimonials[currentIndex].images;
  
  const handleTestimonialChange = useCallback((newDirection) => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setNavigationDirection(newDirection);
    setIsChangingTestimonial(true);
    
    setTimeout(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + newDirection + testimonials.length) % testimonials.length;
        return nextIndex;
      });
      setImageIndex(0);
      
      setTimeout(() => {
        setIsTransitioning(false);
        setIsChangingTestimonial(false);
      }, 600);
    }, 400);
  }, [isTransitioning]);

  const handleImageNavigation = useCallback((newDirection) => {
    if (isTransitioning || isChangingTestimonial) return;
    
    const nextImageIndex = (imageIndex + newDirection + currentImages.length) % currentImages.length;
    
    if (nextImageIndex === 0 && newDirection === 1) {
      handleTestimonialChange(1);
    } 
    else if (imageIndex === 0 && newDirection === -1) {
      handleTestimonialChange(-1);
    }
    else {
      setIsTransitioning(true);
      setNavigationDirection(newDirection);
      
      setTimeout(() => {
        setImageIndex(nextImageIndex);
        setIsTransitioning(false);
      }, 400);
    }
  }, [isTransitioning, isChangingTestimonial, imageIndex, currentImages.length, handleTestimonialChange]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isTransitioning && !isChangingTestimonial) {
        handleImageNavigation(1);
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [handleImageNavigation, isTransitioning, isChangingTestimonial]);

  const getStackIndices = () => {
    const indices = [];
    for (let i = 0; i < 4; i++) {
      indices.push((imageIndex + i) % currentImages.length);
    }
    return indices;
  };

  return (
    <div className="w-full px-8 sm:px-8 md:px-12 lg:px-24 py-8 sm:py-12 lg:py-24 relative">
      <div className={`grid ${isMobile ? 'grid-cols-1 gap-12' : 'grid-cols-12 gap-2'} items-center`}>
        {/* Left Column - Text Content */}
        <div className={`${isMobile ? 'order-2' : 'col-span-7'} w-full`}>
          <AnimatePresence mode="wait" initial={false}>
            <TestimonialContent 
              key={currentIndex} 
              testimonial={testimonials[currentIndex]}
              direction={navigationDirection}
              isMobile={isMobile}
            />
          </AnimatePresence>
        </div>
        
        {/* Right Column - Image Stack */}
        <div className={`${isMobile ? 'order-1' : 'col-span-5'} flex justify-center lg:justify-end`}>
          <div className="relative h-[400px] sm:h-[550px] w-full">
            <div 
              className="absolute"
              style={{ 
                left: isMobile ? '50%' : 'auto',
                right: isMobile ? 'auto' : '0',
                transform: isMobile ? 'translateX(-50%)' : 'none',
                width: isMobile ? '300px' : 'auto'
              }}
            >
              <AnimatePresence mode="popLayout">
                {getStackIndices().map((idx, stackPosition) => (
                  <ImageCard
                    key={`${currentIndex}-${idx}`}
                    image={currentImages[idx]}
                    stackPosition={stackPosition}
                    totalImages={currentImages.length}
                    direction={navigationDirection}
                    isChangingTestimonial={isChangingTestimonial}
                    isMobile={isMobile}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Indicators */}
      <div className="flex justify-center gap-4 sm:gap-6 mt-12 sm:mt-16">
        {testimonials.map((_, idx) => (
          <div
            key={idx}
            className={`h-2 rounded-full transition-all duration-300 ${
              idx === currentIndex 
                ? 'w-16 sm:w-20' 
                : 'w-10 sm:w-12'
            }`}
            style={{
              backgroundColor: idx === currentIndex 
                ? theme.palette.primary.main
                : theme.palette.primary.light
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default Testimony;