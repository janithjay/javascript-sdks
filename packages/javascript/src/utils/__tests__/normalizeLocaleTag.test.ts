// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import normalizeLocaleTag from '../normalizeLocaleTag';

describe('normalizeLocaleTag', () => {
  describe('with Intl.Locale', () => {
    it('normalizes casing', () => {
      expect(normalizeLocaleTag('en-us')).toBe('en-US');
    });

    it('leaves an already-canonical tag unchanged', () => {
      expect(normalizeLocaleTag('fr-CA')).toBe('fr-CA');
    });

    it('normalizes a bare language subtag', () => {
      expect(normalizeLocaleTag('EN')).toBe('en');
    });
  });

  describe('without Intl.Locale', () => {
    const originalLocale = Intl.Locale;

    beforeEach(() => {
      // @ts-expect-error - simulating an environment without Intl.Locale
      delete Intl.Locale;
    });

    afterEach(() => {
      Intl.Locale = originalLocale;
    });

    it('still normalizes casing via the manual fallback', () => {
      expect(normalizeLocaleTag('en-us')).toBe('en-US');
    });

    it('matches the Intl.Locale result for the same input', () => {
      expect(normalizeLocaleTag('fr-ca')).toBe(new originalLocale('fr-ca').toString());
    });
  });

  it('produces the same result for equivalent tags with and without Intl.Locale', () => {
    const withIntl: string = normalizeLocaleTag('en-us');
    const originalLocale = Intl.Locale;
    // @ts-expect-error - simulating an environment without Intl.Locale
    delete Intl.Locale;
    const withoutIntl: string = normalizeLocaleTag('en-us');
    Intl.Locale = originalLocale;

    expect(withIntl).toBe(withoutIntl);
  });
});
