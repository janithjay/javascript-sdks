// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ThunderIDAPIError} from '@thunderid/node';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import getClient from '../../getClient';
import getSessionId from '../getSessionId';
import revokeUserSessionAction from '../revokeUserSessionAction';

vi.mock('../getSessionId', () => ({default: vi.fn()}));
vi.mock('../../getClient', () => ({default: vi.fn()}));

const mockRevokeUserSession = vi.fn();

describe('revokeUserSessionAction', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getClient).mockReturnValue({
      revokeUserSession: mockRevokeUserSession,
    } as unknown as ReturnType<typeof getClient>);
    vi.mocked(getSessionId).mockResolvedValue('session-1');
  });

  it('refuses without a session and never reaches the upstream API', async () => {
    vi.mocked(getSessionId).mockResolvedValue(undefined);

    const result = await revokeUserSessionAction('sso-session-1');

    expect(result).toEqual({message: 'Failed to revoke the session (HTTP 401).', statusCode: 401, success: false});
    expect(mockRevokeUserSession).not.toHaveBeenCalled();
  });

  it('revokes the session with the server-resolved session', async () => {
    mockRevokeUserSession.mockResolvedValue(undefined);

    const result = await revokeUserSessionAction('sso-session-1');

    expect(mockRevokeUserSession).toHaveBeenCalledWith('sso-session-1', 'session-1');
    expect(result).toEqual({success: true});
  });

  it.each([[''], ['  '], [42], [undefined]])(
    'rejects a session identifier of %j without reaching the upstream API',
    async (ssoSessionId: unknown) => {
      const result = await revokeUserSessionAction(ssoSessionId as never);

      expect(result).toEqual({message: 'Failed to revoke the session (HTTP 400).', statusCode: 400, success: false});
      expect(mockRevokeUserSession).not.toHaveBeenCalled();
    },
  );

  it('carries a 404 across the boundary so the caller can tell the session is already gone', async () => {
    mockRevokeUserSession.mockRejectedValue(
      new ThunderIDAPIError('Session not found', 'revokeMeSession-NotFoundError-001', 'javascript', 404),
    );

    const result = await revokeUserSessionAction('sso-session-1');

    expect(result).toEqual({message: 'Failed to revoke the session (HTTP 404).', statusCode: 404, success: false});
  });

  it('does not leak the text of an unexpected error', async () => {
    mockRevokeUserSession.mockRejectedValue(new Error('connect ECONNREFUSED 10.0.0.5:8090'));

    const result = await revokeUserSessionAction('sso-session-1');

    expect(result).toEqual({message: 'Failed to revoke the session.', success: false});
  });
});
