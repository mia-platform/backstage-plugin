# Mia-Platform Backstage Plugin Frontend

>  ⚠️ This project is work-in-progress

```sh
yarn workspace app add @mia-platform/backstage-plugin-frontend
```

In `packages/app/src/App.tsx`

```tsx
import { MiaPlatformPluginFrontendPage } from '@mia-platform/backstage-plugin-frontend'

// ...

<Route path="/mia-platform" element={<MiaPlatformPluginFrontendPage />} />
```

In `packages/app/src/components/Root/Root.tsx`

```tsx
<SidebarItem icon={MiaPlatformIcon} to="mia-platform" text="Mia Platform" />;
```
