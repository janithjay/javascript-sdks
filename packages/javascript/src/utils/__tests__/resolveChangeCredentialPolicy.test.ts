// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it} from 'vitest';
import {AttributeSchema} from '../../api/getUsersMeMeta';
import resolveChangeCredentialPolicy from '../resolveChangeCredentialPolicy';

const schemaWith = (name: string, regex?: string): Record<string, AttributeSchema> =>
  ({[name]: {regex}}) as unknown as Record<string, AttributeSchema>;

describe('resolveChangeCredentialPolicy', (): void => {
  it('should derive the policy from the named credential attribute regex', (): void => {
    expect(resolveChangeCredentialPolicy(schemaWith('password', '^.{8,}$'), 'password')).toEqual({regex: '^.{8,}$'});
  });

  it('should derive the policy for a non-password credential name', (): void => {
    expect(resolveChangeCredentialPolicy(schemaWith('pin', '^\\d{4,6}$'), 'pin')).toEqual({regex: '^\\d{4,6}$'});
  });

  it('should return an empty policy when the schema carries no regex', (): void => {
    expect(resolveChangeCredentialPolicy(schemaWith('password', undefined), 'password')).toEqual({});
  });

  it('should return an empty policy when the schema has no attribute of that name', (): void => {
    expect(resolveChangeCredentialPolicy({} as Record<string, AttributeSchema>, 'password')).toEqual({});
  });

  it.each([[null], [undefined]])('should tolerate a %s schema', (schema: null | undefined): void => {
    expect(resolveChangeCredentialPolicy(schema, 'password')).toEqual({});
  });

  it('should let an explicit override win over the schema', (): void => {
    expect(resolveChangeCredentialPolicy(schemaWith('password', '^.{8,}$'), 'password', {regex: '^.{12,}$'})).toEqual(
      {regex: '^.{12,}$'},
    );
  });

  it('should honour an override that deliberately configures no rules', (): void => {
    expect(resolveChangeCredentialPolicy(schemaWith('password', '^.{8,}$'), 'password', {})).toEqual({});
  });
});
