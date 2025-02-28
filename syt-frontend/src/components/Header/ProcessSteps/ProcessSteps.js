import { useTheme } from '@mui/material/styles';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { CheckCircle2, FileText, Rocket } from 'lucide-react';
import React, { useRef } from 'react';

const ProcessSteps = () => {
  const theme = useTheme();
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const step1Transform = useTransform(scrollYProgress, [0, 0.15], [theme.palette.grey[300], theme.palette.primary.main]);
  const step2Transform = useTransform(scrollYProgress, [0.25, 0.4], [theme.palette.grey[300], theme.palette.primary.main]);
  const step3Transform = useTransform(scrollYProgress, [0.5, 0.65], [theme.palette.grey[300], theme.palette.primary.main]);

  const steps = [
    {
      number: '01',
      title: 'Personalize your itinerary',
      description: 'Answer a few simple questions about your interests and get a personalized itinerary catered to your unique preferences and travel goals.',
      Icon: FileText,
      colorTransform: step1Transform
    },
    {
      number: '02',
      title: 'Customize your trip',
      description: 'Go one step further with the help of our user-friendly trip organizer that allows you to customize activities and hotels seamlessly.',
      Icon: Rocket,
      colorTransform: step2Transform
    },
    {
      number: '03',
      title: 'Sort Your Trip',
      description: 'Get your trip sorted with SortYourTrip by booking all your experiences in one place and avoiding countless hours browsing and booking from multiple sites.',
      Icon: CheckCircle2,
      colorTransform: step3Transform
    }
  ];

  return (
    <div ref={containerRef} className="relative w-full py-16">
      {/* Desktop Center Line */}
      <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 transform -translate-x-1/2">
        <motion.div 
          className="absolute top-0 bottom-0 w-full"
          style={{ 
            backgroundColor: theme.palette.primary.main,
            scaleY,
            transformOrigin: 'top'
          }}
        />
        {/* End Circle */}
        <motion.div 
          className="absolute -bottom-4 left-1/2 w-4 h-4 rounded-full transform -translate-x-1/2"
          style={{
            backgroundColor: theme.palette.grey[300],
            opacity: 1
          }}
        >
          <motion.div 
            className="absolute inset-0 rounded-full origin-center"
            style={{
              backgroundColor: theme.palette.primary.main,
              opacity: useSpring(
                useTransform(
                  scrollYProgress,
                  [0.99, 1],
                  [0, 1]
                ),
                {
                  stiffness: 50,
                  damping: 20
                }
              ),
              scale: useSpring(
                useTransform(
                  scrollYProgress,
                  [0.99, 1],
                  [0.6, 1]
                ),
                {
                  stiffness: 50,
                  damping: 20
                }
              )
            }}
          />
        </motion.div>
      </div>

      {/* Steps */}
      <div className="relative w-full md:px-12 space-y-20">
        {steps.map(({ number, title, description, Icon, colorTransform }, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className={`flex items-center gap-12 ${
              index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
            } flex-col pl-4 md:pl-0`}
          >
            {/* Content Side */}
            <div className={`flex-1 ${index % 2 === 0 ? 'md:text-right' : 'md:text-left'} text-left`}>
              <motion.div 
                className="text-4xl md:text-6xl font-bold mb-4"
                style={{
                  color: colorTransform
                }}
              >
                {number}
              </motion.div>
              <motion.h3 
                className="text-2xl md:text-3xl font-semibold mb-4"
                style={{ 
                  color: colorTransform
                }}
              >
                {title}
              </motion.h3>
              <motion.p 
                className="text-base md:text-lg leading-relaxed max-w-xl"
                style={{ 
                  color: colorTransform
                }}
              >
                {description}
              </motion.p>
            </div>

            {/* Icon Side */}
            <div className="flex-1">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className={`relative flex ${index % 2 === 0 ? 'md:justify-start justify-start' : 'md:justify-end justify-start'}`}
              >
                <motion.div 
                  style={{ color: colorTransform }}
                  whileHover={{ 
                    scale: 1.1,
                    transition: { duration: 0.2 }
                  }}
                  animate={{
                    rotate: [0, 5, -5, 0],
                    transition: {
                      duration: 5,
                      ease: "easeInOut",
                      repeat: Infinity,
                    }
                  }}
                >
                  <Icon size={90} strokeWidth={1.5} />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ProcessSteps;