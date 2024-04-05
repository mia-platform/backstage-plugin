import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { miaPlatformPluginFrontendPlugin, MiaPlatformPluginFrontendPage } from '../src/plugin';

createDevApp()
  .registerPlugin(miaPlatformPluginFrontendPlugin)
  .addPage({
    element: <MiaPlatformPluginFrontendPage />,
    title: 'Root Page',
    path: '/mia-platform-plugin-frontend'
  })
  .render();
