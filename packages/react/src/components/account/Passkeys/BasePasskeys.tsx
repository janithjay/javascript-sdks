// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {Passkey, Preferences, bem, withVendorCSSClassPrefix} from '@thunderid/browser';
import {ChangeEvent, FC, FormEvent, ReactElement, ReactNode, useEffect, useId, useRef, useState} from 'react';
import useStyles from './BasePasskeys.styles';
import useTheme from '../../../contexts/Theme/useTheme';
import useTranslation from '../../../hooks/useTranslation';
import {cx} from '../../../styles/emotion';
import AlertPrimitive from '../../primitives/Alert/Alert';
import Button from '../../primitives/Button/Button';
import CardPrimitive from '../../primitives/Card/Card';
import Check from '../../primitives/Icons/Check';
import KeyRound from '../../primitives/Icons/KeyRound';
import Plus from '../../primitives/Icons/Plus';
import Trash from '../../primitives/Icons/Trash';
import Spinner from '../../primitives/Spinner/Spinner';
import TextField from '../../primitives/TextField/TextField';
import Typography from '../../primitives/Typography/Typography';

/**
 * The longest passkey name the server accepts.
 */
const PASSKEY_NAME_MAX_LENGTH = 64;

/**
 * The benefits listed when the user starts adding a passkey.
 */
const BENEFIT_KEYS: readonly string[] = ['user.passkeys.add.intro.no_password', 'user.passkeys.add.intro.phishing'];

/**
 * What {@link BasePasskeys} hands its `children` render function, so the passkeys can be shown with any
 * UI. Removing through `onRemove` does not ask for confirmation, so a custom UI should.
 */
export interface BasePasskeysRenderProps {
  /**
   * Whether the device is creating a passkey.
   */
  adding: boolean;
  error: string | null;
  /**
   * The name to show for a passkey: its own, or a translated "Passkey" when it has none.
   */
  getDisplayName: (passkey: Passkey) => string;
  loading: boolean;
  /**
   * The longest name the server accepts, for a custom name field.
   */
  nameMaxLength: number;
  /**
   * Whether the device has created a passkey that is waiting for `onSave`.
   */
  naming: boolean;
  /**
   * Asks the device to create a passkey. Undefined when adding is not offered.
   */
  onAdd?: () => void;
  /**
   * Removes a passkey. Undefined when removing is not offered.
   */
  onRemove?: (passkeyId: string) => void;
  /**
   * Saves the passkey the device created. The name is trimmed, and an empty one saves the passkey
   * without a name.
   */
  onSave?: (name: string) => void;
  passkeys: Passkey[];
  /**
   * The passkey whose removal is in flight.
   */
  removingPasskeyId: string | null;
  /**
   * Whether the created passkey is being saved.
   */
  saving: boolean;
  success: string | null;
  /**
   * Whether this browser can create passkeys.
   */
  supported: boolean;
}

