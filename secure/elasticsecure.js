const { AES, enc } = require('crypto-js')

module.exports = (mode, credentials) => {
    let newCredentials = { ...credentials }
    let { auth, cloud, ssl } = newCredentials

    if (!auth && !cloud)
        throw Error('Authentication details and cloud id must be supplied')

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

    if (auth && typeof auth === 'object') {
        newCredentials.auth = sec(['password', 'apiKey'], auth)
    }

    if (cloud && typeof cloud === 'object') {
        newCredentials.cloud = sec(['id'], cloud)
    }

    if (ssl && typeof ssl === 'object') {
        newCredentials.ssl = sec(['ca', 'cert', 'crl', 'key', 'passphrase', 'pfx'], ssl)
    }

    return newCredentials
}