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

import {cx} from '@emotion/css';
import {Preferences, withVendorCSSClassPrefix, bem} from '@thunderid/browser';
import {FC, FormEvent, ReactElement, useCallback} from 'react';
import useStyles from './BaseChangePassword.styles';
import useTheme from '../../../contexts/Theme/useTheme';
import useTranslation from '../../../hooks/useTranslation';
import AlertPrimitive from '../../primitives/Alert/Alert';
import Button from '../../primitives/Button/Button';
import CardPrimitive from '../../primitives/Card/Card';
import TextField from '../../primitives/TextField/TextField';
import Typography from '../../primitives/Typography/Typography';

export interface BaseChangePasswordProps {
  cardLayout?: boolean;
  className?: string;
  confirmPassword?: string;
  currentPassword?: string;
  error?: string | null;
  isLoading?: boolean;
  newPassword?: string;
  onCancel?: () => void;
  onConfirmPasswordChange?: (value: string) => void;
  onCurrentPasswordChange?: (value: string) => void;
  onNewPasswordChange?: (value: string) => void;
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void;
  preferences?: Preferences;
  successMessage?: string | null;
  title?: string;
}

const BaseChangePassword: FC<BaseChangePasswordProps> = ({
  cardLayout = true,
  className = '',
  confirmPassword = '',
  currentPassword = '',
  error = null,
  isLoading = false,
  newPassword = '',
  onCancel,
  onConfirmPasswordChange,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onSubmit,
  preferences,
  successMessage = null,
  title,
}: BaseChangePasswordProps): ReactElement => {
  const {theme, colorScheme} = useTheme();
  const styles = useStyles(theme, colorScheme);
  const {t} = useTranslation(preferences?.i18n);

  const translate = useCallback(
    (key: string, fallback: string): string => {
      const res = t(key);
      return !res || res === key ? fallback : res;
    },
    [t],
  );

  const formContent = (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      {error && (
        <div className={styles.alertContainer}>
          <AlertPrimitive variant="error">
            <AlertPrimitive.Title>{translate('errors.heading', 'Error')}</AlertPrimitive.Title>
            <AlertPrimitive.Description>{error}</AlertPrimitive.Description>
          </AlertPrimitive>
        </div>
      )}

      {successMessage && (
        <div className={styles.alertContainer}>
          <AlertPrimitive variant="success">
            <AlertPrimitive.Description>{successMessage}</AlertPrimitive.Description>
          </AlertPrimitive>
        </div>
      )}

      <TextField
        id="current-password"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        label={translate('changePassword.fields.currentPassword.label', 'Current Password')}
        placeholder={translate('changePassword.fields.currentPassword.placeholder', 'Enter current password')}
        value={currentPassword}
        onChange={(e) => onCurrentPasswordChange?.(e.target.value)}
        disabled={isLoading}
        required
      />

      <TextField
        id="new-password"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        label={translate('changePassword.fields.newPassword.label', 'New Password')}
        placeholder={translate('changePassword.fields.newPassword.placeholder', 'Enter new password')}
        value={newPassword}
        onChange={(e) => onNewPasswordChange?.(e.target.value)}
        disabled={isLoading}
        required
      />

      <TextField
        id="confirm-password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        label={translate('changePassword.fields.confirmPassword.label', 'Confirm New Password')}
        placeholder={translate('changePassword.fields.confirmPassword.placeholder', 'Confirm new password')}
        value={confirmPassword}
        onChange={(e) => onConfirmPasswordChange?.(e.target.value)}
        disabled={isLoading}
        required
      />

      <div className={styles.actions}>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            color="secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            {translate('common.cancel', 'Cancel')}
          </Button>
        )}
        <Button
          type="submit"
          variant="solid"
          color="primary"
          loading={isLoading}
          disabled={isLoading}
        >
          {translate('changePassword.buttons.submit', 'Update Password')}
        </Button>
      </div>
    </form>
  );

  const headerTitle = title ?? translate('changePassword.heading', 'Change Password');

  return (
    <div className={cx(styles.root, className, withVendorCSSClassPrefix(bem('change-password')))}>
      {cardLayout ? (
        <CardPrimitive className={styles.card}>
          <div className={styles.header}>
            <Typography variant="h2" className={styles.title}>
              {headerTitle}
            </Typography>
          </div>
          {formContent}
        </CardPrimitive>
      ) : (
        <>
          <div className={styles.header}>
            <Typography variant="h2" className={styles.title}>
              {headerTitle}
            </Typography>
          </div>
          {formContent}
        </>
      )}
    </div>
  );
};

export default BaseChangePassword;
