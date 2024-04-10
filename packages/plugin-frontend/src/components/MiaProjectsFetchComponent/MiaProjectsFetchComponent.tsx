import React, { useCallback, useEffect, useState } from 'react';
import { Table, TableColumn, Content, ContentHeader, LinkButton, Progress, ResponseErrorPanel, Link } from '@backstage/core-components';
import { Entity } from '@backstage/catalog-model'
import { useApi, configApiRef } from '@backstage/core-plugin-api'

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
  description: string,
  environments: Environment[],
  info: {
    projectOwner: string,
    teamContact: string,
    technologies: string[]
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

type DenseTableProps = {
  entities: Entity[];
  setBannerId: React.Dispatch<React.SetStateAction<string | undefined>>,
};

export const DenseTable = ({ entities, setBannerId }: DenseTableProps) => {
  const config = useApi(configApiRef)
  const baseUrl = config.getString('backend.baseUrl')
  const appUrl = config.getString('app.baseUrl')

  const columns: TableColumn[] = [
    { title: 'Name', field: 'name' },
    { title: 'Description', field: 'description' },
    { title: 'Owner', field: 'owner' },
    { title: 'Contacts', field: 'contacts' },
    { title: 'Project Link', field: 'projectLink' },
    { title: 'Repository', field: 'gitrepository' },
    { title: '', field: 'syncButton' },
  ];

  const data = entities.map(entity => {
    async function syncProject(companyId: string | undefined, projectId: string | undefined): Promise<void> {
      if (!projectId) {
        throw new Error('Missing project id');
      }
      if (!companyId) {
        throw new Error('Missing company id');
      }
      try {
        const uuid = window.crypto.randomUUID()
        setBannerId(uuid)
        await fetch(`${baseUrl}/api/mia-platform/sync/company/${companyId}/project/${projectId}`)
      }
      catch (exception) {
        /* empty */
}
    }

    return {
      name: (<Link to={`${appUrl}/catalog/default/system/${entity.metadata.name}`}>{entity.metadata.name}</Link>),
      tenantName: entity.metadata.annotations?.['mia-platform.eu/company-name'],
      description: entity.metadata.annotations?.['mia-platform.eu/project-description'],
      technologies: entity.metadata.annotations?.['mia-platform.eu/project-technologies'],
      owner: entity.metadata.annotations?.['mia-platform.eu/project-owner'],
      contacts: entity.metadata.annotations?.['mia-platform.eu/project-contacts'],
      gitrepository: (<Link to={entity.metadata.links?.at(1)?.url ?? ''}>Go to Repository</Link>),
      projectLink: (<Link to={entity.metadata.links?.at(0)?.url ?? ''}>Go to Project</Link>),
      syncButton: <LinkButton variant="contained" to="." onClick={() => syncProject(entity.metadata.annotations?.['mia-platform.eu/company-id'], entity.metadata.annotations?.['mia-platform.eu/project-id'])}>Sync</LinkButton>
    };
  });

  return (
    <Table
      options={{ search: false, paging: false }}
      columns={columns}
      data={data}
    />
  );
};

type Props = {
  setBannerId: React.Dispatch<React.SetStateAction<string | undefined>>,
}
type ComponentState = 'loading' | 'loaded' | Error
export const MiaProjectsFetchComponent: React.FC<Props> = ({ setBannerId }) => {
  const config = useApi(configApiRef)
  const [entities, setEntities] = useState<Entity[]>([])
  const [componentState, setComponentState] = useState<ComponentState>('loading')
  const baseUrl = config.getString('backend.baseUrl')

  const fetchEntities = useCallback(async () => {
    try {
      const response = await fetch(`${baseUrl}/api/catalog/entities`)
      const catalogEntities = await response.json() as Entity[]
      const projects = catalogEntities
        ?.filter(item => item.metadata.tags?.includes('mia-platform') && item.kind === 'System')
        .sort((item1, item2) => item1.metadata.name.localeCompare(item2.metadata.name))
      setEntities(projects)
      setBannerId(undefined)
      setComponentState((prev) => {
        if (prev === 'loading')
          return 'loaded'
        return prev
      })
    } catch (exception) {
      setComponentState((prev) => {
        if (prev === 'loading')
          return exception as Error
        return prev
      })
    }
  }, [baseUrl, setBannerId])

  function getDenseTable(systems: Entity[]): React.JSX.Element[] {
    const groupedSystems = systems.reduce((r, system: Entity) => {
      const domain = system.spec!!.domainName!! as string
      r[domain] = r[domain] || [];
      r[domain].push(system);
      return r;
    }, Object.create(null))
    const tables = []
    if (!systems.length) {
      tables.push(<ContentHeader title='No data' />)
      return tables
    }
    // eslint-disable-next-line guard-for-in
    for (const key in groupedSystems) {
      tables.push(
        <Content>
          <ContentHeader title={key} />
          <DenseTable entities={groupedSystems[key]} setBannerId={setBannerId} />
        </Content>
      )
    }
    return tables
  }
  useEffect(() => {
    fetchEntities()
    const intervalId = setInterval(fetchEntities, 5000)

    return () => {
      clearInterval(intervalId)
    }

  }, [fetchEntities])
  if (componentState === 'loading') {
    return <Progress />;
  } else if (componentState instanceof Error) {
    return <ResponseErrorPanel error={componentState} />;
  }

  return (
    <div>
      {getDenseTable(entities)}
    </div>)
};
