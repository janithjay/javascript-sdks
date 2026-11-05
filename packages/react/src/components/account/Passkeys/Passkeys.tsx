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
import {FC, useEffect, useMemo, useState} from 'react';
import BasePasskeys, {BasePasskeysProps} from './BasePasskeys';
import useThunderID from '../../../contexts/ThunderID/useThunderID';
import useResourceMutation, {ResourceMutationResult} from '../../../hooks/management/useResourceMutation';
import useResourceQuery, {ResourceQueryResult} from '../../../hooks/management/useResourceQuery';
import useTranslation from '../../../hooks/useTranslation';
import {handlePasskeyRegistration} from '../../../utils/passkey';

const PASSKEYS_QUERY_KEY: readonly string[] = [UserQueryKeys.MY_PASSKEYS];

/**
 * How long a success message, or an error from adding or removing a passkey, stays before it clears.
 */
const MESSAGE_TIMEOUT_MS = 5000;

export interface PasskeysProps
  extends Omit<
    BasePasskeysProps,
    | 'adding'
    | 'error'
    | 'loading'
    | 'naming'
    | 'onAdd'
    | 'onRemove'
    | 'onSave'
    | 'passkeys'
    | 'removingPasskeyId'
    | 'saving'
    | 'success'
    | 'supported'
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
 * A passkey the device created that has not been saved yet.
 */
interface PendingPasskey {
  credential: PasskeyRegistrationCredential;
  sessionToken: string;
}

/**
 * Passkeys lets the signed-in user see, add and remove their own passkeys.
 *
 * It lists the passkeys at `GET /users/me/passkeys`. Adding one starts at
 * `POST /users/me/passkeys/register/start` and asks the device to create the passkey, then saves it with
 * the name the user gives it at `POST /users/me/passkeys/register/finish`. Removing one, after a
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
  const [pending, setPending] = useState<PendingPasskey | null>(null);

  useEffect(() => {
    if (!successKey) return undefined;

    const timerId: ReturnType<typeof setTimeout> = setTimeout(() => setSuccessKey(null), MESSAGE_TIMEOUT_MS);

    return (): void => clearTimeout(timerId);
  }, [successKey]);

  useEffect(() => {
    if (!actionErrorKey) return undefined;

    const timerId: ReturnType<typeof setTimeout> = setTimeout(() => setActionErrorKey(null), MESSAGE_TIMEOUT_MS);

    return (): void => clearTimeout(timerId);
  }, [actionErrorKey]);

  const {
    data,
    error: loadError,
    isLoading,
  }: ResourceQueryResult<PasskeyListResponse> = useResourceQuery(PASSKEYS_QUERY_KEY, (fetcher: ApiFetcher) =>
    getMePasskeys({baseUrl, fetcher, url}),
  );

  const create: ResourceMutationResult<PendingPasskey, void> = useResourceMutation(
    async (_: void, fetcher: ApiFetcher): Promise<PendingPasskey> => {
      const {publicKeyCredentialCreationOptions, sessionToken}: PasskeyRegistrationStartResponse =
        await startMePasskeyRegistration({baseUrl, fetcher, relyingPartyId: rpId, url});
      const credential: PasskeyRegistrationCredential = JSON.parse(
        await handlePasskeyRegistration(JSON.stringify(publicKeyCredentialCreationOptions)),
      ) as PasskeyRegistrationCredential;

      return {credential, sessionToken};
    },
    () => [],
  );

  const save: ResourceMutationResult<Passkey, {name: string; passkey: PendingPasskey}> = useResourceMutation(
    async ({name, passkey}: {name: string; passkey: PendingPasskey}, fetcher: ApiFetcher): Promise<Passkey> =>
      finishMePasskeyRegistration({baseUrl, fetcher, name, url, ...passkey}),
    () => [PASSKEYS_QUERY_KEY],
  );

  const remove: ResourceMutationResult<void, string> = useResourceMutation(
    async (passkeyId: string, fetcher: ApiFetcher): Promise<void> => {
      await deleteMePasskey({baseUrl, fetcher, passkeyId, url});
      await signalUnknownPasskey(rpId, passkeyId);
    },
    () => [PASSKEYS_QUERY_KEY],
  );

  const handleAdd = async (): Promise<void> => {
    setActionErrorKey(null);
    setSuccessKey(null);

    try {
      setPending(await create.mutateAsync());
    } catch (caughtError: unknown) {
      setActionErrorKey(resolvePasskeyErrorKey(caughtError, 'user.passkeys.error.add'));
    }
  };

  const handleSave = async (name: string): Promise<void> => {
    if (!pending) {
      return;
    }

    setActionErrorKey(null);

    try {
      const passkey: Passkey = await save.mutateAsync({name: name.trim(), passkey: pending});

      setPending(null);
      setSuccessKey('user.passkeys.add.success');
      onAdd?.(passkey);
    } catch (caughtError: unknown) {
      // The registration can't be finished once it fails, so drop it and show the error.
      setPending(null);
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
      adding={create.isLoading}
      error={errorKey ? t(errorKey) : null}
      loading={isLoading}
      naming={pending !== null && !save.isLoading}
      passkeys={data?.passkeys ?? []}
      preferences={resolvedPreferences}
      removingPasskeyId={removingPasskeyId}
      saving={save.isLoading}
      success={successKey ? t(successKey) : null}
      supported={supported}
      onAdd={(): void => {
        void handleAdd();
      }}
      onRemove={(passkeyId: string): void => {
        void handleRemove(passkeyId);
      }}
      onSave={(name: string): void => {
        void handleSave(name);
      }}
    />
  );
};

export default Passkeys;
