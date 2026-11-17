// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {SSOSessionListResponse, getDefaultI18nBundles, substituteTranslationParams} from '@thunderid/browser';
import {VueWrapper, enableAutoUnmount, flushPromises, mount} from '@vue/test-utils';
import {Mock, afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {createSSRApp, h, nextTick, ref} from 'vue';
import {renderToString} from 'vue/server-renderer';
import ActiveSessions from '../../../components/account/active-sessions/ActiveSessions';
import BaseActiveSessions from '../../../components/account/active-sessions/BaseActiveSessions';
import {I18N_KEY, THUNDERID_KEY} from '../../../keys';
import injectStyles from '../../../styles/injectStyles';
import type {I18nContextValue, ThunderIDContext} from '../../../models/contexts';

// Unmounted after each test, so a component left mounted cannot keep a shared timer running into the next one.
enableAutoUnmount(afterEach);
const fetcher: Mock = vi.fn();

vi.mock('@thunderid/browser', async (importOriginal: () => Promise<Record<string, unknown>>) => ({
  ...(await importOriginal()),
  createHttpClientFetcher: (): Mock => fetcher,
}));

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
const answer = (list: SSOSessionListResponse | null = page, revokeStatus = 204): void => {
  fetcher.mockImplementation((_url: string, init: RequestInit) => {
    if (init.method === 'DELETE') {
      return Promise.resolve(response(revokeStatus < 400 ? undefined : {code: 'SSM-1007'}, revokeStatus));
    }

    return Promise.resolve(list ? response(list) : response({code: 'SSM-5000'}, 500));
  });
};

const i18nContext = {
  bundles: ref({}),
  currentLanguage: ref('en-US'),
  fallbackLanguage: 'en-US',
  injectBundles: vi.fn(),
  setLanguage: vi.fn(),
  t: (key: string, params?: Record<string, string | number>): string => {
    const translations = getDefaultI18nBundles()['en-US']?.translations as Record<string, string>;
    const value: string = translations?.[key] ?? key;

    return params ? substituteTranslationParams(value, params) : value;
  },
} as unknown as I18nContextValue;

const mountActiveSessions = async (): Promise<VueWrapper> => {
  const wrapper = mount(ActiveSessions, {
    global: {
      provide: {
        [I18N_KEY as symbol]: i18nContext,
        [THUNDERID_KEY as symbol]: {baseUrl, instanceId: 0} as unknown as ThunderIDContext,
      },
    },
  });

  await flushPromises();

  return wrapper;
};

const requests = (): string[] =>
  fetcher.mock.calls.map(([url, init]: [string, RequestInit]) => `${init.method} ${url}`);

const button = (wrapper: VueWrapper, text: string) =>
  wrapper.findAll('button').filter((candidate) => candidate.text() === text);

const confirmRevoke = async (wrapper: VueWrapper): Promise<void> => {
  await wrapper.find('.thunderid-active-sessions__confirm-revoke').trigger('click');
  await flushPromises();
};

describe('ActiveSessions', () => {
  beforeEach(() => {
    fetcher.mockReset();
  });

  it('lists each session with its device and applications, and marks the current one', async () => {
    answer();
    const wrapper: VueWrapper = await mountActiveSessions();

    expect(wrapper.text()).toContain('Chrome on macOS');
    expect(wrapper.text()).toContain('Firefox on Android');
    expect(wrapper.text()).toContain('This device');
    expect(wrapper.text()).toContain('Active sessions');
    expect(wrapper.text()).toContain('2 active sessions · revoke any you don’t recognize');
    expect(
      wrapper.findAll('li.thunderid-active-sessions__app [role="button"]').map((app) => app.attributes('aria-label')),
    ).toEqual(['Store', 'app-2']);
  });

  it('shows the IP address and when the session signed in and was last active', async () => {
    answer();
    const wrapper: VueWrapper = await mountActiveSessions();
    const labels: string[] = wrapper.findAll('dt').map((label) => label.text());
    const values: string[] = wrapper.findAll('dd').map((value) => value.text());

    expect(labels.slice(0, 3)).toEqual(['IP address', 'Signed in', 'Latest SSO']);
    expect(wrapper.find('.thunderid-active-sessions__apps-label').text()).toBe('Applications');
    expect(values).toContain('203.0.113.7');
    expect(values).toContain('Unknown');
    expect(wrapper.findAll('.thunderid-active-sessions__detail-time').map((time) => time.text())).toContain(
      new Date('2026-10-14T09:05:00Z').toLocaleTimeString('en-US', {timeStyle: 'short'}),
    );
  });

  it('draws a browser and an operating system icon for each session', async () => {
    answer();
    const wrapper: VueWrapper = await mountActiveSessions();

    expect(wrapper.find('[title="Chrome"] svg').exists()).toBe(true);
    expect(wrapper.find('[title="macOS"] svg').exists()).toBe(true);
    expect(wrapper.find('[title="Android"] svg').exists()).toBe(true);
  });

  it('lists the current session first', async () => {
    answer({...page, sessions: [...page.sessions].reverse()});
    const wrapper: VueWrapper = await mountActiveSessions();

    expect(wrapper.find('[data-current]').attributes('data-current')).toBe('true');
  });

  it('wraps the list in a card and builds its actions from the Button primitive', async () => {
    answer();
    const wrapper: VueWrapper = await mountActiveSessions();
    const base = mount(BaseActiveSessions, {
      global: {provide: {[I18N_KEY as symbol]: i18nContext}},
      props: {className: 'my-sessions', sessions: page.sessions},
    });

    expect(wrapper.classes()).toContain('thunderid-active-sessions--card');
    expect(base.classes()).toEqual(['thunderid-active-sessions', 'my-sessions']);
    expect(base.find('[aria-describedby]').classes()).toContain('thunderid-active-sessions__revoke');
    expect(base.find('[aria-describedby]').classes()).toContain('thunderid-button');
  });

  it('offers revoke only for sessions other than the current one', async () => {
    answer();
    const wrapper: VueWrapper = await mountActiveSessions();

    expect(button(wrapper, 'Revoke')).toHaveLength(1);
  });

  it('asks for confirmation before revoking a session', async () => {
    answer();
    const wrapper: VueWrapper = await mountActiveSessions();

    await button(wrapper, 'Revoke')[0].trigger('click');

    expect(wrapper.text()).toContain('Revoke the session on Firefox on Android?');

    await button(wrapper, 'Cancel')[0].trigger('click');

    expect(wrapper.text()).not.toContain('Revoke the session on Firefox on Android?');
    expect(requests()).toEqual([`GET ${baseUrl}/users/me/sessions`]);
  });

  it('revokes a session once confirmed, then reloads the list', async () => {
    answer();
    const wrapper: VueWrapper = await mountActiveSessions();

    await button(wrapper, 'Revoke')[0].trigger('click');
    await confirmRevoke(wrapper);

    expect(requests()).toEqual([
      `GET ${baseUrl}/users/me/sessions`,
      `DELETE ${baseUrl}/users/me/sessions/sess-other`,
      `GET ${baseUrl}/users/me/sessions`,
    ]);
  });

  it('revokes every session except the current one', async () => {
    answer();
    const wrapper: VueWrapper = await mountActiveSessions();

    await button(wrapper, 'Revoke all others')[0].trigger('click');

    expect(wrapper.text()).toContain('Revoke all other sessions? You’ll stay signed in here.');

    await confirmRevoke(wrapper);

    expect(requests()).toContain(`DELETE ${baseUrl}/users/me/sessions?exceptCurrent=true`);
  });

  it('hides revoking other sessions when no session is the current one', async () => {
    answer({...page, sessions: page.sessions.map((session) => ({...session, isCurrent: false}))});
    const wrapper: VueWrapper = await mountActiveSessions();

    expect(button(wrapper, 'Revoke all others')).toHaveLength(0);
  });

  it('shows an error when the sessions fail to load', async () => {
    answer(null);
    const wrapper: VueWrapper = await mountActiveSessions();

    expect(wrapper.text()).toContain('An error occurred while loading your sessions. Please try again.');
  });

  it('shows an error when revoking a session fails', async () => {
    answer(page, 500);
    const wrapper: VueWrapper = await mountActiveSessions();

    await button(wrapper, 'Revoke')[0].trigger('click');
    await confirmRevoke(wrapper);

    expect(wrapper.text()).toContain('An error occurred while revoking the session. Please try again.');
  });

  it('says so when the user has no sessions', async () => {
    answer({...page, count: 0, sessions: [], totalResults: 0});
    const wrapper: VueWrapper = await mountActiveSessions();

    expect(wrapper.text()).toContain('No active sessions.');
  });

  it('counts every session the server reports, not only the listed page', async () => {
    answer({...page, totalResults: 12});
    const wrapper: VueWrapper = await mountActiveSessions();

    expect(wrapper.text()).toContain('12 active sessions');
  });

  it('clears a load error once the sessions load', async () => {
    answer(null);
    const wrapper: VueWrapper = await mountActiveSessions();

    answer(page);
    await wrapper.setProps({limit: 5});
    await flushPromises();

    expect(wrapper.text()).not.toContain('An error occurred while loading your sessions. Please try again.');
    expect(wrapper.text()).toContain('2 active sessions');
  });

  it('reloads the list without an error when the session is already gone', async () => {
    answer(page, 404);
    const wrapper: VueWrapper = await mountActiveSessions();

    await button(wrapper, 'Revoke')[0].trigger('click');
    await confirmRevoke(wrapper);

    expect(requests()).toEqual([
      `GET ${baseUrl}/users/me/sessions`,
      `DELETE ${baseUrl}/users/me/sessions/sess-other`,
      `GET ${baseUrl}/users/me/sessions`,
    ]);
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });

  it('shows an error when revoking every other session fails', async () => {
    answer(page, 500);
    const wrapper: VueWrapper = await mountActiveSessions();

    await button(wrapper, 'Revoke all others')[0].trigger('click');
    await confirmRevoke(wrapper);

    expect(wrapper.text()).toContain('An error occurred while revoking the session. Please try again.');
  });

  it('falls back when a session records no device, IP address or applications', async () => {
    const bare = {...page.sessions[1], lastActiveIp: undefined, participants: [], userAgent: undefined};
    answer({...page, sessions: [page.sessions[0], bare]});
    const wrapper: VueWrapper = await mountActiveSessions();

    expect(wrapper.text()).toContain('Unknown device');
    expect(wrapper.findAll('.thunderid-active-sessions__detail-value--ip').map((ip) => ip.text())).toContain('Unknown');
    expect(wrapper.findAll('span.thunderid-active-sessions__app').map((app) => app.text())).toEqual(['Unknown']);
  });

  it('names a mobile SDK session by the application and the device', () => {
    const mobile = {
      ...page.sessions[1],
      participants: [{appId: 'app-1', appName: 'Quickstart', firstJoinedAt: '2026-10-13T09:00:00Z', lastActiveAt: ''}],
      userAgent: 'ThunderID-Android/1.4.0 (Android 11; Redmi Note 8 Pro)',
    };
    const base = mount(BaseActiveSessions, {
      global: {provide: {[I18N_KEY as symbol]: i18nContext}},
      props: {sessions: [page.sessions[0], mobile]},
    });

    expect(base.findAll('.thunderid-active-sessions__device').map((device) => device.text())).toContain(
      'Quickstart on Redmi Note 8 Pro',
    );
  });

  it('omits the heading for an empty title and shows the loading state', () => {
    const base = mount(BaseActiveSessions, {
      global: {provide: {[I18N_KEY as symbol]: i18nContext}},
      props: {loading: true, title: ''},
    });

    expect(base.find('h3').exists()).toBe(false);
    expect(base.find('[role="status"]').exists()).toBe(true);
  });

  it('emits revoke with the session once the revoke is confirmed', async () => {
    const base = mount(BaseActiveSessions, {
      global: {provide: {[I18N_KEY as symbol]: i18nContext}},
      props: {sessions: page.sessions},
    });

    await base.find('.thunderid-active-sessions__revoke').trigger('click');
    await base.find('.thunderid-active-sessions__confirm-revoke').trigger('click');

    expect(base.emitted('revoke')).toEqual([['sess-other']]);
  });

  it('moves focus into the confirmation and back to the button that opened it', async () => {
    const base = mount(BaseActiveSessions, {
      attachTo: document.body,
      global: {provide: {[I18N_KEY as symbol]: i18nContext}},
      props: {sessions: page.sessions},
    });
    const revoke = base.find('.thunderid-active-sessions__revoke');

    await revoke.trigger('click');
    await flushPromises();
    expect(document.activeElement).toBe(base.find('.thunderid-active-sessions__cancel').element);

    await base.find('.thunderid-active-sessions__cancel').trigger('click');
    await flushPromises();
    expect(document.activeElement).toBe(revoke.element);

    base.unmount();
  });

  it('offers revoking every other session when the current one is on another page', () => {
    const base = mount(BaseActiveSessions, {
      global: {provide: {[I18N_KEY as symbol]: i18nContext}},
      props: {sessions: [page.sessions[1]], totalResults: 2},
    });

    expect(base.find('.thunderid-active-sessions__revoke-others').exists()).toBe(true);
  });

  it('shows each application as its logo, or its initial, named by a tooltip', async () => {
    const withApps = {
      ...page.sessions[1],
      participants: [
        {
          appId: 'app-1',
          appLogoUrl: 'https://example.com/store.png',
          appName: 'Store',
          firstJoinedAt: '',
          lastActiveAt: '',
        },
        {appId: 'app-2', appName: 'quickstart', firstJoinedAt: '', lastActiveAt: ''},
      ],
    };
    const base = mount(BaseActiveSessions, {
      global: {provide: {[I18N_KEY as symbol]: i18nContext}},
      props: {sessions: [withApps]},
    });

    const logo = base.find('img.thunderid-active-sessions__app-icon');
    expect(logo.attributes('src')).toBe('https://example.com/store.png');
    expect(logo.attributes('alt')).toBe('Store');
    expect(base.find('.thunderid-active-sessions__app-icon--initial').text()).toBe('Q');

    const store = base.find('[role="button"][aria-label="Store"]');
    await store.trigger('mouseenter');
    expect(base.find('[role="tooltip"]').text()).toBe('Store');

    await logo.trigger('error');
    expect(base.find('img.thunderid-active-sessions__app-icon').exists()).toBe(false);
    expect(base.findAll('.thunderid-active-sessions__app-icon--initial').map((initial) => initial.text())).toEqual([
      'S',
      'Q',
    ]);
  });

  it('resolves emoji and generated logos, and shows up to two initials without one', () => {
    const withApps = {
      ...page.sessions[1],
      participants: [
        {appId: 'app-1', appLogoUrl: 'emoji:🛒', appName: 'Store', firstJoinedAt: '', lastActiveAt: ''},
        {
          appId: 'app-2',
          appLogoUrl: 'avatar:shape=rounded,variant=anonymous_entity,content=cube,colors=0',
          appName: 'Console',
          firstJoinedAt: '',
          lastActiveAt: '',
        },
        {appId: 'app-3', appName: 'Admin Portal', firstJoinedAt: '', lastActiveAt: ''},
      ],
    };
    const base = mount(BaseActiveSessions, {
      global: {provide: {[I18N_KEY as symbol]: i18nContext}},
      props: {sessions: [withApps]},
    });

    expect(base.find('.thunderid-active-sessions__app-icon--glyph').text()).toBe('🛒');
    expect(base.find('img.thunderid-active-sessions__app-icon').attributes('src')).toMatch(/^data:image\/svg\+xml/);
    expect(base.find('.thunderid-active-sessions__app-icon--initial').text()).toBe('AP');
  });

  it('shows every application in a strip with no toggle, and arrows only on the sides that overflow', async () => {
    injectStyles();
    const host: HTMLElement = document.createElement('div');
    host.style.width = '260px';
    document.body.appendChild(host);
    const withApps = {
      ...page.sessions[1],
      participants: ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'].map(
        (appName: string) => ({appId: `app-${appName}`, appName, firstJoinedAt: '', lastActiveAt: ''}),
      ),
    };
    const base = mount(BaseActiveSessions, {
      attachTo: host,
      global: {provide: {[I18N_KEY as symbol]: i18nContext}},
      props: {sessions: [withApps]},
    });
    await nextTick();

    expect(base.findAll('.thunderid-active-sessions__app-icon')).toHaveLength(10);
    expect(base.text()).not.toContain('more');
    const strip = base.find('ul.thunderid-active-sessions__apps');
    expect(strip.attributes('aria-label')).toBe('Applications');
    expect(getComputedStyle(strip.element).overflowX).toBe('auto');
    expect(base.find('[aria-label="Scroll applications right"]').exists()).toBe(true);
    expect(base.find('[aria-label="Scroll applications left"]').exists()).toBe(false);

    strip.element.scrollLeft = strip.element.scrollWidth;
    await strip.trigger('scroll');

    expect(base.find('[aria-label="Scroll applications left"]').exists()).toBe(true);
    expect(base.find('[aria-label="Scroll applications right"]').exists()).toBe(false);
    base.unmount();
    host.remove();
  });

  it('offers no scroll arrows when every application fits', async () => {
    const base = mount(BaseActiveSessions, {
      global: {provide: {[I18N_KEY as symbol]: i18nContext}},
      props: {sessions: [page.sessions[0]]},
    });
    await nextTick();

    expect(base.find('.thunderid-active-sessions__apps-scroll').exists()).toBe(false);
  });

  it('shows how long ago the session signed in and had SSO activity, to the minute', () => {
    const recent = {
      ...page.sessions[1],
      authenticatedAt: new Date(Date.now() - (2 * 60 + 30) * 1000).toISOString(),
      lastActiveAt: new Date(Date.now() - 20 * 1000).toISOString(),
    };
    const base = mount(BaseActiveSessions, {
      global: {provide: {[I18N_KEY as symbol]: i18nContext}},
      props: {sessions: [recent]},
    });

    expect(base.findAll('.thunderid-active-sessions__detail-ago').map((ago) => ago.text())).toEqual([
      '2m ago',
      'Just now',
    ]);
  });

  it('keeps the times current as the minutes pass', async () => {
    vi.useFakeTimers({toFake: ['setInterval', 'clearInterval', 'Date']});
    try {
      const almostAMinute = new Date(Date.now() - 50 * 1000).toISOString();
      const base = mount(BaseActiveSessions, {
        global: {provide: {[I18N_KEY as symbol]: i18nContext}},
        props: {sessions: [{...page.sessions[1], authenticatedAt: almostAMinute, lastActiveAt: almostAMinute}]},
      });

      expect(base.findAll('.thunderid-active-sessions__detail-ago').map((ago) => ago.text())).toEqual([
        'Just now',
        'Just now',
      ]);

      vi.advanceTimersByTime(20 * 1000);
      await nextTick();

      expect(base.findAll('.thunderid-active-sessions__detail-ago').map((ago) => ago.text())).toEqual([
        '1m ago',
        '1m ago',
      ]);
      base.unmount();
    } finally {
      vi.useRealTimers();
    }
  });

  it('renders on the server, as Nuxt does before hydrating', async () => {
    const withApps = {
      ...page.sessions[1],
      participants: [{appId: 'app-1', appName: 'Store', firstJoinedAt: '', lastActiveAt: ''}],
    };
    const app = createSSRApp({render: () => h(BaseActiveSessions, {sessions: [withApps]})});
    app.provide(I18N_KEY as symbol, i18nContext);

    const html: string = await renderToString(app);

    expect(html).toContain('aria-label="Store"');
    expect(html).toContain('Latest SSO');
  });

  it('shows no summary for a lone session that is not this device', () => {
    const base = mount(BaseActiveSessions, {
      global: {provide: {[I18N_KEY as symbol]: i18nContext}},
      props: {sessions: [page.sessions[1]]},
    });

    expect(base.find('.thunderid-active-sessions__summary').exists()).toBe(false);
    expect(base.find('.thunderid-active-sessions__revoke-others').exists()).toBe(false);
  });
});
