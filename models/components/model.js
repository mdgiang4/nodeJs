var mongoose = require('mongoose')
var autoIncrement = require('mongoose-auto-increment')

var obj = {
    created: {
        type: Date,
        default: new Date()
    },
    updated: {
        type: Date,
        default: new Date()
    }
}

var path = {
    strict: true
}

module.exports = (function() {
    var _Schema = mongoose.Schema
    var _model = mongoose.model

    var Schema = null

    mongoose.Schema = function() {
        var args = Array().slice.call(arguments)
        if(args[0]) { Object.assign(args[0], obj) }
        if(args[1]) { Object.assign(args[1], obj) }

        Schema = _Schema.apply(mongoose, args)

        Schema.pre('save', function(next) {
            if(!this.isNew) {
                this.updated = new Date()
            }
            next()
        })

        return Schema
    }

    mongoose.model = function() {
        var args = Array().slice.call(arguments)
        if(args[0] && Schema) {
            Schema.plugin(autoIncrement.plugin, {model: args[0], field: 'id', startAt: 1, incrementBy: 1})
        }

        return _model.apply(this, args)
    }

    return mongoose
})()
