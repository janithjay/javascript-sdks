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
  onBeforeUnmount,
  ref,
  watch,
} from 'vue';
import BasePasskeys from './BasePasskeys';
import useResourceMutation, {type ResourceMutationResult} from '../../../composables/management/useResourceMutation';
import useResourceQuery, {type ResourceQueryResult} from '../../../composables/management/useResourceQuery';
import useI18n from '../../../composables/useI18n';
import useThunderID from '../../../composables/useThunderID';
import {handlePasskeyRegistration} from '../../../utils/passkey';

const PASSKEYS_QUERY_KEY: readonly string[] = [UserQueryKeys.MY_PASSKEYS];

/**
 * How long a success message, or an error from adding or removing a passkey, stays before it clears.
 */
const MESSAGE_TIMEOUT_MS = 5000;

/**
 * A passkey the device created that has not been saved yet.
 */
interface PendingPasskey {
  credential: PasskeyRegistrationCredential;
  sessionToken: string;
}

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
 * `POST /users/me/passkeys/register/start` and asks the device to create the passkey, then saves it with
 * the name the user gives it at `POST /users/me/passkeys/register/finish`. Removing one, after a
 * confirmation, calls `DELETE /users/me/passkeys/{id}` and then tells the user's passkey provider through
 * the WebAuthn Signal API, where the browser supports it. Emits `add` with the new passkey and `remove`
 * with the removed passkey's ID. Pass a default scoped slot to replace the built-in UI while keeping the
 * data loading and actions.
 *
 * @example
 * ```vue
 * <Passkeys @add="(passkey) => toast(`Added ${passkey.name ?? 'a passkey'}`)" />
 * ```
 */
const Passkeys: Component = defineComponent({
  name: 'Passkeys',
  props: {
    /** Whether to show the passkeys as a bordered card. */
    cardLayout: {default: true, type: Boolean},
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
    const pending: Ref<PendingPasskey | null> = ref(null);
    const timers = new Map<Ref<string | null>, ReturnType<typeof setTimeout>>();

    // Clears a message a while after it is shown. A new message restarts the wait.
    const clearAfterTimeout = (message: Ref<string | null>): void => {
      watch(message, (key: string | null): void => {
        clearTimeout(timers.get(message));

        if (key) {
          timers.set(
            message,
            setTimeout(() => {
              message.value = null;
            }, MESSAGE_TIMEOUT_MS),
          );
        }
      });
    };

    clearAfterTimeout(successKey);
    clearAfterTimeout(actionErrorKey);

    onBeforeUnmount(() => timers.forEach((timer: ReturnType<typeof setTimeout>) => clearTimeout(timer)));

    const {
      data,
      error: loadError,
      isLoading,
    }: ResourceQueryResult<PasskeyListResponse> = useResourceQuery(
      () => PASSKEYS_QUERY_KEY,
      (fetcher: ApiFetcher) => getMePasskeys({baseUrl, fetcher, url}),
    );

    const create: ResourceMutationResult<PendingPasskey, void> = useResourceMutation(
      async (_: void, fetcher: ApiFetcher): Promise<PendingPasskey> => {
        const {publicKeyCredentialCreationOptions, sessionToken}: PasskeyRegistrationStartResponse =
          await startMePasskeyRegistration({baseUrl, fetcher, relyingPartyId: rpId.value, url});
        const credential: PasskeyRegistrationCredential = JSON.parse(
          await handlePasskeyRegistration(JSON.stringify(publicKeyCredentialCreationOptions)),
        ) as PasskeyRegistrationCredential;

        return {credential, sessionToken};
      },
      () => [],
    );

    const save: ResourceMutationResult<Passkey, {name: string; passkey: PendingPasskey}> = useResourceMutation(
      async ({name, passkey}: {name: string; passkey: PendingPasskey}, fetcher: ApiFetcher): Promise<Passkey> =>
        finishMePasskeyRegistration({baseUrl, fetcher, name, url, ...passkey}),
      () => [PASSKEYS_QUERY_KEY],
    );

    const remove: ResourceMutationResult<void, string> = useResourceMutation(
      async (passkeyId: string, fetcher: ApiFetcher): Promise<void> => {
        await deleteMePasskey({baseUrl, fetcher, passkeyId, url});
        await signalUnknownPasskey(rpId.value, passkeyId);
      },
      () => [PASSKEYS_QUERY_KEY],
    );

    async function handleAdd(): Promise<void> {
      actionErrorKey.value = null;
      successKey.value = null;

      try {
        pending.value = await create.mutateAsync();
      } catch (caughtError: unknown) {
        actionErrorKey.value = resolvePasskeyErrorKey(caughtError, 'user.passkeys.error.add');
      }
    }

    async function handleSave(name: string): Promise<void> {
      if (!pending.value) return;

      actionErrorKey.value = null;

      try {
        const passkey: Passkey = await save.mutateAsync({name: name.trim(), passkey: pending.value});

        pending.value = null;
        successKey.value = 'user.passkeys.add.success';
        emit('add', passkey);
      } catch (caughtError: unknown) {
        // The registration can't be finished once it fails, so drop it and show the error.
        pending.value = null;
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
          adding: create.isLoading.value,
          cardLayout: props.cardLayout,
          class: withVendorCSSClassPrefix('passkeys--styled'),
          className: props.className,
          description: props.description,
          error: errorKey.value ? t(errorKey.value) : null,
          loading: isLoading.value,
          naming: pending.value !== null && !save.isLoading.value,
          onAdd: (): void => {
            void handleAdd();
          },
          onRemove: (passkeyId: string): void => {
            void handleRemove(passkeyId);
          },
          onSave: (name: string): void => {
            void handleSave(name);
          },
          passkeys: data.value?.passkeys ?? [],
          preferences: resolvedPreferences.value,
          removingPasskeyId: removingPasskeyId.value,
          saving: save.isLoading.value,
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
