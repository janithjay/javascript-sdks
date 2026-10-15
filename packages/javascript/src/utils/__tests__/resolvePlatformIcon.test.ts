// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it} from 'vitest';
import resolvePlatformIcon from '../resolvePlatformIcon';

describe('resolvePlatformIcon', () => {
  it('draws a known browser and operating system as a single-color logo', () => {
    expect(resolvePlatformIcon('browser', 'Chrome').elements[0].attributes['fill']).toBe('currentColor');
    expect(resolvePlatformIcon('os', 'Windows').elements[0].attributes['fill']).toBe('currentColor');
  });

  it('draws ChromeOS with the Chrome logo', () => {
    expect(resolvePlatformIcon('os', 'ChromeOS').elements).toEqual(resolvePlatformIcon('browser', 'Chrome').elements);
  });

  it('draws Safari as a compass and Edge as a globe, since neither has a logo here', () => {
    expect(resolvePlatformIcon('browser', 'Safari').elements[0].attributes['stroke']).toBe('currentColor');
    expect(resolvePlatformIcon('browser', 'Edge')).toBe(resolvePlatformIcon('browser', undefined));
  });

  it('draws iOS and macOS with the same logo', () => {
    expect(resolvePlatformIcon('os', 'iOS')).toBe(resolvePlatformIcon('os', 'macOS'));
  });

  it('falls back to an outline icon for an unknown browser or operating system', () => {
    expect(resolvePlatformIcon('browser', 'Samsung Internet').elements[0].attributes['stroke']).toBe('currentColor');
    expect(resolvePlatformIcon('os', undefined).elements[0].attributes['stroke']).toBe('currentColor');
  });
});
