/* promise library */
(function() {
    var head = document.getElementsByTagName('head')[0];
    var sc = document.createElement('script');
    sc.type = 'text/javascript';
    sc.src = '/components/promise/promise.min.js';
    head.appendChild(sc);
})()

var _err = _err || {};
var _validators = _validators || [];
var _options = {
    wrapper_class: 'form-group',
    errorMessageWrapperClass: 'has-error has-feedback',
    errorMessageClass: 'clearfix msg msg-error',
    errorMessageIcon: 'fa fa-exclamation'
};

(function(err, validators, options) {
    /* validation handle */
    var Validator = function() {
        this.blueprint = {};
        this.sample = {};

        this.test = {
            empty: function(v) {
                if(v === undefined || v === null) { return true; }
                if(v.constructor === String) { return String().trim.call(v) === ''; }
                if(v.constructor === Array) { return v.length == 0; }
                if(v instanceof Object) { return Object.keys(v).length == 0; }
                return String().trim.call(v.toString()) === '';
            },
            email: function(email) {
                var tester = /^[-!#$%&'*+\/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-?\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;

                if (!email)
            		return false;

            	if(email.length>254)
            		return false;

            	var valid = tester.test(email);
            	if(!valid)
            		return false;

            	// Further checking of some things regex can't handle
            	var parts = email.split("@");
            	if(parts[0].length>64)
            		return false;

            	var domainParts = parts[1].split(".");
            	if(domainParts.some(function(part) { return part.length>63; }))
            		return false;

            	return true;
            },
            number: function(v) { return !isNaN(Number(v)); }
        }

        this.check = {
            required: function(v, arr) {
                var self = this;
                var msg = arr[2] !== undefined ? arr[2] : __('%s validation failed.', arr[0]);
                return new Promise(function(resolve, reject) {
                    if(arr[1] && self.test.empty(v)) { return reject([arr[0], msg]); }
                    resolve(arr[0]);
                });
            },
            type: function(v, arr) {
                var self = this;
                var msg = arr[2] !== undefined ? arr[2] : __('%s validation failed.', arr[0]);
                return new Promise(function(resolve, reject) {
                    switch(arr[1]) {
                        case 'email': {
                            if(!self.test.email(v)) { return reject([arr[0], msg]); }
                        } break

                        case 'number': {
                            if(!self.test.number(v)) { return reject([arr[0], msg]); }
                        } break
                    }
                    resolve(arr[0]);
                });
            },
            match: function(v, arr) {
                var self = this;
                var msg = arr[2] !== undefined ? arr[2] : __('%s validation failed.', arr[0]);
                return new Promise(function(resolve, reject) {
                    if(!(arr[1] instanceof RegExp && arr[1].test(v))) { return reject([arr[0], msg]); }
                    resolve(arr[0]);
                });
            },
            min: function(v, arr) {
                var msg = arr[2] !== undefined ? arr[2] : __('%s validation failed.', arr[0]);
                return new Promise(function(resolve, reject) {
                    if(v.length < arr[1]) { return reject([arr[0], msg]); }
                    resolve(arr[0]);
                });
            },
            max: function(v, arr) {
                var msg = arr[2] !== undefined ? arr[2] : __('%s validation failed.', arr[0]);
                return new Promise(function(resolve, reject) {
                    if(v.length > arr[1]) { return reject([arr[0], msg]); }
                    resolve(arr[0]);
                });
            },
            validate: function(v, arr) {
                var objs = Array().concat.apply([], Array().slice.call(arr, 1));
                var self = this;
                return new Promise(function(resolve, reject) {
                    var process = [];
                    objs.map(function(o) {
                        process.push(function() {
                            return new Promise(function(resolve, reject) {
                                if(o.isAsync) {
                                    o.validator.call(self.sample, v, resolve);
                                } else {
                                    resolve(o.validator.call(self.sample, v));
                                }
                            })
                        }());
                    });
                    if(!process.length) { return resolve(arr[0]); }
                    Promise.all(process).then(function(res) {
                        if(res.indexOf(false) < 0) { return resolve(arr[0]); }
                        var msg = (objs[res.indexOf(false)].message !== undefined ?
                                    objs[res.indexOf(false)].message : __('%s validation failed.', arr[0]));
                        reject([arr[0], msg]);
                    });
                });
            }
        }
    }
    Validator.prototype.schema = function(obj) { this.blueprint = obj; }
    Validator.prototype.validate = function(obj, cb) {
        if(!(obj instanceof Object)) { cb(null); }

        this.sample = obj;

        var self = this;
        var process = [];
        for(i in obj) {
            if(this.blueprint[i] !== undefined) {
                process.push(function() {
                    return new Promise(function(resolve, reject) {
                        var process = [];
                        for(ix in self.blueprint[i]) {
                            if(self.check[ix] !== undefined && ix != 'validate') {
                                process.push(self.check[ix].call(self, obj[i], Array().concat.call([i], self.blueprint[i][ix])));
                            }
                        }
                        if(!process.length) {
                            if(self.blueprint[i]['validate'] !== undefined) {
                                process.push(function() {
                                    return new Promise(function(resolve, reject) { resovle(i) });
                                }());
                            } else {
                                return resolve(null);
                            }
                        }
                        Promise.all(process).then(function(i) {
                            i = i[0];
                            if(self.blueprint[i]['validate'] !== undefined) {
                                self.check.validate.call(self, obj[i], Array().concat.call([i], self.blueprint[i]['validate']))
                                    .then(function() { resolve(null); })
                                    .catch(function(res) { resolve(res); })
                            } else {
                                resolve(null);
                            }
                        }).catch(function(res) {
                            resolve(res);
                        })
                    })
                }())
            }
        }
        if(!process.length) { return cb(null); }
        Promise.all(process).then(function(res) {
            if(Array().join.call(res, '') == '') { return cb.call(obj, null); }
            var err = { _form: obj._form };
            res.map(function(v) { if(v !== null) { err[v[0]] = v[1] }; });
            cb.call(obj, err);
        })
    }

    /* Form handle */
    var Form = function() {
        this.node = null;
        this.validator = null;
        this.fields = [];
        this.first_submit = false;
    }
    Form.prototype.init = function(node, schema) {
        this.node = node;
        for(field in schema) {
            if(node.elements[field] !== undefined) {
                this.fields.push(field);
            }
        }

        this.validator = new Validator();
        this.validator.schema(schema);

        this.setEvent();
    }

    Form.prototype.setEvent = function() {
        var self = this;
        this.node.addEventListener('submit', function(e) {
            e.preventDefault();
            self.validate({
                success: function(data) {
                    self.clean();
                    self.node.submit();
                },
                fail: function(err, data) {
                    self.errorHandle(err);
                    self.node.elements[Object.keys(err)[0]].focus();
                },
                done: function(err, data) {
                    if(!self.first_submit) {
                        self.setFieldEvent();
                        self.first_submit = true;
                    }
                }
            });
        });
    }

    Form.prototype.setFieldEvent = function() {
        var self = this;
        var elements = this.node.elements;
        this.fields.map(function(e) {
            var node = self.node.elements[e];
            node.addEventListener('change', function(event) {
                var value = {};
                value[this.name] = this.value;
                if(self.validator.blueprint[this.name].relations !== undefined) {
                    var relations = Array().concat.call([], self.validator.blueprint[this.name].relations);
                    for(let i of relations) {
                        if(self.node.elements[i] !== undefined) {
                            value[self.node.elements[i].name] = self.node.elements[i].value;
                        }
                    }
                }
                self.validator.validate(value, function(err) {
                    if(err) { self.errorHandle(err); }
                    else { err = {}; }
                    for(i in this) { if(err[i] === undefined) { self.cleanField(self.node.elements[i]); } }
                });
            });
        });
    }

    Form.prototype.getFieldsValue = function() {
        var fields = {};
        var elements = this.node.elements;

        for(var i = 0; i < this.fields.length; i++) {
            if(elements[this.fields[i]] !== undefined) {
                fields[this.fields[i]] = elements[this.fields[i]].value;
            }
        }

        return fields;
    }

    Form.prototype.validate = function(obj) {
        this.validator.validate(this.getFieldsValue(), function(err) {
            if(err) {
                delete err['_form'];
                if(obj.fail) { obj.fail.call(window, err, this); }
            } else {
                if(obj.success) { obj.success.call(window, this); }
            }
            if(obj.done) { obj.done.call(window, err, this); }
        });
    }

    Form.prototype.errorHandle = function(err) {
        this.clean();
        var node;
        var wrapper;
        var old;
        for(e in err) {
            node = this.node.elements[e];
            wrapper = findAncestor(node, options.wrapper_class);
            if(!wrapper) { continue; }
            old = wrapper.querySelector('.'+ options.errorMessageClass.replace(/\s/g, '.'));
            if(old) { old.remove(); }
            wrapper.classList.add.apply(wrapper.classList, options.errorMessageWrapperClass.split(' '));
            wrapper.appendChild(error_message(err[e]));
        }
    }

    Form.prototype.clean = function() {
        this.fields.map.call(this, function(e) {
            this.cleanField(this.node.elements[e]);
        });
    }

    Form.prototype.cleanField = function(node) {
        var wrapper = findAncestor(node, options.wrapper_class);
        var old = wrapper.querySelector('.'+ options.errorMessageClass.replace(/\s/g, '.'));

        if(old) { old.remove(); }
        if(isContains(options.errorMessageWrapperClass.split(' '), wrapper.classList)) {
            wrapper.classList.remove.apply(wrapper.classList, options.errorMessageWrapperClass.split(' '));
        }
    }

    function isContains(elms, classList) {
        for(var i = 0; i < elms.length; i++) {
            if(!classList.contains(elms[i])) {
                return false;
            }
        }
        return true;
    }

    function error_message(message) {
        var i = document.createElement('i');
        i.classList.add.apply(i.classList, options.errorMessageIcon.split(' '));

        var div = document.createElement('div');
        div.classList.add.apply(div.classList, options.errorMessageClass.split(' '));

        var span = document.createElement('span');
        span.innerHTML = message;

        div.appendChild(i);
        div.appendChild(span);

        return div;
    }

    function findAncestor (el, cls) {
        while ((el = el.parentElement) && !el.classList.contains(cls));
        return el;
    }

    function init() {
        var node = null;
        var form = null;
        for(var i = 0; i < _validators.length; i++) {
            if(_validators[i].form) {
                node = document.getElementById(_validators[i].form);
                if(node.length) {
                    form = new Form();
                    form.init(node, _validators[i].rules);
                    if(_err._form && _err._form == node.id) {
                        delete _err._form;
                        form.errorHandle(_err);
                        form.setFieldEvent();
                    }
                }
            }
        }
    }

    window.addEventListener('load', init);

})(_err, _validators, _options);
