// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {act, cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {ThunderIDRuntimeError} from '@thunderid/browser';
import {ReactNode} from 'react';
import {Mock, afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import I18nProvider from '../../../../contexts/I18n/I18nProvider';
import ThemeProvider from '../../../../contexts/Theme/ThemeProvider';
import ThunderIDContext, {ThunderIDContextProps} from '../../../../contexts/ThunderID/ThunderIDContext';
import BasePasskeys, {BasePasskeysRenderProps} from '../BasePasskeys';
import Passkeys from '../Passkeys';

const mockHandlePasskeyRegistration = vi.fn() as Mock;
const mockWebAuthnSupported = vi.fn() as Mock;

vi.mock('@thunderid/browser', async (importOriginal: () => Promise<Record<string, unknown>>) => ({
  ...(await importOriginal()),
  isWebAuthnSupported: (): unknown => mockWebAuthnSupported() as unknown,
}));

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
    mockWebAuthnSupported.mockReturnValue(true);
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

    expect(await screen.findByText('No passkeys yet.')).toBeTruthy();
  });

  it('adds a passkey, names it once the device creates it, and refreshes the list', async () => {
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
    expect(screen.getByText('No password to remember or type')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', {name: 'Continue'}));

    expect(await screen.findByText('Passkey created')).toBeTruthy();
    expect(callsTo('POST', '/users/me/passkeys/register/finish')).toHaveLength(0);
    expect(screen.getByRole('button', {name: 'Save'}).hasAttribute('disabled')).toBe(true);

    fireEvent.change(screen.getByLabelText('Passkey name'), {target: {value: '  Work laptop  '}});
    fireEvent.click(screen.getByRole('button', {name: 'Save'}));

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
    expect(screen.queryByLabelText('Passkey name')).toBeNull();
  });

  it('uses the relying party ID it is given, and saves without a name when naming is skipped', async () => {
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
    fireEvent.click(await screen.findByRole('button', {name: 'Skip'}));

    await screen.findByText('Passkey added.');
    expect(JSON.parse(callsTo('POST', '/users/me/passkeys/register/start')[0].body as string)).toEqual({
      relyingPartyId: 'example.com',
    });
    expect(callsTo('POST', '/users/me/passkeys/register/finish')[0].body as string).not.toContain('"name"');
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

    renderWithProviders(<Passkeys />);

    fireEvent.click(await screen.findByRole('button', {name: 'Add a passkey'}));
    fireEvent.click(screen.getByRole('button', {name: 'Continue'}));

    expect(await screen.findByText('Adding the passkey was cancelled or timed out.')).toBeTruthy();
    expect(screen.getByRole('button', {name: 'Continue'})).toBeTruthy();
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
      renderWithProviders(<Passkeys />);

      fireEvent.click(await screen.findByRole('button', {name: 'Add a passkey'}));
      fireEvent.click(screen.getByRole('button', {name: 'Continue'}));
      await screen.findByText('Adding the passkey was cancelled or timed out.');

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(screen.queryByText('Adding the passkey was cancelled or timed out.')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
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
    fireEvent.change(await screen.findByLabelText('Passkey name'), {target: {value: 'Work laptop'}});
    fireEvent.click(screen.getByRole('button', {name: 'Save'}));

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
      renderWithProviders(<Passkeys />);

      await screen.findByText('Work laptop');
      fireEvent.click(screen.getByRole('button', {name: 'Remove'}));
      fireEvent.click(screen.getByRole('button', {name: 'Remove'}));
      await screen.findByText('Passkey removed.');

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(screen.queryByText('Passkey removed.')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
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

  it('turns adding off with an explanation when the browser has no WebAuthn', async () => {
    mockWebAuthnSupported.mockReturnValue(false);
    route('GET', '/users/me/passkeys', {body: {passkeys: []}, status: 200});

    renderWithProviders(<Passkeys />);

    expect(await screen.findByText("This browser doesn't support passkeys.")).toBeTruthy();
    expect(screen.queryByRole('button', {name: 'Add a passkey'})).toBeNull();
  });

  it('caps the name at 64 characters', async () => {
    route('GET', '/users/me/passkeys', {body: {passkeys: []}, status: 200});
    route('POST', '/users/me/passkeys/register/start', {
      body: {publicKeyCredentialCreationOptions: {}, sessionToken: 'st'},
      status: 200,
    });
    mockHandlePasskeyRegistration.mockResolvedValue(JSON.stringify(CREDENTIAL));

    renderWithProviders(<Passkeys />);

    fireEvent.click(await screen.findByRole('button', {name: 'Add a passkey'}));
    fireEvent.click(screen.getByRole('button', {name: 'Continue'}));

    expect((await screen.findByLabelText('Passkey name')).getAttribute('maxlength')).toBe('64');
    expect(screen.getByText('0/64')).toBeTruthy();
  });

  it('waits on the device without a way to close the add panel', async () => {
    route('GET', '/users/me/passkeys', {body: {passkeys: []}, status: 200});
    route('POST', '/users/me/passkeys/register/start', {
      body: {publicKeyCredentialCreationOptions: {}, sessionToken: 'st'},
      status: 200,
    });
    mockHandlePasskeyRegistration.mockReturnValue(new Promise<string>(() => undefined));

    renderWithProviders(<Passkeys />);

    fireEvent.click(await screen.findByRole('button', {name: 'Add a passkey'}));
    fireEvent.click(screen.getByRole('button', {name: 'Continue'}));

    expect(await screen.findByText('Waiting for your device')).toBeTruthy();
    expect(screen.queryByRole('button', {name: 'Cancel'})).toBeNull();
  });

  it('confirms a removal in the passkey row and returns focus to the bin icon on cancel', async () => {
    route('GET', '/users/me/passkeys', {body: {passkeys: [{id: 'a', name: 'Work laptop'}]}, status: 200});

    renderWithProviders(<Passkeys />);

    fireEvent.click(await screen.findByRole('button', {name: 'Remove'}));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('group', {name: 'Remove passkey'})).toBeTruthy();

    fireEvent.click(screen.getByRole('button', {name: 'Cancel'}));

    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', {name: 'Remove'})));
  });

  it('returns focus to the add button when the add panel is cancelled', async () => {
    route('GET', '/users/me/passkeys', {body: {passkeys: []}, status: 200});

    renderWithProviders(<Passkeys />);

    fireEvent.click(await screen.findByRole('button', {name: 'Add a passkey'}));
    fireEvent.click(screen.getByRole('button', {name: 'Cancel'}));

    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', {name: 'Add a passkey'})));
  });

  it('omits the heading and description when given empty strings', async () => {
    route('GET', '/users/me/passkeys', {body: {passkeys: []}, status: 200});

    renderWithProviders(<Passkeys title="" description="" />);

    await screen.findByText('No passkeys yet.');
    expect(screen.queryByRole('heading')).toBeNull();
  });
});

describe('Passkeys with a custom render', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWebAuthnSupported.mockReturnValue(true);
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

  it('trims the name a custom render saves, and tells it the name limit', async () => {
    route('GET', '/users/me/passkeys', {body: {passkeys: []}, status: 200});
    route('POST', '/users/me/passkeys/register/start', {
      body: {publicKeyCredentialCreationOptions: {}, sessionToken: 'st'},
      status: 200,
    });
    route('POST', '/users/me/passkeys/register/finish', {body: {id: 'new-cred', name: 'Phone'}, status: 201});
    mockHandlePasskeyRegistration.mockResolvedValue(JSON.stringify(CREDENTIAL));

    renderWithProviders(
      <Passkeys>
        {({nameMaxLength, naming, onAdd, onSave}: BasePasskeysRenderProps) => (
          <>
            <span>limit {nameMaxLength}</span>
            <button type="button" onClick={onAdd}>
              Create
            </button>
            {naming && (
              <button type="button" onClick={() => onSave?.('  Phone  ')}>
                Name it
              </button>
            )}
          </>
        )}
      </Passkeys>,
    );

    expect(await screen.findByText('limit 64')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', {name: 'Create'}));
    fireEvent.click(await screen.findByRole('button', {name: 'Name it'}));

    await waitFor(() => expect(callsTo('POST', '/users/me/passkeys/register/finish')).toHaveLength(1));
    expect(
      (JSON.parse(callsTo('POST', '/users/me/passkeys/register/finish')[0].body as string) as {name?: string}).name,
    ).toBe('Phone');
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

  it('draws the passkeys it is given, with no provider or network', () => {
    renderBase({passkeys: [{id: 'a', name: 'Work laptop'}, {id: 'b'}]});

    expect(screen.getByText('Work laptop')).toBeTruthy();
    expect(screen.getByText('Passkey')).toBeTruthy();
  });

  it('offers no actions without handlers', () => {
    renderBase({passkeys: [{id: 'a', name: 'Work laptop'}]});

    expect(screen.queryByRole('button', {name: 'Add a passkey'})).toBeNull();
    expect(screen.queryByRole('button', {name: 'Remove'})).toBeNull();
  });

  it('shows the naming step when told, and saves without a name on skip', () => {
    const onSave: Mock = vi.fn();

    renderBase({naming: true, onAdd: vi.fn(), onSave, passkeys: []});

    expect(screen.getByText('0/64')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', {name: 'Skip'}));

    expect(onSave).toHaveBeenCalledWith('');
  });

  it('reports a removal only once it is confirmed', () => {
    const onRemove: Mock = vi.fn();

    renderBase({onRemove, passkeys: [{id: 'a', name: 'Work laptop'}]});

    fireEvent.click(screen.getByRole('button', {name: 'Remove'}));
    expect(onRemove).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', {name: 'Remove'}));
    expect(onRemove).toHaveBeenCalledWith('a');
  });
});
