const mongoose = require('mongoose')
const mongooseUniqueValidator = require('mongoose-unique-validator')

const requiredString = {
    type: String,
    required: true
}

// const credentialSchema = new mongoose.Schema({
//     name: {
//         type: String,
//         required: true,
//     },
//     uri: String,
//     host: mongoose.SchemaTypes.Mixed,
//     port: mongoose.SchemaTypes.Mixed,
//     database: String,
//     user: String,
//     username: String,
//     password: String,
//     options: mongoose.SchemaTypes.Mixed
//     //TODO
//     // bundle: Binary
// })

const userSchema = new mongoose.Schema({
    name: requiredString,
    email: {
        ...requiredString,
        unique: true
    },
    password: requiredString,
    providers: [{
        provider: requiredString,
        credentials: [mongoose.SchemaTypes.Mixed]
    }],
    emailValidated: {
        type: mongoose.SchemaTypes.Boolean
    },
    code: {
        type: mongoose.SchemaTypes.String
    }
})

userSchema.plugin(mongooseUniqueValidator)
const User = mongoose.model("User", userSchema)
module.exports = User