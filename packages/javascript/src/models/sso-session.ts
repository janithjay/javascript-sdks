// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ApiPaginationLink} from './api';

/**
 * An application that has used an SSO session.
 */
export interface SSOSessionParticipant {
  appId: string;
  /**
   * The application's name. Left out when the application can't be found.
   */
  appName?: string;
  firstJoinedAt: string;
  lastActiveAt: string;
}

/**
 * A live SSO session of the signed-in user, as recorded by the ThunderID server.
 *
 * This is a server record, distinct from `SessionData`, which describes the tokens the SDK
 * stores for the signed-in user.
 */
export interface SSOSession {
  absoluteExpiresAt?: string;
  authenticatedAt: string;
  createdAt: string;
  creationIp?: string;
  id: string;
  idleExpiresAt?: string;
  /**
   * Whether this session issued the access token the request was made with. Every session can be
   * false, for example when the token came from an earlier grant of the same application.
   */
  isCurrent: boolean;
  lastActiveAt: string;
  lastActiveIp?: string;
  /**
   * The applications that have used the session, first joined first.
   */
  participants: SSOSessionParticipant[];
  userAgent?: string;
  userId: string;
}

/**
 * A page of SSO sessions.
 */
export interface SSOSessionListResponse {
  count: number;
  links?: ApiPaginationLink[];
  sessions: SSOSession[];
  startIndex: number;
  totalResults: number;
}
