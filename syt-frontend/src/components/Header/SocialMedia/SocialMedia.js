import { Box, IconButton, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { Facebook, Instagram, Linkedin, Twitter } from 'lucide-react';
import React from 'react';

const SocialMediaSection = () => {
  const socialLinks = [
    { Icon: Instagram, url: '#', label: 'Instagram' },
    { Icon: Facebook, url: '#', label: 'Facebook' },
    { Icon: Linkedin, url: '#', label: 'LinkedIn' },
    { Icon: Twitter, url: '#', label: 'Twitter' }
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
        textAlign: 'center'
      }}
    >
      <Typography
        variant="h2"
        component="h2"
        sx={{
          fontWeight: 'bold',
          mb: 4,
          fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3rem' },
          color: '#004D40'
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
        {socialLinks.map(({ Icon, url, label }) => (
          <motion.div
            key={label}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <IconButton
              href={url}
              aria-label={label}
              sx={{
                width: { xs: 48, sm: 64 },
                height: { xs: 48, sm: 64 },
                bgcolor: '#004D40',
                color: 'white',
                '&:hover': {
                  bgcolor: '#00695C'
                }
              }}
            >
              <Icon size={32} />
            </IconButton>
          </motion.div>
        ))}
      </Box>
    </Box>
  );
};

export default SocialMediaSection;