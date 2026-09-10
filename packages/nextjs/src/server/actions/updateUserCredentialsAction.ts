// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

'use server';

import {ThunderIDAPIError, UpdateMeCredentialsConfig} from '@thunderid/node';
import getClient from '../getClient';

/**
 * Server action that changes one or more of the signed-in user's credentials via
 * `POST /users/me/update-credentials`.
 *
 * `status` carries the upstream HTTP status on failure (403 for a rejected current value,
 * 400 for a malformed request) so the caller can attach the error to the right field.
 */
const updateUserCredentialsAction = async (
  payload: UpdateMeCredentialsConfig,
  sessionId?: string,
): Promise<{error: string; status: number; success: boolean}> => {
  try {
    const client = getClient();
    await client.updateUserCredentials(payload, sessionId);
    return {error: '', status: 204, success: true};
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      status: error instanceof ThunderIDAPIError ? (error.statusCode ?? 0) : 0,
      success: false,
    };
  }
};

export default updateUserCredentialsAction;
