import React, { useState } from 'react';
import { Badge } from './Badge';
import { UploadInput } from './UploadInput';
import { DropdownContext } from './CustomDropdown';

export const HeroSection: React.FC = () => {
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const isAnyDropdownOpen = openDropdownId !== null;

  return (
    <DropdownContext.Provider value={{ openDropdownId, setOpenDropdownId }}>
      <section className="flex flex-col items-center -mt-[50px] px-[120px]">
        {/* Header Content */}
        <div className="flex flex-col items-center gap-[34px]">
          {/* Badge */}
          <Badge />

          {/* Main Headline */}
          <h1 className="font-fustat font-bold text-[80px] leading-tight tracking-tight text-white text-center" style={{ textShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
            Compress Images <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-600">Instantly</span>
          </h1>

          {/* Subtitle */}
          <p
            className="font-fustat font-medium text-xl tracking-wide text-gray-400 text-center max-w-[736px]"
            style={{ width: '542px' }}
          >
            Upload your images and get optimized files in seconds. Reduce file sizes by up to 90% without losing quality.
          </p>
        </div>

        {/* Upload Input Box - 44px gap from header */}
        <div className="mt-[44px] w-full flex justify-center relative z-10">
          <UploadInput />
        </div>

        {/* Feature Pills - animate down when dropdown is open */}
        <div 
          className={`flex items-center gap-4 transition-all duration-300 ease-out ${
            isAnyDropdownOpen ? 'mt-[180px]' : 'mt-8'
          }`}
        >
          <FeaturePill icon="zap" text="Up to 90% smaller" />
          <FeaturePill icon="shield" text="Secure & Private" />
          <FeaturePill icon="clock" text="Instant Results" />
        </div>
      </section>
    </DropdownContext.Provider>
  );
};

interface FeaturePillProps {
  icon: 'zap' | 'shield' | 'clock';
  text: string;
}

const FeaturePill: React.FC<FeaturePillProps> = ({ icon, text }) => {
  const iconMap = {
    zap: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    shield: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    clock: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-lg shadow-black/20">
      <span className="text-yellow-500">{iconMap[icon]}</span>
      <span className="font-schibsted font-medium text-sm text-gray-300">{text}</span>
    </div>
  );
};
