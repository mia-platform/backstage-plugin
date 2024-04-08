# Mia-Platform Backstage Plugin Backend

>  ⚠️ This project is work-in-progress

```sh
yarn workspace backend add @mia-platform/backstage-plugin-backend
```

Create `packages/backend/src/plugins/mia-platform.ts`

```ts
import { MiaPlatformEntityProvider, createRouter } from '@mia-platform/backstage-plugin-backend';
import { Router } from 'express';
import { PluginEnvironment } from '../types';
import { CatalogBuilder, CatalogEnvironment } from '@backstage/plugin-catalog-backend';
import { ScaffolderEntitiesProcessor } from '@backstage/plugin-catalog-backend-module-scaffolder-entity-model';
import { ServerTokenManager } from '@backstage/backend-common';

export default async function createPlugin(
  env: PluginEnvironment,
  catalogEnv: CatalogEnvironment
): Promise<Router> {
  const builder = await CatalogBuilder.create(catalogEnv);

  builder.addProcessor(new ScaffolderEntitiesProcessor());

  const miaPlatformProvider = MiaPlatformEntityProvider.create(env.config);
  builder.addEntityProvider(miaPlatformProvider);

  const { processingEngine } = await builder.build();

  await processingEngine.start();

  const tokenManager = ServerTokenManager.fromConfig(env.config, { logger: env.logger });

  return await createRouter({
    logger: env.logger,
    config: env.config,
    miaPlatformEntityProvider: miaPlatformProvider,
    tokenManager: tokenManager
  });
}
```

In `packages/backend/src/index.ts`

```ts
import miaPlatform from './plugins/mia-platform'

// ...

const miaPlatformEnv = useHotMemoize(module, () => createEnv('mia-platform'));

// ...

apiRouter.use('/mia-platform', await miaPlatform(miaPlatformEnv, catalogEnv));
```

In `packages/backend/src/plugins/catalog.ts`

```ts
import { MiaPlatformEntityProvider } from '@mia-platform/backstage-plugin-backend';

// ...

const miaPlatformProvider = MiaPlatformEntityProvider.create(env.config);
builder.addEntityProvider(miaPlatformProvider);

// ...

miaPlatformProvider.full_mutation()
```

Edit `app-config.yaml`

```yaml
miaPlatform:
  baseUrl: ...
  gitBaseUrl: ...
  authorizations:
    - authMode: 'BASIC'
      clientId: ...
      clientSecret: ...
      companyId: ...
```