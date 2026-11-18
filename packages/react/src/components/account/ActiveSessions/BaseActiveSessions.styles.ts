// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {Theme} from '@thunderid/browser';
import {useMemo} from 'react';
import {css} from '../../../styles/emotion';

/**
 * Creates styles for the BaseActiveSessions component
 * @param theme - The theme object containing design tokens
 * @param colorScheme - The current color scheme (used for memoization)
 * @returns Object containing CSS class names for component styling
 */
const useStyles = (theme: Theme, colorScheme: string): Record<string, string> =>
  useMemo(() => {
    const {borderRadius, colors, spacing, typography} = theme.vars;
    const mix = (color: string, amount: number, base = 'transparent'): string =>
      `color-mix(in srgb, ${color} ${amount}%, ${base})`;
    const space = (multiple: number): string => `calc(${spacing.unit} * ${multiple})`;
    const labelSize = `calc(${typography.fontSizes.xs} * 0.875)`;
    const label = `
      font-size: ${labelSize};
      font-weight: ${typography.fontWeights.medium};
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: ${colors.text.secondary};
    `;

    const root: string = css`
      display: flex;
      flex-direction: column;
      gap: ${space(2)};
      width: 100%;
      font-family: ${typography.fontFamily};
      color: ${colors.text.primary};
    `;

    const header: string = css`
      display: flex;
      flex-wrap: wrap;
      gap: ${space(2)};
      align-items: flex-start;
      justify-content: space-between;
      padding-bottom: ${space(2)};
      border-bottom: 1px solid ${colors.border};
    `;

    const heading: string = css`
      margin: 0 0 ${space(0.25)};
    `;

    // The Button primitive has no error color, so the destructive actions take it here.
    const revokeOthers: string = css`
      border-color: ${mix(colors.error.main, 40)};
      color: ${colors.error.main};

      &:hover:not(:disabled) {
        border-color: ${colors.error.main};
        background: ${mix(colors.error.main, 8)};
        color: ${colors.error.main};
      }
    `;

    const confirmRevoke: string = css`
      border-color: ${colors.error.main};
      background: ${colors.error.main};
      color: #fff;

      &:hover:not(:disabled) {
        border-color: ${mix(colors.error.main, 85, '#000')};
        background: ${mix(colors.error.main, 85, '#000')};
      }
    `;

    const confirm: string = css`
      display: flex;
      flex-wrap: wrap;
      gap: ${space(1.5)};
      align-items: center;
      justify-content: space-between;
      padding: ${space(1.5)} ${space(1.75)};
      border: 1px solid ${mix(colors.error.main, 22)};
      border-radius: ${borderRadius.medium};
      background: ${mix(colors.error.main, 7)};
    `;

    const confirmInSession: string = css`
      padding: ${space(1.5)} ${space(2)};
      border: none;
      border-top: 1px solid ${mix(colors.error.main, 22)};
      border-radius: 0;
    `;

    const confirmActions: string = css`
      display: flex;
      flex-shrink: 0;
      gap: ${spacing.unit};
    `;

    const loading: string = css`
      display: flex;
      justify-content: center;
      padding: ${space(3)};
    `;

    const empty: string = css`
      margin: 0;
      padding: ${space(3)};
      text-align: center;
    `;

    const list: string = css`
      display: flex;
      flex-direction: column;
      gap: ${space(1.5)};
      margin: 0;
      padding: 0;
      list-style: none;
    `;

    const session: string = css`
      overflow: hidden;
      border: 1px solid ${colors.border};
      border-radius: ${borderRadius.medium};
      background: ${colors.background.surface};
    `;

    const sessionHeader: string = css`
      display: flex;
      flex-wrap: wrap;
      gap: ${space(1.75)};
      align-items: center;
      padding: ${space(1.75)} ${space(2)};
    `;

    const deviceIcon: string = css`
      position: relative;
      flex-shrink: 0;
      width: 42px;
      height: 42px;
    `;

    const osIcon: string = css`
      display: flex;
      align-items: center;
      justify-content: center;
      width: 42px;
      height: 42px;
      border: 1px solid ${colors.border};
      border-radius: 50%;
      background: ${mix(colors.text.primary, 7, colors.background.surface)};
      color: ${colors.text.primary};
    `;

    const browserIcon: string = css`
      position: absolute;
      inset-inline-end: -3px;
      bottom: -3px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border: 1px solid ${colors.border};
      border-radius: 50%;
      background: ${colors.background.surface};
      box-shadow: 0 0 0 2px ${colors.background.surface};
      color: ${colors.text.primary};
    `;

    const sessionTitle: string = css`
      display: flex;
      flex: 1;
      flex-wrap: wrap;
      gap: ${spacing.unit};
      align-items: center;
      min-width: 0;
    `;

    // The same pill as the user profile's verification badges, so status reads alike across components.
    // Its text is mixed toward the text color so the small label keeps WCAG AA contrast.
    const current: string = css`
      padding: 0 ${spacing.unit};
      border-radius: 999px;
      background: ${mix(colors.primary.main, 14)};
      color: ${mix(colors.primary.main, 55, colors.text.primary)};
      font-size: ${typography.fontSizes.xs};
      font-weight: ${typography.fontWeights.medium};
      line-height: 22px;
      white-space: nowrap;
    `;

    const details: string = css`
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      margin: 0;
      border-top: 1px solid ${colors.border};
      background: ${mix(colors.text.primary, 3)};

      @media (max-width: 520px) {
        grid-template-columns: minmax(0, 1fr);
      }
    `;

    const detail: string = css`
      min-width: 0;
      padding: ${space(1.25)} ${space(1.5)};
    `;

    const detailLabel: string = css`
      ${label}
      margin-bottom: ${space(0.625)};
    `;

    const detailValue: string = css`
      margin: 0;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: ${typography.fontSizes.xs};
      font-weight: ${typography.fontWeights.medium};
      color: ${colors.text.primary};
      overflow-wrap: anywhere;
    `;

    const dateTime: string = css`
      display: flex;
      flex-wrap: wrap;
      gap: ${space(0.25)} ${spacing.unit};
      align-items: center;
    `;

    const detailAgo: string = css`
      flex-basis: 100%;
      font-family: ${typography.fontFamily};
      font-size: ${typography.fontSizes.xs};
      color: ${colors.text.secondary};
    `;

    const appsRow: string = css`
      display: flex;
      gap: ${space(1.25)};
      align-items: center;
      padding: ${space(1.25)} ${space(2)};
      border-top: 1px solid ${colors.border};
    `;

    const appsLabel: string = css`
      ${label}
      flex-shrink: 0;
    `;

    const appsStrip: string = css`
      position: relative;
      display: flex;
      min-width: 0;
    `;

    // Padding keeps the icons' rings and focus outlines inside the scroll area, which would clip them.
    const apps: string = css`
      display: flex;
      align-items: center;
      min-width: 0;
      margin: 0;
      padding: ${space(0.5)};
      list-style: none;
      overflow-x: auto;
      scrollbar-width: none;

      &::-webkit-scrollbar {
        display: none;
      }
    `;

    // Fades each side that has more to scroll to. A mask, so it works on any background.
    const fade = (left: boolean, right: boolean): string =>
      `linear-gradient(to right, ${left ? 'transparent' : 'black'}, black ${space(3)}, black calc(100% - ${space(3)}), ${right ? 'transparent' : 'black'})`;

    const appsFadeLeft: string = css`
      mask-image: ${fade(true, false)};
    `;

    const appsFadeRight: string = css`
      mask-image: ${fade(false, true)};
    `;

    const appsFadeBoth: string = css`
      mask-image: ${fade(true, true)};
    `;

    const appsScroll: string = css`
      position: absolute;
      top: 50%;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: ${space(0.25)};
      border: 1px solid ${colors.border};
      border-radius: 50%;
      background: ${colors.background.surface};
      color: ${colors.text.primary};
      cursor: pointer;

      &:hover {
        background: ${mix(colors.text.primary, 6, colors.background.surface)};
      }

      &:focus-visible {
        outline: 2px solid ${colors.primary.main};
        outline-offset: 2px;
      }
    `;

    const appsScrollLeft: string = css`
      left: 0;
      transform: translateY(-50%) rotate(90deg);
    `;

    const appsScrollRight: string = css`
      right: 0;
      transform: translateY(-50%) rotate(-90deg);
    `;

    const appItem: string = css`
      flex-shrink: 0;
      display: flex;

      & + & {
        margin-left: -${space(0.75)};
      }

      &:hover,
      &:focus-within {
        z-index: 1;
      }
    `;

    const appIcon: string = css`
      box-shadow: 0 0 0 2px ${colors.background.surface};
    `;

    const app: string = css`
      padding: ${space(0.25)} ${space(1.125)};
      border: 1px solid ${colors.border};
      border-radius: ${borderRadius.small};
      background: ${mix(colors.text.primary, 3)};
      color: ${colors.text.secondary};
      font-size: ${typography.fontSizes.xs};
    `;

    return {
      app,
      appIcon,
      appItem,
      apps,
      appsFadeBoth,
      appsFadeLeft,
      appsFadeRight,
      appsScroll,
      appsScrollLeft,
      appsScrollRight,
      appsStrip,
      appsLabel,
      appsRow,
      browserIcon,
      confirm,
      confirmActions,
      confirmInSession,
      confirmRevoke,
      current,
      dateTime,
      detailAgo,
      detail,
      detailLabel,
      detailValue,
      details,
      deviceIcon,
      empty,
      header,
      heading,
      list,
      loading,
      osIcon,
      revokeOthers,
      root,
      session,
      sessionHeader,
      sessionTitle,
    };
  }, [theme, colorScheme]);

export default useStyles;
