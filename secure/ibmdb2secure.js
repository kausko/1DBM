const { AES, enc } = require('crypto-js')

module.exports = (mode, credentials) => {
    const { connectionString } = credentials

    if (credentials) {
        const args = mode === 'decrypt' ? [enc.Utf8] : []
        credentials.connectionString = AES[mode](connectionString, process.env.CJSECRET).toString(...args)
    }

    return credentials
}