// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {PasswordPolicy} from './evaluatePasswordPolicy';
import {AttributeSchema} from '../api/getUsersMeMeta';

/**
 * Resolves the rules a change-credential form should enforce for the given credential.
 *
 * The organization's own policy, expressed as the credential attribute's `regex` in
 * `GET /users/me/meta`, is the sole source of truth: the SDK does not layer its own
 * character-class or length rules on top, since doing so could reject a value the
 * organization's policy accepts. When the schema carries no regex for this credential,
 * there is no policy to check client-side and the requirement checklist is simply empty.
 *
 * @param userSchema - The user type schema resolved by the provider, keyed by attribute.
 * @param credentialName - The credential attribute this form manages (e.g. `password`, `pin`).
 * @param override - An explicit policy supplied by the caller, which wins outright.
 * @returns The policy to hand to {@link evaluatePasswordPolicy}.
 * @example
 * ```typescript
 * const policy = resolveChangeCredentialPolicy(userSchema, 'pin', undefined);
 * const results = evaluatePasswordPolicy(candidate, policy);
 * ```
 */
const resolveChangeCredentialPolicy = (
  userSchema: Record<string, AttributeSchema> | null | undefined,
  credentialName: string,
  override?: PasswordPolicy,
): PasswordPolicy => {
  if (override) {
    return override;
  }

  const schemaRegex: string | undefined = userSchema?.[credentialName]?.regex;

  return schemaRegex ? {regex: schemaRegex} : {};
};

export default resolveChangeCredentialPolicy;
