/*
  Copyright 2024 Mia srl

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/
import { DeferredEntity, EntityProvider, EntityProviderConnection } from '@backstage/plugin-catalog-node';
import { Config } from '@backstage/config';
import crypto from 'crypto'
import * as fs from 'fs';
import { Logger } from 'winston';


type MiaPlatformAuthorizationBasic = {
  authMode: 'BASIC',
  clientId: string,
  clientSecret: string,
}
type MiaPlatformAuthorizationJwt = {
  authMode: 'JWT',
  clientId: string,
  kid: string,
  privateKeyPath: string,
  expirationTime: number,
}
type MiaPlatformAuthorization = MiaPlatformAuthorizationBasic | MiaPlatformAuthorizationJwt
type MiaPlatformConfiguration = {
  baseUrl: string,
  gitBaseUrl: string,
  companies: Record<string, MiaPlatformAuthorization>,
  appBaseUrl: string,
}
export type AuthResponse = {
  access_token: String,
  tokent_type: String,
  expires_in: Number
}

type LogicalScopeLayers = {
  name: string,
  order: number
}

type Dashboard = {
  id: string,
  label: string,
  type: string,
  url: string
}
type Host = {
  host: string,
  isBackoffice: boolean,
  scheme: string
}

type Environment = {
  cluster: {
    clusterId: string,
    namespace: string
  },
  dashboards: Dashboard[],
  deploy: {
    providerId: string,
    runnerTool: string,
    strategy: string,
    type: string
  },
  envId: string,
  envPrefix: string,
  hosts: Host[],
  isProduction: false,
  label: string,
  links: []
}

export type Project = {
  _id: string,
  configurationGitPath: string,
  description?: string,
  environments: Environment[],
  info?: {
    projectOwner?: string,
    teamContact?: string,
    technologies?: string[]
  },
  layerId: string,
  logicalScopeLayers: LogicalScopeLayers[],
  name: string,
  projectId: string,
  projectNamespaceVariable: string,
  repository: {
    providerId: string
  },
  tenantId: string,
  tenantName: string
}

type ProjectPublicVariable = {
  name: string,
  environments: Record<string, { value: string }>
}
type ProjectAnnotion = {
  name: string,
  description: string,
  value: string,
  readOnly: string,
}

type ProjectService = {
  name: string,
  annotations: ProjectAnnotion[],
  description: string,
  unsecretedVariables: ProjectPublicVariable[]
}

export type ProjectConfiguration = {
  services: Record<string, ProjectService>
}

export class MiaPlatformEntityProvider implements EntityProvider {
  private connection?: EntityProviderConnection;
  private companies: Record<string, MiaPlatformAuthorization>
  private consoleBaseUrl: string
  private gitBaseUrl: string
  private logger: Logger

  readMiaPlatformConfiguration(config: Config): MiaPlatformConfiguration {
    const appBaseUrl = config.getString('backend.baseUrl')
    const baseUrl = config.getString('miaPlatform.baseUrl')
    const gitBaseUrl = config.getString('miaPlatform.gitBaseUrl')
    const configAuthorizations = config.getConfigArray('miaPlatform.authorizations')
    const companies: Record<string, MiaPlatformAuthorization> = {}
    configAuthorizations.forEach(auth => {
      const authMode = auth.getString('authMode')
      const clientId = auth.getString('clientId')
      const companyId = auth.getOptionalString('companyId') ?? 'root'
      if (authMode === 'BASIC') {
        const clientSecret = auth.getString('clientSecret')
        companies[companyId] = {
          authMode,
          clientId,
          clientSecret,
        }
        return
      }
      if (authMode === 'JWT') {
        const kid = auth.getString('kid')
        const privateKeyPath = auth.getString('privateKeyPath')
        const expirationTime = auth.getNumber('expirationTime')
        companies[companyId] = {
          authMode,
          clientId,
          kid,
          privateKeyPath,
          expirationTime,
        }
        return
      }

      throw Error(`value of miaPlatform.authorizations.authMode is not valid: ${authMode}`)
    })

    return {
      baseUrl,
      gitBaseUrl,
      companies,
      appBaseUrl
    }
  }

  getConnection(): EntityProviderConnection | undefined {
    return this.connection
  }

  static create(config: Config, logger: Logger) {
    return new MiaPlatformEntityProvider(config, logger)
  }
  private constructor(
    config: Config,
    logger: Logger
  ) {
    const miaPlatformConfiguration = this.readMiaPlatformConfiguration(config)
    this.consoleBaseUrl = miaPlatformConfiguration.baseUrl
    this.gitBaseUrl = miaPlatformConfiguration.gitBaseUrl
    this.companies = miaPlatformConfiguration.companies
    this.logger = logger
  }
  getProviderName(): string {
    return `miaplatform-entity-provider`;
  }
  async connect(connection: EntityProviderConnection): Promise<void> {
    this.connection = connection;
  }

  async full_mutation() {
    await this.syncProjects(Object.keys(this.companies), undefined)
  }

  async syncProjects(companies: string[], projectId: string | undefined) {
    if (!this.connection) {
      this.logger.info('Impossibile to connect')
      throw new Error('Connection not initialized')
    }
    const promises = companies.map<Promise<Project[]>>(async companyId => {
      const projects = await this.getProjects(companyId)
      return projects ?? []
    })
    let projects = (await Promise.all(promises)).flat()
    if (!projects.length) {
      this.logger.info('No projects found')
    }
    if (projectId) {
      projects = projects.filter(project => project._id === projectId)
      const entities = await this.mapEntities(projects)
      try {
        await this.connection.applyMutation({
          type: 'delta',
          added: entities,
          removed: entities
        })
      } catch (error: any) {
        this.logger.error(`Impossible to apply delta mutation to catalog data, ${error?.message ?? 'unknown error'}`)
        throw new Error(`Impossible to apply delta mutation to catalog data: ${error?.message ?? 'unknown error'}`)
      }
    }
    else {
      const entities = await this.mapEntities(projects)
      try {
        await this.connection.applyMutation({
          type: 'full',
          entities,
        })
      } catch (error: any) {
        this.logger.error(`Impossible to apply full mutation to catalog data, ${error?.message ?? 'unknown error'}`)
        throw new Error(`Impossible to apply full mutation to catalog data: ${error?.message ?? 'unknown error'}`)
      }
    }
  }

  async getProjects(companyId: string): Promise<Project[] | undefined> {
    const company = this.companies[companyId]
    try {
      const accessToken = await this.authentication(company)
      const projectsRes = await fetch(
        `${this.consoleBaseUrl}/api/backend/projects/?tenantId=${companyId}`,
        {
          headers: { 'authorization': `Bearer ${accessToken}` }
        }
      )
      if (!projectsRes.ok) {
        return undefined
      }

      const projects = await projectsRes.json() as Project[]

      return projects
    } catch (error: any) {
      this.logger.error(`Impossible to retrieve projects for companyId: ${companyId}`)
      throw new Error(`Impossible to retrieve projects for companyId: ${companyId} with error: ${error?.message ?? 'unknown error'}`)
    }
  }

  async getProjectConfiguration(companyId: string, projectId: string, environment: string): Promise<ProjectConfiguration | undefined> {
    const company = this.companies[companyId]
    try {
      const accessToken = await this.authentication(company)
      const projectsRes = await fetch(
        `${this.consoleBaseUrl}/api/backend/projects/${projectId}/revisions/${environment}/configuration`,
        {
          headers: { 'authorization': `Bearer ${accessToken}` }
        }
      )
      if (!projectsRes.ok) {
        return undefined
      }

      const configuration = await projectsRes.json() as ProjectConfiguration

      return configuration
    } catch (error: any) {
      this.logger.error(`Impossible to get project's configuration for companyId: ${companyId}, with error: ${error.message ?? 'unknown error'}`)
      return undefined
    }

  }

  async authentication(company: MiaPlatformAuthorization): Promise<String> {
    if (company.authMode === 'BASIC') {
      company as MiaPlatformAuthorizationBasic
      return await this.authenticationBasic(company.clientId, company.clientSecret)
    }
    if (company.authMode === 'JWT') {
      company as MiaPlatformAuthorizationJwt
      return await this.authenticationJwt(company.clientId, company.privateKeyPath, company.kid, company.expirationTime)
    }

    throw Error(`Unknown authMode: ${company}`)
  }

  async authenticationBasic(clientId: string, clientSecret: string): Promise<String> {
    try {
      const token = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
      const details = {
        'grant_type': 'client_credentials'
      };
      const body: string[] = [];
      const encodedKey = encodeURIComponent('grant_type');
      const encodedValue = encodeURIComponent(details.grant_type);
      body.push(`${encodedKey}=${encodedValue}`);
      const formBody = body.join("&");
      const response = await fetch(
        `${this.consoleBaseUrl}/api/m2m/oauth/token`,
        {
          method: "POST",
          headers: {
            'authorization': `Basic ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
          },
          body: formBody
        }
      )
      const authResponse = await response.json() as AuthResponse
      return authResponse.access_token
    } catch (error: any) {
      this.logger.error(`Impossible to authenticate: ${error?.message ?? 'unknown error'}`)
      throw new Error(`Impossible to authenticate: ${error?.message ?? 'unknown error'}`)
    }
  }

  async authenticationJwt(clientId: string, privateKeyPath: string, kid: string, expirationTime: number): Promise<String> {
    try {
      const now = Math.floor(Date.now() / 1000)
      const claims = {
        "iss": clientId,
        "sub": clientId,
        "aud": "console-client-credentials",
        "jti": crypto.randomUUID(),
        "iat": now - 60,
        "exp": now + expirationTime
      }
      const secret = fs.readFileSync(privateKeyPath, 'utf8');
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(claims, secret, { algorithm: 'RS256', header: { typ: 'JWT', kid, } })

      const details = {
        'grant_type': 'client_credentials'
      };
      const body: string[] = [];
      body.push(`${encodeURIComponent('grant_type')}=${encodeURIComponent(details.grant_type)}`);
      body.push(`${encodeURIComponent('client_assertion_type')}=${encodeURIComponent('urn:ietf:params:oauth:client-assertion-type:jwt-bearer')}`);
      body.push(`${encodeURIComponent('client_assertion')}=${encodeURIComponent(token)}`);
      body.push(`${encodeURIComponent('client_id')}=${encodeURIComponent(clientId)}`);
      body.push(`${encodeURIComponent('token_endpoint_auth_method')}=${encodeURIComponent('private_key_jwt')}`);
      const formBody = body.join("&");
      const response = await fetch(
        `${this.consoleBaseUrl}/api/m2m/oauth/token`,
        {
          method: "POST",
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
          },
          body: formBody
        }
      )
      const authResponse = await response.json() as AuthResponse
      return authResponse.access_token
    } catch (error: any) {
      this.logger.error(`Impossible to authenticate: ${error?.message ?? 'unknown error'}`)
      throw new Error(`Impossible to authenticate: ${error?.message ?? 'unknown error'}`)
    }

  }

  async mapEntities(projects?: Project[]): Promise<DeferredEntity[]> {
    if (projects === undefined)
      return []
    let systemEntities: DeferredEntity[] = []
    systemEntities.push(this.getMiaPlatformGroup())
    const domains: DeferredEntity[] = []
    let components: DeferredEntity[] = []
    for (const project of projects) {
      domains.push(this.getDomain(project.tenantId))
      const system = this.getSystems(project)
      systemEntities.push(system)

      for (const env of project.environments) {
        const environment = this.getResource(project.projectId, project.tenantId, env)
        systemEntities.push(environment)

        const configuration = await this.getProjectConfiguration(project.tenantId, project._id, env.label.toLocaleLowerCase())
        const services = Object.keys(configuration?.services ?? {})
        components = components.concat(services.map((service: string) => this.getComponent(project, env, configuration?.services[service]!!)))
      }
    }
    const groupedComponents = components.reduce((r, component: DeferredEntity) => {
      r[component.entity.metadata.name] = r[component.entity.metadata.name] || [];
      r[component.entity.metadata.name].push(component);
      return r;
    }, Object.create(null))

    const finalComponents: DeferredEntity[] = []
    // eslint-disable-next-line guard-for-in
    for (const key in groupedComponents) {
      const group = groupedComponents[key]
      const dependsOn = group.map((component: DeferredEntity) => component.entity.spec?.dependsOn ?? [])
      const component = group[0]
      component.entity.spec.dependsOn = dependsOn.flat()
      finalComponents.push(component)
    }
    systemEntities = systemEntities.concat(finalComponents)

    const finalDomains: DeferredEntity[] = []
    const groupedDomains = domains.reduce((r, domain: DeferredEntity) => {
      r[domain.entity.metadata.name] = r[domain.entity.metadata.name] || [];
      r[domain.entity.metadata.name].push(domain);
      return r;
    }, Object.create(null))
    // eslint-disable-next-line guard-for-in
    for (const key in groupedDomains) {
      const group = groupedDomains[key]
      finalDomains.push(group[0])
    }
    systemEntities = systemEntities.concat(finalDomains)
    return systemEntities
  }

  getSystems(project: Project): DeferredEntity {
    const project_link = `${this.consoleBaseUrl}/projects/${project._id}/homepage`
    const git_url = `${this.gitBaseUrl}/${project.configurationGitPath}`
    return {
      entity: {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'System',
        metadata: {
          name: project.projectId,
          description: project.description,
          annotations: {
            'backstage.io/managed-by-location': 'url:mia-platform.eu',
            'backstage.io/managed-by-origin-location': 'url:mia-platform.eu',
            'mia-platform.eu/company-id': project.tenantId,
            'mia-platform.eu/company-name': project.tenantName,
            'mia-platform.eu/project-id': project._id,
            'mia-platform.eu/project-description': project.description,
            'mia-platform.eu/project-technologies': project.info?.technologies?.toString(),
            'mia-platform.eu/project-owner': project.info?.projectOwner,
            'mia-platform.eu/project-contacts': project.info?.teamContact,
          },
          links: [
            {
              url: project_link,
              title: 'project',
              icon: 'catalog'
            },
            {
              url: git_url,
              title: 'repository',
              icon: 'scaffolder'
            },
            {
              url: `${this.consoleBaseUrl}/projects/${project._id}/metrics/environments`,
              title: 'dashboards',
              icon: 'dashboard'
            }
          ],
          tags: ['mia-platform']
        },
        spec: {
          type: 'mia-platform-project',
          owner: 'mia-platform',
          domain: `${project.tenantId}`,
          domainName: project.tenantName
        }
      },
      locationKey: `mia-platform:${project.tenantId}:${project.projectId}`
    } as DeferredEntity
  }

  getDomain(companyId: string): DeferredEntity {
    return {
      entity: {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Domain',
        metadata: {
          name: companyId.replaceAll(' ', '-'),
          annotations: {
            'backstage.io/managed-by-location': 'url:mia-platform.eu',
            'backstage.io/managed-by-origin-location': 'url:mia-platform.eu',
          },
          links: [],
          tags: ['mia-platform']
        },
        spec: {
          type: 'mia-platform-company',
          owner: 'mia-platform'
        }
      },
      locationKey: `mia-platform:${companyId}`
    } as DeferredEntity
  }

  getResource(projectId: string, companyId: string, environment: Environment): DeferredEntity {
    return {
      entity: {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Resource',
        metadata: {
          name: environment.cluster.namespace.replaceAll(' ', '-'),
          annotations: {
            'backstage.io/managed-by-location': 'url:mia-platform.eu',
            'backstage.io/managed-by-origin-location': 'url:mia-platform.eu',
            'mia-platform.eu/env-id': environment.envId,
            'mia-platform.eu/env-prefix': environment.envPrefix,
            'mia-platform.eu/project-id': projectId,
            'mia-platform.eu/is-production': environment.isProduction.toString(),
            'mia-platform.eu/namespace': environment.cluster.namespace,
            'mia-platform.eu/env-label': environment.label,
          },
          links: [
            {
              url: `${this.consoleBaseUrl}/projects/${projectId}/monitoring/environments/${environment.envId}`,
              title: 'project',
              icon: 'catalog'
            }
          ],
          tags: ['mia-platform']
        },
        spec: {
          type: 'mia-platform-environment',
          owner: 'mia-platform',
          system: projectId,
        }
      },
      locationKey: `mia-platform:${companyId}:${projectId}`
    } as DeferredEntity
  }

  getComponent(project: Project, env: Environment, service: ProjectService): DeferredEntity {
    const serviceName = service.name.replaceAll(' ', '-').replaceAll(':', '_')
    let serviceVersion = service.annotations?.filter((item) => item.name === 'app.kubernetes.io/version')[0]?.value
    if (serviceVersion?.slice(0, 2) === '{{') {
      const publicVariableName = serviceVersion.replaceAll('{{', '').replaceAll('}}', '')
      const publicVariable = service.unsecretedVariables.filter((item) => item.name === publicVariableName)
      if (publicVariable.length > 0) {
        const variableValue = publicVariable[0].environments[env.envId].value
        serviceVersion = serviceVersion.replaceAll(`{{${publicVariableName}}}`, variableValue)
      }
    }

    const componentName = `${serviceName}${(serviceVersion) ? `_${serviceVersion}` : ''}`
    return {
      entity: {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: {
          // TODO: find a better name instad of adding companyId and projectId?
          name: `${componentName}_${project.tenantId}_${project.projectId}`,
          description: service.description,
          annotations: {
            'backstage.io/managed-by-location': 'url:mia-platform.eu',
            'backstage.io/managed-by-origin-location': 'url:mia-platform.eu',
          },
          links: [],
          tags: ['mia-platform'],
        },
        spec: {
          type: 'mia-platform-service',
          owner: 'mia-platform',
          lifecycle: env.envId,
          system: project.projectId,
          dependsOn: [
            `resource:${env.cluster.namespace.replaceAll(' ', '-')}`
          ]
        }
      },
      locationKey: `mia-platform:${project.tenantId}:${project.projectId}`
    } as DeferredEntity
  }

  getMiaPlatformGroup(): DeferredEntity {
    return {
      entity: {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Group',
        metadata: {
          name: `mia-platform`,
          annotations: {
            'backstage.io/managed-by-location': 'url:mia-platform.eu',
            'backstage.io/managed-by-origin-location': 'url:mia-platform.eu',
          },
          links: [
            {
              url: this.consoleBaseUrl,
              title: 'Mia Platform Console',
              icon: 'catalog'
            },
          ],
          tags: ['mia-platform']
        },
        spec: {
          type: 'internal-developer-portal',
          profile: {
            displayName: 'Mia Platform'
          },
          children: []
        }
      }
    } as DeferredEntity
  }
}
