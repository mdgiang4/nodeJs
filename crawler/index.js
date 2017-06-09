var http = require('http')
var path = require('path')
var fs = require('fs')
var encode = require('encode-html')
var uuid = require('uuid/v4')
var cheerio = require('cheerio')
var Promise = require('promise')

var Category = function(slug, title, path, isNew) {
    this.slug = slug || null
    this.title = title || null
    this.path = path || null
    this.isNew = isNew !== undefined ? isNew : true
}
Category.prototype.equal = function(category) {
    return (category instanceof Object && this.slug == category.slug)
}
Category.prototype.toString = function() {
    return JSON.stringify(this)
}

var Set = function(slug, title, finish, author, image, path, categories, first_chap, isNew) {
    this.slug = slug
    this.title = title
    this.finish = finish
    this.author = author
    this.image = image
    this.path = path
    this.categories = categories
    this.first_chap = first_chap
    this.isNew = isNew !== undefined ? isNew : true
}
Set.prototype.addCategory = function(category) {
    this.categories.push(category.id)
}
Set.prototype.equal = function(set) {
    return (set instanceof Object && this.slug == set.slug)
}
Set.prototype.toString = function() {
    return JSON.stringify(this)
}

var Chapter = function(id, slug, title, content, path, set, isNew) {
    this.id = id || null
    this.slug = slug || null
    this.title = title || null
    this.content = content || null
    this.path = path || null
    this.set = set || null
    this.isNew = isNew !== undefined ? isNew : true
}
Chapter.prototype.equal = function(chapter) {
    return (chapter instanceof Object && this.id == chapter.id)
}
Chapter.prototype.toString = function() {
    return JSON.stringify(this)
}

