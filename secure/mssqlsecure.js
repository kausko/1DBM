const { AES, enc } = require('crypto-js')

module.exports = (mode, credentials) => {
    let newCredentials = { ...credentials }

    const args = mode === 'decrypt' ? [enc.Utf8] : []

    if (newCredentials.password) {
        newCredentials.password = AES[mode](credentials.password, process.env.CJSECRET).toString(...args)
    }
    else throw new Error('A password must be supplied for connecting to your MSSQL instance')

    return newCredentials
}