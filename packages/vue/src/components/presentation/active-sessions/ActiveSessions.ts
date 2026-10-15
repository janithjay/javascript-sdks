// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {SSOSession, SSOSessionListResponse, ThunderIDAPIError, resolveResourceEndpoint} from '@thunderid/browser';
import {type Component, type Ref, type VNode, defineComponent, h, onMounted, ref, watch} from 'vue';
import BaseActiveSessions from './BaseActiveSessions';
import getMeSessions from '../../../api/getMeSessions';
import revokeMeSession from '../../../api/revokeMeSession';
import revokeMeSessions from '../../../api/revokeMeSessions';
import useI18n from '../../../composables/useI18n';
import useThunderID from '../../../composables/useThunderID';

type ActiveSessionsProps = Readonly<{
  cardLayout: boolean;
  className: string;
  limit?: number;
  title?: string;
}>;

/**
 * ActiveSessions lists the signed-in user's live SSO sessions from `GET /users/me/sessions`, and lets the
 * user revoke any session other than the current one, or all of them at once. Revoking a session
 * signs it out and revokes the tokens its applications were issued.
 *
 * The current session has no Revoke action here, since ending it would also end the access token
 * the component is using. Use the regular sign-out for that.
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
    const {baseUrl, endpoints, instanceId} = useThunderID();
    const {t} = useI18n();
    const request = {baseUrl, instanceId, url: resolveResourceEndpoint('usersMeSessions', {endpoints})};

    const sessions: Ref<SSOSession[]> = ref([]);
    const totalCount: Ref<number | undefined> = ref(undefined);
    const loading: Ref<boolean> = ref(true);
    const error: Ref<string | null> = ref(null);
    const revokingSessionId: Ref<string | null> = ref(null);
    const revokingOthers: Ref<boolean> = ref(false);

    async function load(): Promise<void> {
      loading.value = true;
      error.value = null;

      try {
        const page: SSOSessionListResponse = await getMeSessions({...request, limit: props.limit});

        sessions.value = page.sessions;
        totalCount.value = page.totalResults;
      } catch {
        error.value = t('user.sessions.load.error');
      } finally {
        loading.value = false;
      }
    }

    async function revoke(run: () => Promise<void>): Promise<void> {
      error.value = null;

      try {
        await run();
        await load();
      } catch (revokeFailure: unknown) {
        // A 404 means the session is already gone, revoked elsewhere or expired, so refresh the list instead.
        if (revokeFailure instanceof ThunderIDAPIError && revokeFailure.statusCode === 404) {
          await load();

          return;
        }

        error.value = t('user.sessions.revoke.error');
      }
    }

    async function handleRevoke(sessionId: string): Promise<void> {
      revokingSessionId.value = sessionId;
      await revoke(() => revokeMeSession({...request, sessionId}));
      revokingSessionId.value = null;
    }

    async function handleRevokeOthers(): Promise<void> {
      revokingOthers.value = true;
      await revoke(() => revokeMeSessions({...request, exceptCurrent: true}));
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
        sessions: sessions.value,
        t,
        title: props.title,
        totalCount: totalCount.value,
      });
  },
});

export default ActiveSessions;
