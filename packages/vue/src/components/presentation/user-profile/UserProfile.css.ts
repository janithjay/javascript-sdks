/**
 * Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com).
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/**
 * Styles for the UserProfile presentation component.
 * Parity target: `@thunderid/react` BaseUserProfile.styles.ts
 */
const USER_PROFILE_CSS = `
/* ============================================================
   UserProfile (React Parity)
   ============================================================ */

.thunderid-user-profile {
  display: flex;
  flex-direction: column;
  padding: calc(var(--thunder-spacing-unit) * 4);
  min-width: 600px;
  margin: 0 auto;
  font-family: var(--thunder-typography-fontFamily);
  background: var(--thunder-color-background-surface);
  border-radius: var(--thunder-border-radius-large, 8px);
  box-sizing: border-box;
}

/* ── Hero (avatar + name + subtitle) ────────────────────────── */

.thunderid-user-profile__hero {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: calc(var(--thunder-spacing-unit) * 1);
  padding-bottom: calc(var(--thunder-spacing-unit) * 2);
  margin-bottom: calc(var(--thunder-spacing-unit) * 2);
  border-bottom: 1px solid var(--thunder-color-border);
}

.thunderid-user-profile__avatar-wrapper {
  position: relative;
  border-radius: 50%;
}

.thunderid-user-profile__avatar {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.thunderid-user-profile__avatar--sm {
  width: 48px;
  height: 48px;
}

.thunderid-user-profile__avatar--sm .thunderid-user-profile__avatar-initials {
  font-size: 1rem;
}

.thunderid-user-profile__avatar--md {
  width: 64px;
  height: 64px;
}

.thunderid-user-profile__avatar--md .thunderid-user-profile__avatar-initials {
  font-size: 1.25rem;
}

.thunderid-user-profile__avatar--lg {
  width: 70px;
  height: 70px;
}

.thunderid-user-profile__avatar--lg .thunderid-user-profile__avatar-initials {
  font-size: 1.5rem;
}

.thunderid-user-profile__avatar-initials {
  color: #ffffff;
  font-weight: var(--thunder-typography-fontWeight-semibold, 600);
  line-height: 1;
  letter-spacing: 0.02em;
  pointer-events: none;
  user-select: none;
}

.thunderid-user-profile__hero-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-top: calc(var(--thunder-spacing-unit) * 0.5);
}

.thunderid-user-profile__hero-name {
  font-size: var(--thunder-typography-fontSize-xl, 1.5rem);
  font-weight: var(--thunder-typography-fontWeight-semibold, 600);
  color: var(--thunder-color-text-primary);
  margin: 0;
  line-height: var(--thunder-typography-lineHeight-tight, 1.2);
}

.thunderid-user-profile__hero-subtitle {
  font-size: var(--thunder-typography-fontSize-sm, 0.875rem);
  color: var(--thunder-color-text-secondary);
  margin-top: calc(var(--thunder-spacing-unit) * 0.5);
  line-height: var(--thunder-typography-lineHeight-normal, 1.4);
}

/* ── Alerts & loading ────────────────────────────────────────── */

.thunderid-user-profile__error {
  margin-bottom: calc(var(--thunder-spacing-unit) * 3);
}

.thunderid-user-profile__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(var(--thunder-spacing-unit) * 4) 0;
}

/* ── Fields ──────────────────────────────────────────────────── */

.thunderid-user-profile__fields {
  display: flex;
  flex-direction: column;
}

.thunderid-user-profile__field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(var(--thunder-spacing-unit) * 1.5) 0;
  border-bottom: 1px solid var(--thunder-color-border);
  min-height: 28px;
  box-sizing: border-box;
}

.thunderid-user-profile__field:last-child {
  border-bottom: none;
}

.thunderid-user-profile__field-inner {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--thunder-spacing-unit);
}

.thunderid-user-profile__field-label {
  font-size: var(--thunder-typography-fontSize-sm, 0.875rem);
  font-weight: var(--thunder-typography-fontWeight-medium, 500);
  color: var(--thunder-color-text-secondary);
  width: 120px;
  flex-shrink: 0;
  line-height: 28px;
  text-align: start;
}

.thunderid-user-profile__field-value {
  color: var(--thunder-color-text-primary);
  flex: 1;
  display: inline-block;
  align-items: center;
  font-size: var(--thunder-typography-fontSize-sm, 0.875rem);
  line-height: 28px;
  word-break: break-word;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 350px;
  text-align: start;
  overflow: hidden;
}

.thunderid-user-profile__field-placeholder {
  font-size: var(--thunder-typography-fontSize-sm, 0.875rem);
  font-style: italic;
  color: var(--thunder-color-text-secondary);
  opacity: 0.7;
  cursor: pointer;
  text-decoration: underline;
  white-space: nowrap;
  line-height: 28px;
}

.thunderid-user-profile__field-placeholder:hover {
  opacity: 1;
}

.thunderid-user-profile__field-actions {
  display: flex;
  gap: calc(var(--thunder-spacing-unit) * 0.5);
  align-items: center;
  margin-inline-start: calc(var(--thunder-spacing-unit) * 4);
}

.thunderid-user-profile__field-edit-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--thunder-color-text-secondary);
  padding: 0;
  min-height: auto;
  opacity: 0.7;
  line-height: 0;
  transition: opacity var(--thunder-transition-fast, 0.15s ease);
}

.thunderid-user-profile__field-edit-btn:hover {
  opacity: 1;
  background: transparent;
}

.thunderid-user-profile__field-edit {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: calc(var(--thunder-spacing-unit) * 0.5);
}

.thunderid-user-profile__field-error {
  color: var(--thunder-color-error, #d32f2f);
  font-size: var(--thunder-typography-fontSize-xs, 0.8rem);
  font-weight: var(--thunder-typography-fontWeight-medium, 500);
  margin-top: calc(var(--thunder-spacing-unit) * 0.5);
}

/* ── Footer ──────────────────────────────────────────────────── */

.thunderid-user-profile__footer {
  padding-top: calc(var(--thunder-spacing-unit) * 2);
  border-top: 1px solid var(--thunder-color-border);
}

/* ── Compact modifier ────────────────────────────────────────── */

.thunderid-user-profile--compact {
  padding: calc(var(--thunder-spacing-unit) * 2);
  min-width: 100%;
}
`;

export default USER_PROFILE_CSS;
