import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContextProvider';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import FeatureSection from './components/FeatureSection';
import HowItWorksModal from './components/HowItWorksModal';
import Footer from './components/Footer';
import TripPlanPage from './pages/TripPlanPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen font-sans">
          <Navbar onOpenModal={handleOpenModal} />
          <HowItWorksModal isOpen={isModalOpen} onClose={handleCloseModal} />
          
          <main className="flex-grow">
            <Routes>
              <Route
                path="/"
                element={
                  <>
                    <HeroSection />
                    <FeatureSection />
                  </>
                }
              />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/trip-plan" element={<TripPlanPage />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
