var mailer = require('express-mailer')

module.exports = function(app) {
    mailer.extend(app, {
        from: 'no-reply@example.com',
        host: 'smtp.gmail.com',
        secureConnection: true,
        port: 465,
        transportMethod: 'SMTP',
        auth: {
            user: 'testfblogin1234@gmail.com',
            pass: '123456789xyz'
        }
    })
}
