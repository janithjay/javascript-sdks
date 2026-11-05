// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {Passkey, Preferences, bem, withVendorCSSClassPrefix} from '@thunderid/browser';
import {
  type Component,
  type PropType,
  type Ref,
  type SetupContext,
  type VNode,
  defineComponent,
  h,
  nextTick,
  ref,
  useId,
  watch,
} from 'vue';
import useI18n from '../../../composables/useI18n';
import Alert from '../../primitives/Alert/Alert';
import Button from '../../primitives/Button/Button';
import {KeyRoundIcon, PlusIcon} from '../../primitives/Icons';
import Spinner from '../../primitives/Spinner/Spinner';
import TextField from '../../primitives/TextField/TextField';

/**
 * The longest passkey name the server accepts.
 */
const PASSKEY_NAME_MAX_LENGTH = 64;

/**
 * What `BasePasskeys` hands its default scoped slot, so the passkeys can be shown with any UI.
 * Removing through `onRemove` does not ask for confirmation, so a custom UI should.
 */
export interface BasePasskeysRenderProps {
  /** Whether a passkey is being added. */
  adding: boolean;
  error: string | null;
  /** The name to show for a passkey: its own, or a translated "Passkey" when it has none. */
  getDisplayName: (passkey: Passkey) => string;
  loading: boolean;
  /** Adds a passkey with an optional name. Undefined when adding is not offered. */
  onAdd?: (name: string) => void;
  /** Removes a passkey. Undefined when removing is not offered. */
  onRemove?: (passkeyId: string) => void;
  passkeys: Passkey[];
  /** The passkey whose removal is in flight. */
  removingPasskeyId: string | null;
  success: string | null;
  /** Whether this browser can create passkeys. */
  supported: boolean;
}

type BasePasskeysProps = Readonly<{
  adding: boolean;
  cardLayout: boolean;
  className: string;
  description?: string;
  error: string | null;
  loading: boolean;
  onAdd?: (name: string) => void;
  onRemove?: (passkeyId: string) => void;
  passkeys: Passkey[];
  preferences?: Preferences;
  removingPasskeyId: string | null;
  success: string | null;
  supported: boolean;
  t?: (key: string, params?: Record<string, string | number>) => string;
  title?: string;
}>;

const cls = (element?: string, modifier?: string): string =>
  withVendorCSSClassPrefix(bem('passkeys', element, modifier));

/**
 * Presentational list of the signed-in user's passkeys. A passkey can be added with an optional name,
 * and removed after an inline confirmation that warns when it is the last one.
 *
 * Holds no context and performs no network calls: it renders the passkeys it is given and reports an
 * add through `onAdd` and a confirmed remove through `onRemove`. Use `Passkeys` for the context-wired
 * variant. Pass a default scoped slot to replace the built-in UI.
 */
