// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

'use client';

import type {SSOSessionListResponse} from '@thunderid/node';
import {BaseActiveSessions, BaseActiveSessionsProps, useTranslation} from '@thunderid/react';
import {FC, ReactElement, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import getUserSessionsAction, {GetUserSessionsActionResult} from '../../../../server/actions/getUserSessionsAction';
import revokeUserSessionAction, {
  RevokeUserSessionActionResult,
} from '../../../../server/actions/revokeUserSessionAction';
import revokeUserSessionsAction, {
  RevokeUserSessionsActionResult,
} from '../../../../server/actions/revokeUserSessionsAction';
import useThunderID from '../../../contexts/ThunderID/useThunderID';

/**
 * Props for the ActiveSessions component.
 * Mirrors `@thunderid/react`'s `ActiveSessionsProps` exactly, so a consumer moving between
 * the React and Next.js SDKs doesn't need to change how they call it.
 */
export type ActiveSessionsProps = Omit<
  BaseActiveSessionsProps,
  | 'error'
  | 'loading'
  | 'onRevoke'
  | 'onRevokeOthers'
  | 'revokingOthers'
  | 'revokingSessionId'
  | 'sessions'
  | 'totalCount'
> & {
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
};

/**
 * ActiveSessions lists the signed-in user's live SSO sessions, and lets the user revoke any session
 * other than the current one, or all of them at once. Revoking a session signs it out and revokes
 * the tokens its applications were issued.
 *
 * This is the Next.js-specific implementation: it uses `BaseActiveSessions` from `@thunderid/react`
 * for rendering, but loads and revokes through server actions that use the signed-in user's
 * server-held session, so the access token never reaches the browser.
 *
 * The current session has no Revoke action here, since ending it would also end the session the
 * component is using. Use the regular sign-out for that.
 *
 * @example
 * ```tsx
 * <ActiveSessions />
 * ```
 */
const ActiveSessions: FC<ActiveSessionsProps> = ({
  cardLayout = true,
  limit,
  preferences,
  ...rest
}: ActiveSessionsProps): ReactElement => {
  const {preferences: contextPreferences} = useThunderID();
  const resolvedPreferences = useMemo(
    () => ({...contextPreferences, ...preferences, user: {...contextPreferences?.user, ...preferences?.user}}),
    [contextPreferences, preferences],
  );
  const {t} = useTranslation(resolvedPreferences?.i18n);

  const [page, setPage] = useState<SSOSessionListResponse | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [revokeError, setRevokeError] = useState<boolean>(false);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [revokingOthers, setRevokingOthers] = useState<boolean>(false);
  // Only the latest load may write state, so a slow earlier response cannot overwrite a newer one.
  const latestLoadRef = useRef<number>(0);

  const load = useCallback(async (): Promise<void> => {
    latestLoadRef.current += 1;
    const loadId: number = latestLoadRef.current;

    setLoading(true);

    const result: GetUserSessionsActionResult = await getUserSessionsAction({limit});

    if (loadId !== latestLoadRef.current) {
      return;
    }

    if (result.success) {
      setPage(result.page);
      setLoadError(false);
    } else {
      setLoadError(true);
    }

    setLoading(false);
  }, [limit]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRevokeResult = async (
    result: RevokeUserSessionActionResult | RevokeUserSessionsActionResult,
  ): Promise<void> => {
    // A 404 means the session is already gone, revoked elsewhere or expired, so refresh the list instead.
    if (result.success || result.statusCode === 404) {
      setRevokeError(false);
      await load();

      return;
    }

    setRevokeError(true);
  };

  const handleRevoke = async (sessionId: string): Promise<void> => {
    setRevokingSessionId(sessionId);
    await handleRevokeResult(await revokeUserSessionAction(sessionId));
    setRevokingSessionId(null);
  };

  const handleRevokeOthers = async (): Promise<void> => {
    setRevokingOthers(true);
    await handleRevokeResult(await revokeUserSessionsAction({exceptCurrent: true}));
    setRevokingOthers(false);
  };

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
      loading={loading}
      preferences={resolvedPreferences}
      revokingOthers={revokingOthers}
      revokingSessionId={revokingSessionId}
      sessions={page?.sessions}
      totalCount={page?.totalResults}
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
