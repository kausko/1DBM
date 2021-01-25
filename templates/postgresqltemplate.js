const createHttpError = require("http-errors");
const { Pool } = require("pg");

module.exports = async (credentials, query, next) => {
    let pool = null;
    let client = null;
    try {

        if (!query.text)
            throw new Error('SQL query must be supplied in "text" field')

        if (credentials.uri) {
            credentials.connectionString = credentials.uri
            delete credentials.uri
        }

        pool = new Pool({
            ...credentials,
            max: 10,
            connectionTimeoutMillis: 10000,
            idleTimeoutMillis: 10000,
            statement_timeout: 10000,
            query_timeout: 10000,
            ssl: {
                rejectUnauthorized: false
            }
        })
        
        client = await pool.connect()
        const result = await client.query(query)
        
        client.release()
        client = null;
        
        await pool.end()
        pool = null;

        return result

    } catch (error) {
        throw next(createHttpError(error))
    }
    finally {
        if (client)
            client.release()
        if (pool)
            await pool.end()
    }
}