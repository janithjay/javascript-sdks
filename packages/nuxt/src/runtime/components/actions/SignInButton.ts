// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {navigateTo} from '#app';
import {ThunderIDRuntimeError} from '@thunderid/browser';
import {BaseSignInButton} from '@thunderid/vue';
import {type Component, type PropType, type Ref, type SetupContext, type VNode, defineComponent, h, ref} from 'vue';
import {useThunderID} from '#imports';

/**
 * Nuxt-specific SignInButton container.
 *
 * Mirrors the Next.js SDK's SignInButton: imports {@link BaseSignInButton} from
 * `@thunderid/vue` and wires navigation through Nuxt's `navigateTo` so
 * server-side redirects work correctly (no `window.location` access).
 *
 * The `signIn` action and `signInUrl` come from the Nuxt-specific
 * {@link useThunderID} composable which is provided via the Nuxt auto-import
 * layer — not directly from `@thunderid/vue`.
 *
 * @example
 * ```vue
 * <SignInButton />
 * <SignInButton class="btn-primary">Log in</SignInButton>
 * ```
 */
const SignInButton: Component = defineComponent({
  emits: ['click', 'error'],
  name: 'SignInButton',
  props: {
    signInOptions: {default: undefined, type: Object as PropType<Record<string, any>>},
  },
  setup(props: {signInOptions?: Record<string, any>}, {slots, emit, attrs}: SetupContext): () => VNode {
    const {signIn, signInUrl, signInOptions: contextSignInOptions} = useThunderID();
    const isLoading: Ref<boolean> = ref(false);

    const handleSignIn = async (e?: MouseEvent): Promise<void> => {
      try {
        isLoading.value = true;

        if (signInUrl) {
          // Use Nuxt's navigateTo — SSR-safe, works on both server and client.
          await navigateTo(signInUrl, {external: true});
        } else {
          await signIn(props.signInOptions ?? contextSignInOptions);
        }

        if (e) emit('click', e);
      } catch (error) {
        emit('error', error);
        throw new ThunderIDRuntimeError(
          `Sign in failed: ${error instanceof Error ? error.message : String(error)}`,
          'SignInButton-handleSignIn-RuntimeError-001',
          'nuxt',
          'Something went wrong while trying to sign in. Please try again later.',
        );
      } finally {
        isLoading.value = false;
      }
    };

    return (): VNode => {
      const slotContent: (() => VNode[]) | undefined = slots.default
        ? (): VNode[] => slots.default!({isLoading: isLoading.value})
        : undefined;

      return h(
        BaseSignInButton,
        {
          class: attrs.class,
          id: attrs.id,
          isLoading: isLoading.value,
          onClick: handleSignIn,
          style: attrs.style,
        },
        slotContent,
      );
    };
  },
});

export default SignInButton;
