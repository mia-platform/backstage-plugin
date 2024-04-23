# Mia-Platform Backstage Plugin Frontend

`@mia-platform/backstage-plugin-frontend` is a plugin for the Backstage frontend app. It shows information about the company and its projects on the Mia-Platform console.

## Requirements

This plugin requires [`@mia-platform/backstage-plugin-backend`](https://github.com/mia-platform/backstage-plugin/blob/main/packages/plugin-backend/README.md) which connects the frontend to the catalog of the backstage app and retrieves all the information from the Mia-Platform console API.

## Configuration

The first step is to install the plugin to your Backstage app:

```sh
yarn workspace app add @mia-platform/backstage-plugin-frontend
```

Once the plugin is installed in the App page `packages/app/src/App.tsx` add the route to our frontend page:

```tsx
import { MiaPlatformPluginFrontendPage } from '@mia-platform/backstage-plugin-frontend';

// ...

<Route path="/mia-platform" element={<MiaPlatformPluginFrontendPage />} />;
```

At the end on the Root page of your Backstage app `packages/app/src/components/Root/Root.tsx` add on the sidebar the Mia-Platform frontend page with its icon:

```tsx
import { MiaPlatformIcon } from '@mia-platform/backstage-plugin-frontend';

// ...

<SidebarItem icon={MiaPlatformIcon} to="mia-platform" text="Mia Platform" />;
```
