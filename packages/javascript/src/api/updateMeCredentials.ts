// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import ThunderIDAPIError from '../errors/ThunderIDAPIError';

/**
 * One credential's current and new value in a self-service credential update.
 */
export interface CredentialUpdate {
  /**
   * The credential's existing value, verified before the write. Required once the
   * account already has a stored value for this credential. Omit it for a first-time
   * set, when the account has no stored value for this credential yet.
   */
  currentValue?: string;
  /**
   * The new value to set.
   */
  newValue: string;
}

/**
 * Configuration for the updateMeCredentials request
 */
export interface UpdateMeCredentialsConfig extends Omit<RequestInit, 'method' | 'body'> {
  /**
   * The base path of the API endpoint.
   */
  baseUrl?: string;
  /**
   * Optional custom fetcher function.
   * If not provided, native fetch will be used
   */
  fetcher?: (url: string, config: RequestInit) => Promise<Response>;
  /**
   * The credentials to update, keyed by credential name, whatever attribute the user's
   * entity type schema declares `credential: true` (for example `password` or `pin`).
   * One or more may be included in a single call; each is verified against its own
   * `currentValue` independently.
   */
  payload: Record<string, CredentialUpdate>;
  /**
   * The absolute API endpoint.
   */
  url?: string;
}

/**
 * Updates one or more of the signed-in user's credentials at the
 * /users/me/update-credentials endpoint.
 *
 * The endpoint responds with `204 No Content` on success, so this function resolves with
 * `void` rather than a parsed body.
 *
 * @param config - Configuration object with URL, payload and optional request config.
 * @returns A promise that resolves once the credentials have been updated.
 * @example
 * ```typescript
 * // Using default fetch
 * await updateMeCredentials({
 *   url: "https://localhost:8090/users/me/update-credentials",
 *   payload: {password: {currentValue: "0ldP@ssword!", newValue: "n3wP@ssword!"}}
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Using custom fetcher (e.g. an httpClient that attaches the access token)
 * await updateMeCredentials({
 *   baseUrl: "https://localhost:8090",
 *   payload: {password: {currentValue: "0ldP@ssword!", newValue: "n3wP@ssword!"}},
 *   fetcher: async (url, config) => {
 *     const response = await httpClient({url, method: config.method, headers: config.headers, data: config.body});
 *     return {
 *       ok: response.status >= 200 && response.status < 300,
 *       status: response.status,
 *       statusText: response.statusText,
 *       json: () => Promise.resolve(response.data),
 *       text: () => Promise.resolve(typeof response.data === 'string' ? response.data : JSON.stringify(response.data))
 *     } as Response;
 *   }
 * });
 * ```
 */
const updateMeCredentials = async ({
  url,
  baseUrl,
  payload,
  fetcher,
  ...requestConfig
}: UpdateMeCredentialsConfig): Promise<void> => {
  try {
    // eslint-disable-next-line no-new
    new URL((url ?? baseUrl)!);
  } catch (error) {
    throw new ThunderIDAPIError(
      `Invalid URL provided. ${error instanceof Error ? error.message : String(error)}`,
      'updateMeCredentials-ValidationError-001',
      'javascript',
      400,
      'The provided `url` or `baseUrl` path does not adhere to the URL schema.',
    );
  }

  const fetchFn: typeof fetch = fetcher ?? fetch;
  const resolvedUrl: string = url ?? `${baseUrl?.replace(/\/$/, '')}/users/me/update-credentials`;

  const requestInit: RequestInit = {
    ...requestConfig,
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      ...requestConfig.headers,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  };

  try {
    const response: Response = await fetchFn(resolvedUrl, requestInit);

    if (!response?.ok) {
      const errorText: string = await response.text();

      throw new ThunderIDAPIError(
        errorText,
        'updateMeCredentials-ResponseError-001',
        'javascript',
        response.status,
        response.statusText,
        'Failed to update user credentials',
      );
    }
  } catch (error) {
    if (error instanceof ThunderIDAPIError) {
      throw error;
    }

    throw new ThunderIDAPIError(
      `Network or parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'updateMeCredentials-NetworkError-001',
      'javascript',
      0,
      'Network Error',
    );
  }
};

export default updateMeCredentials;
