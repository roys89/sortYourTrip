import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';

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
    testimony: 'Lorem ipsum dolor sit amet, consectetur at cupidatat non proident,sunt in culpa qui officia deserunt mollit anim id est laborum.'
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
    testimony: 'Another wonderful testimonial about the amazing travel experience.'
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
    testimony: 'A glowing review of the incredible journey and experiences.'
  },
  {
    name: 'Mike Johnson',
    avatar: '/assets/testimony/avatar/2m.jpg',
    images: [
      '/assets/testimony/images/013.jpg',
      '/assets/testimony/images/014.jpg',
      '/assets/testimony/images/015.jpg',
      '/assets/testimony/images/016.jpg'
    ],
    rating: 5,
    quote: "Unforgettable memories made",
    testimony: 'Sharing memories of an unforgettable travel experience.'
  },
  {
    name: 'Emily Davis',
    avatar: '/assets/testimony/avatar/3f.jpg',
    images: [
      '/assets/testimony/images/017.jpg',
      '/assets/testimony/images/018.jpg',
      '/assets/testimony/images/019.jpg',
      '/assets/testimony/images/020.jpg'
    ],
    rating: 5,
    quote: "Perfect vacation planning",
    testimony: 'Describing the perfectly planned vacation experience.'
  }
];

const Testimony = () => {
  const [activeIndex, setActiveIndex] = useState(2);
  const [direction, setDirection] = useState(0);
  const avatarSize = 100;

  const moveSlider = (newDirection) => {
    setDirection(newDirection === 'next' ? 1 : -1);
    setActiveIndex(prev => {
      if (newDirection === 'next') {
        return prev === testimonials.length - 1 ? 0 : prev + 1;
      }
      return prev === 0 ? testimonials.length - 1 : prev - 1;
    });
  };

  const getVisibleAvatars = () => {
    let visibleOnes = [];
    const totalItems = testimonials.length;

    for (let i = -2; i <= 2; i++) {
      let index = (activeIndex + i + totalItems) % totalItems;
      visibleOnes.push({
        data: testimonials[index],
        offset: i,
        index
      });
    }
    return visibleOnes;
  };

  return (
    <div className="max-w-6xl mx-auto py-16">
      <h2 className="text-center text-4xl font-bold text-teal-900 mb-2">
        Stories From Our Journey-Takers
      </h2>
      
      <p className="text-center text-teal-600 text-lg mb-12">
        Real travelers, real stories. See what they have to say about their journeys!
      </p>

      {/* Avatar Carousel */}
      <div className="relative h-64 flex items-center justify-center mb-8">
        <button
          onClick={() => moveSlider('prev')}
          className="absolute left-0 md:left-32 p-2 bg-teal-900 text-white rounded-full hover:bg-teal-600 transition-colors z-10"
        >
          <ChevronLeft size={24} />
        </button>

        <div className="flex items-center justify-center relative h-full overflow-hidden"
             style={{ width: 'calc(100% - 256px)' }}>
          <AnimatePresence initial={false} custom={direction}>
            <motion.div 
              key={activeIndex}
              className="flex items-center justify-center gap-16 absolute"
              custom={direction}
              initial={{ x: direction > 0 ? 500 : -500 }}
              animate={{ x: 0 }}
              exit={{ x: direction > 0 ? -500 : 500 }}
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 }
              }}
            >
              {getVisibleAvatars().map(({ data, offset, index }) => (
                <motion.div
                  key={index}
                  animate={{
                    scale: offset === 0 ? 1.5 : 1,
                    opacity: offset === 0 ? 1 : 0.5,
                    filter: offset === 0 ? 'grayscale(0%)' : 'grayscale(40%)'
                  }}
                  transition={{
                    duration: 0.5,
                    ease: "easeInOut"
                  }}
                  style={{
                    width: avatarSize,
                    height: avatarSize
                  }}
                  className="flex-shrink-0"
                >
                  <img
                    src={data.avatar}
                    alt={data.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        <button
          onClick={() => moveSlider('next')}
          className="absolute right-0 md:right-32 p-2 bg-teal-900 text-white rounded-full hover:bg-teal-600 transition-colors z-10"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Testimonial Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-8"
        >
          <div className="text-center">
            <div className="text-3xl text-teal-900 mb-2">
              {'★'.repeat(testimonials[activeIndex].rating)}
            </div>
            <h3 className="text-3xl font-bold text-teal-900">
              {testimonials[activeIndex].name}
            </h3>
          </div>

          <div className="bg-orange-50 rounded-2xl p-8 shadow-lg">
            <div className="grid grid-cols-2 gap-8">
              {/* Left Side */}
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-40 h-40 rounded-full overflow-hidden mb-6">
                  <img
                    src={testimonials[activeIndex].avatar}
                    alt={testimonials[activeIndex].name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-teal-600 text-lg leading-relaxed max-w-md">
                  {testimonials[activeIndex].testimony}
                </p>
              </div>

              {/* Right Side - Images */}
              <div className="grid grid-cols-2 gap-4">
                {testimonials[activeIndex].images.map((image, idx) => (
                  <img
                    key={idx}
                    src={image}
                    alt={`Travel moment ${idx + 1}`}
                    className="w-full aspect-square object-cover rounded-lg transition-transform duration-300 hover:scale-105"
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Testimony;