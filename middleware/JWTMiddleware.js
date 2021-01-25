const expressAsyncHandler = require('express-async-handler')
const createHttpError = require('http-errors')
const jwt = require('jsonwebtoken')

module.exports = expressAsyncHandler(async (req, res, next) => {
    
    const token = req.headers.authorization.split(' ')[1]
    // console.log(token)
    if (!token)
        throw createHttpError(401, 'Token not supplied')
    
    jwt.verify(token, process.env.JWTSECRET, (err, decoded) => {
        if (err)
            throw createHttpError(401, err.message, err)
        req.decoded = decoded
        next()
    })
})