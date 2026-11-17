// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {formatDuration} from '@thunderid/browser';
import {type Component, type PropType, type Ref, type VNode, defineComponent, h} from 'vue';
import useNow from '../../../composables/useNow';

type LiveAgoProps = Readonly<{
  locale: string;
  translate: (key: string, params?: Record<string, string | number>) => string;
  value: string;
}>;

/**
 * How long ago a timestamp was, to the minute, such as "5m ago", or "Just now" within the first minute.
 * It is its own component so that each clock tick re-renders only this line.
 */
const LiveAgo: Component = defineComponent({
  name: 'LiveAgo',
  props: {
    locale: {required: true, type: String},
    translate: {
      required: true,
      type: Function as PropType<(key: string, params?: Record<string, string | number>) => string>,
    },
    value: {required: true, type: String},
  },
  setup(props: LiveAgoProps): () => VNode {
    const now: Ref<number> = useNow();

    return (): VNode => {
      const seconds: number = Math.floor((now.value - new Date(props.value).getTime()) / 1000);
      return h(
        'span',
        {},
        seconds < 60
          ? props.translate('user.sessions.just_now')
          : props.translate('user.sessions.ago', {time: formatDuration(seconds, props.locale)}),
      );
    };
  },
});

export default LiveAgo;
