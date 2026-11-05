// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {ThunderIDRuntimeError} from '@thunderid/browser';
import {ReactNode} from 'react';
import {Mock, afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import I18nProvider from '../../../../contexts/I18n/I18nProvider';
import ThemeProvider from '../../../../contexts/Theme/ThemeProvider';
import ThunderIDContext, {ThunderIDContextProps} from '../../../../contexts/ThunderID/ThunderIDContext';
import BasePasskeys, {BasePasskeysRenderProps} from '../BasePasskeys';
import Passkeys from '../Passkeys';

const mockHandlePasskeyRegistration = vi.fn() as Mock;

vi.mock('../../../../utils/passkey', () => ({
  handlePasskeyRegistration: (...args: unknown[]): unknown => mockHandlePasskeyRegistration(...args) as unknown,
}));

const BASE_URL = 'https://localhost:8090';

const CREDENTIAL = {
  id: 'new-cred',
  rawId: 'new-cred',
  response: {attestationObject: 'att', clientDataJSON: 'cdj'},
  type: 'public-key',
};

interface Route {
  body?: unknown;
  status: number;
}

const json = ({body, status}: Route): Response =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    headers: {'Content-Type': 'application/json'},
    status,
  });

let routes: Record<string, Route[]>;
let fetcher: Mock;

const route = (method: string, path: string, ...responses: Route[]): void => {
  routes[`${method} ${path}`] = responses;
};

const callsTo = (method: string, path: string): RequestInit[] =>
  fetcher.mock.calls
    .filter(([url, init]: [string, RequestInit]) => url === `${BASE_URL}${path}` && init.method === method)
    .map(([, init]: [string, RequestInit]) => init);

const renderWithProviders = (node: ReactNode) =>
  render(
    <ThunderIDContext.Provider
      value={
        {
          baseUrl: BASE_URL,
          http: {fetcher},
          instanceId: 0,
          isInitialized: true,
          isLoading: false,
          vendor: 'thunderid',
        } as unknown as ThunderIDContextProps
      }
    >
      <I18nProvider>
        <ThemeProvider>{node}</ThemeProvider>
      </I18nProvider>
    </ThunderIDContext.Provider>,
  );

