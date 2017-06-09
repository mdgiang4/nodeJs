var email_validator = require('email-validator')
var Promise = require('promise')

var validator = function() {
    this.blueprint = {}
    this.sample = {}

    this.test = {
        empty: function(v) {
            if(v === undefined || v === null) { return true }
            if(v.constructor === String) { return String().trim.call(v) === '' }
            if(v.constructor === Array) { return v.length == 0 }
            if(v instanceof Object) { return Object.keys(v).length == 0 }
            return String().trim.call(v.toString()) === ''
        },
        email: function(v) { return email_validator.validate(v) },
        number: function(v) { return !isNaN(Number(v)) }
    }

    this.check = {
        required: function(v, arr) {
        var self = this
            var msg = arr[2] !== undefined ? arr[2] : __('%s validation failed.', arr[0])
            return new Promise(function(resolve, reject) {
                if(arr[1] && self.test.empty(v)) { return reject([arr[0], msg]) }
                resolve(arr[0])
            })
        },
        type: function(v, arr) {
            var self = this
            var msg = arr[2] !== undefined ? arr[2] : __('%s validation failed.', arr[0])
            return new Promise(function(resolve, reject) {
                switch(arr[1]) {
                    case 'email': {
                        if(!self.test.email(v)) { return reject([arr[0], msg]) }
                    } break

                    case 'number': {
                        if(!self.test.number(v)) { return reject([arr[0], msg]) }
                    } break
                }
                resolve(arr[0])
            })
        },
        match: function(v, arr) {
            var self = this
            var msg = arr[2] !== undefined ? arr[2] : __('%s validation failed.', arr[0])
            return new Promise(function(resolve, reject) {
                if(!(arr[1] instanceof RegExp && arr[1].test(v))) { return reject([arr[0], msg]) }
                resolve(arr[0])
            })
        },
        min: function(v, arr) {
            var msg = arr[2] !== undefined ? arr[2] : __('%s validation failed.', arr[0])
            return new Promise(function(resolve, reject) {
                if(v.length < arr[1]) { return reject([arr[0], msg]) }
                resolve(arr[0])
            })
        },
        max: function(v, arr) {
            var msg = arr[2] !== undefined ? arr[2] : __('%s validation failed.', arr[0])
            return new Promise(function(resolve, reject) {
                if(v.length > arr[1]) { return reject([arr[0], msg]) }
                resolve(arr[0])
            })
        },
        validate: function(v, arr) {
            var objs = Array().concat.apply([], Array().slice.call(arr, 1))
            var self = this
            return new Promise(function(resolve, reject) {
                var process = []
                objs.map(function(o) {
                    process.push(function() {
                        return new Promise(function(resolve, reject) {
                            if(o.isAsync) {
                                o.validator.call(self.sample, v, resolve)
                            } else {
                                resolve(o.validator.call(self.sample, v))
                            }
                        })
                    }())
                })
                if(!process.length) { return resolve(arr[0]) }
                Promise.all(process).then(function(res) {
                    if(res.indexOf(false) < 0) { return resolve(arr[0]) }
                    var msg = (objs[res.indexOf(false)].message !== undefined ?
                                objs[res.indexOf(false)].message : __('%s validation failed.', arr[0]))
                    reject([arr[0], msg])
                })
            })
        },
        verify: function(v, arr) {
            var self = this
            var msg1 = arr[2] !== undefined ? arr[2] : __('%s validation failed.', arr[0])
            var msg2 = arr[3] !== undefined ? arr[3] : __('%s validation failed.', arr[0])
            return new Promise((resolve, reject) => {
                if(!arr[1]) { return resolve(arr[0]) }

                var smtp = require('smtp-client')
                let s = new smtp.SMTPClient({
                    host: 'gmail-smtp-in.l.google.com',
                    port: '25'
                })
                s.connect()
                .then(function() {
                    (() => {
                        return new Promise((resolve, reject) => {
                            s.greet({hostname: 'mx.domain.com'})
                            .then(() => {
                                s.mail({from: 'from@sender.com'})
                                .then(() => {
                                    s.rcpt({to: v})
                                    .then(res => { resolve(res) })
                                    .catch(err => { reject(err) })
                                })
                                .catch(err => { reject(err) })
                            })
                            .catch(err => { reject(err) })
                        })
                    })()
                    .then(res => {
                        s.quit()
                        resolve(arr[0])
                    })
                    .catch(err => {
                        s.quit()
                        var msg = msg1
                        if(err.code != 550) { msg = msg2 }
                        reject([arr[0], msg])
                    })
                })
                .catch(err => { reject([arr[0], msg2]) })
            })
        }
    }
}
validator.prototype.schema = function(obj) { this.blueprint = obj }
validator.prototype.validate = function(obj, cb) {
    if(!(obj instanceof Object)) { cb(null) }

    this.sample = obj

    var self = this
    var process = []
    for(i in obj) {
        if(this.blueprint[i] !== undefined) {
            process.push(function() {
                return new Promise(function(resolve, reject) {
                    var process = []
                    for(ix in self.blueprint[i]) {
                        if(self.check[ix] !== undefined && ix != 'validate' && ix != 'verify') {
                            process.push(self.check[ix].call(self, obj[i], Array().concat.call([i], self.blueprint[i][ix])))
                        }
                    }
                    if(!process.length) {
                        if(self.blueprint[i]['validate'] !== undefined || self.blueprint[i]['verify'] !== undefined) {
                            process.push(((i) => {
                                return new Promise((resolve, reject) => { resolve(i) })
                            })(i))
                        } else {
                            return resolve(null)
                        }
                    }
                    Promise.all(process)
                    .then(i => {
                        i = i[0]
                        if(self.blueprint[i]['validate'] !== undefined) {
                            self.check.validate.call(self, obj[i], Array().concat.call([i], self.blueprint[i]['validate']))
                            .then(() => {
                                if(self.blueprint[i]['verify'] !== undefined) {
                                    self.check.verify.call(self, obj[i], Array().concat.call([i], self.blueprint[i]['verify']))
                                    .then(() => { resovle(null) })
                                    .catch(err => { resolve(err) })
                                } else { resolve(null) }
                            })
                            .catch(err => { resolve(err) })
                        } else { resolve(null) }
                    })
                    .catch(err => { resolve(err) })
                })
            }())
        }
    }
    if(!process.length) { return cb(null) }
    Promise.all(process).then(function(res) {
        if(Array().join.call(res, '') == '') { return cb.call(obj, null) }
        var err = { _form: obj._form }
        res.map(function(v) {
            if(v !== null) {
                err[v[0]] = v[1].replace(/\{VALUE\}/gi, self.sample[v[0]])
            }
        })
        cb.call(obj, err)
    })
}

module.exports = new validator
