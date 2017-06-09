var csurf = require('csurf')

module.exports = function(app) {
    var csrfProtection = csurf({
        cookie: {
            key: '_csrf',
            httpOnly: true,
            maxAge: 1 * 60 * 60
        }
    })
    var invalidCsrfToken = rootRequire('middleware/invalidCsrfToken')

    app.use(csrfProtection)
    app.use(invalidCsrfToken)
}
