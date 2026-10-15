// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {cleanup, fireEvent, render, screen} from '@testing-library/react';
import {afterEach, describe, expect, it} from 'vitest';
import ThemeProvider from '../../../../contexts/Theme/ThemeProvider';
import Tooltip from '../Tooltip';

const renderTooltip = (helperText = 'Store') =>
  render(
    <ThemeProvider>
      <Tooltip helperText={helperText} ariaLabel="Store" position="top">
        <img alt="Store" src="https://example.com/store.png" />
      </Tooltip>
    </ThemeProvider>,
  );

describe('Tooltip', () => {
  afterEach(() => {
    cleanup();
  });

  it('wraps its content without showing the tooltip until hovered', () => {
    renderTooltip();

    const trigger: HTMLElement = screen.getByRole('button', {name: 'Store'});
    expect(trigger.getAttribute('tabindex')).toBe('0');
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('shows on hover and hides when the pointer leaves', () => {
    renderTooltip();
    const trigger: HTMLElement = screen.getByRole('button', {name: 'Store'});

    fireEvent.mouseEnter(trigger);
    const tooltip: HTMLElement = screen.getByRole('tooltip');
    expect(tooltip.textContent).toBe('Store');
    expect(trigger.getAttribute('aria-describedby')).toBe(tooltip.id);

    fireEvent.mouseLeave(trigger);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('shows on keyboard focus, hides on Escape, and toggles on Enter', () => {
    renderTooltip();
    const trigger: HTMLElement = screen.getByRole('button', {name: 'Store'});

    fireEvent.focus(trigger);
    expect(screen.getByRole('tooltip')).toBeTruthy();

    fireEvent.keyDown(trigger, {key: 'Escape'});
    expect(screen.queryByRole('tooltip')).toBeNull();

    fireEvent.keyDown(trigger, {key: 'Enter'});
    expect(screen.getByRole('tooltip')).toBeTruthy();
  });

  it('places itself against the viewport and closes on scroll', () => {
    renderTooltip();

    fireEvent.mouseEnter(screen.getByRole('button', {name: 'Store'}));
    const tooltip: HTMLElement = screen.getByRole('tooltip');
    expect(getComputedStyle(tooltip).position).toBe('fixed');
    expect(tooltip.style.transform).toBe('translate(-50%, -100%)');

    fireEvent.scroll(window);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('shows nothing when there is no text', () => {
    renderTooltip('');

    fireEvent.mouseEnter(screen.getByRole('button', {name: 'Store'}));
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});
