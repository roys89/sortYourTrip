// FeatureCards.js
import { useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import {
  Package,
  Rocket,
  Sparkles,
  Zap
} from 'lucide-react';
import React from 'react';

const FeatureCards = () => {
  const theme = useTheme();
  
  const features = [
    { Icon: Rocket, title: 'Book Instantly', delay: 0 },
    { Icon: Sparkles, title: 'Instant Custom', delay: 0.1 },
    { Icon: Package, title: 'All-in-One', delay: 0.2 },
    { Icon: Zap, title: 'Save Time', delay: 0.3 }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-6xl mx-auto px-3 sm:px-6 md:px-8"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-8 md:gap-10">
        {features.map(({ Icon, title, delay }, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay }}
            whileTap={{ scale: 0.95 }}
            whileHover={{ y: -8 }}
            className="feature-card"
          >
            <div 
              className="aspect-square relative rounded-2xl sm:rounded-3xl p-2 sm:p-6"
              style={{
                backgroundColor: theme.palette.background.paper,
                boxShadow: `0 4px 6px -1px ${theme.palette.primary.main}20`
              }}
            >
              <div className="h-full flex flex-col items-center justify-center space-y-2 sm:space-y-6">
                <motion.div 
                  animate={{ 
                    y: [0, -4, 0],
                    rotate: [0, 0, 0]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "easeInOut" 
                  }}
                  className="relative w-12 h-12 sm:w-24 sm:h-24 md:w-28 md:h-28 
                            rounded-full flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    backgroundSize: '200% 200%'
                  }}
                >
                  <Icon 
                    className="w-7 h-7 sm:w-14 sm:h-14 md:w-16 md:h-16 text-white"
                    strokeWidth={1.5}
                  />
                  <motion.div 
                    animate={{ 
                      opacity: [0, 0.2, 0]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 rounded-full blur-xl"
                    style={{ backgroundColor: theme.palette.primary.main }}
                  />
                </motion.div>
                <h3 
                  className="text-sm sm:text-xl md:text-2xl font-semibold text-center px-1 sm:px-2"
                  style={{ color: theme.palette.text.primary }}
                >
                  {title}
                </h3>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default FeatureCards;