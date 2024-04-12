# Mia-Platform Backstage Plugin

Mia-Platform plugin elevates your workflow that seamlessly integrates your Mia-Platform components into Backstage. It keeps your information synchronized effortlessly and gains insights into your company's domains, projects, deployment environments, and repository links, all while exploring their interrelations.

## Requirements

For the plugin to work, the following packages must be installed and configured in the backstage application: 
 - [`@mia-platform/backstage-plugin-frontend`](https://github.com/mia-platform/backstage-plugin/blob/main/packages/plugin-frontend/README.md)
 - [`@mia-platform/backstage-plugin-backend`](https://github.com/mia-platform/backstage-plugin/blob/main/packages/plugin-backend/README.md)

 ## How it works

This plugin lets you access the companies you have on your Mia-Platform console with all its resources.

![Mia-Platform Page](img/mia-platform-plugin.png)

In the homepage of the plugin it is possibile to sync each project to get the latest updates on the project or to sync all the resources you have on your Mia-Platform Console.
For each project it is possible to be redirected through the links to the project on the console and to the repository on the git provider of your project.

Each company, project and its components are automatically added to your backstage catalog with all its relations.

![Catalog page](img/catalog-components.png)


By clicking on the specific entity, you can access its details and view its components, subcomponents, links, systems, and resources.

An example of a component detail page:

![Component detail page](img/component-detail.png)

An example of a system/project detail page: 

![System detail page](img/system-detail.png)
