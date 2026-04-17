import React from 'react';
import { ZapIcon } from './Icons';

export const Badge: React.FC = () => {
  return (
    <div className="inline-flex items-center rounded-full shadow-sm bg-white/5 border border-white/10 backdrop-blur-md p-1 pl-1.5 pr-4">
      {/* Dark badge with icon and "New" */}
      <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-500/20 rounded-full border border-yellow-500/30">
        <ZapIcon className="w-3 h-3 text-yellow-400" />
        <span className="font-inter font-medium text-xs text-yellow-400 tracking-wide uppercase">New</span>
      </div>
      {/* Light badge with text */}
      <div className="ml-3">
        <span className="font-inter font-medium text-sm text-gray-200">
          Lightning-fast compression
        </span>
      </div>
    </div>
  );
};
