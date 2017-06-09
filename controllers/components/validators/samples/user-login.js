var validator = require('./../validator')
var messages = require('./../../messages')('user-login')

validator.schema({
    email: {
        type: ['email', messages.email.type],
        required: [true, messages.email.required]
    },

    password: {
        required: [true, messages.password.required]
    }
})

module.exports = validator
