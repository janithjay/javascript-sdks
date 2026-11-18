// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  FloatingFocusManager,
  FloatingPortal,
} from '@floating-ui/react';
import {withVendorCSSClassPrefix} from '@thunderid/browser';
import {FC, ReactElement, ReactNode, useState} from 'react';
import useStyles from './BaseUserDropdown.styles';
import useTheme from '../../../contexts/Theme/useTheme';
import {css, cx} from '../../../styles/emotion';
import getDisplayName from '../../../utils/getDisplayName';
import getMappedUserProfileValue from '../../../utils/getMappedUserProfileValue';
import {Avatar} from '../../primitives/Avatar/Avatar';
import Button from '../../primitives/Button/Button';
import LogOut from '../../primitives/Icons/LogOut';
import User from '../../primitives/Icons/User';
import Typography from '../../primitives/Typography/Typography';

interface MenuItem {
  href?: string;
  icon?: ReactNode;
  label: ReactNode;
  onClick?: () => void;
}

export interface BaseUserDropdownProps {
  /**
   * Mapping of component attribute names to identity provider field names.
   * Allows customizing which user profile fields should be used for each attribute.
   */
  attributeMapping?: {
    [key: string]: string | string[] | undefined;
    firstName?: string | string[];
    lastName?: string | string[];
    picture?: string | string[];
    username?: string | string[];
  };
  /**
   * Optional size for the avatar
   */
  avatarSize?: number;
  /**
   * Optional className for the dropdown container.
   */
  className?: string;
  /**
   * Optional element to render when no user is signed in.
   */
  fallback?: ReactElement | null;
  /**
   * Whether the user data is currently loading
   */
  isLoading?: boolean;
  /**
   * Label for the "Manage Profile" menu item. Defaults to `'Manage Profile'`; set this
   * to relabel the action (e.g. `'Manage Account'`) without replacing the whole item.
   */
  manageProfileLabel?: string;
  /**
   * Menu items to display in the dropdown
   */
  menuItems?: MenuItem[];
  /**
   * Callback function for "Manage Profile" action
   */
  onManageProfile?: () => void;
  /**
   * Callback function for "Sign Out" action
   */
  onSignOut?: () => void;
  /**
   * The HTML element ID where the portal should be mounted
   */
  portalId?: string;
  /**
   * Show dropdown header with user information
   */
  showDropdownHeader?: boolean;
  /**
   * Show user's display name next to avatar in the trigger button
   */
  showTriggerLabel?: boolean;
  /**
   * The user object containing profile information
   */
  user: any;
}

/**
 * BaseUserDropdown component displays a user avatar with a dropdown menu.
 * When clicked, it shows a popover with customizable menu items.
 * This component serves as the base for framework-specific implementations.
 */
