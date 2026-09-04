// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {
  CredentialConstants,
  CredentialUpdateErrorResult,
  PasswordPolicy,
  mapCredentialUpdateError,
  resolveChangeCredentialPolicy,
  resolveResourceEndpoint,
  supportsCredential,
} from '@thunderid/browser';
import {FC, useMemo, useState} from 'react';
import BaseChangeCredential, {BaseChangeCredentialProps, ChangePasswordValues} from './BaseChangeCredential';
import updateMeCredentials from '../../../api/updateMeCredentials';
import useThunderID from '../../../contexts/ThunderID/useThunderID';
import useUser from '../../../contexts/User/useUser';
import useTranslation from '../../../hooks/useTranslation';

/**
 * Title-cases a credential name for use as its default display name, e.g. `pin` -> `Pin`.
 */
const defaultDisplayName = (credentialName: string): string =>
  credentialName.charAt(0).toUpperCase() + credentialName.slice(1);

export interface ChangeCredentialProps
  extends Omit<BaseChangeCredentialProps, 'error' | 'fieldErrors' | 'loading' | 'onSubmit' | 'success'> {
  /**
   * The credential attribute this instance manages, any attribute the user's entity type
   * schema declares `credential: true` (for example `password` or `pin`). Defaults to
   * `password`. Render the component once per credential to let a user manage more than one,
   * for example `<ChangeCredential />` for the password and
   * `<ChangeCredential credentialName="pin" />` for a PIN.
   */
  credentialName?: string;
  /**
   * Called after the credential has been changed successfully.
   */
  onSuccess?: () => void;
}

/**
 * ChangeCredential lets the signed-in user set a new value for one of their own credentials.
 *
 * It reads the applicable rules from the user schema already resolved by the ThunderID
 * provider, so it adds no network request beyond the write itself, and posts to
 * `/users/me/update-credentials` with the access token attached by the SDK's HTTP client.
 *
 * Defaults to managing the `password` credential. To manage a different one (for example a
 * PIN declared on the user type schema), set `credentialName`; render the component once per
 * credential to let a user manage several. Every default label, placeholder and message is
 * built from `credentialDisplayName`, which title-cases `credentialName` by default (`pin` ->
 * `Pin`); set it explicitly for a specific casing like `PIN`, or override individual strings
 * via `preferences.i18n` for full control (including other languages).
 *
 * @example
 * ```tsx
 * // Basic usage, manages the password
 * <ChangeCredential onSuccess={() => toast('Password updated')} />
 *
 * // With an explicit rule instead of the schema-derived policy
 * <ChangeCredential
 *   policy={{regex: '^.{12,}$'}}
 * />
 *
 * // Managing a different credential declared on the schema; labels read "Change PIN",
 * // "Current PIN", etc. automatically
 * <ChangeCredential credentialName="pin" credentialDisplayName="PIN" />
 * ```
 */
const ChangeCredential: FC<ChangeCredentialProps> = ({
  credentialDisplayName = undefined,
  credentialName = CredentialConstants.PASSWORD,
  onSuccess = undefined,
  policy = undefined,
  preferences = undefined,
  ...rest
}: ChangeCredentialProps) => {
  const {baseUrl, endpoints, instanceId, preferences: contextPreferences} = useThunderID();
  const {userSchema} = useUser();
  const resolvedDisplayName: string = credentialDisplayName ?? defaultDisplayName(credentialName);

  const resolvedPreferences = useMemo(
    () => ({
      ...contextPreferences,
      ...preferences,
      user: {...contextPreferences?.user, ...preferences?.user},
    }),
    [contextPreferences, preferences],
  );
  const {t} = useTranslation(resolvedPreferences?.i18n);

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  const resolvedPolicy: PasswordPolicy = useMemo(
    () => resolveChangeCredentialPolicy(userSchema, credentialName, policy),
    [userSchema, credentialName, policy],
  );

  const handleSubmit = async ({currentPassword, newPassword}: ChangePasswordValues): Promise<void> => {
    setError(null);
    setFieldErrors({});
    setSuccess(false);
    setLoading(true);

    try {
      await updateMeCredentials({
        baseUrl,
        instanceId,
        payload: {[credentialName]: {currentValue: currentPassword || undefined, newValue: newPassword}},
        url: resolveResourceEndpoint('usersMeCredentials', {endpoints}),
      });

      setSuccess(true);
      onSuccess?.();
    } catch (caughtError: unknown) {
      const {field, message, messageKey}: CredentialUpdateErrorResult = mapCredentialUpdateError(caughtError);
      const text: string =
        message ??
        t(messageKey, {credential: resolvedDisplayName, credentialLower: resolvedDisplayName.toLowerCase()});

      if (field) {
        setFieldErrors({[field]: text});
      } else {
        setError(text);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseChangeCredential
      {...rest}
      credentialDisplayName={resolvedDisplayName}
      error={error}
      fieldErrors={fieldErrors}
      loading={loading}
      policy={resolvedPolicy}
      preferences={resolvedPreferences}
      success={success}
      unavailable={!supportsCredential(userSchema, credentialName)}
      onSubmit={(values: ChangePasswordValues): void => {
        void handleSubmit(values);
      }}
    />
  );
};

export default ChangeCredential;
