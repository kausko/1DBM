const createHttpError = require('http-errors');
const sql = require('mssql')

module.exports = async (credentials, query, next) => {
    let pool = null;
    try {
        pool = await sql.connect({
            ...credentials,
            // connectionTimeout: 10000,
            requestTimeout: 10000,
            stream: false,
            pool: {
                acquireTimeoutMillis: 10000,
                idleTimeoutMillis: 10000,
                createTimeoutMillis: 10000,
                destroyTimeoutMillis: 5000,
                reapIntervalMillist: 1000,
                createRetryIntervalMillis: 1000,
                min: 2,
                max: 5
            }
            
        })

        let result = pool.request()

        const { input, output, execute, text, createProcedure } = query

        if (!text && !execute)
            throw new Error('SQL query or executable procedure name must be supplied')

        if (input) {
            if (!Array.isArray(input))
                throw new Error('Input fields must be supplied in an array only')
            
            input.forEach(input => {

                const { name, type, args, value } = input

                if (!name)
                    throw new Error('Name of input parameter must be supplied')
                
                if (!value)
                    throw new Error('Value of input parameter must be supplied')

                if (type && sql[type]) {
                    if (args && Array.isArray(args))
                        result.input(name, sql[type](...args), value)
                    else
                        result.input(name, sql[type], value)
                }
                else
                    result.input(name, value)
            })
        }

        if (output) {
            if (!Array.isArray(output))
                throw new Error('Output fields must be supplied in an array only')

            output.forEach(output => {

                const { name, type, args, value } = output

                if (!name)
                    throw new Error('Name of output parameter must be supplied')

                if (!(type && sql[type]))
                    throw new Error('A valid type must be supplied for the output parameter must be supplied')

                let finalType = null
                if (args && Array.isArray(args))
                    finalType = sql[type](...args)
                else
                    finalType = sql[type]

                if (value)
                    result.output(name, finalType, value)
                else
                    result.output(name, finalType)
            })
        }

        if (text) {
            if (createProcedure)
                result = await result.batch(text)
            else
                result = await result.query(text)
        }
        else
            result = await result.execute(execute)

        await pool.close()
        pool = null;

        return result

    } catch (error) {
        throw next(createHttpError(error))
    }
    finally {
        if (pool)
            await pool.close()
    }
}