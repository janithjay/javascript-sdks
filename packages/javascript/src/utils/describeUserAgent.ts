// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * The browser and operating system a User-Agent names. A part the string doesn't reveal is left
 * undefined.
 */
export interface UserAgentDescription {
  browser?: string;
  os?: string;
}

// Checked in order: several browsers also carry the tokens of the ones they derive from, so Edge,
// Opera and Samsung Internet come before Chrome, and Chrome before Safari.
const BROWSERS: [RegExp, string][] = [
  [/\bEdg(?:e|A|iOS)?\//, 'Edge'],
  [/\b(?:OPR|Opera)\//, 'Opera'],
  [/\bSamsungBrowser\//, 'Samsung Internet'],
  [/\b(?:Firefox|FxiOS)\//, 'Firefox'],
  [/\b(?:Chrome|CriOS)\//, 'Chrome'],
  [/\bVersion\/[\d.]+.*\bSafari\//, 'Safari'],
];

const OPERATING_SYSTEMS: [RegExp, string][] = [
  [/\bWindows\b/, 'Windows'],
  [/\b(?:iPhone|iPad|iPod)\b/, 'iOS'],
  [/\bAndroid\b/, 'Android'],
  [/\bCrOS\b/, 'ChromeOS'],
  [/\bMac OS X\b|\bMacintosh\b/, 'macOS'],
  [/\bLinux\b/, 'Linux'],
];

const firstMatch = (userAgent: string, patterns: [RegExp, string][]): string | undefined =>
  patterns.find(([pattern]: [RegExp, string]) => pattern.test(userAgent))?.[1];

/**
 * Reads the browser and operating system from a User-Agent, for showing a session as, for example,
 * "Chrome on macOS". It recognizes the common browsers only, and is for display, never for decisions.
 *
 * @param userAgent - The raw User-Agent string.
 * @returns The parts of the User-Agent that could be recognized.
 *
 * @example
 * ```typescript
 * describeUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ... Chrome/129.0 Safari/537.36');
 * // {browser: 'Chrome', os: 'macOS'}
 * ```
 */
const describeUserAgent = (userAgent?: string): UserAgentDescription => {
  if (!userAgent) {
    return {};
  }

  return {browser: firstMatch(userAgent, BROWSERS), os: firstMatch(userAgent, OPERATING_SYSTEMS)};
};

export default describeUserAgent;
