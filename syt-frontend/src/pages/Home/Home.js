// src/pages/Home/Home.js
import React from 'react';
import Footer from '../../components/Footer/Footer';
import Header from '../../components/Header/Header';
import Hero from '../../components/Header/Hero/Hero';
import './Home.css';
const Home = ({toggleTheme, themeMode }) => {
  return (
    <>
      <Hero />
      <Header />
      <Footer />
    </>
  );
};

export default Home;
