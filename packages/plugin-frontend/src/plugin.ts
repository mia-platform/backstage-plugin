import { createPlugin, createRoutableExtension } from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const miaPlatformPluginFrontendPlugin = createPlugin({
  id: 'mia-platform-plugin-frontend',
  routes: {
    root: rootRouteRef,
  },
});

export const MiaPlatformPluginFrontendPage = miaPlatformPluginFrontendPlugin.provide(
  createRoutableExtension({
    name: 'MiaPlatformPluginFrontendPage',
    component: () =>
      import('./components/MiaProjectsTableComponent').then(m => m.MiaProjectsTableComponent),
    mountPoint: rootRouteRef,
  }),
);
