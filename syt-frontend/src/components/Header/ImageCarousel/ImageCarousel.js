// src/components/Header/ImageCarousel/ImageCarousel.js
import { motion } from 'framer-motion';
import React from 'react';
import './ImageCarousel.css';

const ImageCarousel = () => {
  const images = [
    '/assets/destinations/hawaii.jpg',
    '/assets/destinations/louvre.jpg',
    '/assets/destinations/sydney.jpg',
    '/assets/destinations/coast.jpg',
    '/assets/destinations/paris.jpg',
    '/assets/destinations/dubai.jpg',
    '/assets/destinations/alps.jpg'
  ];

  return (
    <div className="image-carousel">
      <div className="carousel-track">
        {images.concat(images).map((src, index) => (
          <motion.div
            key={index}
            className="carousel-item"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            viewport={{ once: true }}
          >
            <img src={src} alt={`Destination ${index + 1}`} />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ImageCarousel;