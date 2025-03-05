import { Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import React from 'react';

// This component ensures consistent icon styling and animations across the app
export const IconContainer = ({ 
  icon: Icon, 
  size = 20,
  color = "primary", // "primary", "secondary", or any color string
  background = true,
  backgroundOpacity = 0.15,
  animate = false 
}) => {
  const theme = useTheme();
  
  // Determine icon color based on theme
  const getIconColor = () => {
    if (color === "primary") return theme.palette.primary.main;
    if (color === "secondary") return theme.palette.secondary.main;
    return color;
  };
  
  const iconColor = getIconColor();
  
  return (
    <div 
      className="icon-container"
      style={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size * 1.6,
        height: size * 1.6,
        borderRadius: '12px',
        backgroundColor: background 
          ? `${iconColor}${Math.round(backgroundOpacity * 255).toString(16).padStart(2, '0')}`
          : 'transparent',
        transition: 'all 0.3s ease'
      }}
    >
      {animate ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          whileHover={{ scale: 1.1, rotate: 5 }}
        >
          <Icon size={size} color={iconColor} strokeWidth={2} />
        </motion.div>
      ) : (
        <Icon size={size} color={iconColor} strokeWidth={2} />
      )}
    </div>
  );
};

// Example usage with typography
export const IconWithText = ({ icon: Icon, text, size = 20, color = "primary" }) => {
  const theme = useTheme();
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <IconContainer 
        icon={Icon} 
        size={size} 
        color={color}
      />
      <Typography 
        sx={{ color: theme.palette.text.primary }}
      >
        {text}
      </Typography>
    </div>
  );
};

export default IconContainer;