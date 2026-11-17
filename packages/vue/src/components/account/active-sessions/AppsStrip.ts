// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ResolvedLogo, SSOSessionParticipant, bem, resolveLogoUri, withVendorCSSClassPrefix} from '@thunderid/browser';
import {
  type Component,
  type PropType,
  type Ref,
  type VNode,
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue';
import {ChevronDownIcon} from '../../primitives/Icons';
import Tooltip from '../../primitives/Tooltip';

type AppsStripProps = Readonly<{
  participants: SSOSessionParticipant[];
  translate: (key: string, params?: Record<string, string | number>) => string;
}>;

const cls = (element?: string, modifier?: string): string =>
  withVendorCSSClassPrefix(bem('active-sessions', element, modifier));

// Up to two initials, the same as the React SDK's avatar.
const initials = (name: string): string =>
  name
    .split(' ')
    .map((part: string) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

/**
 * The applications of a session, as a strip of overlapping icons named by tooltips. When the icons don't
 * fit, the strip scrolls sideways, and each side that has more fades out and offers an arrow.
 */
const AppsStrip: Component = defineComponent({
  name: 'AppsStrip',
  props: {
    participants: {required: true, type: Array as PropType<SSOSessionParticipant[]>},
    translate: {
      required: true,
      type: Function as PropType<(key: string, params?: Record<string, string | number>) => string>,
    },
  },
  setup(props: AppsStripProps): () => VNode {
    const stripRef: Ref<HTMLUListElement | null> = ref(null);
    // Which sides of the strip have icons scrolled out of view.
    const overflow: Ref<{left: boolean; right: boolean}> = ref({left: false, right: false});
    // Logos that failed to load, so their applications fall back to their initials.
    const failedLogos: Ref<Set<string>> = ref(new Set());
    let observer: ResizeObserver | undefined;

    const updateOverflow = (): void => {
      const strip: HTMLUListElement | null = stripRef.value;
      if (!strip) {
        return;
      }
      // A pixel of slack absorbs the rounding of fractional scroll positions.
      overflow.value = {
        left: strip.scrollLeft > 1,
        right: strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 1,
      };
    };

    onMounted((): void => {
      updateOverflow();
      if (stripRef.value && typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(updateOverflow);
        observer.observe(stripRef.value);
      }
    });
    onBeforeUnmount((): void => observer?.disconnect());
    watch(
      () => props.participants.length,
      (): void => {
        requestAnimationFrame(updateOverflow);
      },
    );

    // Half the visible width, so the icons scrolled into view appear beside ones already seen.
    const scroll = (direction: 1 | -1): void => {
      const strip: HTMLUListElement | null = stripRef.value;
      strip?.scrollBy({behavior: 'smooth', left: (direction * strip.clientWidth) / 2});
    };

    const arrow = (direction: 1 | -1): VNode =>
      h(
        'button',
        {
          'aria-label': props.translate(
            direction < 0 ? 'user.sessions.applications.scroll_left' : 'user.sessions.applications.scroll_right',
          ),
          class: [cls('apps-scroll'), cls('apps-scroll', direction < 0 ? 'left' : 'right')],
          onClick: (): void => scroll(direction),
          type: 'button',
        },
        [ChevronDownIcon()],
      );

    const icon = (participant: SSOSessionParticipant, appLabel: string): VNode => {
      const logo: ResolvedLogo | undefined = participant.appLogoUrl
        ? resolveLogoUri(participant.appLogoUrl, appLabel)
        : undefined;

      if (logo?.kind === 'emoji') {
        return h('span', {'aria-hidden': 'true', class: `${cls('app-icon')} ${cls('app-icon', 'glyph')}`}, logo.glyph);
      }
      if (logo?.imgSrc && !failedLogos.value.has(logo.imgSrc)) {
        const src: string = logo.imgSrc;
        return h('img', {
          alt: appLabel,
          class: cls('app-icon'),
          onError: (): void => {
            failedLogos.value = new Set(failedLogos.value).add(src);
          },
          src,
        });
      }
      return h(
        'span',
        {'aria-hidden': 'true', class: `${cls('app-icon')} ${cls('app-icon', 'initial')}`},
        initials(appLabel),
      );
    };

    return (): VNode =>
      h('div', {class: cls('apps-strip')}, [
        overflow.value.left ? arrow(-1) : null,
        h(
          'ul',
          {
            'aria-label': props.translate('user.sessions.applications'),
            class: [
              cls('apps'),
              overflow.value.left ? cls('apps', 'fade-left') : '',
              overflow.value.right ? cls('apps', 'fade-right') : '',
            ],
            onScroll: updateOverflow,
            ref: stripRef,
          },
          props.participants.map((participant: SSOSessionParticipant) => {
            const appLabel: string = participant.appName ?? participant.appId;
            return h('li', {class: cls('app'), key: participant.appId}, [
              h(Tooltip, {ariaLabel: appLabel, helperText: appLabel, position: 'top'}, () =>
                icon(participant, appLabel),
              ),
            ]);
          }),
        ),
        overflow.value.right ? arrow(1) : null,
      ]);
  },
});

export default AppsStrip;
