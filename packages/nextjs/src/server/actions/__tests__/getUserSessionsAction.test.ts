// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ThunderIDAPIError} from '@thunderid/node';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import getClient from '../../getClient';
import getSessionId from '../getSessionId';
import getUserSessionsAction from '../getUserSessionsAction';

vi.mock('../getSessionId', () => ({default: vi.fn()}));
vi.mock('../../getClient', () => ({default: vi.fn()}));

const mockGetUserSessions = vi.fn();

const sessionsPage = {
  count: 1,
  sessions: [{id: 'sso-session-1', isCurrent: true}],
  startIndex: 1,
  totalResults: 1,
};

describe('getUserSessionsAction', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getClient).mockReturnValue({
      getUserSessions: mockGetUserSessions,
    } as unknown as ReturnType<typeof getClient>);
    vi.mocked(getSessionId).mockResolvedValue('session-1');
  });

  it('refuses without a session and never reaches the upstream API', async () => {
    vi.mocked(getSessionId).mockResolvedValue(undefined);

    const result = await getUserSessionsAction({limit: 10});

    expect(result).toEqual({message: 'Failed to load sessions (HTTP 401).', statusCode: 401, success: false});
    expect(mockGetUserSessions).not.toHaveBeenCalled();
  });

  it('loads the page with the server-resolved session', async () => {
    mockGetUserSessions.mockResolvedValue(sessionsPage);

    const result = await getUserSessionsAction({limit: 10, offset: 0});

    expect(mockGetUserSessions).toHaveBeenCalledWith({limit: 10, offset: 0}, 'session-1');
    expect(result).toEqual({page: sessionsPage, success: true});
  });

  it('does not let the caller choose the session: extra request fields are ignored', async () => {
    mockGetUserSessions.mockResolvedValue(sessionsPage);

    await getUserSessionsAction({limit: 10, sessionId: 'someone-elses-session'} as never);

    expect(mockGetUserSessions).toHaveBeenCalledWith({limit: 10, offset: undefined}, 'session-1');
  });

  it('rejects malformed paging without reaching the upstream API', async () => {
    const result = await getUserSessionsAction({limit: -1} as never);

    expect(result).toEqual({message: 'Failed to load sessions (HTTP 400).', statusCode: 400, success: false});
    expect(mockGetUserSessions).not.toHaveBeenCalled();
  });

  it("carries a ThunderIDAPIError's status across the boundary instead of throwing", async () => {
    mockGetUserSessions.mockRejectedValue(
      new ThunderIDAPIError('Insufficient permissions', 'getMeSessions-ForbiddenError-001', 'javascript', 403),
    );

    const result = await getUserSessionsAction();

    expect(result).toEqual({message: 'Failed to load sessions (HTTP 403).', statusCode: 403, success: false});
  });

  it('does not leak the text of an unexpected error', async () => {
    mockGetUserSessions.mockRejectedValue(new Error('connect ECONNREFUSED 10.0.0.5:8090'));

    const result = await getUserSessionsAction();

    expect(result).toEqual({message: 'Failed to load sessions.', success: false});
  });
});
