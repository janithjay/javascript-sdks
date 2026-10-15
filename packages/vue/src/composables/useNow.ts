// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {getClockTime, subscribeToClock} from '@thunderid/browser';
import {type Ref, onBeforeUnmount, onMounted, ref} from 'vue';

/**
 * The current time from the clock shared by every live time on the page, so times shown relative to now
 * keep moving.
 *
 * @returns The time of the clock's last tick, in milliseconds since the epoch
 */
const useNow = (): Ref<number> => {
  const now: Ref<number> = ref(getClockTime());
  let unsubscribe: (() => void) | undefined;

  onMounted((): void => {
    unsubscribe = subscribeToClock((): void => {
      now.value = getClockTime();
    });
    now.value = getClockTime();
  });
  onBeforeUnmount((): void => unsubscribe?.());

  return now;
};

export default useNow;
