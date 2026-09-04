// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * Styles for the ChangeCredential presentation component.
 * Parity target: `@thunderid/react` BaseChangeCredential.styles.ts
 */
const CHANGE_CREDENTIAL_CSS = `
/* ============================================================
   ChangeCredential (React Parity)
   ============================================================ */

.thunderid-change-credential {
  display: flex;
  flex-direction: column;
  gap: calc(var(--thunderid-spacing-unit) * 2);
  width: 100%;
  box-sizing: border-box;
  font-family: var(--thunderid-typography-fontFamily);
}

.thunderid-change-credential--card {
  padding: calc(var(--thunderid-spacing-unit) * 3);
  border: 1px solid var(--thunderid-color-border);
  border-radius: var(--thunderid-border-radius-large, 8px);
  background: var(--thunderid-color-background-surface);
}

.thunderid-change-credential__heading {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.thunderid-change-credential__fields {
  display: flex;
  flex-direction: column;
  gap: calc(var(--thunderid-spacing-unit) * 2);
}

.thunderid-change-credential__requirements-heading {
  margin: 0 0 calc(var(--thunderid-spacing-unit) / 2) 0;
  font-size: 0.8125rem;
  opacity: 0.8;
}

.thunderid-change-credential__requirements {
  display: flex;
  flex-direction: column;
  gap: calc(var(--thunderid-spacing-unit) / 2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.thunderid-change-credential__requirement {
  display: flex;
  align-items: center;
  gap: var(--thunderid-spacing-unit);
  font-size: 0.8125rem;
  opacity: 0.7;
}

.thunderid-change-credential__requirement--passed {
  color: var(--thunderid-color-success-main);
  opacity: 1;
}

.thunderid-change-credential__requirement-icon {
  display: inline-flex;
  flex-shrink: 0;
  width: 14px;
  height: 14px;
}

.thunderid-change-credential__actions {
  display: flex;
  align-items: center;
  gap: var(--thunderid-spacing-unit);
}

.thunderid-change-credential__unavailable {
  position: relative;
  display: flex;
  width: 100%;
}

.thunderid-change-credential__unavailable-content {
  width: 100%;
  filter: blur(3px);
  opacity: 0.55;
  pointer-events: none;
  user-select: none;
}

.thunderid-change-credential__unavailable-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(var(--thunderid-spacing-unit) * 2);
}
`;

export default CHANGE_CREDENTIAL_CSS;
