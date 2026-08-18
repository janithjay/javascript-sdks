// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {withVendorCSSClassPrefix} from '@thunderid/browser';
import {type Component, type Ref, type SetupContext, type VNode, defineComponent, h, nextTick, ref} from 'vue';

// Alphanumeric OTPs are minted from an uppercase charset, so the accepted characters are digits
// and uppercase letters only.
const NON_NUMERIC_OTP_CHARS = /[^0-9]/g;
const NON_ALPHANUMERIC_OTP_CHARS = /[^0-9A-Z]/g;

type OtpFieldProps = Readonly<{
  disabled: boolean;
  error: string | undefined;
  label: string | undefined;
  length: number;
  modelValue: string;
  name: string | undefined;
  numericOnly: boolean;
  required: boolean;
}>;

const OtpField: Component = defineComponent({
  name: 'OtpField',
  props: {
    disabled: {default: false, type: Boolean},
    error: {default: undefined, type: String},
    label: {default: undefined, type: String},
    length: {default: 6, type: Number},
    modelValue: {default: '', type: String},
    name: {default: undefined, type: String},
    numericOnly: {default: true, type: Boolean},
    required: {default: false, type: Boolean},
  },
  emits: ['update:modelValue'],
  setup(props: OtpFieldProps, {emit, attrs}: SetupContext): () => VNode {
    const inputRefs: Ref<HTMLInputElement[]> = ref<HTMLInputElement[]>([]);

    const setRef = (el: unknown, index: number): void => {
      if (el) inputRefs.value[index] = el as HTMLInputElement;
    };

    const handleInput = (index: number, e: Event): void => {
      const target: HTMLInputElement = e.target as HTMLInputElement;
      // Alphanumeric codes are minted from an uppercase charset and verified case-sensitively.
      const val: string = props.numericOnly
        ? target.value.replace(NON_NUMERIC_OTP_CHARS, '').slice(0, 1)
        : target.value.toUpperCase().replace(NON_ALPHANUMERIC_OTP_CHARS, '').slice(0, 1);
      target.value = val;

      const current: string[] = (props.modelValue || '').split('');
      while (current.length < props.length) current.push('');
      current[index] = val;
      emit('update:modelValue', current.join(''));

      if (val && index < props.length - 1) {
        nextTick(() => inputRefs.value[index + 1]?.focus());
      }
    };

    const handleKeydown = (index: number, e: KeyboardEvent): void => {
      if (e.key === 'Backspace' && !(e.target as HTMLInputElement).value && index > 0) {
        nextTick(() => inputRefs.value[index - 1]?.focus());
      }
    };

    const handlePaste = (index: number, e: ClipboardEvent): void => {
      e.preventDefault();
      const rawData: string = e.clipboardData?.getData('text') || '';
      const pasted: string = props.numericOnly
        ? rawData.replace(NON_NUMERIC_OTP_CHARS, '')
        : rawData.toUpperCase().replace(NON_ALPHANUMERIC_OTP_CHARS, '');

      if (!pasted) return;

      const current: string[] = (props.modelValue || '').split('');
      while (current.length < props.length) current.push('');

      let cursor: number = index;
      for (const char of pasted) {
        if (cursor >= props.length) break;
        current[cursor] = char;
        cursor += 1;
      }

      emit('update:modelValue', current.join(''));

      const nextIndex: number = Math.min(cursor, props.length - 1);
      nextTick(() => inputRefs.value[nextIndex]?.focus());
    };

    return (): VNode => {
      const digits: string[] = (props.modelValue || '').split('');
      while (digits.length < props.length) digits.push('');

      return h(
        'div',
        {
          class: [withVendorCSSClassPrefix('otp-field'), (attrs.class as string) || ''].filter(Boolean).join(' '),
          style: attrs.style,
        },
        [
          props.label
            ? h('label', {class: withVendorCSSClassPrefix('otp-field__label')}, [
                props.label,
                props.required ? h('span', {class: withVendorCSSClassPrefix('otp-field__required')}, ' *') : null,
              ])
            : null,
          h(
            'div',
            {class: withVendorCSSClassPrefix('otp-field__inputs')},
            Array.from({length: props.length}, (_: unknown, i: number) =>
              h('input', {
                'aria-label': `Digit ${i + 1}`,
                class: withVendorCSSClassPrefix('otp-field__digit'),
                disabled: props.disabled,
                inputmode: props.numericOnly ? 'numeric' : 'text',
                key: i,
                maxlength: 1,
                onInput: (e: Event) => handleInput(i, e),
                onKeydown: (e: KeyboardEvent) => handleKeydown(i, e),
                onPaste: (e: ClipboardEvent) => handlePaste(i, e),
                ref: (el: unknown) => setRef(el, i),
                type: 'text',
                value: digits[i],
              }),
            ),
          ),
          props.error ? h('span', {class: withVendorCSSClassPrefix('otp-field__error')}, props.error) : null,
        ],
      );
    };
  },
});

export default OtpField;
