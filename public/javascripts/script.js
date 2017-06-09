var onloadCallback = function() {
    var captcha = document.getElementById('g-recaptcha');

    if(captcha) {
        var form = document.getElementById(captcha.getAttribute('data-form'));

        if(form) {
            form.addEventListener('submit', function(e) {
                if(!this.captcha) { return false; }
            });
            form.disable = function() {
                this.captcha = false;
                this.querySelector('[type="submit"]').setAttribute('disabled', 'disabled');
            }
            form.enable = function() {
                this.captcha = true;
                this.querySelector('[type="submit"]').removeAttribute('disabled');
            }
            form.disable();
        }

        grecaptcha.render(captcha, {
            'sitekey': '6LdvPCEUAAAAAICgCHKDmYpleRn_uLucNoxbwslA',
            'callback': function() {
                if(form) { form.enable(); }
            },
            'expired-callback': function() {
                if(form) { form.disable(); }
            }
        });
    }
}
