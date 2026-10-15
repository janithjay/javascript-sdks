// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * The side of the element a tooltip appears on.
 */
export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

/**
 * Where a viewport-fixed tooltip goes: the point it is anchored at, in pixels from the viewport's top-left
 * corner, and the transform that puts it on its side of that point.
 */
export interface TooltipPlacement {
  left: number;
  top: number;
  transform: string;
}

// The space between the tooltip and the element it describes, in pixels.
const OFFSET = 8;

/**
 * Places a tooltip beside an element's on-screen box. The tooltip is positioned against the viewport, so a
 * container that scrolls or clips its overflow can't cut it off.
 *
 * @param rect - The element's box, from `getBoundingClientRect()`
 * @param position - The side of the element to show the tooltip on
 * @returns The tooltip's placement
 */
const placeTooltip = (rect: DOMRect, position: TooltipPosition): TooltipPlacement => {
  const centerX: number = rect.left + rect.width / 2;
  const centerY: number = rect.top + rect.height / 2;
  switch (position) {
    case 'top':
      return {left: centerX, top: rect.top - OFFSET, transform: 'translate(-50%, -100%)'};
    case 'left':
      return {left: rect.left - OFFSET, top: centerY, transform: 'translate(-100%, -50%)'};
    case 'right':
      return {left: rect.right + OFFSET, top: centerY, transform: 'translate(0, -50%)'};
    default:
      return {left: centerX, top: rect.bottom + OFFSET, transform: 'translate(-50%, 0)'};
  }
};

export default placeTooltip;
