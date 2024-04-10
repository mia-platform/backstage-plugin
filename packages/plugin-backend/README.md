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

export default async function createPlugin(
  env: PluginEnvironment,
  catalogEnv: CatalogEnvironment
): Promise<Router> {
  const builder = await CatalogBuilder.create(catalogEnv);

  builder.addProcessor(new ScaffolderEntitiesProcessor());

  const miaPlatformProvider = MiaPlatformEntityProvider.create(env.config, env.logger);
  builder.addEntityProvider(miaPlatformProvider);

  const { processingEngine } = await builder.build();

  await processingEngine.start();

  return await createRouter({
    logger: env.logger,
    config: env.config,
    miaPlatformEntityProvider: miaPlatformProvider,
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

const miaPlatformProvider = MiaPlatformEntityProvider.create(env.config, env.logger);
builder.addEntityProvider(miaPlatformProvider);

// ...

miaPlatformProvider.full_mutation()
return router;
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
and under `app`

```yaml
support:
    url: https://github.com/mia-platform/backstage-plugin/blob/main/README.md
    items: 
      - title: Documentation
        icon: docs
        links:
          - url: https://github.com/mia-platform/backstage-plugin/blob/main/README.md
            title: Repository
```