import React from 'react';

// Chevron Down Arrow
export const ChevronDownIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4 6L8 10L12 6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Up Arrow (for submit button)
export const UpArrowIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={className}
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10 16V4M10 4L4 10M10 4L16 10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Star Icon (for badge)
export const StarIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={className}
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M7 1L8.545 4.13L12 4.635L9.5 7.07L10.09 10.51L7 8.885L3.91 10.51L4.5 7.07L2 4.635L5.455 4.13L7 1Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// AI Sparkle Icon
export const AISparkleIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8 1V3M8 13V15M15 8H13M3 8H1M13.07 2.93L11.66 4.34M4.34 11.66L2.93 13.07M13.07 13.07L11.66 11.66M4.34 4.34L2.93 2.93"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="8" cy="8" r="2" fill="currentColor" />
  </svg>
);

// Attach/Paperclip Icon
export const AttachIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M14 7.33L8.38 12.95C7.57 13.76 6.49 14.21 5.36 14.21C4.23 14.21 3.15 13.76 2.34 12.95C1.53 12.14 1.08 11.06 1.08 9.93C1.08 8.8 1.53 7.72 2.34 6.91L7.96 1.29C8.5 0.75 9.23 0.44 9.99 0.44C10.75 0.44 11.48 0.75 12.02 1.29C12.56 1.83 12.87 2.56 12.87 3.32C12.87 4.08 12.56 4.81 12.02 5.35L6.39 10.97C6.12 11.24 5.76 11.39 5.38 11.39C5 11.39 4.64 11.24 4.37 10.97C4.1 10.7 3.95 10.34 3.95 9.96C3.95 9.58 4.1 9.22 4.37 8.95L9.52 3.8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Voice/Microphone Icon
export const VoiceIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8 1C7.20435 1 6.44129 1.31607 5.87868 1.87868C5.31607 2.44129 5 3.20435 5 4V8C5 8.79565 5.31607 9.55871 5.87868 10.1213C6.44129 10.6839 7.20435 11 8 11C8.79565 11 9.55871 10.6839 10.1213 10.1213C10.6839 9.55871 11 8.79565 11 8V4C11 3.20435 10.6839 2.44129 10.1213 1.87868C9.55871 1.31607 8.79565 1 8 1Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13 7V8C13 9.32608 12.4732 10.5979 11.5355 11.5355C10.5979 12.4732 9.32608 13 8 13C6.67392 13 5.40215 12.4732 4.46447 11.5355C3.52678 10.5979 3 9.32608 3 8V7"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M8 13V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5.5 15H10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Search Icon
export const SearchIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M7.33 12.67C10.28 12.67 12.67 10.28 12.67 7.33C12.67 4.39 10.28 2 7.33 2C4.39 2 2 4.39 2 7.33C2 10.28 4.39 12.67 7.33 12.67Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14 14L11.1 11.1"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Image/Compress Icon (custom for image compression)
export const CompressIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5 11L1 15M1 15H5M1 15V11"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11 5L15 1M15 1H11M15 1V5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect
      x="3"
      y="3"
      width="10"
      height="10"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Upload Icon
export const UploadIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={className}
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M17.5 12.5V15.8333C17.5 16.2754 17.3244 16.6993 17.0118 17.0118C16.6993 17.3244 16.2754 17.5 15.8333 17.5H4.16667C3.72464 17.5 3.30072 17.3244 2.98816 17.0118C2.67559 16.6993 2.5 16.2754 2.5 15.8333V12.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14.1667 6.66667L10 2.5L5.83333 6.66667"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 2.5V12.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Image Icon
export const ImageIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="2"
      y="2"
      width="12"
      height="12"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="5.5" cy="5.5" r="1.5" fill="currentColor" />
    <path
      d="M14 10L11 7L4 14"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Zap/Lightning Icon (for fast compression)
export const ZapIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={className}
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M7.58 1L2 8H7L6.42 13L12 6H7L7.58 1Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
