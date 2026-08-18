// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * Styles for the Typography primitive component.
 *
 * BEM block: `.thunderid-typography`
 *
 * Modifiers (variant):
 *   --h1 | --h2 | --h3 | --h4 | --h5 | --h6
 *   --subtitle1 | --subtitle2
 *   --body1 | --body2
 *   --caption | --overline
 */
const TYPOGRAPHY_CSS = `
/* ============================================================
   Typography
   ============================================================ */

.thunderid-typography {
  font-family: var(--thunderid-typography-fontFamily);
  color: var(--thunderid-color-text-primary);
  margin: 0;
  line-height: var(--thunderid-typography-lineHeight-normal);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.thunderid-typography--h1 {
  font-size: var(--thunderid-typography-fontSize-3xl);
  font-weight: var(--thunderid-typography-fontWeight-bold);
  line-height: var(--thunderid-typography-lineHeight-tight);
  letter-spacing: var(--thunderid-typography-letterSpacing-tight);
}

.thunderid-typography--h2 {
  font-size: var(--thunderid-typography-fontSize-2xl);
  font-weight: var(--thunderid-typography-fontWeight-bold);
  line-height: var(--thunderid-typography-lineHeight-tight);
  letter-spacing: var(--thunderid-typography-letterSpacing-tight);
}

.thunderid-typography--h3 {
  font-size: var(--thunderid-typography-fontSize-xl);
  font-weight: var(--thunderid-typography-fontWeight-semibold);
  line-height: var(--thunderid-typography-lineHeight-tight);
}

.thunderid-typography--h4 {
  font-size: var(--thunderid-typography-fontSize-lg);
  font-weight: var(--thunderid-typography-fontWeight-semibold);
}

.thunderid-typography--h5 {
  font-size: var(--thunderid-typography-fontSize-md);
  font-weight: var(--thunderid-typography-fontWeight-semibold);
}

.thunderid-typography--h6 {
  font-size: var(--thunderid-typography-fontSize-sm);
  font-weight: var(--thunderid-typography-fontWeight-semibold);
  text-transform: uppercase;
  letter-spacing: var(--thunderid-typography-letterSpacing-wide);
}

.thunderid-typography--subtitle1 {
  font-size: var(--thunderid-typography-fontSize-lg);
  font-weight: var(--thunderid-typography-fontWeight-medium);
}

.thunderid-typography--subtitle2 {
  font-size: var(--thunderid-typography-fontSize-md);
  font-weight: var(--thunderid-typography-fontWeight-medium);
  color: var(--thunderid-color-text-secondary);
}

.thunderid-typography--body1 {
  font-size: var(--thunderid-typography-fontSize-md);
  font-weight: var(--thunderid-typography-fontWeight-normal);
  line-height: var(--thunderid-typography-lineHeight-relaxed);
}

.thunderid-typography--body2 {
  font-size: var(--thunderid-typography-fontSize-sm);
  font-weight: var(--thunderid-typography-fontWeight-normal);
  line-height: var(--thunderid-typography-lineHeight-relaxed);
  color: var(--thunderid-color-text-secondary);
}

.thunderid-typography--caption {
  font-size: var(--thunderid-typography-fontSize-xs);
  font-weight: var(--thunderid-typography-fontWeight-normal);
  color: var(--thunderid-color-text-secondary);
}

.thunderid-typography--overline {
  font-size: var(--thunderid-typography-fontSize-xs);
  font-weight: var(--thunderid-typography-fontWeight-medium);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--thunderid-color-text-secondary);
}
`;

export default TYPOGRAPHY_CSS;