export interface BasePasskeysProps {
  /**
   * Whether the device is creating a passkey.
   */
  adding?: boolean;
  /**
   * Whether to show the passkeys as a bordered card.
   * @default true
   */
  cardLayout?: boolean;
  /**
   * Renders custom UI in place of the default card. Receives the passkeys, the loading, error and
   * success state, and the add, save and remove handlers.
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
   * An error to show, such as a failed load, add or remove. It shows in the add panel while that is
   * open, and above the list otherwise.
   */
  error?: string | null;
  /**
   * Whether the passkeys are loading.
   */
  loading?: boolean;
  /**
   * Whether the device has created a passkey that is waiting for a name.
   */
  naming?: boolean;
  /**
   * Called once the user continues past the introduction, to have the device create a passkey. The add
   * button shows only when this is set.
   */
  onAdd?: () => void;
  /**
   * Called with a passkey's ID once the user confirms removing it. The remove buttons show only when
   * this is set.
   */
  onRemove?: (passkeyId: string) => void;
  /**
   * Called with the name the user typed, or an empty string when they skip naming, to save the passkey
   * the device created.
   */
  onSave?: (name: string) => void;
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
   * Whether the created passkey is being saved.
   */
  saving?: boolean;
  /**
   * A message to show once an add or remove succeeds. A new message closes the add panel.
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
 * Presentational card of the signed-in user's passkeys. Adding one walks through a panel in the card: an
 * introduction, a wait while the device creates the passkey, and a step to name it. Removing one asks
 * for confirmation in the passkey's row, with a warning when it is the last one.
 *
 * Holds no context and performs no network calls: it reports an add through `onAdd` and `onSave`, and a
 * confirmed remove through `onRemove`. Use {@link Passkeys} for the context-wired variant.
 *
 * @example
 * ```tsx
 * <BasePasskeys passkeys={passkeys} naming={naming} onAdd={create} onSave={save} onRemove={remove} />
 * ```
 */
const BasePasskeys: FC<BasePasskeysProps> = ({
  adding = false,
  cardLayout = true,
  children = undefined,
  className = '',
  description = undefined,
  error = null,
  loading = false,
  naming = false,
  onAdd = undefined,
  onRemove = undefined,
  onSave = undefined,
  passkeys = [],
  preferences = undefined,
  removingPasskeyId = null,
  saving = false,
  success = null,
  supported = true,
  title = undefined,
}: BasePasskeysProps) => {
  const {theme, colorScheme}: ReturnType<typeof useTheme> = useTheme();
  const styles: Record<string, string> = useStyles(theme, colorScheme);
  const {t} = useTranslation(preferences?.i18n);
  const idPrefix: string = useId();
  const [addOpen, setAddOpen] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [confirming, setConfirming] = useState<Passkey | null>(null);
  const cancelRemoveRef = useRef<HTMLButtonElement>(null);
  const continueRef = useRef<HTMLButtonElement>(null);
  const nameFieldId = `${idPrefix}-name`;
  const addButtonId = `${idPrefix}-add`;
  const removeButtonId = (passkeyId: string): string => `${idPrefix}-remove-${passkeyId}`;
  // What was open on the last render, so focus can go back to the control it replaced once it closes.
  const lastConfirmingIdRef = useRef<string | null>(null);
  const wasAddPanelOpenRef = useRef<boolean>(false);

  // Close the add panel once the container reports a success. Adjusting state during render is React's
  // documented way to reset on a prop change, and avoids the extra commit an effect would cause.
  const [prevSuccess, setPrevSuccess] = useState<string | null>(success);

  if (success !== prevSuccess) {
    setPrevSuccess(success);

    if (success) {
      setAddOpen(false);
      setName('');
    }
  }

  // Move focus into the name field once the device has created the passkey.
  useEffect(() => {
    if (naming) {
      document.getElementById(nameFieldId)?.focus();
    }
  }, [naming, nameFieldId]);

  // The add button is replaced by the panel, so move focus into it.
  useEffect(() => {
    if (addOpen) {
      continueRef.current?.focus();
    }
  }, [addOpen]);

  // Start on the safe choice when asked to confirm a removal, and go back to the bin icon once the
  // confirmation closes.
  useEffect(() => {
    if (confirming) {
      cancelRemoveRef.current?.focus();
      lastConfirmingIdRef.current = confirming.id;

      return;
    }

    if (lastConfirmingIdRef.current) {
      document.getElementById(`${idPrefix}-remove-${lastConfirmingIdRef.current}`)?.focus();
      lastConfirmingIdRef.current = null;
    }
  }, [confirming, idPrefix]);

  // The add panel stays open while the device or the server is working, so the flow can't be lost.
  const addPanelOpen: boolean = addOpen || adding || naming || saving;

  // Return focus to the add button once the add panel closes, since the panel held it.
  useEffect(() => {
    if (wasAddPanelOpenRef.current && !addPanelOpen) {
      document.getElementById(addButtonId)?.focus();
    }

    wasAddPanelOpenRef.current = addPanelOpen;
  }, [addPanelOpen, addButtonId]);

  const getDisplayName = (passkey: Passkey): string => passkey.name ?? t('user.passkeys.unnamed');

  if (children) {
    return (
      <>
        {children({
          adding,
          error,
          getDisplayName,
          loading,
          nameMaxLength: PASSKEY_NAME_MAX_LENGTH,
          naming,
          onAdd: supported ? onAdd : undefined,
          onRemove,
          onSave,
          passkeys,
          removingPasskeyId,
          saving,
          success,
          supported,
        })}
      </>
    );
  }

  const heading: string = title ?? t('user.passkeys.heading');
  const subheading: string = description ?? t('user.passkeys.description');
  const busy: boolean = adding || naming || saving || removingPasskeyId !== null;

  const renderError = (): ReactElement | null =>
    error ? (
      <AlertPrimitive variant="error" className={cx(cls('error'), styles['alert'])}>
        <AlertPrimitive.Description>{error}</AlertPrimitive.Description>
      </AlertPrimitive>
    ) : null;

  const handleSave = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (name.trim()) {
      onSave?.(name);
    }
  };

