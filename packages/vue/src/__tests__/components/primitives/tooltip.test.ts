// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {mount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';
import {h, nextTick} from 'vue';
import Tooltip from '../../../components/primitives/Tooltip';
import injectStyles from '../../../styles/injectStyles';

const mountTooltip = (props: Record<string, unknown> = {}, attachTo?: HTMLElement) =>
  mount(Tooltip, {
    attachTo,
    props: {ariaLabel: 'Store', helperText: 'Store', position: 'top', ...props},
    slots: {default: () => h('img', {alt: 'Store', src: 'https://example.com/store.png'})},
  });

describe('Tooltip', () => {
  it('wraps its content without showing the tooltip until hovered', () => {
    const wrapper = mountTooltip();

    expect(wrapper.find('img').exists()).toBe(true);
    expect(wrapper.attributes('aria-label')).toBe('Store');
    expect(wrapper.attributes('tabindex')).toBe('0');
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false);
  });

  it('shows on hover and hides when the pointer leaves', async () => {
    const wrapper = mountTooltip();

    await wrapper.trigger('mouseenter');
    const tooltip = wrapper.find('[role="tooltip"]');
    expect(tooltip.text()).toBe('Store');
    expect(tooltip.classes()).toContain('thunderid-tooltip__box--top');
    expect(wrapper.attributes('aria-describedby')).toBe(tooltip.attributes('id'));

    await wrapper.trigger('mouseleave');
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false);
    expect(wrapper.attributes('aria-describedby')).toBeUndefined();
  });

  it('shows on keyboard focus, hides on Escape, and toggles on Enter', async () => {
    const wrapper = mountTooltip();

    await wrapper.trigger('focus');
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(true);

    await wrapper.trigger('keydown', {key: 'Escape'});
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false);

    await wrapper.trigger('keydown', {key: 'Enter'});
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(true);

    await wrapper.trigger('blur');
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false);
  });

  it('places itself against the viewport and closes on scroll', async () => {
    injectStyles();
    const wrapper = mountTooltip({}, document.body);

    await wrapper.trigger('mouseenter');
    const tooltip = wrapper.find('[role="tooltip"]').element as HTMLElement;
    expect(getComputedStyle(tooltip).position).toBe('fixed');
    expect(tooltip.style.transform).toBe('translate(-50%, -100%)');
    expect(tooltip.style.left).toMatch(/px$/);

    window.dispatchEvent(new Event('scroll'));
    await nextTick();
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it('shows nothing when there is no text', async () => {
    const wrapper = mountTooltip({helperText: ''});

    await wrapper.trigger('mouseenter');
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false);
  });
});
