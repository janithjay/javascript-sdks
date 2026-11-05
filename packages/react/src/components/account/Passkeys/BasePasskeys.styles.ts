// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {Theme} from '@thunderid/browser';
import {css} from '../../../styles/emotion';

/**
 * Creates styles for the BasePasskeys component
 * @param theme - The theme object containing design tokens
 * @param colorScheme - The current color scheme (used for memoization)
 * @returns Object containing CSS class names for component styling
 */
const useStyles = (theme: Theme, colorScheme: string): Record<string, string> => {
  const root: string = css`
    display: flex;
    flex-direction: column;
    gap: calc(${theme.vars.spacing.unit} * 2);
    width: 100%;
    box-sizing: border-box;
  `;

  const card: string = css`
    padding: calc(${theme.vars.spacing.unit} * 3);
    background: ${theme.vars.colors.background.surface};
    border: 1px solid ${theme.vars.colors.border};
    border-radius: ${theme.vars.borderRadius.large};
  `;

  const plain: string = css`
    padding: 0;
    background: transparent;
    border-radius: 0;
  `;

  const header: string = css`
    display: flex;
    flex-direction: column;
    gap: calc(${theme.vars.spacing.unit} / 2);
  `;

  const heading: string = css`
    margin: 0;
  `;

  const list: string = css`
    display: flex;
    flex-direction: column;
    gap: calc(${theme.vars.spacing.unit} * 1.25);
    margin: 0;
    padding: 0;
    list-style: none;
  `;

  const item: string = css`
    display: flex;
    flex-direction: column;
    gap: calc(${theme.vars.spacing.unit} * 1.5);
    padding: calc(${theme.vars.spacing.unit} * 1.5) calc(${theme.vars.spacing.unit} * 1.75);
    border: 1px solid ${theme.vars.colors.border};
    border-radius: ${theme.vars.borderRadius.large};
  `;

  const itemRow: string = css`
    display: flex;
    gap: calc(${theme.vars.spacing.unit} * 1.75);
    align-items: center;
  `;

  const confirm: string = css`
    display: flex;
    flex-direction: column;
    gap: ${theme.vars.spacing.unit};
    padding-top: calc(${theme.vars.spacing.unit} * 1.5);
    border-top: 1px solid ${theme.vars.colors.border};
  `;

  const icon: string = css`
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    color: ${theme.vars.colors.text.secondary};
    background: ${theme.vars.colors.action.hover};
    border-radius: ${theme.vars.borderRadius.medium};
  `;

  const name: string = css`
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `;

  const empty: string = css`
    margin: 0;
    padding: calc(${theme.vars.spacing.unit} * 2.75) calc(${theme.vars.spacing.unit} * 2);
    text-align: center;
    border: 1px dashed ${theme.vars.colors.border};
    border-radius: ${theme.vars.borderRadius.large};
  `;

  const actions: string = css`
    display: flex;
    flex-wrap: wrap;
    gap: ${theme.vars.spacing.unit};
    align-items: center;
    justify-content: flex-end;
  `;

  const panel: string = css`
    display: flex;
    flex-direction: column;
    gap: calc(${theme.vars.spacing.unit} * 1.5);
    padding: calc(${theme.vars.spacing.unit} * 2.5);
    border: 1px solid ${theme.vars.colors.border};
    border-radius: ${theme.vars.borderRadius.large};
  `;

  const panelText: string = css`
    margin: 0;
  `;

  const panelIcon: string = css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    color: ${theme.vars.colors.primary.main};
    background: color-mix(in srgb, ${theme.vars.colors.primary.main} 12%, transparent);
    border: 1px solid color-mix(in srgb, ${theme.vars.colors.primary.main} 30%, transparent);
    border-radius: 50%;
  `;

  const benefits: string = css`
    display: flex;
    flex-direction: column;
    gap: ${theme.vars.spacing.unit};
    margin: 0;
    padding: 0;
    list-style: none;
  `;

  const benefit: string = css`
    display: flex;
    gap: calc(${theme.vars.spacing.unit} * 1.25);
    align-items: center;
    font-size: 0.75rem;
    color: ${theme.vars.colors.text.secondary};
  `;

  const benefitIcon: string = css`
    display: inline-flex;
    flex-shrink: 0;
    color: ${theme.vars.colors.success.main};
  `;

  const waiting: string = css`
    display: flex;
    flex-direction: column;
    gap: calc(${theme.vars.spacing.unit} * 1.5);
    align-items: center;
    padding: calc(${theme.vars.spacing.unit} * 1.5) 0;
    text-align: center;
  `;

  const nameForm: string = css`
    display: flex;
    flex-direction: column;
    gap: calc(${theme.vars.spacing.unit} * 1.5);
  `;

  const created: string = css`
    display: flex;
    gap: calc(${theme.vars.spacing.unit} * 1.25);
    align-items: center;
  `;

  const createdIcon: string = css`
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    color: ${theme.vars.colors.success.main};
    background: color-mix(in srgb, ${theme.vars.colors.success.main} 12%, transparent);
    border: 1px solid color-mix(in srgb, ${theme.vars.colors.success.main} 30%, transparent);
    border-radius: 50%;
  `;

  const loading: string = css`
    display: flex;
    justify-content: center;
    padding: calc(${theme.vars.spacing.unit} * 2);
  `;

  const alert: string = css`
    width: 100%;
  `;

  return {
    actions,
    alert,
    benefit,
    benefitIcon,
    benefits,
    card,
    colorScheme,
    confirm,
    created,
    createdIcon,
    empty,
    header,
    heading,
    icon,
    item,
    itemRow,
    list,
    loading,
    name,
    nameForm,
    panel,
    panelIcon,
    panelText,
    plain,
    root,
    waiting,
  };
};

export default useStyles;
