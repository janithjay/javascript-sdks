// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {cleanup, fireEvent, render, screen} from '@testing-library/react';
import {SSOSession} from '@thunderid/browser';
import {afterEach, describe, expect, it, vi} from 'vitest';
import I18nProvider from '../../../../contexts/I18n/I18nProvider';
import ThemeProvider from '../../../../contexts/Theme/ThemeProvider';
import BaseActiveSessions from '../BaseActiveSessions';

const sessions: SSOSession[] = [
  {
    authenticatedAt: '2026-10-14T09:00:00Z',
    createdAt: '2026-10-14T09:00:00Z',
    id: 'sess-current',
    isCurrent: true,
    lastActiveAt: '2026-10-14T09:05:00Z',
    participants: [],
    userId: 'user-1',
  },
  {
    authenticatedAt: '2026-10-13T09:00:00Z',
    createdAt: '2026-10-13T09:00:00Z',
    id: 'sess-other',
    isCurrent: false,
    lastActiveAt: '2026-10-13T09:05:00Z',
    participants: [],
    userId: 'user-1',
  },
];

describe('BaseActiveSessions', () => {
  afterEach(() => {
    cleanup();
  });

  it('carries its vendor classes and the caller className', () => {
    const {container} = render(
      <I18nProvider>
        <ThemeProvider>
          <BaseActiveSessions className="my-sessions" sessions={sessions} />
        </ThemeProvider>
      </I18nProvider>,
    );

    const root: HTMLElement = container.firstChild as HTMLElement;

    expect(root.classList.contains('thunderid-active-sessions')).toBe(true);
    expect(root.classList.contains('my-sessions')).toBe(true);
    expect(screen.getByRole('button', {name: 'Revoke'}).classList.contains('thunderid-active-sessions__revoke')).toBe(
      true,
    );
  });

  it('names a mobile SDK session by the application and the device', () => {
    const mobile: SSOSession = {
      ...sessions[1],
      participants: [
        {
          appId: 'app-1',
          appName: 'Quickstart',
          firstJoinedAt: '2026-10-13T09:00:00Z',
          lastActiveAt: '2026-10-13T09:05:00Z',
        },
      ],
      userAgent: 'ThunderID-Android/1.4.0 (Android 11; Redmi Note 8 Pro)',
    };

    render(
      <I18nProvider>
        <ThemeProvider>
          <BaseActiveSessions sessions={[sessions[0], mobile]} />
        </ThemeProvider>
      </I18nProvider>,
    );

    expect(screen.getByText('Quickstart on Redmi Note 8 Pro')).toBeTruthy();
  });

  it('reports a confirmed revoke through its callbacks', () => {
    const onRevoke = vi.fn();
    const onRevokeOthers = vi.fn();

    render(
      <I18nProvider>
        <ThemeProvider>
          <BaseActiveSessions sessions={sessions} onRevoke={onRevoke} onRevokeOthers={onRevokeOthers} />
        </ThemeProvider>
      </I18nProvider>,
    );

    fireEvent.click(screen.getByRole('button', {name: 'Revoke'}));
    fireEvent.click(document.querySelector<HTMLButtonElement>('.thunderid-active-sessions__confirm-revoke')!);
    fireEvent.click(screen.getByRole('button', {name: 'Revoke all others'}));
    fireEvent.click(document.querySelector<HTMLButtonElement>('.thunderid-active-sessions__confirm-revoke')!);

    expect(onRevoke).toHaveBeenCalledWith('sess-other');
    expect(onRevokeOthers).toHaveBeenCalledOnce();
  });

  it('shows the revoke in flight as loading and disables the others', () => {
    render(
      <I18nProvider>
        <ThemeProvider>
          <BaseActiveSessions sessions={sessions} revokingSessionId="sess-other" />
        </ThemeProvider>
      </I18nProvider>,
    );

    const signOut: HTMLButtonElement = document.querySelector<HTMLButtonElement>('.thunderid-active-sessions__revoke')!;

    expect(signOut.querySelector('[role="status"]')).toBeTruthy();
    expect(signOut.disabled).toBe(true);
    const signOutOthers: HTMLButtonElement = screen.getByRole('button', {name: 'Revoke all others'});

    expect(signOutOthers.disabled).toBe(true);
  });

  it('counts every session when the list is one page of them', () => {
    render(
      <I18nProvider>
        <ThemeProvider>
          <BaseActiveSessions sessions={sessions} totalCount={12} />
        </ThemeProvider>
      </I18nProvider>,
    );

    expect(screen.getByText(/^12 active sessions/)).toBeTruthy();
  });

  it('omits the heading for an empty title and wraps the list in a card on request', () => {
    const {container: plain} = render(
      <I18nProvider>
        <ThemeProvider>
          <BaseActiveSessions sessions={sessions} title="" />
        </ThemeProvider>
      </I18nProvider>,
    );
    const plainClassName: string = (plain.firstChild as HTMLElement).className;

    cleanup();

    const {container} = render(
      <I18nProvider>
        <ThemeProvider>
          <BaseActiveSessions cardLayout sessions={sessions} title="" />
        </ThemeProvider>
      </I18nProvider>,
    );

    expect(screen.queryByRole('heading')).toBeNull();
    expect((container.firstChild as HTMLElement).className).not.toBe(plainClassName);
  });

  it('shows the loading state until the sessions arrive', () => {
    render(
      <I18nProvider>
        <ThemeProvider>
          <BaseActiveSessions loading />
        </ThemeProvider>
      </I18nProvider>,
    );

    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.queryByText('No active sessions.')).toBeNull();
  });

  it('moves focus into the confirmation and back to the button that opened it', () => {
    render(
      <I18nProvider>
        <ThemeProvider>
          <BaseActiveSessions sessions={sessions} />
        </ThemeProvider>
      </I18nProvider>,
    );

    const revoke: HTMLButtonElement = screen.getByRole('button', {name: 'Revoke'});

    fireEvent.click(revoke);
    expect(document.activeElement).toBe(screen.getByRole('button', {name: 'Cancel'}));

    fireEvent.click(screen.getByRole('button', {name: 'Cancel'}));
    expect(document.activeElement).toBe(revoke);
  });

  it('offers revoking every other session when the current one is on another page', () => {
    render(
      <I18nProvider>
        <ThemeProvider>
          <BaseActiveSessions sessions={[sessions[1]]} totalCount={2} />
        </ThemeProvider>
      </I18nProvider>,
    );

    expect(screen.getByRole('button', {name: 'Revoke all others'})).toBeTruthy();
  });

  it('shows no summary for a lone session that is not this device', () => {
    const {container} = render(
      <I18nProvider>
        <ThemeProvider>
          <BaseActiveSessions sessions={[sessions[1]]} />
        </ThemeProvider>
      </I18nProvider>,
    );

    expect(container.querySelector('.thunderid-active-sessions__summary')).toBeNull();
    expect(screen.queryByRole('button', {name: 'Revoke all others'})).toBeNull();
  });
});
