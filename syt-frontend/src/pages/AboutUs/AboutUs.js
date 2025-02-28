import { useTheme } from '@mui/material/styles';
import { Camera, Coffee, Globe, MapPin, Plane, Shield, Star, Users } from 'lucide-react';
import React from 'react';
import Footer from '../../components/Footer/Footer';
import Newsletter from '../../components/Newsletter/Newsletter';
const AboutUs = () => {
  const theme = useTheme();

  const stats = [
    { number: '250+', label: 'Destinations', icon: <MapPin className="w-8 h-8" /> },
    { number: '50+', label: 'Partner Hotels', icon: <Star className="w-8 h-8" /> },
    { number: '1M+', label: 'Happy Travelers', icon: <Coffee className="w-8 h-8" /> },
    { number: '25k+', label: 'Reviews', icon: <Plane className="w-8 h-8" /> }
  ];

  const values = [
    { 
      icon: <Camera className="w-12 h-12" style={{ color: theme.palette.primary.main }} />, 
      title: 'Innovative',
      description: 'We pioneer cutting-edge solutions to make travel planning seamless and engaging.'
    },
    {
      icon: <Users className="w-12 h-12" style={{ color: theme.palette.primary.main }} />,
      title: 'Personalized',
      description: 'Every journey is uniquely crafted to match your interests and preferences.'
    },
    {
      icon: <Globe className="w-12 h-12" style={{ color: theme.palette.primary.main }} />,
      title: 'Customer-focused',
      description: 'Your satisfaction drives everything we do, from planning to execution.'
    },
    {
      icon: <Shield className="w-12 h-12" style={{ color: theme.palette.primary.main }} />,
      title: 'Trustworthy',
      description: 'Built on transparency and reliability in every step of your journey.'
    }
  ];

  const blogPosts = [
    {
      title: "Ultimate Beach Getaway Guide",
      image: "/assets/images/aboutus/blog/blog1.jpg",
      description: "Discover the world's most stunning coastal destinations..."
    },
    {
      title: "Mountain Adventures Await",
      image: "  /assets/images/aboutus/blog/blog2.jpg",
      description: "Expert tips for conquering peaks and finding serenity..."
    },
    {
      title: "Cultural Experiences in Asia",
      image: "  /assets/images/aboutus/blog/blog3.jpg",
      description: "Immerse yourself in ancient traditions and modern marvels..."
    }
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.palette.background.default }}>
      {/* Hero Section with circular images */}
      <div className="relative overflow-hidden" style={{ background: theme.palette.background.default }}>
        <div className="container mx-auto px-4 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-6xl font-serif tracking-tight" style={{ color: theme.palette.text.primary }}>
                SortYourTrip
              </h1>
              <p className="text-xl leading-relaxed" style={{ color: theme.palette.text.primary }}>
                Travel is not just a fun and exciting way to spend your time; it's also a vital component of personal growth & development.
              </p>
              <button className="px-8 py-4 rounded-full text-lg transition-colors duration-300" 
                style={{ 
                  backgroundColor: theme.palette.button.main, 
                  color: theme.palette.button.contrastText 
                }}>
                Start Your Journey
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-full overflow-hidden aspect-square">
                <img src="  /assets/images/aboutus/main1.jpg" alt="Travel" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="rounded-full overflow-hidden aspect-square mt-12">
                <img src="  /assets/images/aboutus/main2.jpg" alt="Experience" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="py-24" style={{ backgroundColor: theme.palette.background.default }}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition-shadow duration-300" 
                style={{ backgroundColor: theme.palette.background.paper }}>
                <div className="mb-6 flex justify-center">{value.icon}</div>
                <h3 className="text-xl font-semibold mb-4" style={{ color: theme.palette.text.primary }}>{value.title}</h3>
                <p style={{ color: theme.palette.text.primary }}>{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section with gradient background */}
      <div className="py-24" style={{ backgroundColor: theme.palette.background.default }}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-8 rounded-2xl shadow-lg hover:transform hover:-translate-y-2 transition-all duration-300" 
                style={{ backgroundColor: theme.palette.background.paper }}>
                <div className="flex justify-center mb-4" style={{ color: theme.palette.primary.main }}>{stat.icon}</div>
                <h2 className="text-4xl font-bold mb-2" style={{ color: theme.palette.primary.main }}>
                  {stat.number}
                </h2>
                <p className="uppercase tracking-wide text-sm" style={{ color: theme.palette.text.primary }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Story Section */}
      <div className="py-24" style={{ backgroundColor: theme.palette.background.default }}>
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-4xl font-serif mb-8" style={{ color: theme.palette.text.primary }}>Our Story</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="rounded-full overflow-hidden aspect-square">
              <img src="  /assets/images/aboutus/story/story1.jpg" alt="Team" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="rounded-full overflow-hidden aspect-square md:mt-12">
              <img src="  /assets/images/aboutus/story/story2.jpg" alt="Office" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="rounded-full overflow-hidden aspect-square">
              <img src="  /assets/images/aboutus/story/story3.jpg" alt="Culture" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
            </div>
          </div>
          <p className="text-xl leading-relaxed" style={{ color: theme.palette.text.primary }}>
            SortYourTrip, founded by an enterprising team with 50+ years of experience, is focused on delivering stellar travel experiences. We believe in making every journey memorable.
          </p>
        </div>
      </div>

      {/* Blog Section */}
      <div className="py-24" style={{ backgroundColor: theme.palette.background.default }}>
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-serif text-center mb-16" style={{ color: theme.palette.text.primary }}>The latest from our blog posts</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {blogPosts.map((post, index) => (
              <div key={index} className="rounded-xl overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300" 
                style={{ backgroundColor: theme.palette.background.paper }}>
                <div className="relative overflow-hidden">
                  <img 
                    src={post.image} 
                    alt={post.title}
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-3 group-hover:text-blue-600 transition-colors duration-300" 
                    style={{ color: theme.palette.text.primary }}>
                    {post.title}
                  </h3>
                  <p className="mb-4" style={{ color: theme.palette.text.primary }}>{post.description}</p>
                  <span className="flex items-center group-hover:text-blue-800 transition-colors duration-300" 
                    style={{ color: theme.palette.primary.main }}>
                    Learn more 
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
<Newsletter/>
      <Footer />
    </div>
  );
};

export default AboutUs;