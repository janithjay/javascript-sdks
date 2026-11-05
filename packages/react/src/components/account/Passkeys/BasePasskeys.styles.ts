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

    &:focus {
      outline: none;
    }
  `;

  const card: string = css`
    padding: calc(${theme.vars.spacing.unit} * 3);
    border: 1px solid ${theme.vars.colors.border};
    border-radius: ${theme.vars.borderRadius.large};
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
    margin: 0;
    padding: 0;
    list-style: none;
    border: 1px solid ${theme.vars.colors.border};
    border-radius: ${theme.vars.borderRadius.medium};
  `;

  const item: string = css`
    display: flex;
    flex-direction: column;
    gap: calc(${theme.vars.spacing.unit} * 1.5);
    padding: calc(${theme.vars.spacing.unit} * 1.5) calc(${theme.vars.spacing.unit} * 2);

    & + & {
      border-top: 1px solid ${theme.vars.colors.border};
    }
  `;

  const itemRow: string = css`
    display: flex;
    gap: calc(${theme.vars.spacing.unit} * 1.5);
    align-items: center;
  `;

  const icon: string = css`
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
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

  const confirm: string = css`
    display: flex;
    flex-direction: column;
    gap: ${theme.vars.spacing.unit};
    padding: calc(${theme.vars.spacing.unit} * 1.5);
    background: ${theme.vars.colors.action.hover};
    border-radius: ${theme.vars.borderRadius.medium};
  `;

  const confirmText: string = css`
    margin: 0;
  `;

  const actions: string = css`
    display: flex;
    flex-wrap: wrap;
    gap: ${theme.vars.spacing.unit};
    align-items: center;
    justify-content: flex-end;
  `;

  const addForm: string = css`
    display: flex;
    flex-direction: column;
    gap: calc(${theme.vars.spacing.unit} * 1.5);
  `;

  const empty: string = css`
    margin: 0;
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
    addForm,
    alert,
    card,
    colorScheme,
    confirm,
    confirmText,
    empty,
    header,
    heading,
    icon,
    item,
    itemRow,
    list,
    loading,
    name,
    root,
  };
};

export default useStyles;
