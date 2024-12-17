import { Box, CircularProgress, Typography } from '@mui/material';
import { MapPin, Plane } from 'lucide-react';
import React from 'react';

const LoadingSpinner = ({ message = 'Planning Your Adventure...' }) => {
  return (
    <Box 
      display="flex" 
      flexDirection="column" 
      justifyContent="center" 
      alignItems="center" 
      minHeight="100vh"
      position="relative"
      sx={{
        backgroundColor: '#f0f8ff', // Light blue background
        overflow: 'hidden'
      }}
    >
      <Box 
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 10
        }}
      >
        {/* Animated Circular Progress */}
        <Box sx={{ position: 'relative', mb: 3 }}>
          <CircularProgress 
            size={80} 
            thickness={4}
            sx={{
              color: '#1976d2', // Material blue
              position: 'absolute',
              animation: 'pulse 1.5s infinite'
            }}
          />
          
          {/* Overlay Travel Icons */}
          <Box 
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MapPin 
              size={40} 
              color="#1976d2"
              style={{
                animation: 'bounce 1.5s infinite',
                position: 'absolute',
                zIndex: 20
              }}
            />
          </Box>
        </Box>

        {/* Loading Message */}
        <Typography 
          variant="h6" 
          color="primary"
          sx={{ 
            mt: 10,
            fontWeight: 'bold',
            animation: 'pulse 1.5s infinite',
            textAlign: 'center'
          }}
        >
          {message}
        </Typography>
      </Box>

      {/* Animated Background Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '20%',
          right: '10%',
          animation: 'fly 3s linear infinite',
          zIndex: 5
        }}
      >
        <Plane size={50} color="#1976d2" />
      </Box>

      {/* Custom Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes fly {
          0% { transform: translate(0, 0) rotate(45deg); }
          50% { transform: translate(-50px, 50px) rotate(45deg); }
          100% { transform: translate(0, 0) rotate(45deg); }
        }
      `}</style>
    </Box>
  );
};

export default LoadingSpinner;