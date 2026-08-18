// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * Styles for the Spinner primitive component.
 *
 * BEM block: `.thunderid-spinner`
 *
 * Modifiers:
 *   Size: --small | --medium | --large
 *
 * Elements:
 *   __svg | __circle
 *
 * Note: The `thunder-spin` and `thunder-spinner-dash` keyframe animations
 * are defined in `styles/animations.css.ts` and shared with the Button component.
 */
const SPINNER_CSS = `
/* ============================================================
   Spinner
   ============================================================ */

.thunderid-spinner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--thunderid-color-primary-main);
}

.thunderid-spinner--small {
  width: calc(var(--thunderid-spacing-unit) * 2);
  height: calc(var(--thunderid-spacing-unit) * 2);
}

.thunderid-spinner--medium {
  width: calc(var(--thunderid-spacing-unit) * 2.5);
  height: calc(var(--thunderid-spacing-unit) * 2.5);
}

.thunderid-spinner--large {
  width: calc(var(--thunderid-spacing-unit) * 3.5);
  height: calc(var(--thunderid-spacing-unit) * 3.5);
}

.thunderid-spinner__svg {
  width: 100%;
  height: 100%;
  animation: thunder-spin 1.4s linear infinite;
}

.thunderid-spinner__circle {
  stroke-dasharray: 80, 200;
  stroke-dashoffset: 0;
  animation: thunder-spinner-dash 1.4s ease-in-out infinite;
}
`;

export default SPINNER_CSS;
