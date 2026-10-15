// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {TooltipPlacement, TooltipPosition, withVendorCSSClassPrefix, bem, placeTooltip} from '@thunderid/browser';
import {FC, InputHTMLAttributes, ReactNode, useEffect, useId, useRef, useState, KeyboardEvent} from 'react';
import useStyles from './Tooltip.styles';
import useTheme from '../../../contexts/Theme/useTheme';
import {cx} from '../../../styles/emotion';

/**
 * Props for the Tooltip component.
 */
export interface Tooltiprops extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'type'> {
  className?: string;
  helperText?: string;
  position?: TooltipPosition;
  children?: ReactNode;
  ariaLabel?: string;
}

/**
 * A Tooltip component that convert any react or html element to a tooltip.
 * When a user hover on it, they will see a small tooltip with some info.
 *
 * It will take a children, which can be a react element or html element.
 *
 * @param props - Props for the Tooltip component
 * @returns A JSX element representing the Tooltip
 */
const Tooltip: FC<Tooltiprops> = ({
  className = '',
  helperText = '',
  style = {},
  position = 'bottom',
  children = null,
  ariaLabel = 'More Info',
  ...rest
}: Tooltiprops) => {
  const {theme, colorScheme}: ReturnType<typeof useTheme> = useTheme();
  const styles: Record<string, string> = useStyles(theme, colorScheme);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [placement, setPlacement] = useState<TooltipPlacement>();
  const containerRef = useRef<HTMLDivElement>(null);

  const show = (): void => {
    if (containerRef.current) {
      setPlacement(placeTooltip(containerRef.current.getBoundingClientRect(), position));
    }
    setIsVisible(true);
  };

  // A fixed tooltip would drift from its element on scroll, so it closes instead.
  useEffect(() => {
    if (!isVisible) {
      return undefined;
    }
    const hide = (): void => setIsVisible(false);
    window.addEventListener('scroll', hide, true);
    return (): void => window.removeEventListener('scroll', hide, true);
  }, [isVisible]);

  // Unique ID to connect trigger button to tooltip box via ARIA
  const tooltipId = useId();

  // Close tooltip if user presses ESC while focused
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape' && isVisible) {
      setIsVisible(false);
    }

    // Optional: Prevent Space key from scrolling the page
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (isVisible) {
        setIsVisible(false);
      } else {
        show();
      }
    }
  };
  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="button"
      aria-label={ariaLabel}
      aria-describedby={isVisible && helperText ? tooltipId : undefined}
      className={cx(withVendorCSSClassPrefix(bem('tooltip', 'container')), className, styles['container'])}
      style={style}
      onMouseEnter={show}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={show} /* Trigger on Tab Focus */
      onBlur={() => setIsVisible(false)} /* Hide on Tab Blur */
      onKeyDown={handleKeyDown} /* Allow ESC to dismiss */
      {...rest}
    >
      {children}
      {isVisible && helperText && (
        <div
          id={tooltipId}
          role="tooltip"
          className={cx(
            withVendorCSSClassPrefix(bem('tooltip', 'box')),
            withVendorCSSClassPrefix(bem('tooltip', position)),
            styles['box'],
          )}
          style={placement}
        >
          {helperText}
          <span
            className={cx(
              withVendorCSSClassPrefix(bem('tooltip', 'arrow')),
              styles['arrow'],
              styles[`${position}-arrow`],
            )}
          />
        </div>
      )}
    </div>
  );
};

export default Tooltip;
