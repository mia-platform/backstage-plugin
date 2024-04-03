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
