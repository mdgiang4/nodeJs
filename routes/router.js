var express = require('express')
var router = express.Router()

/* middleware */
var beforeFilter = rootRequire('middleware/beforeFilter')
var beforeRender = rootRequire('middleware/beforeRender')

module.exports.render = function(app) {
    /* before filter */
    app.use(beforeFilter)
    /* before render */
    app.use(beforeRender)
    /* routing */
    app.use('/', router)
}

/* controllers */
var users =  rootRequire('controllers/users')

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' })
})

/* get request */
router.get('/users/register', users.get.register)
router.get('/users/login', users.get.login)
router.get('/users/logout', users.get.logout)
router.get('/users/info', function(req, res) {
    console.log(req.user)
    res.send(JSON.stringify(req.user))
})
/* post request */
router.post('/users/register', users.post.register)
router.post('/users/login', users.post.login)
/* ajax request */
router.post('/users/is_unique_email', users.ajax.is_unique_email)
