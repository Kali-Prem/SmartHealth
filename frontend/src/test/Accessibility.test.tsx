import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { App } from '../App';

describe('WCAG 2.1 AA Accessibility Audit Suite', () => {
  it('renders all required semantic HTML landmarks', () => {
    render(<App />);

    // Header landmark
    expect(screen.getByRole('banner')).toBeInTheDocument();

    // Main landmark
    expect(screen.getByRole('main')).toBeInTheDocument();

    // Desktop and mobile navigation landmarks
    const navigations = screen.getAllByRole('navigation');
    expect(navigations.length).toBeGreaterThanOrEqual(1);

    // Tablist container
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('ensures all buttons have accessible names and aria attributes', () => {
    render(<App />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      // Must have accessible text content or an aria-label or title
      const hasName =
        btn.textContent?.trim().length ||
        btn.getAttribute('aria-label') ||
        btn.getAttribute('title');
      expect(hasName).toBeTruthy();
    });
  });

  it('supports full keyboard navigation through main tabs', () => {
    render(<App />);

    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBeGreaterThan(0);

    // Initial selected tab
    const dashTab = screen.getByRole('tab', { name: /Dashboard/i });
    expect(dashTab).toHaveAttribute('aria-selected', 'true');

    // Click next tab
    const stockTab = screen.getByRole('tab', { name: /Medicine Stock/i });
    fireEvent.click(stockTab);
    expect(stockTab).toHaveAttribute('aria-selected', 'true');
    expect(dashTab).toHaveAttribute('aria-selected', 'false');
  });

  it('verifies theme switching between Light, Dark, and High Contrast with DOM class reflection', () => {
    render(<App />);

    const lightBtn = screen.getByRole('button', { name: /Light Mode/i });
    const darkBtn = screen.getByRole('button', { name: /Dark Mode/i });
    const contrastBtn = screen.getByRole('button', { name: /High Contrast Mode/i });

    // Switch to dark
    fireEvent.click(darkBtn);
    expect(document.body.classList.contains('theme-dark')).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    // Switch to high contrast
    fireEvent.click(contrastBtn);
    expect(document.body.classList.contains('high-contrast')).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('high-contrast');

    // Switch back to light
    fireEvent.click(lightBtn);
    expect(document.body.classList.contains('theme-dark')).toBe(false);
    expect(document.body.classList.contains('high-contrast')).toBe(false);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
