import React, { useState } from 'react';
import Navbar from './components/Navbar.jsx';
import HeroSection from './components/HeroSection.jsx';
import FeatureSection from './components/FeatureSection.jsx';
import Footer from './components/Footer.jsx';
import HowItWorksModal from './components/HowItWorksModal.jsx';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Navbar onOpenModal={handleOpenModal} />
      <main>
        <HeroSection />
        <FeatureSection />
      </main>
      <Footer />
      <HowItWorksModal isOpen={isModalOpen} onClose={handleCloseModal} />
    </>
  );
}

export default App;