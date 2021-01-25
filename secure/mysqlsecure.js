const { AES, enc } = require('crypto-js')

module.exports = (mode, credentials) => {
    let newCredentials = { ...credentials }
    let { passwordSha1, uri, password, ssl } = newCredentials

    if (!uri && !password && !passwordSha1)
        throw Error('Uri/password/passwordSha1 not supplied!')

    const args = mode === 'decrypt' ? [enc.Utf8] : []

    if (passwordSha1)
        newCredentials.passwordSha1 = AES[mode](passwordSha1, process.env.CJSECRET).toString(...args)

    if (uri)
        newCredentials.uri = AES[mode](uri, process.env.CJSECRET).toString(...args)

    if (password)
        newCredentials.password = AES[mode](password, process.env.CJSECRET).toString(...args)

    if (ssl && typeof ssl === 'object') {
        let newSsl = { ...ssl }

        const keys = [
            'pfx',
            'key',
            'passphrase',
            'cert',
            'ca',
            'crl'
        ]

        Object.keys(ssl).forEach(key => {
            if (keys.includes(key)) {
                newSsl[key] = AES[mode](ssl[key], process.env.CJSECRET).toString(...args)
            }
        })

        newCredentials.ssl = newSsl
    }

    return credentials
}