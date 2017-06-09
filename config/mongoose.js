var mongoose = require('mongoose')
var autoIncrement = require('mongoose-auto-increment')

module.exports = function(app) {
    mongoose.Promise = global.Promise
    mongoose.connect('mongodb://127.0.0.1:27017/explore')
    autoIncrement.initialize(mongoose)
}
