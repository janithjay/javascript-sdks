// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it} from 'vitest';
import placeTooltip from '../placeTooltip';

const rect = {bottom: 140, height: 40, left: 100, right: 160, top: 100, width: 60} as DOMRect;

describe('placeTooltip', () => {
  it('centers the tooltip above or below the element, a small gap away', () => {
    expect(placeTooltip(rect, 'top')).toEqual({left: 130, top: 92, transform: 'translate(-50%, -100%)'});
    expect(placeTooltip(rect, 'bottom')).toEqual({left: 130, top: 148, transform: 'translate(-50%, 0)'});
  });

  it('centers the tooltip beside the element, a small gap away', () => {
    expect(placeTooltip(rect, 'left')).toEqual({left: 92, top: 120, transform: 'translate(-100%, -50%)'});
    expect(placeTooltip(rect, 'right')).toEqual({left: 168, top: 120, transform: 'translate(0, -50%)'});
  });
});
