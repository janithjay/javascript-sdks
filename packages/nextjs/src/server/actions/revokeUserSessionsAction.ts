// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

'use server';

import {ThunderIDAPIError} from '@thunderid/node';
import getSessionId from './getSessionId';
import getClient from '../getClient';

/**
 * Request from the browser. Carries no session ID, token, or URL; the session comes from the request cookie.
 */
export interface RevokeUserSessionsActionRequest {
  /**
   * Keeps the session that issued the access token, so the user stays signed in.
   */
  exceptCurrent?: boolean;
}

/**
 * What the action returns. A failure carries a message built on the server and the status, never the text of the
 * upstream reply.
 */
export type RevokeUserSessionsActionResult = {success: true} | {message: string; statusCode?: number; success: false};

/**
 * Revokes the signed-in user's SSO sessions using the signed-in user's server-held session.
 *
 * Never throws across the server action boundary; failures are mapped to a plain result. A server action is a public
 * endpoint, so `exceptCurrent` is checked here and not trusted from its TypeScript type.
 */
const revokeUserSessionsAction = async ({
  exceptCurrent,
}: RevokeUserSessionsActionRequest = {}): Promise<RevokeUserSessionsActionResult> => {
  const sessionId: string | undefined = await getSessionId();

  if (!sessionId) {
    return {message: 'Failed to revoke sessions (HTTP 401).', statusCode: 401, success: false};
  }

  if (exceptCurrent !== undefined && typeof exceptCurrent !== 'boolean') {
    return {message: 'Failed to revoke sessions (HTTP 400).', statusCode: 400, success: false};
  }

  try {
    await getClient().revokeUserSessions({exceptCurrent}, sessionId);

    return {success: true};
  } catch (error) {
    const statusCode: number | undefined = error instanceof ThunderIDAPIError ? error.statusCode : undefined;

    return statusCode === undefined
      ? {message: 'Failed to revoke sessions.', success: false}
      : {message: `Failed to revoke sessions (HTTP ${statusCode}).`, statusCode, success: false};
  }
};

export default revokeUserSessionsAction;
