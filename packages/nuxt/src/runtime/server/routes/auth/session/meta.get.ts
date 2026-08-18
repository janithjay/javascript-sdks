// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {FlowMetaType, getFlowMeta, resolveResourceEndpoint} from '@thunderid/node';
import type {AuthClientConfig, FlowMetadataResponse} from '@thunderid/node';
import {defineEventHandler, getQuery} from 'h3';
import type {H3Event} from 'h3';
import ThunderIDNuxtClient from '../../../ThunderIDNuxtClient';
import type {ThunderIDNuxtConfig} from '../../../types';

/**
 * GET /api/auth/meta
 *
 * Fetches flow metadata (design config + i18n bundle) from the `GET /flow/meta` endpoint
 * server-side, so `FlowMetaProvider` never calls the ThunderID server's `baseUrl` directly from
 * the browser — that would be a cross-origin request requiring CORS to be configured on the
 * ThunderID server. Routing it through this same-origin route instead avoids that requirement
 * entirely, mirroring `getFlowMetaAction` in `@thunderid/nextjs`.
 *
 * Accepts an optional `?language=` query parameter, used by `FlowMetaProvider.switchLanguage()`.
 */
export default defineEventHandler(async (event: H3Event): Promise<FlowMetadataResponse> => {
  const client: ThunderIDNuxtClient = ThunderIDNuxtClient.getInstance();
  const configData: AuthClientConfig<ThunderIDNuxtConfig> = await client.getStorageManager().getConfigData();

  const query: Record<string, unknown> = getQuery(event);
  const language: string | undefined = typeof query.language === 'string' ? query.language : undefined;
  const applicationId: string | undefined = configData?.applicationId;

  return getFlowMeta({
    baseUrl: configData?.baseUrl,
    url: resolveResourceEndpoint('flowMeta', configData),
    ...(applicationId ? {id: applicationId, type: FlowMetaType.App} : {}),
    ...(language ? {language} : {}),
  });
});
