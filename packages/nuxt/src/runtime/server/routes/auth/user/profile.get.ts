// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {AttributeSchema, UserProfile} from '@thunderid/node';
import {defineEventHandler, createError} from 'h3';
import type {H3Event} from 'h3';
import ThunderIDNuxtClient from '../../../ThunderIDNuxtClient';
import {verifyAndRehydrateSession} from '../../../utils/serverSession';
import {useRuntimeConfig} from '#imports';

/**
 * GET /api/auth/user/profile
 *
 * Returns the full {@link UserProfile} (with `flattenedProfile`) plus the `users/me/meta`
 * attribute schema for the authenticated user. Used by `ThunderIDRoot.revalidateProfile` to
 * refresh client-side state — both after a profile update, and to self-heal cases where the
 * SSR-seeded state was empty.
 *
 * Mirrors `getUserProfileAction` in the Next.js SDK.
 */
export default defineEventHandler(
  async (event: H3Event): Promise<UserProfile & {userSchema: Record<string, AttributeSchema> | null}> => {
    const config: ReturnType<typeof useRuntimeConfig> = useRuntimeConfig();
    const sessionSecret: string | undefined = config.thunderid?.sessionSecret;

    const session: Awaited<ReturnType<typeof verifyAndRehydrateSession>> = await verifyAndRehydrateSession(
      event,
      sessionSecret,
    );
    if (!session) {
      throw createError({statusCode: 401, statusMessage: 'Unauthorized: Invalid or expired session.'});
    }

    const client: ThunderIDNuxtClient = ThunderIDNuxtClient.getInstance();

    let userProfile: UserProfile;
    try {
      userProfile = await client.getUserProfile(session.sessionId);
    } catch (err) {
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to retrieve user profile: ${err instanceof Error ? err.message : String(err)}`,
      });
    }

    // Schema fetch failures shouldn't fail the whole response — the profile itself is still
    // useful without it, same resilience the SSR plugin applies to this same pair of calls.
    let userSchema: Record<string, AttributeSchema> | null = null;
    try {
      userSchema = await client.getUserSchema(session.sessionId);
    } catch {
      userSchema = null;
    }

    return {...userProfile, userSchema};
  },
);
