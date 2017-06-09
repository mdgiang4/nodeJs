module.exports = function(req, res, next) {
    res.renderDirectly = res.render
    res.render = function() { beforeRender.call(this, req, res, arguments) }
    next()
}

var beforeRender = function(req, res, args) {
    var messages = { info: [], success: [], warning: [], danger: [] }

    Array().map.call(req.flash('flash'), function(v) {
        if(messages[v.status]) { messages[v.status].push(v.message) }
    })

    res.renderDirectly('elements/flash', { flash: messages }, function(err, html) {
        for(var i in res.attachments) { res.locals[i] = res.attachments[i] }
        res.locals.flash = html
        res.renderDirectly.apply(res, Object.values(args).map(function(v) { return v }))
    })
}
