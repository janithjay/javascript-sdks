// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * Styles for the UserDropdown presentation component.
 *
 * BEM block: `.thunderid-user-dropdown`
 *
 * Trigger modifiers:
 *   __trigger--open               – ring + border while menu is visible
 *   __avatar--sm / --lg           – trigger avatar size variants (default is 32 px)
 *
 * Menu modifiers:
 *   __menu--align-left            – panel opens to the left of the trigger
 *   __menu--size-sm               – compact menu (180 px min-width, tighter padding)
 *   __menu--size-lg               – spacious menu (280 px min-width, more padding)
 *
 * Item modifiers:
 *   __item--danger                – destructive action (red text/hover)
 *
 * Elements:
 *   __chevron                     – rotates 180° when menu is open
 *   __menu-header                 – user identity section at top of menu
 *   __menu-header-avatar          – gradient avatar circle in header
 *   __menu-header-info            – name + subtitle column
 *   __menu-header-name            – bold display name
 *   __menu-header-subtitle        – muted email / username
 *   __menu-divider                – thin horizontal separator
 */
const USER_DROPDOWN_CSS = `
/* ============================================================
   UserDropdown
   ============================================================ */

.thunderid-user-dropdown {
  position: relative;
  display: inline-block;
  font-family: var(--thunderid-typography-fontFamily);
}

/* ── Trigger ─────────────────────────────────────────────────── */

.thunderid-user-dropdown__trigger {
  display: inline-flex;
  align-items: center;
  gap: calc(var(--thunderid-spacing-unit) * 0.5);
  padding: 3px;
  background: none;
  border: 2px solid transparent;
  border-radius: var(--thunderid-border-radius-full);
  cursor: pointer;
  color: var(--thunderid-color-text-primary);
  transition:
    border-color var(--thunderid-transition-fast),
    box-shadow var(--thunderid-transition-fast);
  box-sizing: border-box;
  outline: none;
}

.thunderid-user-dropdown__trigger:hover {
  border-color: var(--thunderid-color-primary-main);
}

.thunderid-user-dropdown__trigger--open {
  border-color: var(--thunderid-color-primary-main);
  box-shadow: 0 0 0 3px var(--thunderid-focus-ring-color);
}

.thunderid-user-dropdown__trigger:focus-visible {
  border-color: var(--thunderid-color-primary-main);
  box-shadow: 0 0 0 var(--thunderid-focus-ring-width) var(--thunderid-focus-ring-color);
}

/* ── Trigger avatar ──────────────────────────────────────────── */

.thunderid-user-dropdown__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  max-width: 32px;
  max-height: 32px;
  border-radius: 50%;
  color: #ffffff;
  flex-shrink: 0;
  font-size: var(--thunderid-typography-fontSize-sm);
  font-weight: var(--thunderid-typography-fontWeight-semibold);
  line-height: 1;
  user-select: none;
  pointer-events: none;
  object-fit: cover;
}

img.thunderid-user-dropdown__avatar {
  object-fit: cover;
  border-radius: 50%;
}

/* sm — 28 px */
.thunderid-user-dropdown__avatar--sm {
  width: 28px;
  height: 28px;
  max-width: 28px;
  max-height: 28px;
  font-size: var(--thunderid-typography-fontSize-xs);
}

/* lg — 38 px */
.thunderid-user-dropdown__avatar--lg {
  width: 38px;
  height: 38px;
  max-width: 38px;
  max-height: 38px;
  font-size: var(--thunderid-typography-fontSize-md);
}

/* ── Chevron ─────────────────────────────────────────────────── */

.thunderid-user-dropdown__chevron {
  display: inline-flex;
  align-items: center;
  color: var(--thunderid-color-text-secondary);
  transition: transform var(--thunderid-transition-normal);
  padding-right: calc(var(--thunderid-spacing-unit) * 0.25);
}

.thunderid-user-dropdown__trigger--open .thunderid-user-dropdown__chevron {
  transform: rotate(180deg);
}

/* ── Dropdown menu ───────────────────────────────────────────── */

.thunderid-user-dropdown__menu {
  position: absolute;
  top: calc(100% + calc(var(--thunderid-spacing-unit) * 0.75));
  right: 0;
  z-index: 1000;
  background-color: var(--thunderid-color-background-surface);
  border: 1px solid var(--thunderid-color-border);
  border-radius: var(--thunderid-dropdown-borderRadius);
  box-shadow: var(--thunderid-dropdown-shadow);
  overflow: hidden;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  animation: thunderid-dropdown-enter var(--thunderid-transition-fast) ease;
}

/* Alignment */

.thunderid-user-dropdown__menu--align-left {
  right: auto;
  left: 0;
}

/* Size: sm */

.thunderid-user-dropdown__menu--size-sm {
  min-width: 180px;
}

.thunderid-user-dropdown__menu--size-sm .thunderid-user-dropdown__menu-header {
  padding: calc(var(--thunderid-spacing-unit) * 1.25) calc(var(--thunderid-spacing-unit) * 1.5);
  gap: calc(var(--thunderid-spacing-unit) * 1);
}

.thunderid-user-dropdown__menu--size-sm .thunderid-user-dropdown__menu-header-avatar {
  width: 30px;
  height: 30px;
  font-size: var(--thunderid-typography-fontSize-sm);
}

.thunderid-user-dropdown__menu--size-sm .thunderid-user-dropdown__item {
  padding: calc(var(--thunderid-spacing-unit) * 0.75) calc(var(--thunderid-spacing-unit) * 1.5);
  font-size: var(--thunderid-typography-fontSize-xs);
}

/* Size: lg */

.thunderid-user-dropdown__menu--size-lg {
  min-width: 280px;
}

.thunderid-user-dropdown__menu--size-lg .thunderid-user-dropdown__menu-header {
  padding: calc(var(--thunderid-spacing-unit) * 2) calc(var(--thunderid-spacing-unit) * 2);
  gap: calc(var(--thunderid-spacing-unit) * 1.5);
}

.thunderid-user-dropdown__menu--size-lg .thunderid-user-dropdown__menu-header-avatar {
  width: 42px;
  height: 42px;
  font-size: var(--thunderid-typography-fontSize-lg);
}

.thunderid-user-dropdown__menu--size-lg .thunderid-user-dropdown__item {
  padding: calc(var(--thunderid-spacing-unit) * 1.25) calc(var(--thunderid-spacing-unit) * 2);
  font-size: var(--thunderid-typography-fontSize-md);
}

@keyframes thunderid-dropdown-enter {
  from {
    opacity: 0;
    transform: translateY(-6px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ── Menu header (user identity) ─────────────────────────────── */

.thunderid-user-dropdown__menu-header {
  display: flex;
  align-items: center;
  gap: calc(var(--thunderid-spacing-unit) * 1.25);
  padding: calc(var(--thunderid-spacing-unit) * 1.5) calc(var(--thunderid-spacing-unit) * 1.75);
}

.thunderid-user-dropdown__menu-header-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  color: #ffffff;
  flex-shrink: 0;
  font-size: var(--thunderid-typography-fontSize-md);
  font-weight: var(--thunderid-typography-fontWeight-semibold);
  line-height: 1;
  user-select: none;
  object-fit: cover;
}

img.thunderid-user-dropdown__menu-header-avatar {
  object-fit: cover;
  border-radius: 50%;
}

.thunderid-user-dropdown__menu-header-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.thunderid-user-dropdown__menu-header-name {
  font-size: var(--thunderid-typography-fontSize-sm);
  font-weight: var(--thunderid-typography-fontWeight-semibold);
  color: var(--thunderid-color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: var(--thunderid-typography-lineHeight-tight);
}

.thunderid-user-dropdown__menu-header-subtitle {
  font-size: var(--thunderid-typography-fontSize-xs);
  color: var(--thunderid-color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: var(--thunderid-typography-lineHeight-normal);
}

/* ── Menu divider ────────────────────────────────────────────── */

.thunderid-user-dropdown__menu-divider {
  height: 1px;
  background-color: var(--thunderid-color-border);
  margin: calc(var(--thunderid-spacing-unit) * 0.5) 0;
  flex-shrink: 0;
}

/* ── Menu items ──────────────────────────────────────────────── */

.thunderid-user-dropdown__item {
  display: flex;
  align-items: center;
  gap: calc(var(--thunderid-spacing-unit) * 1);
  width: 100%;
  padding: calc(var(--thunderid-spacing-unit) * 1) calc(var(--thunderid-spacing-unit) * 1.75);
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  font-family: var(--thunderid-typography-fontFamily);
  font-size: var(--thunderid-typography-fontSize-sm);
  color: var(--thunderid-color-text-primary);
  transition: background-color var(--thunderid-transition-fast);
  box-sizing: border-box;
}

.thunderid-user-dropdown__item:hover {
  background-color: var(--thunderid-color-action-hover);
}

.thunderid-user-dropdown__item:focus-visible {
  outline: none;
  background-color: var(--thunderid-color-action-focus);
}

/* Danger variant (sign-out) */

.thunderid-user-dropdown__item--danger {
  color: var(--thunderid-color-error-main);
}

.thunderid-user-dropdown__item--danger:hover {
  background-color: var(--thunderid-color-error-light);
}

/* ── Modal overlay ───────────────────────────────────────────── */

.thunderid-user-dropdown__modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(3px);
  box-sizing: border-box;
  animation: thunderid-overlay-enter var(--thunderid-transition-fast) ease;
}

@keyframes thunderid-overlay-enter {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* ── Modal content ───────────────────────────────────────────── */

.thunderid-user-dropdown__modal-content {
  background: var(--thunderid-color-background-surface);
  border-radius: var(--thunderid-border-radius-large);
  box-shadow: var(--thunderid-shadow-large);
  max-width: 640px;
  width: 92%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  margin: auto;
  padding: calc(var(--thunderid-spacing-unit) * 3);
  box-sizing: border-box;
  animation: thunderid-modal-enter var(--thunderid-transition-normal) ease;
}

@keyframes thunderid-modal-enter {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ── Modal close button ──────────────────────────────────────── */

.thunderid-user-dropdown__modal-close {
  position: absolute;
  top: calc(var(--thunderid-spacing-unit) * 1.25);
  right: calc(var(--thunderid-spacing-unit) * 1.25);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--thunderid-color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(var(--thunderid-spacing-unit) * 0.625);
  border-radius: var(--thunderid-border-radius-small);
  z-index: 10001;
  transition:
    color var(--thunderid-transition-fast),
    background-color var(--thunderid-transition-fast);
  line-height: 0;
}

.thunderid-user-dropdown__modal-close:hover {
  color: var(--thunderid-color-text-primary);
  background-color: var(--thunderid-color-action-hover);
}

.thunderid-user-dropdown__modal-close:focus-visible {
  outline: none;
  box-shadow: 0 0 0 var(--thunderid-focus-ring-width) var(--thunderid-focus-ring-color);
}
`;

export default USER_DROPDOWN_CSS;
