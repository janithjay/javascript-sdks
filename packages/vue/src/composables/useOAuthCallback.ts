// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {watch, type Ref} from 'vue';

export interface UseOAuthCallbackOptions {
  /** Current flowId from component state */
  currentFlowId: Ref<string | null>;

  /** SessionStorage key for flowId (defaults to 'thunderid_flow_id') */
  flowIdStorageKey?: string;

  /** Whether the component is initialized and ready to process OAuth callback */
  isInitialized: Ref<boolean>;

  /** Whether a submission is currently in progress */
  isSubmitting?: Ref<boolean>;

  /** Callback when OAuth flow completes successfully */
  onComplete?: () => void;

  /** Callback when OAuth flow encounters an error */
  onError?: (error: any) => void;

  /** Callback to handle flow response after submission */
  onFlowChange?: (response: any) => void;

  /** Callback to set loading state at the start of OAuth processing */
  onProcessingStart?: () => void;

  /** Function to submit OAuth code to the server */
  onSubmit: (payload: OAuthCallbackPayload) => Promise<any>;

  /** Mutable flag to track whether OAuth has already been processed */
  processedFlag?: {value: boolean};

  /** Additional handler for setting state (e.g., setFlowId) */
  setFlowId?: (flowId: string) => void;

  /**
   * Mutable flag for token validation tracking.
   * Used in AcceptInvite to coordinate between OAuth callback and token validation.
   */
  tokenValidationAttemptedFlag?: {value: boolean};
}

export interface OAuthCallbackPayload {
  flowId: string;
  inputs: {
    code: string;
    nonce?: string;
  };
}

function cleanupUrlParams(): void {
  if (typeof window === 'undefined') return;

  const url: URL = new URL(window.location.href);
  url.searchParams.delete('code');
  url.searchParams.delete('nonce');
  url.searchParams.delete('state');
  url.searchParams.delete('error');
  url.searchParams.delete('error_description');

  window.history.replaceState({}, '', url.toString());
}

/**
 * Processes OAuth callbacks by detecting auth code in URL, resolving flowId, and submitting to server.
 * Used by SignIn, SignUp, and AcceptInvite components.
 *
 * Vue composable equivalent of React's useOAuthCallback hook.
 */
export function useOAuthCallback({
  currentFlowId,
  flowIdStorageKey = 'thunderid_flow_id',
  isInitialized,
  isSubmitting,
  onComplete,
  onError,
  onFlowChange,
  onProcessingStart,
  onSubmit,
  processedFlag,
  setFlowId,
  tokenValidationAttemptedFlag,
}: UseOAuthCallbackOptions): void {
  const internalFlag: {value: boolean} = {value: false};
  const oauthCodeProcessedFlag: {value: boolean} = processedFlag ?? internalFlag;
  const tokenValidationFlag: {value: boolean} | undefined = tokenValidationAttemptedFlag;

  watch(
    () => [isInitialized.value, currentFlowId.value, isSubmitting?.value] as const,
    ([initialized, , submitting]: readonly [boolean, string | null, boolean | undefined]) => {
      if (!initialized || submitting) {
        return;
      }

      // SSR-safe: `window`/`sessionStorage` are unavailable server-side (e.g. during Nuxt's
      // SSR render pass). The real OAuth-callback processing only ever needs to happen once
      // mounted client-side, where the redirect actually lands.
      if (typeof window === 'undefined') {
        return;
      }

      const urlParams: URLSearchParams = new URLSearchParams(window.location.search);
      const code: string | null = urlParams.get('code');
      const nonce: string | null = urlParams.get('nonce');
      const state: string | null = urlParams.get('state');
      const flowIdFromUrl: string | null = urlParams.get('flowId');
      const error: string | null = urlParams.get('error');
      const errorDescription: string | null = urlParams.get('error_description');

      if (error) {
        oauthCodeProcessedFlag.value = true;
        if (tokenValidationFlag) {
          tokenValidationFlag.value = true;
        }
        onError?.(new Error(errorDescription || error || 'OAuth authentication failed'));
        cleanupUrlParams();
        return;
      }

      if (!code || oauthCodeProcessedFlag.value) {
        return;
      }

      if (tokenValidationFlag?.value) {
        return;
      }

      const storedFlowId: string | null = sessionStorage.getItem(flowIdStorageKey);
      const flowIdToUse: string | null = currentFlowId.value || storedFlowId || flowIdFromUrl || state || null;

      if (!flowIdToUse) {
        oauthCodeProcessedFlag.value = true;
        onError?.(new Error('Invalid flow. Missing flowId.'));
        cleanupUrlParams();
        return;
      }

      oauthCodeProcessedFlag.value = true;

      if (tokenValidationFlag) {
        tokenValidationFlag.value = true;
      }

      onProcessingStart?.();

      if (!currentFlowId.value && setFlowId) {
        setFlowId(flowIdToUse);
      }

      (async (): Promise<void> => {
        try {
          const payload: OAuthCallbackPayload = {
            flowId: flowIdToUse,
            inputs: {
              code,
              ...(nonce && {nonce}),
            },
          };

          const response: any = await onSubmit(payload);

          onFlowChange?.(response);

          if (response?.flowStatus === 'COMPLETE' || response?.status === 'COMPLETE') {
            onComplete?.();
          }

          if (response?.flowStatus === 'ERROR' || response?.status === 'ERROR') {
            onError?.(response);
          }

          cleanupUrlParams();
        } catch (err) {
          onError?.(err);
          cleanupUrlParams();
        }
      })();
    },
    {immediate: true},
  );
}
