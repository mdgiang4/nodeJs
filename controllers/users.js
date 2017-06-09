var users = function() {}
module.exports = new users

users.prototype.get = {
    login: function(req, res) {
        var messages = require('./components/messages')('user-login')
        res.render('users/login', {
            csrfToken: req.csrfToken(),
            messages: messages
        })
    },

    logout: function(req, res) {
        req.logout()
        res.clearUserCookie()
        res.redirect('/users/login')
    },

    register: function(req, res) {
        var messages = require('./components/messages')('user-register')
        res.render('users/register', {
            csrfToken: req.csrfToken(),
            messages: messages
        })
    }
}

users.prototype.post = {
    login: function(req, res, next) {
        var passport = require('passport')
        var validator = require('./components/validators/user-login')

        res.attachments.messages = require('./components/messages')('user-login')
        res.attachments.csrfToken = req.csrfToken()

        validator.validate({
            _form: req.body._form,
            email: req.body.email,
            password: req.body.password
        }, function(err) {
            var self = this

            if(!err) {
                passport.authenticate('login', function(err, user, info) {
                    var message = __('Could not log in. Please try again later.')

                    if(user) {
                        if(req.body.remember) { res.saveUserCookie(user) }

                        req.logIn(user, function(err) {
                            if(err) {
                                req.flash('flash', {
                                    status: 'danger',
                                    message: message
                                })
                                res.render('users/login', {
                                    data: { email: self.email }
                                })
                            } else {
                                user.last_login = new Date()
                                user.save(function(err) {
                                    res.redirect('/users/info')
                                })
                            }
                        })
                    } else {
                        if(info) { message = info.message }
                        req.flash('flash', { status: 'danger', message: message })
                        res.render('users/login', { data: { email: self.email } })
                    }
                })(req, res, next)
            } else {
                res.render('users/login', { data: self, err: err })
            }
        })
    },

    register: function(req, res) {
        var User = rootRequire('models/user')
        var vefifyCaptcha = require('./components/verifyCaptcha')
        var validator = rootRequire('controllers/components/validators/user-register')

        res.attachments.messages = require('./components/messages')('user-register')
        res.attachments.csrfToken = req.csrfToken()

        vefifyCaptcha(req.body['g-recaptcha-response'], function(err, success) {
            if(!success) {
                var flash = { status: 'danger', message: __('Are you a bot?') }
                if(err) { flash.message = __('Sorry! We couldn\'t verify captcha, try again.') }
                req.flash('flash', flash)
                res.render('users/register')
            } else {
                validator.validate({
                    _form: req.body._form,
                    email: req.body.email,
                    password: req.body.password,
                    confirm_password: req.body.confirm_password
                }, function(err) {
                    if(!err) {
                        var user = new User({
                            email: req.body.email,
                            password: req.body.password
                        })

                        user.save(function(err, doc) {
                            if(doc) {
                                req.flash('flash', {
                                    status: 'success',
                                    message: __('Registered successfully, you can log in now.')
                                })
                            } else {
                                req.flash('flash', {
                                    status: 'danger',
                                    message: __('Registered failed, please try later.')
                                })
                            }
                            res.redirect('/users/register')
                        })
                    } else {
                        res.render('users/register', { data: this, err: err })
                    }
                })
            }
        })
    }
}

users.prototype.ajax = {
    is_unique_email: function(req, res) {
        var validator = require('./components/validator')
        var messages = require('./components/messages')('user-register')

        validator.schema({
            email: {
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
            }
        })

        validator.validate({
            email: req.body.email
        }, function(err) {
            if(err) {
                res.send(JSON.stringify({ unique: false }))
            } else {
                res.send(JSON.stringify({ unique: true }))
            }
        })
    }
}
