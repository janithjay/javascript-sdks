// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

'use server';

import {mapSelectPageError, parseSelectPageQuery} from '@thunderid/node';
import type {SSOSessionListResponse, SelectPageErrorResult, SelectPageQueryResult} from '@thunderid/node';
import getSessionId from './getSessionId';
import getClient from '../getClient';

/**
 * Request from the browser. Carries no session ID, token, or URL; the session comes from the request cookie.
 */
export interface GetUserSessionsActionRequest {
  limit?: number;
  offset?: number;
}

export type GetUserSessionsActionResult =
  | {page: SSOSessionListResponse; success: true}
  | ({success: false} & SelectPageErrorResult);

/**
 * Loads one page of the signed-in user's SSO sessions using the signed-in user's server-held session.
 *
 * Never throws across the server action boundary; failures are mapped to a plain result. A server action is a public
 * endpoint, so the paging values the caller sends are checked here and not trusted from their TypeScript types.
 */
const getUserSessionsAction = async ({
  limit,
  offset,
}: GetUserSessionsActionRequest = {}): Promise<GetUserSessionsActionResult> => {
  const sessionId: string | undefined = await getSessionId();

  if (!sessionId) {
    return {message: 'Failed to load sessions (HTTP 401).', statusCode: 401, success: false};
  }

  const checked: SelectPageQueryResult = parseSelectPageQuery({limit, offset});

  if (checked.invalid !== undefined) {
    return {message: 'Failed to load sessions (HTTP 400).', statusCode: 400, success: false};
  }

  try {
    const page: SSOSessionListResponse = await getClient().getUserSessions(
      {limit: checked.query.limit, offset: checked.query.offset},
      sessionId,
    );

    return {page, success: true};
  } catch (error) {
    return {...mapSelectPageError(error, 'sessions'), success: false};
  }
};

export default getUserSessionsAction;