describe('Passkeys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routes = {};
    fetcher = vi.fn((url: string, init: RequestInit): Promise<Response> => {
      const key = `${init.method} ${url.replace(BASE_URL, '')}`;
      const queue: Route[] | undefined = routes[key];

      if (!queue?.length) {
        return Promise.reject(new Error(`Unexpected request: ${key}`));
      }

      return Promise.resolve(json(queue.length > 1 ? queue.shift()! : queue[0]));
    });
  });

  afterEach(() => {
    cleanup();
    Reflect.deleteProperty(window.PublicKeyCredential, 'signalUnknownCredential');
  });

  it('lists the passkeys, naming an unnamed one "Passkey"', async () => {
    route('GET', '/users/me/passkeys', {body: {passkeys: [{id: 'a', name: 'Work laptop'}, {id: 'b'}]}, status: 200});

    renderWithProviders(<Passkeys />);

    expect(await screen.findByText('Work laptop')).toBeTruthy();
    expect(screen.getByText('Passkey')).toBeTruthy();
    expect(screen.getByRole('heading', {name: 'Passkeys'})).toBeTruthy();
  });

  it('says when there are no passkeys', async () => {
    route('GET', '/users/me/passkeys', {body: {passkeys: []}, status: 200});

    renderWithProviders(<Passkeys />);

    expect(await screen.findByText("You haven't added any passkeys yet.")).toBeTruthy();
  });

  it('adds a passkey with the typed name and refreshes the list', async () => {
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
    const onAdd: Mock = vi.fn();

    renderWithProviders(<Passkeys onAdd={onAdd} />);

    fireEvent.click(await screen.findByRole('button', {name: 'Add a passkey'}));
    fireEvent.change(screen.getByLabelText('Name'), {target: {value: '  Work laptop  '}});
    fireEvent.click(screen.getByRole('button', {name: 'Continue'}));

    expect(await screen.findByText('Passkey added.')).toBeTruthy();
    expect(await screen.findByText('Work laptop')).toBeTruthy();

    expect(JSON.parse(callsTo('POST', '/users/me/passkeys/register/start')[0].body as string)).toEqual({
      relyingPartyId: window.location.hostname,
    });
    expect(mockHandlePasskeyRegistration).toHaveBeenCalledWith(JSON.stringify({challenge: 'abc'}));
    expect(JSON.parse(callsTo('POST', '/users/me/passkeys/register/finish')[0].body as string)).toEqual({
      name: 'Work laptop',
      publicKeyCredential: CREDENTIAL,
      sessionToken: 'st',
    });
    expect(onAdd).toHaveBeenCalledWith({id: 'new-cred', name: 'Work laptop'});
    expect(screen.queryByLabelText('Name')).toBeNull();
  });

  it('uses the relying party ID it is given', async () => {
    route('GET', '/users/me/passkeys', {body: {passkeys: []}, status: 200});
    route('POST', '/users/me/passkeys/register/start', {
      body: {publicKeyCredentialCreationOptions: {}, sessionToken: 'st'},
      status: 200,
    });
    route('POST', '/users/me/passkeys/register/finish', {body: {id: 'new-cred'}, status: 201});
    mockHandlePasskeyRegistration.mockResolvedValue(JSON.stringify(CREDENTIAL));

    renderWithProviders(<Passkeys relyingPartyId="example.com" />);

    fireEvent.click(await screen.findByRole('button', {name: 'Add a passkey'}));
    fireEvent.click(screen.getByRole('button', {name: 'Continue'}));

    await screen.findByText('Passkey added.');
    expect(JSON.parse(callsTo('POST', '/users/me/passkeys/register/start')[0].body as string)).toEqual({
      relyingPartyId: 'example.com',
    });
    expect(callsTo('POST', '/users/me/passkeys/register/finish')[0].body as string).not.toContain('"name"');
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

    renderWithProviders(<Passkeys />);

    fireEvent.click(await screen.findByRole('button', {name: 'Add a passkey'}));
    fireEvent.click(screen.getByRole('button', {name: 'Continue'}));

    expect(await screen.findByText('Adding the passkey was cancelled or timed out.')).toBeTruthy();
    expect(screen.getByLabelText('Name')).toBeTruthy();
    expect(callsTo('POST', '/users/me/passkeys/register/finish')).toHaveLength(0);
  });

  it('shows the server reason when a name is too long', async () => {
    route('GET', '/users/me/passkeys', {body: {passkeys: []}, status: 200});
    route('POST', '/users/me/passkeys/register/start', {
      body: {publicKeyCredentialCreationOptions: {}, sessionToken: 'st'},
      status: 200,
    });
    route('POST', '/users/me/passkeys/register/finish', {
      body: {code: 'PSK-1016', message: {defaultValue: 'Name too long', key: 'k'}},
      status: 400,
    });
    mockHandlePasskeyRegistration.mockResolvedValue(JSON.stringify(CREDENTIAL));

    renderWithProviders(<Passkeys />);

    fireEvent.click(await screen.findByRole('button', {name: 'Add a passkey'}));
    fireEvent.click(screen.getByRole('button', {name: 'Continue'}));

    expect(await screen.findByText('Use a name of 64 characters or fewer.')).toBeTruthy();
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
    const onRemove: Mock = vi.fn();

    renderWithProviders(<Passkeys onRemove={onRemove} />);

    await screen.findByText('Work laptop');
    fireEvent.click(screen.getAllByRole('button', {name: 'Remove'})[0]);

    expect(screen.getByText("You won't be able to sign in with Work laptop anymore.")).toBeTruthy();
    expect(screen.queryByText(/This is your last passkey/)).toBeNull();
    expect(callsTo('DELETE', '/users/me/passkeys/a')).toHaveLength(0);

    fireEvent.click(
      screen.getAllByRole('button', {name: 'Remove'}).find((button) => button.className.includes('confirm-remove'))!,
    );

    expect(await screen.findByText('Passkey removed.')).toBeTruthy();
    await waitFor(() => expect(screen.queryByText('Work laptop')).toBeNull());
    expect(callsTo('DELETE', '/users/me/passkeys/a')).toHaveLength(1);
    expect(signalUnknownCredential).toHaveBeenCalledWith({credentialId: 'a', rpId: window.location.hostname});
    expect(onRemove).toHaveBeenCalledWith('a');
  });

  it('warns before removing the last passkey', async () => {
    route('GET', '/users/me/passkeys', {body: {passkeys: [{id: 'a', name: 'Work laptop'}]}, status: 200});

    renderWithProviders(<Passkeys />);

    await screen.findByText('Work laptop');
    fireEvent.click(screen.getByRole('button', {name: 'Remove'}));

    expect(screen.getByText(/This is your last passkey/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', {name: 'Cancel'}));

    expect(screen.queryByText(/This is your last passkey/)).toBeNull();
  });

  it('explains a refused load, such as a suspended account', async () => {
    route('GET', '/users/me/passkeys', {
      body: {code: 'AUTHN-1012', message: {defaultValue: 'Suspended', key: 'k'}},
      status: 403,
    });

    renderWithProviders(<Passkeys />);

    expect(
      await screen.findByText("Your account can't change its passkeys right now. Please contact your administrator."),
    ).toBeTruthy();
  });

  it('hands a custom render the passkeys and actions', async () => {
    route('GET', '/users/me/passkeys', {body: {passkeys: [{id: 'a'}]}, status: 200});
    route('DELETE', '/users/me/passkeys/a', {status: 204});

    renderWithProviders(
      <Passkeys>
        {({getDisplayName, onRemove, passkeys}: BasePasskeysRenderProps) => (
          <ul>
            {passkeys.map((passkey) => (
              <li key={passkey.id}>
                <button type="button" onClick={() => onRemove?.(passkey.id)}>
                  Drop {getDisplayName(passkey)}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Passkeys>,
    );

    fireEvent.click(await screen.findByRole('button', {name: 'Drop Passkey'}));

    await waitFor(() => expect(callsTo('DELETE', '/users/me/passkeys/a')).toHaveLength(1));
    expect(screen.queryByRole('heading', {name: 'Passkeys'})).toBeNull();
  });
});

describe('BasePasskeys', () => {
  afterEach(() => {
    cleanup();
  });

  const renderBase = (props: Record<string, unknown>) =>
    render(
      <I18nProvider>
        <ThemeProvider>
          <BasePasskeys {...props} />
        </ThemeProvider>
      </I18nProvider>,
    );

  it('turns adding off with an explanation when the browser has no WebAuthn', () => {
    renderBase({onAdd: vi.fn(), passkeys: [], supported: false});

    expect(screen.queryByRole('button', {name: 'Add a passkey'})).toBeNull();
    expect(screen.getByText("This browser doesn't support passkeys.")).toBeTruthy();
  });

  it('offers no actions without handlers', () => {
    renderBase({passkeys: [{id: 'a', name: 'Work laptop'}]});

    expect(screen.queryByRole('button', {name: 'Add a passkey'})).toBeNull();
    expect(screen.queryByRole('button', {name: 'Remove'})).toBeNull();
  });

  it('caps the name at 64 characters', () => {
    renderBase({onAdd: vi.fn(), passkeys: []});

    fireEvent.click(screen.getByRole('button', {name: 'Add a passkey'}));

    expect(screen.getByLabelText('Name').getAttribute('maxlength')).toBe('64');
  });

  it('omits the heading and description when given empty strings', () => {
    renderBase({description: '', passkeys: [], title: ''});

    expect(screen.queryByRole('heading')).toBeNull();
  });
});
