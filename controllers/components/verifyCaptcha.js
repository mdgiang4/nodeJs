var https = require('https')
var querystring = require('querystring')

module.exports = function(response, cb) {
    var postData = querystring.stringify({
        secret: '6LdvPCEUAAAAABDG5pWQRuXSSi7vO4WU2naotLXX',
        response: response
    })
    var options = {
        hostname: 'www.google.com',
        path: '/recaptcha/api/siteverify',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length' : Buffer.byteLength(postData, 'utf8')
        }
    }
    var req = https.request(options, function(res) {
        var success = false
        res.on('data', function (chunk) {
            success = JSON.parse(chunk.toString('utf8')).success
        })
        res.on('end', function() { cb(null, success == true) })
    })
    req.on('error', function(err) { cb(err, false) })
    req.on('socket', function (socket) {
        socket.setTimeout(1000)
        socket.on('timeout', function() {
            req.abort()
        });
    })
    req.write(postData)
    req.end()
}
