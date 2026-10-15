// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {ApiFetcher, SSOSessionListResponse} from '@thunderid/browser';
import {afterEach, describe, expect, it, vi, type Mock} from 'vitest';
import I18nProvider from '../../../../contexts/I18n/I18nProvider';
import ThemeProvider from '../../../../contexts/Theme/ThemeProvider';
import ThunderIDContext, {ThunderIDContextProps} from '../../../../contexts/ThunderID/ThunderIDContext';
import createResourceInvalidator from '../../../../utils/createResourceInvalidator';
import ActiveSessions from '../ActiveSessions';

type FetcherMock = Mock<ApiFetcher>;

const baseUrl = 'https://localhost:8090';

const page: SSOSessionListResponse = {
  count: 2,
  sessions: [
    {
      authenticatedAt: '2026-10-14T09:00:00Z',
      createdAt: '2026-10-14T09:00:00Z',
      id: 'sess-current',
      isCurrent: true,
      lastActiveAt: '2026-10-14T09:05:00Z',
      lastActiveIp: '203.0.113.7',
      participants: [{appId: 'app-1', appName: 'Store', firstJoinedAt: '2026-10-14T09:00:00Z', lastActiveAt: ''}],
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/129.0.0.0 Safari/537.36',
      userId: 'user-1',
    },
    {
      authenticatedAt: '2026-10-13T09:00:00Z',
      createdAt: '2026-10-13T09:00:00Z',
      id: 'sess-other',
      isCurrent: false,
      lastActiveAt: '2026-10-13T09:05:00Z',
      participants: [{appId: 'app-2', firstJoinedAt: '2026-10-13T09:00:00Z', lastActiveAt: ''}],
      userAgent: 'Mozilla/5.0 (Android 14; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0',
      userId: 'user-1',
    },
  ],
  startIndex: 1,
  totalResults: 2,
};

const response = (body: unknown, status = 200): Response =>
  ({
    json: () => Promise.resolve(body),
    ok: status < 400,
    status,
    statusText: 'OK',
    text: () => Promise.resolve(body === undefined ? '' : JSON.stringify(body)),
  }) as Response;

// Answers the list request with `list`, and every DELETE with `revokeStatus`.
const createFetcher = (list: SSOSessionListResponse | null = page, revokeStatus = 204): FetcherMock =>
  vi.fn<ApiFetcher>().mockImplementation((_url: string, init: RequestInit) => {
    if (init.method === 'DELETE') {
      return Promise.resolve(response(revokeStatus < 400 ? undefined : {code: 'SSM-1007'}, revokeStatus));
    }

    return Promise.resolve(list ? response(list) : response({code: 'SSM-5000'}, 500));
  });

const renderActiveSessions = (fetcher: ApiFetcher): void => {
  const value = {
    baseUrl,
    http: {fetcher},
    instanceId: 0,
    invalidator: createResourceInvalidator(),
  } as unknown as ThunderIDContextProps;

  render(
    <ThunderIDContext.Provider value={value}>
      <I18nProvider>
        <ThemeProvider>
          <ActiveSessions />
        </ThemeProvider>
      </I18nProvider>
    </ThunderIDContext.Provider>,
  );
};

const confirmRevoke = (): void => {
  fireEvent.click(document.querySelector<HTMLButtonElement>('.thunderid-active-sessions__confirm-revoke')!);
};

const requests = (fetcher: FetcherMock): string[] =>
  fetcher.mock.calls.map(([url, init]: [string, RequestInit]) => `${init.method} ${url}`);

