// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

'use server';

import {FlowMetadataResponse, FlowMetaType, getFlowMeta, resolveResourceEndpoint} from '@thunderid/node';
import {ThunderIDNextConfig} from '../../models/config';
import logger from '../../utils/logger';
import getClient from '../getClient';

/**
 * Server Action that fetches `GET /flow/meta` server-side.
 *
 * `FlowMetaProvider` (from `@thunderid/react`) otherwise fetches this endpoint directly from the
 * browser against `baseUrl`, which requires the ThunderID server to allow CORS for the app's
 * origin. Routing it through this action instead means the browser never talks to `baseUrl`
 * directly — the request happens server-to-server, same as `signInAction`/`signUpAction`.
 *
 * @param language - Optional language override, used by `FlowMetaProvider.switchLanguage()`.
 */
const getFlowMetaAction = async (params?: {
  applicationId?: string;
  language?: string;
}): Promise<FlowMetadataResponse> => {
  const client = getClient();
  const config: ThunderIDNextConfig = await client.getConfiguration();

  const applicationId: string | undefined = params?.applicationId ?? config?.applicationId;

  try {
    return await getFlowMeta({
      baseUrl: config?.baseUrl,
      url: resolveResourceEndpoint('flowMeta', config),
      ...(applicationId ? {id: applicationId, type: FlowMetaType.App} : {}),
      ...(params?.language ? {language: params.language} : {}),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[getFlowMetaAction] Error fetching flow metadata: ${message}`);
    throw error;
  }
};

export default getFlowMetaAction;
