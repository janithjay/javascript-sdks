// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {Theme} from '@thunderid/browser';
import {useMemo} from 'react';
import {css} from '../../../styles/emotion';

/**
 * Creates styles for the BaseAcceptInvite component
 * @param theme - The theme object containing design tokens
 * @param colorScheme - The current color scheme (used for memoization)
 * @returns Object containing CSS class names for component styling
 */
const useStyles = (theme: Theme, colorScheme: string): Record<string, string> =>
  useMemo(() => {
    const card: string = css`
      gap: calc(${theme.vars.spacing.unit} * 2);
      min-width: 420px;
      font-family: ${theme.vars.typography.fontFamily};
    `;

    const header: string = css`
      gap: 0;
      align-items: center;
    `;

    const title: string = css`
      margin: 0 0 calc(${theme.vars.spacing.unit} * 1) 0;
      color: ${theme.vars.colors.text.primary};
    `;

    const subtitle: string = css`
      margin-bottom: calc(${theme.vars.spacing.unit} * 1);
      color: ${theme.vars.colors.text.secondary};
    `;

    const tokenValidationContainer: string = css`
      align-items: center;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 2rem;
    `;

    const goToSignInContainer: string = css`
      display: flex;
      justify-content: center;
      margin-top: 1.5rem;
    `;

    const errorContainer: string = css`
      margin-bottom: 1rem;
    `;

    const centeredSpinnerContainerSmall: string = css`
      display: flex;
      justify-content: center;
      padding: 1rem;
    `;

    const alreadyHaveAccountContainer: string = css`
      margin-top: 1.5rem;
      text-align: center;
    `;

    const signInInlineButton: string = css`
      min-width: auto;
      padding: 0;
    `;

    return {
      alreadyHaveAccountContainer,
      card,
      centeredSpinnerContainerSmall,
      errorContainer,
      goToSignInContainer,
      header,
      signInInlineButton,
      subtitle,
      title,
      tokenValidationContainer,
    };
  }, [
    theme.vars.colors.background.surface,
    theme.vars.colors.text.primary,
    theme.vars.colors.text.secondary,
    theme.vars.borderRadius.large,
    theme.vars.spacing.unit,
    theme.vars.typography.fontFamily,
    colorScheme,
  ]);

export default useStyles;
