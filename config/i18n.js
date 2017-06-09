var i18n = require('i18n')
var path = require('path')

module.exports = function(app) {
    i18n.configure({
        locales: ['en', 'vn'],
        directory: path.join(__dirname, './../locales'),
        register: global
    })

    app.use(i18n.init)
}
