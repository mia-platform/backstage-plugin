describe('MiaPlatformEntityProvider', () => {
    // const clientId = 'clientId'
    // const clientSecret = 'clientSecret'
    // const config: Config = {
    //     backend: {
    //         baseUrl: 'baseUrl'
    //     },
    //     miaPlatform: {
    //         baseUrl: 'miaBaseUrl',
    //         gitBaseUrl: 'gitBaseUrl'
    //     }
    // }

    // eslint-disable-next-line jest/expect-expect
    it('authorization basic', async() => {
        global.fetch = jest.fn(() =>
        Promise.resolve({
            json: () => Promise.resolve({  }),
        }),
        ) as jest.Mock;
        // const response = authenticationBasic(clientId, clientSecret)
    })
})
