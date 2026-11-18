// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {Passkey, Preferences, bem, withVendorCSSClassPrefix} from '@thunderid/browser';
import {
  type Component,
  type PropType,
  type Ref,
  type SetupContext,
  type VNode,
  computed,
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
import Card from '../../primitives/Card/Card';
import {CheckIcon, KeyRoundIcon, PlusIcon, TrashIcon} from '../../primitives/Icons';
import Spinner from '../../primitives/Spinner/Spinner';
import TextField from '../../primitives/TextField/TextField';

/**
 * The longest passkey name the server accepts.
 */
const PASSKEY_NAME_MAX_LENGTH = 64;

/**
 * The benefits listed when the user starts adding a passkey.
 */
const BENEFIT_KEYS: readonly string[] = ['user.passkeys.add.intro.no_password', 'user.passkeys.add.intro.phishing'];

/**
 * What `BasePasskeys` hands its default scoped slot, so the passkeys can be shown with any UI.
 * Removing through `onRemove` does not ask for confirmation, so a custom UI should.
 */
export interface BasePasskeysRenderProps {
  /** Whether the device is creating a passkey. */
  adding: boolean;
  error: string | null;
  /** The name to show for a passkey: its own, or a translated "Passkey" when it has none. */
  getDisplayName: (passkey: Passkey) => string;
  loading: boolean;
  /** The longest name the server accepts, for a custom name field. */
  nameMaxLength: number;
  /** Whether the device has created a passkey that is waiting for `onSave`. */
  naming: boolean;
  /** Asks the device to create a passkey. Undefined when adding is not offered. */
  onAdd?: () => void;
  /** Removes a passkey. Undefined when removing is not offered. */
  onRemove?: (passkeyId: string) => void;
  /**
   * Saves the passkey the device created. The name is trimmed, and an empty one saves the passkey without
   * a name.
   */
  onSave?: (name: string) => void;
  passkeys: Passkey[];
  /** The passkey whose removal is in flight. */
  removingPasskeyId: string | null;
  /** Whether the created passkey is being saved. */
  saving: boolean;
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
  naming: boolean;
  onAdd?: () => void;
  onRemove?: (passkeyId: string) => void;
  onSave?: (name: string) => void;
  passkeys: Passkey[];
  preferences?: Preferences;
  removingPasskeyId: string | null;
  saving: boolean;
  success: string | null;
  supported: boolean;
  t?: (key: string, params?: Record<string, string | number>) => string;
  title?: string;
}>;

const cls = (element?: string, modifier?: string): string =>
  withVendorCSSClassPrefix(bem('passkeys', element, modifier));

/**
 * Presentational card of the signed-in user's passkeys. Adding one walks through a panel in the card: an
 * introduction, a wait while the device creates the passkey, and a step to name it. Removing one asks
 * for confirmation in the passkey's row, with a warning when it is the last one.
 *
 * Holds no context and performs no network calls: it reports an add through `onAdd` and `onSave`, and a
 * confirmed remove through `onRemove`. Use `Passkeys` for the context-wired variant. Pass a default
 * scoped slot to replace the built-in UI.
 */
const BasePasskeys: Component = defineComponent({
  name: 'BasePasskeys',
  props: {
    /** Whether the device is creating a passkey. */
    adding: {default: false, type: Boolean},
    /** Whether to show the passkeys as a bordered card. */
    cardLayout: {default: true, type: Boolean},
    /** Extra CSS class added to the root element. */
    className: {default: '', type: String},
    /** Overrides the default description under the heading. Pass an empty string to omit it. */
    description: {default: undefined, type: String},
    /**
     * An error to show, such as a failed load, add or remove. It shows in the add panel while that is
     * open, and above the list otherwise.
     */
    error: {default: null, type: String as PropType<string | null>},
    /** Whether the passkeys are loading. */
    loading: {default: false, type: Boolean},
    /** Whether the device has created a passkey that is waiting for a name. */
    naming: {default: false, type: Boolean},
    /**
     * Called once the user continues past the introduction, to have the device create a passkey. The add
     * button shows only when this is set.
     */
    onAdd: {default: undefined, type: Function as PropType<() => void>},
    /**
     * Called with a passkey's ID once the user confirms removing it. The remove buttons show only when
     * this is set.
     */
    onRemove: {default: undefined, type: Function as PropType<(passkeyId: string) => void>},
    /**
     * Called with the name the user typed, or an empty string when they skip naming, to save the passkey
     * the device created.
     */
    onSave: {default: undefined, type: Function as PropType<(name: string) => void>},
    /** The passkeys to list. */
    passkeys: {default: () => [], type: Array as PropType<Passkey[]>},
    /** Component-level preferences to override global preferences. */
    preferences: {default: undefined, type: Object as PropType<Preferences>},
    /** The passkey whose removal is in flight. */
    removingPasskeyId: {default: null, type: String as PropType<string | null>},
    /** Whether the created passkey is being saved. */
    saving: {default: false, type: Boolean},
    /** A message to show once an add or remove succeeds. A new message closes the add panel. */
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
    const addOpen: Ref<boolean> = ref(false);
    const name: Ref<string> = ref('');
    const confirming: Ref<Passkey | null> = ref(null);
    const continueRef: Ref<{$el?: HTMLElement} | null> = ref(null);
    const cancelRemoveRef: Ref<{$el?: HTMLElement} | null> = ref(null);
    const addButtonId = `${idPrefix}-add`;
    const removeButtonId = (passkeyId: string): string => `${idPrefix}-remove-${passkeyId}`;

    // Focuses a control once the panel or confirmation that replaced it is gone.
    const returnFocusTo = async (id: string): Promise<void> => {
      await nextTick();
      document.getElementById(id)?.focus();
    };

    const getDisplayName = (passkey: Passkey): string => passkey.name ?? translate('user.passkeys.unnamed');

    // The add panel stays open while the device or the server is working, so the flow can't be lost.
    const addPanelOpen = computed((): boolean => addOpen.value || props.adding || props.naming || props.saving);

    // Close the add panel once the container reports a success.
    watch(
      () => props.success,
      (message: string | null): void => {
        if (!message) return;

        addOpen.value = false;
        name.value = '';
      },
    );

    // Return focus to the add button once the add panel closes, since the panel held it.
    watch(addPanelOpen, (open: boolean): void => {
      if (!open) void returnFocusTo(addButtonId);
    });

    // The add button is replaced by the panel, so move focus into it.
    watch(addOpen, async (open: boolean): Promise<void> => {
      if (!open) return;

      await nextTick();
      continueRef.value?.$el?.focus();
    });

    // Start on the safe choice when asked to confirm a removal.
    watch(confirming, async (passkey: Passkey | null): Promise<void> => {
      if (!passkey) return;

      await nextTick();
      cancelRemoveRef.value?.$el?.focus();
    });

    // Move focus into the name field once the device has created the passkey.
    watch(
      () => props.naming,
      async (naming: boolean): Promise<void> => {
        if (!naming) return;

        await nextTick();
        document.getElementById(nameFieldId)?.focus();
      },
    );

    const renderError = (): VNode | null =>
      props.error
        ? h(Alert, {class: cls('error'), severity: 'error'}, {default: (): string[] => [props.error!]})
        : null;

    const renderIntro = (): (VNode | null)[] => [
      h('span', {'aria-hidden': 'true', class: cls('panel-icon')}, [KeyRoundIcon()]),
      h('h4', {class: cls('panel-heading')}, translate('user.passkeys.add')),
      h('p', {class: cls('panel-text')}, translate('user.passkeys.add.intro.description')),
      h(
        'ul',
        {class: cls('benefits')},
        BENEFIT_KEYS.map((key: string) =>
          h('li', {class: cls('benefit'), key}, [
            h('span', {'aria-hidden': 'true', class: cls('benefit-icon')}, [CheckIcon()]),
            translate(key),
          ]),
        ),
      ),
      renderError(),
      h('div', {class: [cls('panel-actions'), cls('actions')].join(' ')}, [
        h(
          Button,
          {
            class: cls('cancel'),
            color: 'tertiary',
            onClick: (): void => {
              addOpen.value = false;
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
            onClick: (): void => props.onAdd?.(),
            ref: continueRef,
            variant: 'solid',
          },
          {default: (): string[] => [translate('user.passkeys.add.continue')]},
        ),
      ]),
    ];

    const renderWaiting = (): VNode[] => [
      h('div', {class: cls('waiting'), role: 'status'}, [
        h(Spinner, {size: 'large'}),
        h('h4', {class: cls('panel-heading')}, translate('user.passkeys.add.waiting.heading')),
        h('p', {class: cls('panel-text')}, translate('user.passkeys.add.waiting.description')),
      ]),
    ];

    const renderNaming = (): VNode[] => [
      h(
        'form',
        {
          class: cls('name-form'),
          novalidate: true,
          onSubmit: (event: Event): void => {
            event.preventDefault();

            if (name.value.trim()) props.onSave?.(name.value);
          },
        },
        [
          h('div', {class: cls('created')}, [
            h('span', {'aria-hidden': 'true', class: cls('created-icon')}, [CheckIcon()]),
            h('h4', {class: cls('panel-heading')}, translate('user.passkeys.add.created.heading')),
          ]),
          h('p', {class: cls('panel-text')}, translate('user.passkeys.add.created.description')),
          h(TextField, {
            autoComplete: 'off',
            disabled: props.saving,
            helperText: `${name.value.length}/${PASSKEY_NAME_MAX_LENGTH}`,
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
          renderError(),
          h('div', {class: [cls('panel-actions'), cls('actions')].join(' ')}, [
            h(
              Button,
              {
                class: cls('skip'),
                color: 'tertiary',
                disabled: props.saving,
                onClick: (): void => props.onSave?.(''),
                variant: 'outline',
              },
              {default: (): string[] => [translate('user.passkeys.add.skip')]},
            ),
            h(
              Button,
              {
                class: cls('save'),
                color: 'primary',
                disabled: props.saving || !name.value.trim(),
                loading: props.saving,
                type: 'submit',
                variant: 'solid',
              },
              {default: (): string[] => [translate('user.passkeys.add.save')]},
            ),
          ]),
        ],
      ),
    ];

    const renderAddPanel = (): VNode => {
      let step: (VNode | null)[] = renderIntro();

      if (props.naming || props.saving) {
        step = renderNaming();
      } else if (props.adding) {
        step = renderWaiting();
      }

      return h('section', {'aria-label': translate('user.passkeys.add'), class: cls('panel')}, step);
    };

    const renderRemoveConfirm = (passkey: Passkey): VNode =>
      h(
        'div',
        {'aria-label': translate('user.passkeys.remove.confirm.heading'), class: cls('confirm'), role: 'group'},
        [
          h(
            'p',
            {class: [cls('confirm-message'), cls('panel-text')].join(' ')},
            translate('user.passkeys.remove.confirm.description', {name: getDisplayName(passkey)}),
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
                color: 'tertiary',
                onClick: (): void => {
                  confirming.value = null;
                  void returnFocusTo(removeButtonId(passkey.id));
                },
                ref: cancelRemoveRef,
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
                onClick: (): void => {
                  confirming.value = null;
                  props.onRemove?.(passkey.id);
                },
                size: 'small',
                variant: 'outline',
              },
              {default: (): string[] => [translate('user.passkeys.remove')]},
            ),
          ]),
        ],
      );

    const renderPasskey = (passkey: Passkey, busy: boolean): VNode => {
      const displayName: string = getDisplayName(passkey);
      const nameId = `${idPrefix}-${passkey.id}`;
      const isConfirming: boolean = confirming.value?.id === passkey.id;

      return h('li', {class: cls('item'), key: passkey.id}, [
        h('div', {class: cls('item-row')}, [
          h('span', {'aria-hidden': 'true', class: cls('icon')}, [KeyRoundIcon()]),
          h('span', {class: cls('name'), id: nameId, title: displayName}, displayName),
          props.onRemove && !isConfirming
            ? h(Button, {
                'aria-describedby': nameId,
                'aria-label': translate('user.passkeys.remove'),
                class: cls('remove'),
                color: 'danger',
                disabled: busy || addPanelOpen.value || confirming.value !== null,
                id: removeButtonId(passkey.id),
                loading: props.removingPasskeyId === passkey.id,
                onClick: (): void => {
                  confirming.value = passkey;
                },
                size: 'small',
                startIcon: TrashIcon(),
                title: translate('user.passkeys.remove'),
                variant: 'ghost',
              })
            : null,
        ]),
        isConfirming ? renderRemoveConfirm(passkey) : null,
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

      if (addPanelOpen.value) return renderAddPanel();

      return h('div', {class: [cls('add-actions'), cls('actions')].join(' ')}, [
        h(
          Button,
          {
            class: cls('add'),
            color: 'primary',
            disabled: busy || confirming.value !== null,
            id: addButtonId,
            onClick: (): void => {
              addOpen.value = true;
            },
            startIcon: PlusIcon(),
            variant: 'outline',
          },
          {default: (): string[] => [translate('user.passkeys.add')]},
        ),
      ]);
    };

    return (): VNode => {
      if (slots['default']) {
        const renderProps: BasePasskeysRenderProps = {
          adding: props.adding,
          error: props.error,
          getDisplayName,
          loading: props.loading,
          nameMaxLength: PASSKEY_NAME_MAX_LENGTH,
          naming: props.naming,
          onAdd: props.supported ? props.onAdd : undefined,
          onRemove: props.onRemove,
          onSave: props.onSave,
          passkeys: props.passkeys,
          removingPasskeyId: props.removingPasskeyId,
          saving: props.saving,
          success: props.success,
          supported: props.supported,
        };

        return h('div', {class: props.className}, slots['default'](renderProps));
      }

      const heading: string = props.title ?? translate('user.passkeys.heading');
      const subheading: string = props.description ?? translate('user.passkeys.description');
      const busy: boolean = props.adding || props.naming || props.saving || props.removingPasskeyId !== null;
      const rootClass: string = [cls(), props.cardLayout ? cls(undefined, 'card') : '', props.className]
        .filter(Boolean)
        .join(' ');

      const children: (VNode | null)[] = [
        heading || subheading
          ? h('div', {class: cls('header')}, [
              heading ? h('h3', {class: cls('heading')}, heading) : null,
              subheading ? h('p', {class: cls('description')}, subheading) : null,
            ])
          : null,

        addPanelOpen.value ? null : renderError(),

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
      ];

      const rootProps: Record<string, unknown> = {'aria-busy': String(props.loading || busy), class: rootClass};

      if (props.cardLayout) {
        return h(Card, {...rootProps, variant: 'outlined'}, () => children);
      }

      return h('div', rootProps, children);
    };
  },
});

export default BasePasskeys;
