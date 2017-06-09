var passport = require('passport')
var localStrategy = require('passport-local')
var User = rootRequire('models/user')

module.exports = function(app) {
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        User.findOne({id: id}, function(err, user) {
            done(err, user);
        });
    });

    passport.use('login', new localStrategy({
        usernameField: 'email',
        password: 'password',
        passReqToCallback: true
    }, function(req, email, password, done) {
        User.findOne({email: email}, function(err, user) {
            if(err) { return done(err) }
            if(!user) {
                return done(null, null, { message: __('The email you entered did not match any accounts.') })
            }
            if (!user.validPassword(password)) {
                return done(null, null, { message: __('The password is incorrect.') });
            }
            return done(null, user);
        })
    }))

    app.use(passport.initialize())
    app.use(passport.session())
}
