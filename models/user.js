var mongoose = require('./components/model')
var hasher = rootRequire('controllers/components/hasher')

var UserSchema = mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true,
    },

    last_login: {
        type: Date
    }
},{
    collection: 'users',
    versionKey: false
});

UserSchema.pre('save', function(next) {
    if(this.isNew || this.isModified('password')) {
        this.password = hasher.hash(this.password)
    }
    next()
})

UserSchema.methods.validPassword = function(password) {
    return hasher.check(password, this.password)
}

module.exports = mongoose.model('User', UserSchema)
