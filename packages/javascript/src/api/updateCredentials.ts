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

import ThunderIDAPIError from '../errors/ThunderIDAPIError';

/**
 * Configuration for the updateCredentials request
 */
export interface UpdateCredentialsConfig extends Omit<RequestInit, 'method' | 'body'> {
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
   * The credential payload object to send under `attributes` (e.g. { currentPassword: "oldPassword", password: "newPassword" })
   */
  payload: {
    currentPassword?: string;
    password: string;
    [key: string]: unknown;
  };
  /**
   * The absolute API endpoint.
   */
  url?: string;
}

/**
 * Updates user credentials at the specified /users/me/update-credentials endpoint.
 *
 * @param config - Configuration object with URL, payload and optional request config.
 * @returns A promise that resolves when the credential update succeeds.
 * @example
 * ```typescript
 * await updateCredentials({
 *   url: "https://localhost:8090/users/me/update-credentials",
 *   payload: { password: "newPassword123!" }
 * });
 * ```
 */
const updateCredentials = async ({
  url,
  baseUrl,
  payload,
  fetcher,
  ...requestConfig
}: UpdateCredentialsConfig): Promise<void> => {
  try {
    // eslint-disable-next-line no-new
    new URL((url ?? baseUrl)!);
  } catch (error) {
    throw new ThunderIDAPIError(
      `Invalid URL provided. ${error?.toString()}`,
      'updateCredentials-ValidationError-001',
      'javascript',
      400,
      'The provided `url` or `baseUrl` path does not adhere to the URL schema.',
    );
  }

  const data = {
    attributes: payload,
  };

  const fetchFn: typeof fetch = fetcher || fetch;
  const resolvedUrl: string = url ?? `${baseUrl?.replace(/\/$/, '')}/users/me/update-credentials`;

  const requestInit: RequestInit = {
    ...requestConfig,
    body: JSON.stringify(data),
    headers: {
      ...requestConfig.headers,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'POST',
  };

  try {
    const response: Response = await fetchFn(resolvedUrl, requestInit);

    if (!response?.ok) {
      const errorText: string = await response.text();
      let errorCode = 'updateCredentials-ResponseError-001';

      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson?.code) {
          errorCode = errorJson.code;
        }
      } catch {
        // ignore parse error
      }

      throw new ThunderIDAPIError(
        errorText,
        errorCode,
        'javascript',
        response.status,
        response.statusText,
      );
    }
  } catch (error) {
    if (error instanceof ThunderIDAPIError) {
      throw error;
    }

    throw new ThunderIDAPIError(
      (error as any)?.response?.data?.detail || 'An error occurred while updating credentials. Please try again.',
      'updateCredentials-NetworkError-001',
      'javascript',
      (error as any)?.data?.status,
      'Network Error',
    );
  }
};

export default updateCredentials;
