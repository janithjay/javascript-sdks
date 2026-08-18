// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {type Component, type VNode, Fragment, defineComponent, h} from 'vue';
import {useThunderID} from '#imports';

/**
 * Nuxt-specific Loading control component.
 *
 * Renders its default slot while ThunderID is initialising. Renders the
 * `fallback` slot (if provided) once loading is complete.
 *
 * Uses `useThunderID()` from the Nuxt auto-import layer.
 *
 * @example
 * ```vue
 * <Loading>
 *   <Spinner />
 *   <template #fallback><NuxtPage /></template>
 * </Loading>
 * ```
 */
const Loading: Component = defineComponent({
  name: 'Loading',
  setup(_props: Record<string, unknown>, {slots}: {slots: any}): () => VNode | VNode[] | null {
    const {isLoading} = useThunderID();

    return (): VNode | VNode[] | null => {
      if (!isLoading.value) {
        const fallback: VNode[] | undefined = slots.fallback?.();
        return fallback ? h(Fragment, {}, fallback) : null;
      }

      const content: VNode[] | undefined = slots.default?.();
      return content ? h(Fragment, {}, content) : null;
    };
  },
});

export default Loading;
