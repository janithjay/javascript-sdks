/**
 * Copyright (c) 2026, WSO2 LLC. (https://www.wso2.com).
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/**
 * Lowercases the language subtag and uppercases a 2-letter region subtag (the common
 * `language-REGION` shape), leaving everything else as-is. Not a full BCP 47 canonicalizer,
 * but deterministic and dependency-free, so case-only differences still compare equal without
 * `Intl.Locale`.
 */
function canonicalizeTagManually(tag: string): string {
  return tag
    .split('-')
    .map((part: string, index: number): string => {
      if (index === 0) {
        return part.toLowerCase();
      }
      return part.length === 2 ? part.toUpperCase() : part;
    })
    .join('-');
}

/**
 * Resolves a BCP 47 locale tag to its canonical form, so tags that differ only in casing or
 * separator style compare equal (e.g. "en-us" and "en-US"). Uses `Intl.Locale` when available;
 * falls back to {@link canonicalizeTagManually} when it isn't (or rejects the input), so exact
 * dialect matching stays consistent either way.
 *
 * Unlike {@link getBaseLanguage}, this preserves the region/dialect — use it to test for an
 * *exact* match (e.g. "en-IN" against "en-IN"), not a same-base-language match.
 *
 * @param tag - BCP 47 locale tag to resolve (e.g. "en-US", "fr-CA")
 * @returns The canonical form of the tag
 *
 * @example
 * ```typescript
 * normalizeLocaleTag('en-us') // 'en-US'
 * normalizeLocaleTag('fr-CA') // 'fr-CA'
 * ```
 */
export default function normalizeLocaleTag(tag: string): string {
  try {
    return new Intl.Locale(tag).toString();
  } catch {
    return canonicalizeTagManually(tag);
  }
}
