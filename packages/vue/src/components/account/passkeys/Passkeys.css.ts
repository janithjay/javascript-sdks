// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * Styles for the Passkeys presentation component.
 * Parity target: `@thunderid/react` BasePasskeys.styles.ts
 */
const PASSKEYS_CSS = `
/* ============================================================
   Passkeys (React Parity)
   ============================================================ */

.thunderid-passkeys {
  display: flex;
  flex-direction: column;
  gap: calc(var(--thunderid-spacing-unit) * 2);
  width: 100%;
  box-sizing: border-box;
  font-family: var(--thunderid-typography-fontFamily);
}

.thunderid-passkeys:focus {
  outline: none;
}

.thunderid-passkeys--card {
  padding: calc(var(--thunderid-spacing-unit) * 3);
  border: 1px solid var(--thunderid-color-border);
  border-radius: var(--thunderid-border-radius-large, 8px);
  background: var(--thunderid-color-background-surface);
}

.thunderid-passkeys__header {
  display: flex;
  flex-direction: column;
  gap: calc(var(--thunderid-spacing-unit) / 2);
}

.thunderid-passkeys__heading {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.thunderid-passkeys__description,
.thunderid-passkeys__empty {
  margin: 0;
  font-size: 0.875rem;
  color: var(--thunderid-color-text-secondary);
}

.thunderid-passkeys__list {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
  border: 1px solid var(--thunderid-color-border);
  border-radius: var(--thunderid-border-radius-medium, 6px);
}

.thunderid-passkeys__item {
  display: flex;
  flex-direction: column;
  gap: calc(var(--thunderid-spacing-unit) * 1.5);
  padding: calc(var(--thunderid-spacing-unit) * 1.5) calc(var(--thunderid-spacing-unit) * 2);
}

.thunderid-passkeys__item + .thunderid-passkeys__item {
  border-top: 1px solid var(--thunderid-color-border);
}

.thunderid-passkeys__item-row {
  display: flex;
  align-items: center;
  gap: calc(var(--thunderid-spacing-unit) * 1.5);
}

.thunderid-passkeys__icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: var(--thunderid-color-text-secondary);
  background: var(--thunderid-color-action-hover);
  border-radius: var(--thunderid-border-radius-medium, 6px);
}

.thunderid-passkeys__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-weight: 600;
  color: var(--thunderid-color-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.thunderid-passkeys__confirm {
  display: flex;
  flex-direction: column;
  gap: var(--thunderid-spacing-unit);
  padding: calc(var(--thunderid-spacing-unit) * 1.5);
  background: var(--thunderid-color-action-hover);
  border-radius: var(--thunderid-border-radius-medium, 6px);
}

.thunderid-passkeys__confirm-heading,
.thunderid-passkeys__confirm-message {
  margin: 0;
  font-size: 0.875rem;
}

.thunderid-passkeys__confirm-heading {
  font-weight: 600;
}

.thunderid-passkeys__confirm-message {
  color: var(--thunderid-color-text-secondary);
}

.thunderid-passkeys__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--thunderid-spacing-unit);
}

.thunderid-passkeys__add-form {
  display: flex;
  flex-direction: column;
  gap: calc(var(--thunderid-spacing-unit) * 1.5);
}

.thunderid-passkeys__loading {
  display: flex;
  justify-content: center;
  padding: calc(var(--thunderid-spacing-unit) * 2);
}
`;

export default PASSKEYS_CSS;
