// ImageCarousel.js
import React from 'react';
import './ImageCarousel.css';

const destinations = [
  {
    image: '/assets/destinations/hawaii.jpg',
    title: 'TROPICAL PARADISE',
    subtitle: 'DISCOVER PARADISE IN',
    location: 'HAWAII, USA',
    price: 'USD 2,345 /-'
  },
  {
    image: '/assets/destinations/louvre.jpg',
    title: 'PARIS',
    subtitle: 'ART AND CULTURE IN',
    location: 'PARIS, FRANCE',
    price: 'EUR 3,456 /-'
  },
  {
    image: '/assets/destinations/sydney.jpg',
    title: 'SYDNEY',
    subtitle: 'URBAN COASTAL CHARM OF',
    location: 'SYDNEY, AUSTRALIA',
    price: 'AUD 4,567 /-'
  },
  {
    image: '/assets/destinations/dubai.jpg',
    title: 'DUBAI',
    subtitle: 'MODERN MARVEL OF',
    location: 'DUBAI, UAE',
    price: 'AED 5,678 /-'
  },
  {
    image: '/assets/destinations/alps.jpg',
    title: 'THE ALPS',
    subtitle: 'MOUNTAIN MAJESTY OF',
    location: 'SWITZERLAND',
    price: 'CHF 6,789 /-'
  }
];

const ImageCarousel = () => {
  const carouselDestinations = [...destinations, ...destinations];

  return (
    <div className="image-carousel">
      <div className="carousel-track">
        {carouselDestinations.map((dest, index) => (
          <div key={index} className="carousel-item">
            <img 
              src={dest.image} 
              alt={dest.title}
            />
            <div className="carousel-content">
              <p className="subtitle">{dest.subtitle}</p>
              <div className="details">
                <h3 className="title">{dest.title}</h3>
                <p className="location">{dest.location}</p>
                <p className="price-text">
                  Starts from
                  <span className="price">{dest.price}</span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageCarousel;