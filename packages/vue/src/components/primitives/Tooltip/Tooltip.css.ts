// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * Styles for the Tooltip primitive component.
 *
 * BEM block: `.thunderid-tooltip`
 *
 * Elements:
 *   __container – the wrapped element, which the tooltip is positioned against
 *   __box       – the tooltip, placed against the viewport, with a --top, --bottom, --left or --right modifier
 *   __arrow     – the arrow pointing from the box to the wrapped element
 */
const TOOLTIP_CSS = `
/* ============================================================
   Tooltip
   ============================================================ */

@keyframes thunderid-tooltip-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.thunderid-tooltip__container {
  position: relative;
  display: inline-block;
}

.thunderid-tooltip__box {
  position: fixed;
  z-index: 1000;
  width: max-content;
  max-width: 250px;
  padding: 6px 12px;
  border-radius: 6px;
  background-color: #333;
  color: #fff;
  font-family: var(--thunderid-typography-fontFamily);
  font-size: 0.85rem;
  text-align: start;
  white-space: normal;
  overflow-wrap: break-word;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
  animation: thunderid-tooltip-fade-in 0.15s ease-in-out;
}

.thunderid-tooltip__arrow {
  position: absolute;
  width: 0;
  height: 0;
  border-style: solid;
}

.thunderid-tooltip__box--top .thunderid-tooltip__arrow {
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 5px 5px 0 5px;
  border-color: #333 transparent transparent transparent;
}

.thunderid-tooltip__box--bottom .thunderid-tooltip__arrow {
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 0 5px 5px 5px;
  border-color: transparent transparent #333 transparent;
}

.thunderid-tooltip__box--left .thunderid-tooltip__arrow {
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  border-width: 5px 0 5px 5px;
  border-color: transparent transparent transparent #333;
}

.thunderid-tooltip__box--right .thunderid-tooltip__arrow {
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  border-width: 5px 5px 5px 0;
  border-color: transparent #333 transparent transparent;
}
`;

export default TOOLTIP_CSS;
