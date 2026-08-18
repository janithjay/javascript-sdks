// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * Styles for the Alert primitive component.
 *
 * BEM block: `.thunderid-alert`
 *
 * Modifiers:
 *   Severity: --info | --success | --warning | --error
 *
 * Elements:
 *   __content | __dismiss
 */
const ALERT_CSS = `
/* ============================================================
   Alert
   ============================================================ */

.thunderid-alert {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: calc(var(--thunderid-spacing-unit) * 1);
  padding: var(--thunderid-alert-paddingY) var(--thunderid-alert-paddingX);
  border-radius: var(--thunderid-alert-borderRadius);
  border: 1px solid transparent;
  font-family: var(--thunderid-typography-fontFamily);
  font-size: var(--thunderid-typography-fontSize-sm);
  box-sizing: border-box;
  width: 100%;
  line-height: var(--thunderid-typography-lineHeight-normal);
}

.thunderid-alert__content {
  flex: 1;
}

.thunderid-alert--info {
  background-color: var(--thunderid-color-info-light);
  border-color: var(--thunderid-color-info-main);
  color: var(--thunderid-color-info-contrastText);
}

.thunderid-alert--success {
  background-color: var(--thunderid-color-success-light);
  border-color: var(--thunderid-color-success-main);
  color: var(--thunderid-color-success-contrastText);
}

.thunderid-alert--warning {
  background-color: var(--thunderid-color-warning-light);
  border-color: var(--thunderid-color-warning-main);
  color: var(--thunderid-color-warning-contrastText);
}

.thunderid-alert--error {
  background-color: var(--thunderid-color-error-light);
  border-color: var(--thunderid-color-error-main);
  color: var(--thunderid-color-error-contrastText);
}

.thunderid-alert__dismiss {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1em;
  line-height: 0;
  padding: calc(var(--thunderid-spacing-unit) * 0.25);
  border-radius: var(--thunderid-border-radius-xs);
  color: inherit;
  opacity: 0.6;
  flex-shrink: 0;
  transition: opacity var(--thunderid-transition-fast), background-color var(--thunderid-transition-fast);
}
.thunderid-alert__dismiss:hover {
  opacity: 1;
  background-color: var(--thunderid-color-action-hover);
}
`;

export default ALERT_CSS;
