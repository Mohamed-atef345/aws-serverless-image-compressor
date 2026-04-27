import React from 'react';

const steps = [
  {
    number: '01',
    title: 'Upload Images',
    description: 'Drag & drop or select up to 5 images. We support JPEG, PNG, WebP, and GIF formats.',
  },
  {
    number: '02',
    title: 'Choose Settings',
    description: 'Select your preferred output format and quality settings. Our smart default is optimized WebP.',
  },
  {
    number: '03',
    title: 'Download Fast',
    description: 'Get your compressed images instantly. Download them individually or as a convenient ZIP file.',
  }
];

export const HowItWorksSection: React.FC = () => {
  return (
    <section id="how-it-works" className="py-24 px-[120px] max-w-[1440px] mx-auto w-full relative mt-16">
      <div className="text-center mb-16">
        <h2 className="font-fustat font-bold text-[48px] text-white mb-4">
          How It <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600">Works</span>
        </h2>
        <p className="font-schibsted text-xl text-gray-400 max-w-2xl mx-auto">
          Three simple steps to perfectly optimized images.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
        {/* Connecting line for desktop */}
        <div className="hidden md:block absolute top-[45px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />
        
        {steps.map((step, idx) => (
          <div key={idx} className="relative flex flex-col items-center text-center">
            <div className="w-[90px] h-[90px] rounded-full bg-[#111111] border-2 border-yellow-500/30 flex items-center justify-center mb-8 relative z-10 shadow-[0_0_30px_rgba(250,204,21,0.1)]">
              <span className="font-fustat font-bold text-3xl text-yellow-500">{step.number}</span>
            </div>
            <h3 className="font-fustat font-semibold text-2xl text-white mb-4">{step.title}</h3>
            <p className="font-schibsted text-gray-400 leading-relaxed max-w-[280px]">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
