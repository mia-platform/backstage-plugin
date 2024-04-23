import { createBackend } from '@backstage/backend-defaults';
import miaPlatformModule from '../src'

const backend = createBackend();

backend.add(import('@backstage/plugin-catalog-backend/alpha'));
backend.add(import('@backstage/plugin-catalog-backend-module-scaffolder-entity-model'));
backend.add(miaPlatformModule())

backend.start();
