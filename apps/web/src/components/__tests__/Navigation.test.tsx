import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { Navigation } from '../Navigation';

describe('Navigation', () => {
  it('renders the brand logo text', () => {
    render(<Navigation />);
    expect(screen.getByText('ImageCompress')).toBeInTheDocument();
  });

  it('renders the logo as a link to home', () => {
    render(<Navigation />);
    const logoLink = screen.getByText('ImageCompress').closest('a');
    expect(logoLink).toHaveAttribute('href', '/');
  });

  it('renders Features nav link', () => {
    render(<Navigation />);
    const link = screen.getByText('Features');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '#features');
  });

  it('renders How It Works nav link', () => {
    render(<Navigation />);
    const link = screen.getByText('How It Works');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '#how-it-works');
  });

  it('renders exactly 2 navigation items', () => {
    render(<Navigation />);
    const nav = document.querySelector('nav');
    // The nav links are inside a div with flex items
    const links = nav?.querySelectorAll('a:not([href="/"])');
    expect(links?.length).toBe(2);
  });
});
