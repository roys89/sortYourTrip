import React, { useEffect, useRef, useState } from 'react';

const FeaturedBlog = () => {
  const [activeSlide, setActiveSlide] = useState(0);
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
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % blogPosts.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [blogPosts.length]);

  const getVisibleIndexes = () => {
    const indexes = [];
    for (let i = 0; i < 3; i++) {
      indexes.push((activeSlide + i) % blogPosts.length);
    }
    return indexes;
  };

  const handleMouseMove = (e, cardRef) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate movement based on mouse position
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

  return (
    <div className="w-[1200px] mx-auto py-16">
      <h1 className="text-center text-5xl font-bold mb-16">
        FEATURED BLOG <span className="text-green-600">POSTS</span>
      </h1>
      
      <div className="relative w-[1160px] mx-auto overflow-hidden">
        <div className="flex gap-5">
          {blogPosts.map((post, index) => {
            const visibleIndexes = getVisibleIndexes();
            const isVisible = visibleIndexes.includes(index);
            
            return (
              <div
                key={index}
                className={`w-[370px] flex-shrink-0 transition-all duration-700 ease-in-out transform ${
                  isVisible ? 'opacity-100 translate-x-0' : 
                  index < activeSlide ? 'opacity-0 -translate-x-full' : 
                  'opacity-0 translate-x-full'
                }`}
                style={{
                  transform: `translateX(-${activeSlide * (370 + 20)}px)`
                }}
              >
                <div 
                  ref={cardRefs.current[index]}
                  className="group relative overflow-hidden rounded-lg shadow-lg"
                  onMouseMove={(e) => handleMouseMove(e, cardRefs.current[index])}
                  onMouseLeave={() => handleMouseLeave(cardRefs.current[index])}
                >
                  <div className="absolute top-4 left-4 z-10 bg-white/80 px-4 py-1 rounded-full">
                    <span className="text-gray-600 italic text-sm">{post.category}</span>
                  </div>
                  
                  <div className="relative h-[500px] overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.alt}
                      className="w-full h-[600px] object-cover absolute top-0 left-0 transition-transform duration-300 ease-out"
                      style={{
                        transform: 'translate(0, 0) scale(1)',
                        objectPosition: '50% 50%'
                      }}
                    />
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-center">
                    <div className="space-y-3">
                      <div className="flex items-center justify-center text-white/80 text-sm space-x-2">
                        <span>{post.date}</span>
                        <span>•</span>
                        <span>by {post.author}</span>
                      </div>
                      <h3 className="text-white text-xl font-bold px-4">{post.title}</h3>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {blogPosts.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveSlide(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === activeSlide ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>
      
      <div className="mt-12 text-center">
        <button className="px-8 py-3 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition-colors duration-300 transform hover:scale-105">
          View More
        </button>
      </div>
    </div>
  );
};

export default FeaturedBlog;