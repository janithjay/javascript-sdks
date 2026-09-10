// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

'use client';

import {
  CredentialConstants,
  CredentialUpdateErrorResult,
  PasswordPolicy,
  ThunderIDAPIError,
  mapCredentialUpdateError,
  resolveChangeCredentialPolicy,
  supportsCredential,
} from '@thunderid/node';
import {
  BaseChangeCredential,
  BaseChangeCredentialProps,
  ChangePasswordValues,
  useTranslation,
  useUser,
} from '@thunderid/react';
import {FC, ReactElement, useMemo, useState} from 'react';
import getSessionId from '../../../../server/actions/getSessionId';
import updateUserCredentialsAction from '../../../../server/actions/updateUserCredentialsAction';
import useThunderID from '../../../contexts/ThunderID/useThunderID';

/**
 * Title-cases a credential name for use as its default display name, e.g. `pin` -> `Pin`.
 */
const defaultDisplayName = (credentialName: string): string =>
  credentialName.charAt(0).toUpperCase() + credentialName.slice(1);

/**
 * Props for the {@link ChangeCredential} component.
 */
export interface ChangeCredentialProps
  extends Omit<BaseChangeCredentialProps, 'error' | 'fieldErrors' | 'loading' | 'onSubmit' | 'success'> {
  /**
   * The credential attribute this instance manages, any attribute the user's entity type
   * schema declares `credential: true` (for example `password` or `pin`). Defaults to
   * `password`. Render the component once per credential to manage more than one.
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
 * The Next.js implementation delegates the write to the `updateUserCredentialsAction` server
 * action so the access token never leaves the server, and delegates rendering to
 * {@link BaseChangeCredential} from `@thunderid/react`. The applicable rules are read from the
 * user schema already resolved by `ThunderIDProvider`, so it adds no request beyond the write.
 *
 * @example
 * ```tsx
 * <ChangeCredential onSuccess={() => toast('Password updated')} />
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
}: ChangeCredentialProps): ReactElement => {
  const {preferences: contextPreferences} = useThunderID();
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

    const result: {error: string; status: number; success: boolean} = await updateUserCredentialsAction(
      {payload: {[credentialName]: {currentValue: currentPassword || undefined, newValue: newPassword}}},
      await getSessionId(),
    );

    if (result.success) {
      setSuccess(true);
      onSuccess?.();
    } else {
      const {field, message, messageKey}: CredentialUpdateErrorResult = mapCredentialUpdateError(
        new ThunderIDAPIError(result.error, 'updateUserCredentialsAction-ResponseError-001', 'nextjs', result.status),
      );
      const text: string =
        message ?? t(messageKey, {credential: resolvedDisplayName, credentialLower: resolvedDisplayName.toLowerCase()});

      if (field) {
        setFieldErrors({[field]: text});
      } else {
        setError(text);
      }
    }

    setLoading(false);
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
