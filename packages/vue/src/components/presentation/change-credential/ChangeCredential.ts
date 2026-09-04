// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {
  CredentialConstants,
  CredentialUpdateErrorResult,
  PasswordPolicy,
  Preferences,
  mapCredentialUpdateError,
  resolveChangeCredentialPolicy,
  resolveResourceEndpoint,
  supportsCredential,
  withVendorCSSClassPrefix,
} from '@thunderid/browser';
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
import BaseChangeCredential, {type ChangePasswordValues} from './BaseChangeCredential';
import updateMeCredentials from '../../../api/updateMeCredentials';
import useI18n from '../../../composables/useI18n';
import useThunderID from '../../../composables/useThunderID';
import useUser from '../../../composables/useUser';

/**
 * Title-cases a credential name for use as its default display name, e.g. `pin` -> `Pin`.
 */
const defaultDisplayName = (credentialName: string): string =>
  credentialName.charAt(0).toUpperCase() + credentialName.slice(1);

type ChangeCredentialProps = Readonly<{
  cardLayout: boolean;
  className: string;
  credentialDisplayName?: string;
  credentialName: string;
  policy?: PasswordPolicy;
  preferences?: Preferences;
  showRequirements: boolean;
}>;

const ChangeCredential: Component = defineComponent({
  name: 'ChangeCredential',
  props: {
    /** Whether to wrap the form in a bordered card. */
    cardLayout: {default: false, type: Boolean},
    /** Extra CSS class added to the root element. */
    className: {default: '', type: String},
    /**
     * The human-readable name of the credential, substituted into every default label,
     * placeholder and message. Defaults to `credentialName` title-cased (e.g. `pin` -> `Pin`).
     * Set this to a specific casing like `PIN`.
     */
    credentialDisplayName: {default: undefined, type: String},
    /**
     * The credential attribute this instance manages, any attribute the user's entity type
     * schema declares `credential: true` (for example `password` or `pin`). Defaults to
     * `password`. Render the component once per credential to let a user manage more than
     * one, for example `<ChangeCredential />` for the password and
     * `<ChangeCredential credential-name="pin" />` for a PIN.
     */
    credentialName: {default: CredentialConstants.PASSWORD, type: String},
    /** Explicit rules. When omitted, they are derived from the user schema. */
    policy: {default: undefined, type: Object as PropType<PasswordPolicy>},
    /** Component-level preferences to override global preferences. */
    preferences: {default: undefined, type: Object as PropType<Preferences>},
    /** Whether to render the live requirement checklist. */
    showRequirements: {default: true, type: Boolean},
  },
  emits: ['success'],
  setup(props: ChangeCredentialProps, {emit}: SetupContext): () => VNode {
    const {baseUrl, endpoints, instanceId, preferences: contextPreferences} = useThunderID();
    const {userSchema} = useUser();
    const {t} = useI18n();
    const resolvedDisplayName: ComputedRef<string> = computed(
      () => props.credentialDisplayName ?? defaultDisplayName(props.credentialName),
    );

    const resolvedPreferences = computed(() => ({
      ...contextPreferences,
      ...props.preferences,
      user: {
        ...contextPreferences?.user,
        ...props.preferences?.user,
      },
    }));

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
        await updateMeCredentials({
          baseUrl,
          instanceId,
          payload: {
            [props.credentialName]: {currentValue: currentPassword || undefined, newValue: newPassword},
          },
          url: resolveResourceEndpoint('usersMeCredentials', {endpoints}),
        });

        success.value = true;
        emit('success');
      } catch (caughtError: unknown) {
        const {field, message, messageKey}: CredentialUpdateErrorResult = mapCredentialUpdateError(caughtError);
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
        preferences: resolvedPreferences.value,
        showRequirements: props.showRequirements,
        success: success.value,
        t,
        unavailable: !supportsCredential(userSchema?.value, props.credentialName),
      });
  },
});

export default ChangeCredential;
