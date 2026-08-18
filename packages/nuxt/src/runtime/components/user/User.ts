// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {type Component, type VNode, Fragment, defineComponent, h} from 'vue';
import {useThunderID} from '#imports';

/**
 * Nuxt-specific User control component.
 *
 * Exposes the current authenticated user via a scoped slot. Renders the
 * `fallback` slot when no user is signed in.
 *
 * Uses `useThunderID()` from the Nuxt auto-import layer.
 *
 * @example
 * ```vue
 * <User>
 *   <template #default="{ user }">
 *     <p>Welcome, {{ user.givenName }}!</p>
 *   </template>
 *   <template #fallback><p>Not signed in.</p></template>
 * </User>
 * ```
 */
const User: Component = defineComponent({
  name: 'User',
  setup(_props: Record<string, unknown>, {slots}: {slots: any}): () => VNode | VNode[] | null {
    const {user} = useThunderID();

    return (): VNode | VNode[] | null => {
      if (!user.value) {
        const fallback: VNode[] | undefined = slots.fallback?.();
        return fallback ? h(Fragment, {}, fallback) : null;
      }

      const content: VNode[] | undefined = slots.default?.({user: user.value});
      return content ? h(Fragment, {}, content) : null;
    };
  },
});

export default User;
