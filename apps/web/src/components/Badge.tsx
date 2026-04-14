import React from 'react';
import { ZapIcon } from './Icons';

export const Badge: React.FC = () => {
  return (
    <div className="inline-flex items-center rounded-full shadow-sm">
      {/* Dark badge with icon and "New" */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-badge rounded-full">
        <ZapIcon className="w-3.5 h-3.5 text-yellow-400" />
        <span className="font-inter font-medium text-sm text-white">New</span>
      </div>
      {/* Light badge with text */}
      <div className="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full -ml-2">
        <span className="font-inter font-normal text-sm text-black">
          Lightning-fast compression
        </span>
      </div>
    </div>
  );
};
