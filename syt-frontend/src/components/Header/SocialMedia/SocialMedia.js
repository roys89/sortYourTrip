import XIcon from '@mui/icons-material/X';
import { Box, IconButton, Typography, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import { Facebook, Instagram, Linkedin } from 'lucide-react';
import React from 'react';

const SocialMediaSection = () => {
  const theme = useTheme();

  const socialLinks = [
    { Icon: Instagram, url: 'https://www.instagram.com/sortyourtrip', label: 'Instagram' },
    { Icon: Facebook, url: 'https://www.facebook.com/sortyourtrip', label: 'Facebook' },
    { Icon: XIcon, url: 'https://x.com/sortyourtrip', label: 'X', props: { sx: { fontSize: 32 } } },
    { Icon: Linkedin, url: 'https://www.linkedin.com/company/sortyourtrip', label: 'LinkedIn' }
  ];

  const column1Posts = [
    {
      imgSrc: "/assets/posts/post1.jpg",
      alt: "Vows to Wows post"
    },
    {
      imgSrc: "/assets/posts/post2.jpg",
      alt: "Hey Alike Bali post"
    },
    {
      imgSrc: "/assets/posts/post3.jpg",
      alt: "Social media update"
    }
  ];

  const column2Posts = [
    {
      imgSrc: "/assets/posts/post4.jpg",
      alt: "Infinite memories post"
    },
    {
      imgSrc: "/assets/posts/post5.jpg",
      alt: "Welcome to team post"
    },
    {
      imgSrc: "/assets/posts/post6.jpg",
      alt: "Social media update"
    }
  ];

  const getLoopedPosts = (posts) => [...posts, ...posts, ...posts, ...posts];

  const FloatingColumn = ({ posts, direction = 'up' }) => {
    const loopedPosts = getLoopedPosts(posts);
    const singleHeight = 310;
    const totalHeight = posts.length * singleHeight;
    
    return (
      <motion.div
        initial={{ y: direction === 'up' ? 0 : -totalHeight }}
        animate={{ 
          y: direction === 'up' ? -totalHeight : 0
        }}
        whileHover={{ y: 'inherit' }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop"
        }}
        style={{
          willChange: 'transform'
        }}
      >
        {loopedPosts.map((post, index) => (
          <Box
            key={`${post.alt}-${index}`}
            sx={{
              width: '100%',
              aspectRatio: '4/5',
              mb: 2,
              overflow: 'hidden',
              borderRadius: '12px',
              cursor: 'pointer'
            }}
          >
            <img
              src={post.imgSrc}
              alt={post.alt}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </Box>
        ))}
      </motion.div>
    );
  };

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: theme.palette.background.default,
        minHeight: '600px'
      }}
    >
      <Box
        sx={{
          maxWidth: '1200px',
          width: '100%',
          mx: 'auto',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 6, md: 8 },
          alignItems: 'center'
        }}
      >
        {/* Left side - Content */}
        <Box
          sx={{
            flex: { xs: '1', md: '1.2' },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: { xs: 'center', md: 'flex-start' },
            textAlign: { xs: 'center', md: 'left' },
            pr: { md: 6 }
          }}
        >
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              mb: { xs: 3, sm: 4 },
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' },
              lineHeight: 1.1,
              color: theme.palette.text.special
            }}
          >
            Stay updated
          </Typography>
          
          <Typography
            sx={{
              mb: { xs: 4, sm: 5 },
              color: theme.palette.text.primary,
              fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
              lineHeight: 1.5,
              maxWidth: '90%'
            }}
          >
            Follow us on social media to stay updated on how today's travellers explore the world, 
            discover exciting offers, and see the impact of experiences on the future of travel.
          </Typography>

          <Box
            sx={{
              display: 'flex',
              gap: { xs: 3, sm: 4 },
              flexWrap: 'wrap',
              justifyContent: { xs: 'center', md: 'flex-start' }
            }}
          >
            {socialLinks.map(({ Icon, url, label, props = {} }) => (
              <IconButton
                key={label}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                sx={{
                  width: { xs: 55, sm: 65 },
                  height: { xs: 55, sm: 65 },
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.common.white,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                    transform: 'scale(1.1)'
                  }
                }}
              >
                {typeof Icon === 'function' ? (
                  <Icon size={28} />
                ) : (
                  <Icon {...props} />
                )}
              </IconButton>
            ))}
          </Box>
        </Box>

        {/* Right side - Floating Images */}
        <Box
          sx={{
            flex: { xs: '1', md: '0.8' },
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: { xs: 2, sm: 3 },
            height: { xs: '500px', sm: '550px', md: '600px' },
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          {/* First Column - Moving Up */}
          <FloatingColumn posts={column1Posts} direction="up" />
          
          {/* Second Column - Moving Down */}
          <FloatingColumn posts={column2Posts} direction="down" />
        </Box>
      </Box>
    </Box>
  );
};

export default SocialMediaSection;