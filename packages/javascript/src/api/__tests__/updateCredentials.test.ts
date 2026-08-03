/**
 * Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com).
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import {Mock, beforeEach, describe, expect, it, vi} from 'vitest';
import ThunderIDAPIError from '../../errors/ThunderIDAPIError';
import updateCredentials from '../updateCredentials';

describe('updateCredentials', (): void => {
  beforeEach((): void => {
    vi.resetAllMocks();
  });

  it('should update credentials successfully using default fetch', async (): Promise<void> => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      statusText: 'No Content',
      text: () => Promise.resolve(''),
    });

    const url = 'https://localhost:8090/users/me/update-credentials';
    const payload = {currentPassword: 'OldPassword123!', password: 'NewSecret123!'};

    await updateCredentials({payload, url});

    expect(fetch).toHaveBeenCalledTimes(1);
    const [calledUrl, init]: [string, RequestInit] = (fetch as unknown as Mock).mock.calls[0];

    expect(calledUrl).toBe(url);
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    expect((init.headers as Record<string, string>)['Accept']).toBe('application/json');

    const parsed = JSON.parse(init.body as string);
    expect(parsed.attributes).toEqual(payload);
  });

  it('should construct endpoint URL from baseUrl when url is omitted', async (): Promise<void> => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      statusText: 'No Content',
      text: () => Promise.resolve(''),
    });

    const baseUrl = 'https://localhost:8090';
    const payload = {password: 'NewSecret123!'};

    await updateCredentials({baseUrl, payload});

    expect(fetch).toHaveBeenCalledWith(`${baseUrl}/users/me/update-credentials`, expect.any(Object));
  });

  it('should handle trailing slash in baseUrl', async (): Promise<void> => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      statusText: 'No Content',
      text: () => Promise.resolve(''),
    });

    const baseUrl = 'https://localhost:8090/';
    const payload = {password: 'NewSecret123!'};

    await updateCredentials({baseUrl, payload});

    expect(fetch).toHaveBeenCalledWith('https://localhost:8090/users/me/update-credentials', expect.any(Object));
  });

  it('should throw ThunderIDAPIError when invalid URL is passed', async (): Promise<void> => {
    const payload = {password: 'NewSecret123!'};

    await expect(updateCredentials({payload, url: 'invalid-url'})).rejects.toThrow(ThunderIDAPIError);
  });

  it('should surface backend error message on non-ok response', async (): Promise<void> => {
    const backendError = {
      code: 'USR-1017',
      description: {
        defaultValue: 'At least one credential field must be provided',
        key: 'error.userservice.missing_credentials_description',
      },
      message: {
        defaultValue: 'Missing credentials',
        key: 'error.userservice.missing_credentials',
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: () => Promise.resolve(JSON.stringify(backendError)),
    });

    const url = 'https://localhost:8090/users/me/update-credentials';
    const payload = {password: ''};

    try {
      await updateCredentials({payload, url});
      expect.fail('Expected to throw ThunderIDAPIError');
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(ThunderIDAPIError);
      const apiErr = err as ThunderIDAPIError;
      expect(apiErr.code).toBe('USR-1017');
      expect(apiErr.message).toBe('Missing credentials');
      expect(apiErr.statusCode).toBe(400);
    }
  });

  it('should use custom fetcher function when provided', async (): Promise<void> => {
    const customFetcher = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      text: () => Promise.resolve(''),
    });

    const baseUrl = 'https://localhost:8090';
    const payload = {password: 'CustomFetcher123!'};

    await updateCredentials({baseUrl, fetcher: customFetcher, payload});

    expect(customFetcher).toHaveBeenCalledTimes(1);
    expect(customFetcher).toHaveBeenCalledWith(
      `${baseUrl}/users/me/update-credentials`,
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });
});
