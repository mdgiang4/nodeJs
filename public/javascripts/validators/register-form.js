var _validators = _validators || [];

_validators.push({
    form: 'register-form',
    rules: {
        email: {
            required: [true, _messages.email.required],
            type: ['email', _messages.email.type],
            validate: {
                isAsync: true,
                validator: function(v, cb) {
                    $.ajax({
                        url: '/users/is_unique_email',
                        type: 'POST',
                        dataType: 'json',
                        data: {email: v, _csrf: $('meta[name="csrf-token"]').attr('content')},
                    })
                    .done(function(res) {
                        cb(res.unique);
                    })
                    .fail(function(xhr) {
                        cb(true);
                    });
                },
                message: _messages.email.unique
            }
        },

        password: {
            relations: 'confirm_password',
            required: [true, _messages.password.required],
            min: [6, _messages.password.min],
            max: [32, _messages.password.max]
        },

        confirm_password: {
            relations: 'password',
            required: [true, _messages.confirm_password.required],
            validate: {
                validator: function(v) {
                    return v == this.password
                },
                message: _messages.confirm_password.match
            }
        }
    }
});
