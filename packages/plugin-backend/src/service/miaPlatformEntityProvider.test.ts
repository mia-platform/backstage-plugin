import { Config } from "@backstage/config";
import { MiaPlatformEntityProvider, Project, ProjectConfiguration } from "./miaPlatformEntityProvider";
import * as winston from "winston";

describe('MiaPlatformEntityProvider', () => {
    const companyId = 'companyId'
    const projectId = 'projectId'
    const environment = 'environment'
    const clientId = 'clientId'
    const clientSecret = 'clientSecret'
    const privateKeyPath = 'src/service/privateKeyTestFile.pem'
    const kid = 'kid'
    const expirationTime = 10
    const logger = winston.createLogger({
        level: 'info',
        format: winston.format.json(),
        transports: [new winston.transports.Console()]
    })
    const projects: Project[] = [{
        _id: 'id',
        configurationGitPath: 'configPath',
        environments: [{
            cluster: {
                clusterId: 'clusterId',
                namespace: 'namespace'
            },
            dashboards: [{
                id: 'id',
                label: 'label',
                type: 'type',
                url: 'url'
            }],
            deploy: {
                providerId: 'providerId',
                runnerTool: 'runnerTool',
                strategy: 'strategy',
                type: 'type'
            },
            envId: 'envId',
            envPrefix: 'envPrefix',
            hosts: [{
                host: 'host',
                isBackoffice: false,
                scheme: 'scheme'
            }],
            isProduction: false,
            label: 'label',
            links: []
        }],
        layerId: 'layerId',
        logicalScopeLayers: [{
            name: 'name',
            order: 1
        }],
        name: 'projectName',
        projectId: 'projectId',
        projectNamespaceVariable: 'projectNamespaceVariable',
        repository: {
            providerId: 'providerId'
        },
        tenantId: 'tenantId',
        tenantName: 'tenantName'
    }]
    const projectConfiguration: ProjectConfiguration = {
        services: {
            'microservice': {
                name: 'name',
                annotations: [{
                    name: 'name',
                    description: 'description',
                    value: 'value',
                    readOnly: 'readOnly'
                }],
                description: 'description',
                unsecretedVariables: [{
                    name: 'name',
                    environments: {
                        'env': {
                            value: 'value'
                        }
                    }
                }]
            }
        }
    }

    const config: Partial<Config> = {
        getString: (key: string) => { return key },
        getOptionalString: (key: string) => { return key },
        getNumber: (_key: string) => { return 2 },
        getConfigArray: (_key: string) => {
            return [{
                getString: (it: string) => {
                    if (it === 'authMode') {
                        return 'BASIC'
                    }
                    return it
                },
                getOptionalString: (it: string) => { return it },
                getNumber: (_it: string) => { return 2 },
            }] as Config[]
        },
    }

    it('authentication basic', async () => {
        const miaPlatformEntityProvider = MiaPlatformEntityProvider.create(config as Config, logger)
        global.fetch = jest.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve({
                    access_token: 'token'
                }),
            }),
        ) as jest.Mock;
        const response = await miaPlatformEntityProvider.authenticationBasic(clientId, clientSecret)
        expect(response).toEqual('token');
    })

    it('authentication jwt', async () => {
        const configAuthJWT = {
            ...config,
            getConfigArray: (_key: string) => {
                return [{
                    getString: (it: string) => {
                        if (it === 'authMode') {
                            return 'JWT'
                        }
                        if (it === 'privateKeyPath') {
                            return 'src/service/privateKeyTestFile.pem'
                        }
                        return it
                    },
                    getOptionalString: (it: string) => { return it },
                    getNumber: (_it: string) => { return 2 },
                }] as Config[]
            }
        }
        const miaPlatformEntityProvider = MiaPlatformEntityProvider.create(configAuthJWT as Config, logger)
        global.fetch = jest.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve({
                    access_token: 'token'
                }),
            }),
        ) as jest.Mock;
        const response = await miaPlatformEntityProvider.authenticationJwt(clientId, privateKeyPath, kid, expirationTime)
        expect(response).toEqual('token');
    })

    it('get projects', async () => {
        const miaPlatformEntityProvider = MiaPlatformEntityProvider.create(config as Config, logger)
        const mockFetch = jest.fn()
            .mockReturnValueOnce(
                Promise.resolve({
                    json: () => Promise.resolve({
                        access_token: 'token'
                    }),
                }))
            .mockReturnValueOnce(
                Promise.resolve(
                    Promise.resolve(
                        new Response(JSON.stringify([{
                            _id: 'id',
                            configurationGitPath: 'configPath',
                            environments: [{
                                cluster: {
                                    clusterId: 'clusterId',
                                    namespace: 'namespace'
                                },
                                dashboards: [{
                                    id: 'id',
                                    label: 'label',
                                    type: 'type',
                                    url: 'url'
                                }],
                                deploy: {
                                    providerId: 'providerId',
                                    runnerTool: 'runnerTool',
                                    strategy: 'strategy',
                                    type: 'type'
                                },
                                envId: 'envId',
                                envPrefix: 'envPrefix',
                                hosts: [{
                                    host: 'host',
                                    isBackoffice: false,
                                    scheme: 'scheme'
                                }],
                                isProduction: false,
                                label: 'label',
                                links: []
                            }],
                            info: undefined,
                            layerId: 'layerId',
                            logicalScopeLayers: [{
                                name: 'name',
                                order: 1
                            }],
                            name: 'projectName',
                            projectId: 'projectId',
                            projectNamespaceVariable: 'projectNamespaceVariable',
                            repository: {
                                providerId: 'providerId'
                            },
                            tenantId: 'tenantId',
                            tenantName: 'tenantName'
                        }]),
                            {
                                status: 200,
                                statusText: 'success'
                            })
                    ),
                )
            )
        global.fetch = mockFetch
        const response = miaPlatformEntityProvider.getProjects(companyId)
        await expect(response).resolves.toEqual(projects);
    })

    it('get project configuration', async () => {
        const miaPlatformEntityProvider = MiaPlatformEntityProvider.create(config as Config, logger)
        const mockFetch = jest.fn()
            .mockReturnValueOnce(
                Promise.resolve({
                    json: () => Promise.resolve({
                        access_token: 'token'
                    }),
                }))
            .mockReturnValueOnce(
                Promise.resolve(Promise.resolve(
                    new Response(JSON.stringify({
                        services: {
                            'microservice': {
                                name: 'name',
                                annotations: [{
                                    name: 'name',
                                    description: 'description',
                                    value: 'value',
                                    readOnly: 'readOnly'
                                }],
                                description: 'description',
                                unsecretedVariables: [{
                                    name: 'name',
                                    environments: {
                                        'env': {
                                            value: 'value'
                                        }
                                    }
                                }]
                            }
                        }
                    }),
                        {
                            status: 200,
                            statusText: 'success'
                        }
                    ),
                )))
        global.fetch = mockFetch
        const response = await miaPlatformEntityProvider.getProjectConfiguration(companyId, projectId, environment)
        expect(response).toEqual(projectConfiguration);
    })
})