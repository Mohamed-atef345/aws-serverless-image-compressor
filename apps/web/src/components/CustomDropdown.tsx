import React, { useRef, useEffect, createContext, useContext } from 'react';
import { ChevronDownIcon } from './Icons';

// Context to track any open dropdown
interface DropdownContextType {
  openDropdownId: string | null;
  setOpenDropdownId: (id: string | null) => void;
}

export const DropdownContext = createContext<DropdownContextType>({
  openDropdownId: null,
  setOpenDropdownId: () => {},
});

export const useDropdownContext = () => useContext(DropdownContext);

interface DropdownOption {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  id?: string;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options,
  value,
  onChange,
  className = '',
  id = 'dropdown',
}) => {
  const { openDropdownId, setOpenDropdownId } = useDropdownContext();
  const isOpen = openDropdownId === id;
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const toggleOpen = () => {
    if (isOpen) {
      setOpenDropdownId(null);
    } else {
      setOpenDropdownId(id);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (isOpen) {
          setOpenDropdownId(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, setOpenDropdownId]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, setOpenDropdownId]);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={toggleOpen}
        className={`flex items-center w-full justify-between gap-2 px-4 py-2.5 rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur-sm text-gray-200 text-sm font-schibsted font-medium transition-all duration-200 border border-white/10 hover:border-yellow-500/30 ${
          isOpen ? 'border-yellow-500/50 bg-black/60 shadow-[0_0_15px_rgba(250,204,21,0.1)]' : ''
        }`}
      >
        <span className="truncate">{selectedOption?.label}</span>
        <ChevronDownIcon
          className={`w-4 h-4 flex-shrink-0 text-yellow-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute left-0 top-full mt-2 w-full min-w-[200px] py-2 bg-[#111111] rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] border border-white/10 z-[200] animate-dropdown"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpenDropdownId(null);
              }}
              className={`w-full px-4 py-2.5 text-left text-sm font-schibsted transition-colors duration-150 block ${
                option.value === value
                  ? 'bg-yellow-500/10 text-yellow-400 font-medium'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
