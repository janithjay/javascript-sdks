// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it} from 'vitest';
import {AttributeSchema} from '../../api/getUsersMeMeta';
import supportsCredential from '../supportsCredential';

describe('supportsCredential', (): void => {
  it('should accept a schema that defines the named attribute', (): void => {
    expect(supportsCredential({password: {credential: true, type: 'string'}}, 'password')).toBe(true);
  });

  it('should accept a non-password credential name declared on the schema', (): void => {
    expect(supportsCredential({pin: {credential: true, type: 'string'}}, 'pin')).toBe(true);
  });

  it('should accept an attribute that carries no metadata', (): void => {
    expect(supportsCredential({password: {}}, 'password')).toBe(true);
  });

  it('should accept an attribute the schema marks optional', (): void => {
    expect(supportsCredential({password: {credential: true, required: false}}, 'password')).toBe(true);
  });

  it('should reject a schema that declares another credential but not the named one', (): void => {
    const schema: Record<string, AttributeSchema> = {
      email: {type: 'string', unique: true},
      pin: {credential: true, type: 'string'},
    };

    expect(supportsCredential(schema, 'password')).toBe(false);
  });

  it('should reject an empty schema', (): void => {
    expect(supportsCredential({}, 'password')).toBe(false);
  });

  it.each([[null], [undefined]])('should accept an unresolved schema (%s)', (schema): void => {
    expect(supportsCredential(schema, 'password')).toBe(true);
  });
});
