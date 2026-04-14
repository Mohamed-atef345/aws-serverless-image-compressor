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
        className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white text-sm font-schibsted font-medium transition-all duration-200 min-w-[160px] border border-white/10"
      >
        <span className="truncate">{selectedOption?.label}</span>
        <ChevronDownIcon
          className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute left-0 top-full mt-2 w-full min-w-[200px] py-2 bg-white rounded-xl shadow-2xl border border-gray-100 z-[200] animate-dropdown"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpenDropdownId(null);
              }}
              className={`w-full px-4 py-2.5 text-left text-sm font-schibsted transition-colors duration-150 first:rounded-t-lg last:rounded-b-lg ${
                option.value === value
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
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
