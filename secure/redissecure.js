const { AES, enc } = require("crypto-js")

module.exports = (mode, credentials) => {
    let newCredentials = {...credentials}
    let { password, tls } = newCredentials

    if (!password && !tls)
        throw Error('Password/TLS details not supplied!')

    const args = mode === 'decrypt' ? [enc.Utf8] : []

    if (password)
        newCredentials.password = AES[mode](password, process.env.CJSECRET).toString(...args)

    if (tls && typeof tls === 'object') {
        let newTls = { ...tls }

        const keys = [
            'ca',
            'cert',
            'crl',
            'key',
            'passphrase',
        ]

        Object.keys(tls).forEach(key => {
            if (keys.includes(key)) {
                newTls[key] = AES[mode](tls[key], process.env.CJSECRET).toString(...args)
            }
        })

        newCredentials.tls = newTls
    }

    return newCredentials
}