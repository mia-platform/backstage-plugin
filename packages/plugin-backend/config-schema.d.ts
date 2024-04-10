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
export interface Config {
  miaPlatform: {
    /**
     * Console root URL
     * @visibility backend
     */
    baseUrl: string,
    /**
     * gitlab root URL
     * @visibility backend
     */
    gitBaseUrl: string,
    /**
     * authorization type configuration
     * @visibility backend
     */
    authorizations: (
      {
        /**
         * authorization type
         * @visibility backend
         */
        authMode: 'BASIC',
        /**
         * client id of the service account of the console
         * @visibility backend
         */
        clientId: string,
        /**
         * client secret of the service account of the console
         * @visibility backend
         */
        clientSecret: string,
        /**
         * company id of the service account
         * @visibility backend
         */
        companyId: string
      } |
      {
        /**
         * authorization type
         * @visibility backend
         */
        authMode: 'JWT'
        /**
         * client id of the service account of the console
         * @visibility backend
         */
        clientId: string,
        /**
         * kid of the service account of the console
         * @visibility backend
         */

        kid: string,
        /**
         * private key path
         * @visibility backend
         */
        privateKeyPath: string,
        /**
         * expiration time of the jwt
         * @visibility backend
         */
        expirationTime: Number,
        /**
         * company id of the service account
         * @visibility backend
         */
        companyId: string
      }
    )[]
  }
}
