// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ThunderIDRuntimeError} from '@thunderid/browser';
import {flushPromises, mount} from '@vue/test-utils';
import {Mock, afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {h} from 'vue';
import BasePasskeys, {type BasePasskeysRenderProps} from '../../../components/account/passkeys/BasePasskeys';
import Passkeys from '../../../components/account/passkeys/Passkeys';
import {type MockFetcher, createManagementContext, jsonResponse, translate} from '../../helpers/managementContext';

const mockHandlePasskeyRegistration = vi.fn() as Mock;
const mockWebAuthnSupported = vi.fn() as Mock;

vi.mock('@thunderid/browser', async (importOriginal: () => Promise<Record<string, unknown>>) => ({
  ...(await importOriginal()),
  isWebAuthnSupported: (): unknown => mockWebAuthnSupported() as unknown,
}));

vi.mock('../../../utils/passkey', () => ({
  handlePasskeyRegistration: (...args: unknown[]): unknown => mockHandlePasskeyRegistration(...args) as unknown,
}));

const BASE_URL = 'https://thunder.example';

const CREDENTIAL = {
  id: 'new-cred',
  response: {attestationObject: 'att', clientDataJSON: 'cdj'},
  type: 'public-key',
};

let routes: Record<string, {body?: unknown; status: number}[]>;
let fetcher: MockFetcher;

const route = (method: string, path: string, ...responses: {body?: unknown; status: number}[]): void => {
  routes[`${method} ${path}`] = responses;
};

const callsTo = (method: string, path: string): RequestInit[] =>
  fetcher.mock.calls
    .filter(([url, init]: [string, RequestInit]) => url === `${BASE_URL}${path}` && init.method === method)
    .map(([, init]: [string, RequestInit]) => init);

const mountPasskeys = (props: Record<string, unknown> = {}, slots: Record<string, unknown> = {}) =>
  mount(Passkeys, {
    attachTo: document.body,
    global: {provide: createManagementContext({fetcher}).provide},
    props,
    slots,
  });

const buttonByText = (wrapper: ReturnType<typeof mountPasskeys>, text: string) =>
  wrapper.findAll('button').find((button) => button.text() === text);

// The add panel, or the remove confirmation in a passkey's row.
const dialog = (): HTMLElement | null =>
  document.body.querySelector<HTMLElement>('.thunderid-passkeys__panel, .thunderid-passkeys__confirm');

const clickDialogButton = async (text: string): Promise<void> => {
  Array.from(dialog()!.querySelectorAll('button'))
    .find((button) => button.textContent?.trim() === text)!
    .click();
  await flushPromises();
};

const typeName = async (value: string): Promise<void> => {
  const input = dialog()!.querySelector<HTMLInputElement>('input[name="passkeyName"]')!;
  input.value = value;
  input.dispatchEvent(new Event('input'));
  await flushPromises();
};

describe('Passkeys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWebAuthnSupported.mockReturnValue(true);
    routes = {};
    fetcher = vi.fn((url: string, init: RequestInit): Promise<Response> => {
      const key = `${init.method} ${url.replace(BASE_URL, '')}`;
      const queue = routes[key];

      if (!queue?.length) {
        return Promise.reject(new Error(`Unexpected request: ${key}`));
      }

      const next = queue.length > 1 ? queue.shift()! : queue[0];

      return Promise.resolve(jsonResponse(next.body, next.status));
    }) as MockFetcher;
  });

  afterEach(() => {
    document.body.innerHTML = '';
    Reflect.deleteProperty(window.PublicKeyCredential, 'signalUnknownCredential');
  });

  it('lists the passkeys, naming an unnamed one "Passkey"', async () => {
    route('GET', '/users/me/passkeys', {body: {passkeys: [{id: 'a', name: 'Work laptop'}, {id: 'b'}]}, status: 200});

    const wrapper = mountPasskeys();
    await flushPromises();

    const names = wrapper.findAll('.thunderid-passkeys__name').map((node) => node.text());
    expect(names).toEqual(['Work laptop', 'Passkey']);
    expect(wrapper.find('.thunderid-passkeys__heading').text()).toBe('Passkeys');
  });

  it('says when there are no passkeys', async () => {
    route('GET', '/users/me/passkeys', {body: {passkeys: []}, status: 200});

    const wrapper = mountPasskeys();
    await flushPromises();

    expect(wrapper.text()).toContain(translate('user.passkeys.empty'));
  });

  it('adds a passkey, names it once the device creates it, and emits it', async () => {
    route(
      'GET',
      '/users/me/passkeys',
      {body: {passkeys: []}, status: 200},
      {body: {passkeys: [{id: 'new-cred', name: 'Work laptop'}]}, status: 200},
    );
    route('POST', '/users/me/passkeys/register/start', {
      body: {publicKeyCredentialCreationOptions: {challenge: 'abc'}, sessionToken: 'st'},
      status: 200,
    });
    route('POST', '/users/me/passkeys/register/finish', {body: {id: 'new-cred', name: 'Work laptop'}, status: 201});
    mockHandlePasskeyRegistration.mockResolvedValue(JSON.stringify(CREDENTIAL));

    const wrapper = mountPasskeys({relyingPartyId: 'example.com'});
    await flushPromises();

    await buttonByText(wrapper, 'Add a passkey')!.trigger('click');
    expect(dialog()!.textContent).toContain(translate('user.passkeys.add.intro.no_password'));
    await clickDialogButton(translate('user.passkeys.add.continue'));

    expect(dialog()!.textContent).toContain(translate('user.passkeys.add.created.heading'));
    expect(callsTo('POST', '/users/me/passkeys/register/finish')).toHaveLength(0);

    await typeName('  Work laptop  ');
    await clickDialogButton(translate('user.passkeys.add.save'));

    expect(JSON.parse(callsTo('POST', '/users/me/passkeys/register/start')[0].body as string)).toEqual({
      relyingPartyId: 'example.com',
    });
    expect(mockHandlePasskeyRegistration).toHaveBeenCalledWith(JSON.stringify({challenge: 'abc'}));
    expect(JSON.parse(callsTo('POST', '/users/me/passkeys/register/finish')[0].body as string)).toEqual({
      name: 'Work laptop',
      publicKeyCredential: CREDENTIAL,
      sessionToken: 'st',
    });
    expect(wrapper.emitted('add')?.[0]).toEqual([{id: 'new-cred', name: 'Work laptop'}]);
    expect(wrapper.text()).toContain(translate('user.passkeys.add.success'));
    expect(dialog()).toBeNull();
    expect(wrapper.findAll('.thunderid-passkeys__name').map((node) => node.text())).toEqual(['Work laptop']);
  });

  it('saves without a name when naming is skipped', async () => {
    route('GET', '/users/me/passkeys', {body: {passkeys: []}, status: 200});
    route('POST', '/users/me/passkeys/register/start', {
      body: {publicKeyCredentialCreationOptions: {}, sessionToken: 'st'},
      status: 200,
    });
    route('POST', '/users/me/passkeys/register/finish', {body: {id: 'new-cred'}, status: 201});
    mockHandlePasskeyRegistration.mockResolvedValue(JSON.stringify(CREDENTIAL));

    const wrapper = mountPasskeys();
    await flushPromises();

    await buttonByText(wrapper, 'Add a passkey')!.trigger('click');
    await clickDialogButton(translate('user.passkeys.add.continue'));
    await clickDialogButton(translate('user.passkeys.add.skip'));

    expect(callsTo('POST', '/users/me/passkeys/register/finish')[0].body as string).not.toContain('"name"');
    expect(wrapper.emitted('add')?.[0]).toEqual([{id: 'new-cred'}]);
  });

  it('keeps the add panel open and explains when the device prompt is cancelled', async () => {
    route('GET', '/users/me/passkeys', {body: {passkeys: []}, status: 200});
    route('POST', '/users/me/passkeys/register/start', {
      body: {publicKeyCredentialCreationOptions: {}, sessionToken: 'st'},
      status: 200,
    });
    mockHandlePasskeyRegistration.mockRejectedValue(
      new ThunderIDRuntimeError('cancelled', 'browser-webauthn-user-cancelled', 'browser'),
    );

    const wrapper = mountPasskeys();
    await flushPromises();

    await buttonByText(wrapper, 'Add a passkey')!.trigger('click');
    await clickDialogButton(translate('user.passkeys.add.continue'));

    expect(dialog()!.textContent).toContain(translate('user.passkeys.error.cancelled'));
    expect(dialog()!.textContent).toContain(translate('user.passkeys.add.continue'));
    expect(callsTo('POST', '/users/me/passkeys/register/finish')).toHaveLength(0);
  });

  it('clears an add error after five seconds', async () => {
    vi.useFakeTimers({shouldAdvanceTime: true});
    route('GET', '/users/me/passkeys', {body: {passkeys: []}, status: 200});
    route('POST', '/users/me/passkeys/register/start', {
      body: {publicKeyCredentialCreationOptions: {}, sessionToken: 'st'},
      status: 200,
    });
    mockHandlePasskeyRegistration.mockRejectedValue(
      new ThunderIDRuntimeError('cancelled', 'browser-webauthn-user-cancelled', 'browser'),
    );

    try {
      const wrapper = mountPasskeys();
      await flushPromises();

      await buttonByText(wrapper, 'Add a passkey')!.trigger('click');
      await clickDialogButton(translate('user.passkeys.add.continue'));
      expect(dialog()!.textContent).toContain(translate('user.passkeys.error.cancelled'));

      vi.advanceTimersByTime(5000);
      await flushPromises();

      expect(dialog()!.textContent).not.toContain(translate('user.passkeys.error.cancelled'));
    } finally {
      vi.useRealTimers();
    }
  });

  it('removes a passkey after confirmation and tells the passkey provider', async () => {
    route(
      'GET',
      '/users/me/passkeys',
      {
        body: {
          passkeys: [
            {id: 'a', name: 'Work laptop'},
            {id: 'b', name: 'Phone'},
          ],
        },
        status: 200,
      },
      {body: {passkeys: [{id: 'b', name: 'Phone'}]}, status: 200},
    );
    route('DELETE', '/users/me/passkeys/a', {status: 204});
    const signalUnknownCredential: Mock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.PublicKeyCredential, 'signalUnknownCredential', {
      configurable: true,
      value: signalUnknownCredential,
    });

    const wrapper = mountPasskeys();
    await flushPromises();

    await wrapper.findAll('.thunderid-passkeys__remove')[0].trigger('click');

    expect(dialog()!.textContent).toContain(
      translate('user.passkeys.remove.confirm.description', {name: 'Work laptop'}),
    );
    expect(dialog()!.textContent).not.toContain(translate('user.passkeys.remove.confirm.last'));
    expect(callsTo('DELETE', '/users/me/passkeys/a')).toHaveLength(0);

    dialog()!.querySelector<HTMLButtonElement>('.thunderid-passkeys__confirm-remove')!.click();
    await flushPromises();

    expect(callsTo('DELETE', '/users/me/passkeys/a')).toHaveLength(1);
    expect(signalUnknownCredential).toHaveBeenCalledWith({credentialId: 'a', rpId: window.location.hostname});
    expect(wrapper.emitted('remove')?.[0]).toEqual(['a']);
    expect(wrapper.text()).toContain(translate('user.passkeys.remove.success'));
    expect(wrapper.findAll('.thunderid-passkeys__name').map((node) => node.text())).toEqual(['Phone']);
  });

  it('clears the success message after five seconds', async () => {
    vi.useFakeTimers({shouldAdvanceTime: true});
    route(
      'GET',
      '/users/me/passkeys',
      {body: {passkeys: [{id: 'a', name: 'Work laptop'}]}, status: 200},
      {body: {passkeys: []}, status: 200},
    );
    route('DELETE', '/users/me/passkeys/a', {status: 204});

    try {
      const wrapper = mountPasskeys();
      await flushPromises();

      await wrapper.find('.thunderid-passkeys__remove').trigger('click');
      await wrapper.find('.thunderid-passkeys__confirm-remove').trigger('click');
      await flushPromises();
      expect(wrapper.text()).toContain(translate('user.passkeys.remove.success'));

      vi.advanceTimersByTime(5000);
      await flushPromises();

      expect(wrapper.text()).not.toContain(translate('user.passkeys.remove.success'));
    } finally {
      vi.useRealTimers();
    }
  });

  it('warns before removing the last passkey', async () => {
    route('GET', '/users/me/passkeys', {body: {passkeys: [{id: 'a', name: 'Work laptop'}]}, status: 200});

    const wrapper = mountPasskeys();
    await flushPromises();

    await wrapper.find('.thunderid-passkeys__remove').trigger('click');

    expect(dialog()!.textContent).toContain(translate('user.passkeys.remove.confirm.last'));

    await clickDialogButton(translate('user.passkeys.cancel'));

    expect(dialog()).toBeNull();
  });

  it('explains a refused load, such as a suspended account', async () => {
    route('GET', '/users/me/passkeys', {body: {code: 'AUTHN-1012'}, status: 403});

    const wrapper = mountPasskeys();
    await flushPromises();

    expect(wrapper.text()).toContain(translate('user.passkeys.error.forbidden'));
  });

  it('turns adding off with an explanation when the browser has no WebAuthn', async () => {
    mockWebAuthnSupported.mockReturnValue(false);
    route('GET', '/users/me/passkeys', {body: {passkeys: []}, status: 200});

    const wrapper = mountPasskeys();
    await flushPromises();

    expect(wrapper.find('.thunderid-passkeys__add').exists()).toBe(false);
    expect(wrapper.text()).toContain(translate('user.passkeys.error.unsupported'));
  });

  it('caps the name at 64 characters', async () => {
    route('GET', '/users/me/passkeys', {body: {passkeys: []}, status: 200});
    route('POST', '/users/me/passkeys/register/start', {
      body: {publicKeyCredentialCreationOptions: {}, sessionToken: 'st'},
      status: 200,
    });
    mockHandlePasskeyRegistration.mockResolvedValue(JSON.stringify(CREDENTIAL));

    const wrapper = mountPasskeys();
    await flushPromises();

    await buttonByText(wrapper, 'Add a passkey')!.trigger('click');
    await clickDialogButton(translate('user.passkeys.add.continue'));

    expect(dialog()!.querySelector('input[name="passkeyName"]')!.getAttribute('maxlength')).toBe('64');
    expect(dialog()!.textContent).toContain('0/64');
  });

  it('waits on the device without a way to close the add panel', async () => {
    route('GET', '/users/me/passkeys', {body: {passkeys: []}, status: 200});
    route('POST', '/users/me/passkeys/register/start', {
      body: {publicKeyCredentialCreationOptions: {}, sessionToken: 'st'},
      status: 200,
    });
    mockHandlePasskeyRegistration.mockReturnValue(new Promise<string>(() => undefined));

    const wrapper = mountPasskeys();
    await flushPromises();

    await buttonByText(wrapper, 'Add a passkey')!.trigger('click');
    await clickDialogButton(translate('user.passkeys.add.continue'));

    expect(dialog()!.textContent).toContain(translate('user.passkeys.add.waiting.heading'));
    expect(dialog()!.querySelector('button')).toBeNull();
  });

  it('confirms a removal in the passkey row and returns focus to the bin icon on cancel', async () => {
    route('GET', '/users/me/passkeys', {body: {passkeys: [{id: 'a', name: 'Work laptop'}]}, status: 200});

    const wrapper = mountPasskeys();
    await flushPromises();

    await wrapper.find('.thunderid-passkeys__remove').trigger('click');
    await flushPromises();

    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
    expect(wrapper.find('.thunderid-passkeys__item .thunderid-passkeys__confirm').exists()).toBe(true);

    await wrapper.find('.thunderid-passkeys__cancel').trigger('click');
    await flushPromises();

    expect(document.activeElement).toBe(wrapper.find('.thunderid-passkeys__remove').element);
  });

  it('returns focus to the add button when the add panel is cancelled', async () => {
    route('GET', '/users/me/passkeys', {body: {passkeys: []}, status: 200});

    const wrapper = mountPasskeys();
    await flushPromises();

    await wrapper.find('.thunderid-passkeys__add').trigger('click');
    await flushPromises();
    await wrapper.find('.thunderid-passkeys__cancel').trigger('click');
    await flushPromises();

    expect(document.activeElement).toBe(wrapper.find('.thunderid-passkeys__add').element);
  });
});

