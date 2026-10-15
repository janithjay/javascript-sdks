// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

// Times read from the clock are shown to the minute, so a tick every few seconds keeps them current.
const CLOCK_TICK_MS = 10 * 1000;

const listeners: Set<() => void> = new Set<() => void>();
let now: number = Date.now();
let timer: ReturnType<typeof setInterval> | undefined;

/**
 * Subscribes to a clock shared by every caller, which ticks while anything is subscribed. One timer serves
 * all subscribers, and it stops when the last one unsubscribes.
 *
 * @param listener - Called on every tick
 * @returns A function that unsubscribes the listener
 */
export const subscribeToClock = (listener: () => void): (() => void) => {
  listeners.add(listener);
  if (!timer) {
    now = Date.now();
    timer = setInterval((): void => {
      now = Date.now();
      listeners.forEach((notify: () => void) => notify());
    }, CLOCK_TICK_MS);
  }
  return (): void => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearInterval(timer);
      timer = undefined;
    }
  };
};

/**
 * The time of the clock's last tick. While the clock is stopped, the time is brought up to date once it is
 * a tick old, so it is never stale and still reads the same on consecutive calls.
 *
 * @returns The time in milliseconds since the epoch
 */
export const getClockTime = (): number => {
  if (!timer && Date.now() - now >= CLOCK_TICK_MS) {
    now = Date.now();
  }
  return now;
};
