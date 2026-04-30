import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../test/test-utils';

// Mock StaticBackground because it uses HTMLCanvasElement which jsdom doesn't support
vi.mock('../components/StaticBackground', () => ({
  StaticBackground: () => <div data-testid="static-background" />,
}));

import App from '../App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(document.querySelector('.relative.min-h-screen')).toBeInTheDocument();
  });

  it('renders the Navigation component', () => {
    render(<App />);
    expect(screen.getByText('ImageCompress')).toBeInTheDocument();
  });

  it('renders the HeroSection with headline', () => {
    render(<App />);
    expect(screen.getByText('Compress Images')).toBeInTheDocument();
    expect(screen.getByText('Instantly')).toBeInTheDocument();
  });

  it('renders the FeaturesSection', () => {
    render(<App />);
    expect(screen.getByText(/Powerful/)).toBeInTheDocument();
  });

  it('renders the HowItWorksSection', () => {
    render(<App />);
    const elements = screen.getAllByText(/How It/);
    expect(elements.length).toBeGreaterThanOrEqual(1);
    // The section heading should exist
    expect(document.getElementById('how-it-works')).toBeInTheDocument();
  });

  it('renders the mocked background', () => {
    render(<App />);
    expect(screen.getByTestId('static-background')).toBeInTheDocument();
  });
});
