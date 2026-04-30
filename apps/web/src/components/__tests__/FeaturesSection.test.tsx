import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { FeaturesSection } from '../FeaturesSection';

describe('FeaturesSection', () => {
  it('renders the section heading', () => {
    render(<FeaturesSection />);
    expect(screen.getByText('Powerful')).toBeInTheDocument();
  });

  it('renders the section description', () => {
    render(<FeaturesSection />);
    expect(
      screen.getByText(/Everything you need to optimize your images/)
    ).toBeInTheDocument();
  });

  it('renders all 6 feature cards', () => {
    render(<FeaturesSection />);
    const featureTitles = [
      'Lightning-fast compression',
      'Secure & Private',
      'Instant Results',
      'Up to 90% smaller',
      'Smart Optimization',
      'Bulk Processing',
    ];
    featureTitles.forEach((title) => {
      expect(screen.getByText(title)).toBeInTheDocument();
    });
  });

  it('renders feature descriptions', () => {
    render(<FeaturesSection />);
    expect(
      screen.getByText(/Our advanced algorithms process your images/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Upload up to 5 files at once/)
    ).toBeInTheDocument();
  });

  it('has the correct section id for anchor navigation', () => {
    render(<FeaturesSection />);
    const section = document.getElementById('features');
    expect(section).toBeInTheDocument();
  });
});
