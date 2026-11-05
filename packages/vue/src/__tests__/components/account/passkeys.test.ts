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

describe('Passkeys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('adds a passkey with the typed name and emits it', async () => {
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
    await wrapper.find('input[name="passkeyName"]').setValue('  Work laptop  ');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

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
    expect(wrapper.find('input[name="passkeyName"]').exists()).toBe(false);
    expect(wrapper.findAll('.thunderid-passkeys__name').map((node) => node.text())).toEqual(['Work laptop']);
  });

  it('keeps the form open and explains when the device prompt is cancelled', async () => {
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
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(wrapper.text()).toContain(translate('user.passkeys.error.cancelled'));
    expect(wrapper.find('input[name="passkeyName"]').exists()).toBe(true);
    expect(callsTo('POST', '/users/me/passkeys/register/finish')).toHaveLength(0);
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

    expect(wrapper.text()).toContain(translate('user.passkeys.remove.confirm.description', {name: 'Work laptop'}));
    expect(wrapper.text()).not.toContain(translate('user.passkeys.remove.confirm.last'));
    expect(callsTo('DELETE', '/users/me/passkeys/a')).toHaveLength(0);

    await wrapper.find('.thunderid-passkeys__confirm-remove').trigger('click');
    await flushPromises();

    expect(callsTo('DELETE', '/users/me/passkeys/a')).toHaveLength(1);
    expect(signalUnknownCredential).toHaveBeenCalledWith({credentialId: 'a', rpId: window.location.hostname});
    expect(wrapper.emitted('remove')?.[0]).toEqual(['a']);
    expect(wrapper.text()).toContain(translate('user.passkeys.remove.success'));
    expect(wrapper.findAll('.thunderid-passkeys__name').map((node) => node.text())).toEqual(['Phone']);
  });

  it('warns before removing the last passkey', async () => {
    route('GET', '/users/me/passkeys', {body: {passkeys: [{id: 'a', name: 'Work laptop'}]}, status: 200});

    const wrapper = mountPasskeys();
    await flushPromises();

    await wrapper.find('.thunderid-passkeys__remove').trigger('click');

    expect(wrapper.text()).toContain(translate('user.passkeys.remove.confirm.last'));
  });

  it('explains a refused load, such as a suspended account', async () => {
    route('GET', '/users/me/passkeys', {body: {code: 'AUTHN-1012'}, status: 403});

    const wrapper = mountPasskeys();
    await flushPromises();

    expect(wrapper.text()).toContain(translate('user.passkeys.error.forbidden'));
  });

  it('hands a custom render the passkeys and actions', async () => {
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
  });
});

describe('BasePasskeys', () => {
  const mountBase = (props: Record<string, unknown>) =>
    mount(BasePasskeys, {global: {provide: createManagementContext().provide}, props});

  it('turns adding off with an explanation when the browser has no WebAuthn', () => {
    const wrapper = mountBase({onAdd: vi.fn(), supported: false});

    expect(wrapper.find('.thunderid-passkeys__add').exists()).toBe(false);
    expect(wrapper.text()).toContain(translate('user.passkeys.error.unsupported'));
  });

  it('offers no actions without handlers', () => {
    const wrapper = mountBase({passkeys: [{id: 'a', name: 'Work laptop'}]});

    expect(wrapper.find('.thunderid-passkeys__add').exists()).toBe(false);
    expect(wrapper.find('.thunderid-passkeys__remove').exists()).toBe(false);
  });

  it('caps the name at 64 characters', async () => {
    const wrapper = mountBase({onAdd: vi.fn()});

    await wrapper.find('.thunderid-passkeys__add').trigger('click');

    expect(wrapper.find('input[name="passkeyName"]').attributes('maxlength')).toBe('64');
  });
});
