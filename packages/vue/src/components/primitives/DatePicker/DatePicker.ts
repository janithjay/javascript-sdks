// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {withVendorCSSClassPrefix} from '@thunderid/browser';
import {type Component, type SetupContext, type VNode, defineComponent, h} from 'vue';

type DatePickerProps = Readonly<{
  disabled: boolean;
  error: string | undefined;
  label: string | undefined;
  modelValue: string;
  name: string | undefined;
  placeholder: string | undefined;
  required: boolean;
}>;

const DatePicker: Component = defineComponent({
  name: 'DatePicker',
  props: {
    disabled: {default: false, type: Boolean},
    error: {default: undefined, type: String},
    label: {default: undefined, type: String},
    modelValue: {default: '', type: String},
    name: {default: undefined, type: String},
    placeholder: {default: undefined, type: String},
    required: {default: false, type: Boolean},
  },
  emits: ['update:modelValue'],
  setup(props: DatePickerProps, {emit, attrs}: SetupContext): () => VNode {
    return (): VNode => {
      const hasError = !!props.error;
      const wrapperClass: string = [
        withVendorCSSClassPrefix('date-picker'),
        hasError ? withVendorCSSClassPrefix('date-picker--error') : '',
        (attrs.class as string) || '',
      ]
        .filter(Boolean)
        .join(' ');

      return h('div', {class: wrapperClass, style: attrs.style}, [
        props.label
          ? h('label', {class: withVendorCSSClassPrefix('date-picker__label'), for: props.name}, [
              props.label,
              props.required ? h('span', {class: withVendorCSSClassPrefix('date-picker__required')}, ' *') : null,
            ])
          : null,
        h('input', {
          class: withVendorCSSClassPrefix('date-picker__input'),
          'data-testid': attrs['data-testid'],
          disabled: props.disabled,
          id: props.name,
          name: props.name,
          onInput: (e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).value),
          placeholder: props.placeholder,
          required: props.required,
          type: 'date',
          value: props.modelValue,
        }),
        hasError ? h('span', {class: withVendorCSSClassPrefix('date-picker__error')}, props.error) : null,
      ]);
    };
  },
});

export default DatePicker;
