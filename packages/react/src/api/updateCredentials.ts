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

import {
  HttpResponse,
  FetchHttpClient,
  HttpRequestConfig,
  updateCredentials as baseUpdateCredentials,
  UpdateCredentialsConfig as BaseUpdateCredentialsConfig,
} from '@thunderid/browser';

/**
 * Configuration for the updateCredentials request (React-specific)
 */
export interface UpdateCredentialsConfig extends Omit<BaseUpdateCredentialsConfig, 'fetcher'> {
  /**
   * Optional custom fetcher function. If not provided, the ThunderID SPA client's httpClient will be used
   * which is a wrapper around axios http.request
   */
  fetcher?: (url: string, config: RequestInit) => Promise<Response>;
  /**
   * Optional instance ID for multi-instance support. Defaults to 0.
   */
  instanceId?: number;
}

/**
 * Updates user credentials at the specified /users/me/update-credentials endpoint.
 * This function uses the ThunderID SPA client's httpClient by default, but allows for custom fetchers.
 *
 * @param config - Configuration object with URL, payload and optional request config.
 * @returns A promise that resolves when the credential update succeeds.
 * @example
 * ```typescript
 * // Using default ThunderID SPA client httpClient
 * await updateCredentials({
 *   url: "https://localhost:8090/users/me/update-credentials",
 *   payload: { password: "newPassword123!" }
 * });
 * ```
 */
const updateCredentials = async ({
  fetcher,
  instanceId = 0,
  ...requestConfig
}: UpdateCredentialsConfig): Promise<void> => {
  const defaultFetcher = async (url: string, config: RequestInit): Promise<Response> => {
    const httpClient: FetchHttpClient = FetchHttpClient.getInstance(instanceId);
    const response: HttpResponse<any> = await httpClient.request({
      data: config.body ? JSON.parse(config.body as string) : undefined,
      headers: config.headers as Record<string, string>,
      method: config.method || 'POST',
      url,
    } as HttpRequestConfig);

    return {
      json: () => Promise.resolve(response.data),
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      statusText: response.statusText || '',
      text: () => Promise.resolve(typeof response.data === 'string' ? response.data : JSON.stringify(response.data)),
    } as Response;
  };

  return baseUpdateCredentials({
    ...requestConfig,
    fetcher: fetcher || defaultFetcher,
  });
};

export default updateCredentials;
