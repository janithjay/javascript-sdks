// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {SSOSessionListResponse, ThunderIDAPIError, resolveResourceEndpoint} from '@thunderid/browser';
import {FC, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import BaseActiveSessions, {BaseActiveSessionsProps} from './BaseActiveSessions';
import getMeSessions from '../../../api/account/getMeSessions';
import revokeMeSession from '../../../api/account/revokeMeSession';
import revokeMeSessions from '../../../api/account/revokeMeSessions';
import useThunderID from '../../../contexts/ThunderID/useThunderID';
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
    | 'totalResults'
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
 * For a fully custom UI, use {@link BaseActiveSessions} with `getMeSessions`, `revokeMeSession` and
 * `revokeMeSessions`.
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
  const {baseUrl, endpoints, instanceId, preferences: contextPreferences} = useThunderID();
  const resolvedPreferences = useMemo(
    () => ({...contextPreferences, ...preferences, user: {...contextPreferences?.user, ...preferences?.user}}),
    [contextPreferences, preferences],
  );
  const {t} = useTranslation(resolvedPreferences?.i18n);

  const [page, setPage] = useState<SSOSessionListResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorKey, setErrorKey] = useState<'user.sessions.load.error' | 'user.sessions.revoke.error' | null>(null);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [revokingOthers, setRevokingOthers] = useState<boolean>(false);
  // The latest load, so an earlier one that settles late does not replace its result.
  const requestRef = useRef<number>(0);

  const url: string | undefined = resolveResourceEndpoint('usersMeSessions', {endpoints});

  const load = useCallback(async (): Promise<void> => {
    const request: number = requestRef.current + 1;
    requestRef.current = request;
    setLoading(true);

    try {
      const sessions: SSOSessionListResponse = await getMeSessions({baseUrl, instanceId, limit, url});

      if (requestRef.current === request) {
        setPage(sessions);
        setErrorKey(null);
      }
    } catch {
      if (requestRef.current === request) {
        setErrorKey('user.sessions.load.error');
      }
    } finally {
      if (requestRef.current === request) {
        setLoading(false);
      }
    }
  }, [baseUrl, instanceId, limit, url]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRevoke = async (sessionId: string): Promise<void> => {
    setRevokingSessionId(sessionId);

    try {
      await revokeMeSession({baseUrl, instanceId, sessionId, url});
      await load();
    } catch (caught: unknown) {
      // A 404 means the session is already gone, revoked elsewhere or expired, so refresh the list instead.
      if (caught instanceof ThunderIDAPIError && caught.statusCode === 404) {
        await load();
      } else {
        setErrorKey('user.sessions.revoke.error');
      }
    } finally {
      setRevokingSessionId(null);
    }
  };

  const handleRevokeOthers = async (): Promise<void> => {
    setRevokingOthers(true);

    try {
      await revokeMeSessions({baseUrl, exceptCurrent: true, instanceId, url});
      await load();
    } catch {
      setErrorKey('user.sessions.revoke.error');
    } finally {
      setRevokingOthers(false);
    }
  };

  return (
    <BaseActiveSessions
      {...rest}
      cardLayout={cardLayout}
      error={errorKey ? t(errorKey) : null}
      loading={loading}
      preferences={resolvedPreferences}
      revokingOthers={revokingOthers}
      revokingSessionId={revokingSessionId}
      sessions={page?.sessions}
      totalResults={page?.totalResults}
      onRevoke={(sessionId: string): void => {
        void handleRevoke(sessionId);
      }}
      onRevokeOthers={(): void => {
        void handleRevokeOthers();
      }}
    />
  );
};

export default ActiveSessions;
