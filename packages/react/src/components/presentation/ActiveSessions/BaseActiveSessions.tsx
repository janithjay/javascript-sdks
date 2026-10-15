// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {
  PlatformIcon,
  PlatformIconElement,
  Preferences,
  SSOSession,
  SSOSessionParticipant,
  UserAgentDescription,
  bem,
  describeUserAgent,
  resolvePlatformIcon,
  withVendorCSSClassPrefix,
} from '@thunderid/browser';
import {FC, MouseEvent, ReactElement, createElement, useEffect, useId, useRef, useState} from 'react';
import useStyles from './BaseActiveSessions.styles';
import useTheme from '../../../contexts/Theme/useTheme';
import useTranslation from '../../../hooks/useTranslation';
import {cx} from '../../../styles/emotion';
import AlertPrimitive from '../../primitives/Alert/Alert';
import Button from '../../primitives/Button/Button';
import Spinner from '../../primitives/Spinner/Spinner';
import Typography from '../../primitives/Typography/Typography';

export interface BaseActiveSessionsProps {
  /**
   * Whether to wrap the list in a bordered card.
   */
  cardLayout?: boolean;
  /**
   * Additional CSS class names for the root element.
   */
  className?: string;
  /**
   * An error to show above the list, such as a failed load or revoke.
   */
  error?: string | null;
  /**
   * Whether the sessions are loading.
   */
  loading?: boolean;
  /**
   * Called with a session's identifier once the user confirms revoking it.
   */
  onRevoke?: (sessionId: string) => void;
  /**
   * Called once the user confirms revoking every session except the current one.
   */
  onRevokeOthers?: () => void;
  /**
   * Component-level preference overrides, including i18n.
   */
  preferences?: Preferences;
  /**
   * Whether revoking every other session is in flight.
   */
  revokingOthers?: boolean;
  /**
   * The session whose revoke is in flight.
   */
  revokingSessionId?: string | null;
  /**
   * The sessions to list.
   */
  sessions?: SSOSession[];
  /**
   * Overrides the default "Active sessions" heading. Pass an empty string to omit it.
   */
  title?: string;
  /**
   * How many sessions the user has in all, when `sessions` is one page of them. Defaults to the
   * number of `sessions`.
   */
  totalCount?: number;
}

const ALL_OTHERS = 'all-others';

const cls = (element?: string, modifier?: string): string =>
  withVendorCSSClassPrefix(bem('active-sessions', element, modifier));

const toReactAttributes = (attributes: Record<string, string>): Record<string, string> =>
  Object.fromEntries(
    Object.entries(attributes).map(([name, value]: [string, string]) => [
      name.replace(/-([a-z])/g, (_match: string, letter: string) => letter.toUpperCase()),
      value,
    ]),
  );

/**
 * Presentational list of the signed-in user's SSO sessions. Each session other than the current one can
 * be revoked, and so can all of them at once, after an inline confirmation.
 *
 * Holds no context and performs no network calls: it renders the sessions it is given and reports a
 * confirmed revoke through `onRevoke` and `onRevokeOthers`. Use {@link ActiveSessions} for the
 * context-wired variant.
 *
 * @example
 * ```tsx
 * <BaseActiveSessions className="my-sessions" sessions={sessions} onRevoke={(id) => revoke(id)} />
 * ```
 */
