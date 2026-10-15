// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {TooltipPlacement, TooltipPosition, bem, placeTooltip, withVendorCSSClassPrefix} from '@thunderid/browser';
import {
  type Component,
  type PropType,
  type Ref,
  type SetupContext,
  type VNode,
  defineComponent,
  h,
  onBeforeUnmount,
  ref,
  useId,
  watch,
} from 'vue';

type TooltipProps = Readonly<{
  ariaLabel: string;
  helperText: string;
  position: TooltipPosition;
}>;

/**
 * Wraps an element and shows `helperText` beside it while the element is hovered or focused.
 * Escape hides it, and Enter or Space toggles it.
 */
const Tooltip: Component = defineComponent({
  name: 'Tooltip',
  props: {
    ariaLabel: {default: undefined, type: String},
    helperText: {default: '', type: String},
    position: {default: 'bottom', type: String as PropType<TooltipPosition>},
  },
  setup(props: TooltipProps, {slots}: SetupContext): () => VNode {
    const isVisible = ref<boolean>(false);
    const placement: Ref<TooltipPlacement | undefined> = ref();
    const containerRef: Ref<HTMLElement | null> = ref(null);
    const tooltipId: string | undefined = useId();

    const show = (): void => {
      if (containerRef.value) {
        placement.value = placeTooltip(containerRef.value.getBoundingClientRect(), props.position);
      }
      isVisible.value = true;
    };
    const hide = (): void => {
      isVisible.value = false;
    };

    // A fixed tooltip would drift from its element on scroll, so it closes instead.
    watch(isVisible, (visible: boolean): void => {
      if (visible) {
        window.addEventListener('scroll', hide, true);
      } else {
        window.removeEventListener('scroll', hide, true);
      }
    });
    onBeforeUnmount((): void => window.removeEventListener('scroll', hide, true));

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && isVisible.value) {
        isVisible.value = false;
      }
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        if (isVisible.value) {
          hide();
        } else {
          show();
        }
      }
    };

    return (): VNode => {
      const showing: boolean = isVisible.value && !!props.helperText;
      return h(
        'div',
        {
          'aria-describedby': showing ? tooltipId : undefined,
          'aria-label': props.ariaLabel,
          class: withVendorCSSClassPrefix(bem('tooltip', 'container')),
          onBlur: hide,
          onFocus: show,
          onKeydown: handleKeyDown,
          onMouseenter: show,
          onMouseleave: hide,
          ref: containerRef,
          role: 'button',
          tabindex: 0,
        },
        [
          slots['default']?.(),
          showing
            ? h(
                'div',
                {
                  class: [
                    withVendorCSSClassPrefix(bem('tooltip', 'box')),
                    withVendorCSSClassPrefix(bem('tooltip', 'box', props.position)),
                  ],
                  id: tooltipId,
                  role: 'tooltip',
                  style: placement.value && {
                    left: `${placement.value.left}px`,
                    top: `${placement.value.top}px`,
                    transform: placement.value.transform,
                  },
                },
                [props.helperText, h('span', {class: withVendorCSSClassPrefix(bem('tooltip', 'arrow'))})],
              )
            : null,
        ],
      );
    };
  },
});

export default Tooltip;