  const renderIntro = (): ReactElement => (
    <>
      <span aria-hidden="true" className={cx(cls('panel-icon'), styles['panelIcon'])}>
        <KeyRound width={22} height={22} />
      </span>
      <Typography variant="h5" component="h3" className={cx(cls('panel-heading'), styles['panelText'])}>
        {t('user.passkeys.add')}
      </Typography>
      <Typography variant="body2" component="p" color="textSecondary" className={styles['panelText']}>
        {t('user.passkeys.add.intro.description')}
      </Typography>
      <ul className={cx(cls('benefits'), styles['benefits'])}>
        {BENEFIT_KEYS.map((key: string) => (
          <li key={key} className={cx(cls('benefit'), styles['benefit'])}>
            <span aria-hidden="true" className={styles['benefitIcon']}>
              <Check width={14} height={14} />
            </span>
            {t(key)}
          </li>
        ))}
      </ul>
      {renderError()}
      <div className={cx(cls('panel-actions'), styles['actions'])}>
        <Button
          type="button"
          color="tertiary"
          variant="outline"
          className={cls('cancel')}
          onClick={(): void => setAddOpen(false)}
        >
          {t('user.passkeys.cancel')}
        </Button>
        <Button
          type="button"
          color="primary"
          variant="solid"
          className={cls('continue')}
          ref={continueRef}
          onClick={onAdd}
        >
          {t('user.passkeys.add.continue')}
        </Button>
      </div>
    </>
  );

  const renderWaiting = (): ReactElement => (
    <div role="status" className={cx(cls('waiting'), styles['waiting'])}>
      <Spinner size="large" />
      <Typography variant="h6" component="h3" className={styles['panelText']}>
        {t('user.passkeys.add.waiting.heading')}
      </Typography>
      <Typography variant="body2" component="p" color="textSecondary" className={styles['panelText']}>
        {t('user.passkeys.add.waiting.description')}
      </Typography>
    </div>
  );

  const renderNaming = (): ReactElement => (
    <form noValidate onSubmit={handleSave} className={cx(cls('name-form'), styles['nameForm'])}>
      <div className={cx(cls('created'), styles['created'])}>
        <span aria-hidden="true" className={cx(cls('created-icon'), styles['createdIcon'])}>
          <Check width={14} height={14} />
        </span>
        <Typography variant="h5" component="h3" className={styles['panelText']}>
          {t('user.passkeys.add.created.heading')}
        </Typography>
      </div>
      <Typography variant="body2" component="p" color="textSecondary" className={styles['panelText']}>
        {t('user.passkeys.add.created.description')}
      </Typography>
      <TextField
        name="passkeyName"
        autoComplete="off"
        id={nameFieldId}
        label={t('user.passkeys.add.name.label')}
        placeholder={t('user.passkeys.add.name.placeholder')}
        helperText={`${name.length}/${PASSKEY_NAME_MAX_LENGTH}`}
        maxLength={PASSKEY_NAME_MAX_LENGTH}
        value={name}
        disabled={saving}
        onChange={(event: ChangeEvent<HTMLInputElement>): void => setName(event.target.value)}
      />
      {renderError()}
      <div className={cx(cls('panel-actions'), styles['actions'])}>
        <Button
          type="button"
          color="tertiary"
          variant="outline"
          className={cls('skip')}
          disabled={saving}
          onClick={(): void => onSave?.('')}
        >
          {t('user.passkeys.add.skip')}
        </Button>
        <Button
          type="submit"
          color="primary"
          variant="solid"
          className={cls('save')}
          loading={saving}
          disabled={saving || !name.trim()}
        >
          {t('user.passkeys.add.save')}
        </Button>
      </div>
    </form>
  );

