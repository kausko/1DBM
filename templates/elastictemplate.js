const { Client } = require('@elastic/elasticsearch');
const createHttpError = require('http-errors');
const invoke = require('lodash/invoke')

module.exports = async (credentials, query, next) => {
    let client = null;
    try {
        client = new Client({
            ...credentials,
            requestTimeout: 15000
        })

        let { func, args } = query

        if (!args)
            args = []

        const result = await invoke(client, func, ...args)

        await client.close()
        client = null;

        return result
        
    } catch (error) {
        throw next(createHttpError(500, error.message))
    }
    finally {
        if (client)
            await client.close()
    }
}