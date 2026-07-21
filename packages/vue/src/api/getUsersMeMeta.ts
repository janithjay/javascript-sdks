/**
 * Copyright (c) 2026, WSO2 LLC. (https://www.wso2.com).
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
  FetchHttpClient,
  HttpRequestConfig,
  HttpResponse,
} from '@thunderid/browser';

export interface AttributeSchema {
  credential?: boolean;
  description?: string;
  displayName?: string;
  mutability?: string;
  readOnly?: boolean;
  regex?: string;
  required?: boolean;
  subAttributes?: AttributeSchema[];
  type?: string;
  unique?: boolean;
}

export interface GetUsersMeMetaConfig {
  baseUrl?: string;
  fetcher?: (url: string, config: RequestInit) => Promise<Response>;
  instanceId?: number;
  url?: string;
}

export interface UsersMeMetaResponse {
  schema?: Record<string, AttributeSchema>;
}

const getUsersMeMeta = async ({
  baseUrl,
  fetcher,
  instanceId = 0,
  url,
}: GetUsersMeMetaConfig): Promise<UsersMeMetaResponse> => {
  const targetUrl = url || `${baseUrl?.replace(/\/$/, '')}/users/me/meta`;

  const defaultFetcher = async (endpointUrl: string, config: RequestInit): Promise<Response> => {
    const httpClient: FetchHttpClient = FetchHttpClient.getInstance(instanceId);
    const response: HttpResponse<any> = await httpClient.request({
      headers: config.headers as Record<string, string>,
      method: config.method || 'GET',
      url: endpointUrl,
    } as HttpRequestConfig);

    return {
      json: () => Promise.resolve(response.data),
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      statusText: response.statusText || '',
      text: () => Promise.resolve(typeof response.data === 'string' ? response.data : JSON.stringify(response.data)),
    } as Response;
  };

  const activeFetcher = fetcher || defaultFetcher;
  const res = await activeFetcher(targetUrl, {method: 'GET'});

  if (!res.ok) {
    throw new Error(`Failed to fetch user schema metadata: ${res.statusText}`);
  }

  return res.json();
};

export default getUsersMeMeta;
