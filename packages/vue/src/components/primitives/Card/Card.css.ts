// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * Styles for the Card primitive component.
 *
 * BEM block: `.thunderid-card`
 *
 * Modifiers:
 *   --elevated  – medium drop shadow
 *   --outlined  – 1px border, no shadow
 *   --flat      – neither shadow nor border (default)
 */
const CARD_CSS = `
/* ============================================================
   Card
   ============================================================ */

.thunderid-card {
  background-color: var(--thunderid-color-background-surface);
  border-radius: var(--thunderid-card-borderRadius);
  padding: var(--thunderid-card-padding);
  box-sizing: border-box;
  transition: box-shadow var(--thunderid-transition-normal);
}

.thunderid-card--elevated {
  box-shadow: var(--thunderid-card-shadow);
}

.thunderid-card--outlined {
  border: 1px solid var(--thunderid-card-borderColor);
}

/* .thunderid-card--flat: no shadow or border */
`;

export default CARD_CSS;
