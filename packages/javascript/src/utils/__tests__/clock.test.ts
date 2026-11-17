// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {afterEach, describe, expect, it, vi} from 'vitest';
import {getClockTime, subscribeToClock} from '../clock';

describe('clock', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('runs one timer for every subscriber and stops it after the last one leaves', () => {
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');

    const unsubscribeFirst = subscribeToClock(() => undefined);
    const unsubscribeSecond = subscribeToClock(() => undefined);

    expect(setIntervalSpy).toHaveBeenCalledTimes(1);

    unsubscribeFirst();
    expect(clearIntervalSpy).not.toHaveBeenCalled();

    unsubscribeSecond();
    expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
  });

  it('brings a stopped clock up to date instead of reporting its last tick', () => {
    vi.useFakeTimers({now: new Date('2026-11-17T10:00:00Z')});
    subscribeToClock(() => undefined)();

    vi.setSystemTime(new Date('2026-11-17T11:00:00Z'));

    expect(getClockTime()).toBe(new Date('2026-11-17T11:00:00Z').getTime());
    expect(getClockTime()).toBe(getClockTime());
  });

  it('advances the time and notifies subscribers on each tick', () => {
    vi.useFakeTimers({now: new Date('2026-11-17T10:00:00Z')});
    const listener = vi.fn();
    const unsubscribe = subscribeToClock(listener);

    expect(getClockTime()).toBe(new Date('2026-11-17T10:00:00Z').getTime());

    vi.advanceTimersByTime(10 * 1000);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(getClockTime()).toBe(new Date('2026-11-17T10:00:10Z').getTime());
    unsubscribe();
  });
});
