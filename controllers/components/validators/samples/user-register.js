var validator = require('./../validator')
var messages = require('./../../messages')('user-register')

validator.schema({
    email: {
        required: [true,  messages.email.required],
        type: ['email', messages.email.type],
        verify: [true, messages.email.verify.error1, messages.email.verify.error2],
        validate: {
            isAsync: true,
            validator: function(v, cb) {
                var User = rootRequire('models/user')
                User.count({
                    email: this.email,
                    id: this.id == undefined ? {$exists: true} : {$ne: this.id}
                }, function(err, count) {
                    cb(count == 0)
                })
            },
            message: messages.email.unique
        }
    },

    password: {
        required: [true, messages.password.required],
        min: [6, messages.password.min],
        max: [32, messages.password.max]
    },

    confirm_password: {
        required: [true, messages.confirm_password.required],
        validate: {
            validator: function(v) {
                return v == this.password
            },
            message: messages.confirm_password.match
        }
    }
})

module.exports = validator
