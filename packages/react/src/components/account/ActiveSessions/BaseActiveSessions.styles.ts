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

    const card: string = css`
      padding: ${space(2.25)} ${space(2.75)} ${space(2.5)};
      border: 1px solid ${colors.border};
      border-radius: ${borderRadius.large};
      background: ${colors.background.surface};
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

    // Mixed toward the text color so the chip's small text keeps WCAG AA contrast.
    const current: string = css`
      padding: ${space(0.25)} ${spacing.unit};
      border: 1px solid ${mix(colors.primary.main, 20)};
      border-radius: 20px;
      background: ${mix(colors.primary.main, 8)};
      color: ${mix(colors.primary.main, 55, colors.text.primary)};
      font-size: ${labelSize};
      font-weight: ${typography.fontWeights.medium};
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

    const appsRow: string = css`
      display: flex;
      flex-wrap: wrap;
      gap: ${space(1.25)};
      align-items: center;
      padding: ${space(1.25)} ${space(2)};
      border-top: 1px solid ${colors.border};
    `;

    const appsLabel: string = css`
      ${label}
    `;

    const apps: string = css`
      display: flex;
      flex-wrap: wrap;
      gap: ${space(0.75)};
      margin: 0;
      padding: 0;
      list-style: none;
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
      apps,
      appsLabel,
      appsRow,
      browserIcon,
      card,
      confirm,
      confirmActions,
      confirmInSession,
      confirmRevoke,
      current,
      dateTime,
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
