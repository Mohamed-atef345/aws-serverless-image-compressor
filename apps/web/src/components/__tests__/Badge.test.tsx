import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { Badge } from '../Badge';

describe('Badge', () => {
  it('renders the "New" label', () => {
    render(<Badge />);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('renders the tagline text', () => {
    render(<Badge />);
    expect(
      screen.getByText('Lightning-fast compression')
    ).toBeInTheDocument();
  });
});
