import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';

/**
 * Custom render that wraps components with any providers needed for tests.
 * Extend this if the app adds global providers (router, theme, etc.).
 */
function customRender(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, { ...options });
}

// Re-export everything from RTL so tests only import from this file
export * from '@testing-library/react';
export { customRender as render };
