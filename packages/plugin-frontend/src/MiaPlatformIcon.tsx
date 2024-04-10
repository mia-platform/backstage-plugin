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
import SvgIcon from '@material-ui/core/SvgIcon';
import { IconComponent } from '@backstage/core-plugin-api';
import React from 'react';

export { miaPlatformPluginFrontendPlugin, MiaPlatformPluginFrontendPage } from './plugin';
export const MiaPlatformIcon: IconComponent = () => (
  <SvgIcon>
    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.60711 3.51206L8.55094 4.63917V6.89339L6.60711 8.00316L4.66155 6.87952V4.63917L6.60711 3.51206ZM6.60711 2L3.35237 3.87794V7.63555L6.60711 9.51522L9.86012 7.63555V3.87794L6.60711 2Z" />
      <path d="M10.2071 9.75331L12.1561 10.8787V13.1329L10.2071 14.2427L8.26325 13.1208V10.8787L10.2071 9.75678V9.75331ZM10.2071 8.24472L6.95407 10.1192V13.8768L10.2071 15.7565L13.4618 13.8768V10.1192L10.2071 8.24125V8.24472Z" />
      <path d="M13.8247 15.9986L15.7686 17.1222V19.3764L13.8247 20.4983L11.8792 19.366V17.1222L13.8247 16.0003V15.9986ZM13.8247 14.4865L10.57 16.3645V20.1221L13.8247 22L17.0777 20.1221V16.3645L13.8247 14.4848V14.4865Z" />
      <path d="M6.59166 15.9986L8.53549 17.1222V19.3764L6.59166 20.4983L4.64783 19.366V17.1222L6.59166 16.0003V15.9986ZM6.59166 14.4865L3.33691 16.3644V20.1221L6.59166 22L9.84641 20.1221V16.3644L6.59166 14.4848V14.4865Z" />
      <path d="M17.4083 9.75339L19.3539 10.8788V13.133L17.4083 14.2428L15.4645 13.1208V10.8788L17.4083 9.75686V9.75339ZM17.4083 8.2448L14.1536 10.1193V13.8769L17.4083 15.7565L20.6631 13.8769V10.1193L17.4083 8.24133V8.2448Z" />
    </svg>
  </SvgIcon>
);
