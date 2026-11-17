// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * Styles for the ActiveSessions presentation component.
 * Parity target: `@thunderid/react` BaseActiveSessions.styles.ts
 */
const ACTIVE_SESSIONS_CSS = `
.thunderid-active-sessions {
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
  font-family: var(--thunderid-typography-fontFamily);
  color: var(--thunderid-color-text-primary);
}

.thunderid-active-sessions *,
.thunderid-active-sessions *::before,
.thunderid-active-sessions *::after {
  box-sizing: border-box;
}

.thunderid-active-sessions.thunderid-active-sessions--card {
  overflow: hidden;
  border: 1px solid var(--thunderid-color-border);
  border-radius: var(--thunderid-border-radius-large);
  background: var(--thunderid-color-background-surface);
}

.thunderid-active-sessions .thunderid-active-sessions__header {
  display: flex;
  gap: calc(var(--thunderid-spacing-unit) * 2);
  align-items: flex-start;
  justify-content: space-between;
  padding: 0 0 calc(var(--thunderid-spacing-unit) * 2);
  border-bottom: 1px solid var(--thunderid-color-border);
}

.thunderid-active-sessions.thunderid-active-sessions--card .thunderid-active-sessions__header {
  padding: calc(var(--thunderid-spacing-unit) * 2.25) calc(var(--thunderid-spacing-unit) * 2.75);
}

.thunderid-active-sessions .thunderid-active-sessions__heading {
  margin: 0 0 calc(var(--thunderid-spacing-unit) * 0.25);
  font-size: var(--thunderid-typography-fontSize-sm);
  font-weight: var(--thunderid-typography-fontWeight-semibold);
  color: var(--thunderid-color-text-primary);
}

.thunderid-active-sessions .thunderid-active-sessions__summary {
  margin: 0;
  font-size: var(--thunderid-typography-fontSize-xs);
  color: var(--thunderid-color-text-secondary);
}

.thunderid-active-sessions .thunderid-active-sessions__confirm {
  display: flex;
  gap: calc(var(--thunderid-spacing-unit) * 1.5);
  align-items: center;
  justify-content: space-between;
  padding: calc(var(--thunderid-spacing-unit) * 1.5) calc(var(--thunderid-spacing-unit) * 1.75);
  border: 1px solid color-mix(in srgb, var(--thunderid-color-error-main) 22%, transparent);
  border-radius: var(--thunderid-border-radius-medium);
  background: color-mix(in srgb, var(--thunderid-color-error-main) 7%, transparent);
}

.thunderid-active-sessions > .thunderid-active-sessions__confirm,
.thunderid-active-sessions > .thunderid-active-sessions__error {
  margin: calc(var(--thunderid-spacing-unit) * 2) 0 0;
}

.thunderid-active-sessions.thunderid-active-sessions--card > .thunderid-active-sessions__confirm,
.thunderid-active-sessions.thunderid-active-sessions--card > .thunderid-active-sessions__error {
  margin: calc(var(--thunderid-spacing-unit) * 2) calc(var(--thunderid-spacing-unit) * 2.75) 0;
}

.thunderid-active-sessions .thunderid-active-sessions__confirm-message {
  margin: 0;
  font-size: var(--thunderid-typography-fontSize-xs);
  color: var(--thunderid-color-text-secondary);
}

.thunderid-active-sessions .thunderid-active-sessions__confirm-actions {
  display: flex;
  flex-shrink: 0;
  gap: var(--thunderid-spacing-unit);
}

.thunderid-active-sessions .thunderid-active-sessions__loading {
  display: flex;
  justify-content: center;
  padding: calc(var(--thunderid-spacing-unit) * 3);
}

.thunderid-active-sessions .thunderid-active-sessions__empty {
  margin: 0;
  padding: calc(var(--thunderid-spacing-unit) * 3);
  color: var(--thunderid-color-text-secondary);
  font-size: var(--thunderid-typography-fontSize-xs);
  text-align: center;
}

.thunderid-active-sessions .thunderid-active-sessions__list {
  display: flex;
  flex-direction: column;
  gap: calc(var(--thunderid-spacing-unit) * 1.5);
  margin: 0;
  padding: calc(var(--thunderid-spacing-unit) * 2) 0 0;
  list-style: none;
}

.thunderid-active-sessions.thunderid-active-sessions--card .thunderid-active-sessions__list {
  padding: calc(var(--thunderid-spacing-unit) * 2) calc(var(--thunderid-spacing-unit) * 2.75) calc(var(--thunderid-spacing-unit) * 2.5);
}

.thunderid-active-sessions .thunderid-active-sessions__session {
  overflow: hidden;
  border: 1px solid var(--thunderid-color-border);
  border-radius: var(--thunderid-border-radius-medium);
  background: var(--thunderid-color-background-surface);
}

.thunderid-active-sessions .thunderid-active-sessions__session-header {
  display: flex;
  gap: calc(var(--thunderid-spacing-unit) * 1.75);
  align-items: center;
  padding: calc(var(--thunderid-spacing-unit) * 1.75) calc(var(--thunderid-spacing-unit) * 2);
}

.thunderid-active-sessions .thunderid-active-sessions__device-icon {
  position: relative;
  flex-shrink: 0;
  width: 42px;
  height: 42px;
}

.thunderid-active-sessions .thunderid-active-sessions__os-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border: 1px solid var(--thunderid-color-border);
  border-radius: 50%;
  background: color-mix(in srgb, var(--thunderid-color-text-primary) 7%, var(--thunderid-color-background-surface));
  color: var(--thunderid-color-text-primary);
}

.thunderid-active-sessions .thunderid-active-sessions__browser-icon {
  position: absolute;
  inset-inline-end: -3px;
  bottom: -3px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: 1px solid var(--thunderid-color-border);
  border-radius: 50%;
  background: var(--thunderid-color-background-surface);
  box-shadow: 0 0 0 2px var(--thunderid-color-background-surface);
  color: var(--thunderid-color-text-primary);
}

.thunderid-active-sessions .thunderid-active-sessions__session-title {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: var(--thunderid-spacing-unit);
  align-items: center;
  min-width: 0;
}

.thunderid-active-sessions .thunderid-active-sessions__device {
  font-size: var(--thunderid-typography-fontSize-sm);
  font-weight: var(--thunderid-typography-fontWeight-semibold);
  color: var(--thunderid-color-text-primary);
}

.thunderid-active-sessions .thunderid-active-sessions__current {
  padding: calc(var(--thunderid-spacing-unit) * 0.25) var(--thunderid-spacing-unit);
  border: 1px solid color-mix(in srgb, var(--thunderid-color-primary-main) 20%, transparent);
  border-radius: 20px;
  background: color-mix(in srgb, var(--thunderid-color-primary-main) 8%, transparent);
  color: color-mix(in srgb, var(--thunderid-color-primary-main) 55%, var(--thunderid-color-text-primary));
  font-size: calc(var(--thunderid-typography-fontSize-xs) * 0.875);
  font-weight: var(--thunderid-typography-fontWeight-medium);
  white-space: nowrap;
}

.thunderid-active-sessions .thunderid-active-sessions__details {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 0;
  border-top: 1px solid var(--thunderid-color-border);
  background: color-mix(in srgb, var(--thunderid-color-text-primary) 3%, transparent);
}

.thunderid-active-sessions .thunderid-active-sessions__detail {
  min-width: 0;
  padding: calc(var(--thunderid-spacing-unit) * 1.25) calc(var(--thunderid-spacing-unit) * 1.5);
}

.thunderid-active-sessions .thunderid-active-sessions__detail-label {
  font-size: calc(var(--thunderid-typography-fontSize-xs) * 0.875);
  font-weight: var(--thunderid-typography-fontWeight-medium);
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: var(--thunderid-color-text-secondary);
  margin-bottom: calc(var(--thunderid-spacing-unit) * 0.625);
}

.thunderid-active-sessions .thunderid-active-sessions__detail-value {
  margin: 0;
  font-size: var(--thunderid-typography-fontSize-xs);
  font-weight: var(--thunderid-typography-fontWeight-medium);
  color: var(--thunderid-color-text-primary);
  overflow-wrap: anywhere;
}

.thunderid-active-sessions .thunderid-active-sessions__detail-value--ip,
.thunderid-active-sessions .thunderid-active-sessions__detail-value--datetime {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: var(--thunderid-typography-fontSize-xs);
}

.thunderid-active-sessions .thunderid-active-sessions__detail-value--datetime {
  display: flex;
  flex-wrap: wrap;
  gap: calc(var(--thunderid-spacing-unit) * 0.25) var(--thunderid-spacing-unit);
  align-items: center;
}

.thunderid-active-sessions .thunderid-active-sessions__detail-ago {
  flex-basis: 100%;
  font-family: var(--thunderid-typography-fontFamily);
  font-size: var(--thunderid-typography-fontSize-xs);
  color: var(--thunderid-color-text-secondary);
}

.thunderid-active-sessions .thunderid-active-sessions__apps-row {
  display: flex;
  gap: calc(var(--thunderid-spacing-unit) * 1.25);
  align-items: center;
  padding: calc(var(--thunderid-spacing-unit) * 1.25) calc(var(--thunderid-spacing-unit) * 2);
  border-top: 1px solid var(--thunderid-color-border);
}

.thunderid-active-sessions .thunderid-active-sessions__apps-label {
  font-size: calc(var(--thunderid-typography-fontSize-xs) * 0.875);
  font-weight: var(--thunderid-typography-fontWeight-medium);
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: var(--thunderid-color-text-secondary);
  flex-shrink: 0;
}

.thunderid-active-sessions .thunderid-active-sessions__apps-strip {
  position: relative;
  display: flex;
  min-width: 0;
}

/* Padding keeps the icons' rings and focus outlines inside the scroll area, which would clip them. */
.thunderid-active-sessions .thunderid-active-sessions__apps {
  display: flex;
  align-items: center;
  min-width: 0;
  margin: 0;
  padding: calc(var(--thunderid-spacing-unit) * 0.5);
  list-style: none;
  overflow-x: auto;
  scrollbar-width: none;
}

.thunderid-active-sessions .thunderid-active-sessions__apps::-webkit-scrollbar {
  display: none;
}

/* Fades each side that has more to scroll to. A mask, so it works on any background. */
.thunderid-active-sessions .thunderid-active-sessions__apps--fade-left {
  mask-image: linear-gradient(to right, transparent, black calc(var(--thunderid-spacing-unit) * 3));
}

.thunderid-active-sessions .thunderid-active-sessions__apps--fade-right {
  mask-image: linear-gradient(to left, transparent, black calc(var(--thunderid-spacing-unit) * 3));
}

.thunderid-active-sessions .thunderid-active-sessions__apps--fade-left.thunderid-active-sessions__apps--fade-right {
  mask-image: linear-gradient(
    to right,
    transparent,
    black calc(var(--thunderid-spacing-unit) * 3),
    black calc(100% - var(--thunderid-spacing-unit) * 3),
    transparent
  );
}

.thunderid-active-sessions .thunderid-active-sessions__apps-scroll {
  position: absolute;
  top: 50%;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(var(--thunderid-spacing-unit) * 0.25);
  border: 1px solid var(--thunderid-color-border);
  border-radius: 50%;
  background: var(--thunderid-color-background-surface);
  color: var(--thunderid-color-text-primary);
  cursor: pointer;
}

.thunderid-active-sessions .thunderid-active-sessions__apps-scroll:hover {
  background: color-mix(in srgb, var(--thunderid-color-text-primary) 6%, var(--thunderid-color-background-surface));
}

.thunderid-active-sessions .thunderid-active-sessions__apps-scroll:focus-visible {
  outline: 2px solid var(--thunderid-color-primary-main);
  outline-offset: 2px;
}

.thunderid-active-sessions .thunderid-active-sessions__apps-scroll svg {
  width: 14px;
  height: 14px;
}

.thunderid-active-sessions .thunderid-active-sessions__apps-scroll--left {
  left: 0;
  transform: translateY(-50%) rotate(90deg);
}

.thunderid-active-sessions .thunderid-active-sessions__apps-scroll--right {
  right: 0;
  transform: translateY(-50%) rotate(-90deg);
}

.thunderid-active-sessions li.thunderid-active-sessions__app {
  display: flex;
  flex-shrink: 0;
}

.thunderid-active-sessions li.thunderid-active-sessions__app + li.thunderid-active-sessions__app {
  margin-left: calc(var(--thunderid-spacing-unit) * -0.75);
}

.thunderid-active-sessions li.thunderid-active-sessions__app:hover,
.thunderid-active-sessions li.thunderid-active-sessions__app:focus-within {
  z-index: 1;
}

.thunderid-active-sessions .thunderid-active-sessions__app-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  object-fit: cover;
  box-shadow: 0 0 0 2px var(--thunderid-color-background-surface);
}

.thunderid-active-sessions .thunderid-active-sessions__app-icon--glyph {
  font-size: var(--thunderid-typography-fontSize-lg);
}

.thunderid-active-sessions .thunderid-active-sessions__app-icon--initial {
  background: color-mix(in srgb, var(--thunderid-color-text-primary) 10%, var(--thunderid-color-background-surface));
  color: var(--thunderid-color-text-primary);
  font-size: var(--thunderid-typography-fontSize-xs);
  font-weight: var(--thunderid-typography-fontWeight-medium);
}

.thunderid-active-sessions span.thunderid-active-sessions__app {
  padding: calc(var(--thunderid-spacing-unit) * 0.25) calc(var(--thunderid-spacing-unit) * 1.125);
  border: 1px solid var(--thunderid-color-border);
  border-radius: var(--thunderid-border-radius-small);
  background: color-mix(in srgb, var(--thunderid-color-text-primary) 3%, transparent);
  color: var(--thunderid-color-text-secondary);
  font-size: var(--thunderid-typography-fontSize-xs);
}

.thunderid-active-sessions .thunderid-active-sessions__session .thunderid-active-sessions__confirm {
  padding: calc(var(--thunderid-spacing-unit) * 1.5) calc(var(--thunderid-spacing-unit) * 2);
  border: none;
  border-top: 1px solid color-mix(in srgb, var(--thunderid-color-error-main) 22%, transparent);
  border-radius: 0;
}

@media (max-width: 520px) {
  .thunderid-active-sessions .thunderid-active-sessions__header,
  .thunderid-active-sessions .thunderid-active-sessions__confirm,
  .thunderid-active-sessions .thunderid-active-sessions__session-header {
    flex-wrap: wrap;
  }

  .thunderid-active-sessions .thunderid-active-sessions__details {
    grid-template-columns: minmax(0, 1fr);
  }
}
`;

export default ACTIVE_SESSIONS_CSS;