describe('Passkeys with a custom slot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWebAuthnSupported.mockReturnValue(true);
    routes = {};
    fetcher = vi.fn((url: string, init: RequestInit): Promise<Response> => {
      const key = `${init.method} ${url.replace(BASE_URL, '')}`;
      const queue = routes[key];

      if (!queue?.length) {
        return Promise.reject(new Error(`Unexpected request: ${key}`));
      }

      const next = queue.length > 1 ? queue.shift()! : queue[0];

      return Promise.resolve(jsonResponse(next.body, next.status));
    }) as MockFetcher;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('hands a custom slot the passkeys and actions', async () => {
    route('GET', '/users/me/passkeys', {body: {passkeys: [{id: 'a'}]}, status: 200});
    route('DELETE', '/users/me/passkeys/a', {status: 204});

    const wrapper = mountPasskeys(
      {},
      {
        default: ({getDisplayName, onRemove, passkeys}: BasePasskeysRenderProps) =>
          passkeys.map((passkey) =>
            h('button', {class: 'drop', onClick: () => onRemove?.(passkey.id)}, `Drop ${getDisplayName(passkey)}`),
          ),
      },
    );
    await flushPromises();

    expect(wrapper.find('.drop').text()).toBe('Drop Passkey');
    expect(wrapper.find('.thunderid-passkeys__heading').exists()).toBe(false);

    await wrapper.find('.drop').trigger('click');
    await flushPromises();

    expect(callsTo('DELETE', '/users/me/passkeys/a')).toHaveLength(1);
    expect(wrapper.emitted('remove')?.[0]).toEqual(['a']);
  });

  it('trims the name a custom slot saves, and tells it the name limit', async () => {
    route('GET', '/users/me/passkeys', {body: {passkeys: []}, status: 200});
    route('POST', '/users/me/passkeys/register/start', {
      body: {publicKeyCredentialCreationOptions: {}, sessionToken: 'st'},
      status: 200,
    });
    route('POST', '/users/me/passkeys/register/finish', {body: {id: 'new-cred', name: 'Phone'}, status: 201});
    mockHandlePasskeyRegistration.mockResolvedValue(JSON.stringify(CREDENTIAL));

    const wrapper = mountPasskeys(
      {},
      {
        default: ({nameMaxLength, naming, onAdd, onSave}: BasePasskeysRenderProps) => [
          h('span', {class: 'limit'}, `limit ${nameMaxLength}`),
          h('button', {class: 'create', onClick: () => onAdd?.()}, 'Create'),
          naming ? h('button', {class: 'name-it', onClick: () => onSave?.('  Phone  ')}, 'Name it') : null,
        ],
      },
    );
    await flushPromises();

    expect(wrapper.find('.limit').text()).toBe('limit 64');
    await wrapper.find('.create').trigger('click');
    await flushPromises();
    await wrapper.find('.name-it').trigger('click');
    await flushPromises();

    expect(
      (JSON.parse(callsTo('POST', '/users/me/passkeys/register/finish')[0].body as string) as {name?: string}).name,
    ).toBe('Phone');
    expect(wrapper.emitted('add')?.[0]).toEqual([{id: 'new-cred', name: 'Phone'}]);
  });
});

