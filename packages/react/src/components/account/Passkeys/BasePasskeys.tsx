// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {Passkey, Preferences, bem, withVendorCSSClassPrefix} from '@thunderid/browser';
import {
  ChangeEvent,
  FC,
  FormEvent,
  MouseEvent,
  ReactElement,
  ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import useStyles from './BasePasskeys.styles';
import useTheme from '../../../contexts/Theme/useTheme';
import useTranslation from '../../../hooks/useTranslation';
import {cx} from '../../../styles/emotion';
import AlertPrimitive from '../../primitives/Alert/Alert';
import Button from '../../primitives/Button/Button';
import KeyRound from '../../primitives/Icons/KeyRound';
import Plus from '../../primitives/Icons/Plus';
import Spinner from '../../primitives/Spinner/Spinner';
import TextField from '../../primitives/TextField/TextField';
import Typography from '../../primitives/Typography/Typography';

/**
 * The longest passkey name the server accepts.
 */
const PASSKEY_NAME_MAX_LENGTH = 64;

/**
 * What {@link BasePasskeys} hands its `children` render function, so the passkeys can be shown with any
 * UI. Removing through `onRemove` does not ask for confirmation, so a custom UI should.
 */
export interface BasePasskeysRenderProps {
  /**
   * Whether a passkey is being added.
   */
  adding: boolean;
  error: string | null;
  /**
   * The name to show for a passkey: its own, or a translated "Passkey" when it has none.
   */
  getDisplayName: (passkey: Passkey) => string;
  loading: boolean;
  /**
   * Adds a passkey with an optional name. Undefined when adding is not offered.
   */
  onAdd?: (name: string) => void;
  /**
   * Removes a passkey. Undefined when removing is not offered.
   */
  onRemove?: (passkeyId: string) => void;
  passkeys: Passkey[];
  /**
   * The passkey whose removal is in flight.
   */
  removingPasskeyId: string | null;
  success: string | null;
  /**
   * Whether this browser can create passkeys.
   */
  supported: boolean;
}

export interface BasePasskeysProps {
  /**
   * Whether a passkey is being added.
   */
  adding?: boolean;
  /**
   * Whether to wrap the list in a bordered card.
   */
  cardLayout?: boolean;
  /**
   * Renders custom UI in place of the default list. Receives the passkeys, the loading, error and success
   * state, and the add and remove handlers.
   */
  children?: (props: BasePasskeysRenderProps) => ReactNode;
  /**
   * Additional CSS class names for the root element.
   */
  className?: string;
  /**
   * Overrides the default description under the heading. Pass an empty string to omit it.
   */
  description?: string;
  /**
   * An error to show above the list, such as a failed load, add or remove.
   */
  error?: string | null;
  /**
   * Whether the passkeys are loading.
   */
  loading?: boolean;
  /**
   * Called with the name the user typed, possibly empty, to add a passkey. The add button shows only
   * when this is set.
   */
  onAdd?: (name: string) => void;
  /**
   * Called with a passkey's ID once the user confirms removing it. The remove buttons show only when
   * this is set.
   */
  onRemove?: (passkeyId: string) => void;
  /**
   * The passkeys to list.
   */
  passkeys?: Passkey[];
  /**
   * Component-level preference overrides, including i18n.
   */
  preferences?: Preferences;
  /**
   * The passkey whose removal is in flight.
   */
  removingPasskeyId?: string | null;
  /**
   * A message to show once an add or remove succeeds. A new message closes the add form.
   */
  success?: string | null;
  /**
   * Whether this browser can create passkeys. When `false`, adding is turned off with an explanation.
   * @default true
   */
  supported?: boolean;
  /**
   * Overrides the default "Passkeys" heading. Pass an empty string to omit it.
   */
  title?: string;
}

const cls = (element?: string, modifier?: string): string =>
  withVendorCSSClassPrefix(bem('passkeys', element, modifier));

/**
 * Presentational list of the signed-in user's passkeys. A passkey can be added with an optional name,
 * and removed after an inline confirmation that warns when it is the last one.
 *
 * Holds no context and performs no network calls: it renders the passkeys it is given and reports an
 * add through `onAdd` and a confirmed remove through `onRemove`. Use {@link Passkeys} for the
 * context-wired variant.
 *
 * @example
 * ```tsx
 * <BasePasskeys passkeys={passkeys} onAdd={(name) => add(name)} onRemove={(id) => remove(id)} />
 * ```
 */
const BasePasskeys: FC<BasePasskeysProps> = ({
  adding = false,
  cardLayout = false,
  children = undefined,
  className = '',
  description = undefined,
  error = null,
  loading = false,
  onAdd = undefined,
  onRemove = undefined,
  passkeys = [],
  preferences = undefined,
  removingPasskeyId = null,
  success = null,
  supported = true,
  title = undefined,
}: BasePasskeysProps) => {
  const {theme, colorScheme}: ReturnType<typeof useTheme> = useTheme();
  const styles: Record<string, string> = useStyles(theme, colorScheme);
  const {t} = useTranslation(preferences?.i18n);
  const idPrefix: string = useId();
  const nameFieldId = `${idPrefix}-name`;
  const [addOpen, setAddOpen] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [confirming, setConfirming] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  // The button that opened the confirmation, so focus can return to it once the confirmation closes.
  const openerRef = useRef<HTMLButtonElement | null>(null);

  // Close the add form once the container reports a success. Adjusting state during render is React's
  // documented way to reset on a prop change, and avoids the extra commit an effect would cause.
  const [prevSuccess, setPrevSuccess] = useState<string | null>(success);

  if (success !== prevSuccess) {
    setPrevSuccess(success);

    if (success) {
      setAddOpen(false);
      setName('');
    }
  }

  // Move focus into the add form when it opens, since the button that opened it is gone.
  useEffect(() => {
    if (addOpen) {
      document.getElementById(nameFieldId)?.focus();
    }
  }, [addOpen, nameFieldId]);

  useEffect(() => {
    if (confirming !== null) {
      cancelRef.current?.focus();

      return;
    }

    const opener: HTMLButtonElement | null = openerRef.current;

    if (!opener) {
      return;
    }

    openerRef.current = null;

    // The opener is gone once its passkey is removed, so fall back to the list.
    if (opener.isConnected && !opener.disabled) {
      opener.focus();
    } else {
      rootRef.current?.focus();
    }
  }, [confirming]);

  const getDisplayName = (passkey: Passkey): string => passkey.name ?? t('user.passkeys.unnamed');

  if (children) {
    return (
      <>
        {children({
          adding,
          error,
          getDisplayName,
          loading,
          onAdd: supported ? onAdd : undefined,
          onRemove,
          passkeys,
          removingPasskeyId,
          success,
          supported,
        })}
      </>
    );
  }

  const heading: string = title ?? t('user.passkeys.heading');
  const subheading: string = description ?? t('user.passkeys.description');
  const busy: boolean = adding || removingPasskeyId !== null;

  const handleAdd = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onAdd?.(name.trim());
  };

  const renderConfirm = (passkey: Passkey, displayName: string): ReactElement => (
    <div
      role="group"
      aria-label={t('user.passkeys.remove.confirm.heading')}
      className={cx(cls('confirm'), styles['confirm'])}
    >
      <Typography
        variant="body2"
        component="p"
        fontWeight="semibold"
        className={cx(cls('confirm-heading'), styles['confirmText'])}
      >
        {t('user.passkeys.remove.confirm.heading')}
      </Typography>
      <Typography
        variant="body2"
        component="p"
        color="textSecondary"
        className={cx(cls('confirm-message'), styles['confirmText'])}
      >
        {t('user.passkeys.remove.confirm.description', {name: displayName})}
      </Typography>
      {passkeys.length === 1 && (
        <AlertPrimitive variant="warning" className={cx(cls('last-warning'), styles['alert'])}>
          <AlertPrimitive.Description>{t('user.passkeys.remove.confirm.last')}</AlertPrimitive.Description>
        </AlertPrimitive>
      )}
      <div className={cx(cls('confirm-actions'), styles['actions'])}>
        <Button
          ref={cancelRef}
          type="button"
          size="small"
          color="secondary"
          variant="outline"
          className={cls('cancel')}
          onClick={(): void => setConfirming(null)}
        >
          {t('user.passkeys.cancel')}
        </Button>
        <Button
          type="button"
          size="small"
          color="error"
          variant="solid"
          className={cls('confirm-remove')}
          disabled={busy}
          onClick={(): void => {
            setConfirming(null);
            onRemove?.(passkey.id);
          }}
        >
          {t('user.passkeys.remove')}
        </Button>
      </div>
    </div>
  );

  const renderPasskey = (passkey: Passkey): ReactElement => {
    const nameId = `${idPrefix}-${passkey.id}`;
    const displayName: string = getDisplayName(passkey);

    return (
      <li key={passkey.id} className={cx(cls('item'), styles['item'])}>
        <div className={cx(cls('item-row'), styles['itemRow'])}>
          <span aria-hidden="true" className={cx(cls('icon'), styles['icon'])}>
            <KeyRound width={18} height={18} />
          </span>
          <Typography
            id={nameId}
            variant="body1"
            component="span"
            fontWeight="semibold"
            className={cx(cls('name'), styles['name'])}
          >
            {displayName}
          </Typography>
          {onRemove && (
            <Button
              type="button"
              size="small"
              color="secondary"
              variant="outline"
              className={cls('remove')}
              aria-describedby={nameId}
              aria-expanded={confirming === passkey.id}
              loading={removingPasskeyId === passkey.id}
              disabled={busy}
              onClick={(event: MouseEvent<HTMLButtonElement>): void => {
                openerRef.current = event.currentTarget;
                setConfirming(passkey.id);
              }}
            >
              {t('user.passkeys.remove')}
            </Button>
          )}
        </div>
        {confirming === passkey.id && renderConfirm(passkey, displayName)}
      </li>
    );
  };

  const renderAdd = (): ReactElement | null => {
    if (!onAdd) {
      return null;
    }

    if (!supported) {
      return (
        <AlertPrimitive variant="info" className={cx(cls('unsupported'), styles['alert'])}>
          <AlertPrimitive.Description>{t('user.passkeys.error.unsupported')}</AlertPrimitive.Description>
        </AlertPrimitive>
      );
    }

    if (!addOpen) {
      return (
        <div className={cx(cls('add-actions'), styles['actions'])}>
          <Button
            type="button"
            color="primary"
            variant="outline"
            className={cls('add')}
            startIcon={<Plus width={16} height={16} />}
            disabled={busy}
            onClick={(): void => setAddOpen(true)}
          >
            {t('user.passkeys.add')}
          </Button>
        </div>
      );
    }

    return (
      <form noValidate onSubmit={handleAdd} className={cx(cls('add-form'), styles['addForm'])}>
        <TextField
          name="passkeyName"
          autoComplete="off"
          id={nameFieldId}
          label={t('user.passkeys.add.name.label')}
          placeholder={t('user.passkeys.add.name.placeholder')}
          helperText={t('user.passkeys.add.name.helper')}
          maxLength={PASSKEY_NAME_MAX_LENGTH}
          value={name}
          disabled={adding}
          onChange={(event: ChangeEvent<HTMLInputElement>): void => setName(event.target.value)}
        />
        <div className={cx(cls('add-form-actions'), styles['actions'])}>
          <Button
            type="button"
            color="secondary"
            variant="outline"
            className={cls('cancel')}
            disabled={adding}
            onClick={(): void => {
              setAddOpen(false);
              setName('');
            }}
          >
            {t('user.passkeys.cancel')}
          </Button>
          <Button
            type="submit"
            color="primary"
            variant="solid"
            className={cls('continue')}
            loading={adding}
            disabled={busy}
          >
            {t('user.passkeys.add.continue')}
          </Button>
        </div>
      </form>
    );
  };

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      aria-busy={loading || busy}
      className={cx(cls(), styles['root'], cardLayout ? styles['card'] : '', className)}
    >
      {(heading || subheading) && (
        <div className={cx(cls('header'), styles['header'])}>
          {heading && (
            <Typography variant="h5" className={cx(cls('heading'), styles['heading'])}>
              {heading}
            </Typography>
          )}
          {subheading && (
            <Typography variant="body2" component="p" color="textSecondary" className={cls('description')}>
              {subheading}
            </Typography>
          )}
        </div>
      )}

      {error && (
        <AlertPrimitive variant="error" className={cx(cls('error'), styles['alert'])}>
          <AlertPrimitive.Description>{error}</AlertPrimitive.Description>
        </AlertPrimitive>
      )}

      {success && (
        <AlertPrimitive variant="success" className={cx(cls('success'), styles['alert'])}>
          <AlertPrimitive.Description>{success}</AlertPrimitive.Description>
        </AlertPrimitive>
      )}

      {loading && passkeys.length === 0 && (
        <div className={cx(cls('loading'), styles['loading'])}>
          <Spinner size="medium" />
        </div>
      )}

      {!loading && passkeys.length === 0 && (
        <Typography variant="body2" component="p" color="textSecondary" className={cx(cls('empty'), styles['empty'])}>
          {t('user.passkeys.empty')}
        </Typography>
      )}

      {passkeys.length > 0 && <ul className={cx(cls('list'), styles['list'])}>{passkeys.map(renderPasskey)}</ul>}

      {renderAdd()}
    </div>
  );
};

export default BasePasskeys;
