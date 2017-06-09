var invalidCsrfToken = function(err, req, res, next) {
    if (err.code !== 'EBADCSRFTOKEN') return next(err)

    res.status(err.statusCode)
    res.render('error', {error: {status: err.status, stack: err.stack}, message: err.message})
}

module.exports = invalidCsrfToken
