import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { HowItWorksSection } from '../HowItWorksSection';

describe('HowItWorksSection', () => {
  it('renders the section heading', () => {
    render(<HowItWorksSection />);
    expect(screen.getByText('How It')).toBeInTheDocument();
    expect(screen.getByText('Works')).toBeInTheDocument();
  });

  it('renders the section subtitle', () => {
    render(<HowItWorksSection />);
    expect(
      screen.getByText('Three simple steps to perfectly optimized images.')
    ).toBeInTheDocument();
  });

  it('renders all 3 steps with correct numbers', () => {
    render(<HowItWorksSection />);
    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('02')).toBeInTheDocument();
    expect(screen.getByText('03')).toBeInTheDocument();
  });

  it('renders step titles', () => {
    render(<HowItWorksSection />);
    expect(screen.getByText('Upload Images')).toBeInTheDocument();
    expect(screen.getByText('Choose Settings')).toBeInTheDocument();
    expect(screen.getByText('Download Fast')).toBeInTheDocument();
  });

  it('renders step descriptions', () => {
    render(<HowItWorksSection />);
    expect(
      screen.getByText(/Drag & drop or select up to 5 images/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Select your preferred output format/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Get your compressed images instantly/)
    ).toBeInTheDocument();
  });

  it('has the correct section id for anchor navigation', () => {
    render(<HowItWorksSection />);
    const section = document.getElementById('how-it-works');
    expect(section).toBeInTheDocument();
  });
});
