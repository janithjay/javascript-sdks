// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, it, expect, vi, type Mock} from 'vitest';
import {ApiFetcher} from '../../models/api';
import {SSOSessionListResponse} from '../../models/sso-session';
import getMeSessions from '../sessions/getMeSessions';
import revokeMeSession from '../sessions/revokeMeSession';
import revokeMeSessions from '../sessions/revokeMeSessions';

type FetcherMock = Mock<ApiFetcher>;
type Run = (fetcher: ApiFetcher) => Promise<unknown>;

const baseUrl = 'https://localhost:8090';

const createFetcher = (body: unknown = {}, status = 200): FetcherMock =>
  vi.fn<ApiFetcher>().mockResolvedValue({
    json: () => Promise.resolve(body),
    ok: status < 400,
    status,
    statusText: 'OK',
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response);

const sentRequest = (fetcher: FetcherMock): {method: string | undefined; url: string} => {
  const [url, init] = fetcher.mock.calls[0];

  return {method: init.method, url};
};

describe('self-service sessions API', () => {
  it.each<[string, Run, string, string]>([
    ['getMeSessions', (fetcher: ApiFetcher) => getMeSessions({baseUrl, fetcher}), 'GET', `${baseUrl}/sessions/me`],
    [
      'getMeSessions with paging',
      (fetcher: ApiFetcher) => getMeSessions({baseUrl, fetcher, limit: 5, offset: 10}),
      'GET',
      `${baseUrl}/sessions/me?limit=5&offset=10`,
    ],
    [
      'revokeMeSession',
      (fetcher: ApiFetcher) => revokeMeSession({baseUrl, fetcher, sessionId: 'sess/1'}),
      'DELETE',
      `${baseUrl}/sessions/me/sess%2F1`,
    ],
    [
      'revokeMeSessions',
      (fetcher: ApiFetcher) => revokeMeSessions({baseUrl, fetcher}),
      'DELETE',
      `${baseUrl}/sessions/me`,
    ],
    [
      'revokeMeSessions keeping the current session',
      (fetcher: ApiFetcher) => revokeMeSessions({baseUrl, exceptCurrent: true, fetcher}),
      'DELETE',
      `${baseUrl}/sessions/me?exceptCurrent=true`,
    ],
    [
      'getMeSessions with a url override',
      (fetcher: ApiFetcher) => getMeSessions({baseUrl, fetcher, url: 'https://rs.example.com/sessions/me'}),
      'GET',
      'https://rs.example.com/sessions/me',
    ],
  ])('%s sends the expected request', async (_name: string, run: Run, method: string, url: string) => {
    const fetcher: FetcherMock = createFetcher();

    await run(fetcher);

    expect(sentRequest(fetcher)).toEqual({method, url});
  });

  it('returns the page of sessions', async () => {
    const page: SSOSessionListResponse = {
      count: 1,
      sessions: [
        {
          authenticatedAt: '2026-10-14T09:00:00Z',
          createdAt: '2026-10-14T09:00:00Z',
          id: 'sess-1',
          isCurrent: true,
          lastActiveAt: '2026-10-14T09:05:00Z',
          participants: [{appId: 'app-1', firstJoinedAt: '2026-10-14T09:00:00Z', lastActiveAt: '2026-10-14T09:05:00Z'}],
          userId: 'user-1',
        },
      ],
      startIndex: 1,
      totalResults: 1,
    };

    await expect(getMeSessions({baseUrl, fetcher: createFetcher(page)})).resolves.toEqual(page);
  });

  it('resolves with nothing once a session is revoked', async () => {
    await expect(
      revokeMeSession({baseUrl, fetcher: createFetcher(undefined, 204), sessionId: 'sess-1'}),
    ).resolves.toBeUndefined();
  });

  it('reports a session the caller does not have as not found', async () => {
    const fetcher: FetcherMock = createFetcher({code: 'SSM-1007'}, 404);

    await expect(revokeMeSession({baseUrl, fetcher, sessionId: 'sess-1'})).rejects.toMatchObject({
      code: 'revokeMeSession-NotFoundError-001',
      statusCode: 404,
    });
  });

  it('rejects keeping the current session when the access token identifies none', async () => {
    const fetcher: FetcherMock = createFetcher(
      {
        code: 'SSM-1006',
        message: {defaultValue: 'Current session unknown', key: 'error.sessionmgt.current_session_unknown'},
      },
      400,
    );

    await expect(revokeMeSessions({baseUrl, exceptCurrent: true, fetcher})).rejects.toMatchObject({
      code: 'revokeMeSessions-ResponseError-001',
      message: 'Failed to revoke sessions: Current session unknown',
      statusCode: 400,
    });
  });

  it('rejects an empty session ID before any request', async () => {
    const fetcher: FetcherMock = createFetcher();

    await expect(revokeMeSession({baseUrl, fetcher, sessionId: ' '})).rejects.toMatchObject({
      code: 'revokeMeSession-ValidationError-002',
    });
    expect(fetcher).not.toHaveBeenCalled();
  });
});
