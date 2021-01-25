const { AES, enc } = require('crypto-js')

module.exports = (mode, credentials) => {
    let newCredentials = { ...credentials }

    let { connectionString, password, ssl } = newCredentials

    if (!connectionString && !password)
        throw Error('ConnectionString/Password not supplied!')

    const args = mode === 'decrypt' ? [enc.Utf8] : []

    if (connectionString)
        newCredentials.connectionString = AES[mode](connectionString, process.env.CJSECRET).toString(...args)

    if (password)
        newCredentials.password = AES[mode](password, process.env.CJSECRET).toString(...args)

    if (ssl && typeof ssl === 'object') {
        let newSsl = { ...ssl }

        const keys = [
            'ca',
            'cert',
            'crl',
            'key',
            'passphrase',
        ]

        Object.keys(ssl).forEach(key => {
            if (keys.includes(key)) {
                newSsl[key] = AES[mode](ssl[key], process.env.CJSECRET).toString(...args)
            }
        })

        newCredentials.ssl = newSsl
    }

    return newCredentials
}