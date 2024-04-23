# Mia-Platform Backstage Plugin Backend

`@mia-platform/backstage-plugin-backend` is a plugin for the Backstage backend app. It updates and inserts on the catalog of your Backstage application all the entities that can be found on your Mia-Platform console such as components, resources, systems etc. It also displays all these information on a dedicated page of the plugin.

## Requirements

This plugin requires [`@mia-platform/backstage-plugin-frontend`](https://github.com/mia-platform/backstage-plugin/blob/main/packages/plugin-frontend/README.md) to display all the information retrieved by the backend plugin on a dedicated page.

## Configuration

### New backend system

1. Install the plugin to your Backstage app:
```sh
yarn workspace backend add @mia-platform/backstage-plugin-backend
```

2. In `packages/backend/src/index.ts` import the plugin and add it to the backend:

```ts
import miaPlatformModule from '@mia-platform/backstage-plugin-backend';

// ...

backend.add(import('@backstage/plugin-catalog-backend-module-scaffolder-entity-model'));
backend.add(import('@backstage/plugin-catalog-backend/alpha'));

// ...

backend.add(miaPlatformModule());
```

3. Add to your `app-config.yaml` file the section for the configuration of support button and the Mia-Platform console

Under `app` add the configuration for the support button

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

And then the configuration for the Mia-Platform console:

```yaml
miaPlatform:
  baseUrl: ...
  gitBaseUrl: ...
  authorizations:
    - authMode: 'BASIC'
      clientId: ...
      clientSecret: ...
      companyId: ...
    - authMode: 'JWT'
      clientId: ...
      kid: ...
      privateKeyPath: ...
      expirationTime: ...
      companyId: ...
```

  - `baseUrl`: Mia Platform console url
  - `authorizations`: array of service accounts to use to retrieve projects information

### Legacy backend system

1. Install the plugin to your Backstage app:
```sh
yarn workspace backend add @mia-platform/backstage-plugin-backend
```
2. Create a new file `packages/backend/src/plugins/mia-platform.ts` with content:

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

3. In `packages/backend/src/index.ts` import the plugin and add the route to the plugin:

```ts
import miaPlatform from './plugins/mia-platform'

// ...

const miaPlatformEnv = useHotMemoize(module, () => createEnv('mia-platform'));

// ...

apiRouter.use('/mia-platform', await miaPlatform(miaPlatformEnv, catalogEnv));
```
4. In `packages/backend/src/plugins/catalog.ts` add the following lines of code to the existing file:

```ts
import { MiaPlatformEntityProvider } from '@mia-platform/backstage-plugin-backend';

// ...
// under line builder.addProcessor(new ScaffolderEntitiesProcessor());

const miaPlatformProvider = MiaPlatformEntityProvider.create(env.config, env.logger);
builder.addEntityProvider(miaPlatformProvider);

// ... 
// under line await processingEngine.start();

miaPlatformProvider.full_mutation()
```

This part is needed to insert all the Mia-Platform resources to the catalog of your Backstage application.

5. Add to your `app-config.yaml` file the section for the configuration of support button and the Mia-Platform console

Under `app` add the configuration for the support button

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

And then the configuration for the Mia-Platform console:

```yaml
miaPlatform:
  baseUrl: ...
  gitBaseUrl: ...
  authorizations:
    - authMode: 'BASIC'
      clientId: ...
      clientSecret: ...
      companyId: ...
    - authMode: 'JWT'
      clientId: ...
      kid: ...
      privateKeyPath: ...
      expirationTime: ...
      companyId: ...
```

  - `baseUrl`: Mia Platform console url
  - `authorizations`: array of service accounts to use to retrieve projects information

## Authorization

The authorization elements inside the array should match one of the following:

##### BASIC
- `authMode`: 'BASIC'
- `clientId`: clientId used by the service account
- `clientSecret`: clientSecret used by the service account
- `companyId`: companyId related to the service account

##### JWT
- `authMode`: 'JWT'
- `clientId`: clientId used by the service account
- `kid`: kid related to the service account to use
- `privateKeyPath`: path to the file with the private key
- `companyId`: companyId related to the service account