const BaseActiveSessions: FC<BaseActiveSessionsProps> = ({
  cardLayout = false,
  className = '',
  error = null,
  loading = false,
  onRevoke = undefined,
  onRevokeOthers = undefined,
  preferences = undefined,
  revokingOthers = false,
  revokingSessionId = null,
  sessions = [],
  title = undefined,
  totalCount = undefined,
}: BaseActiveSessionsProps) => {
  const {theme, colorScheme}: ReturnType<typeof useTheme> = useTheme();
  const styles: Record<string, string> = useStyles(theme, colorScheme);
  const {t, currentLanguage} = useTranslation(preferences?.i18n);
  const idPrefix: string = useId();
  // The session awaiting confirmation, or ALL_OTHERS when it is for revoking every other one.
  const [confirming, setConfirming] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  // The button that opened the confirmation, so focus can return to it once the confirmation closes.
  const openerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (confirming !== null) {
      cancelRef.current?.focus();

      return;
    }

    const opener: HTMLButtonElement | null = openerRef.current;

    if (!opener) {
      return;
    }

    openerRef.current = null;

    // The opener is disabled while its revoke is in flight, or gone once revoked, so fall back to the list.
    if (opener.isConnected && !opener.disabled) {
      opener.focus();
    } else {
      rootRef.current?.focus();
    }
  }, [confirming]);

  const openConfirm = (target: string, event: MouseEvent<HTMLButtonElement>): void => {
    openerRef.current = event.currentTarget;
    setConfirming(target);
  };

  const busy: boolean = revokingOthers || revokingSessionId !== null;
  const otherCount: number = sessions.filter((session: SSOSession) => !session.isCurrent).length;
  const total: number = totalCount ?? sessions.length;
  // The current session may be on another page, and the server keeps it when revoking the rest.
  const canRevokeOthers: boolean =
    otherCount > 0 && (sessions.some((session: SSOSession) => session.isCurrent) || total > sessions.length);
  // The current session comes first; the rest keep the server's order, most recently active first.
  const orderedSessions: SSOSession[] = [...sessions].sort(
    (a: SSOSession, b: SSOSession) => Number(b.isCurrent) - Number(a.isCurrent),
  );
  const heading: string = title ?? t('user.sessions.heading');
  // A lone session that isn't this device gets no summary, since "your only active session" would be wrong.
  let summary: string | null = null;

  if (total > 1) {
    summary = t('user.sessions.summary', {count: total});
  } else if (sessions[0]?.isCurrent) {
    summary = t('user.sessions.summary.only');
  }

  const formatDate = (value: string): string =>
    new Date(value).toLocaleDateString(currentLanguage, {dateStyle: 'medium'});
  const formatClock = (value: string): string =>
    new Date(value).toLocaleTimeString(currentLanguage, {timeStyle: 'short'});

  // A mobile SDK's session names no browser, so the application the user signed in to stands in for
  // it, and the device for the operating system: "Quickstart on Redmi Note 8 Pro".
  const describeDevice = (session: SSOSession, {browser, device, os}: UserAgentDescription): string => {
    const client: string | undefined = browser ?? session.participants[0]?.appName;
    const place: string | undefined = device ?? os;
    if (client && place) {
      return t('user.sessions.device', {browser: client, os: place});
    }

    return client ?? place ?? t('user.sessions.unknown_device');
  };

  const renderPlatformIcon = (kind: 'browser' | 'os', name?: string): ReactElement => {
    const {elements, size}: PlatformIcon = resolvePlatformIcon(kind, name);

    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        {elements.map(({tag, attributes}: PlatformIconElement, index: number) =>
          // The shapes of an icon never change order, so their position is a stable key.
          // eslint-disable-next-line react/no-array-index-key
          createElement(tag, {...toReactAttributes(attributes), key: index}),
        )}
      </svg>
    );
  };

  const renderConfirm = (message: string, onConfirm: () => void, inSession: boolean): ReactElement => (
    <div
      role="group"
      aria-label={message}
      className={cx(cls('confirm'), styles['confirm'], inSession ? styles['confirmInSession'] : '')}
    >
      <Typography variant="body2" component="p" color="textSecondary" className={cls('confirm-message')}>
        {message}
      </Typography>
      <div className={cx(cls('confirm-actions'), styles['confirmActions'])}>
        <Button
          ref={cancelRef}
          type="button"
          size="small"
          color="secondary"
          variant="outline"
          className={cls('cancel')}
          onClick={(): void => setConfirming(null)}
        >
          {t('user.sessions.cancel')}
        </Button>
        <Button
          type="button"
          size="small"
          variant="solid"
          className={cx(cls('confirm-revoke'), styles['confirmRevoke'])}
          disabled={busy}
          onClick={(): void => {
            setConfirming(null);
            onConfirm();
          }}
        >
          {t('user.sessions.revoke')}
        </Button>
      </div>
    </div>
  );

  const renderTime = (label: string, value: string): ReactElement => (
    <div className={cx(cls('detail'), styles['detail'])}>
      <dt className={cx(cls('detail-label'), styles['detailLabel'])}>{label}</dt>
      <dd
        className={cx(cls('detail-value'), cls('detail-value', 'datetime'), styles['detailValue'], styles['dateTime'])}
      >
        <span className={cls('detail-date')}>{formatDate(value)}</span>
        <span className={cls('detail-time')}>{formatClock(value)}</span>
      </dd>
    </div>
  );

  const renderSession = (session: SSOSession): ReactElement => {
    const deviceId = `${idPrefix}-${session.id}`;
    const userAgent: UserAgentDescription = describeUserAgent(session.userAgent);
    const device: string = describeDevice(session, userAgent);
    const ip: string | undefined = session.lastActiveIp ?? session.creationIp;

    return (
      <li key={session.id} data-current={session.isCurrent} className={cx(cls('session'), styles['session'])}>
        <div className={cx(cls('session-header'), styles['sessionHeader'])}>
          <div className={cx(cls('device-icon'), styles['deviceIcon'])}>
            <span title={userAgent.os} className={cx(cls('os-icon'), styles['osIcon'])}>
              {renderPlatformIcon('os', userAgent.os)}
            </span>
            <span title={userAgent.browser} className={cx(cls('browser-icon'), styles['browserIcon'])}>
              {renderPlatformIcon('browser', userAgent.browser)}
            </span>
          </div>
          <div className={cx(cls('session-title'), styles['sessionTitle'])}>
            <Typography id={deviceId} variant="body1" component="span" fontWeight="semibold" className={cls('device')}>
              {device}
            </Typography>
            {session.isCurrent && (
              <span className={cx(cls('current'), styles['current'])}>{t('user.sessions.current')}</span>
            )}
          </div>
          {!session.isCurrent && (
            <Button
              type="button"
              size="small"
              color="secondary"
              variant="outline"
              className={cls('revoke')}
              aria-describedby={deviceId}
              aria-expanded={confirming === session.id}
              loading={revokingSessionId === session.id}
              disabled={busy}
              onClick={(event: MouseEvent<HTMLButtonElement>): void => openConfirm(session.id, event)}
            >
              {t('user.sessions.revoke')}
            </Button>
          )}
        </div>
        <dl className={cx(cls('details'), styles['details'])}>
          <div className={cx(cls('detail'), styles['detail'])}>
            <dt className={cx(cls('detail-label'), styles['detailLabel'])}>{t('user.sessions.ip')}</dt>
            <dd className={cx(cls('detail-value'), cls('detail-value', 'ip'), styles['detailValue'])}>
              {ip ?? t('user.sessions.unknown')}
            </dd>
          </div>
          {renderTime(t('user.sessions.signed_in'), session.authenticatedAt)}
          {renderTime(t('user.sessions.last_active'), session.lastActiveAt)}
        </dl>
        <div className={cx(cls('apps-row'), styles['appsRow'])}>
          <span className={cx(cls('apps-label'), styles['appsLabel'])}>{t('user.sessions.applications')}</span>
          {session.participants.length > 0 ? (
            <ul className={cx(cls('apps'), styles['apps'])}>
              {session.participants.map((participant: SSOSessionParticipant) => (
                <li key={participant.appId} className={cx(cls('app'), styles['app'])}>
                  {participant.appName ?? participant.appId}
                </li>
              ))}
            </ul>
          ) : (
            <span className={cx(cls('app'), styles['app'])}>{t('user.sessions.unknown')}</span>
          )}
        </div>
        {confirming === session.id &&
          renderConfirm(t('user.sessions.revoke.confirm', {device}), (): void => onRevoke?.(session.id), true)}
      </li>
    );
  };

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      aria-busy={loading}
      className={cx(cls(), styles['root'], cardLayout ? styles['card'] : '', className)}
    >
      {(heading || sessions.length > 0) && (
        <div className={cx(cls('header'), styles['header'])}>
          <div className={cls('header-text')}>
            {heading && (
              <Typography variant="h5" className={cx(cls('heading'), styles['heading'])}>
                {heading}
              </Typography>
            )}
            {summary && (
              <Typography variant="body2" component="p" color="textSecondary" className={cls('summary')}>
                {summary}
              </Typography>
            )}
          </div>
          {canRevokeOthers && (
            <Button
              type="button"
              size="small"
              color="secondary"
              variant="outline"
              className={cx(cls('revoke-others'), styles['revokeOthers'])}
              aria-expanded={confirming === ALL_OTHERS}
              loading={revokingOthers}
              disabled={busy}
              onClick={(event: MouseEvent<HTMLButtonElement>): void => openConfirm(ALL_OTHERS, event)}
            >
              {t('user.sessions.revoke_others')}
            </Button>
          )}
        </div>
      )}

      {confirming === ALL_OTHERS &&
        renderConfirm(t('user.sessions.revoke_others.confirm'), (): void => onRevokeOthers?.(), false)}

      {error && (
        <AlertPrimitive variant="error" className={cls('error')}>
          <AlertPrimitive.Description>{error}</AlertPrimitive.Description>
        </AlertPrimitive>
      )}

      {loading && sessions.length === 0 && (
        <div className={cx(cls('loading'), styles['loading'])}>
          <Spinner size="medium" />
        </div>
      )}

      {!loading && sessions.length === 0 && !error && (
        <Typography variant="body2" component="p" color="textSecondary" className={cx(cls('empty'), styles['empty'])}>
          {t('user.sessions.empty')}
        </Typography>
      )}

      {orderedSessions.length > 0 && (
        <ul className={cx(cls('list'), styles['list'])}>{orderedSessions.map(renderSession)}</ul>
      )}
    </div>
  );
};

export default BaseActiveSessions;
