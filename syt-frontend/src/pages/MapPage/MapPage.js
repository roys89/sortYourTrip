// src/pages/MapPage/MapPage.js
import { Box, Container, Typography } from '@mui/material';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import React, { useEffect, useRef, useState } from 'react';

// Replace with your actual Mapbox token
mapboxgl.accessToken = 'pk.eyJ1Ijoicm95c3l0IiwiYSI6ImNtM3ljc2Z2bzFmNXUyanM1M2owbDVuaTYifQ.Tnqj3lh2w7reW4mc9xE3rQ';

const MapPage = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng] = useState(2.3522); // Paris longitude
  const [lat] = useState(48.8566); // Paris latitude
  const [zoom] = useState(13);

  // Sample itinerary data
  const locations = [
    {
      name: "Eiffel Tower",
      coordinates: [2.2945, 48.8584],
      description: "Famous landmark of Paris"
    },
    {
      name: "Louvre Museum",
      coordinates: [2.3376, 48.8606],
      description: "World's largest art museum"
    },
    {
      name: "Notre-Dame",
      coordinates: [2.3522, 48.8566],
      description: "Medieval Catholic cathedral"
    }
  ];

  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom: zoom
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl());

    map.current.on('load', () => {
      // Add markers for each location
      locations.forEach(location => {
        // Create a custom marker element
        const markerEl = document.createElement('div');
        markerEl.className = 'custom-marker';
        markerEl.style.width = '24px';
        markerEl.style.height = '24px';
        markerEl.style.backgroundImage = 'url(https://cdn0.iconfinder.com/data/icons/small-n-flat/24/678111-map-marker-512.png)';
        markerEl.style.backgroundSize = 'cover';
        markerEl.style.cursor = 'pointer';

        // Add marker to map
        new mapboxgl.Marker(markerEl)
          .setLngLat(location.coordinates)
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(
                `<h3>${location.name}</h3><p>${location.description}</p>`
              )
          )
          .addTo(map.current);
      });

      // Add route line
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: locations.map(loc => loc.coordinates)
          }
        }
      });

      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#1976d2',
          'line-width': 3
        }
      });

      // Fit bounds to show all markers
      const bounds = new mapboxgl.LngLatBounds();
      locations.forEach(location => {
        bounds.extend(location.coordinates);
      });
      map.current.fitBounds(bounds, { padding: 50 });
    });

    return () => map.current.remove();
  }, [lng, lat, zoom]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Travel Route Map
      </Typography>
      <Box
        ref={mapContainer}
        sx={{
          height: '70vh',
          width: '100%',
          borderRadius: 2,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider'
        }}
      />
    </Container>
  );
};

export default MapPage;