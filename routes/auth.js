const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const createHttpError = require('http-errors');
const asyncHandler = require('express-async-handler')
const express = require('express');
const mail = require('../mail');

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

// Login
router.post('/', asyncHandler(async (req, res, next) => {
  const { email, password, code } = req.body

  const user = await User.findOne({ email })

  if (!user)
    throw next(createHttpError(404, 'User not found'))

  const validPassword = await bcrypt.compare(password, user.password)

  
  if (!user.emailValidated) {
    if (!code)
      throw next(createHttpError(401, 'Validation code not supplied for 1st time login'))
    else if (user.code !== code.split('-').join(''))
      throw next(createHttpError(401, 'Invalid validation code'))
    else {
      await User.updateOne({ email }, { $set: { emailValidated: true }})
    }
  }

  if (!validPassword)
    throw next(createHttpError(401, 'Invalid password'))

  const payload = {
    _id: user._id,
    email: user.email
  }

  jwt.sign(payload, process.env.JWTSECRET, { expiresIn: '1d' }, (err, token) => {
    if (err)
      throw next(createHttpError(500, err.message))
    else
      res.status(200).send(token)
  })
}))

// Register
router.post('/register', asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body

  const salt = await bcrypt.genSalt(10)
  hashedPass = await bcrypt.hash(password, salt)

  const chs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789"

  // GENERATES RANDOM ALPHANUMERIC HYPHENATED 16 digit code
  const code = Array(16).fill(0).map((n, i) => (i ? i % 4 ? '' : '-' : '') + chs.charAt(Math.floor(Math.random()*chs.length))).join('')
  
  await mail(email, code)

  await User.create({ 
    name, 
    email, 
    password: hashedPass, 
    providers: [],
    emailValidated: false,
    code: code.split('-').join('')
  })

  res.status(200).send('Account created')

}))

module.exports = router;
