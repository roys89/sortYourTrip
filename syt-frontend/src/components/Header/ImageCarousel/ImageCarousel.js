import React from 'react';
import './ImageCarousel.css';

const destinations = [
  {
    image: '/assets/destinations/hawaii.jpg',
    title: 'Tropical Paradise',
    location: 'Hawaii, USA'
  },
  {
    image: '/assets/destinations/louvre.jpg',
    title: 'Art and Culture',
    location: 'Paris, France'
  },
  {
    image: '/assets/destinations/sydney.jpg',
    title: 'Urban Coastal Charm',
    location: 'Sydney, Australia'
  },
  {
    image: '/assets/destinations/coast.jpg',
    title: 'Coastal Serenity',
    location: 'Coastal Retreat'
  },
  {
    image: '/assets/destinations/paris.jpg',
    title: 'City of Lights',
    location: 'Paris, France'
  },
  {
    image: '/assets/destinations/dubai.jpg',
    title: 'Modern Marvel',
    location: 'Dubai, UAE'
  },
  {
    image: '/assets/destinations/alps.jpg',
    title: 'Mountain Majesty',
    location: 'The Alps'
  }
];

const ImageCarousel = () => {
  // Duplicate destinations to create continuous scroll
  const carouselDestinations = [...destinations, ...destinations];

  return (
    <div className="image-carousel">
      <div className="carousel-track">
        {carouselDestinations.map((dest, index) => (
          <div key={index} className="carousel-item">
            <img 
              src={dest.image} 
              alt={`Destination ${dest.title}`} 
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageCarousel;