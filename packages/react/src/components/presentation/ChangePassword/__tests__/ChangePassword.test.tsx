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

import {render, screen, fireEvent, waitFor, cleanup} from '@testing-library/react';
import {createTheme, ThunderIDAPIError} from '@thunderid/browser';
import {ReactElement} from 'react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import I18nProvider from '../../../../contexts/I18n/I18nProvider';
import ThemeContext, {ThemeContextValue} from '../../../../contexts/Theme/ThemeContext';
import ThunderIDContext, {ThunderIDContextValue} from '../../../../contexts/ThunderID/ThunderIDContext';
import ChangePassword from '../ChangePassword';
import updateCredentials from '../../../../api/updateCredentials';

vi.mock('../../../../api/updateCredentials', () => ({
  default: vi.fn(),
}));

const themeContextValue: ThemeContextValue = {
  colorScheme: 'light',
  direction: 'ltr',
  theme: createTheme(),
  toggleTheme: vi.fn(),
};

const thunderIDContextValue: ThunderIDContextValue = {
  baseUrl: 'https://localhost:8090',
  instanceId: 0,
  preferences: {},
};

const renderWithProviders = (ui: ReactElement): ReturnType<typeof render> => (
  render(
    <ThemeContext.Provider value={themeContextValue}>
      <ThunderIDContext.Provider value={thunderIDContextValue}>
        <I18nProvider>
          {ui}
        </I18nProvider>
      </ThunderIDContext.Provider>
    </ThemeContext.Provider>
  )
);

describe('ChangePassword', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders password fields with correct type and autoComplete attributes', () => {
    const {container} = renderWithProviders(<ChangePassword />);

    const currentPasswordInput = container.querySelector('#current-password') as HTMLInputElement;
    const newPasswordInput = container.querySelector('#new-password') as HTMLInputElement;
    const confirmPasswordInput = container.querySelector('#confirm-password') as HTMLInputElement;

    expect(currentPasswordInput).toBeInTheDocument();
    expect(currentPasswordInput.type).toBe('password');
    expect(currentPasswordInput).toHaveAttribute('autocomplete', 'current-password');

    expect(newPasswordInput).toBeInTheDocument();
    expect(newPasswordInput.type).toBe('password');
    expect(newPasswordInput).toHaveAttribute('autocomplete', 'new-password');

    expect(confirmPasswordInput).toBeInTheDocument();
    expect(confirmPasswordInput.type).toBe('password');
    expect(confirmPasswordInput).toHaveAttribute('autocomplete', 'new-password');
  });

  it('validates password mismatch and shows error without calling API', async () => {
    const {container} = renderWithProviders(<ChangePassword />);

    const currentInput = container.querySelector('#current-password') as HTMLInputElement;
    const newFileInput = container.querySelector('#new-password') as HTMLInputElement;
    const confirmInput = container.querySelector('#confirm-password') as HTMLInputElement;

    fireEvent.change(currentInput, {target: {value: 'OldPassword123!'}});
    fireEvent.change(newFileInput, {target: {value: 'NewPassword123!'}});
    fireEvent.change(confirmInput, {target: {value: 'DifferentPassword123!'}});

    fireEvent.click(screen.getByRole('button', {name: /Update Password/i}));

    expect(await screen.findByText(/New password and confirm password do not match/i)).toBeInTheDocument();
    expect(updateCredentials).not.toHaveBeenCalled();
  });

  it('submits password update successfully and wipes password state', async () => {
    vi.mocked(updateCredentials).mockResolvedValueOnce();
    const onSuccess = vi.fn();

    const {container} = renderWithProviders(<ChangePassword onSuccess={onSuccess} />);

    const currentInput = container.querySelector('#current-password') as HTMLInputElement;
    const newFileInput = container.querySelector('#new-password') as HTMLInputElement;
    const confirmInput = container.querySelector('#confirm-password') as HTMLInputElement;

    fireEvent.change(currentInput, {target: {value: 'OldPassword123!'}});
    fireEvent.change(newFileInput, {target: {value: 'NewPassword123!'}});
    fireEvent.change(confirmInput, {target: {value: 'NewPassword123!'}});

    fireEvent.click(screen.getByRole('button', {name: /Update Password/i}));

    await waitFor(() => {
      expect(updateCredentials).toHaveBeenCalledWith({
        baseUrl: 'https://localhost:8090',
        instanceId: 0,
        payload: {
          currentPassword: 'OldPassword123!',
          password: 'NewPassword123!',
        },
      });
    });

    expect(await screen.findByText(/Password changed successfully/i)).toBeInTheDocument();
    expect(onSuccess).toHaveBeenCalledTimes(1);

    // Password inputs should be wiped
    expect(currentInput.value).toBe('');
    expect(newFileInput.value).toBe('');
    expect(confirmInput.value).toBe('');
  });

  it('handles backend error response, surfaces error message, and wipes password inputs', async () => {
    const errorMsg = 'Current password is incorrect';
    vi.mocked(updateCredentials).mockRejectedValueOnce(
      new ThunderIDAPIError(errorMsg, 'USR-1018', 'javascript', 400, 'Bad Request'),
    );

    const {container} = renderWithProviders(<ChangePassword />);

    const currentInput = container.querySelector('#current-password') as HTMLInputElement;
    const newFileInput = container.querySelector('#new-password') as HTMLInputElement;
    const confirmInput = container.querySelector('#confirm-password') as HTMLInputElement;

    fireEvent.change(currentInput, {target: {value: 'WrongOldPassword'}});
    fireEvent.change(newFileInput, {target: {value: 'NewPassword123!'}});
    fireEvent.change(confirmInput, {target: {value: 'NewPassword123!'}});

    fireEvent.click(screen.getByRole('button', {name: /Update Password/i}));

    expect(await screen.findByText(errorMsg)).toBeInTheDocument();

    // Inputs should be wiped after failed attempt
    expect(currentInput.value).toBe('');
    expect(newFileInput.value).toBe('');
    expect(confirmInput.value).toBe('');
  });
});
