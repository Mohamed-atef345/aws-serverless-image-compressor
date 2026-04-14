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
          className="font-schibsted font-semibold text-2xl tracking-logo text-black"
        >
          ImageCompress
        </a>

        {/* Menu Items */}
        <div className="flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="flex items-center gap-1 font-schibsted font-medium text-base tracking-menu text-black hover:opacity-70 transition-opacity"
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
            className="w-[82px] h-10 font-schibsted font-medium text-base tracking-menu text-black bg-transparent hover:bg-black/5 rounded-lg transition-colors"
          >
            Sign Up
          </button>
          <button
            className="w-[101px] h-10 font-schibsted font-medium text-base tracking-menu text-white bg-black hover:bg-black/80 rounded-lg transition-colors"
          >
            Log In
          </button>
        </div>
      </div>
    </nav>
  );
};
