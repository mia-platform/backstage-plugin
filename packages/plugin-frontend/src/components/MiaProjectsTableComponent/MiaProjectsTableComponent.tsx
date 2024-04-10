import React, { useState } from 'react';
import { Grid } from '@material-ui/core';
import {
  Header,
  Page,
  Content,
  ContentHeader,
  HeaderLabel,
  SupportButton,
  LinkButton,
  DismissableBanner,
} from '@backstage/core-components';
import { MiaProjectsFetchComponent } from '../MiaProjectsFetchComponent';
import { useApi, configApiRef } from '@backstage/core-plugin-api'

export const MiaProjectsTableComponent = () => {
  const config = useApi(configApiRef)
  const baseUrl = config.getString('backend.baseUrl')
  const [bannerId, setBannerId] = useState<string>()

  const syncAllProjects = async () => {
    try {
      const uuid = window.crypto.randomUUID()
      setBannerId(uuid)
      await fetch(`${baseUrl}/api/mia-platform/sync`)
    } catch (exception) {
      return
    }
  }

  return (
    <Page themeId="tool">
      <Header title="Mia Platform Sync" subtitle="Effortlessly sync and explore Mia-Platform components in Backstage">
        <HeaderLabel label="Owner" value="Mia Platform" />
      </Header>
      <Content>
        <ContentHeader titleComponent={<LinkButton variant="contained" to="." onClick={() => syncAllProjects()}>sync all</LinkButton>}>
          <div style={{ display: 'flex', justifyContent: 'space-evenly' }}>
            <SupportButton>Mia Platform plugin support</SupportButton>
          </div>
        </ContentHeader>
        <Grid container spacing={3} direction="column">
          <Grid item>
            <MiaProjectsFetchComponent setBannerId={setBannerId} />
          </Grid>
        </Grid>
        {
          bannerId && <DismissableBanner message='Data synchronization in progress' variant='info' fixed id={bannerId} />
        }
      </Content>
    </Page>
  );
}

