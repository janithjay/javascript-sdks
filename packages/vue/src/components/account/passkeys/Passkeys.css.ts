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

.thunderid-passkeys--card {
  padding: var(--thunderid-card-padding);
  border: 1px solid var(--thunderid-card-borderColor);
  border-radius: var(--thunderid-card-borderRadius);
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
  color: var(--thunderid-color-text-primary);
}

.thunderid-passkeys__description,
.thunderid-passkeys__empty,
.thunderid-passkeys__panel-text {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--thunderid-color-text-secondary);
}

.thunderid-passkeys__empty {
  padding: calc(var(--thunderid-spacing-unit) * 2.75) calc(var(--thunderid-spacing-unit) * 2);
  text-align: center;
  border: 1px dashed var(--thunderid-color-border);
  border-radius: var(--thunderid-border-radius-medium);
}

.thunderid-passkeys__list {
  display: flex;
  flex-direction: column;
  gap: calc(var(--thunderid-spacing-unit) * 1.25);
  margin: 0;
  padding: 0;
  list-style: none;
}

.thunderid-passkeys__item {
  display: flex;
  flex-direction: column;
  gap: calc(var(--thunderid-spacing-unit) * 1.5);
  padding: calc(var(--thunderid-spacing-unit) * 1.5) calc(var(--thunderid-spacing-unit) * 1.75);
  border: 1px solid var(--thunderid-color-border);
  border-radius: var(--thunderid-border-radius-medium);
}

.thunderid-passkeys__item-row {
  display: flex;
  align-items: center;
  gap: calc(var(--thunderid-spacing-unit) * 1.75);
}

.thunderid-passkeys__confirm {
  display: flex;
  flex-direction: column;
  gap: var(--thunderid-spacing-unit);
  padding-top: calc(var(--thunderid-spacing-unit) * 1.5);
  border-top: 1px solid var(--thunderid-color-border);
}

.thunderid-passkeys__icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: var(--thunderid-color-text-secondary);
  background: var(--thunderid-color-action-hover);
  border-radius: var(--thunderid-border-radius-medium, 6px);
}

.thunderid-passkeys__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-weight: 500;
  color: var(--thunderid-color-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.thunderid-passkeys__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--thunderid-spacing-unit);
}

.thunderid-passkeys__loading {
  display: flex;
  justify-content: center;
  padding: calc(var(--thunderid-spacing-unit) * 2);
}

.thunderid-passkeys__panel {
  display: flex;
  flex-direction: column;
  gap: calc(var(--thunderid-spacing-unit) * 1.5);
  padding: calc(var(--thunderid-spacing-unit) * 2.5);
  border: 1px solid var(--thunderid-color-border);
  border-radius: var(--thunderid-border-radius-medium);
}

.thunderid-passkeys__panel-heading {
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 500;
  color: var(--thunderid-color-text-primary);
}

.thunderid-passkeys__panel-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  color: var(--thunderid-color-primary-main);
  background: color-mix(in srgb, var(--thunderid-color-primary-main) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--thunderid-color-primary-main) 30%, transparent);
  border-radius: 50%;
}

.thunderid-passkeys__benefits {
  display: flex;
  flex-direction: column;
  gap: var(--thunderid-spacing-unit);
  margin: 0;
  padding: 0;
  list-style: none;
}

.thunderid-passkeys__benefit {
  display: flex;
  align-items: center;
  gap: calc(var(--thunderid-spacing-unit) * 1.25);
  font-size: 0.75rem;
  color: var(--thunderid-color-text-secondary);
}

.thunderid-passkeys__benefit-icon {
  display: inline-flex;
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  color: var(--thunderid-color-success-main);
}

.thunderid-passkeys__waiting {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(var(--thunderid-spacing-unit) * 1.5);
  padding: calc(var(--thunderid-spacing-unit) * 1.5) 0;
  text-align: center;
}

.thunderid-passkeys__name-form {
  display: flex;
  flex-direction: column;
  gap: calc(var(--thunderid-spacing-unit) * 1.5);
}

.thunderid-passkeys__created {
  display: flex;
  align-items: center;
  gap: calc(var(--thunderid-spacing-unit) * 1.25);
}

.thunderid-passkeys__created-icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 28px;
  height: 28px;
  padding: 6px;
  color: var(--thunderid-color-success-main);
  background: color-mix(in srgb, var(--thunderid-color-success-main) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--thunderid-color-success-main) 30%, transparent);
  border-radius: 50%;
}
`;

export default PASSKEYS_CSS;
