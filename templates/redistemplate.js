const createHttpError = require("http-errors");
const IORedis = require("ioredis");

module.exports = async (credentials, query, next) => {
    let client = null;
    try {

        if (!Array.isArray(query) || query.some(subarr => !Array.isArray(subarr)))
            throw new Error('Query must be supplied as Any[][] (Array of Array of <any> datatype)')

        client = new IORedis({
            ...credentials, 
            lazyConnect: true, 
            enableOfflineQueue: true, 
            retryStrategy: times => Math.min(times * 50, 2000),
            maxRetriesPerRequest: 1,
            reconnectOnError: err => err.message.includes("READONLY"),
            connectTimeout: 10000,
        })
        await client.connect()
        const result = await client.pipeline(query).exec()
        await client.quit()
        client = null;
        return result    
    }
    catch (error) {
        throw next(createHttpError(error))
    }
    finally {
        if (client)
            await client.quit()
    }
    
}