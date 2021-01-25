const ibmdb = require('ibm_db')
const createHttpError = require('http-errors')

module.exports = async (credentials, query, next) => {
    let client = null;
    try {
        client = await ibmdb.open(credentials.connectionString)

        const result = await client.query(query)

        await client.close()
        client = null;

        return result;
    } catch (error) {
        throw next(createHttpError(500, error.message))
    }
    finally {
        if (client)
            await client.close()
    }
}