export const BaseUserDropdown: FC<BaseUserDropdownProps> = ({
  fallback = null,
  className = '',
  user,
  isLoading = false,
  portalId = 'thunderid-user-dropdown',
  menuItems = [],
  showTriggerLabel = false,
  avatarSize = 32,
  manageProfileLabel = 'Manage Profile',
  onManageProfile,
  onSignOut,
  attributeMapping = {},
}: BaseUserDropdownProps): ReactElement | null => {
  const {theme, colorScheme} = useTheme();
  const styles: Record<string, string> = useStyles(theme, colorScheme);
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredItemIndex, setHoveredItemIndex] = useState<number | null>(null);

  const {refs, floatingStyles, context} = useFloating({
    middleware: [offset(5), flip({fallbackAxisSideDirection: 'end'}), shift({padding: 5})],
    onOpenChange: setIsOpen,
    open: isOpen,
    placement: 'bottom-end',
    whileElementsMounted: autoUpdate,
  });

  const click: any = useClick(context);
  const dismiss: any = useDismiss(context);
  const role: any = useRole(context);

  const {getReferenceProps, getFloatingProps} = useInteractions([click, dismiss, role]);

  const defaultAttributeMappings: Record<string, string | string[]> = {
    email: ['emails'],
    firstName: ['name.givenName', 'given_name'],
    lastName: ['name.familyName', 'family_name'],
    picture: ['profile', 'profileUrl', 'picture', 'URL'],
    username: ['userName', 'username', 'user_name'],
  };

  const mergedMappings: Record<string, string | string[]> = Object.fromEntries(
    Object.entries({...defaultAttributeMappings, ...attributeMapping}).filter(
      (entry): entry is [string, string | string[]] => entry[1] !== undefined,
    ),
  );

  if (fallback && !user && !isLoading) {
    return fallback;
  }

  const handleMenuItemClick = (item: MenuItem): void => {
    if (item.onClick) {
      item.onClick();
    }
    setIsOpen(false);
  };

  const defaultMenuItems: MenuItem[] = [];

  if (onManageProfile) {
    defaultMenuItems.push({
      icon: <User width="16" height="16" />,
      label: manageProfileLabel,
      onClick: onManageProfile,
    });
  }

  if (onSignOut) {
    defaultMenuItems.push({
      icon: <LogOut width="16" height="16" />,
      label: 'Sign Out',
      onClick: onSignOut,
    });
  }

  const allMenuItems: MenuItem[] = [...menuItems];

  if (defaultMenuItems.length > 0) {
    if (menuItems.length > 0) {
      allMenuItems.push({label: '', onClick: undefined});
    }

    allMenuItems.push(...defaultMenuItems);
  }

  return (
    <div className={cx(withVendorCSSClassPrefix('user-dropdown'), className)}>
      <Button
        ref={refs.setReference}
        className={cx(withVendorCSSClassPrefix('user-dropdown__trigger'), styles['trigger'])}
        color="tertiary"
        variant="text"
        size="medium"
        data-testid="thunderid-user-dropdown-trigger"
        startIcon={
          <Avatar
            imageUrl={getMappedUserProfileValue('picture', mergedMappings, user)}
            name={getDisplayName(mergedMappings, user)}
            size={avatarSize}
            alt={`${getDisplayName(mergedMappings, user)}'s avatar`}
          />
        }
        {...getReferenceProps()}
      >
        {showTriggerLabel && (
          <Typography
            variant="body2"
            className={cx(withVendorCSSClassPrefix('user-dropdown__trigger-label'), styles['userName'])}
          >
            {getDisplayName(mergedMappings, user)}
          </Typography>
        )}
      </Button>

      {isOpen && (
        <FloatingPortal id={portalId}>
          <FloatingFocusManager context={context} modal={false} initialFocus={-1}>
            <div
              ref={refs.setFloating}
              className={cx(
                withVendorCSSClassPrefix('user-dropdown__content'),
                styles['dropdownContent'],
                // Floating UI recomputes the position on every render, so this class is generated
                // fresh each time rather than memoized - Emotion still injects it into the shared,
                // nonce-tagged `<style>` element, so no inline `style` attribute is needed.
                css({
                  ...floatingStyles,
                  // Floating UI doesn't set a z-index by default, so we set a high value to ensure the dropdown appears above other elements.
                  // https://floating-ui.com/docs/misc#z-index-stacking
                  zIndex: 9999,
                }),
              )}
              {...getFloatingProps()}
            >
              <div className={cx(withVendorCSSClassPrefix('user-dropdown__header'), styles['dropdownHeader'])}>
                <Avatar
                  imageUrl={getMappedUserProfileValue('picture', mergedMappings, user)}
                  name={getDisplayName(mergedMappings, user)}
                  size={avatarSize * 1.25}
                  alt={`${getDisplayName(mergedMappings, user)}'s avatar`}
                />
                <div className={cx(withVendorCSSClassPrefix('user-dropdown__header-info'), styles['headerInfo'])}>
                  <Typography
                    noWrap
                    className={withVendorCSSClassPrefix('user-dropdown__header-name')}
                    variant="body1"
                    fontWeight="medium"
                  >
                    {getDisplayName(mergedMappings, user)}
                  </Typography>
                  <Typography
                    noWrap
                    className={withVendorCSSClassPrefix('user-dropdown__header-email')}
                    variant="caption"
                    color="textSecondary"
                  >
                    {getMappedUserProfileValue('username', mergedMappings, user) ||
                      getMappedUserProfileValue('email', mergedMappings, user)}
                  </Typography>
                </div>
              </div>
              <div className={cx(withVendorCSSClassPrefix('user-dropdown__menu'), styles['dropdownMenu'])}>
                {allMenuItems.map((item: any, index: number) => (
                  <div key={index}>
                    {((): ReactElement => {
                      if (item.label === '') {
                        return (
                          <div
                            className={cx(withVendorCSSClassPrefix('user-dropdown__menu-divider'), styles['divider'])}
                          />
                        );
                      }
                      if (item.href) {
                        return (
                          <a
                            href={item.href}
                            className={cx(
                              withVendorCSSClassPrefix('user-dropdown__menu-item'),
                              styles['menuItemAnchor'],
                              hoveredItemIndex === index && styles['menuItemHighlighted'],
                            )}
                            onMouseEnter={(): void => setHoveredItemIndex(index)}
                            onMouseLeave={(): void => setHoveredItemIndex(null)}
                            onFocus={(): void => setHoveredItemIndex(index)}
                            onBlur={(): void => setHoveredItemIndex(null)}
                          >
                            {item.icon}
                            <span>{item.label}</span>
                          </a>
                        );
                      }
                      return (
                        <Button
                          onClick={(): void => handleMenuItemClick(item)}
                          className={cx(
                            withVendorCSSClassPrefix('user-dropdown__menu-item'),
                            styles['menuItem'],
                            hoveredItemIndex === index && styles['menuItemHighlighted'],
                          )}
                          color="tertiary"
                          variant="text"
                          size="small"
                          startIcon={item.icon}
                          onMouseEnter={(): void => setHoveredItemIndex(index)}
                          onMouseLeave={(): void => setHoveredItemIndex(null)}
                        >
                          {item.label}
                        </Button>
                      );
                    })()}
                  </div>
                ))}
              </div>
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </div>
  );
};

export default BaseUserDropdown;
