import React from 'react';
import { ChevronDownIcon } from './Icons';

interface NavItem {
  label: string;
  hasDropdown?: boolean;
  href?: string;
}

const navItems: NavItem[] = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
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
      </div>
    </nav>
  );
};
