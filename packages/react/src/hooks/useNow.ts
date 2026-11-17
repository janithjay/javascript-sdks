// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {getClockTime, subscribeToClock} from '@thunderid/browser';
import {useSyncExternalStore} from 'react';

/**
 * The current time from the clock shared by every live time on the page, so times shown relative to now
 * keep moving. A server render reads the same clock, which is up to date while it isn't ticking.
 *
 * @returns The time of the clock's last tick, in milliseconds since the epoch
 */
const useNow = (): number => useSyncExternalStore(subscribeToClock, getClockTime, getClockTime);

export default useNow;
