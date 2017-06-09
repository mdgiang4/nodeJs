module.exports = function(option) {
    switch(option) {
        case 'user-register':
            return {
                email: {
                    type: __('Your email address is invalid.'),
                    required: __('Your email address is required.'),
                    unique: __('Your email address is already in use, try a different email.'),
                    verify: {
                        error1: __('Email validation failed! The mailbox doesn\'t exist.'),
                        error2: __('Sorry! we couldn\'t verify your email address. Try later.')
                    }
                },

                password: {
                    required: __('Please enter your password.'),
                    min: __('Your password must be at least 6 characters long.'),
                    max: __('Password is too long, maximum length is 32 characters long.')
                },

                confirm_password: {
                    required: __('Please re-enter your password.'),
                    match: __('These passwords don\'t match. Try again?')
                }
            }

        case 'user-login':
            return {
                email: {
                    type: __('Your email address is invalid.'),
                    required: __('Your email address is required.'),
                },

                password: {
                    required: __('Please enter your password.'),
                }
            }
    }
}
