/**
 * Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com).
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

import {css} from '@emotion/css';
import {Theme} from '@thunderid/browser';
import {useMemo} from 'react';

export interface ChangePasswordStyles {
  actions: string;
  alertContainer: string;
  card: string;
  form: string;
  header: string;
  root: string;
  title: string;
}

/**
 * Creates styles for the BaseChangePassword component
 * @param theme - The theme object containing design tokens
 * @param colorScheme - The current color scheme (used for memoization)
 * @returns Object containing CSS class names for component styling
 */
const useStyles = (theme: Theme, colorScheme: string): ChangePasswordStyles => {
  return useMemo(() => {
    const root: string = css`
      padding: calc(${theme.vars.spacing.unit} * 4);
      max-width: 500px;
      margin: 0 auto;
      font-family: ${theme.vars.typography.fontFamily};
    `;

    const card: string = css`
      background: ${theme.vars.colors.background.surface};
      border-radius: ${theme.vars.borderRadius.large};
      padding: calc(${theme.vars.spacing.unit} * 4);
    `;

    const header: string = css`
      margin-bottom: calc(${theme.vars.spacing.unit} * 3);
    `;

    const title: string = css`
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0;
      color: ${theme.vars.colors.text.primary};
    `;

    const form: string = css`
      display: flex;
      flex-direction: column;
      gap: calc(${theme.vars.spacing.unit} * 2.5);
    `;

    const alertContainer: string = css`
      margin-bottom: calc(${theme.vars.spacing.unit} * 1);
    `;

    const actions: string = css`
      display: flex;
      justify-content: flex-end;
      gap: calc(${theme.vars.spacing.unit} * 1.5);
      margin-top: calc(${theme.vars.spacing.unit} * 2);
    `;

    return {
      actions,
      alertContainer,
      card,
      form,
      header,
      root,
      title,
    };
  }, [theme, colorScheme]);
};

export default useStyles;
