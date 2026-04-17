import React from 'react';
import { ChevronDownIcon } from './Icons';

interface NavItem {
  label: string;
  hasDropdown?: boolean;
  href?: string;
}

const navItems: NavItem[] = [
  { label: 'Features', hasDropdown: true, href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Contact', href: '#contact' },
];

export const Navigation: React.FC = () => {
  return (
    <nav className="w-full px-[120px] py-4">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <a
          href="/"
          className="font-schibsted font-semibold text-2xl tracking-logo text-white"
        >
          ImageCompress
        </a>

        {/* Menu Items */}
        <div className="flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="flex items-center gap-1 font-schibsted font-medium text-sm tracking-menu text-gray-300 hover:text-yellow-400 transition-colors"
            >
              {item.label}
              {item.hasDropdown && (
                <ChevronDownIcon className="w-4 h-4" />
              )}
            </a>
          ))}
        </div>

        {/* Right Side Buttons */}
        <div className="flex items-center gap-3">
          <button
            className="w-[82px] h-[38px] font-schibsted font-medium text-sm tracking-menu text-gray-300 bg-transparent hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            Sign Up
          </button>
          <button
            className="px-5 h-[38px] font-schibsted font-semibold text-sm tracking-menu text-black bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 rounded-lg shadow-[0_0_15px_rgba(250,204,21,0.2)] transition-all"
          >
            Log In
          </button>
        </div>
      </div>
    </nav>
  );
};
