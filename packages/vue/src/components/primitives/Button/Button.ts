// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {withVendorCSSClassPrefix} from '@thunderid/browser';
import {type Component, type SetupContext, type VNode, defineComponent, h, type PropType} from 'vue';

type ButtonProps = Readonly<{
  color: 'primary' | 'secondary' | 'tertiary' | 'danger';
  disabled: boolean;
  endIcon: VNode | undefined;
  fullWidth: boolean;
  loading: boolean;
  size: 'small' | 'medium' | 'large';
  startIcon: VNode | undefined;
  type: 'button' | 'submit' | 'reset';
  variant: 'solid' | 'outline' | 'ghost' | 'text';
}>;

const Button: Component = defineComponent({
  name: 'Button',
  props: {
    color: {
      default: 'primary',
      type: String as PropType<'primary' | 'secondary' | 'tertiary' | 'danger'>,
    },
    disabled: {default: false, type: Boolean},
    endIcon: {default: undefined, type: Object as PropType<VNode>},
    fullWidth: {default: false, type: Boolean},
    loading: {default: false, type: Boolean},
    size: {
      default: 'medium',
      type: String as PropType<'small' | 'medium' | 'large'>,
    },
    startIcon: {default: undefined, type: Object as PropType<VNode>},
    type: {
      default: 'button',
      type: String as PropType<'button' | 'submit' | 'reset'>,
    },
    variant: {
      default: 'solid',
      type: String as PropType<'solid' | 'outline' | 'ghost' | 'text'>,
    },
  },
  emits: ['click'],
  setup(props: ButtonProps, {slots, emit, attrs}: SetupContext): () => VNode {
    return (): VNode => {
      const cssClass: string = [
        withVendorCSSClassPrefix('button'),
        withVendorCSSClassPrefix(`button--${props.variant}`),
        withVendorCSSClassPrefix(`button--${props.color}`),
        withVendorCSSClassPrefix(`button--${props.size}`),
        props.fullWidth ? withVendorCSSClassPrefix('button--full-width') : '',
        props.loading ? withVendorCSSClassPrefix('button--loading') : '',
        (attrs.class as string) || '',
      ]
        .filter(Boolean)
        .join(' ');

      return h(
        'button',
        {
          class: cssClass,
          disabled: props.disabled || props.loading,
          id: attrs['id'],
          onClick: (e: MouseEvent) => emit('click', e),
          style: attrs.style,
          type: props.type,
        },
        [
          props.startIcon
            ? h('span', {class: withVendorCSSClassPrefix('button__start-icon')}, [props.startIcon])
            : null,
          h('span', {class: withVendorCSSClassPrefix('button__content')}, slots['default']?.()),
          props.endIcon ? h('span', {class: withVendorCSSClassPrefix('button__end-icon')}, [props.endIcon]) : null,
          props.loading ? h('span', {'aria-hidden': 'true', class: withVendorCSSClassPrefix('button__spinner')}) : null,
        ],
      );
    };
  },
});

export default Button;
