// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {afterEach, describe, expect, it, vi} from 'vitest';
import getMeSessions from '../../api/getMeSessions';
import revokeMeSession from '../../api/revokeMeSession';
import revokeMeSessions from '../../api/revokeMeSessions';

// The httpClient adapter is covered in @thunderid/browser's createHttpClientFetcher tests.
// This file covers the wrappers: plumbing that adapter into the core session calls as the default fetcher.
const mockFetcher = vi.fn();

vi.mock('@thunderid/browser', async () => {
  const actual = await vi.importActual<typeof import('@thunderid/browser')>('@thunderid/browser');
  return {
    ...actual,
    createHttpClientFetcher: () => mockFetcher,
  };
});

const okResponse = (body: unknown, status = 200): Response =>
  ({
    json: () => Promise.resolve(body),
    ok: true,
    status,
    statusText: 'OK',
    text: () => Promise.resolve(''),
  }) as unknown as Response;

describe('session wrappers (vue)', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("resolves a page of the user's sessions using the default fetcher", async () => {
    mockFetcher.mockResolvedValueOnce(okResponse({count: 1, sessions: [{id: 's1'}], startIndex: 1, totalResults: 1}));

    const page = await getMeSessions({baseUrl: 'https://localhost:8090', limit: 10});

    expect(page.sessions).toHaveLength(1);
    expect(mockFetcher).toHaveBeenCalledWith(
      expect.stringContaining('/users/me/sessions?limit=10'),
      expect.objectContaining({method: 'GET'}),
    );
  });

  it('revokes one session and every other session using the default fetcher', async () => {
    mockFetcher.mockResolvedValue(okResponse(undefined, 204));

    await revokeMeSession({baseUrl: 'https://localhost:8090', sessionId: 's1'});
    await revokeMeSessions({baseUrl: 'https://localhost:8090', exceptCurrent: true});

    expect(mockFetcher).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/users/me/sessions/s1'),
      expect.objectContaining({method: 'DELETE'}),
    );
    expect(mockFetcher).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/users/me/sessions?exceptCurrent=true'),
      expect.objectContaining({method: 'DELETE'}),
    );
  });

  it('uses a caller-supplied fetcher instead of the default when provided', async () => {
    const customFetcher = vi.fn().mockResolvedValue(okResponse(undefined, 204));

    await revokeMeSessions({baseUrl: 'https://localhost:8090', fetcher: customFetcher});

    expect(customFetcher).toHaveBeenCalled();
    expect(mockFetcher).not.toHaveBeenCalled();
  });
});
