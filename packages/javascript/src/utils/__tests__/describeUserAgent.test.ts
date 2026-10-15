// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it} from 'vitest';
import describeUserAgent from '../describeUserAgent';

describe('describeUserAgent', () => {
  it.each<[string, string, {browser?: string; os?: string}]>([
    [
      'Chrome on macOS',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
      {browser: 'Chrome', os: 'macOS'},
    ],
    [
      'Edge on Windows',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0',
      {browser: 'Edge', os: 'Windows'},
    ],
    [
      'Safari on iOS',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
      {browser: 'Safari', os: 'iOS'},
    ],
    [
      'Firefox on Android',
      'Mozilla/5.0 (Android 14; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0',
      {browser: 'Firefox', os: 'Android'},
    ],
    ['an unrecognized client', 'curl/8.7.1', {browser: undefined, os: undefined}],
  ])('recognizes %s', (_name: string, userAgent: string, expected: {browser?: string; os?: string}) => {
    expect(describeUserAgent(userAgent)).toEqual(expected);
  });

  it('returns nothing for a missing User-Agent', () => {
    expect(describeUserAgent(undefined)).toEqual({});
  });
});