describe('BasePasskeys', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  const mountBase = (props: Record<string, unknown>) =>
    mount(BasePasskeys, {attachTo: document.body, global: {provide: createManagementContext().provide}, props});

  it('draws the passkeys it is given, with no network', () => {
    const wrapper = mountBase({passkeys: [{id: 'a', name: 'Work laptop'}, {id: 'b'}]});

    expect(wrapper.findAll('.thunderid-passkeys__name').map((node) => node.text())).toEqual(['Work laptop', 'Passkey']);
  });

  it('offers no actions without handlers', () => {
    const wrapper = mountBase({passkeys: [{id: 'a', name: 'Work laptop'}]});

    expect(wrapper.find('.thunderid-passkeys__add').exists()).toBe(false);
    expect(wrapper.find('.thunderid-passkeys__remove').exists()).toBe(false);
  });

  it('shows the naming step when told, and saves without a name on skip', async () => {
    const onSave: Mock = vi.fn();

    mountBase({naming: true, onAdd: vi.fn(), onSave});

    expect(dialog()!.textContent).toContain('0/64');
    await clickDialogButton(translate('user.passkeys.add.skip'));

    expect(onSave).toHaveBeenCalledWith('');
  });

  it('reports a removal only once it is confirmed', async () => {
    const onRemove: Mock = vi.fn();
    const wrapper = mountBase({onRemove, passkeys: [{id: 'a', name: 'Work laptop'}]});

    await wrapper.find('.thunderid-passkeys__remove').trigger('click');
    expect(onRemove).not.toHaveBeenCalled();

    await wrapper.find('.thunderid-passkeys__confirm-remove').trigger('click');
    expect(onRemove).toHaveBeenCalledWith('a');
  });
});
