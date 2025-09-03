import React from 'react';
import Navbar from './components/Navbar.jsx';
import HeroSection from './components/HeroSection.jsx';
import FeatureSection from './components/FeatureSection.jsx';
import HowItWorksSection from './components/HowItWorksSection.jsx';
import Footer from './components/Footer.jsx';

function App() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <FeatureSection />
        <HowItWorksSection />
      </main>
      <Footer />
    </>
  );
}

export default App;
