// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ThunderIDAPIError} from '@thunderid/node';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import getClient from '../../getClient';
import getSessionId from '../getSessionId';
import revokeUserSessionsAction from '../revokeUserSessionsAction';

vi.mock('../getSessionId', () => ({default: vi.fn()}));
vi.mock('../../getClient', () => ({default: vi.fn()}));

const mockRevokeUserSessions = vi.fn();

describe('revokeUserSessionsAction', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getClient).mockReturnValue({
      revokeUserSessions: mockRevokeUserSessions,
    } as unknown as ReturnType<typeof getClient>);
    vi.mocked(getSessionId).mockResolvedValue('session-1');
  });

  it('refuses without a session and never reaches the upstream API', async () => {
    vi.mocked(getSessionId).mockResolvedValue(undefined);

    const result = await revokeUserSessionsAction({exceptCurrent: true});

    expect(result).toEqual({message: 'Failed to revoke sessions (HTTP 401).', statusCode: 401, success: false});
    expect(mockRevokeUserSessions).not.toHaveBeenCalled();
  });

  it('revokes the other sessions with the server-resolved session', async () => {
    mockRevokeUserSessions.mockResolvedValue(undefined);

    const result = await revokeUserSessionsAction({exceptCurrent: true});

    expect(mockRevokeUserSessions).toHaveBeenCalledWith({exceptCurrent: true}, 'session-1');
    expect(result).toEqual({success: true});
  });

  it('rejects an exceptCurrent that is not a boolean without reaching the upstream API', async () => {
    const result = await revokeUserSessionsAction({exceptCurrent: 'true'} as never);

    expect(result).toEqual({message: 'Failed to revoke sessions (HTTP 400).', statusCode: 400, success: false});
    expect(mockRevokeUserSessions).not.toHaveBeenCalled();
  });

  it("carries a ThunderIDAPIError's status across the boundary instead of throwing", async () => {
    mockRevokeUserSessions.mockRejectedValue(
      new ThunderIDAPIError('Bad request', 'revokeMeSessions-BadRequestError-001', 'javascript', 400),
    );

    const result = await revokeUserSessionsAction({exceptCurrent: true});

    expect(result).toEqual({message: 'Failed to revoke sessions (HTTP 400).', statusCode: 400, success: false});
  });

  it('does not leak the text of an unexpected error', async () => {
    mockRevokeUserSessions.mockRejectedValue(new Error('connect ECONNREFUSED 10.0.0.5:8090'));

    const result = await revokeUserSessionsAction({exceptCurrent: true});

    expect(result).toEqual({message: 'Failed to revoke sessions.', success: false});
  });
});
