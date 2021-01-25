const asyncHandler = require('express-async-handler')
const createHttpError = require('http-errors')
const express = require('express');
const { AES, enc } = require('crypto-js');
const { Types } = require('mongoose');
const set = require('lodash/set')
const omit = require('lodash/omit')
const multer = require('multer');

const { validProviders } = require('../global');

const JWTMiddleware = require('../middleware/JWTMiddleware');

const User = require('../models/User');

const mongosecure = require('../secure/mongosecure')
const mssqlsecure = require('../secure/mssqlsecure')
const mysqlsecure = require('../secure/mysqlsecure')
const postgresqlsecure = require('../secure/postgresqlsecure')
const redissecure = require('../secure/redissecure');
const cassandrasecure = require('../secure/cassandrasecure');
const elasticsecure = require('../secure/elasticsecure');
const ibmdb2secure = require('../secure/ibmdb2secure');

const securityDrivers = {
  MongoDB: mongosecure,
  MSSQL: mssqlsecure,
  MySQL: mysqlsecure,
  PostgreSQL: postgresqlsecure,
  Redis: redissecure,
  Cassandra: cassandrasecure,
  Elasticsearch: elasticsecure,
  IBM_Db2: ibmdb2secure
}


var router = express.Router();

router.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "PUT, OPTIONS, GET, POST, DELETE");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, X-Access-Token, X-Key, Authorization"
  );
  next();
})


// GET CREDENTIALS
router.get('/', JWTMiddleware, asyncHandler(async (req, res, next) => {
  const { _id, email } = req.decoded
  const user = (await User
    .findOne({ _id, email }, { _id: 0, password: 0, "providers._id": 0 })).toObject()
    // .populate({ path: 'providers', select: '_id name'})

  res.status(200).send({
    ...user,
    providers: user.providers.map(pv => ({
      ...pv,
      credentials: pv.credentials.map(credential => 
        omit(
          securityDrivers[pv.provider]('decrypt', credential), 
          [
            'ssl', 
            'tls', 
            'options.sslCA',
            'options.sslCert',
            'options.sslKey',
            'options.sslCRL',
            'sslOptions'
          ]
        )
      )
    }))
  })
}))


// POST CREDENTIALS
router.post('/', JWTMiddleware, multer().any(), asyncHandler(async (req, res, next) => {
  const { _id, email } = req.decoded
  
  let outerProvider, outerRest

  if (req.files) {
    if (req.body && req.body.json) {
      let { provider, ...rest } = JSON.parse(req.body.json)
      req.files.forEach(rf => set(rest, rf.fieldname, rf.buffer.toString()))
      outerProvider = provider
      outerRest = rest
    }
    else throw next(createHttpError(400, '"json" field not provided with files'))
  }
  else {
    let { provider, ...rest } = req.body
    outerProvider = provider
    outerRest = rest
  }

  if (!outerProvider || !validProviders.includes(outerProvider))
    throw next(createHttpError(400, 'Invalid provider supplied. Refer to documentation for list of valid providers'))

  if (!outerRest.name)
    throw next(createHttpError(400, 'A name should be provided with your credentials. This makes it easier for you to identify the source of these credentials'))

  const user = await User.findOne({ _id, email })

  if (!user)
    throw next(createHttpError(404, 'User not found'))

  outerRest = securityDrivers[outerProvider]('encrypt', outerRest)

  outerRest._id = Types.ObjectId()

  let providers = user.toObject().providers

  const idx = providers.findIndex(pv => pv.provider === outerProvider)

  if (idx === -1) {
    providers.push({
      provider: outerProvider,
      credentials: [outerRest]
    })
  }
  else {
    providers[idx] = {
      ...providers[idx],
      credentials: [...providers[idx].credentials, outerRest]
    }
  }
  

  const result = await User.updateOne(
    { _id, email }, 
    { providers: providers.filter(pv => pv.credentials.length !== 0) }
  )

  if (!result.nModified) {
    throw next(createHttpError(500, 'Could not be added'))
  }
  
  res.status(200).send('Added credentials to database')
}))


// DELETE CREDENTIALS
router.delete('/', JWTMiddleware, asyncHandler(async (req, res, next) => {

  const { _id, email } = req.decoded
  const { id } = req.body

  if (!id)
    throw next(createHttpError(400, 'id must be provided for deletion'))

  const result = await User.updateOne(
    { _id, email }, 
    {
      $pull: {
        "providers.$[].credentials": { _id: Types.ObjectId(id) }
      }
    },
  )

  if (!result.nModified)
    throw next(createHttpError(500, 'Could not be deleted'))

  res.status(200).send('Deleted credentials from database')
}))

module.exports = router;
