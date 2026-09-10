// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {
  CredentialConstants,
  ThunderIDAPIError,
  mapCredentialUpdateError,
  resolveChangeCredentialPolicy,
  supportsCredential,
  withVendorCSSClassPrefix,
  type CredentialUpdateErrorResult,
  type PasswordPolicy,
} from '@thunderid/browser';
import {BaseChangeCredential, type ChangePasswordValues} from '@thunderid/vue';
import {
  type Component,
  type ComputedRef,
  type PropType,
  type Ref,
  type SetupContext,
  type VNode,
  computed,
  defineComponent,
  h,
  ref,
} from 'vue';
import NuxtAPIRoutes from '../../constants/NuxtAPIRoutes';
import {useThunderIDI18n, useUser} from '#imports';

/**
 * Title-cases a credential name for use as its default display name, e.g. `pin` -> `Pin`.
 */
const defaultDisplayName = (credentialName: string): string =>
  credentialName.charAt(0).toUpperCase() + credentialName.slice(1);

/**
 * Nuxt-specific ChangeCredential container.
 *
 * Reads the credential schema from `useUser()` (Nuxt auto-import, re-exported from
 * `@thunderid/vue`), delegates rendering to {@link BaseChangeCredential} from
 * `@thunderid/vue`, and posts the write to the `NuxtAPIRoutes.USER_CREDENTIALS` Nitro
 * route so the access token never leaves the server. Mirrors the Vue SDK's
 * `ChangeCredential` prop/emit API.
 *
 * @example
 * ```vue
 * <ChangeCredential @success="onSuccess" />
 * <ChangeCredential credential-name="pin" credential-display-name="PIN" />
 * ```
 */
const ChangeCredential: Component = defineComponent({
  name: 'ChangeCredential',
  props: {
    cardLayout: {default: false, type: Boolean},
    className: {default: '', type: String},
    credentialDisplayName: {default: undefined, type: String},
    credentialName: {default: CredentialConstants.PASSWORD, type: String},
    policy: {default: undefined, type: Object as PropType<PasswordPolicy>},
    showRequirements: {default: true, type: Boolean},
  },
  emits: ['success'],
  setup(
    props: Readonly<{
      cardLayout: boolean;
      className: string;
      credentialDisplayName?: string;
      credentialName: string;
      policy?: PasswordPolicy;
      showRequirements: boolean;
    }>,
    {emit}: SetupContext,
  ): () => VNode {
    const {userSchema} = useUser();
    const {t} = useThunderIDI18n();

    const resolvedDisplayName: ComputedRef<string> = computed(
      () => props.credentialDisplayName ?? defaultDisplayName(props.credentialName),
    );

    const error: Ref<string | null> = ref<string | null>(null);
    const fieldErrors: Ref<Record<string, string>> = ref<Record<string, string>>({});
    const loading: Ref<boolean> = ref(false);
    const success: Ref<boolean> = ref(false);

    const resolvedPolicy: ComputedRef<PasswordPolicy> = computed(() =>
      resolveChangeCredentialPolicy(userSchema?.value, props.credentialName, props.policy),
    );

    async function handleSubmit({currentPassword, newPassword}: ChangePasswordValues): Promise<void> {
      error.value = null;
      fieldErrors.value = {};
      success.value = false;
      loading.value = true;

      try {
        await $fetch(NuxtAPIRoutes.USER_CREDENTIALS, {
          body: {
            payload: {[props.credentialName]: {currentValue: currentPassword || undefined, newValue: newPassword}},
          },
          method: 'POST',
        });

        success.value = true;
        emit('success');
      } catch (caughtError: unknown) {
        const status: number =
          typeof (caughtError as {statusCode?: number})?.statusCode === 'number'
            ? (caughtError as {statusCode: number}).statusCode
            : 0;
        const {field, message, messageKey}: CredentialUpdateErrorResult = mapCredentialUpdateError(
          new ThunderIDAPIError(
            caughtError instanceof Error ? caughtError.message : String(caughtError),
            'credentials.post-ResponseError-001',
            'nuxt',
            status,
          ),
        );
        const text: string =
          message ??
          t(messageKey, {
            credential: resolvedDisplayName.value,
            credentialLower: resolvedDisplayName.value.toLowerCase(),
          });

        if (field) {
          fieldErrors.value = {[field]: text};
        } else {
          error.value = text;
        }
      } finally {
        loading.value = false;
      }
    }

    return (): VNode =>
      h(BaseChangeCredential, {
        cardLayout: props.cardLayout,
        class: withVendorCSSClassPrefix('change-credential--styled'),
        className: props.className,
        credentialDisplayName: resolvedDisplayName.value,
        error: error.value,
        fieldErrors: fieldErrors.value,
        loading: loading.value,
        onSubmit: handleSubmit,
        policy: resolvedPolicy.value,
        showRequirements: props.showRequirements,
        success: success.value,
        t,
        unavailable: !supportsCredential(userSchema?.value, props.credentialName),
      });
  },
});

export default ChangeCredential;