const BasePasskeys: Component = defineComponent({
  name: 'BasePasskeys',
  props: {
    /** Whether a passkey is being added. */
    adding: {default: false, type: Boolean},
    /** Whether to wrap the list in a bordered card. */
    cardLayout: {default: false, type: Boolean},
    /** Extra CSS class added to the root element. */
    className: {default: '', type: String},
    /** Overrides the default description under the heading. Pass an empty string to omit it. */
    description: {default: undefined, type: String},
    /** An error to show above the list, such as a failed load, add or remove. */
    error: {default: null, type: String as PropType<string | null>},
    /** Whether the passkeys are loading. */
    loading: {default: false, type: Boolean},
    /**
     * Called with the name the user typed, possibly empty, to add a passkey. The add button shows only
     * when this is set.
     */
    onAdd: {default: undefined, type: Function as PropType<(name: string) => void>},
    /**
     * Called with a passkey's ID once the user confirms removing it. The remove buttons show only when
     * this is set.
     */
    onRemove: {default: undefined, type: Function as PropType<(passkeyId: string) => void>},
    /** The passkeys to list. */
    passkeys: {default: () => [], type: Array as PropType<Passkey[]>},
    /** Component-level preferences to override global preferences. */
    preferences: {default: undefined, type: Object as PropType<Preferences>},
    /** The passkey whose removal is in flight. */
    removingPasskeyId: {default: null, type: String as PropType<string | null>},
    /** A message to show once an add or remove succeeds. A new message closes the add form. */
    success: {default: null, type: String as PropType<string | null>},
    /** Whether this browser can create passkeys. When `false`, adding is turned off with an explanation. */
    supported: {default: true, type: Boolean},
    /** Translation function, injected by the container so both variants resolve the same bundle. */
    t: {
      default: undefined,
      type: Function as PropType<(key: string, params?: Record<string, string | number>) => string>,
    },
    /** Overrides the default "Passkeys" heading. Pass an empty string to omit it. */
    title: {default: undefined, type: String},
  },
  setup(props: BasePasskeysProps, {slots}: SetupContext): () => VNode {
    const {t: fallbackT} = useI18n();
    const translate = (key: string, params?: Record<string, string | number>): string =>
      (props.t ?? fallbackT)(key, params);
    const idPrefix: string = useId();
    const nameFieldId = `${idPrefix}-name`;
    const cancelId = `${idPrefix}-cancel`;
    const addOpen: Ref<boolean> = ref(false);
    const name: Ref<string> = ref('');
    const confirming: Ref<string | null> = ref(null);
    const rootRef: Ref<HTMLElement | null> = ref(null);
    // The button that opened the confirmation, so focus can return to it once the confirmation closes.
    let openerId: string | null = null;

    const openerIdFor = (passkey: Passkey): string => `${idPrefix}-remove-${passkey.id}`;
    const getDisplayName = (passkey: Passkey): string => passkey.name ?? translate('user.passkeys.unnamed');

    // Close the add form once the container reports a success.
    watch(
      () => props.success,
      (message: string | null): void => {
        if (!message) return;

        addOpen.value = false;
        name.value = '';
      },
    );

    // Move focus into the add form when it opens, since the button that opened it is gone.
    watch(addOpen, async (open: boolean): Promise<void> => {
      if (!open) return;

      await nextTick();
      document.getElementById(nameFieldId)?.focus();
    });

    watch(confirming, async (value: string | null): Promise<void> => {
      await nextTick();

      if (value !== null) {
        document.getElementById(cancelId)?.focus();

        return;
      }

      if (!openerId) return;

      const opener: HTMLButtonElement | null = document.getElementById(openerId) as HTMLButtonElement | null;
      openerId = null;

      // The opener is gone once its passkey is removed, so fall back to the list.
      if (opener && !opener.disabled) {
        opener.focus();
      } else {
        rootRef.value?.focus();
      }
    });

    const handleAdd = (event: Event): void => {
      event.preventDefault();
      props.onAdd?.(name.value.trim());
    };

    const renderConfirm = (passkey: Passkey, displayName: string, busy: boolean): VNode =>
      h(
        'div',
        {'aria-label': translate('user.passkeys.remove.confirm.heading'), class: cls('confirm'), role: 'group'},
        [
          h('p', {class: cls('confirm-heading')}, translate('user.passkeys.remove.confirm.heading')),
          h(
            'p',
            {class: cls('confirm-message')},
            translate('user.passkeys.remove.confirm.description', {name: displayName}),
          ),
          props.passkeys.length === 1
            ? h(
                Alert,
                {class: cls('last-warning'), severity: 'warning'},
                {default: (): string[] => [translate('user.passkeys.remove.confirm.last')]},
              )
            : null,
          h('div', {class: [cls('confirm-actions'), cls('actions')].join(' ')}, [
            h(
              Button,
              {
                class: cls('cancel'),
                color: 'secondary',
                id: cancelId,
                onClick: (): void => {
                  confirming.value = null;
                },
                size: 'small',
                variant: 'outline',
              },
              {default: (): string[] => [translate('user.passkeys.cancel')]},
            ),
            h(
              Button,
              {
                class: cls('confirm-remove'),
                color: 'danger',
                disabled: busy,
                onClick: (): void => {
                  confirming.value = null;
                  props.onRemove?.(passkey.id);
                },
                size: 'small',
                variant: 'solid',
              },
              {default: (): string[] => [translate('user.passkeys.remove')]},
            ),
          ]),
        ],
      );

    const renderPasskey = (passkey: Passkey, busy: boolean): VNode => {
      const displayName: string = getDisplayName(passkey);

      return h('li', {class: cls('item'), key: passkey.id}, [
        h('div', {class: cls('item-row')}, [
          h('span', {'aria-hidden': 'true', class: cls('icon')}, [KeyRoundIcon()]),
          h('span', {class: cls('name'), title: displayName}, displayName),
          props.onRemove
            ? h(
                Button,
                {
                  class: cls('remove'),
                  color: 'secondary',
                  disabled: busy,
                  id: openerIdFor(passkey),
                  loading: props.removingPasskeyId === passkey.id,
                  onClick: (): void => {
                    openerId = openerIdFor(passkey);
                    confirming.value = passkey.id;
                  },
                  size: 'small',
                  variant: 'outline',
                },
                {default: (): string[] => [translate('user.passkeys.remove')]},
              )
            : null,
        ]),
        confirming.value === passkey.id ? renderConfirm(passkey, displayName, busy) : null,
      ]);
    };

    const renderAdd = (busy: boolean): VNode | null => {
      if (!props.onAdd) return null;

      if (!props.supported) {
        return h(
          Alert,
          {class: cls('unsupported'), severity: 'info'},
          {default: (): string[] => [translate('user.passkeys.error.unsupported')]},
        );
      }

      if (!addOpen.value) {
        return h('div', {class: [cls('add-actions'), cls('actions')].join(' ')}, [
          h(
            Button,
            {
              class: cls('add'),
              color: 'primary',
              disabled: busy,
              onClick: (): void => {
                addOpen.value = true;
              },
              startIcon: PlusIcon(),
              variant: 'outline',
            },
            {default: (): string[] => [translate('user.passkeys.add')]},
          ),
        ]);
      }

      return h('form', {class: cls('add-form'), novalidate: true, onSubmit: handleAdd}, [
        h(TextField, {
          autoComplete: 'off',
          disabled: props.adding,
          helperText: translate('user.passkeys.add.name.helper'),
          id: nameFieldId,
          label: translate('user.passkeys.add.name.label'),
          maxLength: PASSKEY_NAME_MAX_LENGTH,
          modelValue: name.value,
          name: 'passkeyName',
          'onUpdate:modelValue': (value: string): void => {
            name.value = value;
          },
          placeholder: translate('user.passkeys.add.name.placeholder'),
        }),
        h('div', {class: [cls('add-form-actions'), cls('actions')].join(' ')}, [
          h(
            Button,
            {
              class: cls('cancel'),
              color: 'secondary',
              disabled: props.adding,
              onClick: (): void => {
                addOpen.value = false;
                name.value = '';
              },
              variant: 'outline',
            },
            {default: (): string[] => [translate('user.passkeys.cancel')]},
          ),
          h(
            Button,
            {
              class: cls('continue'),
              color: 'primary',
              disabled: busy,
              loading: props.adding,
              type: 'submit',
              variant: 'solid',
            },
            {default: (): string[] => [translate('user.passkeys.add.continue')]},
          ),
        ]),
      ]);
    };

    return (): VNode => {
      if (slots['default']) {
        const renderProps: BasePasskeysRenderProps = {
          adding: props.adding,
          error: props.error,
          getDisplayName,
          loading: props.loading,
          onAdd: props.supported ? props.onAdd : undefined,
          onRemove: props.onRemove,
          passkeys: props.passkeys,
          removingPasskeyId: props.removingPasskeyId,
          success: props.success,
          supported: props.supported,
        };

        return h('div', {class: props.className}, slots['default'](renderProps));
      }

      const heading: string = props.title ?? translate('user.passkeys.heading');
      const subheading: string = props.description ?? translate('user.passkeys.description');
      const busy: boolean = props.adding || props.removingPasskeyId !== null;
      const rootClass: string = [cls(), props.cardLayout ? cls(undefined, 'card') : '', props.className]
        .filter(Boolean)
        .join(' ');

      return h('div', {'aria-busy': String(props.loading || busy), class: rootClass, ref: rootRef, tabindex: -1}, [
        heading || subheading
          ? h('div', {class: cls('header')}, [
              heading ? h('h3', {class: cls('heading')}, heading) : null,
              subheading ? h('p', {class: cls('description')}, subheading) : null,
            ])
          : null,

        props.error
          ? h(Alert, {class: cls('error'), severity: 'error'}, {default: (): string[] => [props.error!]})
          : null,

        props.success
          ? h(Alert, {class: cls('success'), severity: 'success'}, {default: (): string[] => [props.success!]})
          : null,

        props.loading && props.passkeys.length === 0
          ? h('div', {class: cls('loading')}, [h(Spinner, {size: 'medium'})])
          : null,

        !props.loading && props.passkeys.length === 0
          ? h('p', {class: cls('empty')}, translate('user.passkeys.empty'))
          : null,

        props.passkeys.length > 0
          ? h(
              'ul',
              {class: cls('list')},
              props.passkeys.map((passkey: Passkey) => renderPasskey(passkey, busy)),
            )
          : null,

        renderAdd(busy),
      ]);
    };
  },
});

export default BasePasskeys;
