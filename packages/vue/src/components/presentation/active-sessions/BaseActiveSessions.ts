// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {
  PlatformIcon,
  PlatformIconElement,
  SSOSession,
  SSOSessionParticipant,
  UserAgentDescription,
  bem,
  describeUserAgent,
  resolvePlatformIcon,
  withVendorCSSClassPrefix,
} from '@thunderid/browser';
import {
  type Component,
  type ComponentPublicInstance,
  type PropType,
  type Ref,
  type SetupContext,
  type VNode,
  defineComponent,
  h,
  nextTick,
  ref,
  useId,
  watch,
} from 'vue';
import useI18n from '../../../composables/useI18n';
import Alert from '../../primitives/Alert';
import Button from '../../primitives/Button';
import Spinner from '../../primitives/Spinner';

type BaseActiveSessionsProps = Readonly<{
  cardLayout: boolean;
  className: string;
  error: string | null;
  loading: boolean;
  revokingOthers: boolean;
  revokingSessionId: string | null;
  sessions: SSOSession[];
  t?: (key: string, params?: Record<string, string | number>) => string;
  title?: string;
  totalCount?: number;
}>;

const ALL_OTHERS = 'all-others';

const cls = (element?: string, modifier?: string): string =>
  withVendorCSSClassPrefix(bem('active-sessions', element, modifier));

/**
 * Presentational list of the signed-in user's SSO sessions. Each session other than the current one can
 * be revoked, and so can all of them at once, after an inline confirmation.
 *
 * Holds no context and performs no network calls: it emits `revoke` with a session's identifier and
 * `revoke-others` for the rest, once confirmed. Use `ActiveSessions` for the context-wired variant.
 */
