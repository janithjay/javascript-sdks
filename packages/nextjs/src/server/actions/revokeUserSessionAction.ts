// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

'use server';

import {ThunderIDAPIError} from '@thunderid/node';
import getSessionId from './getSessionId';
import getClient from '../getClient';

/**
 * What the action returns. A failure carries a message built on the server and the status, never the text of the
 * upstream reply. `statusCode` 404 means the session is already gone.
 */
export type RevokeUserSessionActionResult = {success: true} | {message: string; statusCode?: number; success: false};

/**
 * Revokes one of the signed-in user's SSO sessions using the signed-in user's server-held session.
 *
 * Never throws across the server action boundary; failures are mapped to a plain result. The session to revoke is
 * checked here, since a server action is a public endpoint. Which sessions the caller may revoke is the ThunderID
 * server's decision: it only revokes sessions of the user the access token belongs to.
 */
const revokeUserSessionAction = async (ssoSessionId: string): Promise<RevokeUserSessionActionResult> => {
  const sessionId: string | undefined = await getSessionId();

  if (!sessionId) {
    return {message: 'Failed to revoke the session (HTTP 401).', statusCode: 401, success: false};
  }

  if (typeof ssoSessionId !== 'string' || ssoSessionId.trim() === '') {
    return {message: 'Failed to revoke the session (HTTP 400).', statusCode: 400, success: false};
  }

  try {
    await getClient().revokeUserSession(ssoSessionId, sessionId);

    return {success: true};
  } catch (error) {
    const statusCode: number | undefined = error instanceof ThunderIDAPIError ? error.statusCode : undefined;

    return statusCode === undefined
      ? {message: 'Failed to revoke the session.', success: false}
      : {message: `Failed to revoke the session (HTTP ${statusCode}).`, statusCode, success: false};
  }
};

export default revokeUserSessionAction;
