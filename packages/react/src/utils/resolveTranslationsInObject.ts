// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {FlowMetadataResponse, resolveFlowTemplateLiterals} from '@thunderid/browser';
import {UseTranslation} from '../hooks/useTranslation';

/**
 * Resolves all {{ t() }} and {{ meta() }} template expressions in an object's string properties.
 * @param obj - The object to process
 * @param t - The translation function from useTranslation
 * @param properties - Array of property names to resolve (optional, defaults to common properties)
 * @param meta - Optional flow metadata for resolving meta() expressions
 * @returns A new object with resolved template strings
 */
export const resolveTranslationsInObject = <T extends Record<string, any>>(
  obj: T,
  t: UseTranslation['t'],
  properties: string[] = ['label', 'placeholder', 'text', 'title', 'subtitle', 'alt', 'src'],
  meta?: FlowMetadataResponse | null,
): T => {
  const resolved: T = {...obj};

  properties.forEach((prop: string) => {
    if (resolved[prop] && typeof resolved[prop] === 'string') {
      (resolved as any)[prop] = resolveFlowTemplateLiterals(resolved[prop], {meta, t});
    }
  });

  return resolved;
};

export default resolveTranslationsInObject;
