import React from 'react';

export const StaticBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient - more visible */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" />

      {/* Large gradient orbs - more vibrant */}
      <div
        className="absolute top-[-30%] right-[-20%] w-[900px] h-[900px] rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.35) 0%, rgba(99, 102, 241, 0.1) 40%, transparent 70%)',
        }}
      />
      <div
        className="absolute top-[10%] left-[-25%] w-[800px] h-[800px] rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, rgba(168, 85, 247, 0.1) 40%, transparent 70%)',
        }}
      />
      <div
        className="absolute bottom-[-20%] right-[10%] w-[700px] h-[700px] rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(34, 211, 238, 0.35) 0%, rgba(34, 211, 238, 0.1) 40%, transparent 70%)',
        }}
      />
      <div
        className="absolute bottom-[20%] left-[20%] w-[500px] h-[500px] rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(52, 211, 153, 0.25) 0%, rgba(52, 211, 153, 0.05) 40%, transparent 70%)',
        }}
      />
      
      {/* Accent blob in center-top area */}
      <div
        className="absolute top-[5%] left-[40%] w-[400px] h-[400px] rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(251, 146, 60, 0.2) 0%, transparent 60%)',
        }}
      />

      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0, 0, 0, 0.05) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />
    </div>
  );
};