  const renderAddPanel = (): ReactElement => {
    let step: ReactElement = renderIntro();

    if (naming || saving) {
      step = renderNaming();
    } else if (adding) {
      step = renderWaiting();
    }

    return (
      <section aria-label={t('user.passkeys.add')} className={cx(cls('panel'), styles['panel'])}>
        {step}
      </section>
    );
  };

  const renderRemoveConfirm = (passkey: Passkey): ReactElement => (
    <div
      role="group"
      aria-label={t('user.passkeys.remove.confirm.heading')}
      className={cx(cls('confirm'), styles['confirm'])}
    >
      <Typography
        variant="body2"
        component="p"
        color="textSecondary"
        className={cx(cls('confirm-message'), styles['panelText'])}
      >
        {t('user.passkeys.remove.confirm.description', {name: getDisplayName(passkey)})}
      </Typography>
      {passkeys.length === 1 && (
        <AlertPrimitive variant="warning" className={cx(cls('last-warning'), styles['alert'])}>
          <AlertPrimitive.Description>{t('user.passkeys.remove.confirm.last')}</AlertPrimitive.Description>
        </AlertPrimitive>
      )}
      <div className={cx(cls('confirm-actions'), styles['actions'])}>
        <Button
          type="button"
          size="small"
          color="tertiary"
          variant="outline"
          className={cls('cancel')}
          ref={cancelRemoveRef}
          onClick={(): void => setConfirming(null)}
        >
          {t('user.passkeys.cancel')}
        </Button>
        <Button
          type="button"
          size="small"
          color="error"
          variant="outline"
          className={cls('confirm-remove')}
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
    const isConfirming: boolean = confirming?.id === passkey.id;

    return (
      <li key={passkey.id} className={cx(cls('item'), styles['item'])}>
        <div className={cx(cls('item-row'), styles['itemRow'])}>
          <span aria-hidden="true" className={cx(cls('icon'), styles['icon'])}>
            <KeyRound width={20} height={20} />
          </span>
          <Typography
            id={nameId}
            variant="body1"
            component="span"
            fontWeight="medium"
            className={cx(cls('name'), styles['name'])}
          >
            {displayName}
          </Typography>
          {onRemove && !isConfirming && (
            <Button
              type="button"
              size="small"
              color="error"
              variant="icon"
              id={removeButtonId(passkey.id)}
              className={cls('remove')}
              aria-label={t('user.passkeys.remove')}
              aria-describedby={nameId}
              title={t('user.passkeys.remove')}
              loading={removingPasskeyId === passkey.id}
              disabled={busy || addPanelOpen || confirming !== null}
              onClick={(): void => setConfirming(passkey)}
            >
              <Trash width={18} height={18} />
            </Button>
          )}
        </div>
        {isConfirming && renderRemoveConfirm(passkey)}
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

    if (addPanelOpen) {
      return renderAddPanel();
    }

    return (
      <div className={cx(cls('add-actions'), styles['actions'])}>
        <Button
          type="button"
          color="primary"
          variant="outline"
          id={addButtonId}
          className={cls('add')}
          startIcon={<Plus width={16} height={16} />}
          disabled={busy || confirming !== null}
          onClick={(): void => setAddOpen(true)}
        >
          {t('user.passkeys.add')}
        </Button>
      </div>
    );
  };

  return (
    <CardPrimitive
      aria-busy={loading || busy}
      variant={cardLayout ? 'outlined' : 'default'}
      className={cx(cls(), styles['root'], !cardLayout && styles['plain'], className)}
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

      {!addPanelOpen && renderError()}

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
    </CardPrimitive>
  );
};

export default BasePasskeys;
