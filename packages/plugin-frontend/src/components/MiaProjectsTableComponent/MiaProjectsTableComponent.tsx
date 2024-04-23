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

export const MiaProjectsTableComponent = ({ apiPrefix }: { apiPrefix?: string }) => {
  const config = useApi(configApiRef)

  const baseUrl = config.getString('backend.baseUrl')
  const url = `${baseUrl}/api${apiPrefix ?? '/catalog/modules/mia-platform'}`

  const [bannerId, setBannerId] = useState<string>()

  const syncAllProjects = async () => {
    try {
      const uuid = window.crypto.randomUUID()
      setBannerId(uuid)
      await fetch(`${url}/sync`)
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
            <MiaProjectsFetchComponent apiUrl={url} setBannerId={setBannerId} />
          </Grid>
        </Grid>
        {
          bannerId && <DismissableBanner message='Data synchronization in progress' variant='info' fixed id={bannerId} />
        }
      </Content>
    </Page>
  );
}

