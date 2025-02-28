import { X as XIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { Facebook, Instagram, Linkedin } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

const SocialMediaSection = () => {
  const theme = useTheme();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const socialLinks = [
    { Icon: Instagram, url: 'https://www.instagram.com/sortyourtrip', label: 'Instagram' },
    { Icon: Facebook, url: 'https://www.facebook.com/sortyourtrip', label: 'Facebook' },
    { Icon: XIcon, url: 'https://x.com/sortyourtrip', label: 'X' },
    { Icon: Linkedin, url: 'https://www.linkedin.com/company/sortyourtrip', label: 'LinkedIn' }
  ];

  const column1Posts = [
    {
      imgSrc: "/assets/posts/post1.jpg",
      alt: "Vows to Wows post"
    },
    {
      imgSrc: "/assets/posts/post2.jpg",
      alt: "Hey Alike Bali post"
    },
    {
      imgSrc: "/assets/posts/post3.jpg",
      alt: "Social media update"
    }
  ];

  const column2Posts = [
    {
      imgSrc: "/assets/posts/post4.jpg",
      alt: "Infinite memories post"
    },
    {
      imgSrc: "/assets/posts/post5.jpg",
      alt: "Welcome to team post"
    },
    {
      imgSrc: "/assets/posts/post6.jpg",
      alt: "Social media update"
    }
  ];

  const FloatingColumn = ({ posts, direction = 'up' }) => {
    const [isHovered, setIsHovered] = useState(false);
    const containerRef = useRef(null);
    const animationRef = useRef(null);
    const lastTimeRef = useRef(null);
    const lastPositionRef = useRef(direction === 'up' ? 0 : -posts.length * (isMobile ? 260 : 340) / 2);
    
    const containerHeight = isMobile ? 480 : 580;
    const singleHeight = isMobile ? 260 : 340;
    const totalHeight = posts.length * singleHeight;
    const loopedPosts = [...posts, ...posts];
    const duration = isMobile ? 10 : 12;
    const pixelsPerMs = totalHeight / 2 / (duration * 1000);

    useEffect(() => {
      const animate = (timestamp) => {
        if (!lastTimeRef.current) {
          lastTimeRef.current = timestamp;
        }

        if (isHovered) {
          lastTimeRef.current = timestamp;
          animationRef.current = requestAnimationFrame(animate);
          return;
        }

        const deltaTime = timestamp - lastTimeRef.current;
        lastTimeRef.current = timestamp;

        if (direction === 'up') {
          lastPositionRef.current -= deltaTime * pixelsPerMs;
          if (lastPositionRef.current <= -totalHeight / 2) {
            lastPositionRef.current = 0;
          }
        } else {
          lastPositionRef.current += deltaTime * pixelsPerMs;
          if (lastPositionRef.current >= 0) {
            lastPositionRef.current = -totalHeight / 2;
          }
        }

        if (containerRef.current) {
          containerRef.current.style.transform = `translateY(${lastPositionRef.current}px)`;
        }
        
        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }, [isHovered, direction, totalHeight, pixelsPerMs]);

    return (
      <div 
        className="relative overflow-hidden" 
        style={{ height: containerHeight }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          ref={containerRef}
          className="transform"
          style={{
            willChange: 'transform',
            transform: `translateY(${lastPositionRef.current}px)`
          }}
        >
          {loopedPosts.map((post, index) => (
            <motion.div
              key={`${post.alt}-${index}`}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="mb-6"
            >
              <div
                className="w-full overflow-hidden rounded-lg cursor-pointer shadow-md transition-transform duration-300 hover:scale-105"
                style={{ 
                  height: singleHeight,
                  backgroundColor: theme.palette.background.paper
                }}
              >
                <img
                  src={post.imgSrc}
                  alt={post.alt}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div 
      className="w-full flex items-center min-h-[550px] md:min-h-[600px] py-10"
      style={{
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(${theme.palette.primary.main} 1px, transparent 1px)`,
          backgroundSize: '30px 30px'
        }}
      />

      <div className="w-[90%] mx-auto flex flex-col md:flex-row gap-8 md:gap-12 items-center relative z-10">
        {/* Left side - Content */}
        <div className="flex-1 md:flex-[1.2] flex flex-col items-center md:items-start text-center md:text-left md:pr-8">
          <motion.h2 
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{ color: theme.palette.text.primary }}
          >
            Stay updated
          </motion.h2>
          
          <motion.p 
            className="text-xl md:text-2xl mb-8 max-w-[90%] leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ color: theme.palette.text.secondary }}
          >
            Follow us on social media to stay updated on how today's travellers explore the world, 
            discover exciting offers, and see the impact of experiences on the future of travel.
          </motion.p>

          <div className="flex gap-6 flex-wrap justify-center md:justify-start">
            {socialLinks.map(({ Icon, url, label }, index) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative w-14 h-14 md:w-20 md:h-20 flex items-center justify-center rounded-full overflow-hidden group"
                  style={{
                    backgroundColor: theme.palette.button.main,
                    color: theme.palette.button.contrastText,
                  }}
                >
                  <Icon 
                    sx={{ fontSize: isMobile ? 24 : 32 }}
                    className="relative z-10 transition-transform duration-300 group-hover:scale-110" 
                  />
                  <div 
                    className="absolute inset-0 transform scale-x-0 origin-left transition-transform duration-300 ease-out group-hover:scale-x-100"
                    style={{
                      background: theme.palette.button.hoverGradient,
                      animation: theme.palette.button.hoverAnimation,
                      backgroundSize: '200% 200%'
                    }}
                  />
                </a>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right side - Floating Images */}
        <div className="flex-1 md:flex-[0.8] w-full grid grid-cols-2 gap-3 md:gap-4 overflow-hidden relative">
          <FloatingColumn posts={column1Posts} direction="up" />
          <FloatingColumn posts={column2Posts} direction="down" />
        </div>
      </div>
    </div>
  );
};

export default SocialMediaSection;