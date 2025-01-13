import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import React, { useEffect, useRef, useState } from 'react';

mapboxgl.accessToken = 'pk.eyJ1Ijoicm95c3l0IiwiYSI6ImNtM3ljc2Z2bzFmNXUyanM1M2owbDVuaTYifQ.Tnqj3lh2w7reW4mc9xE3rQ';

// Suppress Mapbox GL JS analytics warnings
const originalWarn = console.warn;
console.warn = function(...args) {
  if (args[0]?.includes?.('Mapbox GL JS is disabled') || 
      args[0]?.includes?.('Failed to post events')) {
    return;
  }
  originalWarn.apply(console, args);
};

const ItineraryMap = ({ itineraryData }) => {
  const [map, setMap] = useState(null);
  const [error, setError] = useState(null);
  const mapContainerRef = useRef(null);
  const markersRef = useRef([]);
  const routesRef = useRef([]);

  const processItineraryData = (data) => {
    const locations = [];
    const routeSegments = [];
    
    // Process each city
    data.cities.forEach((city, cityIndex) => {
      // Process each day in the city
      city.days.forEach((day) => {
        // Process flights
        if (day.flights && day.flights.length > 0) {
          day.flights.forEach(flight => {
            const { originAirport, arrivalAirport } = flight.flightData;
            
            // Add origin airport
            locations.push({
              coordinates: [originAirport.location.longitude, originAirport.location.latitude],
              name: originAirport.name,
              description: `${originAirport.city} (${originAirport.code})`,
              type: 'airport'
            });
            
            // Add destination airport
            locations.push({
              coordinates: [arrivalAirport.location.longitude, arrivalAirport.location.latitude],
              name: arrivalAirport.name,
              description: `${arrivalAirport.city} (${arrivalAirport.code})`,
              type: 'airport'
            });
            
            // Add flight route
            routeSegments.push({
              from: [originAirport.location.longitude, originAirport.location.latitude],
              to: [arrivalAirport.location.longitude, arrivalAirport.location.latitude],
              type: 'flight'
            });
          });
        }
        
        // Process hotels
        if (day.hotels && day.hotels.length > 0) {
          day.hotels.forEach(hotel => {
            if (hotel.success && hotel.data?.hotelDetails) {
              const hotelDetails = hotel.data.hotelDetails;
              
              locations.push({
                coordinates: [
                  parseFloat(hotelDetails.geolocation.long),
                  parseFloat(hotelDetails.geolocation.lat)
                ],
                name: hotelDetails.name,
                description: `${hotelDetails.address.city.name}, ${hotelDetails.address.country.name}`,
                type: 'hotel'
              });
            }
          });
        }
        
        // Process transfers
        if (day.transfers && day.transfers.length > 0) {
          day.transfers.forEach(transfer => {
            const { origin, destination } = transfer.details;
            
            if (origin && destination && origin.lat && origin.long && destination.lat && destination.long) {
              routeSegments.push({
                from: [parseFloat(origin.long), parseFloat(origin.lat)],
                to: [parseFloat(destination.long), parseFloat(destination.lat)],
                type: 'transfer'
              });
            }
          });
        }
      });
    });
    
    return { locations, routeSegments };
  };

  useEffect(() => {
    try {
      if (!mapboxgl.supported()) {
        throw new Error('Your browser does not support Mapbox GL');
      }

      const { locations, routeSegments } = processItineraryData(itineraryData);

      if (!mapContainerRef.current) return;

      const mapInstance = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/light-v10',
        center: [55.296249, 25.276987], // Dubai coordinates as default center
        zoom: 3
      });

      mapInstance.addControl(new mapboxgl.NavigationControl());

      mapInstance.on('load', () => {
        // Add markers
        locations.forEach(location => {
          let markerColor;
          switch(location.type) {
            case 'airport':
              markerColor = '#1976d2';
              break;
            case 'hotel':
              markerColor = '#4CAF50';
              break;
            default:
              markerColor = '#FFA000';
          }
          
          const marker = new mapboxgl.Marker({
            color: markerColor
          })
            .setLngLat(location.coordinates)
            .setPopup(
              new mapboxgl.Popup({ offset: 25 })
                .setHTML(
                  `<div class="p-2">
                    <h3 class="font-bold mb-1">${location.name}</h3>
                    <p>${location.description}</p>
                  </div>`
                )
            )
            .addTo(mapInstance);
            
          markersRef.current.push(marker);
        });

        // Add route lines
        routeSegments.forEach((segment, index) => {
          const sourceId = `route-${index}`;
          const layerId = `route-line-${index}`;

          mapInstance.addSource(sourceId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: [segment.from, segment.to]
              }
            }
          });

          mapInstance.addLayer({
            id: layerId,
            type: 'line',
            source: sourceId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': segment.type === 'flight' ? '#1976d2' : '#4CAF50',
              'line-width': 2,
              'line-dasharray': segment.type === 'flight' ? [2, 2] : [1]
            }
          });

          routesRef.current.push({ sourceId, layerId });
        });

        // Fit bounds to show all markers
        const bounds = new mapboxgl.LngLatBounds();
        locations.forEach(location => {
          bounds.extend(location.coordinates);
        });
        mapInstance.fitBounds(bounds, { padding: 50 });
      });

      setMap(mapInstance);

      return () => {
        mapInstance.remove();
        markersRef.current = [];
        routesRef.current = [];
      };
    } catch (err) {
      setError(err.message);
    }
  }, [itineraryData]);

  if (error) {
    return (
      <div className="w-full p-4 bg-red-50 text-red-600 rounded-lg">
        <p>Error loading map: {error}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Travel Route</h2>
        <div 
          ref={mapContainerRef} 
          className="w-full h-96 rounded-lg overflow-hidden"
        />
        <div className="flex gap-4 mt-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-600 rounded-full mr-2" />
            <span>Airports & Flights</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-600 rounded-full mr-2" />
            <span>Hotels & Transfers</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItineraryMap;