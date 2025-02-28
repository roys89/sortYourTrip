import { Add, Facebook, Instagram, LinkedIn, Phone, Remove, X as TwitterX, WhatsApp } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import React, { useState } from 'react';
import Footer from '../../components/Footer/Footer';

const ContactUs = () => {
  const theme = useTheme();
  const [openQuestion, setOpenQuestion] = useState(null);

  const socialLinks = [
    {
      icon: Facebook,
      url: 'https://facebook.com/sortyourtrip',
      bgColor: '#1877F2', // Facebook blue
      label: 'Visit our Facebook page'
    },
    {
      icon: Instagram,
      url: 'https://instagram.com/sortyourtrip',
      bgColor: '#E1306C', // Instagram pink
      label: 'Follow us on Instagram'
    },
    {
      icon: TwitterX,
      url: 'https://twitter.com/sortyourtrip',
      bgColor: '#000000', // Black for X (formerly Twitter)
      label: 'Follow us on X'
    },
    {
      icon: LinkedIn,
      url: 'https://linkedin.com/company/sortyourtrip',
      bgColor: '#0A66C2', // LinkedIn blue
      label: 'Connect on LinkedIn'
    }
  ];

  const faqs = [
    {
      category: "General Information",
      questions: [
        {
          q: "What is SortYourTrip?",
          a: "SortYourTrip is your trusted travel companion, offering seamless booking experiences and personalized travel solutions."
        },
        {
          q: "How do I make a booking?",
          a: "You can easily book through our platform by selecting your destination, dates, and preferences. Our step-by-step process guides you through the entire booking journey."
        }
      ]
    },
    {
      category: "Booking & Payments",
      questions: [
        {
          q: "What payment methods do you accept?",
          a: "We accept all major credit cards, debit cards, net banking, and popular digital wallets for your convenience."
        },
        {
          q: "Are there any hidden fees?",
          a: "No, we believe in complete transparency. All applicable fees and charges are clearly displayed before you confirm your booking."
        }
      ]
    },
    {
      category: "Customer Support",
      questions: [
        {
          q: "How can I contact customer support?",
          a: "Our support team is available 24/7 through email, phone, and live chat to assist you with any queries."
        },
        {
          q: "What is your cancellation policy?",
          a: "Our cancellation policy varies based on the type of booking. You can find detailed information in our terms and conditions."
        }
      ]
    }
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: theme.palette.background.default 
    }}>
      {/* Hero Section */}
      <div style={{ 
        position: 'relative', 
        height: '60vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ 
          position: 'absolute', 
          inset: 0, 
          overflow: 'hidden' 
        }}>
          <img 
            src="/assets/images/background_contactus.jpg" 
            alt="Contact Us" 
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
          <div style={{ 
            position: 'absolute', 
            inset: 0, 
            backgroundColor: 'rgba(0, 0, 0, 0.5)' 
          }}></div>
        </div>
        <div style={{ 
          position: 'relative', 
          zIndex: 10, 
          textAlign: 'center', 
          color: 'white' 
        }}>
          <h1 style={{ 
            fontSize: 'clamp(2.5rem, 5vw, 3.75rem)',
            fontFamily: theme.typography.h1.fontFamily,
            fontWeight: theme.typography.h1.fontWeight,
            marginBottom: '1rem'
          }}>CONTACT US</h1>
          <p style={{ 
            fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
            fontFamily: theme.typography.h4.fontFamily
          }}>Get help or explore opportunities</p>
        </div>
      </div>

      {/* Contact Information Cards */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '0 1rem', 
        marginTop: '-5rem', 
        position: 'relative', 
        zIndex: 20 
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
          gap: '2rem' 
        }}>
          <div style={{ 
            backgroundColor: theme.palette.background.paper, 
            borderRadius: '0.75rem', 
            padding: '2rem', 
            boxShadow: theme.shadows[3], 
            transition: 'box-shadow 0.3s ease' 
          }}>
            <h3 style={{ 
              fontSize: '1.25rem', 
              fontWeight: 'bold', 
              marginBottom: '1rem',
              color: theme.palette.text.primary
            }}>Get in Touch</h3>
            <p style={{ 
              color: theme.palette.text.primary, 
              marginBottom: '1rem',
              fontSize: '1rem'
            }}>Our support team is available 24/7</p>
            <p style={{ color: theme.palette.text.primary, fontSize: '1rem', marginBottom: '0.5rem' }}>
              <strong>Email:</strong>{' '}
              <a 
                href="mailto:info@sortyourtrip.com"
                style={{
                  color: theme.palette.primary.main,
                  textDecoration: 'none',
                  transition: 'color 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.textDecoration = 'underline';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.textDecoration = 'none';
                }}
              >
                info@sortyourtrip.com
              </a>
            </p>
            <p style={{ color: theme.palette.text.primary, fontSize: '1rem' }}>
              <strong>Hours:</strong> 11:00 AM - 8:00 PM (IST)
            </p>
          </div>
          
          <div 
            style={{ 
              backgroundColor: theme.palette.background.paper, 
              borderRadius: '0.75rem', 
              padding: '2rem', 
              boxShadow: theme.shadows[3]
            }}
          >
            <h3 style={{ 
              fontSize: '1.25rem', 
              fontWeight: 'bold', 
              marginBottom: '1rem',
              color: theme.palette.text.primary,
              textAlign: 'center'
            }}>Contact Us</h3>
            <p style={{ 
              color: theme.palette.text.primary, 
              textAlign: 'center',
              fontWeight: '500',
              fontSize: '1.1rem',
              marginBottom: '1.5rem'
            }}>+91 93720-69323</p>
            
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '2rem'
            }}>
              {/* Call Button */}
              <a
                href="tel:+919372069323"
                style={{
                  backgroundColor: '#0088cc',
                  color: 'white',
                  padding: '1rem',
                  borderRadius: '25%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  transition: 'all 0.3s ease',
                  width: '60px',
                  height: '60px'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.boxShadow = '0 5px 15px rgba(0, 119, 179, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                aria-label="Call us"
              >
                <Phone style={{ fontSize: 36 }} />
              </a>
              
              {/* WhatsApp Button */}
              <a
                href="https://wa.me/919372069323"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  backgroundColor: '#25D366',
                  color: 'white',
                  padding: '1rem',
                  borderRadius: '25%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  transition: 'all 0.3s ease',
                  width: '60px',
                  height: '60px'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.boxShadow = '0 5px 15px rgba(32, 184, 90, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                aria-label="Contact us on WhatsApp"
              >
                <WhatsApp style={{ fontSize: 36 }} />
              </a>
            </div>
          </div>

          <div style={{ 
            backgroundColor: theme.palette.background.paper, 
            borderRadius: '0.75rem', 
            padding: '2rem', 
            boxShadow: theme.shadows[3], 
            transition: 'box-shadow 0.3s ease' 
          }}>
            <h3 style={{ 
              fontSize: '1.25rem', 
              fontWeight: 'bold', 
              marginBottom: '1rem',
              color: theme.palette.text.primary
            }}>Connect With Us</h3>
            <p style={{ 
              color: theme.palette.text.primary, 
              marginBottom: '1.5rem',
              fontSize: '1rem'
            }}>Follow us on social media</p>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '1.5rem' 
            }}>
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '0.75rem',
                    backgroundColor: social.bgColor,
                    color: theme.palette.button.contrastText,
                    borderRadius: '0.5rem',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  aria-label={social.label}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <social.icon style={{ fontSize: 36 }} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '5rem 1rem' 
      }}>
        <h2 style={{ 
          fontSize: '2.5rem', 
          textAlign: 'center', 
          marginBottom: '3rem',
          fontFamily: theme.typography.h2.fontFamily,
          fontWeight: theme.typography.h2.fontWeight,
          color: theme.palette.text.primary
        }}>Frequently Asked Questions</h2>
        
        {faqs.map((category, categoryIndex) => (
          <div key={categoryIndex} style={{ marginBottom: '2rem' }}>
            <h3 style={{ 
              fontSize: '1.25rem', 
              fontWeight: 600, 
              marginBottom: '1rem',
              color: theme.palette.text.primary
            }}>{category.category}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {category.questions.map((faq, faqIndex) => (
                <div 
                  key={faqIndex}
                  style={{ 
                    border: `1px solid ${theme.palette.divider}`, 
                    borderRadius: '0.5rem', 
                    overflow: 'hidden' 
                  }}
                >
                  <button
                    style={{ 
                      width: '100%', 
                      padding: '1rem 1.5rem', 
                      textAlign: 'left', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: theme.palette.text.primary
                    }}
                    onClick={() => setOpenQuestion(openQuestion === `${categoryIndex}-${faqIndex}` ? null : `${categoryIndex}-${faqIndex}`)}
                  >
                    <span style={{ fontWeight: 500 }}>{faq.q}</span>
                    {openQuestion === `${categoryIndex}-${faqIndex}` ? (
                      <Remove style={{ fontSize: 24 }} />
                    ) : (
                      <Add style={{ fontSize: 24 }} />
                    )}
                  </button>
                  {openQuestion === `${categoryIndex}-${faqIndex}` && (
                    <div style={{ 
                      padding: '1rem 1.5rem', 
                      backgroundColor: theme.palette.background.default 
                    }}>
                      <p style={{ color: theme.palette.text.primary }}>{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Contact Form Section */}
      <div style={{ 
        backgroundColor: theme.palette.background.default, 
        padding: '5rem 0' 
      }}>
        <div style={{ 
          maxWidth: '768px', 
          margin: '0 auto', 
          padding: '0 1rem' 
        }}>
          <h2 style={{ 
            fontSize: '2.5rem', 
            textAlign: 'center', 
            marginBottom: '1rem',
            fontFamily: theme.typography.h2.fontFamily,
            fontWeight: theme.typography.h2.fontWeight,
            color: theme.palette.text.primary
          }}>Still have questions?</h2>
          <p style={{ 
            textAlign: 'center', 
            color: theme.palette.text.primary, 
            marginBottom: '3rem' 
          }}>Send us a message</p>
          
          <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '1.5rem' 
            }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: 500, 
                  color: theme.palette.text.primary, 
                  marginBottom: '0.5rem' 
                }}>Name</label>
                <input
                  type="text"
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem 1rem', 
                    borderRadius: '0.5rem', 
                    border: `1px solid ${theme.palette.divider}`, 
                    outline: 'none', 
                    transition: 'all 0.3s ease',
                    backgroundColor: theme.palette.background.paper,
                    color: theme.palette.text.primary
                  }}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: 500, 
                  color: theme.palette.text.primary, 
                  marginBottom: '0.5rem' 
                }}>Email</label>
                <input
                  type="email"
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem 1rem', 
                    borderRadius: '0.5rem', 
                    border: `1px solid ${theme.palette.divider}`, 
                    outline: 'none', 
                    transition: 'all 0.3s ease',
                    backgroundColor: theme.palette.background.paper,
                    color: theme.palette.text.primary
                  }}
                  placeholder="john@example.com"
                />
              </div>
            </div>
            
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: 500, 
                color: theme.palette.text.primary, 
                marginBottom: '0.5rem' 
              }}>Subject</label>
              <select style={{ 
                width: '100%', 
                padding: '0.75rem 1rem', 
                borderRadius: '0.5rem', 
                border: `1px solid ${theme.palette.divider}`, 
                outline: 'none', 
                transition: 'all 0.3s ease',
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary,
                appearance: 'none',
                backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23131313%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.7rem top 50%',
                backgroundSize: '0.65rem auto'
              }}>
                <option value="">Select a topic</option>
                <option value="booking">Booking Inquiry</option>
                <option value="support">Customer Support</option>
                <option value="partnership">Partnership</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: 500, 
                color: theme.palette.text.primary, 
                marginBottom: '0.5rem' 
              }}>Message</label>
              <textarea
                rows="4"
                style={{ 
                  width: '100%', 
                  padding: '0.75rem 1rem', 
                  borderRadius: '0.5rem', 
                  border: `1px solid ${theme.palette.divider}`, 
                  outline: 'none', 
                  transition: 'all 0.3s ease',
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  resize: 'vertical'
                }}
                placeholder="How can we help you?"
              ></textarea>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                type="submit"
                style={{ 
                  backgroundColor: theme.palette.button.main, 
                  color: theme.palette.button.contrastText, 
                  padding: '1rem 2rem', 
                  borderRadius: '9999px', 
                  fontSize: '1.125rem', 
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  transition: 'background-color 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = theme.palette.button.hoverGradient;
                  e.currentTarget.style.animation = theme.palette.button.hoverAnimation;
                  e.currentTarget.style.backgroundSize = '200% 200%';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = theme.palette.button.main;
                  e.currentTarget.style.animation = 'none';
                }}
              >
                Send Message
              </button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ContactUs;