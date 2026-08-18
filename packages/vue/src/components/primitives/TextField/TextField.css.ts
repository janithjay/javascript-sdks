// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * Styles for the TextField primitive component.
 *
 * BEM block: `.thunderid-text-field`
 *
 * Modifiers:
 *   --error  – shows validation error state
 *
 * Elements:
 *   __label | __required | __input | __error | __helper
 */
const TEXT_FIELD_CSS = `
/* ============================================================
   TextField
   ============================================================ */

.thunderid-text-field {
  display: flex;
  flex-direction: column;
  gap: calc(var(--thunderid-spacing-unit) * 0.5);
  font-family: var(--thunderid-typography-fontFamily);
  width: 100%;
  box-sizing: border-box;
}

.thunderid-text-field__label {
  font-size: var(--thunderid-typography-fontSize-sm);
  font-weight: var(--thunderid-typography-fontWeight-medium);
  color: var(--thunderid-color-text-primary);
  display: block;
  line-height: var(--thunderid-typography-lineHeight-normal);
}

.thunderid-text-field__required {
  color: var(--thunderid-color-error-main);
  margin-left: 2px;
}

.thunderid-text-field__input {
  width: 100%;
  height: var(--thunderid-input-height);
  padding: 0 var(--thunderid-input-paddingX);
  border: 1px solid var(--thunderid-input-borderColor);
  border-radius: var(--thunderid-input-borderRadius);
  font-family: var(--thunderid-typography-fontFamily);
  font-size: var(--thunderid-input-fontSize);
  color: var(--thunderid-color-text-primary);
  background-color: var(--thunderid-color-background-surface);
  box-sizing: border-box;
  transition:
    border-color var(--thunderid-transition-fast),
    box-shadow var(--thunderid-transition-fast);
  outline: none;
}
.thunderid-text-field__input:focus {
  border-color: var(--thunderid-input-focusBorderColor);
  box-shadow: var(--thunderid-input-focusRing);
}
.thunderid-text-field__input::placeholder {
  color: var(--thunderid-color-text-secondary);
}
.thunderid-text-field__input:disabled {
  background-color: var(--thunderid-color-background-disabled);
  color: var(--thunderid-color-action-disabled);
  cursor: not-allowed;
}

.thunderid-text-field--error .thunderid-text-field__input {
  border-color: var(--thunderid-color-error-main);
}
.thunderid-text-field--error .thunderid-text-field__input:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}

.thunderid-text-field__error {
  font-size: var(--thunderid-typography-fontSize-xs);
  color: var(--thunderid-color-error-contrastText);
  line-height: var(--thunderid-typography-lineHeight-normal);
}

.thunderid-text-field__helper {
  font-size: var(--thunderid-typography-fontSize-xs);
  color: var(--thunderid-color-text-secondary);
  line-height: var(--thunderid-typography-lineHeight-normal);
}
`;

export default TEXT_FIELD_CSS;
