const { AES, enc } = require("crypto-js")

module.exports = (mode, credentials) => {
    let newCredentials = {...credentials}
    let { uri, password, options } = newCredentials

    if (!uri && !password && !options)
        throw Error('A uri or a password must be supplied for connecting to a MongoDB instance')

    const args = mode === 'decrypt' ? [enc.Utf8] : []

    if (uri)
        newCredentials.uri = AES[mode](uri, process.env.CJSECRET).toString(...args)

    if (password)
        newCredentials.password = AES[mode](password, process.env.CJSECRET).toString(...args)

    if (options && typeof options === 'object') {

        let newOptions = {...options}

        const keys = [
            'sslCA', 
            'sslCert', 
            'sslKey', 
            'sslPass', 
            'sslCRL', 
            'tlsCAFile', 
            'tlsCertificateKeyFile', 
            'tlseCertificateKeyFilePassword',
        ]
        
        Object.keys(options).forEach(key => {
            if (keys.includes(key)) {
                newOptions[key] = AES[mode](options[key], process.env.CJSECRET).toString(...args)
            }
        })

        if (options.auth && options.auth.password) {
            newOptions.auth = { 
                ...options.auth,
                password: AES[mode](options.auth.password, process.env.CJSECRET).toString(...args)
            }
        }

        newCredentials.options = newOptions
    }

    return newCredentials

}