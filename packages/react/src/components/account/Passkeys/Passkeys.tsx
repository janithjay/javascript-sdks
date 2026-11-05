// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {
  ApiFetcher,
  Passkey,
  PasskeyListResponse,
  PasskeyRegistrationCredential,
  PasskeyRegistrationStartResponse,
  UserQueryKeys,
  deleteMePasskey,
  finishMePasskeyRegistration,
  getMePasskeys,
  isWebAuthnSupported,
  resolvePasskeyErrorKey,
  resolveResourceEndpoint,
  signalUnknownPasskey,
  startMePasskeyRegistration,
} from '@thunderid/browser';
import {FC, useMemo, useState} from 'react';
import BasePasskeys, {BasePasskeysProps} from './BasePasskeys';
import useThunderID from '../../../contexts/ThunderID/useThunderID';
import useResourceMutation, {ResourceMutationResult} from '../../../hooks/management/useResourceMutation';
import useResourceQuery, {ResourceQueryResult} from '../../../hooks/management/useResourceQuery';
import useTranslation from '../../../hooks/useTranslation';
import {handlePasskeyRegistration} from '../../../utils/passkey';

const PASSKEYS_QUERY_KEY: readonly string[] = [UserQueryKeys.MY_PASSKEYS];

export interface PasskeysProps
  extends Omit<
    BasePasskeysProps,
    'adding' | 'error' | 'loading' | 'onAdd' | 'onRemove' | 'passkeys' | 'removingPasskeyId' | 'success' | 'supported'
  > {
  /**
   * Called with the new passkey once it has been added.
   */
  onAdd?: (passkey: Passkey) => void;
  /**
   * Called with a passkey's ID once it has been removed.
   */
  onRemove?: (passkeyId: string) => void;
  /**
   * The relying party ID to create passkeys for. Defaults to the page's host name. It must be the
   * passkey relying party ID of the application, or the host (or a parent domain of the host) of one of
   * its passkey origins.
   */
  relyingPartyId?: string;
}

/**
 * Passkeys lets the signed-in user see, add and remove their own passkeys.
 *
 * It lists the passkeys at `GET /users/me/passkeys`. Adding one starts at
 * `POST /users/me/passkeys/register/start`, asks the device to create the passkey, and saves it with the
 * name the user typed at `POST /users/me/passkeys/register/finish`. Removing one, after an inline
 * confirmation, calls `DELETE /users/me/passkeys/{id}` and then tells the user's passkey provider through
 * the WebAuthn Signal API, where the browser supports it. Every request carries the access token the SDK
 * holds.
 *
 * @example
 * ```tsx
 * <Passkeys cardLayout onAdd={(passkey) => toast(`Added ${passkey.name ?? 'a passkey'}`)} />
 *
 * // A custom UI that keeps the data loading and actions
 * <Passkeys>
 *   {({passkeys, getDisplayName, onRemove}) => (
 *     <ul>
 *       {passkeys.map((passkey) => (
 *         <li key={passkey.id}>
 *           {getDisplayName(passkey)}
 *           <button onClick={() => confirm('Remove?') && onRemove?.(passkey.id)}>Remove</button>
 *         </li>
 *       ))}
 *     </ul>
 *   )}
 * </Passkeys>
 * ```
 */
const Passkeys: FC<PasskeysProps> = ({
  onAdd = undefined,
  onRemove = undefined,
  preferences = undefined,
  relyingPartyId = undefined,
  ...rest
}: PasskeysProps) => {
  const {baseUrl, endpoints, preferences: contextPreferences} = useThunderID();

  const resolvedPreferences = useMemo(
    () => ({
      ...contextPreferences,
      ...preferences,
      user: {...contextPreferences?.user, ...preferences?.user},
    }),
    [contextPreferences, preferences],
  );
  const {t} = useTranslation(resolvedPreferences?.i18n);

  const url: string | undefined = resolveResourceEndpoint('usersMePasskeys', {endpoints});
  const rpId: string = relyingPartyId ?? window.location.hostname;
  const supported: boolean = isWebAuthnSupported();

  const [actionErrorKey, setActionErrorKey] = useState<string | null>(null);
  const [successKey, setSuccessKey] = useState<string | null>(null);
  const [removingPasskeyId, setRemovingPasskeyId] = useState<string | null>(null);

  const {
    data,
    error: loadError,
    isLoading,
  }: ResourceQueryResult<PasskeyListResponse> = useResourceQuery(PASSKEYS_QUERY_KEY, (fetcher: ApiFetcher) =>
    getMePasskeys({baseUrl, fetcher, url}),
  );

  const add: ResourceMutationResult<Passkey, string> = useResourceMutation(
    async (name: string, fetcher: ApiFetcher): Promise<Passkey> => {
      const {publicKeyCredentialCreationOptions, sessionToken}: PasskeyRegistrationStartResponse =
        await startMePasskeyRegistration({baseUrl, fetcher, relyingPartyId: rpId, url});
      const credential: PasskeyRegistrationCredential = JSON.parse(
        await handlePasskeyRegistration(JSON.stringify(publicKeyCredentialCreationOptions)),
      ) as PasskeyRegistrationCredential;

      return finishMePasskeyRegistration({baseUrl, credential, fetcher, name, sessionToken, url});
    },
    () => [PASSKEYS_QUERY_KEY],
  );

  const remove: ResourceMutationResult<void, string> = useResourceMutation(
    async (passkeyId: string, fetcher: ApiFetcher): Promise<void> => {
      await deleteMePasskey({baseUrl, fetcher, passkeyId, url});
      await signalUnknownPasskey(rpId, passkeyId);
    },
    () => [PASSKEYS_QUERY_KEY],
  );

  const handleAdd = async (name: string): Promise<void> => {
    setActionErrorKey(null);
    setSuccessKey(null);

    try {
      const passkey: Passkey = await add.mutateAsync(name);

      setSuccessKey('user.passkeys.add.success');
      onAdd?.(passkey);
    } catch (caughtError: unknown) {
      setActionErrorKey(resolvePasskeyErrorKey(caughtError, 'user.passkeys.error.add'));
    }
  };

  const handleRemove = async (passkeyId: string): Promise<void> => {
    setActionErrorKey(null);
    setSuccessKey(null);
    setRemovingPasskeyId(passkeyId);

    try {
      await remove.mutateAsync(passkeyId);

      setSuccessKey('user.passkeys.remove.success');
      onRemove?.(passkeyId);
    } catch (caughtError: unknown) {
      setActionErrorKey(resolvePasskeyErrorKey(caughtError, 'user.passkeys.error.remove'));
    } finally {
      setRemovingPasskeyId(null);
    }
  };

  let errorKey: string | null = actionErrorKey;

  if (!errorKey && loadError) {
    errorKey = resolvePasskeyErrorKey(loadError, 'user.passkeys.error.load');
  }

  return (
    <BasePasskeys
      {...rest}
      adding={add.isLoading}
      error={errorKey ? t(errorKey) : null}
      loading={isLoading}
      passkeys={data?.passkeys ?? []}
      preferences={resolvedPreferences}
      removingPasskeyId={removingPasskeyId}
      success={successKey ? t(successKey) : null}
      supported={supported}
      onAdd={(name: string): void => {
        void handleAdd(name);
      }}
      onRemove={(passkeyId: string): void => {
        void handleRemove(passkeyId);
      }}
    />
  );
};

export default Passkeys;
