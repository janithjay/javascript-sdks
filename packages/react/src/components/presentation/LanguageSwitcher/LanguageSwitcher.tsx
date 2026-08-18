// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {getBaseLanguage, normalizeLocaleTag, resolveLocaleDisplayName, resolveLocaleEmoji} from '@thunderid/browser';
import {FC, ReactElement, ReactNode, useEffect, useMemo} from 'react';
import BaseLanguageSwitcher, {LanguageOption, LanguageSwitcherRenderProps} from './BaseLanguageSwitcher';
import useFlowMeta from '../../../contexts/FlowMeta/useFlowMeta';
import useTranslation from '../../../hooks/useTranslation';

export type {LanguageOption, LanguageSwitcherRenderProps};

export interface LanguageSwitcherProps {
  /**
   * Render-props callback for fully custom UI.
   *
   * @example
   * ```tsx
   * <LanguageSwitcher>
   *   {({languages, currentLanguage, onLanguageChange, isLoading}) => (
   *     <select
   *       value={currentLanguage}
   *       disabled={isLoading}
   *       onChange={e => onLanguageChange(e.target.value)}
   *     >
   *       {languages.map(l => (
   *         <option key={l.code} value={l.code}>{l.emoji} {l.displayName}</option>
   *       ))}
   *     </select>
   *   )}
   * </LanguageSwitcher>
   * ```
   */
  children?: (props: LanguageSwitcherRenderProps) => ReactNode;
  /** Additional CSS class for the root element (default UI only) */
  className?: string;
}

/**
 * A v2 LanguageSwitcher component that reads available languages from `FlowMetaContext`
 * and switches both the UI language (via `I18nContext`) and the flow metadata translations
 * (by re-fetching `GET /flow/meta` with the new language).
 *
 * Must be rendered inside a `FlowMetaProvider`.
 *
 * @example
 * ```tsx
 * // Default dropdown UI
 * <LanguageSwitcher />
 *
 * // Custom UI with render props
 * <LanguageSwitcher>
 *   {({languages, currentLanguage, onLanguageChange}) => (
 *     <div>
 *       {languages.map(lang => (
 *         <button
 *           key={lang.code}
 *           onClick={() => onLanguageChange(lang.code)}
 *           style={{fontWeight: lang.code === currentLanguage ? 'bold' : 'normal'}}
 *         >
 *           {lang.emoji} {lang.displayName}
 *         </button>
 *       ))}
 *     </div>
 *   )}
 * </LanguageSwitcher>
 * ```
 */
const LanguageSwitcher: FC<LanguageSwitcherProps> = ({children, className}: LanguageSwitcherProps): ReactElement => {
  const {meta, switchLanguage, isLoading} = useFlowMeta();
  const {currentLanguage} = useTranslation();

  const availableLanguageCodes: string[] = meta?.i18n?.languages ?? [];
  // Only fall back to the detected browser language when the server returns no configured languages.
  // Do NOT inject currentLanguage unconditionally — a browser locale like "en-GB" must not appear
  // in the picker when the server only supports "en-US".
  const effectiveLanguageCodes: string[] = useMemo(
    () => (availableLanguageCodes.length > 0 ? availableLanguageCodes : [currentLanguage]),
    [availableLanguageCodes, currentLanguage],
  );

  const languages: LanguageOption[] = useMemo(
    () =>
      effectiveLanguageCodes.map((code: string) => ({
        code,
        // Resolve each label in its own locale so option names stay stable across UI language switches.
        displayName: resolveLocaleDisplayName(code, code) || code,
        emoji: resolveLocaleEmoji(code),
      })),
    [effectiveLanguageCodes],
  );

  // If the detected language isn't supported by the server, fall back to English (matched by base
  // language, e.g. browser "en-US" against server "en"), or the first available language if the
  // server doesn't offer English either.
  useEffect(() => {
    if (availableLanguageCodes.length === 0) {
      return;
    }
    const currentBase: string = getBaseLanguage(currentLanguage);
    const isSupported: boolean = availableLanguageCodes.some(
      (code: string): boolean => getBaseLanguage(code) === currentBase,
    );
    if (isSupported) {
      return;
    }
    const englishCode: string | undefined = availableLanguageCodes.find(
      (code: string): boolean => getBaseLanguage(code) === 'en',
    );
    switchLanguage(englishCode ?? availableLanguageCodes[0]);
  }, [availableLanguageCodes, currentLanguage, switchLanguage]);

  // Prefer an exact dialect match (e.g. "en-IN" against a supported "en-IN") over a base-language
  // one, so a specific regional variant isn't silently collapsed to "en" when it's actually offered.
  // Only fall back to a base-language match (e.g. "en-US" against a supported "en") when the exact
  // dialect isn't available, and to the raw code if neither is.
  const displayLanguage: string = useMemo(() => {
    const exactMatch: LanguageOption | undefined = languages.find(
      (option: LanguageOption): boolean => normalizeLocaleTag(option.code) === normalizeLocaleTag(currentLanguage),
    );
    if (exactMatch) {
      return exactMatch.code;
    }
    const baseMatch: LanguageOption | undefined = languages.find(
      (option: LanguageOption): boolean => getBaseLanguage(option.code) === getBaseLanguage(currentLanguage),
    );
    return baseMatch?.code ?? currentLanguage;
  }, [languages, currentLanguage]);

  const handleLanguageChange = (language: string): void => {
    if (language !== currentLanguage) {
      switchLanguage(language);
    }
  };

  return (
    <BaseLanguageSwitcher
      currentLanguage={displayLanguage}
      isLoading={isLoading}
      languages={languages}
      onLanguageChange={handleLanguageChange}
      className={className}
    >
      {children}
    </BaseLanguageSwitcher>
  );
};

export default LanguageSwitcher;
