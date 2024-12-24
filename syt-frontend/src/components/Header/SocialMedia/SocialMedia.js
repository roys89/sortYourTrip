import XIcon from '@mui/icons-material/X';
import { Box, IconButton, Typography, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import { Facebook, Instagram, Linkedin } from 'lucide-react';
import React from 'react';

const SocialMediaSection = () => {
  const theme = useTheme();
  
  const socialLinks = [
    { Icon: Instagram, url: 'https://www.instagram.com/sortyourtrip?igsh=dWxuYWkxc2dnOTUz', label: 'Instagram', target: '_blank' },
    { Icon: Facebook, url: 'https://www.facebook.com/sortyourtrip?mibextid=LQQJ4d', label: 'Facebook', target: '_blank'},
    { Icon: Linkedin, url: 'https://www.linkedin.com/company/sortyourtrip/', label: 'LinkedIn', target: '_blank'},
    { 
      Icon: XIcon, 
      url: 'https://x.com/sortyourtrip?s=11&t=4ts-tAdSOOWAjENmwljCog', 
      label: 'X', 
      target: '_blank',
      // Special sizing for MUI icon to match Lucide icons
      props: { sx: { fontSize: 28 } }  
    }
  ];

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      sx={{
        width: '100%',
        py: { xs: 6, md: 8 },
        px: { xs: 2, md: 4 },
        textAlign: 'center',
        backgroundColor: theme.palette.background.default
      }}
    >
      <Typography
        variant="h2"
        component="h2"
        sx={{
          fontWeight: 'bold',
          mb: 4,
          fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3rem' },
          color: theme.palette.text.primary
        }}
      >
        Follow Us On Social Media For More!
      </Typography>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          gap: { xs: 2, sm: 4 },
          mt: 3
        }}
      >
        {socialLinks.map(({ Icon, url, label, target, props = {} }) => (
          <motion.div
            key={label}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <IconButton
              href={url}
              target={target}
              rel="noopener noreferrer"
              aria-label={label}
              sx={{
                width: { xs: 48, sm: 64 },
                height: { xs: 48, sm: 64 },
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.common.white,
                transition: 'all 0.3s ease',
                '&:hover': {
                  animation: theme.palette.button.hoverAnimation,
                  backgroundSize: '200% 100%'
                }
              }}
            >
              {typeof Icon === 'function' ? (
                <Icon size={32} />
              ) : (
                <Icon {...props} />
              )}
            </IconButton>
          </motion.div>
        ))}
      </Box>
    </Box>
  );
};

export default SocialMediaSection;