// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {mount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';
import Button from '../../../components/primitives/Button';

describe('Button', () => {
  it('takes the tertiary color for a neutral action, the same name as the React SDK uses', () => {
    const wrapper = mount(Button, {props: {color: 'tertiary', variant: 'outline'}, slots: {default: 'Cancel'}});

    expect(wrapper.classes()).toContain('thunderid-button--tertiary');
    expect(wrapper.classes()).toContain('thunderid-button--outline');
  });

  it('keeps the primary color by default', () => {
    const wrapper = mount(Button, {slots: {default: 'Save'}});

    expect(wrapper.classes()).toContain('thunderid-button--primary');
  });
});
