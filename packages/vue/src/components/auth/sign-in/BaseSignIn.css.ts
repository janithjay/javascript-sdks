// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * Layout styles for the BaseSignIn composition.
 *
 * BEM block: `.thunderid-signin`
 *
 * Mirrors the layout constants in the React SDK's `BaseSignIn.styles.ts`
 * (min-width, content gap, logo sizing) so the sign-in card renders with the
 * same proportions across frameworks.
 */
const BASE_SIGN_IN_CSS = `
/* ============================================================
   BaseSignIn
   ============================================================ */

.thunderid-signin {
  min-width: 420px;
  margin: 0 auto;
  font-family: var(--thunderid-typography-fontFamily, inherit);
  border-radius: var(--thunderid-border-radius-large);
}

.thunderid-signin__content {
  display: flex;
  flex-direction: column;
  gap: calc(var(--thunderid-spacing-unit) * 2);
}

.thunderid-signin__content > img,
.thunderid-signin__content > span[role='img'] {
  /* Flex column's default 'stretch' would otherwise force width: auto to fill
     the container instead of shrinking to the image's intrinsic size. */
  align-self: center;
  display: block;
  margin: 0 0 calc(var(--thunderid-spacing-unit) * 1) 0;
  border-radius: var(--thunderid-border-radius-small);
}

.thunderid-signin__messages {
  margin-top: calc(var(--thunderid-spacing-unit) * 2);
}

.thunderid-signin__messages > * + * {
  margin-top: calc(var(--thunderid-spacing-unit) * 1);
}
`;

export default BASE_SIGN_IN_CSS;
