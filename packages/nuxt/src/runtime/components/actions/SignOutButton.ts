// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ThunderIDRuntimeError} from '@thunderid/browser';
import {BaseSignOutButton} from '@thunderid/vue';
import {type Component, type Ref, type SetupContext, type VNode, defineComponent, h, ref} from 'vue';
import {useThunderID} from '#imports';

/**
 * Nuxt-specific SignOutButton container.
 *
 * Imports {@link BaseSignOutButton} from `@thunderid/vue` and wires the
 * `signOut` action through the Nuxt-specific {@link useThunderID} composable
 * (auto-import layer), which uses Nuxt's `navigateTo` instead of
 * `window.location`.
 *
 * @example
 * ```vue
 * <SignOutButton />
 * <SignOutButton class="btn-secondary">Sign out</SignOutButton>
 * ```
 */
const SignOutButton: Component = defineComponent({
  emits: ['click', 'error'],
  name: 'SignOutButton',
  setup(_: {}, {slots, emit, attrs}: SetupContext): () => VNode {
    const {signOut} = useThunderID();
    const isLoading: Ref<boolean> = ref(false);

    const handleSignOut = async (e?: MouseEvent): Promise<void> => {
      try {
        isLoading.value = true;
        // signOut comes from the Nuxt plugin's THUNDERID_KEY which uses navigateTo.
        await signOut();
        if (e) emit('click', e);
      } catch (error) {
        emit('error', error);
        throw new ThunderIDRuntimeError(
          `Sign out failed: ${error instanceof Error ? error.message : String(error)}`,
          'SignOutButton-handleSignOut-RuntimeError-001',
          'nuxt',
          'Something went wrong while trying to sign out. Please try again later.',
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
        BaseSignOutButton,
        {
          class: attrs.class,
          id: attrs.id,
          isLoading: isLoading.value,
          onClick: handleSignOut,
          style: attrs.style,
        },
        slotContent,
      );
    };
  },
});

export default SignOutButton;
