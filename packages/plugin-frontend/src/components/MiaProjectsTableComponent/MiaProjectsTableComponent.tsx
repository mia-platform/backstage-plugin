import React, { useState } from 'react';
import { Grid } from '@material-ui/core';
import {
  Header,
  Page,
  Content,
  ContentHeader,
  SupportButton,
  LinkButton,
  DismissableBanner,
} from '@backstage/core-components';
import { MiaProjectsFetchComponent } from '../MiaProjectsFetchComponent';
import {useApi, configApiRef} from '@backstage/core-plugin-api'

export const MiaProjectsTableComponent = () => {
  const config = useApi(configApiRef)
  const baseUrl = config.getString('backend.baseUrl')
  const [bannerId, setBannerId] = useState<string>()
  // const [errorBannerId, setErrorBannerId] = useState<string>()

  const syncAllProjects = async() => {
    try {
      const uuid = window.crypto.randomUUID()
      setBannerId(uuid)
      await fetch(`${baseUrl}/api/mia-platform/sync`)
    } catch( exception ){
      // const uuid = window.crypto.randomUUID()
      // setErrorBannerId(uuid)
      return
    }
  }

  return (
  <Page themeId="tool">
    <Header title="Mia Platform Plugin" subtitle="Optional subtitle" />
    <Content>
      <ContentHeader
        titleComponent={<LinkButton variant="contained" to="." onClick={() => syncAllProjects()}>sync all</LinkButton>}
      >
        <div style={{display:'flex', justifyContent: 'space-evenly'}}>
          <SupportButton>A description of your plugin goes here.</SupportButton>
        </div>
      </ContentHeader>

      <Grid container spacing={3} direction="column">
        <Grid item>
            <MiaProjectsFetchComponent setBannerId={setBannerId}/>
        </Grid>
      </Grid>

      {
        bannerId && <DismissableBanner message='Data synchronization in progress' variant='info' fixed id={bannerId} />
      }
    </Content>
  </Page>
);}

