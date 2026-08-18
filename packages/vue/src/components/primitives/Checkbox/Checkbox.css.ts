// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * Styles for the Checkbox primitive component.
 *
 * BEM block: `.thunderid-checkbox`
 *
 * Modifiers:
 *   --error  – shows validation error state
 *
 * Elements:
 *   __wrapper | __input | __label | __error
 */
const CHECKBOX_CSS = `
/* ============================================================
   Checkbox
   ============================================================ */

.thunderid-checkbox {
  display: flex;
  flex-direction: column;
  gap: calc(var(--thunderid-spacing-unit) * 0.5);
  font-family: var(--thunderid-typography-fontFamily);
}

.thunderid-checkbox__wrapper {
  display: inline-flex;
  align-items: center;
  gap: calc(var(--thunderid-spacing-unit) * 0.75);
  cursor: pointer;
  user-select: none;
}

.thunderid-checkbox__input {
  width: var(--thunderid-checkbox-size);
  height: var(--thunderid-checkbox-size);
  cursor: pointer;
  accent-color: var(--thunderid-color-primary-main);
  flex-shrink: 0;
  border-radius: var(--thunderid-border-radius-xs);
}
.thunderid-checkbox__input:focus-visible {
  outline: none;
  box-shadow: 0 0 0 var(--thunderid-focus-ring-width) var(--thunderid-focus-ring-color);
}
.thunderid-checkbox__input:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.thunderid-checkbox__label {
  font-size: var(--thunderid-typography-fontSize-md);
  color: var(--thunderid-color-text-primary);
  line-height: var(--thunderid-typography-lineHeight-normal);
}

.thunderid-checkbox__error {
  font-size: var(--thunderid-typography-fontSize-xs);
  color: var(--thunderid-color-error-contrastText);
  line-height: var(--thunderid-typography-lineHeight-normal);
}
`;

export default CHECKBOX_CSS;
