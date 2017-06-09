var cookieSession = require('cookie-session')

module.exports = function(app) {
    app.use(cookieSession({
        name: 'cookie-session',
        keys: ['QRt4CZkxZJ', 'BJGoeQ2e0K'],
        secret: 'v81Db7aYF7C6t0l3t34WHLbTgWbJ4a1b',
        maxAge: 1 * 60 * 60 * 1000
    }))
}
