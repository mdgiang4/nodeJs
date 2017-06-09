var crypto = require('crypto')

var hasher = {
    hash: function(str) {
        return crypto.createHash('md5').update(str).digest('hex')
    },
    check: function(str, hashed) {
        return this.hash(str) == hashed
    }
}

module.exports = hasher
