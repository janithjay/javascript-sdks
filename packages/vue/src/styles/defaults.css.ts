// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * Default CSS custom property fallback values.
 *
 * These are written into a `:root` rule so that every ThunderID Vue primitive
 * renders correctly even when no ThemeProvider is mounted. When ThemeProvider
 * IS present it calls `document.documentElement.style.setProperty(...)` which
 * has higher specificity than a stylesheet `:root` rule and therefore wins
 * automatically — no special cascade tricks required.
 *
 * Design token naming follows the pattern:
 *   --thunderid-{category}-{sub}-{scale?}
 */
const DEFAULTS_CSS = `
/* ============================================================
   ThunderID Vue SDK – CSS variable defaults
   (ThemeProvider overrides these at runtime via inline styles)
   ============================================================ */
:root {
  /* --- Colors: Primary --- */
  --thunderid-color-primary-main: #4b6ef5;
  --thunderid-color-primary-light: #eef1fe;
  --thunderid-color-primary-dark: #3451d1;
  --thunderid-color-primary-contrastText: #ffffff;

  /* --- Colors: Secondary --- */
  --thunderid-color-secondary-main: #4b5563;
  --thunderid-color-secondary-light: #f3f4f6;
  --thunderid-color-secondary-contrastText: #ffffff;

  /* --- Colors: Background --- */
  --thunderid-color-background-surface: #ffffff;
  --thunderid-color-background-body: #f9fafb;
  --thunderid-color-background-disabled: #f3f4f6;
  --thunderid-color-background-muted: #f1f3f5;

  /* --- Colors: Text --- */
  --thunderid-color-text-primary: #111827;
  --thunderid-color-text-secondary: #6b7280;

  /* --- Colors: Border --- */
  --thunderid-color-border: #e5e7eb;
  --thunderid-color-border-focus: var(--thunderid-color-primary-main);

  /* --- Colors: Action states --- */
  --thunderid-color-action-hover: rgba(0, 0, 0, 0.04);
  --thunderid-color-action-selected: rgba(75, 110, 245, 0.08);
  --thunderid-color-action-focus: rgba(75, 110, 245, 0.12);
  --thunderid-color-action-disabled: rgba(0, 0, 0, 0.26);
  --thunderid-color-action-disabledBackground: rgba(0, 0, 0, 0.08);

  /* --- Colors: Semantic --- */
  --thunderid-color-error-main: #ef4444;
  --thunderid-color-error-light: #fef2f2;
  --thunderid-color-error-contrastText: #991b1b;
  --thunderid-color-success-main: #22c55e;
  --thunderid-color-success-light: #f0fdf4;
  --thunderid-color-success-contrastText: #166534;
  --thunderid-color-warning-main: #f59e0b;
  --thunderid-color-warning-light: #fffbeb;
  --thunderid-color-warning-contrastText: #92400e;
  --thunderid-color-info-main: #3b82f6;
  --thunderid-color-info-light: #eff6ff;
  --thunderid-color-info-contrastText: #1e40af;

  /* --- Spacing --- */
  --thunderid-spacing-unit: 8px;

  /* --- Border Radius --- */
  --thunderid-border-radius-xs: 4px;
  --thunderid-border-radius-small: 6px;
  --thunderid-border-radius-medium: 10px;
  --thunderid-border-radius-large: 14px;
  --thunderid-border-radius-full: 9999px;

  /* --- Shadows --- */
  --thunderid-shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
  --thunderid-shadow-small: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
  --thunderid-shadow-medium: 0 4px 12px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05);
  --thunderid-shadow-large: 0 10px 25px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.05);

  /* --- Transitions --- */
  --thunderid-transition-fast: 120ms ease;
  --thunderid-transition-normal: 180ms ease;
  --thunderid-transition-slow: 280ms ease;

  /* --- Focus Ring --- */
  --thunderid-focus-ring-width: 2px;
  --thunderid-focus-ring-offset: 2px;
  --thunderid-focus-ring-color: rgba(75, 110, 245, 0.35);

  /* --- Typography: Font Family --- */
  --thunderid-typography-fontFamily: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;

  /* --- Typography: Font Sizes --- */
  --thunderid-typography-fontSize-xs: 0.6875rem;  /* 11px */
  --thunderid-typography-fontSize-sm: 0.8125rem;  /* 13px */
  --thunderid-typography-fontSize-md: 0.875rem;   /* 14px */
  --thunderid-typography-fontSize-lg: 1rem;       /* 16px */
  --thunderid-typography-fontSize-xl: 1.125rem;   /* 18px */
  --thunderid-typography-fontSize-2xl: 1.375rem;  /* 22px */
  --thunderid-typography-fontSize-3xl: 1.75rem;   /* 28px */

  /* --- Typography: Font Weights --- */
  --thunderid-typography-fontWeight-normal: 400;
  --thunderid-typography-fontWeight-medium: 500;
  --thunderid-typography-fontWeight-semibold: 600;
  --thunderid-typography-fontWeight-bold: 700;

  /* --- Typography: Line Heights --- */
  --thunderid-typography-lineHeight-tight: 1.25;
  --thunderid-typography-lineHeight-normal: 1.5;
  --thunderid-typography-lineHeight-relaxed: 1.625;

  /* --- Typography: Letter Spacing --- */
  --thunderid-typography-letterSpacing-tight: -0.01em;
  --thunderid-typography-letterSpacing-normal: 0;
  --thunderid-typography-letterSpacing-wide: 0.025em;

  /* --- Component: Button --- */
  --thunderid-button-borderRadius: var(--thunderid-border-radius-small);
  --thunderid-button-fontWeight: var(--thunderid-typography-fontWeight-medium);
  --thunderid-button-sm-height: 30px;
  --thunderid-button-sm-paddingX: calc(var(--thunderid-spacing-unit) * 1.25);
  --thunderid-button-sm-fontSize: var(--thunderid-typography-fontSize-sm);
  --thunderid-button-md-height: 36px;
  --thunderid-button-md-paddingX: calc(var(--thunderid-spacing-unit) * 2);
  --thunderid-button-md-fontSize: var(--thunderid-typography-fontSize-md);
  --thunderid-button-lg-height: 42px;
  --thunderid-button-lg-paddingX: calc(var(--thunderid-spacing-unit) * 2.5);
  --thunderid-button-lg-fontSize: var(--thunderid-typography-fontSize-lg);

  /* --- Component: Input fields --- */
  --thunderid-input-borderRadius: var(--thunderid-border-radius-small);
  --thunderid-input-height: 36px;
  --thunderid-input-paddingX: calc(var(--thunderid-spacing-unit) * 1.25);
  --thunderid-input-fontSize: var(--thunderid-typography-fontSize-md);
  --thunderid-input-borderColor: var(--thunderid-color-border);
  --thunderid-input-focusBorderColor: var(--thunderid-color-primary-main);
  --thunderid-input-focusRing: 0 0 0 3px var(--thunderid-focus-ring-color);

  /* --- Component: Card --- */
  --thunderid-card-borderRadius: var(--thunderid-border-radius-medium);
  --thunderid-card-padding: calc(var(--thunderid-spacing-unit) * 2.5);
  --thunderid-card-shadow: var(--thunderid-shadow-small);
  --thunderid-card-borderColor: var(--thunderid-color-border);

  /* --- Component: Alert --- */
  --thunderid-alert-borderRadius: var(--thunderid-border-radius-small);
  --thunderid-alert-paddingX: calc(var(--thunderid-spacing-unit) * 1.5);
  --thunderid-alert-paddingY: calc(var(--thunderid-spacing-unit) * 1.25);

  /* --- Component: Checkbox --- */
  --thunderid-checkbox-size: 16px;

  /* --- Component: Avatar --- */
  --thunderid-avatar-size: 64px;
  --thunderid-avatar-fontSize: 1.375rem;

  /* --- Component: Dropdown --- */
  --thunderid-dropdown-borderRadius: var(--thunderid-border-radius-medium);
  --thunderid-dropdown-shadow: var(--thunderid-shadow-medium);
  --thunderid-dropdown-itemPaddingX: calc(var(--thunderid-spacing-unit) * 1.5);
  --thunderid-dropdown-itemPaddingY: calc(var(--thunderid-spacing-unit) * 1);

  /* --- Component overrides (set by ThemeProvider when configured) --- */
  --thunderid-component-button-root-borderRadius: var(--thunderid-button-borderRadius);
  --thunderid-component-field-root-borderRadius: var(--thunderid-input-borderRadius);
}
`;

export default DEFAULTS_CSS;
