// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {Mock, beforeEach, describe, expect, it, vi} from 'vitest';
import ThunderIDAPIError from '../../../errors/ThunderIDAPIError';
import deleteMePasskey from '../deleteMePasskey';
import finishMePasskeyRegistration from '../finishMePasskeyRegistration';
import getMePasskeys from '../getMePasskeys';
import startMePasskeyRegistration from '../startMePasskeyRegistration';

const BASE_URL = 'https://localhost:8090';

const respond = (status: number, body?: unknown): Mock =>
  vi.fn().mockResolvedValue({
    json: () => Promise.resolve(body),
    ok: status >= 200 && status < 300,
    status,
    statusText: '',
    text: () => Promise.resolve(body === undefined ? '' : JSON.stringify(body)),
  });

const lastCall = (fetcher: Mock): [string, RequestInit] => fetcher.mock.calls[0] as [string, RequestInit];

const CREDENTIAL = {
  id: 'cred-1',
  response: {attestationObject: 'att', clientDataJSON: 'cdj'},
  type: 'public-key',
};

describe('self-service passkey API', (): void => {
  beforeEach((): void => {
    vi.resetAllMocks();
  });

  it('lists the passkeys at /users/me/passkeys', async (): Promise<void> => {
    const fetcher: Mock = respond(200, {passkeys: [{id: 'cred-1', name: 'Work laptop'}]});

    const result = await getMePasskeys({baseUrl: BASE_URL, fetcher});

    expect(result).toEqual({passkeys: [{id: 'cred-1', name: 'Work laptop'}]});
    const [url, init] = lastCall(fetcher);
    expect(url).toBe(`${BASE_URL}/users/me/passkeys`);
    expect(init.method).toBe('GET');
  });

  it('starts adding a passkey with the relying party ID', async (): Promise<void> => {
    const fetcher: Mock = respond(200, {publicKeyCredentialCreationOptions: {challenge: 'abc'}, sessionToken: 'st'});

    const result = await startMePasskeyRegistration({baseUrl: BASE_URL, fetcher, relyingPartyId: 'localhost'});

    expect(result.sessionToken).toBe('st');
    const [url, init] = lastCall(fetcher);
    expect(url).toBe(`${BASE_URL}/users/me/passkeys/register/start`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({relyingPartyId: 'localhost'});
  });

  it('leaves the relying party ID to the server when none is given', async (): Promise<void> => {
    const fetcher: Mock = respond(200, {publicKeyCredentialCreationOptions: {}, sessionToken: 'st'});

    await startMePasskeyRegistration({baseUrl: BASE_URL, fetcher});

    expect(JSON.parse(lastCall(fetcher)[1].body as string)).toEqual({});
  });

  it('appends the register paths to an overridden collection URL', async (): Promise<void> => {
    const fetcher: Mock = respond(200, {publicKeyCredentialCreationOptions: {}, sessionToken: 'st'});

    await startMePasskeyRegistration({fetcher, url: 'https://rs.example.com/me/passkeys/'});

    expect(lastCall(fetcher)[0]).toBe('https://rs.example.com/me/passkeys/register/start');
  });

  it('finishes adding a passkey with the credential, session token and name', async (): Promise<void> => {
    const fetcher: Mock = respond(201, {id: 'cred-1', name: 'Work laptop'});

    const result = await finishMePasskeyRegistration({
      baseUrl: BASE_URL,
      credential: CREDENTIAL,
      fetcher,
      name: 'Work laptop',
      sessionToken: 'st',
    });

    expect(result).toEqual({id: 'cred-1', name: 'Work laptop'});
    const [url, init] = lastCall(fetcher);
    expect(url).toBe(`${BASE_URL}/users/me/passkeys/register/finish`);
    expect(JSON.parse(init.body as string)).toEqual({
      name: 'Work laptop',
      publicKeyCredential: CREDENTIAL,
      sessionToken: 'st',
    });
  });

  it('omits an empty name when finishing', async (): Promise<void> => {
    const fetcher: Mock = respond(201, {id: 'cred-1'});

    await finishMePasskeyRegistration({
      baseUrl: BASE_URL,
      credential: CREDENTIAL,
      fetcher,
      name: '',
      sessionToken: 'st',
    });

    expect(JSON.parse(lastCall(fetcher)[1].body as string)).not.toHaveProperty('name');
  });

  it('removes a passkey by its encoded ID', async (): Promise<void> => {
    const fetcher: Mock = respond(204);

    await expect(deleteMePasskey({baseUrl: BASE_URL, fetcher, passkeyId: 'a/b'})).resolves.toBeUndefined();

    const [url, init] = lastCall(fetcher);
    expect(url).toBe(`${BASE_URL}/users/me/passkeys/a%2Fb`);
    expect(init.method).toBe('DELETE');
  });

  it('raises a ThunderIDAPIError carrying the server error code', async (): Promise<void> => {
    const fetcher: Mock = respond(404, {code: 'PSK-1010', message: {defaultValue: 'Passkey not found', key: 'k'}});

    const error: unknown = await deleteMePasskey({baseUrl: BASE_URL, fetcher, passkeyId: 'gone'}).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(ThunderIDAPIError);
    expect((error as ThunderIDAPIError).statusCode).toBe(404);
    expect((error as ThunderIDAPIError).code).toBe('deleteMePasskey-NotFoundError-001');
    expect((error as ThunderIDAPIError).serverError?.code).toBe('PSK-1010');
  });

  it('rejects an invalid URL before sending anything', async (): Promise<void> => {
    const fetcher: Mock = respond(200, {passkeys: []});

    await expect(getMePasskeys({baseUrl: 'not a url', fetcher})).rejects.toBeInstanceOf(ThunderIDAPIError);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
