import { TokenManager, errorHandler } from '@backstage/backend-common';
import { Config } from '@backstage/config';
import express from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';
import { MiaPlatformEntityProvider } from './miaPlatformEntityProvider';


export interface RouterOptions {
  logger: Logger;
  config: Config;
  miaPlatformEntityProvider: MiaPlatformEntityProvider;
  tokenManager: TokenManager
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { miaPlatformEntityProvider} = options;
  const router = Router();

  router.get('/sync', async (_, res) => {
    console.log('GET /sync called')
    try{
      await miaPlatformEntityProvider.full_mutation()
    } catch(exception){
      console.log(exception)
    }
    res.json();
    return
  })

  router.get('/sync/company/:companyId', async (req, res) => {
    console.log('GET /sync/company called')
    await miaPlatformEntityProvider.syncProjects([req.params.companyId], undefined)
    res.json();
    return
  })

  router.get('/sync/company/:companyId/project/:projectId', async (req, res) => {
    console.log('GET /sync/project called')
    await miaPlatformEntityProvider.syncProjects([req.params.companyId], req.params.projectId)
    res.json();
    return
  })

  router.use(errorHandler());
  return router;
}

