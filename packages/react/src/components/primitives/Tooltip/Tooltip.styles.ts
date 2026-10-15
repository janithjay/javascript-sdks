// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {Theme} from '@thunderid/browser';
import {useMemo} from 'react';
import {css, keyframes} from '../../../styles/emotion';

const useStyles = (theme: Theme, colorScheme: string): Record<string, string> =>
  useMemo(() => {
    const fadeInAnimation = keyframes`
     from { opacity: 0; }
     to { opacity: 1; }
    `;

    const containerStyles: string = css`
      position: relative;
      display: inline-block;
    `;

    //   white-space: nowrap;
    const boxStyles: string = css`
      position: fixed;
      background-color: #333;
      color: #fff;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.85rem;
      z-index: 1000;
      box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.15);
      animation: ${fadeInAnimation} 0.15s ease-in-out;

      width: max-content;
      max-width: 250px;
      white-space: normal;
      word-break: break-word;
      overflow-wrap: break-word;
      text-align: start;
    `;

    const arrowStyles: string = css`
      position: absolute;
      width: 0;
      height: 0;
      border-style: solid;
    `;

    const topArrowStyles: string = css`
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border-width: 5px 5px 0 5px;
      border-color: #333 transparent transparent transparent;
    `;

    const bottomArrowStyles: string = css`
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      border-width: 0 5px 5px 5px;
      border-color: transparent transparent #333 transparent;
    `;

    const leftArrowStyles: string = css`
      left: 100%;
      top: 50%;
      transform: translateY(-50%);
      border-width: 5px 0 5px 5px;
      border-color: transparent transparent transparent #333;
    `;

    const rightArrowStyles: string = css`
      right: 100%;
      top: 50%;
      transform: translateY(-50%);
      border-width: 5px 5px 5px 0;
      border-color: transparent #333 transparent transparent;
    `;

    return {
      container: containerStyles,
      box: boxStyles,
      arrow: arrowStyles,
      'top-arrow': topArrowStyles,
      'bottom-arrow': bottomArrowStyles,
      'left-arrow': leftArrowStyles,
      'right-arrow': rightArrowStyles,
    };
  }, [theme, colorScheme]);

export default useStyles;
