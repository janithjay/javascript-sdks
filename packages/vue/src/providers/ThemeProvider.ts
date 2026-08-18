// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {
  Theme,
  ThemeConfig,
  ThemeMode,
  ThemePreferences,
  RecursivePartial,
  BrowserThemeDetection,
  DEFAULT_THEME,
  FlowMetaTheme,
  createTheme,
  detectThemeMode,
  createClassObserver,
  createMediaQueryListener,
} from '@thunderid/browser';
import {
  computed,
  defineComponent,
  h,
  inject,
  onBeforeUnmount,
  onMounted,
  provide,
  readonly,
  shallowReadonly,
  ref,
  watch,
  type Component,
  type PropType,
  type Ref,
  type SetupContext,
  type VNode,
} from 'vue';
import {FLOW_META_KEY, THEME_KEY} from '../keys';
import type {FlowMetaContextValue, ThemeContextValue} from '../models/contexts';
import buildThemeConfigFromFlowMeta from '../utils/buildThemeConfigFromFlowMeta';

/**
 * ThemeProvider manages theme state and provides it to child components via `useTheme()`.
 *
 * It supports:
 * - Fixed color schemes (`light` | `dark`)
 * - System preference detection (`system`)
 * - CSS-class-based detection (`class`)
 * - CSS variable injection onto `document.documentElement`
 *
 * @example
 * ```vue
 * <ThemeProvider mode="system">
 *   <App />
 * </ThemeProvider>
 * ```
 */
interface ThemeProviderProps {
  detection: BrowserThemeDetection;
  mode: ThemeMode | 'branding';
  theme: RecursivePartial<ThemeConfig> | undefined;
}

const ThemeProvider: Component = defineComponent({
  name: 'ThemeProvider',
  props: {
    /** Theme detection configuration (for 'class' or 'system' mode). */
    detection: {default: () => ({}), type: Object as PropType<BrowserThemeDetection>},
    /**
     * The theme mode:
     * - `'light'` | `'dark'`: Fixed color scheme.
     * - `'system'`: Follows OS preference.
     * - `'class'`: Detects theme from CSS classes on `<html>`.
     * - `'branding'`: Follows the active theme from branding preference.
     */
    mode: {
      default: DEFAULT_THEME as ThemeMode | 'branding',
      type: String as PropType<ThemeMode | 'branding'>,
    },
    /** Optional partial theme overrides applied on top of the resolved theme. */
    theme: {default: undefined, type: Object as PropType<RecursivePartial<ThemeConfig>>},
  },
  setup(props: ThemeProviderProps, {slots}: SetupContext): () => VNode {
    const flowMetaContext: FlowMetaContextValue | null = inject(FLOW_META_KEY, null);
    const flowMetaTheme: Ref<FlowMetaTheme | null> = computed<FlowMetaTheme | null>(
      () => flowMetaContext?.meta.value?.design?.theme ?? null,
    );

    const initColorScheme = (): 'light' | 'dark' => {
      if (props.mode === 'light' || props.mode === 'dark') return props.mode;
      if (props.mode === 'branding')
        return flowMetaTheme.value?.defaultColorScheme ?? detectThemeMode('system', props.detection);
      return detectThemeMode(props.mode as ThemeMode, props.detection);
    };

    const colorScheme: Ref<'light' | 'dark'> = ref(initColorScheme());

    // In 'branding' mode, sync the color scheme once the server's default arrives.
    watch(
      () => flowMetaTheme.value?.defaultColorScheme,
      (defaultColorScheme: 'light' | 'dark' | undefined): void => {
        if (props.mode === 'branding' && defaultColorScheme) {
          colorScheme.value = defaultColorScheme;
        }
      },
    );

    // Build the resolved ThemeConfig: flow meta base → user overrides on top.
    const finalThemeConfig: Ref<RecursivePartial<ThemeConfig> | undefined> = computed<
      RecursivePartial<ThemeConfig> | undefined
    >(() => {
      if (!flowMetaTheme.value) {
        return props.theme;
      }

      const metaConfig: RecursivePartial<ThemeConfig> = buildThemeConfigFromFlowMeta(
        flowMetaTheme.value,
        colorScheme.value,
      );

      if (!props.theme) {
        return metaConfig;
      }

      return {
        ...metaConfig,
        ...props.theme,
        borderRadius: {
          ...(metaConfig as any).borderRadius,
          ...(props.theme as any).borderRadius,
        },
        colors: {
          ...(metaConfig as any).colors,
          ...(props.theme as any).colors,
        },
        ...((metaConfig as any).typography || (props.theme as any).typography
          ? {
              typography: {
                ...(metaConfig as any).typography,
                ...(props.theme as any).typography,
              },
            }
          : {}),
      };
    });

    const resolvedTheme: Ref<Theme> = computed<Theme>(() =>
      createTheme(finalThemeConfig.value, colorScheme.value === 'dark'),
    );

    const direction: Ref<'ltr' | 'rtl'> = computed<'ltr' | 'rtl'>(
      () => ((finalThemeConfig.value as any)?.direction as 'ltr' | 'rtl') || 'ltr',
    );

    const toggleTheme = (): void => {
      colorScheme.value = colorScheme.value === 'light' ? 'dark' : 'light';
    };

    // Apply CSS variables to DOM
    const applyToDom = (theme: Theme): void => {
      if (typeof document === 'undefined') return;
      const root: HTMLElement = document.documentElement;
      // Use the pre-computed cssVariables map from createTheme() which contains
      // correctly-named CSS variables (e.g. --thunderid-color-primary-main).
      Object.entries(theme.cssVariables).forEach(([key, value]: [key: string, value: string]): void => {
        root.style.setProperty(key, value);
      });
    };

    watch(resolvedTheme, (theme: Theme): void => applyToDom(theme), {immediate: true});

    // Apply direction to document
    watch(
      direction,
      (dir: 'ltr' | 'rtl'): void => {
        if (typeof document !== 'undefined') {
          document.documentElement.dir = dir;
        }
      },
      {immediate: true},
    );

    // Set up automatic theme detection listeners
    let classObserver: MutationObserver | null = null;
    let mediaQuery: MediaQueryList | null = null;

    const handleThemeChange = (isDark: boolean): void => {
      colorScheme.value = isDark ? 'dark' : 'light';
    };

    onMounted((): void => {
      if (props.mode === 'branding') return;

      if (props.mode === 'class') {
        const targetElement: HTMLElement = (props.detection as any).targetElement || document.documentElement;
        if (targetElement) {
          classObserver = createClassObserver(targetElement, handleThemeChange, props.detection);
        }
      } else if (props.mode === 'system') {
        mediaQuery = createMediaQueryListener(handleThemeChange);
      }
    });

    onBeforeUnmount((): void => {
      if (classObserver) classObserver.disconnect();
      if (mediaQuery?.removeEventListener) {
        mediaQuery.removeEventListener('change', handleThemeChange as any);
      }
    });

    const context: ThemeContextValue = {
      colorScheme: readonly(colorScheme),
      direction: readonly(direction) as Readonly<Ref<'ltr' | 'rtl'>>,
      theme: shallowReadonly(resolvedTheme),
      toggleTheme,
    };

    provide(THEME_KEY, context);

    return () => h('div', {style: 'display:contents'}, slots['default']?.());
  },
});

export default ThemeProvider;
