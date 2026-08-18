// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * Styles for the Divider primitive component.
 *
 * BEM block: `.thunderid-divider`
 *
 * Modifiers:
 *   --horizontal   – full-width horizontal rule
 *   --vertical     – inline vertical bar
 *   --with-content – flex row with centred label between two lines
 *
 * Elements:
 *   __line | __content
 */
const DIVIDER_CSS = `
/* ============================================================
   Divider
   ============================================================ */

.thunderid-divider {
  box-sizing: border-box;
}

.thunderid-divider--horizontal {
  width: 100%;
  border: none;
  border-top: 1px solid var(--thunderid-color-border);
  margin: calc(var(--thunderid-spacing-unit) * 1) 0;
}

.thunderid-divider--vertical {
  display: inline-block;
  width: 1px;
  height: 100%;
  min-height: 1em;
  border: none;
  background-color: var(--thunderid-color-border);
  margin: 0 calc(var(--thunderid-spacing-unit) * 1);
  align-self: stretch;
}

.thunderid-divider--with-content {
  display: flex;
  align-items: center;
  gap: calc(var(--thunderid-spacing-unit) * 1);
  border: none;
  margin: calc(var(--thunderid-spacing-unit) * 1) 0;
}

.thunderid-divider__line {
  flex: 1;
  height: 1px;
  background-color: var(--thunderid-color-border);
}

.thunderid-divider__content {
  flex-shrink: 0;
  font-size: var(--thunderid-typography-fontSize-xs);
  color: var(--thunderid-color-text-secondary);
  padding: 0 calc(var(--thunderid-spacing-unit) * 0.5);
  font-family: var(--thunderid-typography-fontFamily);
  text-transform: uppercase;
  letter-spacing: var(--thunderid-typography-letterSpacing-wide);
  font-weight: var(--thunderid-typography-fontWeight-medium);
}
`;

export default DIVIDER_CSS;
