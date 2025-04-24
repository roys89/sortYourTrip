import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Paper, Divider, Grid, useMediaQuery, Breadcrumbs, Link } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Footer from '../../components/Footer/Footer';
import './TermsAndConditions.css';
import { ArrowForward } from '@mui/icons-material';

const TermsAndConditions = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [activeSection, setActiveSection] = useState(null);

  // Split content into sections
  const sections = [
    {
      id: 'applicability',
      title: 'Applicability of the Agreement',
      content: `This User Agreement ("Agreement") sets forth the terms under which SORTYOURTRIP TRAVEL SOLUTIONS LLP ("SortYourTrip") offers services to its users ("User" or "Users"). This Agreement governs the access and use of SortYourTrip's websites, mobile applications, call centers, and other customer interaction channels. Both SortYourTrip and the User are referred to individually as "Party" and collectively as "Parties" within this Agreement.`
    },
    {
      id: 'acknowledgment',
      title: 'User Acknowledgment and Acceptance of Terms',
      content: `By utilizing services provided by SortYourTrip, the User confirms having read, understood, and agreed to the terms and conditions herein, which shall preside over any transactions or services provided by SortYourTrip. This Agreement is binding and governs the relationship between SortYourTrip and the User concerning all service provisions. SortYourTrip reserves the right to modify or discontinue access to its services or platforms at any point without prior notification.`
    },
    {
      id: 'responsibility',
      title: 'User Responsibility',
      content: `Users are expected to interact with SORTYOURTRIP TRAVEL SOLUTIONS LLP's services in a responsible and ethical manner. This includes providing accurate and truthful information during transactions, ensuring that all bookings and purchases comply with applicable laws, and maintaining the confidentiality of account information. Users must verify the details of their travel arrangements, abide by the terms of any applicable service agreements, and adhere to all safety and health guidelines provided. It is the User's responsibility to ensure that any activities or transactions initiated through SortYourTrip comply with the laws of their jurisdiction.`
    },
    {
      id: 'additional-terms',
      title: 'Additional Terms of Service (TOS)',
      content: `Specific services such as airline tickets, hotel bookings, and holiday packages provided by SortYourTrip are subject to additional Terms of Service (TOS). These TOS are considered an integral part of this Agreement and in the event of any conflict, the provisions of this Agreement shall prevail. Users must review and accept the TOS applicable to the particular services they wish to utilize.`
    },
    {
      id: 'third-party',
      title: 'Third-Party Account Information',
      content: `The User authorizes SortYourTrip to access third-party sites, designated by the User, for retrieving information necessary for service fulfillment. The User is responsible for maintaining the confidentiality of their account information and for all activities that occur under their account. The User must immediately inform SortYourTrip of any unauthorized use of their account or security breaches.`
    },
    {
      id: 'data-use',
      title: 'Data and Content Use',
      content: `The material and content available through SortYourTrip's services are for personal, non-commercial use only. Users may not modify, distribute, or create derivative works based on the content provided by SortYourTrip without explicit permission. It is the User's responsibility to ensure that any services or information accessed meet their personal requirements.`
    },
    {
      id: 'conduct',
      title: 'User Conduct and Responsibilities',
      content: `The User is responsible for ensuring all transactions made through SortYourTrip are lawful and valid in their respective jurisdictions. SortYourTrip is not responsible for verifying the legality or accuracy of the User's transactions. Users agree to adhere to all applicable laws and guidelines when using SortYourTrip's services.`
    },
    {
      id: 'insurance',
      title: 'Insurance and Liability',
      content: `SortYourTrip does not provide insurance for its services unless explicitly included in the service package. It is the User's responsibility to obtain adequate insurance coverage. SortYourTrip will not be liable for any losses incurred due to lack of insurance coverage or disputes with any third-party insurance providers.`
    },
    {
      id: 'force-majeure',
      title: 'Force Majeure',
      content: `Under no circumstances shall SORTYOURTRIP TRAVEL SOLUTIONS LLP be held liable for any failure or delay in performing its obligations, where such failure or delay is due to events beyond SortYourTrip's reasonable control (referred to as "Force Majeure" events). These events may include, but are not limited to, acts of God, natural disasters, terrorism, war, labor strikes, government actions, pandemics, or disruptions in transportation networks. If a Force Majeure event occurs, SortYourTrip will make reasonable efforts to assist affected Users, including rebooking or refunding services where feasible.`
    },
    {
      id: 'limitation',
      title: 'Limitation of Liability',
      content: `In no event shall SortYourTrip be liable to the User or any third party for any indirect, consequential, exemplary, incidental, special, or punitive damages, including lost profit damages arising from the services provided. SortYourTrip's liability in all circumstances is limited to the amount paid by the User for the specific service availed.`
    },
    {
      id: 'privacy',
      title: 'User Privacy and Feedback',
      content: `SortYourTrip respects the privacy of its Users and adheres to strict privacy policies. The User consents to receive communications from SortYourTrip regarding service offers, news, and feedback requests unless they opt out. Users may withdraw consent at any time by contacting customer service.`
    },
    {
      id: 'intellectual-property',
      title: 'Intellectual Property',
      content: `All content provided on SortYourTrip's platforms, including text, graphics, logos, images, and software, is the property of SortYourTrip or its content suppliers and protected by international copyright laws. The unauthorized reproduction, modification, or distribution of this content is strictly prohibited.`
    },
    {
      id: 'visa',
      title: 'Visa and Travel Compliance',
      content: `The User is solely responsible for obtaining all required travel documents, including visas. SortYourTrip is not liable for any issues arising from the User's failure to obtain such documents or meet necessary travel requirements.`
    },
    {
      id: 'indemnification',
      title: 'Indemnification',
      content: `The User agrees to indemnify and hold harmless SORTYOURTRIP TRAVEL SOLUTIONS LLP, its affiliates, officers, agents, and employees from any claim, demand, loss, damage, cost, or liability (including reasonable attorney fees) arising from or related to their use of SortYourTrip's services, their violation of this Agreement, or the infringement by the User, or any third party using their account, of any intellectual property or other rights of any person or entity.`
    },
    {
      id: 'right-to-refuse',
      title: 'Right to Refuse',
      content: `SORTYOURTRIP TRAVEL SOLUTIONS LLP reserves the right to refuse service to any User for legitimate reasons, including but not limited to non-compliance with the Terms and Conditions, fraudulent booking attempts, or behavior that negatively impacts other users or the operational capabilities of SortYourTrip. Refusal of service may include cancellation of bookings, denial of access to platforms, or permanent termination of user accounts.`
    },
    {
      id: 'cancellation',
      title: 'Right to Cancellation In Case of Invalid User Information',
      content: `SORTYOURTRIP TRAVEL SOLUTIONS LLP reserves the right to cancel any bookings or transactions if it is discovered that a User has provided false or misleading information. Such cancellations may occur without prior notice to the User, and SortYourTrip may also take further legal action if necessary. In cases where a booking is cancelled due to incorrect user information, SortYourTrip is not liable for any resulting inconvenience or costs incurred by the User. SortYourTrip also is not liable if the information entered or given by the user is incorrect or invalid.`
    },
    {
      id: 'amendments',
      title: 'Amendments and Jurisdiction',
      content: `SortYourTrip reserves the right to amend this Agreement at any time. Users are responsible for regularly reviewing these terms. This Agreement is governed by and construed in accordance with the laws of the jurisdiction in which SortYourTrip operates, without regard to its conflict of law provisions.`
    },
    {
      id: 'vis-a-vis',
      title: 'Responsibilities of User Vis-a-Vis The Agreement',
      content: `Users must engage with SORTYOURTRIP TRAVEL SOLUTIONS LLP's services in accordance with all terms outlined in this Agreement. Users accept that they are solely responsible for the consequences of their actions while using SortYourTrip's services. Compliance with this Agreement and any related Terms of Service is mandatory, and failure to comply can result in suspension or termination of service access.`
    },
    {
      id: 'pictures',
      title: 'Usage of Customer\'s Pictures',
      content: `By sharing holiday pictures or videos with SORTYOURTRIP TRAVEL SOLUTIONS LLP, Users grant SortYourTrip the right to use these materials in marketing, promotional activities, or on social media platforms. Users not wishing for their images to be used must expressly opt out by contacting SortYourTrip at specified support channels. SortYourTrip commits to respecting User preferences regarding the use of such personal media and will take steps to ensure such preferences are honored.`
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
            Terms and Conditions
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
                  Terms and Conditions
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
                  Last updated: April 23, 2025
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
                  This User Agreement outlines the terms and conditions governing your use of SortYourTrip's services. 
                  By accessing or using our platform, you agree to be bound by these terms.
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
                      textAlign: 'justify'
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
                  By using SortYourTrip services, you acknowledge that you have read and understood these Terms and Conditions.
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

export default TermsAndConditions;