describe('ActiveSessions', () => {
  afterEach(() => {
    cleanup();
  });

  it('lists each session with its device and applications, and marks the current one', async () => {
    renderActiveSessions(createFetcher());

    expect(await screen.findByText('Chrome on macOS')).toBeTruthy();
    expect(screen.getByText('Firefox on Android')).toBeTruthy();
    expect(screen.getByText('This device')).toBeTruthy();
    expect(screen.getByText('Active sessions')).toBeTruthy();
    expect(screen.getByText('2 active sessions · revoke any you don’t recognize')).toBeTruthy();
    expect(screen.getByText('Store')).toBeTruthy();
    expect(screen.getByText('app-2')).toBeTruthy();
  });

  it('shows the IP address and when the session signed in and was last active', async () => {
    renderActiveSessions(createFetcher());

    await screen.findByText('Chrome on macOS');

    expect(screen.getByText('203.0.113.7')).toBeTruthy();
    expect(screen.getByText('Unknown')).toBeTruthy();
    expect(screen.getAllByText('Signed in')).toHaveLength(2);
    expect(screen.getAllByText('Last active')).toHaveLength(2);
    expect(
      screen.getAllByText(new Date('2026-10-14T09:05:00Z').toLocaleDateString('en-US', {dateStyle: 'medium'})).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(new Date('2026-10-14T09:05:00Z').toLocaleTimeString('en-US', {timeStyle: 'short'})),
    ).toHaveLength(2);
  });

  it('draws a browser and an operating system icon for each session', async () => {
    renderActiveSessions(createFetcher());

    await screen.findByText('Chrome on macOS');

    expect(screen.getByTitle('Chrome').querySelector('svg')).toBeTruthy();
    expect(screen.getByTitle('macOS').querySelector('svg')).toBeTruthy();
    expect(screen.getByTitle('Android').querySelector('svg')).toBeTruthy();
  });

  it('lists the current session first', async () => {
    renderActiveSessions(createFetcher({...page, sessions: [...page.sessions].reverse()}));

    await screen.findByText('Chrome on macOS');

    expect(document.querySelector('[data-current]')?.getAttribute('data-current')).toBe('true');
  });

  it('offers revoke only for sessions other than the current one', async () => {
    renderActiveSessions(createFetcher());

    await screen.findByText('Chrome on macOS');

    expect(screen.getAllByRole('button', {name: 'Revoke'})).toHaveLength(1);
  });

  it('asks for confirmation before revoking a session', async () => {
    const fetcher: FetcherMock = createFetcher();
    renderActiveSessions(fetcher);

    fireEvent.click(await screen.findByRole('button', {name: 'Revoke'}));

    expect(screen.getByText('Revoke the session on Firefox on Android?')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', {name: 'Cancel'}));

    expect(screen.queryByText('Revoke the session on Firefox on Android?')).toBeNull();
    expect(requests(fetcher)).toEqual([`GET ${baseUrl}/sessions/me`]);
  });

  it('revokes a session once confirmed, then reloads the list', async () => {
    const fetcher: FetcherMock = createFetcher();
    renderActiveSessions(fetcher);

    fireEvent.click(await screen.findByRole('button', {name: 'Revoke'}));
    confirmRevoke();

    await waitFor(() =>
      expect(requests(fetcher)).toEqual([
        `GET ${baseUrl}/sessions/me`,
        `DELETE ${baseUrl}/sessions/me/sess-other`,
        `GET ${baseUrl}/sessions/me`,
      ]),
    );
  });

  it('revokes every session except the current one', async () => {
    const fetcher: FetcherMock = createFetcher();
    renderActiveSessions(fetcher);

    fireEvent.click(await screen.findByRole('button', {name: 'Revoke all others'}));

    expect(screen.getByText('Revoke all other sessions? You’ll stay signed in here.')).toBeTruthy();

    confirmRevoke();

    await waitFor(() => expect(requests(fetcher)).toContain(`DELETE ${baseUrl}/sessions/me?exceptCurrent=true`));
  });

  it('hides revoking other sessions when no session is the current one', async () => {
    renderActiveSessions(createFetcher({...page, sessions: page.sessions.map((s) => ({...s, isCurrent: false}))}));

    await screen.findByText('Chrome on macOS');

    expect(screen.queryByRole('button', {name: 'Revoke all others'})).toBeNull();
  });

  it('shows an error when the sessions fail to load', async () => {
    renderActiveSessions(createFetcher(null));

    expect(await screen.findByText('An error occurred while loading your sessions. Please try again.')).toBeTruthy();
  });

  it('shows an error when revoking a session fails', async () => {
    renderActiveSessions(createFetcher(page, 500));

    fireEvent.click(await screen.findByRole('button', {name: 'Revoke'}));
    confirmRevoke();

    expect(await screen.findByText('An error occurred while revoking the session. Please try again.')).toBeTruthy();
  });

  it('says so when the user has no sessions', async () => {
    renderActiveSessions(createFetcher({...page, count: 0, sessions: [], totalResults: 0}));

    expect(await screen.findByText('No active sessions.')).toBeTruthy();
  });

  it('reloads the list without an error when the session is already gone', async () => {
    const fetcher: FetcherMock = createFetcher(page, 404);
    renderActiveSessions(fetcher);

    fireEvent.click(await screen.findByRole('button', {name: 'Revoke'}));
    confirmRevoke();

    await waitFor(() =>
      expect(requests(fetcher)).toEqual([
        `GET ${baseUrl}/sessions/me`,
        `DELETE ${baseUrl}/sessions/me/sess-other`,
        `GET ${baseUrl}/sessions/me`,
      ]),
    );
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('shows an error when revoking every other session fails', async () => {
    renderActiveSessions(createFetcher(page, 500));

    fireEvent.click(await screen.findByRole('button', {name: 'Revoke all others'}));
    confirmRevoke();

    expect(await screen.findByText('An error occurred while revoking the session. Please try again.')).toBeTruthy();
  });

  it('falls back when a session records no device, IP address or applications', async () => {
    const bare = {...page.sessions[1], lastActiveIp: undefined, participants: [], userAgent: undefined};
    renderActiveSessions(createFetcher({...page, sessions: [page.sessions[0], bare]}));

    expect(await screen.findByText('Unknown device')).toBeTruthy();
    expect(screen.getAllByText('Unknown')).toHaveLength(2);
  });
});
