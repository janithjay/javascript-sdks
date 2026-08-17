// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

'use server';

import {AttributeSchema} from '@thunderid/node';
import getClient from '../getClient';

/**
 * Server action to get the user attribute schema from `/users/me/meta`.
 * Used to render profile fields dynamically (labels, required/regex validation)
 * instead of falling back to raw, unlabeled attribute keys.
 */
const getUserSchemaAction = async (
  sessionId: string,
): Promise<{data: {userSchema: Record<string, AttributeSchema> | null}; error: string | null; success: boolean}> => {
  try {
    const client = getClient();
    const userSchema: Record<string, AttributeSchema> | null = await client.getUserSchema(sessionId);
    return {data: {userSchema}, error: null, success: true};
  } catch (error) {
    return {
      data: {userSchema: null},
      error: 'Failed to get user schema',
      success: false,
    };
  }
};

export default getUserSchemaAction;
