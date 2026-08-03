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

import {ThunderIDError} from '@thunderid/browser';
import {FC, FormEvent, ReactElement, useCallback, useEffect, useState} from 'react';
import BaseChangePassword, {BaseChangePasswordProps} from './BaseChangePassword';
import updateCredentials from '../../../api/updateCredentials';
import useThunderID from '../../../contexts/ThunderID/useThunderID';
import useTranslation from '../../../hooks/useTranslation';

export interface ChangePasswordProps extends BaseChangePasswordProps {
  /**
   * Callback fired when password update completes successfully.
   */
  onSuccess?: () => void;
}

/**
 * ChangePassword container component.
 * Manages form state, calls `updateCredentials` API helper, and enforces security safeguards
 * (clearing password state post-submission and on unmount).
 */
const ChangePassword: FC<ChangePasswordProps> = ({
  preferences,
  onSuccess,
  ...rest
}: ChangePasswordProps): ReactElement => {
  const {baseUrl, instanceId, preferences: contextPreferences} = useThunderID();
  const resolvedPreferences = {
    ...contextPreferences,
    ...preferences,
  };
  const {t} = useTranslation(resolvedPreferences?.i18n);

  const translate = useCallback(
    (key: string, fallback: string): string => {
      const res = t(key);
      return !res || res === key ? fallback : res;
    },
    [t],
  );

  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const wipePasswordState = useCallback((): void => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  }, []);

  // Security requirement: clear sensitive password strings on unmount
  useEffect(() => {
    return (): void => {
      wipePasswordState();
    };
  }, [wipePasswordState]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError(translate('changePassword.errors.requiredFields', 'Please fill in all required fields.'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(translate('changePassword.errors.passwordMismatch', 'New password and confirm password do not match.'));
      return;
    }

    setIsLoading(true);

    try {
      await updateCredentials({
        baseUrl,
        instanceId,
        payload: {
          currentPassword,
          password: newPassword,
        },
      });

      wipePasswordState();
      setSuccessMessage(translate('changePassword.success', 'Password changed successfully.'));
      onSuccess?.();
    } catch (caughtError: unknown) {
      wipePasswordState();

      let message: string = translate('changePassword.errors.generic', 'An error occurred while updating your password.');
      if (caughtError instanceof ThunderIDError) {
        message = caughtError.message;
      } else if (caughtError instanceof Error) {
        message = caughtError.message;
      }

      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BaseChangePassword
      currentPassword={currentPassword}
      newPassword={newPassword}
      confirmPassword={confirmPassword}
      onCurrentPasswordChange={setCurrentPassword}
      onNewPasswordChange={setNewPassword}
      onConfirmPasswordChange={setConfirmPassword}
      onSubmit={handleSubmit}
      error={error}
      successMessage={successMessage}
      isLoading={isLoading}
      preferences={resolvedPreferences}
      {...rest}
    />
  );
};

export default ChangePassword;
