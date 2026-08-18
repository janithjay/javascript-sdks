// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {withVendorCSSClassPrefix} from '@thunderid/browser';
import {type Component, type SetupContext, type VNode, defineComponent, h} from 'vue';

type CheckboxProps = Readonly<{
  disabled: boolean;
  error: string | undefined;
  label: string | undefined;
  modelValue: boolean;
  name: string | undefined;
  required: boolean;
}>;

const Checkbox: Component = defineComponent({
  name: 'Checkbox',
  props: {
    disabled: {default: false, type: Boolean},
    error: {default: undefined, type: String},
    label: {default: undefined, type: String},
    modelValue: {default: false, type: Boolean},
    name: {default: undefined, type: String},
    required: {default: false, type: Boolean},
  },
  emits: ['update:modelValue'],
  setup(props: CheckboxProps, {emit, attrs}: SetupContext): () => VNode {
    return (): VNode => {
      const wrapperClass: string = [
        withVendorCSSClassPrefix('checkbox'),
        props.error ? withVendorCSSClassPrefix('checkbox--error') : '',
        (attrs.class as string) || '',
      ]
        .filter(Boolean)
        .join(' ');

      return h('div', {class: wrapperClass, style: attrs.style}, [
        h('label', {class: withVendorCSSClassPrefix('checkbox__wrapper')}, [
          h('input', {
            checked: props.modelValue,
            class: withVendorCSSClassPrefix('checkbox__input'),
            'data-testid': attrs['data-testid'],
            disabled: props.disabled,
            id: props.name,
            name: props.name,
            onChange: (e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).checked),
            required: props.required,
            type: 'checkbox',
          }),
          props.label ? h('span', {class: withVendorCSSClassPrefix('checkbox__label')}, props.label) : null,
        ]),
        props.error ? h('span', {class: withVendorCSSClassPrefix('checkbox__error')}, props.error) : null,
      ]);
    };
  },
});

export default Checkbox;
