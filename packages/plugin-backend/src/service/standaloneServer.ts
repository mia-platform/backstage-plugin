import { ServerTokenManager, createServiceBuilder } from '@backstage/backend-common';
import { Server } from 'http';
import { Logger } from 'winston';
import { createRouter } from './router';
import { Config } from '@backstage/config';
import { MiaPlatformEntityProvider } from './miaPlatformEntityProvider';

export interface ServerOptions {
  port: number;
  enableCors: boolean;
  logger: Logger;
  config: Config
}

export async function startStandaloneServer(
  options: ServerOptions,
): Promise<Server> {
  const logger = options.logger.child({ service: 'mia-platform-plugin-backend' });
  logger.debug('Starting application server...');
  const tokenManager = ServerTokenManager.fromConfig(options.config, { logger: logger });
  const router = await createRouter({
    config: options.config,
    logger,
    miaPlatformEntityProvider: {} as MiaPlatformEntityProvider,
    tokenManager: tokenManager
  });

  let service = createServiceBuilder(module)
    .setPort(options.port)
    .addRouter('/mia-platform-plugin', router);
  if (options.enableCors) {
    service = service.enableCors({ origin: options.config.getString('app.baseUrl') });
  }

  return await service.start().catch(err => {
    logger.error(err);
    process.exit(1);
  });
}

module.hot?.accept();
