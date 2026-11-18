// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ReactElement} from 'react';
import {describe, expect, it, vi} from 'vitest';

const BaseChangeCredential: () => null = () => null;

vi.mock('react', async (importOriginal: () => Promise<Record<string, unknown>>) => ({
  ...(await importOriginal()),
  // Lets the component run outside a renderer; it only memoises values and holds form state.
  useMemo: <T>(factory: () => T): T => factory(),
  useState: <T>(initial: T): [T, () => void] => [initial, (): void => undefined],
}));

vi.mock('@thunderid/react', () => ({
  BaseChangeCredential,
  useTranslation: () => ({t: (key: string): string => key}),
  useUser: () => ({userSchema: {password: {credential: true, type: 'string'}}}),
}));

vi.mock('../../../../contexts/ThunderID/useThunderID', () => ({
  default: () => ({preferences: undefined}),
}));

vi.mock('../../../../../server/actions/account/updateUserCredentialsAction', () => ({default: vi.fn()}));
vi.mock('../../../../../server/actions/getSessionId', () => ({default: vi.fn()}));

const {default: ChangeCredential} = await import('../ChangeCredential');

describe('ChangeCredential', () => {
  it('frames the form in the card by default, the same as the React SDK', () => {
    const element: ReactElement<Record<string, unknown>> = ChangeCredential({}) as ReactElement<
      Record<string, unknown>
    >;

    expect(element.type).toBe(BaseChangeCredential);
    expect(element.props['cardLayout']).toBe(true);
  });

  it('drops the card when the card layout is turned off', () => {
    const element: ReactElement<Record<string, unknown>> = ChangeCredential({cardLayout: false}) as ReactElement<
      Record<string, unknown>
    >;

    expect(element.props['cardLayout']).toBe(false);
  });
});
