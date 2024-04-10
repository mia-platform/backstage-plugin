import { errorHandler } from '@backstage/backend-common';
import { Config } from '@backstage/config';
import express from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';
import { MiaPlatformEntityProvider } from './miaPlatformEntityProvider';


export interface RouterOptions {
  logger: Logger;
  config: Config;
  miaPlatformEntityProvider: MiaPlatformEntityProvider;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { miaPlatformEntityProvider, logger } = options;
  const router = Router();

  router.get('/sync', async (_, res) => {
    logger.info('GET /sync called')
    try {
      await miaPlatformEntityProvider.full_mutation()
    } catch (exception) {
      logger.error(exception)
    }
    res.json();
    return
  })

  router.get('/sync/company/:companyId', async (req, res) => {
    logger.info('GET /sync/company called')
    try {
      await miaPlatformEntityProvider.syncProjects([req.params.companyId], undefined)
    } catch (error) {
      logger.error(error)
    }
    res.json();
    return
  })

  router.get('/sync/company/:companyId/project/:projectId', async (req, res) => {
    logger.info('GET /sync/project called')
    try {
      await miaPlatformEntityProvider.syncProjects([req.params.companyId], req.params.projectId)
    } catch (error) {
      logger.error(error)
    }
    res.json();
    return
  })

  router.use(errorHandler());
  return router;
}

