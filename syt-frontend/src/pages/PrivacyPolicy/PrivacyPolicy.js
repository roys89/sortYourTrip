import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Paper, Divider, Grid, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Footer from '../../components/Footer/Footer';
import './PrivacyPolicy.css';
import { ArrowForward } from '@mui/icons-material';

const PrivacyPolicy = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [activeSection, setActiveSection] = useState(null);

  // Split content into sections
  const sections = [
    {
      id: 'information-collection',
      title: 'Information Collection',
      content: `When interacting with our website, we may collect personal details including your name, email, contact number, payment information, travel dates, and travel preferences. This data is essential to deliver accurate bookings, customer service, and personalized travel experiences.`
    },
    {
      id: 'use-of-information',
      title: 'Use of Information',
      content: `We use the information you provide to:
      • Manage and facilitate your travel arrangements.
      • Communicate updates about your bookings and handle your inquiries.
      • Customize your experience on our platform based on your preferences.
      • Send promotional offers and travel-related updates, subject to your consent.`
    },
    {
      id: 'data-sharing',
      title: 'Data Sharing',
      content: `We do not sell or rent your personal information to third parties. However, to fulfill your travel arrangements, we may share necessary details with service providers such as airlines, hotels, or car rental agencies. These partners are obligated to protect your information and use it solely for the intended purpose.`
    },
    {
      id: 'promotions',
      title: 'Promotions and Sweepstakes',
      content: `SortYourTrip may occasionally organize promotions, contests, or sweepstakes. Participation is optional, and collected information is used to administer the event, select winners, and enhance our future offerings and services.`
    },
    {
      id: 'cookies',
      title: 'Cookies and Tracking Technologies',
      content: `At SortYourTrip, we utilize cookies and similar tracking technologies to enhance your browsing experience, improve website performance, analyze visitor behavior, and offer personalized content tailored to your interests.`
    },
    {
      id: 'what-are-cookies',
      title: 'What are Cookies?',
      content: `Cookies are small text files placed on your device when visiting our website. They enable us to recognize your browser, recall your preferences, and provide a tailored user experience. Cookies do not harm your device nor typically store personally identifiable information.`
    },
    {
      id: 'types-of-cookies',
      title: 'Types of Cookies Used',
      content: `• Essential Cookies: These cookies are crucial for enabling core functionalities of our website, such as accessing secure areas, navigating smoothly, processing bookings, and providing customer support. Without these cookies, key features cannot operate efficiently.

      • Performance and Analytical Cookies: We employ these cookies to understand how users interact with our website. They provide valuable insights into visitor patterns, popular pages, average session duration, and any technical issues encountered. This data helps us continuously optimize our website and provide you with a smoother, faster experience.
      
      • Functional Cookies: These cookies allow us to remember your choices and preferences, such as your login details, preferred language, or region. By storing these preferences, we ensure a more tailored and enjoyable experience each time you visit our site.
      
      • Advertising and Marketing Cookies: We and our advertising partners use these cookies to deliver advertisements that are relevant to your interests and travel preferences. These cookies track your browsing activity to present targeted ads on our website and third-party platforms, ensuring you see promotions and offers that align with your interests.
      
      • Third-Party Cookies: SortYourTrip may include links to external websites or embedded content (such as YouTube videos, social media widgets, or review sites). These third-party sites may place their cookies on your device. SortYourTrip does not control these third-party cookies and encourages you to review their individual privacy and cookie policies.`
    },
    {
      id: 'managing-cookies',
      title: 'Managing and Disabling Cookies',
      content: `You have full control over how cookies are used on your device. Most web browsers allow you to manage, restrict, or block cookies through their settings. Instructions for managing cookies vary depending on your browser, and you can typically find these instructions in the browser's 'Help' or 'Settings' menu.

      However, please be aware that disabling or restricting cookies may impact your ability to access certain features of our website, potentially leading to reduced functionality and user experience.
      
      For further guidance, you may refer to the following resources, depending on your browser.`
    },
    {
      id: 'changes-to-cookie-policy',
      title: 'Changes to our Cookie Policy',
      content: `SortYourTrip periodically reviews and updates this Cookie Policy to reflect technological developments, regulatory changes, and our evolving business needs. We encourage you to revisit this section regularly to stay informed about how we manage cookies and protect your privacy.

      By continuing to use our website without adjusting your browser settings, you consent to our use of cookies as described in this section.`
    },
    {
      id: 'sharing-personal-information',
      title: 'With Whom is Your Personal Information Shared?',
      content: `We do not sell your personal information. However, we may share necessary details with:
      • Service providers involved in delivering your booked services (hotels, airlines, rental companies).
      • Third-party vendors supporting our operations under strict confidentiality agreements.
      • Law enforcement or regulatory bodies, as mandated by legal requirements.`
    },
    {
      id: 'other-information',
      title: 'What Other Information Should I Know About My Privacy?',
      content: `While we diligently protect your personal data, no online transmission is entirely secure. We encourage you to practice safe browsing habits and maintain confidentiality of your login details.`
    },
    {
      id: 'data-security',
      title: 'Data Security',
      content: `SortYourTrip employs robust security measures to prevent unauthorized access or disclosure of your personal information, including SSL encryption for secure transactions.`
    },
    {
      id: 'your-rights',
      title: 'Your Rights and Choices',
      content: `You have the right to:
      • Access and update your personal data.
      • Opt out from receiving marketing communications.
      • Request deletion of your information, subject to compliance with legal obligations.`
    },
    {
      id: 'policy-updates',
      title: 'Policy Updates',
      content: `We may periodically revise this Privacy Policy. We recommend reviewing this document regularly to stay informed.`
    },
    {
      id: 'contact-us',
      title: 'Contact Us',
      content: `For questions or concerns regarding this policy, please reach out at info@sortyourtrip.com.`
    }
  ];

  // Scroll to section when clicking on navigation
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  };

  // Track scroll position to highlight active section
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      
      // Find the section that is currently in view
      const currentSection = sections.find((section) => {
        const element = document.getElementById(section.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom > 100;
        }
        return false;
      });
      
      if (currentSection) {
        setActiveSection(currentSection.id);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  return (
    <Box sx={{ 
      backgroundColor: theme.palette.background.default, 
      minHeight: '100vh',
      position: 'relative'
    }}>
      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          height: { xs: '35vh', md: '45vh' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url("/assets/images/hero/w4.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: 'white',
          textAlign: 'center',
          mb: 8,
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '30%',
            background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)',
            zIndex: 1
          }
        }}
      >
        <Container maxWidth="lg">
          <Typography 
            variant="h2" 
            component="h1" 
            sx={{ 
              fontWeight: 600, 
              mb: 2,
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3.5rem' },
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            Privacy Policy
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              maxWidth: '800px', 
              mx: 'auto',
              opacity: 0.9,
              fontSize: { xs: '1rem', md: '1.25rem' }
            }}
          >
            Please read these terms carefully before using our services
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ mb: 8 }}>
        <Grid container spacing={4}>
          {/* Table of Contents - Sidebar for larger screens */}
          {!isMobile && (
            <Grid item xs={12} md={3}>
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 4, 
                  borderRadius: '12px',
                  backgroundColor: theme.palette.background.paper,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  background: `linear-gradient(145deg, ${theme.palette.background.paper}, ${theme.palette.mode === 'dark' ? 'rgba(66, 66, 66, 0.8)' : 'rgba(248, 248, 248, 0.8)'})`,
                  height: 'fit-content',
                  mb: 4
                }}
              >
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 3, 
                    fontWeight: 600,
                    textAlign: 'center',
                    color: theme.palette.primary.main,
                    fontSize: '1.3rem',
                    position: 'relative',
                    '&:after': {
                      content: '""',
                      position: 'absolute',
                      bottom: '-10px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '80px',
                      height: '2px',
                      background: theme.palette.primary.main,
                      borderRadius: '2px'
                    }
                  }}
                >
                  Privacy Policy
                </Typography>
                <Box component="nav" className="toc-nav">
                  {sections.map((section) => (
                    <Box 
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      sx={{
                        py: 1,
                        px: 2,
                        cursor: 'pointer',
                        borderRadius: '8px',
                        mb: 0.75,
                        transition: 'all 0.3s ease',
                        backgroundColor: activeSection === section.id ? 
                          `${theme.palette.primary.main}15` : 'transparent',
                        color: activeSection === section.id ? 
                          theme.palette.primary.main : theme.palette.text.primary,
                        fontWeight: activeSection === section.id ? 600 : 400,
                        '&:hover': {
                          backgroundColor: `${theme.palette.primary.main}08`,
                          transform: 'translateX(5px)',
                          boxShadow: activeSection === section.id ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
                        },
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderLeft: activeSection === section.id ? 
                          `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
                        fontSize: '0.85rem'
                      }}
                    >
                      <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                        {section.title}
                      </Typography>
                      {activeSection === section.id && (
                        <ArrowForward fontSize="small" sx={{ fontSize: '0.8rem' }} />
                      )}
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>
          )}

          {/* Main Content */}
          <Grid item xs={12} md={9}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: { xs: 3, sm: 5 }, 
                borderRadius: '16px',
                backgroundColor: theme.palette.background.paper,
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                overflow: 'hidden',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '5px',
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                }
              }}
            >
              <Box sx={{ mb: 6 }}>
                <Box 
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 4
                  }}
                >
                  <Box 
                    sx={{ 
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      backgroundColor: `${theme.palette.primary.main}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Box 
                      component="img"
                      src="/SYT-Logo.png"
                      alt="SortYourTrip Logo"
                      sx={{ width: '50px', height: '50px', objectFit: 'contain' }}
                    />
                  </Box>
                </Box>
                
                <Typography 
                  variant="body1" 
                  sx={{ 
                    mb: 3, 
                    color: theme.palette.text.secondary,
                    fontSize: { xs: '0.9rem', md: '1rem' },
                    fontStyle: 'italic',
                    textAlign: 'center'
                  }}
                >
                  Last updated: April 24, 2025
                </Typography>
                
                <Typography 
                  variant="body1" 
                  sx={{ 
                    mb: 5, 
                    color: theme.palette.text.primary,
                    fontSize: { xs: '1rem', md: '1.1rem' },
                    lineHeight: 1.8,
                    textAlign: 'center',
                    maxWidth: '800px',
                    mx: 'auto',
                    fontWeight: 300
                  }}
                >
                  At SortYourTrip, we prioritize your privacy and are committed to safeguarding your personal information. 
                  This Privacy Policy explains in detail how we collect, use, share, and protect the information you provide through our website and services.
                </Typography>
              </Box>

              {/* Sections */}
              {sections.map((section, index) => (
                <Box 
                  key={section.id} 
                  id={section.id} 
                  sx={{ 
                    mb: 5,
                    scrollMarginTop: '2rem'
                  }}
                >
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      mb: 3,
                      color: theme.palette.primary.main,
                      fontWeight: 600,
                      fontSize: { xs: '1.25rem', md: '1.5rem' },
                      position: 'relative',
                      display: 'inline-block',
                      '&:after': {
                        content: '""',
                        position: 'absolute',
                        bottom: '-8px',
                        left: 0,
                        width: '100%',
                        height: '2px',
                        background: `linear-gradient(90deg, ${theme.palette.primary.main}, transparent)`,
                        borderRadius: '2px'
                      }
                    }}
                  >
                    {index + 1}. {section.title}
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: theme.palette.text.primary,
                      fontSize: { xs: '0.95rem', md: '1.05rem' },
                      lineHeight: 1.7,
                      textAlign: 'justify',
                      whiteSpace: 'pre-line'
                    }}
                  >
                    {section.content}
                  </Typography>
                  {index < sections.length - 1 && (
                    <Divider sx={{ mt: 5, opacity: 0.6 }} />
                  )}
                </Box>
              ))}

              {/* Acceptance Section */}
              <Box 
                sx={{ 
                  mt: 8, 
                  p: 4, 
                  backgroundColor: `${theme.palette.primary.main}08`,
                  borderRadius: '12px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '100%',
                    width: '5px',
                    background: `linear-gradient(to bottom, ${theme.palette.primary.main}, transparent)`
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    left: 0,
                    height: '5px',
                    background: `linear-gradient(to right, transparent, ${theme.palette.primary.main}, transparent)`
                  }
                }}
              >
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 2,
                    fontWeight: 600,
                    color: theme.palette.primary.main
                  }}
                >
                  By using SortYourTrip services, you acknowledge that you have read and understood our Privacy Policy.
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  If you have any questions or concerns, please contact our customer support team.
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
      <Footer />
    </Box>
  );
};

export default PrivacyPolicy;
