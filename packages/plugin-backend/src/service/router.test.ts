import { ServerTokenManager, getVoidLogger } from '@backstage/backend-common';
import express from 'express';
import request from 'supertest';

import { createRouter } from './router';
import { Config } from '@backstage/config';
import { MiaPlatformEntityProvider } from './miaPlatformEntityProvider';

describe('createRouter', () => {
  let app: express.Express;

  beforeAll(async () => {
    const router = await createRouter({
      logger: getVoidLogger(),
      config: {} as Config,
      miaPlatformEntityProvider: MiaPlatformEntityProvider.create({} as Config),
      tokenManager: {} as ServerTokenManager
    });
    app = express().use(router);
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /health', () => {
    it('returns ok', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });
});
