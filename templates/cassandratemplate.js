const { Client, auth } = require('cassandra-driver')
const createHttpError = require('http-errors')

module.exports = async (credentials, query, next) => {
    let client = null;
    try {
        let { authProvider } = credentials
        if (authProvider) {
            let { type, username, password, authorizationId } = authProvider
            if (type === "PlainTextAuthProvider" && !!username && !!password)
                credentials.authProvider = new auth.PlainTextAuthProvider(username, password)
            else if (type === "DsePlainTextAuthProvider" && !!username && !!password) {
                let args = [username, password]
                if (!!authorizationId)
                    args.push(authorizationId)
                credentials.authProvider = new auth.DsePlainTextAuthProvider(...args)
            }
            else throw new Error("Invalid authProvider structure detected")
        }
        client = new Client(credentials)
        await client.connect()

        const { execute, batch } = query

        let args = []
        let result = null

        if (!execute && !batch)
            throw Error('Either execute or batch must be supplied')

        if (execute) {
            const { cql, params, options } = execute
            if (cql) {
                args.push(cql)
                if (params) {
                    args.push(params)
                    if (options)
                        args.push(options)
                }
                result = await client.execute(...args)
            }
            else
                throw Error('CQL query must be supplied')
        }
        else {
            const { queries, options } = batch
            if (queries) {
                args.push(queries)
                if (options)
                    args.push(options)

                result = await client.batch(...args)
            }
            else
                throw Error('An array of queries must be supplied for batch')
        }

        await client.shutdown()
        client = null;
        
        return result
        
    } catch (error) {
        throw next(createHttpError(500, error.message))
    }
    finally {
        if (client)
            await client.shutdown()
    }
}