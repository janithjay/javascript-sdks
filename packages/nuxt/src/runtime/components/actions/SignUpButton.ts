// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {navigateTo} from '#app';
import {ThunderIDRuntimeError} from '@thunderid/browser';
import {BaseSignUpButton} from '@thunderid/vue';
import {type Component, type Ref, type SetupContext, type VNode, defineComponent, h, ref} from 'vue';
import {useThunderID} from '#imports';

/**
 * Nuxt-specific SignUpButton container.
 *
 * Imports {@link BaseSignUpButton} from `@thunderid/vue` and wires navigation
 * through Nuxt's `navigateTo` so a configured `signUpUrl` is followed
 * SSR-safely instead of via `window.location`.
 *
 * @example
 * ```vue
 * <SignUpButton />
 * <SignUpButton class="btn-primary">Create account</SignUpButton>
 * ```
 */
const SignUpButton: Component = defineComponent({
  emits: ['click', 'error'],
  name: 'SignUpButton',
  setup(_: {}, {slots, emit, attrs}: SetupContext): () => VNode {
    const {signUp, signUpUrl} = useThunderID();
    const isLoading: Ref<boolean> = ref(false);

    const handleSignUp = async (e?: MouseEvent): Promise<void> => {
      try {
        isLoading.value = true;

        if (signUpUrl) {
          // Use Nuxt's navigateTo — SSR-safe, no window.location.
          await navigateTo(signUpUrl, {external: true});
        } else {
          await signUp();
        }

        if (e) emit('click', e);
      } catch (error) {
        emit('error', error);
        throw new ThunderIDRuntimeError(
          `Sign up failed: ${error instanceof Error ? error.message : String(error)}`,
          'SignUpButton-handleSignUp-RuntimeError-001',
          'nuxt',
          'Something went wrong while trying to sign up. Please try again later.',
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
        BaseSignUpButton,
        {
          class: attrs.class,
          id: attrs.id,
          isLoading: isLoading.value,
          onClick: handleSignUp,
          style: attrs.style,
        },
        slotContent,
      );
    };
  },
});

export default SignUpButton;
