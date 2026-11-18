// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {Theme} from '@thunderid/browser';
import {useMemo} from 'react';
import {css} from '../../../styles/emotion';

export type AvatarVariant = 'circular' | 'square';

/**
 * Creates styles for the Avatar component using BEM methodology
 * @param theme - The theme object containing design tokens
 * @param colorScheme - The current color scheme (used for memoization)
 * @param size - The size of the avatar in pixels
 * @param variant - The avatar variant
 * @param backgroundColor - The background color for the avatar
 * @returns Object containing CSS class names for component styling
 */
const useStyles = (
  theme: Theme,
  colorScheme: string,
  size: number,
  variant: AvatarVariant,
  backgroundColor?: string,
): Record<string, string> =>
  useMemo(() => {
    const baseAvatar: string = css`
      align-items: center;
      background: ${backgroundColor || theme.vars.colors.background.surface};
      border: ${backgroundColor ? 'none' : `1px solid ${theme.vars.colors.border}`};
      border-radius: ${variant === 'circular' ? '50%' : theme.vars.borderRadius.medium};
      color: ${backgroundColor ? '#ffffff' : theme.vars.colors.text.primary};
      display: flex;
      font-size: ${size * 0.4}px;
      font-family: ${theme.vars.typography.fontFamily};
      font-weight: 600;
      height: ${size}px;
      justify-content: center;
      overflow: hidden;
      text-shadow: ${backgroundColor ? '0 1px 2px rgba(0, 0, 0, 0.1)' : 'none'};
      width: ${size}px;
    `;

    const variantStyles: Record<string, string> = {
      circular: css`
        border-radius: 50%;
      `,
      square: css`
        border-radius: ${theme.vars.borderRadius.medium};
      `,
    };

    const imageStyles: string = css`
      height: 100%;
      object-fit: cover;
      width: 100%;
    `;

    const skeletonStyles: string = css`
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        ${theme.vars.colors.background.disabled} 25%,
        ${theme.vars.colors.border} 50%,
        ${theme.vars.colors.background.disabled} 75%
      );
      background-size: 200% 100%;
      animation: skeleton-loading 1.5s infinite;
      border-radius: ${variant === 'circular' ? '50%' : theme.vars.borderRadius.medium};

      @keyframes skeleton-loading {
        0% {
          background-position: -200% 0;
        }
        100% {
          background-position: 200% 0;
        }
      }
    `;

    const iconStyles: string = css`
      width: 60%;
      height: 60%;
      fill: ${backgroundColor ? '#ffffff' : theme.vars.colors.text.secondary};
      opacity: 0.8;
    `;

    return {
      avatar: baseAvatar,
      icon: iconStyles,
      image: imageStyles,
      skeleton: skeletonStyles,
      variant: variantStyles[variant],
    };
  }, [theme, colorScheme, size, variant, backgroundColor]);

export default useStyles;
