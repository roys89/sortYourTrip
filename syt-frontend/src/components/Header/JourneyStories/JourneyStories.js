import { useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';

const JourneyStories = () => {
  const theme = useTheme();
  const [activeSlide, setActiveSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const cardRefs = useRef(Array(6).fill().map(() => React.createRef()));
  
  const blogPosts = [
    {
      title: "PRE-TRIP READING & TRAVEL",
      date: "October 8, 2019",
      author: "Alisa Michaels",
      category: "Adventure",
      image: "/assets/testimony/images/029.jpg",
      alt: "Thailand temple at sunset with light trails"
    },
    {
      title: "THE ULTIMATE GRAND CANYON",
      date: "October 8, 2019",
      author: "Alisa Michaels",
      category: "Adventure",
      image: "/assets/testimony/images/030.jpg",
      alt: "Overwater bungalows in turquoise waters"
    },
    {
      title: "GUIDED HIKES IN ICELAND",
      date: "October 8, 2019",
      author: "Alisa Michaels",
      category: "Adventure",
      image: "/assets/testimony/images/031.jpg",
      alt: "Traditional long-tail boat in Thailand"
    },
    {
      title: "EXPLORING DUBAI",
      date: "October 8, 2019",
      author: "Alisa Michaels",
      category: "Adventure", 
      image: "/assets/testimony/images/032.jpg",
      alt: "Dubai skyline with Burj Khalifa"
    },
    {
      title: "SYDNEY HARBOUR VIEWS",
      date: "October 8, 2019",
      author: "Alisa Michaels",
      category: "Adventure",
      image: "/assets/testimony/images/033.jpg",
      alt: "Sydney Opera House and Harbour Bridge"
    },
    {
      title: "VOLCANIC INDONESIA",
      date: "October 8, 2019",
      author: "Alisa Michaels",
      category: "Adventure",
      image: "/assets/testimony/images/034.jpg",
      alt: "Mount Bromo volcano in Indonesia"
    }
  ];

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % (blogPosts.length - (isMobile ? 0 : 2)));
    }, 5000);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, [blogPosts.length, isMobile]);

  const handleMouseMove = (e, cardRef) => {
    if (!cardRef.current || isMobile) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const moveX = (mouseX - rect.width / 2) / 20;
    const moveY = (mouseY - rect.height / 2) / 20;
    
    const image = cardRef.current.querySelector('img');
    if (image) {
      image.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.1)`;
    }
  };

  const handleMouseLeave = (cardRef) => {
    if (!cardRef.current) return;
    
    const image = cardRef.current.querySelector('img');
    if (image) {
      image.style.transform = 'translate(0, 0) scale(1)';
    }
  };

  const calculateTranslateX = () => {
    const cardWidth = isMobile ? 100 : 33.33;
    return `-${activeSlide * cardWidth}%`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16"
      style={{
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary
      }}
    >
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-center text-3xl sm:text-4xl lg:text-5xl font-bold mb-8 sm:mb-16"
        style={{ color: theme.palette.text.primary }}
      >
        FEATURED BLOG <span style={{ color: theme.palette.primary.main }}>POSTS</span>
      </motion.h1>
      
      <div className="space-y-4">
        {/* Image Carousel */}
        <div className="relative w-full mx-auto overflow-hidden rounded-lg">
          <div 
            className="flex transition-transform duration-700 ease-in-out"
            style={{ 
              transform: `translateX(${calculateTranslateX()})`,
            }}
          >
            {blogPosts.map((post, index) => (
              <div
                key={index}
                className={`${isMobile ? 'w-full' : 'w-1/3'} flex-shrink-0 px-2`}
              >
                <div 
                  ref={cardRefs.current[index]}
                  className="group relative overflow-hidden rounded-lg shadow-lg h-full"
                  onMouseMove={(e) => handleMouseMove(e, cardRefs.current[index])}
                  onMouseLeave={() => handleMouseLeave(cardRefs.current[index])}
                >
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                    className="absolute top-4 left-4 z-10 bg-white/80 px-3 sm:px-4 py-1 rounded-full"
                    style={{
                      backgroundColor: theme.palette.mode === 'light' 
                        ? 'rgba(255, 255, 255, 0.8)' 
                        : 'rgba(0, 0, 0, 0.8)',
                      color: theme.palette.text.primary
                    }}
                  >
                    <span className="italic text-xs sm:text-sm">{post.category}</span>
                  </motion.div>
                  
                  <div className="relative h-96 sm:h-[500px] overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.alt}
                      className="w-full h-full object-cover absolute top-0 left-0 transition-transform duration-300 ease-out"
                      style={{
                        transform: 'translate(0, 0) scale(1)',
                        objectPosition: '50% 50%'
                      }}
                    />
                  </div>
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 sm:p-6 text-center"
                  >
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center justify-center text-white/80 text-xs sm:text-sm space-x-2">
                        <span>{post.date}</span>
                        <span>•</span>
                        <span>by {post.author}</span>
                      </div>
                      <h3 className="text-white text-lg sm:text-xl font-bold px-2 sm:px-4">{post.title}</h3>
                    </div>
                  </motion.div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Smaller Linear Indicators */}
        <div className="flex justify-center gap-3 sm:gap-4 mt-8">
          {[...Array(isMobile ? blogPosts.length : blogPosts.length - 2)].map((_, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, scaleX: 0 }}
              whileInView={{ opacity: 1, scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
              onClick={() => setActiveSlide(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === activeSlide 
                  ? 'w-12 sm:w-16' 
                  : 'w-8 sm:w-10'
              }`}
              style={{
                backgroundColor: index === activeSlide 
                  ? theme.palette.primary.main
                  : theme.palette.mode === 'light' 
                    ? '#e2e8f0' 
                    : '#4a5568'
              }}
            />
          ))}
        </div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="mt-8 sm:mt-12 text-center"
      >
        <button 
          className="relative px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-semibold text-sm sm:text-base overflow-hidden group"
          style={{
            backgroundColor: theme.palette.button.main,
            color: theme.palette.button.contrastText,
          }}
        >
          <span className="relative z-10">View More</span>
          <div 
            className="absolute inset-0 transform scale-x-0 origin-left transition-transform duration-300 ease-out group-hover:scale-x-100"
            style={{
              background: theme.palette.button.hoverGradient,
              animation: theme.palette.button.hoverAnimation,
              backgroundSize: '200% 200%'
            }}
          />
        </button>
      </motion.div>
    </motion.div>
  );
};

export default JourneyStories;