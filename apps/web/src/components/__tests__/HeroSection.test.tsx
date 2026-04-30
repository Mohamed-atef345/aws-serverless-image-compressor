import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { HeroSection } from '../HeroSection';

describe('HeroSection', () => {
  it('renders the main headline', () => {
    render(<HeroSection />);
    expect(screen.getByText('Compress Images')).toBeInTheDocument();
    expect(screen.getByText('Instantly')).toBeInTheDocument();
  });

  it('renders the subtitle text', () => {
    render(<HeroSection />);
    expect(
      screen.getByText(/Upload your images and get optimized files in seconds/)
    ).toBeInTheDocument();
  });

  it('renders the Badge component', () => {
    render(<HeroSection />);
    expect(screen.getByText('Lightning-fast compression')).toBeInTheDocument();
  });

  it('renders the three feature pills', () => {
    render(<HeroSection />);
    expect(screen.getByText('Up to 90% smaller')).toBeInTheDocument();
    expect(screen.getByText('Secure & Private')).toBeInTheDocument();
    expect(screen.getByText('Instant Results')).toBeInTheDocument();
  });

  it('renders the UploadInput component', () => {
    render(<HeroSection />);
    // The upload drop zone should be present
    expect(screen.getByText(/Drop images here/)).toBeInTheDocument();
  });
});
