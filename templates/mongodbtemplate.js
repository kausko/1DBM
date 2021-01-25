const createHttpError = require('http-errors');
const { MongoClient } = require('mongodb')

module.exports = async (credentials, query, next) => {
    let client = null;
    try {

        let { stages } = query
        let database = query.database || credentials.database

        if (!database)
            throw new Error('Database name not supplied. Either supply it in credentials, or in query')

        if (!stages)
            throw new Error('Stages not supplied')

        let options = { useNewUrlParser: true, useUnifiedTopology: true }

        if (credentials.options)
            options = credentials.options

        if (credentials.uri)
            client = await MongoClient.connect(
                credentials.uri,
                {
                    ...options,
                    connectTimeoutMS: 10000,
                    socketTimeoutMS: 360000,
                    wtimeout: 10000,
                    serverSelectionTimeoutMS: 30000,
                    maxIdleTimeMS: 10000,
                    heartbeatFrequencyMS: 10000,
                    waitQueueTimeoutMS: 10000
                }
            )
        else {
            let connectionString = 'mongodb+srv://'
            if (credentials.user && credentials.password)
                connectionString += credentials.user + ':' + encodeURIComponent(credentials.password) + '@'
            if (credentials.host) {
                if (typeof credentials.host === 'string') {
                    connectionString += credentials.host
                    if (credentials.port)
                        connectionString += ":" + credentials.port
                }
                else if (Array.isArray(credentials.host)) {
                    for (let i = 0; i < credentials.length; i++) {
                        if (i > 0)
                            credentials += ","
                        
                        credentials += credentials.host[i]
                        if (credentials.port && Array.isArray[credentials.port] && credentials.port[i])
                            credentials += ":" + credentials.port[i]
                    }
                }
                else throw next(createHttpError(400, 'Invalid host supplied. Must be of type String or String[]'))
            }
            else throw next(createHttpError(400, 'Both host and connection uri not supplied. Cannot connect to database'))

            if (credentials.database)
                connectionString += "/" + credentials.database

            client = await MongoClient.connect(
                connectionString,
                options
            )
        }

        let link = client.db((database))

        for (let { fn, args } of stages) {
            if (!args)
                args = []
            link = link[fn](...args)
            if (!!link && typeof link.then === 'function')
                link = await link
        }

        return link

    } catch (error) {
        throw next(createHttpError(500, error.message))
    }
    finally {
        if (client)
            await client.close()
    }
}