const BaseActiveSessions: Component = defineComponent({
  name: 'BaseActiveSessions',
  props: {
    /** Whether to wrap the list in a bordered card. */
    cardLayout: {default: false, type: Boolean},
    /** Extra CSS class added to the root element. */
    className: {default: '', type: String},
    /** An error to show above the list, such as a failed load or revoke. */
    error: {default: null, type: String as PropType<string | null>},
    /** Whether the sessions are loading. */
    loading: {default: false, type: Boolean},
    /** Whether revoking every other session is in flight. */
    revokingOthers: {default: false, type: Boolean},
    /** The session whose revoke is in flight. */
    revokingSessionId: {default: null, type: String as PropType<string | null>},
    /** The sessions to list. */
    sessions: {default: () => [], type: Array as PropType<SSOSession[]>},
    /** Translation function, injected by the container so both variants resolve the same bundle. */
    t: {
      default: undefined,
      type: Function as PropType<(key: string, params?: Record<string, string | number>) => string>,
    },
    /** Overrides the default "Active sessions" heading. Pass an empty string to omit it. */
    title: {default: undefined, type: String},
    /**
     * How many sessions the user has in all, when `sessions` is one page of them. Defaults to the
     * number of `sessions`.
     */
    totalCount: {default: undefined, type: Number},
  },
  emits: ['revoke', 'revoke-others'],
  setup(props: BaseActiveSessionsProps, {emit}: SetupContext): () => VNode {
    const {t: fallbackT, currentLanguage} = useI18n();
    const idPrefix: string = useId();
    // The session awaiting confirmation, or ALL_OTHERS when it is for revoking every other one.
    const confirming: Ref<string | null> = ref(null);
    const rootRef: Ref<HTMLElement | null> = ref(null);
    const cancelRef: Ref<ComponentPublicInstance | null> = ref(null);
    // The button that opened the confirmation, so focus can return to it once the confirmation closes.
    let opener: HTMLButtonElement | null = null;

    const openConfirm = (target: string, event: MouseEvent): void => {
      opener = event.currentTarget as HTMLButtonElement;
      confirming.value = target;
    };

    watch(confirming, async (value: string | null) => {
      await nextTick();

      if (value !== null) {
        (cancelRef.value?.$el as HTMLButtonElement | undefined)?.focus();

        return;
      }

      const returnTo: HTMLButtonElement | null = opener;

      if (!returnTo) {
        return;
      }

      opener = null;

      // The opener is disabled while its revoke is in flight, or gone once revoked, so fall back to the list.
      if (returnTo.isConnected && !returnTo.disabled) {
        returnTo.focus();
      } else {
        rootRef.value?.focus();
      }
    });
    const translate = (key: string, params?: Record<string, string | number>): string =>
      (props.t ?? fallbackT)(key, params);

    const formatDate = (value: string): string =>
      new Date(value).toLocaleDateString(currentLanguage.value, {dateStyle: 'medium'});
    const formatClock = (value: string): string =>
      new Date(value).toLocaleTimeString(currentLanguage.value, {timeStyle: 'short'});

    // A mobile SDK's session names no browser, so the application the user signed in to stands in for
    // it, and the device for the operating system: "Quickstart on Redmi Note 8 Pro".
    const describeDevice = (session: SSOSession, {browser, device, os}: UserAgentDescription): string => {
      const client: string | undefined = browser ?? session.participants[0]?.appName;
      const place: string | undefined = device ?? os;
      if (client && place) {
        return translate('user.sessions.device', {browser: client, os: place});
      }

      return client ?? place ?? translate('user.sessions.unknown_device');
    };

    const renderPlatformIcon = (kind: 'browser' | 'os', name?: string): VNode => {
      const {elements, size}: PlatformIcon = resolvePlatformIcon(kind, name);

      return h(
        'svg',
        {'aria-hidden': 'true', height: String(size), viewBox: '0 0 24 24', width: String(size)},
        elements.map(({tag, attributes}: PlatformIconElement) => h(tag, attributes)),
      );
    };

    const renderConfirm = (message: string, busy: boolean, onConfirm: () => void): VNode =>
      h('div', {'aria-label': message, class: cls('confirm'), role: 'group'}, [
        h('p', {class: cls('confirm-message')}, message),
        h('div', {class: cls('confirm-actions')}, [
          h(
            Button,
            {
              class: cls('cancel'),
              color: 'secondary',
              onClick: (): void => {
                confirming.value = null;
              },
              ref: cancelRef,
              size: 'small',
              variant: 'outline',
            },
            () => translate('user.sessions.cancel'),
          ),
          h(
            Button,
            {
              class: cls('confirm-revoke'),
              color: 'danger',
              disabled: busy,
              onClick: (): void => {
                confirming.value = null;
                onConfirm();
              },
              size: 'small',
              variant: 'solid',
            },
            () => translate('user.sessions.revoke'),
          ),
        ]),
      ]);

    const renderTime = (label: string, value: string): VNode =>
      h('div', {class: cls('detail')}, [
        h('dt', {class: cls('detail-label')}, label),
        h('dd', {class: `${cls('detail-value')} ${cls('detail-value', 'datetime')}`}, [
          h('span', {class: cls('detail-date')}, formatDate(value)),
          h('span', {class: cls('detail-time')}, formatClock(value)),
        ]),
      ]);

    const renderSession = (session: SSOSession, busy: boolean): VNode => {
      const deviceId = `${idPrefix}-${session.id}`;
      const userAgent: UserAgentDescription = describeUserAgent(session.userAgent);
      const device: string = describeDevice(session, userAgent);
      const ip: string | undefined = session.lastActiveIp ?? session.creationIp;

      return h(
        'li',
        {
          class: cls('session'),
          'data-current': String(session.isCurrent),
          key: session.id,
        },
        [
          h('div', {class: cls('session-header')}, [
            h('div', {class: cls('device-icon')}, [
              h('span', {class: cls('os-icon'), title: userAgent.os}, [renderPlatformIcon('os', userAgent.os)]),
              h('span', {class: cls('browser-icon'), title: userAgent.browser}, [
                renderPlatformIcon('browser', userAgent.browser),
              ]),
            ]),
            h('div', {class: cls('session-title')}, [
              h('span', {class: cls('device'), id: deviceId}, device),
              session.isCurrent ? h('span', {class: cls('current')}, translate('user.sessions.current')) : null,
            ]),
            session.isCurrent
              ? null
              : h(
                  Button,
                  {
                    'aria-describedby': deviceId,
                    'aria-expanded': String(confirming.value === session.id),
                    class: cls('revoke'),
                    color: 'secondary',
                    disabled: busy,
                    loading: props.revokingSessionId === session.id,
                    onClick: (event: MouseEvent): void => openConfirm(session.id, event),
                    size: 'small',
                    variant: 'outline',
                  },
                  () => translate('user.sessions.revoke'),
                ),
          ]),
          h('dl', {class: cls('details')}, [
            h('div', {class: cls('detail')}, [
              h('dt', {class: cls('detail-label')}, translate('user.sessions.ip')),
              h(
                'dd',
                {class: `${cls('detail-value')} ${cls('detail-value', 'ip')}`},
                ip ?? translate('user.sessions.unknown'),
              ),
            ]),
            renderTime(translate('user.sessions.signed_in'), session.authenticatedAt),
            renderTime(translate('user.sessions.last_active'), session.lastActiveAt),
          ]),
          h('div', {class: cls('apps-row')}, [
            h('span', {class: cls('apps-label')}, translate('user.sessions.applications')),
            session.participants.length > 0
              ? h(
                  'ul',
                  {class: cls('apps')},
                  session.participants.map((participant: SSOSessionParticipant) =>
                    h('li', {class: cls('app'), key: participant.appId}, participant.appName ?? participant.appId),
                  ),
                )
              : h('span', {class: cls('app')}, translate('user.sessions.unknown')),
          ]),
          confirming.value === session.id
            ? renderConfirm(translate('user.sessions.revoke.confirm', {device}), busy, (): void =>
                emit('revoke', session.id),
              )
            : null,
        ],
      );
    };

    return (): VNode => {
      const busy: boolean = props.revokingOthers || props.revokingSessionId !== null;
      const otherCount: number = props.sessions.filter((session: SSOSession) => !session.isCurrent).length;
      const total: number = props.totalCount ?? props.sessions.length;
      // The current session may be on another page, and the server keeps it when revoking the rest.
      const canRevokeOthers: boolean =
        otherCount > 0 &&
        (props.sessions.some((session: SSOSession) => session.isCurrent) || total > props.sessions.length);
      // The current session comes first; the rest keep the server's order, most recently active first.
      const orderedSessions: SSOSession[] = [...props.sessions].sort(
        (a: SSOSession, b: SSOSession) => Number(b.isCurrent) - Number(a.isCurrent),
      );
      const heading: string = props.title ?? translate('user.sessions.heading');
      // A lone session that isn't this device gets no summary, since "your only active session" would be wrong.
      let summary: string | null = null;

      if (total > 1) {
        summary = translate('user.sessions.summary', {count: total});
      } else if (props.sessions[0]?.isCurrent) {
        summary = translate('user.sessions.summary.only');
      }
      const rootClass: string = [cls(), props.cardLayout ? cls(undefined, 'card') : '', props.className]
        .filter(Boolean)
        .join(' ');

      return h('div', {'aria-busy': String(props.loading), class: rootClass, ref: rootRef, tabindex: '-1'}, [
        heading || props.sessions.length > 0
          ? h('div', {class: cls('header')}, [
              h('div', {class: cls('header-text')}, [
                heading ? h('h3', {class: cls('heading')}, heading) : null,
                summary ? h('p', {class: cls('summary')}, summary) : null,
              ]),
              canRevokeOthers
                ? h(
                    Button,
                    {
                      'aria-expanded': String(confirming.value === ALL_OTHERS),
                      class: cls('revoke-others'),
                      color: 'danger',
                      disabled: busy,
                      loading: props.revokingOthers,
                      onClick: (event: MouseEvent): void => openConfirm(ALL_OTHERS, event),
                      size: 'small',
                      variant: 'outline',
                    },
                    () => translate('user.sessions.revoke_others'),
                  )
                : null,
            ])
          : null,

        confirming.value === ALL_OTHERS
          ? renderConfirm(translate('user.sessions.revoke_others.confirm'), busy, (): void => emit('revoke-others'))
          : null,

        props.error
          ? h(Alert, {class: cls('error'), severity: 'error'}, {default: (): string[] => [props.error!]})
          : null,

        props.loading && props.sessions.length === 0
          ? h('div', {class: cls('loading')}, [h(Spinner, {size: 'medium'})])
          : null,

        !props.loading && props.sessions.length === 0 && !props.error
          ? h('p', {class: cls('empty')}, translate('user.sessions.empty'))
          : null,

        orderedSessions.length > 0
          ? h(
              'ul',
              {class: cls('list')},
              orderedSessions.map((session: SSOSession) => renderSession(session, busy)),
            )
          : null,
      ]);
    };
  },
});

export default BaseActiveSessions;
