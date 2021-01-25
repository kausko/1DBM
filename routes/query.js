const { AES, enc } = require('crypto-js')
const express = require('express')
const asyncHandler = require('express-async-handler')
const createHttpError = require('http-errors')
const { Types } = require('mongoose')
const multer = require('multer')
const set = require('lodash/set')

const { validProviders } = require('../global')

const JWTMiddleware = require('../middleware/JWTMiddleware')

const User = require('../models/User')

const mongodbtemplate = require('../templates/mongodbtemplate')
const mssqltemplate = require('../templates/mssqltemplate')
const mysqltemplate = require('../templates/mysqltemplate')
const postgresqltemplate = require('../templates/postgresqltemplate')
const redistemplate = require('../templates/redistemplate')
const elastictemplate = require('../templates/elastictemplate')
const cassandratemplate = require('../templates/cassandratemplate')
const ibmdb2template = require('../templates/ibmdb2template')

const mongosecure = require('../secure/mongosecure')
const mssqlsecure = require('../secure/mssqlsecure')
const mysqlsecure = require('../secure/mysqlsecure')
const postgresqlsecure = require('../secure/postgresqlsecure')
const redissecure = require('../secure/redissecure')
const elasticsecure = require('../secure/elasticsecure')
const cassandrasecure = require('../secure/cassandrasecure')
const ibmdb2secure = require('../secure/ibmdb2secure')


const securityDrivers = {
    MongoDB: mongosecure,
    MSSQL: mssqlsecure,
    MySQL: mysqlsecure,
    PostgreSQL: postgresqlsecure,
    Redis: redissecure,
    Elasticsearch: elasticsecure,
    Cassandra: cassandrasecure,
    IBM_Db2: ibmdb2secure
}

const templateDrivers = {
    MongoDB: mongodbtemplate,
    Redis: redistemplate,
    PostgreSQL: postgresqltemplate,
    MySQL: mysqltemplate,
    MSSQL: mssqltemplate,
    Elasticsearch: elastictemplate,
    Cassandra: cassandratemplate,
    IBM_Db2: ibmdb2template
}

var router = express.Router()

router.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "PUT, OPTIONS, GET, POST, DELETE");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, X-Access-Token, X-Key, Authorization"
    );
    next();
})

router.post('/:provider', JWTMiddleware, multer().any(), asyncHandler(async (req, res, next) => {

    const { _id, email } = req.decoded

    if (!validProviders.includes(req.params.provider))
        throw next(createHttpError(400, 'Invalid provider supplied. Refer to documentation for list of valid providers'))

    // let { id, credentials, query } = req.body

    let id, credentials, query

    if (req.files) {
        if (req.body && req.body.json) {
            ;({ id, credentials, query } = JSON.parse(req.body.json))
            req.files.forEach(rf => set(credentials, rf.fieldname, rf.buffer.toString()))
        }
        else throw next(createHttpError(400, '"json" field not supplied with files'))
    }
    else {
        ;({ id, credentials, query} = req.body)
    }

    if (!query)
        throw next(createHttpError(400, "Query must be provided on this endpoint!"))

    if (!credentials) {
        if (!id)
            throw next(createHttpError(400, "'id' not found. Please supply valid credentials or an id pointing to your credentials"))

        credentials = (await User.aggregate([
            { $match: { _id: Types.ObjectId(_id), email } },
            {
                $unwind: {
                    path: '$providers',
                    preserveNullAndEmptyArrays: false
                }
            },
            { $replaceRoot: { newRoot: '$providers' } },
            {
                $unwind: {
                    path: '$credentials',
                    preserveNullAndEmptyArrays: false
                }
            },
            { $replaceRoot: { newRoot: '$credentials' } },
            { $match: { _id: Types.ObjectId(id) } },
            { $project: { _id: 0, name: 0 }}
        ]))[0]

        credentials = securityDrivers[req.params.provider]('decrypt', credentials)
    }

    if (!credentials)
        throw next(createHttpError(400, 'Credentials could not be obtained for querying your database. Please supply valid credentials or an id pointing to your credentials'))

    const result = await templateDrivers[req.params.provider](credentials, query, next)

    res.status(200).send(result)
}))

module.exports = router