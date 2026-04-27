import React from 'react';
import { StaticBackground, Navigation, HeroSection, FeaturesSection, HowItWorksSection } from './components';

const App: React.FC = () => {
  return (
    <div className="relative min-h-screen">
      {/* Static Background */}
      <StaticBackground />

      {/* Main Content */}
      <div className="relative z-10">
        {/* Navigation Bar */}
        <Navigation />

        {/* Gap between nav and hero: 60px */}
        <div className="h-[60px]" />

        {/* Hero Section */}
        <HeroSection />

        {/* Features Section */}
        <FeaturesSection />

        {/* How It Works Section */}
        <HowItWorksSection />
      </div>
    </div>
  );
};

export default App;
