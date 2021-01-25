const mysql = require("mysql2/promise");
const { readFileSync } = require('fs');
const createHttpError = require("http-errors");

module.exports = async(credentials, { sql, values }, next) => {
    let connection = null;
    try {
        if (!sql)
            throw new Error('SQL query not supplied!')
        
        connection = await mysql.createConnection({
            ...credentials,
            connectTimeout: 10000,
            connectionLimit: 5,
            queueLimit: 5
            // ssl: {
            //     ca: readFileSync('BaltimoreCyberTrustRoot.crt.pem'),
            // }
        })
        let result = null;
        if (values)
            result = await connection.execute(sql, values)
        else
            result = await connection.query(sql)
        
        await connection.end()
        connection = null;
        
        return result
    } catch (error) {
        throw next(createHttpError(error))
    }
    finally {
        if (connection)
            await connection.end()
    }
}