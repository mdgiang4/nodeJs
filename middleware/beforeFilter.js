var jwt = require('jsonwebtoken')
var cert = 'kkoLQenwBp'

var saveUserCookie = function(user) {
    var content = jwt.sign({_i: user.id, _p: user.password}, cert)
    this.cookie('_u', content, {maxAge: 1 * 60 * 60 * 1000, httpOnly: true})
    return true
}

var clearUserCookie = function() {
    this.clearCookie('_u')
}

var getUserCookie = function(cb) {
    var cookie = this.cookies._u
    if(cookie !== undefined) {
        var User = rootRequire('models/user')
        jwt.verify(cookie, cert, function(err, _u) {
            if(_u && _u._i && _u._p) {
                User.findOne({id: _u._i, password: _u._p}, function(err, user) {
                    cb(user)
                })
            } else {
                cb(null)
            }
        })
    } else {
        cb(null)
    }
}

var beforeFilter = function(req, res, next) {
    res.attachments = {}
    req.setLocale('en')
    req.getUserCookie = getUserCookie.bind(req)
    res.saveUserCookie = saveUserCookie.bind(res)
    res.clearUserCookie = clearUserCookie.bind(res)

    if(!req.user) {
        req.getUserCookie(function(user) {
            if(!user) { return next() }
            req.logIn(user, function(err) {
                next()
            })
        })
    } else {
        next()
    }
}

module.exports = beforeFilter
