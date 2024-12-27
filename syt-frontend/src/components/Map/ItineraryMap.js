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
    
    data.cities.forEach((city, cityIndex) => {
      let lastCityHotel = null;
      
      city.days.forEach((day, dayIndex) => {
        // First day flights and arrival
        if (dayIndex === 0 && day.flights?.length > 0) {
          const firstFlight = day.flights[0];
          const { originAirport, arrivalAirport } = firstFlight.flightData;
          
          locations.push({
            coordinates: [originAirport.location.longitude, originAirport.location.latitude],
            name: originAirport.name,
            description: `${originAirport.city} (${originAirport.code})`,
            type: 'airport'
          });
          
          locations.push({
            coordinates: [arrivalAirport.location.longitude, arrivalAirport.location.latitude],
            name: arrivalAirport.name,
            description: `${arrivalAirport.city} (${arrivalAirport.code})`,
            type: 'airport'
          });
          
          routeSegments.push({
            from: [originAirport.location.longitude, originAirport.location.latitude],
            to: [arrivalAirport.location.longitude, arrivalAirport.location.latitude],
            type: 'flight'
          });
          
          // If there's a hotel on arrival day, add route from airport to hotel
          if (day.hotels?.length > 0) {
            const firstHotel = day.hotels[0];
            routeSegments.push({
              from: [arrivalAirport.location.longitude, arrivalAirport.location.latitude],
              to: [firstHotel.hotel_details.geolocation.longitude, firstHotel.hotel_details.geolocation.latitude],
              type: 'ground'
            });
          }
        }
        
        // Hotels
        if (day.hotels?.length > 0) {
          const hotel = day.hotels[0];
          locations.push({
            coordinates: [hotel.hotel_details.geolocation.longitude, hotel.hotel_details.geolocation.latitude],
            name: hotel.name,
            description: city.city,
            type: 'hotel'
          });
          lastCityHotel = hotel;
        }
        
        // City transitions
        if (cityIndex < data.cities.length - 1 && dayIndex === city.days.length - 1) {
          const nextCity = data.cities[cityIndex + 1];
          const nextCityFirstDay = nextCity.days[0];
          const nextCityFirstHotel = nextCityFirstDay.hotels?.[0];
          
          if (lastCityHotel && nextCityFirstHotel) {
            routeSegments.push({
              from: [lastCityHotel.hotel_details.geolocation.longitude, lastCityHotel.hotel_details.geolocation.latitude],
              to: [nextCityFirstHotel.hotel_details.geolocation.longitude, nextCityFirstHotel.hotel_details.geolocation.latitude],
              type: 'ground'
            });
          }
        }

        // Final departure
        if (cityIndex === data.cities.length - 1 && dayIndex === city.days.length - 1 && day.flights?.length > 0) {
          const lastFlight = day.flights[0];
          const { originAirport, arrivalAirport } = lastFlight.flightData;
          
          // Route from last hotel to departure airport
          if (lastCityHotel) {
            routeSegments.push({
              from: [lastCityHotel.hotel_details.geolocation.longitude, lastCityHotel.hotel_details.geolocation.latitude],
              to: [originAirport.location.longitude, originAirport.location.latitude],
              type: 'ground'
            });
          }
          
          locations.push({
            coordinates: [originAirport.location.longitude, originAirport.location.latitude],
            name: originAirport.name,
            description: `${originAirport.city} (${originAirport.code})`,
            type: 'airport'
          });
          
          locations.push({
            coordinates: [arrivalAirport.location.longitude, arrivalAirport.location.latitude],
            name: arrivalAirport.name,
            description: `${arrivalAirport.city} (${arrivalAirport.code})`,
            type: 'airport'
          });
          
          routeSegments.push({
            from: [originAirport.location.longitude, originAirport.location.latitude],
            to: [arrivalAirport.location.longitude, arrivalAirport.location.latitude],
            type: 'flight'
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
        center: [55.296249, 25.276987],
        zoom: 3
      });

      mapInstance.addControl(new mapboxgl.NavigationControl());

      mapInstance.on('load', () => {
        // Add markers
        locations.forEach(location => {
          const markerColor = location.type === 'airport' ? '#1976d2' : '#4CAF50';
          
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
            <span>Airports</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-600 rounded-full mr-2" />
            <span>Hotels</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItineraryMap;