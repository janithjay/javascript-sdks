// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {type Component, type VNode, Fragment, defineComponent, h} from 'vue';
import {useThunderID} from '#imports';

/**
 * Nuxt-specific SignedOut control component.
 *
 * Renders its default slot only when the user is NOT authenticated. Renders
 * the `fallback` slot (if provided) when the user is already signed in.
 *
 * Uses `useThunderID()` from the Nuxt auto-import layer so it reads from the
 * THUNDERID_KEY context wired up by the Nuxt plugin.
 *
 * @example
 * ```vue
 * <SignedOut>
 *   <p>Please sign in.</p>
 *   <template #fallback><p>You are signed in.</p></template>
 * </SignedOut>
 * ```
 */
const SignedOut: Component = defineComponent({
  name: 'SignedOut',
  setup(_props: Record<string, unknown>, {slots}: {slots: any}): () => VNode | VNode[] | null {
    const {isSignedIn} = useThunderID();

    return (): VNode | VNode[] | null => {
      if (isSignedIn.value) {
        const fallback: VNode[] | undefined = slots.fallback?.();
        return fallback ? h(Fragment, {}, fallback) : null;
      }

      const content: VNode[] | undefined = slots.default?.();
      return content ? h(Fragment, {}, content) : null;
    };
  },
});

export default SignedOut;
