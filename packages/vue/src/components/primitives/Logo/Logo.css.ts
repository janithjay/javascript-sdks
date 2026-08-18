// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * Styles for the Logo primitive component.
 *
 * BEM block: `.thunderid-logo`
 *
 * Elements:
 *   __image
 */
const LOGO_CSS = `
/* ============================================================
   Logo
   ============================================================ */

.thunderid-logo {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  transition: opacity var(--thunderid-transition-fast);
}

.thunderid-logo:hover {
  opacity: 0.85;
}

.thunderid-logo__image {
  display: block;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
}

.thunderid-logo__emoji {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  font-size: 1.75em;
}
`;

export default LOGO_CSS;
