// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {SSOSessionListResponse} from '@thunderid/browser';
import {BaseActiveSessions, useI18n} from '@thunderid/vue';
import {type Component, type Ref, type VNode, defineComponent, h, onMounted, ref, watch} from 'vue';
import NuxtAPIRoutes from '../../constants/NuxtAPIRoutes';
import type {ThunderIDGetUserSessionsResult, ThunderIDRevokeUserSessionsResult} from '../../types';

type ActiveSessionsProps = Readonly<{
  cardLayout: boolean;
  className: string;
  limit?: number;
  title?: string;
}>;

/**
 * Nuxt-specific ActiveSessions container.
 *
 * Delegates rendering to {@link BaseActiveSessions} from `@thunderid/vue`, and loads and revokes through
 * `NuxtAPIRoutes.USER_SESSIONS` rather than calling the ThunderID server directly from the browser, the same as
 * `ChangeCredential` does for `NuxtAPIRoutes.USER_CREDENTIALS`. The routes use the signed-in user's server-held
 * session, so the access token never reaches the browser.
 *
 * Preserves the same prop API as the Vue SDK's `ActiveSessions` component so consumers don't need to change their
 * templates.
 *
 * @example
 * ```vue
 * <ActiveSessions />
 * ```
 */
const ActiveSessions: Component = defineComponent({
  name: 'ActiveSessions',
  props: {
    /** Whether to wrap the list in a bordered card. Set to `false` to render it without one. */
    cardLayout: {default: true, type: Boolean},
    /** Extra CSS class added to the root element. */
    className: {default: '', type: String},
    /**
     * The most sessions to list, from 1 to 100. Defaults to the server's page size. Only this first page
     * is listed; sessions beyond it can still be revoked with Revoke all others.
     */
    limit: {default: undefined, type: Number},
    /** Overrides the default "Active sessions" heading. Pass an empty string to omit it. */
    title: {default: undefined, type: String},
  },
  setup(props: ActiveSessionsProps): () => VNode {
    const {t} = useI18n();

    const page: Ref<SSOSessionListResponse | undefined> = ref(undefined);
    const loading: Ref<boolean> = ref(true);
    const error: Ref<string | null> = ref(null);
    const revokingSessionId: Ref<string | null> = ref(null);
    const revokingOthers: Ref<boolean> = ref(false);

    async function load(): Promise<void> {
      loading.value = true;
      error.value = null;

      try {
        const result: ThunderIDGetUserSessionsResult = await $fetch(NuxtAPIRoutes.USER_SESSIONS, {
          query: {limit: props.limit},
        });

        if (result.success) {
          page.value = result.page;
        } else {
          error.value = t('user.sessions.load.error');
        }
      } catch {
        // The Nitro route itself failed to respond (network error, session expired outright).
        error.value = t('user.sessions.load.error');
      } finally {
        loading.value = false;
      }
    }

    async function revoke(request: () => Promise<ThunderIDRevokeUserSessionsResult>): Promise<void> {
      error.value = null;

      try {
        const result: ThunderIDRevokeUserSessionsResult = await request();

        // A 404 means the session is already gone, revoked elsewhere or expired, so refresh the list instead.
        if (result.success || result.statusCode === 404) {
          await load();

          return;
        }
      } catch {
        // The Nitro route itself failed to respond; reported below like any other failed revoke.
      }

      error.value = t('user.sessions.revoke.error');
    }

    async function handleRevoke(sessionId: string): Promise<void> {
      revokingSessionId.value = sessionId;
      await revoke(() => $fetch(`${NuxtAPIRoutes.USER_SESSIONS}/${encodeURIComponent(sessionId)}`, {method: 'DELETE'}));
      revokingSessionId.value = null;
    }

    async function handleRevokeOthers(): Promise<void> {
      revokingOthers.value = true;
      await revoke(() => $fetch(NuxtAPIRoutes.USER_SESSIONS, {method: 'DELETE', query: {exceptCurrent: 'true'}}));
      revokingOthers.value = false;
    }

    onMounted(load);
    watch(() => props.limit, load);

    return (): VNode =>
      h(BaseActiveSessions, {
        cardLayout: props.cardLayout,
        className: props.className,
        error: error.value,
        loading: loading.value,
        onRevoke: handleRevoke,
        onRevokeOthers: handleRevokeOthers,
        revokingOthers: revokingOthers.value,
        revokingSessionId: revokingSessionId.value,
        sessions: page.value?.sessions,
        t,
        title: props.title,
        totalCount: page.value?.totalResults,
      });
  },
});

export default ActiveSessions;
