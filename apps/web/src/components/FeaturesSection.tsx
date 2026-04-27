import React from 'react';

const features = [
  {
    icon: (
      <svg className="w-8 h-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Lightning-fast compression',
    description: 'Our advanced algorithms process your images in milliseconds without tying up your browser.'
  },
  {
    icon: (
      <svg className="w-8 h-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Secure & Private',
    description: 'All files are encrypted during transfer and automatically deleted from our servers after 7 days.'
  },
  {
    icon: (
      <svg className="w-8 h-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Instant Results',
    description: 'Get your compressed images immediately. Download them individually or as a convenient ZIP file.'
  },
  {
    icon: (
      <svg className="w-8 h-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Up to 90% smaller',
    description: 'Dramatically reduce file sizes while maintaining indistinguishable visual quality.'
  },
  {
    icon: (
      <svg className="w-8 h-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    title: 'Smart Optimization',
    description: 'Intelligently analyzes each image to find the optimal balance of quality and size.'
  },
  {
    icon: (
      <svg className="w-8 h-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    title: 'Bulk Processing',
    description: 'Upload up to 5 files at once and process them all in parallel.'
  }
];

export const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="py-24 px-[120px] max-w-[1440px] mx-auto w-full">
      <div className="text-center mb-16">
        <h2 className="font-fustat font-bold text-[48px] text-white mb-4">
          Powerful <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600">Features</span>
        </h2>
        <p className="font-schibsted text-xl text-gray-400 max-w-2xl mx-auto">
          Everything you need to optimize your images for the web, beautifully packaged in one simple tool.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, idx) => (
          <div key={idx} className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-lg hover:bg-white/10 transition-all duration-300 group">
            <div className="w-14 h-14 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              {feature.icon}
            </div>
            <h3 className="font-fustat font-semibold text-xl text-white mb-3">{feature.title}</h3>
            <p className="font-schibsted text-gray-400 leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
