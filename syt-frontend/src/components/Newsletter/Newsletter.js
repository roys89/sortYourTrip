import { useTheme } from '@mui/material/styles';
import { AlertCircle, Bell, Check, Compass, Gift, Mail, Send } from 'lucide-react';
import React, { useState } from 'react';

const Newsletter = () => {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && email.includes('@') && email.includes('.')) {
      setSubmitted(true);
      setError(false);
      setEmail('');
      // Here you would typically call your API to submit the email
      setTimeout(() => setSubmitted(false), 3000);
    } else {
      setError(true);
    }
  };

  return (
    <div className="pb-20" style={{ backgroundColor: theme.palette.background.main }}>
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto rounded-3xl overflow-hidden shadow-2xl" style={{ backgroundColor: theme.palette.background.paper }}>
          <div className="grid grid-cols-1 lg:grid-cols-5">
            {/* Left Column - Form and Text */}
            <div className="p-8 md:p-12 lg:col-span-3 flex flex-col justify-center">
              <div className="flex items-center mb-6">
                <span className="flex items-center justify-center w-12 h-12 rounded-full mr-4" style={{ backgroundColor: `${theme.palette.primary.main}15` }}>
                  <Mail className="w-6 h-6" style={{ color: theme.palette.primary.main }} />
                </span>
                <h2 className="text-3xl md:text-4xl font-serif" style={{ color: theme.palette.text.primary }}>
                  Join Our Travel Community
                </h2>
              </div>
              
              <p className="text-lg mb-8" style={{ color: theme.palette.text.primary }}>
                Get exclusive travel tips, destination insights, and special offers directly to your inbox. Be the first to know about our limited-time deals!
              </p>
              
              <form onSubmit={handleSubmit} className="mb-8">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-grow">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError(false);
                      }}
                      placeholder="Your email address"
                      className="w-full px-6 py-4 rounded-full text-lg focus:outline-none focus:ring-2 transition-all duration-300"
                      style={{ 
                        backgroundColor: theme.palette.mode === 'light' ? '#f7f7f7' : '#333333',
                        color: theme.palette.text.primary,
                        borderColor: error ? 'red' : 'transparent',
                        boxShadow: error ? '0 0 0 2px red' : 'none'
                      }}
                    />
                    {error && (
                      <div className="absolute right-6 top-1/2 transform -translate-y-1/2 text-red-500 flex items-center">
                        <AlertCircle size={20} />
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="px-8 py-4 rounded-full text-lg font-medium flex items-center justify-center transition-all duration-300 min-w-[160px]"
                    style={{ 
                      backgroundColor: theme.palette.button.main,
                      color: theme.palette.button.contrastText
                    }}
                  >
                    {submitted ? (
                      <>
                        <Check className="mr-2" size={20} />
                        Subscribed!
                      </>
                    ) : (
                      <>
                        <Send className="mr-2" size={20} />
                        Subscribe
                      </>
                    )}
                  </button>
                </div>
                {error && (
                  <p className="mt-2 ml-6 text-red-500 text-sm">
                    Please enter a valid email address
                  </p>
                )}
              </form>
              
              <div className="flex flex-wrap gap-4 md:gap-6">
                <div className="flex items-center">
                  <Bell size={18} className="mr-2" style={{ color: theme.palette.primary.main }} />
                  <span style={{ color: theme.palette.text.primary }}>Weekly updates</span>
                </div>
                <div className="flex items-center">
                  <Gift size={18} className="mr-2" style={{ color: theme.palette.primary.main }} />
                  <span style={{ color: theme.palette.text.primary }}>Exclusive offers</span>
                </div>
                <div className="flex items-center">
                  <Compass size={18} className="mr-2" style={{ color: theme.palette.primary.main }} />
                  <span style={{ color: theme.palette.text.primary }}>Travel inspiration</span>
                </div>
              </div>
            </div>
            
            {/* Right Column - Image and Icons - Fixed positioning */}
            <div className="hidden lg:block lg:col-span-2 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br" style={{ 
                backgroundImage: `linear-gradient(to bottom right, ${theme.palette.primary.main}, ${theme.palette.secondary.main})` 
              }}>
                {/* Full image container that takes up entire right side */}
                <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 10 }}>
                  <img 
                    src="/assets/images/newsletter.jpg" 
                    alt="Newsletter signup" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Trust Indicators */}
        <div className="mt-8 flex flex-wrap justify-center items-center gap-8 md:gap-16">
          <div className="flex items-center">
            <Check className="w-5 h-5 mr-2" style={{ color: theme.palette.primary.main }} />
            <span className="text-sm" style={{ color: theme.palette.text.primary }}>No spam, ever</span>
          </div>
          <div className="flex items-center">
            <Check className="w-5 h-5 mr-2" style={{ color: theme.palette.primary.main }} />
            <span className="text-sm" style={{ color: theme.palette.text.primary }}>Unsubscribe anytime</span>
          </div>
          <div className="flex items-center">
            <Check className="w-5 h-5 mr-2" style={{ color: theme.palette.primary.main }} />
            <span className="text-sm" style={{ color: theme.palette.text.primary }}>Your data is secure</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Newsletter;