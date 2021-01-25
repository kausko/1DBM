const { AES, enc } = require('crypto-js')

module.exports = (mode, creds) => {
    let newCredentials = { ...creds }
    let { credentials, sslOptions, authProvider } = newCredentials

    if (!credentials && !authProvider)
        throw Error('Credentials and/or AuthProvider must be supplied!')

    const args = mode === 'decrypt' ? [enc.Utf8] : []

    const sec = (keys, obj) => {
        let newObj = { ...obj }
        Object.keys(newObj).forEach(key => {
            if (keys.includes(key)) {
                newObj[key] = AES[mode](newObj[key], process.env.CJSECRET).toString(...args)
            }
        })
        return newObj
    }
    
    if (credentials && typeof credentials === 'object') {
        newCredentials.credentials = sec(['password'], credentials)
    }

    if (sslOptions && typeof sslOptions === 'object') {
        newCredentials.sslOptions = sec(['ca', 'cert', 'crl', 'key', 'passphrase', 'pfx'], sslOptions)
    }

    if (authProvider && typeof authProvider === 'object') {
        newCredentials.authProvider = sec(['password', 'authorizationId'], authProvider)
    }

    delete newCredentials.cloud

    return newCredentials
}