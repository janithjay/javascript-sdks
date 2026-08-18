// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {withVendorCSSClassPrefix} from '@thunderid/browser';
import {BaseUserProfile} from '@thunderid/vue';
import {type Component, type PropType, type SetupContext, type VNode, defineComponent, h} from 'vue';
import {useUser} from '#imports';

/**
 * Nuxt-specific UserProfile container.
 *
 * Reads user profile data from `useUser()` (Nuxt auto-import, re-exported
 * from `@thunderid/vue`) and delegates rendering to {@link BaseUserProfile}
 * from `@thunderid/vue`.
 *
 * Preserves the same prop/slot API as the Vue SDK's `UserProfile` component
 * so consumers don't need to change their templates.
 *
 * @example
 * ```vue
 * <UserProfile :editable="true" title="My Profile" />
 * ```
 */
const UserProfile: Component = defineComponent({
  name: 'UserProfile',
  props: {
    cardLayout: {default: true, type: Boolean},
    className: {default: '', type: String},
    editable: {default: true, type: Boolean},
    hideFields: {default: () => [], type: Array as PropType<string[]>},
    showFields: {default: () => [], type: Array as PropType<string[]>},
    title: {default: 'Profile', type: String},
  },
  setup(
    props: Readonly<{
      cardLayout: boolean;
      className: string;
      editable: boolean;
      hideFields: string[];
      showFields: string[];
      title: string;
    }>,
    {slots}: SetupContext,
  ): () => VNode {
    const {flattenedProfile, schemas, updateProfile} = useUser();

    return (): VNode =>
      h(
        BaseUserProfile,
        {
          cardLayout: props.cardLayout,
          class: withVendorCSSClassPrefix('user-profile--styled'),
          className: props.className,
          editable: props.editable,
          flattenedProfile: flattenedProfile?.value,
          hideFields: props.hideFields,
          onUpdate: updateProfile,
          schemas: schemas?.value,
          showFields: props.showFields,
          title: props.title,
        },
        slots,
      );
  },
});

export default UserProfile;
