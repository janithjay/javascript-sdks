// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ThunderIDAPIError} from '@thunderid/browser';
import {FC, useMemo, useState} from 'react';
import BaseActiveSessions, {BaseActiveSessionsProps} from './BaseActiveSessions';
import useThunderID from '../../../contexts/ThunderID/useThunderID';
import useGetMeSessions from '../../../hooks/sessions/useGetMeSessions';
import useRevokeMeSession from '../../../hooks/sessions/useRevokeMeSession';
import useRevokeMeSessions from '../../../hooks/sessions/useRevokeMeSessions';
import useTranslation from '../../../hooks/useTranslation';

export interface ActiveSessionsProps
  extends Omit<
    BaseActiveSessionsProps,
    | 'error'
    | 'loading'
    | 'onRevoke'
    | 'onRevokeOthers'
    | 'revokingOthers'
    | 'revokingSessionId'
    | 'sessions'
    | 'totalCount'
  > {
  /**
   * Whether to wrap the list in a bordered card. Set to `false` to render it without one.
   * @default true
   */
  cardLayout?: boolean;
  /**
   * The most sessions to list, from 1 to 100. Defaults to the server's page size. Only this first page
   * is listed; sessions beyond it can still be revoked with Revoke all others.
   */
  limit?: number;
}

/**
 * ActiveSessions lists the signed-in user's live SSO sessions from `GET /users/me/sessions`, and lets the
 * user revoke any session other than the current one, or all of them at once. Revoking a session
 * signs it out and revokes the tokens its applications were issued.
 *
 * The current session has no Revoke action here, since ending it would also end the access token
 * the component is using. Use the regular sign-out for that.
 *
 * For a fully custom UI, use the `useGetMeSessions`, `useRevokeMeSession` and `useRevokeMeSessions`
 * hooks directly.
 *
 * @example
 * ```tsx
 * <ActiveSessions />
 * ```
 */
const ActiveSessions: FC<ActiveSessionsProps> = ({
  cardLayout = true,
  limit = undefined,
  preferences = undefined,
  ...rest
}: ActiveSessionsProps) => {
  const {preferences: contextPreferences} = useThunderID();
  const resolvedPreferences = useMemo(
    () => ({...contextPreferences, ...preferences, user: {...contextPreferences?.user, ...preferences?.user}}),
    [contextPreferences, preferences],
  );
  const {t} = useTranslation(resolvedPreferences?.i18n);

  const [revokeError, setRevokeError] = useState<boolean>(false);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const onError = (): void => setRevokeError(true);
  const onSuccess = (): void => setRevokeError(false);

  const {data, error: loadError, isLoading, refetch} = useGetMeSessions({limit});
  const revokeOne = useRevokeMeSession({
    onError: (revokeFailure: Error): void => {
      // A 404 means the session is already gone, revoked elsewhere or expired, so refresh the list instead.
      if (revokeFailure instanceof ThunderIDAPIError && revokeFailure.statusCode === 404) {
        onSuccess();
        void refetch();

        return;
      }

      onError();
    },
    onSuccess,
  });
  const revokeOthers = useRevokeMeSessions({onError, onSuccess});

  let error: string | null = null;

  if (revokeError) {
    error = t('user.sessions.revoke.error');
  } else if (loadError) {
    error = t('user.sessions.load.error');
  }

  return (
    <BaseActiveSessions
      {...rest}
      cardLayout={cardLayout}
      error={error}
      loading={isLoading}
      preferences={resolvedPreferences}
      revokingOthers={revokeOthers.isLoading}
      revokingSessionId={revokingSessionId}
      sessions={data?.sessions}
      totalCount={data?.totalResults}
      onRevoke={(sessionId: string): void => {
        setRevokingSessionId(sessionId);
        void revokeOne.mutate(sessionId).finally((): void => setRevokingSessionId(null));
      }}
      onRevokeOthers={(): void => {
        void revokeOthers.mutate({exceptCurrent: true});
      }}
    />
  );
};

export default ActiveSessions;
