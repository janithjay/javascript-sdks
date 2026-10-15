// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import express from 'express';
import {describe, it, expect, vi} from 'vitest';
import ThunderIDExpressClient from '../ThunderIDExpressClient';

describe('ThunderIDExpressClient', () => {
  describe('updateUserCredentialsFromRequest', () => {
    it('extracts session cookie and calls updateUserCredentials', async () => {
      const client = new ThunderIDExpressClient();
      await client.initialize({
        baseUrl: 'https://auth.example.com',
        clientId: 'test-client',
      });

      const updateCredentialsSpy = vi.spyOn(client, 'updateUserCredentials').mockResolvedValue(undefined);

      const cookieName = client.getSessionCookieName();
      const req = {
        cookies: {
          [cookieName]: 'session-cookie-123',
        },
      } as unknown as express.Request;

      const payload = {password: 'new-password'};
      await client.updateUserCredentialsFromRequest(req, payload);

      expect(updateCredentialsSpy).toHaveBeenCalledWith(payload, 'session-cookie-123');
    });
  });

  describe('getUserSessionsFromRequest', () => {
    it('extracts session cookie and calls getUserSessions', async () => {
      const client = new ThunderIDExpressClient();
      await client.initialize({
        baseUrl: 'https://auth.example.com',
        clientId: 'test-client',
      });

      const spy = vi
        .spyOn(client, 'getUserSessions')
        .mockResolvedValue({count: 0, sessions: [], startIndex: 1, totalResults: 0});

      const cookieName = client.getSessionCookieName();
      const req = {
        cookies: {
          [cookieName]: 'session-cookie-123',
        },
      } as unknown as express.Request;

      await client.getUserSessionsFromRequest(req, {limit: 5});

      expect(spy).toHaveBeenCalledWith({limit: 5}, 'session-cookie-123');
    });
  });

  describe('revokeUserSessionFromRequest', () => {
    it('extracts session cookie and calls revokeUserSession', async () => {
      const client = new ThunderIDExpressClient();
      await client.initialize({
        baseUrl: 'https://auth.example.com',
        clientId: 'test-client',
      });

      const spy = vi.spyOn(client, 'revokeUserSession').mockResolvedValue(undefined);

      const cookieName = client.getSessionCookieName();
      const req = {
        cookies: {
          [cookieName]: 'session-cookie-123',
        },
      } as unknown as express.Request;

      await client.revokeUserSessionFromRequest(req, 'sso-session-1');

      expect(spy).toHaveBeenCalledWith('sso-session-1', 'session-cookie-123');
    });
  });

  describe('revokeUserSessionsFromRequest', () => {
    it('extracts session cookie and calls revokeUserSessions', async () => {
      const client = new ThunderIDExpressClient();
      await client.initialize({
        baseUrl: 'https://auth.example.com',
        clientId: 'test-client',
      });

      const spy = vi.spyOn(client, 'revokeUserSessions').mockResolvedValue(undefined);

      const cookieName = client.getSessionCookieName();
      const req = {
        cookies: {
          [cookieName]: 'session-cookie-123',
        },
      } as unknown as express.Request;

      await client.revokeUserSessionsFromRequest(req, {exceptCurrent: true});

      expect(spy).toHaveBeenCalledWith({exceptCurrent: true}, 'session-cookie-123');
    });
  });
});
