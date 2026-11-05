// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {
  type ApiFetcher,
  type Passkey,
  type PasskeyListResponse,
  type PasskeyRegistrationCredential,
  type PasskeyRegistrationStartResponse,
  Preferences,
  UserQueryKeys,
  deleteMePasskey,
  finishMePasskeyRegistration,
  getMePasskeys,
  isWebAuthnSupported,
  resolvePasskeyErrorKey,
  resolveResourceEndpoint,
  signalUnknownPasskey,
  startMePasskeyRegistration,
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
import BasePasskeys from './BasePasskeys';
import useResourceMutation, {type ResourceMutationResult} from '../../../composables/management/useResourceMutation';
import useResourceQuery, {type ResourceQueryResult} from '../../../composables/management/useResourceQuery';
import useI18n from '../../../composables/useI18n';
import useThunderID from '../../../composables/useThunderID';
import {handlePasskeyRegistration} from '../../../utils/passkey';

const PASSKEYS_QUERY_KEY: readonly string[] = [UserQueryKeys.MY_PASSKEYS];

type PasskeysProps = Readonly<{
  cardLayout: boolean;
  className: string;
  description?: string;
  preferences?: Preferences;
  relyingPartyId?: string;
  title?: string;
}>;

/**
 * Passkeys lets the signed-in user see, add and remove their own passkeys.
 *
 * It lists the passkeys at `GET /users/me/passkeys`. Adding one starts at
 * `POST /users/me/passkeys/register/start`, asks the device to create the passkey, and saves it with the
 * name the user typed at `POST /users/me/passkeys/register/finish`. Removing one, after an inline
 * confirmation, calls `DELETE /users/me/passkeys/{id}` and then tells the user's passkey provider through
 * the WebAuthn Signal API, where the browser supports it. Emits `add` with the new passkey and `remove`
 * with the removed passkey's ID. Pass a default scoped slot to replace the built-in UI while keeping the
 * data loading and actions.
 *
 * @example
 * ```vue
 * <Passkeys card-layout @add="(passkey) => toast(`Added ${passkey.name ?? 'a passkey'}`)" />
 * ```
 */
const Passkeys: Component = defineComponent({
  name: 'Passkeys',
  props: {
    /** Whether to wrap the list in a bordered card. */
    cardLayout: {default: false, type: Boolean},
    /** Extra CSS class added to the root element. */
    className: {default: '', type: String},
    /** Overrides the default description under the heading. Pass an empty string to omit it. */
    description: {default: undefined, type: String},
    /** Component-level preferences to override global preferences. */
    preferences: {default: undefined, type: Object as PropType<Preferences>},
    /**
     * The relying party ID to create passkeys for. Defaults to the page's host name. It must be the
     * passkey relying party ID of the application, or the host (or a parent domain of the host) of one
     * of its passkey origins.
     */
    relyingPartyId: {default: undefined, type: String},
    /** Overrides the default "Passkeys" heading. Pass an empty string to omit it. */
    title: {default: undefined, type: String},
  },
  emits: ['add', 'remove'],
  setup(props: PasskeysProps, {emit, slots}: SetupContext): () => VNode {
    const {baseUrl, endpoints, preferences: contextPreferences} = useThunderID();
    const {t} = useI18n();

    const resolvedPreferences = computed(() => ({
      ...contextPreferences,
      ...props.preferences,
      user: {
        ...contextPreferences?.user,
        ...props.preferences?.user,
      },
    }));

    const url: string | undefined = resolveResourceEndpoint('usersMePasskeys', {endpoints});
    const rpId: ComputedRef<string> = computed(() => props.relyingPartyId ?? window.location.hostname);
    const supported: boolean = isWebAuthnSupported();

    const actionErrorKey: Ref<string | null> = ref(null);
    const successKey: Ref<string | null> = ref(null);
    const removingPasskeyId: Ref<string | null> = ref(null);

    const {
      data,
      error: loadError,
      isLoading,
    }: ResourceQueryResult<PasskeyListResponse> = useResourceQuery(
      () => PASSKEYS_QUERY_KEY,
      (fetcher: ApiFetcher) => getMePasskeys({baseUrl, fetcher, url}),
    );

    const add: ResourceMutationResult<Passkey, string> = useResourceMutation(
      async (name: string, fetcher: ApiFetcher): Promise<Passkey> => {
        const {publicKeyCredentialCreationOptions, sessionToken}: PasskeyRegistrationStartResponse =
          await startMePasskeyRegistration({baseUrl, fetcher, relyingPartyId: rpId.value, url});
        const credential: PasskeyRegistrationCredential = JSON.parse(
          await handlePasskeyRegistration(JSON.stringify(publicKeyCredentialCreationOptions)),
        ) as PasskeyRegistrationCredential;

        return finishMePasskeyRegistration({baseUrl, credential, fetcher, name, sessionToken, url});
      },
      () => [PASSKEYS_QUERY_KEY],
    );

    const remove: ResourceMutationResult<void, string> = useResourceMutation(
      async (passkeyId: string, fetcher: ApiFetcher): Promise<void> => {
        await deleteMePasskey({baseUrl, fetcher, passkeyId, url});
        await signalUnknownPasskey(rpId.value, passkeyId);
      },
      () => [PASSKEYS_QUERY_KEY],
    );

    async function handleAdd(name: string): Promise<void> {
      actionErrorKey.value = null;
      successKey.value = null;

      try {
        const passkey: Passkey = await add.mutateAsync(name);

        successKey.value = 'user.passkeys.add.success';
        emit('add', passkey);
      } catch (caughtError: unknown) {
        actionErrorKey.value = resolvePasskeyErrorKey(caughtError, 'user.passkeys.error.add');
      }
    }

    async function handleRemove(passkeyId: string): Promise<void> {
      actionErrorKey.value = null;
      successKey.value = null;
      removingPasskeyId.value = passkeyId;

      try {
        await remove.mutateAsync(passkeyId);

        successKey.value = 'user.passkeys.remove.success';
        emit('remove', passkeyId);
      } catch (caughtError: unknown) {
        actionErrorKey.value = resolvePasskeyErrorKey(caughtError, 'user.passkeys.error.remove');
      } finally {
        removingPasskeyId.value = null;
      }
    }

    const errorKey: ComputedRef<string | null> = computed(() => {
      if (actionErrorKey.value) return actionErrorKey.value;

      return loadError.value ? resolvePasskeyErrorKey(loadError.value, 'user.passkeys.error.load') : null;
    });

    return (): VNode =>
      h(
        BasePasskeys,
        {
          adding: add.isLoading.value,
          cardLayout: props.cardLayout,
          class: withVendorCSSClassPrefix('passkeys--styled'),
          className: props.className,
          description: props.description,
          error: errorKey.value ? t(errorKey.value) : null,
          loading: isLoading.value,
          onAdd: (name: string): void => {
            void handleAdd(name);
          },
          onRemove: (passkeyId: string): void => {
            void handleRemove(passkeyId);
          },
          passkeys: data.value?.passkeys ?? [],
          preferences: resolvedPreferences.value,
          removingPasskeyId: removingPasskeyId.value,
          success: successKey.value ? t(successKey.value) : null,
          supported,
          t,
          title: props.title,
        },
        {...slots},
      );
  },
});

export default Passkeys;