var Crawler = function() {
    this.config = { output: path.join(__dirname, 'log') }
    this.log = []
    this.history = {
        category: false, // true or false ~ all category
        categories: [], // categories slug
        sets: [], // [{category: slug, page: page number}]
        chapters: [], // [{set: slug, last_chap: id}]
        chaps: [] // [integer]
    }

    this.categories = []
    this.sets = []
    this.chapters = []
}
Crawler.prototype.loadHistory = function(oldPath, lastTime) {
    var self = this

    return new Promise(function(resolve, reject) {
        var process = []

        process.push(function() {
            return new Promise(function(resolve, reject) {
                self.categories = self.getCategories()
                resolve(true)
            })
        }())

        process.push(function() {
            return new Promise(function(resolve, reject) {
                self.sets = self.getSets()
                resolve(true)
            })
        }())

        process.push(function() {
            return new Promise(function(resolve, reject) {
                self.chapters = self.getChapters()
                resolve(true)
            })
        }())

        process.push(function() {
            return new Promise(function(resolve, reject) {
                self.history = self.lastPath(oldPath, lastTime)
                resolve(true)
            })
        }())

        Promise.all(process).then(function(res) {
            resolve(true)
        })
    })
}
Crawler.prototype.saveHistory = function() {
    var self = this

    return new Promise(function(resolve, reject) {
        self.removeDuplicate().then(function() {
            var process = []

            process.push(function() {
                return new Promise(function(resolve, reject) {
                    self.saveCategories()
                    resolve(true)
                })
            }())

            process.push(function() {
                return new Promise(function(resolve, reject) {
                    self.saveSets()
                    resolve(true)
                })
            }())

            process.push(function() {
                return new Promise(function(resolve, reject) {
                    self.saveChapters()
                    resolve(true)
                })
            }())

            process.push(function() {
                return new Promise(function(resolve, reject) {
                    self.saveLog()
                    resolve(true)
                })
            }())

            process.push(function() {
                return new Promise(function(resolve, reject) {
                    self.savePath()
                    resolve(true)
                })
            }())

            Promise.all(process).then(function(res) {
                resolve(true)
            })
        })
    })
}
Crawler.prototype.removeDuplicate = function() {
    var self = this
    return new Promise(function(resolve, reject) {
        var process = []

        process.push(function() {
            return new Promise(function(resolve, reject) {
                var arr = []
                var length = self.categories.length
                var index = 0
                while(index < length - 1) {
                    for(var i = index; i < length; i++) {
                        if(arr.indexOf(self.categories[i].slug) < 0) {
                            arr.push(self.categories[i].slug)
                        } else {
                            self.categories.splice(i, 1)
                            length--
                            i--
                            break
                        }
                        index = i
                    }
                }

                resolve(true)
            })
        }())

        process.push(function() {
            return new Promise(function(resolve, reject) {
                var arr = []
                var length = self.sets.length
                var index = 0
                while(index < length - 1) {
                    for(var i = index; i < length; i++) {
                        if(arr.indexOf(self.sets[i].slug) < 0) {
                            arr.push(self.sets[i].slug)
                        } else {
                            self.sets.splice(i, 1)
                            length--
                            i--
                            break
                        }
                        index = i
                    }
                }

                resolve(true)
            })
        }())

        process.push(function() {
            return new Promise(function(resolve, reject) {
                var arr = []
                var length = self.chapters.length
                var index = 0
                while(index < length - 1) {
                    for(var i = index; i < length; i++) {
                        if(arr.indexOf(self.chapters[i].id) < 0) {
                            arr.push(self.chapters[i].id)
                        } else {
                            self.chapters.splice(i, 1)
                            length--
                            i--
                            break
                        }
                        index = i
                    }
                }

                resolve(true)
            })
        }())

        Promise.all(process).then(function() {
            resolve(true)
        })
    })
}
Crawler.prototype.getLastChap = function(slug) {
    var length = this.history.chapters.length
    for(var i = 0; i < length; i++) {
        if(this.history.chapters[i].set == slug) { return this.history.chapters[i].last_chap }
    }
    return null
}
Crawler.prototype.setLastChap = function(slug, id) {
    var length = this.history.chapters.length
    for(var i = 0; i < length; i++) {
        if(this.history.chapters[i].set == slug) {
            return (this.history.chapters[i].last_chap = id)
        }
    }
    return this.history.chapters.push({ set: slug, last_chap: id })
}
Crawler.prototype.setHistory = function(slug) {
    var length = this.history.sets.length
    for(var i = 0; i < length; i++) {
        if(this.history.sets[i].category == slug) { return this.history.sets[i] }
    }
    return null
}
Crawler.prototype.searchCategory = function(category) {
    var length = this.categories.length
    for(var i = 0; i < length; i++) {
        if(this.categories[i].equal(category)) { return this.categories[i] }
    }
    return null
}
Crawler.prototype.searchSet = function(set) {
    var length = this.sets.length
    for(var i = 0; i < length; i++) {
        if(this.sets[i].equal(set)) { return this.sets[i] }
    }
    return null
}
Crawler.prototype.searchChapter = function(chapter) {
    var length = this.chapters.length
    for(var i = 0; i < length; i++) {
        if(this.chapters[i].equal(chapter)) { return this.chapters[i] }
    }
    return null
}
Crawler.prototype.peculiarSkip = function(path) {
    if([
        'du-hi',
        'huyen-ao'
    ].indexOf(path) < 0) { return false }
    return true
}
Crawler.prototype.peculiarPath = function(path) {
    if(path == '/the-loai/convert.html')
        return '/truyen-convert.html'
    // if(path == '/the-loai/du-hi.html')
    //     return '/the-loai/vong-du.html'
    // if(path == '/the-loai/huyen-ao.html')
    //     return '/the-loai/huyen-huyen.html'
    return path
}
Crawler.prototype.peculiarTitle = function(title) {
    // if(title == 'Du Hí')
    //     return 'Võng Du'
    // if(title == 'Huyển Ảo')
    //     return 'Huyền Huyễn'
    return title
}
Crawler.prototype.checkSlug = function(path) {
    path = this.peculiarPath(path)
    return path.substr(path.lastIndexOf('/') + 1).replace('.html', '')
}
Crawler.prototype.checkPath = function(path) {
    return this.peculiarPath(path)
}
Crawler.prototype.checkTitle = function(title) {
    return this.peculiarTitle(title)
}
Crawler.prototype.getContent = function(dir) {
    if(!fs.existsSync(dir)) { fs.closeSync(fs.openSync(dir, 'w')) }
    var data = fs.readFileSync(dir, 'utf8')
    return data.toString().replace(/^\uFEFF/g, '').split('\r\n')
}
Crawler.prototype.getCategories = function() {
    var dir = path.join(this.config.output, 'categories.txt')
    var data = this.getContent(dir)
    var categories = []
    var self = this
    data.map(function(e) {
        if(self.isCategory(e)) {
            var obj = JSON.parse(e)
            categories.push(new Category(obj.slug, obj.title, obj.path, false))
        }
    })
    return categories
}
Crawler.prototype.getSets = function() {
    var dir = path.join(this.config.output, '/sets.txt')
    var data = this.getContent(dir)
    var sets = []
    var self = this
    data.map(function(e) {
        if(self.isSet(e)) {
            var obj = JSON.parse(e)
            sets.push(new Set(obj.slug, obj.title, obj.finish, obj.author, obj.image, obj.path, obj.categories, obj.first_chap, false))
        }
    })
    return sets
}
Crawler.prototype.getChapters = function() {
    var dir = path.join(this.config.output, '/chapters.txt')
    var data = this.getContent(dir)
    var chapters = []
    var self = this
    data.map(function(e) {
        if(self.isChapter(e)) {
            var obj = JSON.parse(e)
            chapters.push(new Chapter(obj.id, obj.slug, obj.title, obj.content, obj.path, obj.set, false))
        }
    })
    return chapters
}
Crawler.prototype.isCategory = function(text) {
    if (
        /^[\],:{}\s]+$/.test(text.replace(/\\["\\\/bfnrtu]/g, '@')
        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
        .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))
    ) {
        var obj = JSON.parse(text)
        return (
            Object.keys(obj).length == 4
            && obj.slug !== undefined
            && obj.title !== undefined
            && obj.path !== undefined
            && obj.time !== undefined
        )
    } else {
        return false
    }
}
Crawler.prototype.isSet = function(text) {
    if (
        /^[\],:{}\s]+$/.test(text.replace(/\\["\\\/bfnrtu]/g, '@')
        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
        .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))
    ) {
        var obj = JSON.parse(text)
        return (
            Object.keys(obj).length == 9
            && obj.slug !== undefined
            && obj.title !== undefined
            && obj.finish !== undefined
            && obj.author !== undefined
            && obj.image !== undefined
            && obj.path !== undefined
            && obj.categories !== undefined
            && obj.first_chap !== undefined
            && obj.time !== undefined
        )
    } else {
        return false
    }
}
Crawler.prototype.isChapter = function(text) {
    if (
        /^[\],:{}\s]+$/.test(text.replace(/\\["\\\/bfnrtu]/g, '@')
        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
        .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))
    ) {
        var obj = JSON.parse(text)
        return (
            Object.keys(obj).length == 7
            && obj.id !== undefined
            && obj.slug !== undefined
            && obj.title !== undefined
            && obj.content !== undefined
            && obj.path !== undefined
            && obj.set !== undefined
            && obj.time !== undefined
        )
    } else {
        return false
    }
}
Crawler.prototype.isPath = function(text) {
    if (
        /^[\],:{}\s]+$/.test(text.replace(/\\["\\\/bfnrtu]/g, '@')
        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
        .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))
    ) {
        var obj = JSON.parse(text)
        return (
            Object.keys(obj).length == 6
            && obj.category !== undefined
            && obj.categories !== undefined
            && obj.sets !== undefined
            && obj.chapters !== undefined
            && obj.chaps !== undefined
            && obj.time !== undefined
        )
    } else {
        return false
    }
}
Crawler.prototype.saveCategories = function() {
    var dir = path.join(this.config.output, 'categories.txt')
    var logger = fs.createWriteStream(dir, {
        encoding: 'utf8',
        flags: 'a' // 'a' means appending (old data will be preserved)
    })

    this.categories.map(function(category) {
        if(category.isNew) {
            delete category.isNew
            category.time = new Date()
            logger.write(category.toString() +'\r\n')
        }
    })

    logger.end()
}
Crawler.prototype.saveSets = function() {
    var dir = path.join(this.config.output, '/sets.txt')
    var logger = fs.createWriteStream(dir, {
        encoding: 'utf8',
        flags: 'a' // 'a' means appending (old data will be preserved)
    })

    this.sets.map(function(set) {
        if(set.isNew) {
            delete set.isNew
            set.time = new Date()
            logger.write(set.toString() +'\r\n')
        }
    })

    logger.end()
}
Crawler.prototype.saveChapters = function() {
    var dir = path.join(this.config.output, '/chapters.txt')
    var logger = fs.createWriteStream(dir, {
        encoding: 'utf8',
        flags: 'a' // 'a' means appending (old data will be preserved)
    })

    this.chapters.map(function(chapter) {
        if(chapter.isNew) {
            delete chapter.isNew
            chapter.time = new Date()
            logger.write(chapter.toString() +'\r\n')
        }
    })

    logger.end()
}
Crawler.prototype.saveLog = function() {
    var dir = path.join(this.config.output, '/log.txt')
    if(!fs.existsSync(dir)) { fs.closeSync(fs.openSync(dir, 'w')) }

    var logger = fs.createWriteStream(dir, {
        flags: 'a' // 'a' means appending (old data will be preserved)
    })

    this.log.map(function(log) {
        logger.write(JSON.stringify(log) +'\r\n')
    })

    logger.end()
    this.log = []
}
Crawler.prototype.savePath = function() {
    var dir = path.join(this.config.output, '/histories.txt')
    if(!fs.existsSync(dir)) { fs.closeSync(fs.openSync(dir, 'w')) }

    var logger = fs.createWriteStream(dir, {
        flags: 'a' // 'a' means appending (old data will be preserved)
    })

    this.history.time = new Date()
    logger.write(JSON.stringify(this.history) +'\r\n')

    logger.end()
    this.log = []
}
Crawler.prototype.lastPath = function(oldPath, lastTime) {
    var dir = path.join(this.config.output, '/histories.txt')
    var data = this.getContent(dir)
    var lastPath = this.history
    var self = this
    data.map(function(e) {
        if(self.isPath(e)) {
            var obj = JSON.parse(e)
            if(
                (!lastTime
                && (lastPath.time === undefined
                || (lastPath.time && new Date(lastPath.time).getTime() < new Date(obj.time).getTime())))
                || (lastTime && new Date(lastTime).getTime() == new Date(obj.time).getTime())
            ) {
                lastPath = obj
                if(!oldPath) {
                    lastPath.category = false
                    lastPath.categoríes = []
                    lastPath.sets = []
                }
            }
        }
    })
    return lastPath
}
Crawler.prototype.crawl = function(options, obj, cb) {
    // **************************************************
    // ***************** CHECK POINT ********************
    // **************************************************
    if(this.stop) { return cb.call(obj, 'check-point', null, options) }

    var self = this
    var req = http.request(options, function(res) {
        var content = ''
        res.on('data', function(chunk) {
            content += chunk.toString('utf8')
        })
        res.on('end', function () {
            if(content == '') {
                console.log('*******************************')
                console.log('************ ERROR ************')
                console.log('*******************************')
                self.log.push({
                    no: 0,
                    path: options.path,
                    message: 'empty content',
                    time: new Date()
                })

                cb.call(obj, true, null, options)
            } else {
                $ = cheerio.load(content, { decodeEntities: false })
                cb.call(obj, null, $, options)
            }
        })
    })
    req.on('error', function(err) {
        console.log('*******************************')
        console.log('************ ERROR ************')
        console.log('*******************************')
        self.log.push({
            no: 1,
            path: options.path,
            message: 'crawl request failed',
            time: new Date()
        })
        cb.call(obj, err, null, options)
    })
    req.on('socket', function (socket) {/* ... */})
    req.end()
}
Crawler.prototype.crawlCategories = function() {
    var self = this

    return new Promise(function(resolve, reject) {
        var options = {
            hostname: 'm.truyencuatui.vn',
            path: '/the-loai.html'
        }

        if(self.history.category) { resolve(self.categories) }

        self.crawl(options, self, function(err, $, options) {
            if(!err) {
                $('a.tab').each(function(i, e) {
                    if(/^\/the-loai\/\w+/.test($(e).attr('href'))) {
                        var slug = self.checkSlug($(e).attr('href'))
                        var title = self.checkTitle($(e).find('h3').html().trim())
                        if(!self.searchCategory({slug: slug, title: title})) {
                            self.categories.push(new Category(slug, title, self.checkPath($(e).attr('href'))))
                        }
                    }
                })
                self.history.category = true
                resolve(true)
            } else {
                resolve(true)
            }
        })
    })
}
Crawler.prototype.crawlSets = function() {
    var self = this

    return new Promise(function(resolve, reject) {
        var process =  []
        var length = self.categories.length
        for(var i = 0; i < length; i++) {
            if(self.history.categories.indexOf(self.categories[i].slug) < 0 && !self.peculiarSkip(self.categories[i].slug)) {
                var last = self.setHistory(self.categories[i].slug)
                if(!last) {
                    last = { category: self.categories[i].slug, page: 1 }
                    self.history.sets.push(last)
                }
                process.push(self.crawlSet(self.categories[i], last))
                if(process.length >= 5) { break }
            }
        }

        if(process.length) {
            Promise.all(process)
                .then(function(res) {
                    console.log(res)
                    res.map(function(e) {
                        if(e !== false && e !== true && self.history.categories.indexOf(e) < 0) {
                            self.history.categories.push(e)
                        }
                    })

                    if(res.indexOf(false) < 0) {
                        resolve(true)
                    } else {
                        resolve(false)
                    }
                })
        } else {
            resolve(true)
        }
    })
}
Crawler.prototype.crawlSet = function(category, last) {
    // **************************************************
    // ***************** CHECK POINT ********************
    // **************************************************
    if(this.stop) {
        return new Promise(function(resolve, reject) {
            resolve(false)
        })
    }

    var self = this
    return new Promise(function(resolve, reject) {
        var options = {
            hostname: 'truyencuatui.vn',
            path: category.path +'?page='+ last.page
        }

        self.crawl(options, category, function(err, $, options) {
            console.log(options.path)
            if(!err) {
                if($('.pagination .active').length && $('.pagination .active').text().trim() < last.page) {
                    // run out of page
                    last.page = parseInt($('.pagination .active').text().trim())
                    return resolve(category.slug)
                }

                var process = []
                $('.truyen-inner>.title').each(function(i, e) {
                    if(
                        !self.searchSet({
                            slug: self.checkSlug($(e).attr('href'))
                        })
                    ) {
                        var options = {
                            hostname: 'truyencuatui.vn',
                            path: $(e).attr('href')
                        }

                        process.push(function(){
                            return new Promise(function(resolve, reject) {
                                self.crawl(options, category, function(err, $, options) {
                                    if(!err) {
                                        var slug = self.checkSlug(options.path)
                                        var title = self.checkTitle($('.title').text().trim())
                                        var finish = $('.stt>a:first-child').text().trim() == 'Hoàn thành' ? true : false
                                        var author = (
                                            $('[itemprop="author"]').length
                                                ? {
                                                    slug: self.checkSlug($('[itemprop="author"]').attr('href')),
                                                    title: self.checkTitle($('[itemprop="author"]>span:nth-child(2)').text().trim())
                                                } : null
                                        )
                                        var image = $('[itemprop="thumbnailUrl"]').attr('src')
                                        var path = self.checkPath('/truyen/'+ slug +'.html')
                                        var categories = []
                                        if($('[itemprop="author"]').length) {
                                            $('[itemprop="author"]').next('span').find('a').each(function(i, e) {
                                                categories.push(self.checkSlug($(e).attr('href')))
                                            })
                                        } else {
                                            $('.visible-md.visible-lg.list-group.text-center>span:first-child').find('a').each(function(i, e) {
                                                categories.push(self.checkSlug($(e).attr('href')))
                                            })
                                        }
                                        var first_chap = $('#danh-sach-chuong').find('a').first()
                                        if(first_chap.length) {
                                            first_chap = self.checkSlug(first_chap.attr('href'))
                                        } else {
                                            first_chap = null
                                        }

                                        if(!self.searchSet({ slug: slug })) {
                                            var set = new Set(slug, title, finish, author, image, path, categories, first_chap)
                                            self.sets.push(set)
                                        }

                                        resolve(true)
                                    } else if(err == 'check-point') {
                                        resolve(false)
                                    } else {
                                        resolve(true)
                                    }
                                })
                            })
                        }())
                    }
                })

                if(process.length) {
                    Promise.all(process)
                        .then(function(res) {
                            if(res.indexOf(false) < 0) {
                                if($('.pagination li.active').length) {
                                    last.page++
                                    self.crawlSet(category, last)
                                        .then(function(res) {
                                            resolve(res)
                                        })
                                } else {
                                    resolve(category.slug)
                                }
                            } else {
                                resolve(false)
                            }
                        })
                } else {
                    if($('.pagination li.active').length) {
                        last.page++
                        self.crawlSet(category, last)
                            .then(function(res) {
                                resolve(res)
                            })
                    } else {
                        resolve(category.slug)
                    }
                }
            } else {
                resolve(true)
            }
        })
    })
}
Crawler.prototype.crawlChapters = function() {
    var self = this

    return new Promise(function(resolve, reject) {
        var process = []
        var length = self.sets.length
        for(var i = 0; i < length; i++) {
            if(self.history.chaps.indexOf(i) < 0) {
                var chapter = self.getLastChap(self.sets[i].slug)
                if(!chapter) { chapter = self.sets[i].first_chap }
                process.push(self.crawlChapter(self.sets[i], chapter, i))
                if(process.length >= 5) { break }
            }
        }

        if(process.length) {
            Promise.all(process)
                .then(function(res) {
                    res.map(function(e) {
                        if(e !== false && e !== true && self.history.chaps.indexOf(e) < 0) {
                            self.history.chaps.push(e)
                        }
                    })

                    if(res.indexOf(false) < 0) {
                        resolve(true)
                    } else {
                        resolve(false)
                    }
                })
        } else {
            resolve(true)
        }
    })
}
Crawler.prototype.crawlChapter = function(set, chapter, i) {
    // **************************************************
    // ***************** CHECK POINT ********************
    // **************************************************
    if(this.stop) {
        return new Promise(function(resolve, reject) {
            resolve(false)
        })
    }

    var self = this
    return new Promise(function(resolve, reject) {
        var options = {
            hostname: 'truyencuatui.vn',
            path: '/truyen/'+ set.slug +'/s-l-u-g/'+ chapter +'.html'
        }

        self.crawl(options, {set: set, i: i}, function(err, $, options) {
            if(!err) {
                var id = self.checkSlug(options.path)
                var slug = self.checkSlug($('link[itemprop="url"]').attr('href').replace('/'+ id +'.html', ''))
                var title = self.checkTitle($('#title').find('span').text().trim())
                var content = encode($('.chapter-content').find('.qccon').remove().end().html()).trim()
                var path = self.checkPath(options.path.replace('s-l-u-g', slug))
                var set = this.set.slug

                console.log(path)

                if(!self.searchChapter({id: id})) {
                    var chapter = new Chapter(id, slug, title, content, path, set)
                    self.chapters.push(chapter)
                    self.setLastChap(set, id)
                }

                var next_chap = $('.next a').first().attr('href')
                if(next_chap) {
                    self.crawlChapter(this.set, self.checkSlug(next_chap), this.i)
                        .then(function(res) {
                            resolve(res)
                        })
                } else {
                    resolve(this.i)
                }
            } else if(err == 'check-point') {
                resolve(false)
            } else {
                resolve(true)
            }
        })
    })
}
Crawler.prototype.checkDuplicate = function() {
    var self = this

    return new Promise(function(resolve, reject) {
        var process = []

        process.push(function() {
            return new Promise(function(resolve, reject) {
                var arr = []
                self.sets.map(function(e) {
                    if(arr.indexOf(e.slug) < 0) {
                        arr.push(e.slug)
                    } else {
                        self.log.push({
                            no: 3,
                            set: {
                                slug: e.slug,
                                title: e.title,
                                path: e.path
                            },
                            message: 'duplicated set',
                            time: new Date()
                        })
                    }
                })
                resolve(true)
            })
        }())

        process.push(function() {
            return new Promise(function(resolve, reject) {
                var arr = []
                self.chapters.map(function(e) {
                    if(arr.indexOf(e.id) < 0) {
                        arr.push(e.id)
                    } else {
                        self.log.push({
                            no: 3,
                            chapter: {
                                id: e.id,
                                slug: e.slug,
                                title: e.title,
                                path: e.path
                            },
                            message: 'duplicated chapter',
                            time: new Date()
                        })
                    }
                })
                resolve(true)
            })
        }())

        Promise.all(process).then(function() {
            resolve(true)
        })
    })
}
Crawler.prototype.execute = function(cb) {
    var self = this

    self.stop = false
    setTimeout(function() {
        self.stop = true
    }, 10000) // 10 seconds

    console.log('BEGIN EXECUTE')
    self.checkDuplicate().then(function() {
        self.crawlCategories().then(function() {
            console.log('FINISH CRAWL CATEGORIES')
            self.crawlSets().then(function(res) {
                if(!res) {
                    console.log('SAVE HISTORY')
                    self.saveHistory().then(function() {
                        console.log('NEXT ROUND')
                        self.execute(cb)
                    })
                } else {
                    self.saveHistory().then(function() {
                        console.log('FINISH CRAWL SETS')
                        self.crawlChapters().then(function(res) {
                            if(!res) {
                                console.log('SAVE HISTORY')
                                self.saveHistory().then(function() {
                                    console.log('NEXT ROUND')
                                    self.execute(cb)
                                })
                            } else {
                                self.saveHistory().then(function() {
                                    cb('FINISH')
                                })
                            }
                        })
                    })
                }
            })
        })
    })
}

module.exports = function(request, response) {
    var crawler = new Crawler()

    response.send('processing')
    // true to continue last path
    crawler.loadHistory(true)
        .then(function() {
            console.log('FINISH LOAD HISTORY')
            crawler.execute(function(res) {
                console.log('categories: '+ crawler.categories.length)
                console.log('sets: '+ crawler.sets.length)
                console.log('chapters: '+ crawler.chapters.length)

                console.log(res)
            })
        })
}
