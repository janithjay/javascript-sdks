// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {Theme} from '@thunderid/browser';
import {useMemo} from 'react';
import {css} from '../../../styles/emotion';

export type CardVariant = 'default' | 'outlined' | 'elevated';

/**
 * Creates styles for the Card component using BEM methodology
 * @param theme - The theme object containing design tokens
 * @param colorScheme - The current color scheme (used for memoization)
 * @param variant - The card variant
 * @param clickable - Whether the card is clickable
 * @returns Object containing CSS class names for component styling
 */
const useStyles = (
  theme: Theme,
  colorScheme: string,
  variant: CardVariant,
  clickable: boolean,
): Record<string, string> =>
  useMemo(() => {
    const baseCard: string = css`
      border-radius: ${theme.vars.borderRadius.large};
      background-color: ${theme.vars.colors.background.surface};
      font-family: ${theme.vars.typography.fontFamily};
      transition: all 0.2s ease-in-out;
      position: relative;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      padding: calc(${theme.vars.spacing.unit} * 3);
    `;

    const variantStyles: Record<string, string> = {
      default: css`
        /* Base styles only */
      `,
      elevated: css`
        box-shadow: ${theme.vars.shadows.small};
        border: none;
      `,
      outlined: css`
        border: 1px solid ${theme.vars.colors.border};
      `,
    };

    const clickableStyles: string = css`
      cursor: pointer;

      &:hover {
        transform: translateY(-2px);
        box-shadow: ${theme.vars.shadows.medium};
      }
    `;

    const headerStyles: string = css`
      padding: 0 calc(${theme.vars.spacing.unit} * 2);
      margin-top: calc(${theme.vars.spacing.unit} * 2);
      display: flex;
      flex-direction: column;
      gap: ${theme.vars.spacing.unit};
    `;

    const titleStyles: string = css`
      margin: 0;
      /* Typography component will handle color, fontSize, fontWeight, lineHeight */
    `;

    const descriptionStyles: string = css`
      margin: 0;
      color: ${theme.vars.colors.text.secondary};
      font-size: ${theme.vars.typography.fontSizes.sm};
      line-height: 1.5;
    `;

    const actionStyles: string = css`
      margin-top: ${theme.vars.spacing.unit};
    `;

    const contentStyles: string = css`
      padding: 0 calc(${theme.vars.spacing.unit} * 2);
      margin-bottom: calc(${theme.vars.spacing.unit} * 2);
      flex: 1;
    `;

    const footerStyles: string = css`
      padding: 0 calc(${theme.vars.spacing.unit} * 2) calc(${theme.vars.spacing.unit} * 2);
      display: flex;
      align-items: center;
      gap: ${theme.vars.spacing.unit};
    `;

    return {
      action: actionStyles,
      card: baseCard,
      clickable: clickable ? clickableStyles : '',
      content: contentStyles,
      description: descriptionStyles,
      footer: footerStyles,
      header: headerStyles,
      title: titleStyles,
      variant: variantStyles[variant],
    };
  }, [theme, colorScheme, variant, clickable]);

export default useStyles;
