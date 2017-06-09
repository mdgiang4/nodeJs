var _validators = _validators || [];

_validators.push({
    form: 'login-form',
    rules: {
        email: {
            required: [true, _messages.email.required],
            type: ['email', _messages.email.type]
        },

        password: {
            required: [true, _messages.password.required]
        }
    }
});
