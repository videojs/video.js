(function e(t, n, r) {
    function s(o, u) {
        if (!n[o]) {
            if (!t[o]) {
                var a = typeof require == "function" && require;
                if (!u && a)
                    return a(o, !0);
                if (i)
                    return i(o, !0);
                var f = new Error("Cannot find module '" + o + "'");
                throw f.code = "MODULE_NOT_FOUND", f
            }
            var l = n[o] = {
                exports: {}
            };
            t[o][0].call(l.exports, function(e) {
                var n = t[o][1][e];
                return s(n ? n : e)
            }, l, l.exports, e, t, n, r)
        }
        return n[o].exports
    }
    var i = typeof require == "function" && require;
    for (var o = 0; o < r.length; o++)
        s(r[o]);
    return s
})({
    1: [function(require, module, exports) {
        'use strict';

        function _interopRequireDefault(obj) {
            return obj && obj.__esModule ? obj : {
                'default': obj
            };
        }

        var _globalWindow = require('global/window');

        var _globalWindow2 = _interopRequireDefault(_globalWindow);

        var _highlightJs = require('highlight.js');

        var _highlightJs2 = _interopRequireDefault(_highlightJs);

        var _libVjsVersionJs = require('./lib/vjs-version.js');

        // Start highlighting

        var $ = _globalWindow2['default'].jQuery;

        _highlightJs2['default'].initHighlightingOnLoad();

        // Get the package information for doing things like swapping out version numbers
        (0, _libVjsVersionJs.getPackage)(function (e, pkg) {
            if (e)
                return console.error(e);

            $('.vjs-version').text(pkg.version);
            $('.ie8-version').text(pkg.dependencies['videojs-ie8']);
        });

        // Bootstrap component initialization
        $(function () {
            $('.affixed-sidebar').affix({
                offset: {
                    top: function top() {
                        return $('section.overview').outerHeight(true);
                    }
                }
            });

            $('body').scrollspy({
                target: '.affixed-sidebar',
                offset: 50
            });
        });

    }, {
        "./lib/vjs-version.js": 2,
        "global/window": 3,
        "highlight.js": 39
    }
    ],
    2: [function(require, module, exports) {
        'use strict';

        Object.defineProperty(exports, '__esModule', {
            value: true
        });

        function _interopRequireDefault(obj) {
            return obj && obj.__esModule ? obj : {
                'default': obj
            };
        }

        var _http = require('http');

        var _http2 = _interopRequireDefault(_http);

        var pkgUrl = {
            host: 'rawgit.com',
            path: '/videojs/video.js/master/package.json'
        };

        function getPackage(cb) {
            _http2['default'].get({
                host: pkgUrl.host,
                path: pkgUrl.path,
                withCredentials: false
            }, function (res) {
                var body = '';
                res.on('data', function (d) {
                    body += d;
                });

                res.on('end', function (e) {
                    body = JSON.parse(body);
                    cb(null, body);
                });
            }).on('error', function (e) {
                cb(e);
            });
        }

        exports.getPackage = getPackage;

    }, {
        "http": 10
    }
    ],
    3: [function(require, module, exports) {
        (function (global) {
            if (typeof window !== "undefined") {
                module.exports = window;
            } else if (typeof global !== "undefined") {
                module.exports = global;
            } else if (typeof self !== "undefined") {
                module.exports = self;
            } else {
                module.exports = {};
            }

        }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
    }, {}
    ],
    4: [function(require, module, exports) {
}, {}
    ],
    5: [function(require, module, exports) {
        (function (global) {
            /*!
             * The buffer module from node.js, for the browser.
             *
             * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
             * @license  MIT
             */
            /* eslint-disable no-proto */

            var base64 = require('base64-js')
            var ieee754 = require('ieee754')
            var isArray = require('is-array')
            exports.Buffer = Buffer
            exports.SlowBuffer = SlowBuffer
            exports.INSPECT_MAX_BYTES = 50
            Buffer.poolSize = 8192 // not used by this implementation

            var rootParent = {}

            /**
             * If `Buffer.TYPED_ARRAY_SUPPORT`:
             *   === true    Use Uint8Array implementation (fastest)
             *   === false   Use Object implementation (most compatible, even IE6)
             *
             * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
             * Opera 11.6+, iOS 4.2+.
             *
             * Due to various browser bugs, sometimes the Object implementation will be used even
             * when the browser supports typed arrays.
             *
             * Note:
             *
             *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
             *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
             *
             *   - Safari 5-7 lacks support for changing the `Object.prototype.constructor` property
             *     on objects.
             *
             *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
             *
             *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
             *     incorrect length in some situations.

             * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
             * get the Object implementation, which is slower but behaves correctly.
             */
            Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
            ? global.TYPED_ARRAY_SUPPORT
            : (function () {
                function Bar () {}
                try {
                    var arr = new Uint8Array(1)
                    arr.foo = function () {
                        return 42
                    }
                    arr.constructor = Bar
                    return arr.foo() === 42 && // typed array instances can be augmented
                    arr.constructor === Bar && // constructor can be set
                    typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
                    arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
                } catch (e) {
                    return false
                }
            })()
            function kMaxLength () {
                return Buffer.TYPED_ARRAY_SUPPORT
                ? 0x7fffffff
                : 0x3fffffff
            }

            /**
             * Class: Buffer
             * =============
             *
             * The Buffer constructor returns instances of `Uint8Array` that are augmented
             * with function properties for all the node `Buffer` API functions. We use
             * `Uint8Array` so that square bracket notation works as expected -- it returns
             * a single octet.
             *
             * By augmenting the instances, we can avoid modifying the `Uint8Array`
             * prototype.
             */
            function Buffer (arg) {
                if (!(this instanceof Buffer)) {
                    // Avoid going through an ArgumentsAdaptorTrampoline in the common case.
                    if (arguments.length > 1)
                        return new Buffer(arg, arguments[1])
                    return new Buffer(arg)
                }

                this.length = 0
                this.parent = undefined
                // Common case.
                if (typeof arg === 'number') {
                    return fromNumber(this, arg)
                }

                // Slightly less common case.
                if (typeof arg === 'string') {
                    return fromString(this, arg, arguments.length > 1 ? arguments[1] : 'utf8')
                }

                // Unusual.
                return fromObject(this, arg)
            }

            function fromNumber (that, length) {
                that = allocate(that, length < 0 ? 0 : checked(length) | 0)
                if (!Buffer.TYPED_ARRAY_SUPPORT) {
                    for (var i = 0; i < length; i++) {
                        that[i] = 0
                    }
                }
                return that
            }

            function fromString (that, string, encoding) {
                if (typeof encoding !== 'string' || encoding === '')
                    encoding = 'utf8'
                    // Assumption: byteLength() return value is always < kMaxLength.
                var length = byteLength(string, encoding) | 0
                that = allocate(that, length)
                that.write(string, encoding)
                return that
            }

            function fromObject (that, object) {
                if (Buffer.isBuffer(object))
                    return fromBuffer(that, object)
                if (isArray(object))
                    return fromArray(that, object)
                if (object == null) {
                    throw new TypeError('must start with number, buffer, array or string')
                }

                if (typeof ArrayBuffer !== 'undefined') {
                    if (object.buffer instanceof ArrayBuffer) {
                        return fromTypedArray(that, object)
                    }
                    if (object instanceof ArrayBuffer) {
                        return fromArrayBuffer(that, object)
                    }
                }

                if (object.length)
                    return fromArrayLike(that, object)
                return fromJsonObject(that, object)
            }

            function fromBuffer (that, buffer) {
                var length = checked(buffer.length) | 0
                that = allocate(that, length)
                buffer.copy(that, 0, 0, length)
                return that
            }

            function fromArray (that, array) {
                var length = checked(array.length) | 0
                that = allocate(that, length)
                for (var i = 0; i < length; i += 1) {
                    that[i] = array[i] & 255
                }
                return that
            }

            // Duplicate of fromArray() to keep fromArray() monomorphic.
            function fromTypedArray (that, array) {
                var length = checked(array.length) | 0
                that = allocate(that, length)
                // Truncating the elements is probably not what people expect from typed
                // arrays with BYTES_PER_ELEMENT > 1 but it's compatible with the behavior
                // of the old Buffer constructor.
                for (var i = 0; i < length; i += 1) {
                    that[i] = array[i] & 255
                }
                return that
            }

            function fromArrayBuffer (that, array) {
                if (Buffer.TYPED_ARRAY_SUPPORT) {
                    // Return an augmented `Uint8Array` instance, for best performance
                    array.byteLength
                    that = Buffer._augment(new Uint8Array(array))
                } else {
                    // Fallback: Return an object instance of the Buffer class
                    that = fromTypedArray(that, new Uint8Array(array))
                }
                return that
            }

            function fromArrayLike (that, array) {
                var length = checked(array.length) | 0
                that = allocate(that, length)
                for (var i = 0; i < length; i += 1) {
                    that[i] = array[i] & 255
                }
                return that
            }

            // Deserialize { type: 'Buffer', data: [1,2,3,...] } into a Buffer object.
            // Returns a zero-length buffer for inputs that don't conform to the spec.
            function fromJsonObject (that, object) {
                var array
                var length = 0
                if (object.type === 'Buffer' && isArray(object.data)) {
                    array = object.data
                    length = checked(array.length) | 0
                }
                that = allocate(that, length)
                for (var i = 0; i < length; i += 1) {
                    that[i] = array[i] & 255
                }
                return that
            }

            if (Buffer.TYPED_ARRAY_SUPPORT) {
                Buffer.prototype.__proto__ = Uint8Array.prototype
                Buffer.__proto__ = Uint8Array
            }

            function allocate (that, length) {
                if (Buffer.TYPED_ARRAY_SUPPORT) {
                    // Return an augmented `Uint8Array` instance, for best performance
                    that = Buffer._augment(new Uint8Array(length))
                    that.__proto__ = Buffer.prototype
                } else {
                    // Fallback: Return an object instance of the Buffer class
                    that.length = length
                    that._isBuffer = true
                }

                var fromPool = length !== 0 && length <= Buffer.poolSize >>> 1
                if (fromPool)
                    that.parent = rootParent
                return that
            }

            function checked (length) {
                // Note: cannot use `length < kMaxLength` here because that fails when
                // length is NaN (which is otherwise coerced to zero.)
                if (length >= kMaxLength()) {
                    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                    'size: 0x' + kMaxLength().toString(16) + ' bytes')
                }
                return length | 0
            }

            function SlowBuffer (subject, encoding) {
                if (!(this instanceof SlowBuffer))
                    return new SlowBuffer(subject, encoding)
                var buf = new Buffer(subject, encoding)
                delete buf.parent
                return buf
            }

            Buffer.isBuffer = function isBuffer (b) {
                return !!(b != null && b._isBuffer)
            }

            Buffer.compare = function compare (a, b) {
                if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
                    throw new TypeError('Arguments must be Buffers')
                }

                if (a === b)
                    return 0
                var x = a.length
                var y = b.length
                var i = 0
                var len = Math.min(x, y)
                while (i < len) {
                    if (a[i] !== b[i])
                        break
                        ++i
                }

                if (i !== len) {
                    x = a[i]
                    y = b[i]
                }

                if (x < y)
                    return - 1
                if (y < x)
                    return 1
                return 0
            }

            Buffer.isEncoding = function isEncoding (encoding) {
                switch (String(encoding).toLowerCase()) {
                case 'hex':
                case 'utf8':
                case 'utf-8':
                case 'ascii':
                case 'binary':
                case 'base64':
                case 'raw':
                case 'ucs2':
                case 'ucs-2':
                case 'utf16le':
                case 'utf-16le':
                    return true
                default:
                    return false
                }
            }

            Buffer.concat = function concat (list, length) {
                if (!isArray(list))
                    throw new TypeError('list argument must be an Array of Buffers.')
                if (list.length === 0) {
                    return new Buffer(0)
                }

                var i
                if (length === undefined) {
                    length = 0
                    for (i = 0; i < list.length; i++) {
                        length += list[i].length
                    }
                }

                var buf = new Buffer(length)
                var pos = 0
                for (i = 0; i < list.length; i++) {
                    var item = list[i]
                    item.copy(buf, pos)
                    pos += item.length
                }
                return buf
            }

            function byteLength (string, encoding) {
                if (typeof string !== 'string')
                    string = '' + string
                var len = string.length
                if (len === 0)
                    return 0
                    // Use a for loop to avoid recursion
                var loweredCase = false
                for (; ;) {
                    switch (encoding) {
                    case 'ascii':
                    case 'binary':
                        // Deprecated
                    case 'raw':
                    case 'raws':
                        return len
                    case 'utf8':
                    case 'utf-8':
                        return utf8ToBytes(string).length
                    case 'ucs2':
                    case 'ucs-2':
                    case 'utf16le':
                    case 'utf-16le':
                        return len * 2
                    case 'hex':
                        return len >>> 1
                    case 'base64':
                        return base64ToBytes(string).length
                    default:
                        if (loweredCase)
                            return utf8ToBytes(string).length // assume utf8
                        encoding = ('' + encoding).toLowerCase()
                        loweredCase = true
                    }
                }
            }
            Buffer.byteLength = byteLength
            // pre-set for values that may exist in the future
            Buffer.prototype.length = undefined
            Buffer.prototype.parent = undefined
            function slowToString (encoding, start, end) {
                var loweredCase = false
                start = start | 0
                end = end === undefined || end === Infinity ? this.length : end | 0
                if (!encoding)
                    encoding = 'utf8'
                if (start < 0)
                    start = 0
                if (end > this.length)
                    end = this.length
                if (end <= start)
                    return ''
                while (true) {
                    switch (encoding) {
                    case 'hex':
                        return hexSlice(this, start, end)
                    case 'utf8':
                    case 'utf-8':
                        return utf8Slice(this, start, end)
                    case 'ascii':
                        return asciiSlice(this, start, end)
                    case 'binary':
                        return binarySlice(this, start, end)
                    case 'base64':
                        return base64Slice(this, start, end)
                    case 'ucs2':
                    case 'ucs-2':
                    case 'utf16le':
                    case 'utf-16le':
                        return utf16leSlice(this, start, end)
                    default:
                        if (loweredCase)
                            throw new TypeError('Unknown encoding: ' + encoding)
                        encoding = (encoding + '').toLowerCase()
                        loweredCase = true
                    }
                }
            }

            Buffer.prototype.toString = function toString () {
                var length = this.length | 0
                if (length === 0)
                    return ''
                if (arguments.length === 0)
                    return utf8Slice(this, 0, length)
                return slowToString.apply(this, arguments)
            }

            Buffer.prototype.equals = function equals (b) {
                if (!Buffer.isBuffer(b))
                    throw new TypeError('Argument must be a Buffer')
                if (this === b)
                    return true
                return Buffer.compare(this, b) === 0
            }

            Buffer.prototype.inspect = function inspect () {
                var str = ''
                var max = exports.INSPECT_MAX_BYTES
                if (this.length > 0) {
                    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
                    if (this.length > max)
                        str += ' ... '
                }
                return '<Buffer ' + str + '>'
            }

            Buffer.prototype.compare = function compare (b) {
                if (!Buffer.isBuffer(b))
                    throw new TypeError('Argument must be a Buffer')
                if (this === b)
                    return 0
                return Buffer.compare(this, b)
            }

            Buffer.prototype.indexOf = function indexOf (val, byteOffset) {
                if (byteOffset > 0x7fffffff)
                    byteOffset = 0x7fffffff
                else if (byteOffset < - 0x80000000)
                    byteOffset = - 0x80000000
                byteOffset >>= 0
                if (this.length === 0)
                    return - 1
                if (byteOffset >= this.length)
                    return - 1
                    // Negative offsets start from the end of the buffer
                if (byteOffset < 0)
                    byteOffset = Math.max(this.length + byteOffset, 0)
                if (typeof val === 'string') {
                    if (val.length === 0)
                        return - 1 // special case: looking for empty string always fails
                    return String.prototype.indexOf.call(this, val, byteOffset)
                }
                if (Buffer.isBuffer(val)) {
                    return arrayIndexOf(this, val, byteOffset)
                }
                if (typeof val === 'number') {
                    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
                        return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
                    }
                    return arrayIndexOf(this, [ val ], byteOffset)
                }

                function arrayIndexOf (arr, val, byteOffset) {
                    var foundIndex = - 1
                    for (var i = 0; byteOffset + i < arr.length; i++) {
                        if (arr[byteOffset + i] === val[foundIndex === - 1 ? 0 : i - foundIndex]) {
                            if (foundIndex === - 1)
                                foundIndex = i
                            if (i - foundIndex + 1 === val.length)
                                return byteOffset + foundIndex
                        } else {
                            foundIndex = - 1
                        }
                    }
                    return - 1
                }

                throw new TypeError('val must be string, number or Buffer')
            }

            // `get` is deprecated
            Buffer.prototype.get = function get (offset) {
                console.log('.get() is deprecated. Access using array indexes instead.')
                return this.readUInt8(offset)
            }

            // `set` is deprecated
            Buffer.prototype.set = function set (v, offset) {
                console.log('.set() is deprecated. Access using array indexes instead.')
                return this.writeUInt8(v, offset)
            }

            function hexWrite (buf, string, offset, length) {
                offset = Number(offset) || 0
                var remaining = buf.length - offset
                if (!length) {
                    length = remaining
                } else {
                    length = Number(length)
                    if (length > remaining) {
                        length = remaining
                    }
                }

                // must be an even number of digits
                var strLen = string.length
                if (strLen % 2 !== 0)
                    throw new Error('Invalid hex string')
                if (length > strLen / 2) {
                    length = strLen / 2
                }
                for (var i = 0; i < length; i++) {
                    var parsed = parseInt(string.substr(i * 2, 2), 16)
                    if (isNaN(parsed))
                        throw new Error('Invalid hex string')
                    buf[offset + i] = parsed
                }
                return i
            }

            function utf8Write (buf, string, offset, length) {
                return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
            }

            function asciiWrite (buf, string, offset, length) {
                return blitBuffer(asciiToBytes(string), buf, offset, length)
            }

            function binaryWrite (buf, string, offset, length) {
                return asciiWrite(buf, string, offset, length)
            }

            function base64Write (buf, string, offset, length) {
                return blitBuffer(base64ToBytes(string), buf, offset, length)
            }

            function ucs2Write (buf, string, offset, length) {
                return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
            }

            Buffer.prototype.write = function write (string, offset, length, encoding) {
                // Buffer#write(string)
                if (offset === undefined) {
                    encoding = 'utf8'
                    length = this.length
                    offset = 0
                    // Buffer#write(string, encoding)
                } else if (length === undefined && typeof offset === 'string') {
                    encoding = offset
                    length = this.length
                    offset = 0
                    // Buffer#write(string, offset[, length][, encoding])
                } else if (isFinite(offset)) {
                    offset = offset | 0
                    if (isFinite(length)) {
                        length = length | 0
                        if (encoding === undefined)
                            encoding = 'utf8'
                    } else {
                        encoding = length
                        length = undefined
                    }
                    // legacy write(string, encoding, offset, length) - remove in v0.13
                } else {
                    var swap = encoding
                    encoding = offset
                    offset = length | 0
                    length = swap
                }

                var remaining = this.length - offset
                if (length === undefined || length > remaining)
                    length = remaining
                if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
                    throw new RangeError('attempt to write outside buffer bounds')
                }

                if (!encoding)
                    encoding = 'utf8'
                var loweredCase = false
                for (; ;) {
                    switch (encoding) {
                    case 'hex':
                        return hexWrite(this, string, offset, length)
                    case 'utf8':
                    case 'utf-8':
                        return utf8Write(this, string, offset, length)
                    case 'ascii':
                        return asciiWrite(this, string, offset, length)
                    case 'binary':
                        return binaryWrite(this, string, offset, length)
                    case 'base64':
                        // Warning: maxLength not taken into account in base64Write
                        return base64Write(this, string, offset, length)
                    case 'ucs2':
                    case 'ucs-2':
                    case 'utf16le':
                    case 'utf-16le':
                        return ucs2Write(this, string, offset, length)
                    default:
                        if (loweredCase)
                            throw new TypeError('Unknown encoding: ' + encoding)
                        encoding = ('' + encoding).toLowerCase()
                        loweredCase = true
                    }
                }
            }

            Buffer.prototype.toJSON = function toJSON () {
                return {
                    type: 'Buffer',
                    data: Array.prototype.slice.call(this._arr || this, 0)
                }
            }

            function base64Slice (buf, start, end) {
                if (start === 0 && end === buf.length) {
                    return base64.fromByteArray(buf)
                } else {
                    return base64.fromByteArray(buf.slice(start, end))
                }
            }

            function utf8Slice (buf, start, end) {
                end = Math.min(buf.length, end)
                var res = []
                var i = start
                while (i < end) {
                    var firstByte = buf[i]
                    var codePoint = null
                    var bytesPerSequence = (firstByte > 0xEF) ? 4
                    : (firstByte > 0xDF) ? 3
                    : (firstByte > 0xBF) ? 2
                    : 1
                    if (i + bytesPerSequence <= end) {
                        var secondByte, thirdByte, fourthByte, tempCodePoint
                        switch (bytesPerSequence) {
                        case 1:
                            if (firstByte < 0x80) {
                                codePoint = firstByte
                            }
                            break
                        case 2 :
                        secondByte = buf[i + 1]
                        if ((secondByte & 0xC0) === 0x80) {
                            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
                            if (tempCodePoint > 0x7F) {
                                codePoint = tempCodePoint
                            }
                        }
                        break
                    case 3 :
                    secondByte = buf[i + 1]
                    thirdByte = buf[i + 2]
                    if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
                        tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
                        if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
                            codePoint = tempCodePoint
                        }
                    }
                    break
                case 4 :
                secondByte = buf[i + 1]
                thirdByte = buf[i + 2]
                fourthByte = buf[i + 3]
                if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
                    tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
                    if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
                        codePoint = tempCodePoint
                    }
                }
            }
        }

        if (codePoint === null) {
            // we did not generate a valid codePoint so insert a
            // replacement char (U+FFFD) and advance only 1 byte
            codePoint = 0xFFFD
            bytesPerSequence = 1
        } else if (codePoint > 0xFFFF) {
            // encode to utf16 (surrogate pair dance)
            codePoint -= 0x10000
            res.push(codePoint >>> 10 & 0x3FF | 0xD800)
            codePoint = 0xDC00 | codePoint & 0x3FF
        }

        res.push(codePoint)
        i += bytesPerSequence
    }

    return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000
function decodeCodePointsArray (codePoints) {
    var len = codePoints.length
    if (len <= MAX_ARGUMENTS_LENGTH) {
        return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
    }

    // Decode in chunks to avoid "call stack size exceeded".
    var res = ''
    var i = 0
    while (i < len) {
        res += String.fromCharCode.apply(
        String,
        codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
        )
    }
    return res
}

function asciiSlice (buf, start, end) {
    var ret = ''
    end = Math.min(buf.length, end)
    for (var i = start; i < end; i++) {
        ret += String.fromCharCode(buf[i] & 0x7F)
    }
    return ret
}

function binarySlice (buf, start, end) {
    var ret = ''
    end = Math.min(buf.length, end)
    for (var i = start; i < end; i++) {
        ret += String.fromCharCode(buf[i])
    }
    return ret
}

function hexSlice (buf, start, end) {
    var len = buf.length
    if (!start || start < 0)
        start = 0
    if (!end || end < 0 || end > len)
        end = len
    var out = ''
    for (var i = start; i < end; i++) {
        out += toHex(buf[i])
    }
    return out
}

function utf16leSlice (buf, start, end) {
    var bytes = buf.slice(start, end)
    var res = ''
    for (var i = 0; i < bytes.length; i += 2) {
        res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
    }
    return res
}

Buffer.prototype.slice = function slice (start, end) {
    var len = this.length
    start = ~~start
    end = end === undefined ? len : ~~end
    if (start < 0) {
        start += len
        if (start < 0)
            start = 0
    } else if (start > len) {
        start = len
    }

    if (end < 0) {
        end += len
        if (end < 0)
            end = 0
    } else if (end > len) {
        end = len
    }

    if (end < start)
        end = start
    var newBuf
    if (Buffer.TYPED_ARRAY_SUPPORT) {
        newBuf = Buffer._augment(this.subarray(start, end))
    } else {
        var sliceLen = end - start
        newBuf = new Buffer(sliceLen, undefined)
        for (var i = 0; i < sliceLen; i++) {
            newBuf[i] = this[i + start]
        }
    }

    if (newBuf.length)
        newBuf.parent = this.parent || this
    return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
    if ((offset % 1) !== 0 || offset < 0)
        throw new RangeError('offset is not uint')
    if (offset + ext > length)
        throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
    offset = offset | 0
    byteLength = byteLength | 0
    if (!noAssert)
        checkOffset(offset, byteLength, this.length)
    var val = this[offset]
    var mul = 1
    var i = 0
    while (++i < byteLength && (mul *= 0x100)) {
        val += this[offset + i] * mul
    }

    return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
    offset = offset | 0
    byteLength = byteLength | 0
    if (!noAssert) {
        checkOffset(offset, byteLength, this.length)
    }

    var val = this[offset + --byteLength]
    var mul = 1
    while (byteLength > 0 && (mul *= 0x100)) {
        val += this[offset + --byteLength] * mul
    }

    return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
    if (!noAssert)
        checkOffset(offset, 1, this.length)
    return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
    if (!noAssert)
        checkOffset(offset, 2, this.length)
    return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
    if (!noAssert)
        checkOffset(offset, 2, this.length)
    return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
    if (!noAssert)
        checkOffset(offset, 4, this.length)
    return ((this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16)) +
    (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
    if (!noAssert)
        checkOffset(offset, 4, this.length)
    return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
    offset = offset | 0
    byteLength = byteLength | 0
    if (!noAssert)
        checkOffset(offset, byteLength, this.length)
    var val = this[offset]
    var mul = 1
    var i = 0
    while (++i < byteLength && (mul *= 0x100)) {
        val += this[offset + i] * mul
    }
    mul *= 0x80
    if (val >= mul)
        val -= Math.pow(2, 8 * byteLength)
    return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
    offset = offset | 0
    byteLength = byteLength | 0
    if (!noAssert)
        checkOffset(offset, byteLength, this.length)
    var i = byteLength
    var mul = 1
    var val = this[offset + --i]
    while (i > 0 && (mul *= 0x100)) {
        val += this[offset + --i] * mul
    }
    mul *= 0x80
    if (val >= mul)
        val -= Math.pow(2, 8 * byteLength)
    return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
    if (!noAssert)
        checkOffset(offset, 1, this.length)
    if (!(this[offset] & 0x80))
        return (this[offset])
    return ((0xff - this[offset] + 1) * - 1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
    if (!noAssert)
        checkOffset(offset, 2, this.length)
    var val = this[offset] | (this[offset + 1] << 8)
    return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
    if (!noAssert)
        checkOffset(offset, 2, this.length)
    var val = this[offset + 1] | (this[offset] << 8)
    return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
    if (!noAssert)
        checkOffset(offset, 4, this.length)
    return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
    if (!noAssert)
        checkOffset(offset, 4, this.length)
    return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
    if (!noAssert)
        checkOffset(offset, 4, this.length)
    return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
    if (!noAssert)
        checkOffset(offset, 4, this.length)
    return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
    if (!noAssert)
        checkOffset(offset, 8, this.length)
    return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
    if (!noAssert)
        checkOffset(offset, 8, this.length)
    return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
    if (!Buffer.isBuffer(buf))
        throw new TypeError('buffer must be a Buffer instance')
    if (value > max || value < min)
        throw new RangeError('value is out of bounds')
    if (offset + ext > buf.length)
        throw new RangeError('index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
    value = + value
    offset = offset | 0
    byteLength = byteLength | 0
    if (!noAssert)
        checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)
    var mul = 1
    var i = 0
    this[offset] = value & 0xFF
    while (++i < byteLength && (mul *= 0x100)) {
        this[offset + i] = (value / mul) & 0xFF
    }

    return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
    value = + value
    offset = offset | 0
    byteLength = byteLength | 0
    if (!noAssert)
        checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)
    var i = byteLength - 1
    var mul = 1
    this[offset + i] = value & 0xFF
    while (--i >= 0 && (mul *= 0x100)) {
        this[offset + i] = (value / mul) & 0xFF
    }

    return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
    value = + value
    offset = offset | 0
    if (!noAssert)
        checkInt(this, value, offset, 1, 0xff, 0)
    if (!Buffer.TYPED_ARRAY_SUPPORT)
        value = Math.floor(value)
    this[offset] = value
    return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
    if (value < 0)
        value = 0xffff + value + 1
    for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
        buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
        (littleEndian ? i : 1 - i) * 8
    }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
    value = + value
    offset = offset | 0
    if (!noAssert)
        checkInt(this, value, offset, 2, 0xffff, 0)
    if (Buffer.TYPED_ARRAY_SUPPORT) {
        this[offset] = value
        this[offset + 1] = (value >>> 8)
    } else {
        objectWriteUInt16(this, value, offset, true)
    }
    return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
    value = + value
    offset = offset | 0
    if (!noAssert)
        checkInt(this, value, offset, 2, 0xffff, 0)
    if (Buffer.TYPED_ARRAY_SUPPORT) {
        this[offset] = (value >>> 8)
        this[offset + 1] = value
    } else {
        objectWriteUInt16(this, value, offset, false)
    }
    return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
    if (value < 0)
        value = 0xffffffff + value + 1
    for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
        buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
    }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
    value = + value
    offset = offset | 0
    if (!noAssert)
        checkInt(this, value, offset, 4, 0xffffffff, 0)
    if (Buffer.TYPED_ARRAY_SUPPORT) {
        this[offset + 3] = (value >>> 24)
        this[offset + 2] = (value >>> 16)
        this[offset + 1] = (value >>> 8)
        this[offset] = value
    } else {
        objectWriteUInt32(this, value, offset, true)
    }
    return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
    value = + value
    offset = offset | 0
    if (!noAssert)
        checkInt(this, value, offset, 4, 0xffffffff, 0)
    if (Buffer.TYPED_ARRAY_SUPPORT) {
        this[offset] = (value >>> 24)
        this[offset + 1] = (value >>> 16)
        this[offset + 2] = (value >>> 8)
        this[offset + 3] = value
    } else {
        objectWriteUInt32(this, value, offset, false)
    }
    return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
    value = + value
    offset = offset | 0
    if (!noAssert) {
        var limit = Math.pow(2, 8 * byteLength - 1)
        checkInt(this, value, offset, byteLength, limit - 1, - limit)
    }

    var i = 0
    var mul = 1
    var sub = value < 0 ? 1 : 0
    this[offset] = value & 0xFF
    while (++i < byteLength && (mul *= 0x100)) {
        this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
    }

    return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
    value = + value
    offset = offset | 0
    if (!noAssert) {
        var limit = Math.pow(2, 8 * byteLength - 1)
        checkInt(this, value, offset, byteLength, limit - 1, - limit)
    }

    var i = byteLength - 1
    var mul = 1
    var sub = value < 0 ? 1 : 0
    this[offset + i] = value & 0xFF
    while (--i >= 0 && (mul *= 0x100)) {
        this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
    }

    return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
    value = + value
    offset = offset | 0
    if (!noAssert)
        checkInt(this, value, offset, 1, 0x7f, - 0x80)
    if (!Buffer.TYPED_ARRAY_SUPPORT)
        value = Math.floor(value)
    if (value < 0)
        value = 0xff + value + 1
    this[offset] = value
    return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
    value = + value
    offset = offset | 0
    if (!noAssert)
        checkInt(this, value, offset, 2, 0x7fff, - 0x8000)
    if (Buffer.TYPED_ARRAY_SUPPORT) {
        this[offset] = value
        this[offset + 1] = (value >>> 8)
    } else {
        objectWriteUInt16(this, value, offset, true)
    }
    return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
    value = + value
    offset = offset | 0
    if (!noAssert)
        checkInt(this, value, offset, 2, 0x7fff, - 0x8000)
    if (Buffer.TYPED_ARRAY_SUPPORT) {
        this[offset] = (value >>> 8)
        this[offset + 1] = value
    } else {
        objectWriteUInt16(this, value, offset, false)
    }
    return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
    value = + value
    offset = offset | 0
    if (!noAssert)
        checkInt(this, value, offset, 4, 0x7fffffff, - 0x80000000)
    if (Buffer.TYPED_ARRAY_SUPPORT) {
        this[offset] = value
        this[offset + 1] = (value >>> 8)
        this[offset + 2] = (value >>> 16)
        this[offset + 3] = (value >>> 24)
    } else {
        objectWriteUInt32(this, value, offset, true)
    }
    return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
    value = + value
    offset = offset | 0
    if (!noAssert)
        checkInt(this, value, offset, 4, 0x7fffffff, - 0x80000000)
    if (value < 0)
        value = 0xffffffff + value + 1
    if (Buffer.TYPED_ARRAY_SUPPORT) {
        this[offset] = (value >>> 24)
        this[offset + 1] = (value >>> 16)
        this[offset + 2] = (value >>> 8)
        this[offset + 3] = value
    } else {
        objectWriteUInt32(this, value, offset, false)
    }
    return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
    if (value > max || value < min)
        throw new RangeError('value is out of bounds')
    if (offset + ext > buf.length)
        throw new RangeError('index out of range')
    if (offset < 0)
        throw new RangeError('index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
    if (!noAssert) {
        checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, - 3.4028234663852886e+38)
    }
    ieee754.write(buf, value, offset, littleEndian, 23, 4)
    return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
    return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
    return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
    if (!noAssert) {
        checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, - 1.7976931348623157E+308)
    }
    ieee754.write(buf, value, offset, littleEndian, 52, 8)
    return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
    return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
    return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
    if (!start)
        start = 0
    if (!end && end !== 0)
        end = this.length
    if (targetStart >= target.length)
        targetStart = target.length
    if (!targetStart)
        targetStart = 0
    if (end > 0 && end < start)
        end = start
        // Copy 0 bytes; we're done
    if (end === start)
        return 0
    if (target.length === 0 || this.length === 0)
        return 0
        // Fatal error conditions
    if (targetStart < 0) {
        throw new RangeError('targetStart out of bounds')
    }
    if (start < 0 || start >= this.length)
        throw new RangeError('sourceStart out of bounds')
    if (end < 0)
        throw new RangeError('sourceEnd out of bounds')
        // Are we oob?
    if (end > this.length)
        end = this.length
    if (target.length - targetStart < end - start) {
        end = target.length - targetStart + start
    }

    var len = end - start
    var i
    if (this === target && start < targetStart && targetStart < end) {
        // descending copy from end
        for (i = len - 1; i >= 0; i--) {
            target[i + targetStart] = this[i + start]
        }
    } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
        // ascending copy from start
        for (i = 0; i < len; i++) {
            target[i + targetStart] = this[i + start]
        }
    } else {
        target._set(this.subarray(start, start + len), targetStart)
    }

    return len
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function fill (value, start, end) {
    if (!value)
        value = 0
    if (!start)
        start = 0
    if (!end)
        end = this.length
    if (end < start)
        throw new RangeError('end < start')
        // Fill 0 bytes; we're done
    if (end === start)
        return
        if (this.length === 0) return
    if (start < 0 || start >= this.length) throw new RangeError('start out of bounds')
    if (end < 0 || end > this.length)
        throw new RangeError('end out of bounds')
    var i
    if (typeof value === 'number') {
        for (i = start; i < end; i++) {
            this[i] = value
        }
    } else {
        var bytes = utf8ToBytes(value.toString())
        var len = bytes.length
        for (i = start; i < end; i++) {
            this[i] = bytes[i % len]
        }
    }

    return this
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function toArrayBuffer () {
    if (typeof Uint8Array !== 'undefined') {
        if (Buffer.TYPED_ARRAY_SUPPORT) {
            return (new Buffer(this)).buffer
        } else {
            var buf = new Uint8Array(this.length)
            for (var i = 0, len = buf.length; i < len; i += 1) {
                buf[i] = this[i]
            }
            return buf.buffer
        }
    } else {
        throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
    }
}

// HELPER FUNCTIONS
// ================

var BP = Buffer.prototype
/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function _augment (arr) {
    arr.constructor = Buffer
    arr._isBuffer = true
    // save reference to original Uint8Array set method before overwriting
    arr._set = arr.set
    // deprecated
    arr.get = BP.get
    arr.set = BP.set
    arr.write = BP.write
    arr.toString = BP.toString
    arr.toLocaleString = BP.toString
    arr.toJSON = BP.toJSON
    arr.equals = BP.equals
    arr.compare = BP.compare
    arr.indexOf = BP.indexOf
    arr.copy = BP.copy
    arr.slice = BP.slice
    arr.readUIntLE = BP.readUIntLE
    arr.readUIntBE = BP.readUIntBE
    arr.readUInt8 = BP.readUInt8
    arr.readUInt16LE = BP.readUInt16LE
    arr.readUInt16BE = BP.readUInt16BE
    arr.readUInt32LE = BP.readUInt32LE
    arr.readUInt32BE = BP.readUInt32BE
    arr.readIntLE = BP.readIntLE
    arr.readIntBE = BP.readIntBE
    arr.readInt8 = BP.readInt8
    arr.readInt16LE = BP.readInt16LE
    arr.readInt16BE = BP.readInt16BE
    arr.readInt32LE = BP.readInt32LE
    arr.readInt32BE = BP.readInt32BE
    arr.readFloatLE = BP.readFloatLE
    arr.readFloatBE = BP.readFloatBE
    arr.readDoubleLE = BP.readDoubleLE
    arr.readDoubleBE = BP.readDoubleBE
    arr.writeUInt8 = BP.writeUInt8
    arr.writeUIntLE = BP.writeUIntLE
    arr.writeUIntBE = BP.writeUIntBE
    arr.writeUInt16LE = BP.writeUInt16LE
    arr.writeUInt16BE = BP.writeUInt16BE
    arr.writeUInt32LE = BP.writeUInt32LE
    arr.writeUInt32BE = BP.writeUInt32BE
    arr.writeIntLE = BP.writeIntLE
    arr.writeIntBE = BP.writeIntBE
    arr.writeInt8 = BP.writeInt8
    arr.writeInt16LE = BP.writeInt16LE
    arr.writeInt16BE = BP.writeInt16BE
    arr.writeInt32LE = BP.writeInt32LE
    arr.writeInt32BE = BP.writeInt32BE
    arr.writeFloatLE = BP.writeFloatLE
    arr.writeFloatBE = BP.writeFloatBE
    arr.writeDoubleLE = BP.writeDoubleLE
    arr.writeDoubleBE = BP.writeDoubleBE
    arr.fill = BP.fill
    arr.inspect = BP.inspect
    arr.toArrayBuffer = BP.toArrayBuffer
    return arr
}

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g
function base64clean (str) {
    // Node strips out invalid characters like \n and \t from the string, base64-js does not
    str = stringtrim(str).replace(INVALID_BASE64_RE, '')
    // Node converts strings with length < 2 to ''
    if (str.length < 2)
        return ''
        // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
    while (str.length % 4 !== 0) {
        str = str + '='
    }
    return str
}

function stringtrim (str) {
    if (str.trim)
        return str.trim()
    return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
    if (n < 16)
        return '0' + n.toString(16)
    return n.toString(16)
}

function utf8ToBytes (string, units) {
    units = units || Infinity
    var codePoint
    var length = string.length
    var leadSurrogate = null
    var bytes = []
    for (var i = 0; i < length; i++) {
        codePoint = string.charCodeAt(i)
        // is surrogate component
        if (codePoint > 0xD7FF && codePoint < 0xE000) {
            // last char was a lead
            if (!leadSurrogate) {
                // no lead yet
                if (codePoint > 0xDBFF) {
                    // unexpected trail
                    if ((units -= 3) > - 1)
                        bytes.push(0xEF, 0xBF, 0xBD)
                    continue
                } else if (i + 1 === length) {
                    // unpaired lead
                    if ((units -= 3) > - 1)
                        bytes.push(0xEF, 0xBF, 0xBD)
                    continue
                }

                // valid lead
                leadSurrogate = codePoint
                continue
            }

            // 2 leads in a row
            if (codePoint < 0xDC00) {
                if ((units -= 3) > - 1)
                    bytes.push(0xEF, 0xBF, 0xBD)
                leadSurrogate = codePoint
                continue
            }

            // valid surrogate pair
            codePoint = leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00 | 0x10000
        } else if (leadSurrogate) {
            // valid bmp char, but last char was a lead
            if ((units -= 3) > - 1)
                bytes.push(0xEF, 0xBF, 0xBD)
            }

        leadSurrogate = null
        // encode utf8
        if (codePoint < 0x80) {
            if ((units -= 1) < 0)
                break
                bytes.push(codePoint)
            } else if (codePoint < 0x800) {
            if ((units -= 2) < 0)
                break
                bytes.push(
                codePoint >> 0x6 | 0xC0,
                codePoint & 0x3F | 0x80
                )
            } else if (codePoint < 0x10000) {
            if ((units -= 3) < 0)
                break
                bytes.push(
                codePoint >> 0xC | 0xE0,
                codePoint >> 0x6 & 0x3F | 0x80,
                codePoint & 0x3F | 0x80
                )
            } else if (codePoint < 0x110000) {
            if ((units -= 4) < 0)
                break
                bytes.push(
                codePoint >> 0x12 | 0xF0,
                codePoint >> 0xC & 0x3F | 0x80,
                codePoint >> 0x6 & 0x3F | 0x80,
                codePoint & 0x3F | 0x80
                )
            } else {
            throw new Error('Invalid code point')
        }
    }

    return bytes
}

function asciiToBytes (str) {
    var byteArray = []
    for (var i = 0; i < str.length; i++) {
        // Node's code seems to be doing this and not & 0x7F..
        byteArray.push(str.charCodeAt(i) & 0xFF)
    }
    return byteArray
}

function utf16leToBytes (str, units) {
    var c, hi, lo
    var byteArray = []
    for (var i = 0; i < str.length; i++) {
        if ((units -= 2) < 0)
            break
            c = str.charCodeAt(i)
        hi = c >> 8
        lo = c % 256
        byteArray.push(lo)
        byteArray.push(hi)
    }

    return byteArray
}

function base64ToBytes (str) {
    return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
    for (var i = 0; i < length; i++) {
        if ((i + offset >= dst.length) || (i >= src.length))
            break
            dst[i + offset] = src[i]
    }
    return i
}

}).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
}, {
    "base64-js": 6,
    "ieee754": 7,
    "is-array": 8
}
],
6: [function(require, module, exports) {
    var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
;
    (function (exports) {
        'use strict';

        var Arr = (typeof Uint8Array !== 'undefined')
        ? Uint8Array
        : Array
        var PLUS = '+'.charCodeAt(0)
        var SLASH = '/'.charCodeAt(0)
        var NUMBER = '0'.charCodeAt(0)
        var LOWER = 'a'.charCodeAt(0)
        var UPPER = 'A'.charCodeAt(0)
        var PLUS_URL_SAFE = '-'.charCodeAt(0)
        var SLASH_URL_SAFE = '_'.charCodeAt(0)
        function decode (elt) {
            var code = elt.charCodeAt(0)
            if (code === PLUS ||
            code === PLUS_URL_SAFE)
                return 62 // '+'
            if (code === SLASH ||
            code === SLASH_URL_SAFE)
                return 63 // '/'
            if (code < NUMBER)
                return - 1 //no match
            if (code < NUMBER + 10)
                return code - NUMBER + 26 + 26
            if (code < UPPER + 26)
                return code - UPPER
            if (code < LOWER + 26)
                return code - LOWER + 26
        }

        function b64ToByteArray (b64) {
            var i, j, l, tmp, placeHolders, arr
            if (b64.length % 4 > 0) {
                throw new Error('Invalid string. Length must be a multiple of 4')
            }

            // the number of equal signs (place holders)
            // if there are two placeholders, than the two characters before it
            // represent one byte
            // if there is only one, then the three characters before it represent 2 bytes
            // this is just a cheap hack to not do indexOf twice
            var len = b64.length
            placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0
            // base64 is 4/3 + up to two characters of the original data
            arr = new Arr(b64.length * 3 / 4 - placeHolders)
            // if there are placeholders, only get up to the last complete 4 chars
            l = placeHolders > 0 ? b64.length - 4 : b64.length
            var L = 0
            function push (v) {
                arr[L++] = v
            }

            for (i = 0, j = 0; i < l; i += 4, j += 3) {
                tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
                push((tmp & 0xFF0000) >> 16)
                push((tmp & 0xFF00) >> 8)
                push(tmp & 0xFF)
            }

            if (placeHolders === 2) {
                tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
                push(tmp & 0xFF)
            } else if (placeHolders === 1) {
                tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
                push((tmp >> 8) & 0xFF)
                push(tmp & 0xFF)
            }

            return arr
        }

        function uint8ToBase64 (uint8) {
            var i,
            extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
            output = "",
            temp, length
            function encode (num) {
                return lookup.charAt(num)
            }

            function tripletToBase64 (num) {
                return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
            }

            // go through the array every three bytes, we'll deal with trailing stuff later
            for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
                temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
                output += tripletToBase64(temp)
            }

            // pad the end with zeros, but make sure to not forget the extra bytes
            switch (extraBytes) {
            case 1:
                temp = uint8[uint8.length - 1]
                output += encode(temp >> 2)
                output += encode((temp << 4) & 0x3F)
                output += '=='
                break
            case 2 :
            temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
            output += encode(temp >> 10)
            output += encode((temp >> 4) & 0x3F)
            output += encode((temp << 2) & 0x3F)
            output += '='
            break
        }

        return output
    }

    exports.toByteArray = b64ToByteArray
    exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))
}, {}
],
7: [function(require, module, exports) {
    exports.read = function (buffer, offset, isLE, mLen, nBytes) {
        var e, m
        var eLen = nBytes * 8 - mLen - 1
        var eMax = (1 << eLen) - 1
        var eBias = eMax >> 1
        var nBits = - 7
        var i = isLE ? (nBytes - 1) : 0
        var d = isLE ? - 1 : 1
        var s = buffer[offset + i]
        i += d
        e = s & ((1 << ( - nBits)) - 1)
        s >>= ( - nBits)
        nBits += eLen
        for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

        m = e & ((1 << ( - nBits)) - 1)
        e >>= ( - nBits)
        nBits += mLen
        for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

        if (e === 0) {
            e = 1 - eBias
        } else if (e === eMax) {
            return m ? NaN : ((s ? - 1 : 1) * Infinity)
        } else {
            m = m + Math.pow(2, mLen)
            e = e - eBias
        }
        return (s ? - 1 : 1) * m * Math.pow(2, e - mLen)
    }

    exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
        var e, m, c
        var eLen = nBytes * 8 - mLen - 1
        var eMax = (1 << eLen) - 1
        var eBias = eMax >> 1
        var rt = (mLen === 23 ? Math.pow(2, - 24) - Math.pow(2, - 77) : 0)
        var i = isLE ? 0 : (nBytes - 1)
        var d = isLE ? 1 : - 1
        var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0
        value = Math.abs(value)
        if (isNaN(value) || value === Infinity) {
            m = isNaN(value) ? 1 : 0
            e = eMax
        } else {
            e = Math.floor(Math.log(value) / Math.LN2)
            if (value * (c = Math.pow(2, - e)) < 1) {
                e--
                c *= 2
            }
            if (e + eBias >= 1) {
                value += rt / c
            } else {
                value += rt * Math.pow(2, 1 - eBias)
            }
            if (value * c >= 2) {
                e++
                c /= 2
            }

            if (e + eBias >= eMax) {
                m = 0
                e = eMax
            } else if (e + eBias >= 1) {
                m = (value * c - 1) * Math.pow(2, mLen)
                e = e + eBias
            } else {
                m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
                e = 0
            }
        }

        for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

        e = (e << mLen) | m
        eLen += mLen
        for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

        buffer[offset + i - d] |= s * 128
    }

}, {}
],
8: [function(require, module, exports) {

    /**
     * isArray
     */

    var isArray = Array.isArray;

    /**
     * toString
     */

    var str = Object.prototype.toString;

    /**
     * Whether or not the given `val`
     * is an array.
     *
     * example:
     *
     *        isArray([]);
     *        // > true
     *        isArray(arguments);
     *        // > false
     *        isArray('');
     *        // > false
     *
     * @param {mixed} val
     * @return {bool}
     */

    module.exports = isArray || function (val) {
        return !! val && '[object Array]' == str.call(val);
    };

}, {}
],
9: [function(require, module, exports) {
    // Copyright Joyent, Inc. and other Node contributors.
    //
    // Permission is hereby granted, free of charge, to any person obtaining a
    // copy of this software and associated documentation files (the
    // "Software"), to deal in the Software without restriction, including
    // without limitation the rights to use, copy, modify, merge, publish,
    // distribute, sublicense, and/or sell copies of the Software, and to permit
    // persons to whom the Software is furnished to do so, subject to the
    // following conditions:
    //
    // The above copyright notice and this permission notice shall be included
    // in all copies or substantial portions of the Software.
    //
    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
    // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
    // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
    // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
    // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
    // USE OR OTHER DEALINGS IN THE SOFTWARE.

    function EventEmitter() {
        this._events = this._events || {};
        this._maxListeners = this._maxListeners || undefined;
    }
    module.exports = EventEmitter;

    // Backwards-compat with node 0.10.x
    EventEmitter.EventEmitter = EventEmitter;

    EventEmitter.prototype._events = undefined;
    EventEmitter.prototype._maxListeners = undefined;

    // By default EventEmitters will print a warning if more than 10 listeners are
    // added to it. This is a useful default which helps finding memory leaks.
    EventEmitter.defaultMaxListeners = 10;

    // Obviously not all Emitters should be limited to 10. This function allows
    // that to be increased. Set to zero for unlimited.
    EventEmitter.prototype.setMaxListeners = function(n) {
        if (!isNumber(n) || n < 0 || isNaN(n))
            throw TypeError('n must be a positive number');
        this._maxListeners = n;
        return this;
    };

    EventEmitter.prototype.emit = function(type) {
        var er, handler, len, args, i, listeners;

        if (!this._events)
            this._events = {};

        // If there is no 'error' event listener then throw.
        if (type === 'error') {
            if (!this._events.error ||
            (isObject(this._events.error) && !this._events.error.length)) {
                er = arguments[1];
                if (er instanceof Error) {
                    throw er; // Unhandled 'error' event
                }
                throw TypeError('Uncaught, unspecified "error" event.');
            }
        }

        handler = this._events[type];

        if (isUndefined(handler))
            return false;

        if (isFunction(handler)) {
            switch (arguments.length) {
                // fast cases
            case 1:
                handler.call(this);
                break;
            case 2:
                handler.call(this, arguments[1]);
                break;
            case 3:
                handler.call(this, arguments[1], arguments[2]);
                break;
                // slower
            default:
                len = arguments.length;
                args = new Array(len - 1);
                for (i = 1; i < len; i++)
                    args[i - 1] = arguments[i];
                handler.apply(this, args);
            }
        } else if (isObject(handler)) {
            len = arguments.length;
            args = new Array(len - 1);
            for (i = 1; i < len; i++)
                args[i - 1] = arguments[i];

            listeners = handler.slice();
            len = listeners.length;
            for (i = 0; i < len; i++)
                listeners[i].apply(this, args);
        }

        return true;
    };

    EventEmitter.prototype.addListener = function(type, listener) {
        var m;

        if (!isFunction(listener))
            throw TypeError('listener must be a function');

        if (!this._events)
            this._events = {};

        // To avoid recursion in the case that type === "newListener"! Before
        // adding it to the listeners, first emit "newListener".
        if (this._events.newListener)
            this.emit('newListener', type,
            isFunction(listener.listener) ?
            listener.listener : listener);

        if (!this._events[type])
        // Optimize the case of one listener. Don't need the extra array object.
        this._events[type] = listener;
        else if (isObject(this._events[type]))
        // If we've already got an array, just append.
        this._events[type].push(listener);
        else
        // Adding the second element, need to change to array.
        this._events[type] = [this._events[type], listener];

        // Check for listener leak
        if (isObject(this._events[type]) && !this._events[type].warned) {
            var m;
            if (!isUndefined(this._maxListeners)) {
                m = this._maxListeners;
            } else {
                m = EventEmitter.defaultMaxListeners;
            }

            if (m && m > 0 && this._events[type].length > m) {
                this._events[type].warned = true;
                console.error('(node) warning: possible EventEmitter memory ' +
                'leak detected. %d listeners added. ' +
                'Use emitter.setMaxListeners() to increase limit.',
                this._events[type].length);
                if (typeof console.trace === 'function') {
                    // not supported in IE 10
                    console.trace();
                }
            }
        }

        return this;
    };

    EventEmitter.prototype.on = EventEmitter.prototype.addListener;

    EventEmitter.prototype.once = function(type, listener) {
        if (!isFunction(listener))
            throw TypeError('listener must be a function');

        var fired = false;

        function g() {
            this.removeListener(type, g);

            if (!fired) {
                fired = true;
                listener.apply(this, arguments);
            }
        }

        g.listener = listener;
        this.on(type, g);

        return this;
    };

    // emits a 'removeListener' event iff the listener was removed
    EventEmitter.prototype.removeListener = function(type, listener) {
        var list, position, length, i;

        if (!isFunction(listener))
            throw TypeError('listener must be a function');

        if (!this._events || !this._events[type])
            return this;

        list = this._events[type];
        length = list.length;
        position = - 1;

        if (list === listener ||
        (isFunction(list.listener) && list.listener === listener)) {
            delete this._events[type];
            if (this._events.removeListener)
                this.emit('removeListener', type, listener);

        } else if (isObject(list)) {
            for (i = length; i-- > 0;) {
                if (list[i] === listener ||
                (list[i].listener && list[i].listener === listener)) {
                    position = i;
                    break;
                }
            }

            if (position < 0)
                return this;

            if (list.length === 1) {
                list.length = 0;
                delete this._events[type];
            } else {
                list.splice(position, 1);
            }

            if (this._events.removeListener)
                this.emit('removeListener', type, listener);
        }

        return this;
    };

    EventEmitter.prototype.removeAllListeners = function(type) {
        var key, listeners;

        if (!this._events)
            return this;

        // not listening for removeListener, no need to emit
        if (!this._events.removeListener) {
            if (arguments.length === 0)
                this._events = {};
            else if (this._events[type])
                delete this._events[type];
            return this;
        }

        // emit removeListener for all listeners on all events
        if (arguments.length === 0) {
            for (key in this._events) {
                if (key === 'removeListener')
                    continue;
                this.removeAllListeners(key);
            }
            this.removeAllListeners('removeListener');
            this._events = {};
            return this;
        }

        listeners = this._events[type];

        if (isFunction(listeners)) {
            this.removeListener(type, listeners);
        } else {
            // LIFO order
            while (listeners.length)
                this.removeListener(type, listeners[listeners.length - 1]);
        }
        delete this._events[type];

        return this;
    };

    EventEmitter.prototype.listeners = function(type) {
        var ret;
        if (!this._events || !this._events[type])
            ret = [];
        else if (isFunction(this._events[type]))
            ret = [this._events[type]];
        else
            ret = this._events[type].slice();
        return ret;
    };

    EventEmitter.listenerCount = function(emitter, type) {
        var ret;
        if (!emitter._events || !emitter._events[type])
            ret = 0;
        else if (isFunction(emitter._events[type]))
            ret = 1;
        else
            ret = emitter._events[type].length;
        return ret;
    };

    function isFunction(arg) {
        return typeof arg === 'function';
    }

    function isNumber(arg) {
        return typeof arg === 'number';
    }

    function isObject(arg) {
        return typeof arg === 'object' && arg !== null;
    }

    function isUndefined(arg) {
        return arg === void 0;
    }

}, {}
],
10: [function(require, module, exports) {
    var http = module.exports;
    var EventEmitter = require('events').EventEmitter;
    var Request = require('./lib/request');
    var url = require('url')
    http.request = function (params, cb) {
        if (typeof params === 'string') {
            params = url.parse(params)
        }
        if (!params)
            params = {};
        if (!params.host && !params.port) {
            params.port = parseInt(window.location.port, 10);
        }
        if (!params.host && params.hostname) {
            params.host = params.hostname;
        }

        if (!params.protocol) {
            if (params.scheme) {
                params.protocol = params.scheme + ':';
            } else {
                params.protocol = window.location.protocol;
            }
        }

        if (!params.host) {
            params.host = window.location.hostname || window.location.host;
        }
        if (/:/.test(params.host)) {
            if (!params.port) {
                params.port = params.host.split(':')[1];
            }
            params.host = params.host.split(':')[0];
        }
        if (!params.port)
            params.port = params.protocol == 'https:' ? 443 : 80;

        var req = new Request(new xhrHttp, params);
        if (cb)
            req.on('response', cb);
        return req;
    };

    http.get = function (params, cb) {
        params.method = 'GET';
        var req = http.request(params, cb);
        req.end();
        return req;
    };

    http.Agent = function () {};
    http.Agent.defaultMaxSockets = 4;

    var xhrHttp = (function () {
        if (typeof window === 'undefined') {
            throw new Error('no window object present');
        } else if (window.XMLHttpRequest) {
            return window.XMLHttpRequest;
        } else if (window.ActiveXObject) {
            var axs = [
            'Msxml2.XMLHTTP.6.0',
            'Msxml2.XMLHTTP.3.0',
            'Microsoft.XMLHTTP'
            ];
            for (var i = 0; i < axs.length; i++) {
                try {
                    var ax = new (window.ActiveXObject)(axs[i]);
                    return function () {
                        if (ax) {
                            var ax_ = ax;
                            ax = null;
                            return ax_;
                        } else {
                            return new (window.ActiveXObject)(axs[i]);
                        }
                    };
                } catch (e) {}
            }
            throw new Error('ajax not supported in this browser')
        } else {
            throw new Error('ajax not supported in this browser');
        }
    })();

    http.STATUS_CODES = {
        100 : 'Continue',
        101 : 'Switching Protocols',
        102 : 'Processing',
        // RFC 2518, obsoleted by RFC 4918
        200 : 'OK',
        201 : 'Created',
        202 : 'Accepted',
        203 : 'Non-Authoritative Information',
        204 : 'No Content',
        205 : 'Reset Content',
        206 : 'Partial Content',
        207 : 'Multi-Status',
        // RFC 4918
        300 : 'Multiple Choices',
        301 : 'Moved Permanently',
        302 : 'Moved Temporarily',
        303 : 'See Other',
        304 : 'Not Modified',
        305 : 'Use Proxy',
        307 : 'Temporary Redirect',
        400 : 'Bad Request',
        401 : 'Unauthorized',
        402 : 'Payment Required',
        403 : 'Forbidden',
        404 : 'Not Found',
        405 : 'Method Not Allowed',
        406 : 'Not Acceptable',
        407 : 'Proxy Authentication Required',
        408 : 'Request Time-out',
        409 : 'Conflict',
        410 : 'Gone',
        411 : 'Length Required',
        412 : 'Precondition Failed',
        413 : 'Request Entity Too Large',
        414 : 'Request-URI Too Large',
        415 : 'Unsupported Media Type',
        416 : 'Requested Range Not Satisfiable',
        417 : 'Expectation Failed',
        418 : 'I\'m a teapot',
        // RFC 2324
        422 : 'Unprocessable Entity',
        // RFC 4918
        423 : 'Locked',
        // RFC 4918
        424 : 'Failed Dependency',
        // RFC 4918
        425 : 'Unordered Collection',
        // RFC 4918
        426 : 'Upgrade Required',
        // RFC 2817
        428 : 'Precondition Required',
        // RFC 6585
        429 : 'Too Many Requests',
        // RFC 6585
        431 : 'Request Header Fields Too Large',
        // RFC 6585
        500 : 'Internal Server Error',
        501 : 'Not Implemented',
        502 : 'Bad Gateway',
        503 : 'Service Unavailable',
        504 : 'Gateway Time-out',
        505 : 'HTTP Version Not Supported',
        506 : 'Variant Also Negotiates',
        // RFC 2295
        507 : 'Insufficient Storage',
        // RFC 4918
        509 : 'Bandwidth Limit Exceeded',
        510 : 'Not Extended',
        // RFC 2774
        511 : 'Network Authentication Required' // RFC 6585
    };
}, {
    "./lib/request": 11,
    "events": 9,
    "url": 35
}
],
11: [function(require, module, exports) {
    var Stream = require('stream');
    var Response = require('./response');
    var Base64 = require('Base64');
    var inherits = require('inherits');

    var Request = module.exports = function (xhr, params) {
        var self = this;
        self.writable = true;
        self.xhr = xhr;
        self.body = [];

        self.uri = (params.protocol || 'http:') + '//'
        + params.host
        + (params.port ? ':' + params.port : '')
        + (params.path || '/')
        ;

        if (typeof params.withCredentials === 'undefined') {
            params.withCredentials = true;
        }

        try {
            xhr.withCredentials = params.withCredentials
        } catch (e) {}

        if (params.responseType)
            try {
                xhr.responseType = params.responseType
        } catch (e) {}

        xhr.open(
        params.method || 'GET',
        self.uri,
        true
        );

        xhr.onerror = function(event) {
            self.emit('error', new Error('Network error'));
        };

        self._headers = {};

        if (params.headers) {
            var keys = objectKeys(params.headers);
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                if (!self.isSafeRequestHeader(key))
                    continue;
                var value = params.headers[key];
                self.setHeader(key, value);
            }
        }

        if (params.auth) {
            //basic auth
            this.setHeader('Authorization', 'Basic ' + Base64.btoa(params.auth));
        }

        var res = new Response;
        res.on('close', function () {
            self.emit('close');
        });

        res.on('ready', function () {
            self.emit('response', res);
        });

        res.on('error', function (err) {
            self.emit('error', err);
        });

        xhr.onreadystatechange = function () {
            // Fix for IE9 bug
            // SCRIPT575: Could not complete the operation due to error c00c023f
            // It happens when a request is aborted, calling the success callback anyway with readyState === 4
            if (xhr.__aborted)
                return;
            res.handle(xhr);
        };
    };

    inherits(Request, Stream);

    Request.prototype.setHeader = function (key, value) {
        this._headers[key.toLowerCase()] = value
    };

    Request.prototype.getHeader = function (key) {
        return this._headers[key.toLowerCase()]
    };

    Request.prototype.removeHeader = function (key) {
        delete this._headers[key.toLowerCase()]
    };

    Request.prototype.write = function (s) {
        this.body.push(s);
    };

    Request.prototype.destroy = function (s) {
        this.xhr.__aborted = true;
        this.xhr.abort();
        this.emit('close');
    };

    Request.prototype.end = function (s) {
        if (s !== undefined)
            this.body.push(s);

        var keys = objectKeys(this._headers);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var value = this._headers[key];
            if (isArray(value)) {
                for (var j = 0; j < value.length; j++) {
                    this.xhr.setRequestHeader(key, value[j]);
                }
            } else
                this.xhr.setRequestHeader(key, value)
        }

        if (this.body.length === 0) {
            this.xhr.send('');
        } else if (typeof this.body[0] === 'string') {
            this.xhr.send(this.body.join(''));
        } else if (isArray(this.body[0])) {
            var body = [];
            for (var i = 0; i < this.body.length; i++) {
                body.push.apply(body, this.body[i]);
            }
            this.xhr.send(body);
        } else if (/Array/.test(Object.prototype.toString.call(this.body[0]))) {
            var len = 0;
            for (var i = 0; i < this.body.length; i++) {
                len += this.body[i].length;
            }
            var body = new (this.body[0].constructor)(len);
            var k = 0;

            for (var i = 0; i < this.body.length; i++) {
                var b = this.body[i];
                for (var j = 0; j < b.length; j++) {
                    body[k++] = b[j];
                }
            }
            this.xhr.send(body);
        } else if (isXHR2Compatible(this.body[0])) {
            this.xhr.send(this.body[0]);
        } else {
            var body = '';
            for (var i = 0; i < this.body.length; i++) {
                body += this.body[i].toString();
            }
            this.xhr.send(body);
        }
    };

    // Taken from http://dxr.mozilla.org/mozilla/mozilla-central/content/base/src/nsXMLHttpRequest.cpp.html
    Request.unsafeHeaders = [
    "accept-charset",
    "accept-encoding",
    "access-control-request-headers",
    "access-control-request-method",
    "connection",
    "content-length",
    "cookie",
    "cookie2",
    "content-transfer-encoding",
    "date",
    "expect",
    "host",
    "keep-alive",
    "origin",
    "referer",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
    "user-agent",
    "via"
    ];

    Request.prototype.isSafeRequestHeader = function (headerName) {
        if (!headerName)
            return false;
        return indexOf(Request.unsafeHeaders, headerName.toLowerCase()) === - 1;
    };

    var objectKeys = Object.keys || function (obj) {
        var keys = [];
        for (var key in obj)
            keys.push(key);
        return keys;
    };

    var isArray = Array.isArray || function (xs) {
        return Object.prototype.toString.call(xs) === '[object Array]';
    };

    var indexOf = function (xs, x) {
        if (xs.indexOf)
            return xs.indexOf(x);
        for (var i = 0; i < xs.length; i++) {
            if (xs[i] === x)
                return i;
        }
        return - 1;
    };

    var isXHR2Compatible = function (obj) {
        if (typeof Blob !== 'undefined' && obj instanceof Blob)
            return true;
        if (typeof ArrayBuffer !== 'undefined' && obj instanceof ArrayBuffer)
            return true;
        if (typeof FormData !== 'undefined' && obj instanceof FormData)
            return true;
    };

}, {
    "./response": 12,
    "Base64": 13,
    "inherits": 14,
    "stream": 33
}
],
12: [function(require, module, exports) {
    var Stream = require('stream');
    var util = require('util');

    var Response = module.exports = function (res) {
        this.offset = 0;
        this.readable = true;
    };

    util.inherits(Response, Stream);

    var capable = {
        streaming : true,
        status2 : true
    };

    function parseHeaders (res) {
        var lines = res.getAllResponseHeaders().split(/\r?\n/);
        var headers = {};
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (line === '')
                continue;

            var m = line.match(/^([^:]+):\s*(.*)/);
            if (m) {
                var key = m[1].toLowerCase(), value = m[2];

                if (headers[key] !== undefined) {

                    if (isArray(headers[key])) {
                        headers[key].push(value);
                    } else {
                        headers[key] = [ headers[key], value ];
                    }
                } else {
                    headers[key] = value;
                }
            } else {
                headers[line] = true;
            }
        }
        return headers;
    }

    Response.prototype.getResponse = function (xhr) {
        var respType = String(xhr.responseType).toLowerCase();
        if (respType === 'blob')
            return xhr.responseBlob || xhr.response;
        if (respType === 'arraybuffer')
            return xhr.response;
        return xhr.responseText;
    }

    Response.prototype.getHeader = function (key) {
        return this.headers[key.toLowerCase()];
    };

    Response.prototype.handle = function (res) {
        if (res.readyState === 2 && capable.status2) {
            try {
                this.statusCode = res.status;
                this.headers = parseHeaders(res);
            } catch (err) {
                capable.status2 = false;
            }

            if (capable.status2) {
                this.emit('ready');
            }
        } else if (capable.streaming && res.readyState === 3) {
            try {
                if (!this.statusCode) {
                    this.statusCode = res.status;
                    this.headers = parseHeaders(res);
                    this.emit('ready');
                }
            } catch (err) {}

            try {
                this._emitData(res);
            } catch (err) {
                capable.streaming = false;
            }
        } else if (res.readyState === 4) {
            if (!this.statusCode) {
                this.statusCode = res.status;
                this.emit('ready');
            }
            this._emitData(res);

            if (res.error) {
                this.emit('error', this.getResponse(res));
            } else
                this.emit('end');

            this.emit('close');
        }
    };

    Response.prototype._emitData = function (res) {
        var respBody = this.getResponse(res);
        if (respBody.toString().match(/ArrayBuffer/)) {
            this.emit('data', new Uint8Array(respBody, this.offset));
            this.offset = respBody.byteLength;
            return;
        }
        if (respBody.length > this.offset) {
            this.emit('data', respBody.slice(this.offset));
            this.offset = respBody.length;
        }
    };

    var isArray = Array.isArray || function (xs) {
        return Object.prototype.toString.call(xs) === '[object Array]';
    };

}, {
    "stream": 33,
    "util": 37
}
],
13: [function(require, module, exports) {
    ;
    (function () {

        var object = typeof exports != 'undefined' ? exports : this; // #8: web workers
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

        function InvalidCharacterError(message) {
            this.message = message;
        }
        InvalidCharacterError.prototype = new Error;
        InvalidCharacterError.prototype.name = 'InvalidCharacterError';

        // encoder
        // [https://gist.github.com/999166] by [https://github.com/nignag]
        object.btoa || (
        object.btoa = function (input) {
            for (
            // initialize result and counter
            var block, charCode, idx = 0, map = chars, output = '';
            // if the next input index does not exist:
            //   change the mapping table to "="
            //   check if d has no fractional digits
            input.charAt(idx | 0) || (map = '=', idx % 1);
            // "8 - idx % 1 * 8" generates the sequence 2, 4, 6, 8
            output += map.charAt(63 & block >> 8 - idx % 1 * 8)
            ) {
                charCode = input.charCodeAt(idx += 3 / 4);
                if (charCode > 0xFF) {
                    throw new InvalidCharacterError("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
                }
                block = block << 8 | charCode;
            }
            return output;
        });

        // decoder
        // [https://gist.github.com/1020396] by [https://github.com/atk]
        object.atob || (
        object.atob = function (input) {
            input = input.replace(/=+$/, '');
            if (input.length % 4 == 1) {
                throw new InvalidCharacterError("'atob' failed: The string to be decoded is not correctly encoded.");
            }
            for (
            // initialize result and counters
            var bc = 0, bs, buffer, idx = 0, output = '';
            // get next character
            buffer = input.charAt(idx++);
            // character found in table? initialize bit storage and add its ascii value;
            ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
            // and if not first of each 4 characters,
            // convert the first 8 bits to one ascii character
            bc++ % 4) ? output += String.fromCharCode(255 & bs >> ( - 2 * bc & 6)) : 0
            ) {
                // try to find character in table (0-63, not found => -1)
                buffer = chars.indexOf(buffer);
            }
            return output;
        });

    }());

}, {}
],
14: [function(require, module, exports) {
    if (typeof Object.create === 'function') {
        // implementation from standard node.js 'util' module
        module.exports = function inherits(ctor, superCtor) {
            ctor.super_ = superCtor
            ctor.prototype = Object.create(superCtor.prototype, {
                constructor: {
                    value: ctor,
                    enumerable: false,
                    writable: true,
                    configurable: true
                }
            });
        };
    } else {
        // old school shim for old browsers
        module.exports = function inherits(ctor, superCtor) {
            ctor.super_ = superCtor
            var TempCtor = function () {}
            TempCtor.prototype = superCtor.prototype
            ctor.prototype = new TempCtor()
            ctor.prototype.constructor = ctor
        }
    }

}, {}
],
15: [function(require, module, exports) {
    /**
     * Determine if an object is Buffer
     *
     * Author:   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
     * License:  MIT
     *
     * `npm install is-buffer`
     */

    module.exports = function (obj) {
        return !!(obj != null &&
        (obj._isBuffer || // For Safari 5-7 (missing Object.prototype.constructor)
        (obj.constructor &&
        typeof obj.constructor.isBuffer === 'function' &&
        obj.constructor.isBuffer(obj))
        ))
    }

}, {}
],
16: [function(require, module, exports) {
    module.exports = Array.isArray || function (arr) {
        return Object.prototype.toString.call(arr) == '[object Array]';
    };

}, {}
],
17: [function(require, module, exports) {
    // shim for using process in browser

    var process = module.exports = {};
    var queue = [];
    var draining = false;
    var currentQueue;
    var queueIndex = - 1;

    function cleanUpNextTick() {
        draining = false;
        if (currentQueue.length) {
            queue = currentQueue.concat(queue);
        } else {
            queueIndex = - 1;
        }
        if (queue.length) {
            drainQueue();
        }
    }

    function drainQueue() {
        if (draining) {
            return;
        }
        var timeout = setTimeout(cleanUpNextTick);
        draining = true;

        var len = queue.length;
        while (len) {
            currentQueue = queue;
            queue = [];
            while (++queueIndex < len) {
                if (currentQueue) {
                    currentQueue[queueIndex].run();
                }
            }
            queueIndex = - 1;
            len = queue.length;
        }
        currentQueue = null;
        draining = false;
        clearTimeout(timeout);
    }

    process.nextTick = function (fun) {
        var args = new Array(arguments.length - 1);
        if (arguments.length > 1) {
            for (var i = 1; i < arguments.length; i++) {
                args[i - 1] = arguments[i];
            }
        }
        queue.push(new Item(fun, args));
        if (queue.length === 1 && !draining) {
            setTimeout(drainQueue, 0);
        }
    };

    // v8 likes predictible objects
    function Item(fun, array) {
        this.fun = fun;
        this.array = array;
    }
    Item.prototype.run = function () {
        this.fun.apply(null, this.array);
    };
    process.title = 'browser';
    process.browser = true;
    process.env = {};
    process.argv = [];
    process.version = ''; // empty string to avoid regexp issues
    process.versions = {};

    function noop() {}

    process.on = noop;
    process.addListener = noop;
    process.once = noop;
    process.off = noop;
    process.removeListener = noop;
    process.removeAllListeners = noop;
    process.emit = noop;

    process.binding = function (name) {
        throw new Error('process.binding is not supported');
    };

    process.cwd = function () {
        return '/'
    };
    process.chdir = function (dir) {
        throw new Error('process.chdir is not supported');
    };
    process.umask = function() {
        return 0;
    };

}, {}
],
18: [function(require, module, exports) {
    (function (global) {
        /*! https://mths.be/punycode v1.3.2 by @mathias */
        ;
        (function(root) {

            /** Detect free variables */
            var freeExports = typeof exports == 'object' && exports &&
            !exports.nodeType && exports;
            var freeModule = typeof module == 'object' && module &&
            !module.nodeType && module;
            var freeGlobal = typeof global == 'object' && global;
            if (
            freeGlobal.global === freeGlobal ||
            freeGlobal.window === freeGlobal ||
            freeGlobal.self === freeGlobal
            ) {
                root = freeGlobal;
            }

            /**
                 * The `punycode` object.
                 * @name punycode
                 * @type Object
                 */
            var punycode,
            /** Highest positive signed 32-bit float value */
            maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

            /** Bootstring parameters */
            base = 36,
            tMin = 1,
            tMax = 26,
            skew = 38,
            damp = 700,
            initialBias = 72,
            initialN = 128, // 0x80
            delimiter = '-', // '\x2D'

            /** Regular expressions */
            regexPunycode = /^xn--/,
            regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
            regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

            /** Error messages */
            errors = {
                'overflow': 'Overflow: input needs wider integers to process',
                'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
                'invalid-input': 'Invalid input'
            },
            /** Convenience shortcuts */
            baseMinusTMin = base - tMin,
            floor = Math.floor,
            stringFromCharCode = String.fromCharCode,
            /** Temporary variable */
            key;

            /*--------------------------------------------------------------------------*/

            /**
                 * A generic error utility function.
                 * @private
                 * @param {String} type The error type.
                 * @returns {Error} Throws a `RangeError` with the applicable error message.
                 */
            function error(type) {
                throw RangeError(errors[type]);
            }

            /**
                 * A generic `Array#map` utility function.
                 * @private
                 * @param {Array} array The array to iterate over.
                 * @param {Function} callback The function that gets called for every array
                 * item.
                 * @returns {Array} A new array of values returned by the callback function.
                 */
            function map(array, fn) {
                var length = array.length;
                var result = [];
                while (length--) {
                    result[length] = fn(array[length]);
                }
                return result;
            }

            /**
                 * A simple `Array#map`-like wrapper to work with domain name strings or email
                 * addresses.
                 * @private
                 * @param {String} domain The domain name or email address.
                 * @param {Function} callback The function that gets called for every
                 * character.
                 * @returns {Array} A new string of characters returned by the callback
                 * function.
                 */
            function mapDomain(string, fn) {
                var parts = string.split('@');
                var result = '';
                if (parts.length > 1) {
                    // In email addresses, only the domain name should be punycoded. Leave
                    // the local part (i.e. everything up to `@`) intact.
                    result = parts[0] + '@';
                    string = parts[1];
                }
                // Avoid `split(regex)` for IE8 compatibility. See #17.
                string = string.replace(regexSeparators, '\x2E');
                var labels = string.split('.');
                var encoded = map(labels, fn).join('.');
                return result + encoded;
            }

            /**
                 * Creates an array containing the numeric code points of each Unicode
                 * character in the string. While JavaScript uses UCS-2 internally,
                 * this function will convert a pair of surrogate halves (each of which
                 * UCS-2 exposes as separate characters) into a single code point,
                 * matching UTF-16.
                 * @see `punycode.ucs2.encode`
                 * @see <https://mathiasbynens.be/notes/javascript-encoding>
                 * @memberOf punycode.ucs2
                 * @name decode
                 * @param {String} string The Unicode input string (UCS-2).
                 * @returns {Array} The new array of code points.
                 */
            function ucs2decode(string) {
                var output = [],
                counter = 0,
                length = string.length,
                value,
                extra;
                while (counter < length) {
                    value = string.charCodeAt(counter++);
                    if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
                        // high surrogate, and there is a next character
                        extra = string.charCodeAt(counter++);
                        if ((extra & 0xFC00) == 0xDC00) {
                            // low surrogate
                            output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
                        } else {
                            // unmatched surrogate; only append this code unit, in case the next
                            // code unit is the high surrogate of a surrogate pair
                            output.push(value);
                            counter--;
                        }
                    } else {
                        output.push(value);
                    }
                }
                return output;
            }

            /**
                 * Creates a string based on an array of numeric code points.
                 * @see `punycode.ucs2.decode`
                 * @memberOf punycode.ucs2
                 * @name encode
                 * @param {Array} codePoints The array of numeric code points.
                 * @returns {String} The new Unicode string (UCS-2).
                 */
            function ucs2encode(array) {
                return map(array, function(value) {
                    var output = '';
                    if (value > 0xFFFF) {
                        value -= 0x10000;
                        output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
                        value = 0xDC00 | value & 0x3FF;
                    }
                    output += stringFromCharCode(value);
                    return output;
                }).join('');
            }

            /**
                 * Converts a basic code point into a digit/integer.
                 * @see `digitToBasic()`
                 * @private
                 * @param {Number} codePoint The basic numeric code point value.
                 * @returns {Number} The numeric value of a basic code point (for use in
                 * representing integers) in the range `0` to `base - 1`, or `base` if
                 * the code point does not represent a value.
                 */
            function basicToDigit(codePoint) {
                if (codePoint - 48 < 10) {
                    return codePoint - 22;
                }
                if (codePoint - 65 < 26) {
                    return codePoint - 65;
                }
                if (codePoint - 97 < 26) {
                    return codePoint - 97;
                }
                return base;
            }

            /**
                 * Converts a digit/integer into a basic code point.
                 * @see `basicToDigit()`
                 * @private
                 * @param {Number} digit The numeric value of a basic code point.
                 * @returns {Number} The basic code point whose value (when used for
                 * representing integers) is `digit`, which needs to be in the range
                 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
                 * used; else, the lowercase form is used. The behavior is undefined
                 * if `flag` is non-zero and `digit` has no uppercase form.
                 */
            function digitToBasic(digit, flag) {
                //  0..25 map to ASCII a..z or A..Z
                // 26..35 map to ASCII 0..9
                return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
            }

            /**
                 * Bias adaptation function as per section 3.4 of RFC 3492.
                 * http://tools.ietf.org/html/rfc3492#section-3.4
                 * @private
                 */
            function adapt(delta, numPoints, firstTime) {
                var k = 0;
                delta = firstTime ? floor(delta / damp) : delta >> 1;
                delta += floor(delta / numPoints);
                for ( /* no initialization */
                ; delta > baseMinusTMin * tMax >> 1; k += base) {
                    delta = floor(delta / baseMinusTMin);
                }
                return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
            }

            /**
                 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
                 * symbols.
                 * @memberOf punycode
                 * @param {String} input The Punycode string of ASCII-only symbols.
                 * @returns {String} The resulting string of Unicode symbols.
                 */
            function decode(input) {
                // Don't use UCS-2
                var output = [],
                inputLength = input.length,
                out,
                i = 0,
                n = initialN,
                bias = initialBias,
                basic,
                j,
                index,
                oldi,
                w,
                k,
                digit,
                t,
                /** Cached calculation results */
                baseMinusT;

                // Handle the basic code points: let `basic` be the number of input code
                // points before the last delimiter, or `0` if there is none, then copy
                // the first basic code points to the output.

                basic = input.lastIndexOf(delimiter);
                if (basic < 0) {
                    basic = 0;
                }

                for (j = 0; j < basic; ++j) {
                    // if it's not a basic code point
                    if (input.charCodeAt(j) >= 0x80) {
                        error('not-basic');
                    }
                    output.push(input.charCodeAt(j));
                }

                // Main decoding loop: start just after the last delimiter if any basic code
                // points were copied; start at the beginning otherwise.

                for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */
                ) {

                    // `index` is the index of the next character to be consumed.
                    // Decode a generalized variable-length integer into `delta`,
                    // which gets added to `i`. The overflow checking is easier
                    // if we increase `i` as we go, then subtract off its starting
                    // value at the end to obtain `delta`.
                    for (oldi = i, w = 1, k = base; /* no condition */
                    ; k += base) {

                        if (index >= inputLength) {
                            error('invalid-input');
                        }

                        digit = basicToDigit(input.charCodeAt(index++));

                        if (digit >= base || digit > floor((maxInt - i) / w)) {
                            error('overflow');
                        }

                        i += digit * w;
                        t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

                        if (digit < t) {
                            break;
                        }

                        baseMinusT = base - t;
                        if (w > floor(maxInt / baseMinusT)) {
                            error('overflow');
                        }

                        w *= baseMinusT;

                    }

                    out = output.length + 1;
                    bias = adapt(i - oldi, out, oldi == 0);

                    // `i` was supposed to wrap around from `out` to `0`,
                    // incrementing `n` each time, so we'll fix that now:
                    if (floor(i / out) > maxInt - n) {
                        error('overflow');
                    }

                    n += floor(i / out);
                    i %= out;

                    // Insert `n` at position `i` of the output
                    output.splice(i++, 0, n);

                }

                return ucs2encode(output);
            }

            /**
                 * Converts a string of Unicode symbols (e.g. a domain name label) to a
                 * Punycode string of ASCII-only symbols.
                 * @memberOf punycode
                 * @param {String} input The string of Unicode symbols.
                 * @returns {String} The resulting Punycode string of ASCII-only symbols.
                 */
            function encode(input) {
                var n,
                delta,
                handledCPCount,
                basicLength,
                bias,
                j,
                m,
                q,
                k,
                t,
                currentValue,
                output = [],
                /** `inputLength` will hold the number of code points in `input`. */
                inputLength,
                /** Cached calculation results */
                handledCPCountPlusOne,
                baseMinusT,
                qMinusT;

                // Convert the input in UCS-2 to Unicode
                input = ucs2decode(input);

                // Cache the length
                inputLength = input.length;

                // Initialize the state
                n = initialN;
                delta = 0;
                bias = initialBias;

                // Handle the basic code points
                for (j = 0; j < inputLength; ++j) {
                    currentValue = input[j];
                    if (currentValue < 0x80) {
                        output.push(stringFromCharCode(currentValue));
                    }
                }

                handledCPCount = basicLength = output.length;

                // `handledCPCount` is the number of code points that have been handled;
                // `basicLength` is the number of basic code points.

                // Finish the basic string - if it is not empty - with a delimiter
                if (basicLength) {
                    output.push(delimiter);
                }

                // Main encoding loop:
                while (handledCPCount < inputLength) {

                    // All non-basic code points < n have been handled already. Find the next
                    // larger one:
                    for (m = maxInt, j = 0; j < inputLength; ++j) {
                        currentValue = input[j];
                        if (currentValue >= n && currentValue < m) {
                            m = currentValue;
                        }
                    }

                    // Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
                    // but guard against overflow
                    handledCPCountPlusOne = handledCPCount + 1;
                    if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
                        error('overflow');
                    }

                    delta += (m - n) * handledCPCountPlusOne;
                    n = m;

                    for (j = 0; j < inputLength; ++j) {
                        currentValue = input[j];

                        if (currentValue < n && ++delta > maxInt) {
                            error('overflow');
                        }

                        if (currentValue == n) {
                            // Represent delta as a generalized variable-length integer
                            for (q = delta, k = base; /* no condition */
                            ; k += base) {
                                t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
                                if (q < t) {
                                    break;
                                }
                                qMinusT = q - t;
                                baseMinusT = base - t;
                                output.push(
                                stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
                                );
                                q = floor(qMinusT / baseMinusT);
                            }

                            output.push(stringFromCharCode(digitToBasic(q, 0)));
                            bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
                            delta = 0;
                            ++handledCPCount;
                        }
                    }

                    ++delta;
                    ++n;

                }
                return output.join('');
            }

            /**
                 * Converts a Punycode string representing a domain name or an email address
                 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
                 * it doesn't matter if you call it on a string that has already been
                 * converted to Unicode.
                 * @memberOf punycode
                 * @param {String} input The Punycoded domain name or email address to
                 * convert to Unicode.
                 * @returns {String} The Unicode representation of the given Punycode
                 * string.
                 */
            function toUnicode(input) {
                return mapDomain(input, function(string) {
                    return regexPunycode.test(string)
                    ? decode(string.slice(4).toLowerCase())
                    : string;
                });
            }

            /**
                 * Converts a Unicode string representing a domain name or an email address to
                 * Punycode. Only the non-ASCII parts of the domain name will be converted,
                 * i.e. it doesn't matter if you call it with a domain that's already in
                 * ASCII.
                 * @memberOf punycode
                 * @param {String} input The domain name or email address to convert, as a
                 * Unicode string.
                 * @returns {String} The Punycode representation of the given domain name or
                 * email address.
                 */
            function toASCII(input) {
                return mapDomain(input, function(string) {
                    return regexNonASCII.test(string)
                    ? 'xn--' + encode(string)
                    : string;
                });
            }

            /*--------------------------------------------------------------------------*/

            /** Define the public API */
            punycode = {
                /**
                         * A string representing the current Punycode.js version number.
                         * @memberOf punycode
                         * @type String
                         */
                'version': '1.3.2',
                /**
                         * An object of methods to convert from JavaScript's internal character
                         * representation (UCS-2) to Unicode code points, and back.
                         * @see <https://mathiasbynens.be/notes/javascript-encoding>
                         * @memberOf punycode
                         * @type Object
                         */
                'ucs2': {
                    'decode': ucs2decode,
                    'encode': ucs2encode
                },
                'decode': decode,
                'encode': encode,
                'toASCII': toASCII,
                'toUnicode': toUnicode
            };

            /** Expose `punycode` */
            // Some AMD build optimizers, like r.js, check for specific condition patterns
            // like the following:
            if (
            typeof define == 'function' &&
            typeof define.amd == 'object' &&
            define.amd
            ) {
                define('punycode', function() {
                    return punycode;
                });
            } else if (freeExports && freeModule) {
                if (module.exports == freeExports) {
                    // in Node.js or RingoJS v0.8.0+
                    freeModule.exports = punycode;
                } else {
                    // in Narwhal or RingoJS v0.7.0-
                    for (key in punycode) {
                        punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
                    }
                }
            } else {
                // in Rhino or a web browser
                root.punycode = punycode;
            }

        }(this));

    }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
}, {}
],
19: [function(require, module, exports) {
    // Copyright Joyent, Inc. and other Node contributors.
    //
    // Permission is hereby granted, free of charge, to any person obtaining a
    // copy of this software and associated documentation files (the
    // "Software"), to deal in the Software without restriction, including
    // without limitation the rights to use, copy, modify, merge, publish,
    // distribute, sublicense, and/or sell copies of the Software, and to permit
    // persons to whom the Software is furnished to do so, subject to the
    // following conditions:
    //
    // The above copyright notice and this permission notice shall be included
    // in all copies or substantial portions of the Software.
    //
    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
    // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
    // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
    // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
    // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
    // USE OR OTHER DEALINGS IN THE SOFTWARE.

    'use strict';

    // If obj.hasOwnProperty has been overridden, then calling
    // obj.hasOwnProperty(prop) will break.
    // See: https://github.com/joyent/node/issues/1707
    function hasOwnProperty(obj, prop) {
        return Object.prototype.hasOwnProperty.call(obj, prop);
    }

    module.exports = function(qs, sep, eq, options) {
        sep = sep || '&';
        eq = eq || '=';
        var obj = {};

        if (typeof qs !== 'string' || qs.length === 0) {
            return obj;
        }

        var regexp = /\+/g;
        qs = qs.split(sep);

        var maxKeys = 1000;
        if (options && typeof options.maxKeys === 'number') {
            maxKeys = options.maxKeys;
        }

        var len = qs.length;
        // maxKeys <= 0 means that we should not limit keys count
        if (maxKeys > 0 && len > maxKeys) {
            len = maxKeys;
        }

        for (var i = 0; i < len; ++i) {
            var x = qs[i].replace(regexp, '%20'),
            idx = x.indexOf(eq),
            kstr, vstr, k, v;

            if (idx >= 0) {
                kstr = x.substr(0, idx);
                vstr = x.substr(idx + 1);
            } else {
                kstr = x;
                vstr = '';
            }

            k = decodeURIComponent(kstr);
            v = decodeURIComponent(vstr);

            if (!hasOwnProperty(obj, k)) {
                obj[k] = v;
            } else if (isArray(obj[k])) {
                obj[k].push(v);
            } else {
                obj[k] = [obj[k], v];
            }
        }

        return obj;
    };

    var isArray = Array.isArray || function (xs) {
        return Object.prototype.toString.call(xs) === '[object Array]';
    };

}, {}
],
20: [function(require, module, exports) {
    // Copyright Joyent, Inc. and other Node contributors.
    //
    // Permission is hereby granted, free of charge, to any person obtaining a
    // copy of this software and associated documentation files (the
    // "Software"), to deal in the Software without restriction, including
    // without limitation the rights to use, copy, modify, merge, publish,
    // distribute, sublicense, and/or sell copies of the Software, and to permit
    // persons to whom the Software is furnished to do so, subject to the
    // following conditions:
    //
    // The above copyright notice and this permission notice shall be included
    // in all copies or substantial portions of the Software.
    //
    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
    // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
    // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
    // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
    // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
    // USE OR OTHER DEALINGS IN THE SOFTWARE.

    'use strict';

    var stringifyPrimitive = function(v) {
        switch (typeof v) {
        case 'string':
            return v;

        case 'boolean':
            return v ? 'true' : 'false';

        case 'number':
            return isFinite(v) ? v : '';

        default:
            return '';
        }
    };

    module.exports = function(obj, sep, eq, name) {
        sep = sep || '&';
        eq = eq || '=';
        if (obj === null) {
            obj = undefined;
        }

        if (typeof obj === 'object') {
            return map(objectKeys(obj), function(k) {
                var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
                if (isArray(obj[k])) {
                    return map(obj[k], function(v) {
                        return ks + encodeURIComponent(stringifyPrimitive(v));
                    }).join(sep);
                } else {
                    return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
                }
            }).join(sep);

        }

        if (!name)
            return '';
        return encodeURIComponent(stringifyPrimitive(name)) + eq +
        encodeURIComponent(stringifyPrimitive(obj));
    };

    var isArray = Array.isArray || function (xs) {
        return Object.prototype.toString.call(xs) === '[object Array]';
    };

    function map (xs, f) {
        if (xs.map)
            return xs.map(f);
        var res = [];
        for (var i = 0; i < xs.length; i++) {
            res.push(f(xs[i], i));
        }
        return res;
    }

    var objectKeys = Object.keys || function (obj) {
        var res = [];
        for (var key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key))
                res.push(key);
        }
        return res;
    };

}, {}
],
21: [function(require, module, exports) {
    'use strict';

    exports.decode = exports.parse = require('./decode');
    exports.encode = exports.stringify = require('./encode');

}, {
    "./decode": 19,
    "./encode": 20
}
],
22: [function(require, module, exports) {
    module.exports = require("./lib/_stream_duplex.js")
}, {
    "./lib/_stream_duplex.js": 23
}
],
23: [function(require, module, exports) {
    (function (process) {
        // Copyright Joyent, Inc. and other Node contributors.
        //
        // Permission is hereby granted, free of charge, to any person obtaining a
        // copy of this software and associated documentation files (the
        // "Software"), to deal in the Software without restriction, including
        // without limitation the rights to use, copy, modify, merge, publish,
        // distribute, sublicense, and/or sell copies of the Software, and to permit
        // persons to whom the Software is furnished to do so, subject to the
        // following conditions:
        //
        // The above copyright notice and this permission notice shall be included
        // in all copies or substantial portions of the Software.
        //
        // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
        // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
        // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
        // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
        // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
        // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
        // USE OR OTHER DEALINGS IN THE SOFTWARE.

        // a duplex stream is just a stream that is both readable and writable.
        // Since JS doesn't have multiple prototypal inheritance, this class
        // prototypally inherits from Readable, and then parasitically from
        // Writable.

        module.exports = Duplex;

        /*<replacement>*/
        var objectKeys = Object.keys || function (obj) {
            var keys = [];
            for (var key in obj)
                keys.push(key);
            return keys;
        }
        /*</replacement>*/


        /*<replacement>*/
        var util = require('core-util-is');
        util.inherits = require('inherits');
        /*</replacement>*/

        var Readable = require('./_stream_readable');
        var Writable = require('./_stream_writable');

        util.inherits(Duplex, Readable);

        forEach(objectKeys(Writable.prototype), function(method) {
            if (!Duplex.prototype[method])
                Duplex.prototype[method] = Writable.prototype[method];
        });

        function Duplex(options) {
            if (!(this instanceof Duplex))
                return new Duplex(options);

            Readable.call(this, options);
            Writable.call(this, options);

            if (options && options.readable === false)
                this.readable = false;

            if (options && options.writable === false)
                this.writable = false;

            this.allowHalfOpen = true;
            if (options && options.allowHalfOpen === false)
                this.allowHalfOpen = false;

            this.once('end', onend);
        }

        // the no-half-open enforcer
        function onend() {
            // if we allow half-open state, or if the writable side ended,
            // then we're ok.
            if (this.allowHalfOpen || this._writableState.ended)
                return;

            // no more data can be written.
            // But allow more writes to happen in this tick.
            process.nextTick(this.end.bind(this));
        }

        function forEach (xs, f) {
            for (var i = 0, l = xs.length; i < l; i++) {
                f(xs[i], i);
            }
        }

    }).call(this, require('_process'))
}, {
    "./_stream_readable": 25,
    "./_stream_writable": 27,
    "_process": 17,
    "core-util-is": 28,
    "inherits": 14
}
],
24: [function(require, module, exports) {
    // Copyright Joyent, Inc. and other Node contributors.
    //
    // Permission is hereby granted, free of charge, to any person obtaining a
    // copy of this software and associated documentation files (the
    // "Software"), to deal in the Software without restriction, including
    // without limitation the rights to use, copy, modify, merge, publish,
    // distribute, sublicense, and/or sell copies of the Software, and to permit
    // persons to whom the Software is furnished to do so, subject to the
    // following conditions:
    //
    // The above copyright notice and this permission notice shall be included
    // in all copies or substantial portions of the Software.
    //
    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
    // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
    // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
    // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
    // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
    // USE OR OTHER DEALINGS IN THE SOFTWARE.

    // a passthrough stream.
    // basically just the most minimal sort of Transform stream.
    // Every written chunk gets output as-is.

    module.exports = PassThrough;

    var Transform = require('./_stream_transform');

    /*<replacement>*/
    var util = require('core-util-is');
    util.inherits = require('inherits');
    /*</replacement>*/

    util.inherits(PassThrough, Transform);

    function PassThrough(options) {
        if (!(this instanceof PassThrough))
            return new PassThrough(options);

        Transform.call(this, options);
    }

    PassThrough.prototype._transform = function(chunk, encoding, cb) {
        cb(null, chunk);
    };

}, {
    "./_stream_transform": 26,
    "core-util-is": 28,
    "inherits": 14
}
],
25: [function(require, module, exports) {
    (function (process) {
        // Copyright Joyent, Inc. and other Node contributors.
        //
        // Permission is hereby granted, free of charge, to any person obtaining a
        // copy of this software and associated documentation files (the
        // "Software"), to deal in the Software without restriction, including
        // without limitation the rights to use, copy, modify, merge, publish,
        // distribute, sublicense, and/or sell copies of the Software, and to permit
        // persons to whom the Software is furnished to do so, subject to the
        // following conditions:
        //
        // The above copyright notice and this permission notice shall be included
        // in all copies or substantial portions of the Software.
        //
        // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
        // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
        // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
        // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
        // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
        // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
        // USE OR OTHER DEALINGS IN THE SOFTWARE.

        module.exports = Readable;

        /*<replacement>*/
        var isArray = require('isarray');
        /*</replacement>*/


        /*<replacement>*/
        var Buffer = require('buffer').Buffer;
        /*</replacement>*/

        Readable.ReadableState = ReadableState;

        var EE = require('events').EventEmitter;

        /*<replacement>*/
        if (!EE.listenerCount)
            EE.listenerCount = function(emitter, type) {
                return emitter.listeners(type).length;
            };
        /*</replacement>*/

        var Stream = require('stream');

        /*<replacement>*/
        var util = require('core-util-is');
        util.inherits = require('inherits');
        /*</replacement>*/

        var StringDecoder;


        /*<replacement>*/
        var debug = require('util');
        if (debug && debug.debuglog) {
            debug = debug.debuglog('stream');
        } else {
            debug = function () {};
        }
        /*</replacement>*/


        util.inherits(Readable, Stream);

        function ReadableState(options, stream) {
            var Duplex = require('./_stream_duplex');

            options = options || {};

            // the point at which it stops calling _read() to fill the buffer
            // Note: 0 is a valid value, means "don't call _read preemptively ever"
            var hwm = options.highWaterMark;
            var defaultHwm = options.objectMode ? 16 : 16 * 1024;
            this.highWaterMark = (hwm || hwm === 0) ? hwm : defaultHwm;

            // cast to ints.
            this.highWaterMark = ~~this.highWaterMark;

            this.buffer = [];
            this.length = 0;
            this.pipes = null;
            this.pipesCount = 0;
            this.flowing = null;
            this.ended = false;
            this.endEmitted = false;
            this.reading = false;

            // a flag to be able to tell if the onwrite cb is called immediately,
            // or on a later tick.  We set this to true at first, because any
            // actions that shouldn't happen until "later" should generally also
            // not happen before the first write call.
            this.sync = true;

            // whenever we return null, then we set a flag to say
            // that we're awaiting a 'readable' event emission.
            this.needReadable = false;
            this.emittedReadable = false;
            this.readableListening = false;


            // object stream flag. Used to make read(n) ignore n and to
            // make all the buffer merging and length checks go away
            this.objectMode = !!options.objectMode;

            if (stream instanceof Duplex)
                this.objectMode = this.objectMode || !!options.readableObjectMode;

            // Crypto is kind of old and crusty.  Historically, its default string
            // encoding is 'binary' so we have to make this configurable.
            // Everything else in the universe uses 'utf8', though.
            this.defaultEncoding = options.defaultEncoding || 'utf8';

            // when piping, we only care about 'readable' events that happen
            // after read()ing all the bytes and not getting any pushback.
            this.ranOut = false;

            // the number of writers that are awaiting a drain event in .pipe()s
            this.awaitDrain = 0;

            // if true, a maybeReadMore has been scheduled
            this.readingMore = false;

            this.decoder = null;
            this.encoding = null;
            if (options.encoding) {
                if (!StringDecoder)
                    StringDecoder = require('string_decoder/').StringDecoder;
                this.decoder = new StringDecoder(options.encoding);
                this.encoding = options.encoding;
            }
        }

        function Readable(options) {
            var Duplex = require('./_stream_duplex');

            if (!(this instanceof Readable))
                return new Readable(options);

            this._readableState = new ReadableState(options, this);

            // legacy
            this.readable = true;

            Stream.call(this);
        }

        // Manually shove something into the read() buffer.
        // This returns true if the highWaterMark has not been hit yet,
        // similar to how Writable.write() returns true if you should
        // write() some more.
        Readable.prototype.push = function(chunk, encoding) {
            var state = this._readableState;

            if (util.isString(chunk) && !state.objectMode) {
                encoding = encoding || state.defaultEncoding;
                if (encoding !== state.encoding) {
                    chunk = new Buffer(chunk, encoding);
                    encoding = '';
                }
            }

            return readableAddChunk(this, state, chunk, encoding, false);
        };

        // Unshift should *always* be something directly out of read()
        Readable.prototype.unshift = function(chunk) {
            var state = this._readableState;
            return readableAddChunk(this, state, chunk, '', true);
        };

        function readableAddChunk(stream, state, chunk, encoding, addToFront) {
            var er = chunkInvalid(state, chunk);
            if (er) {
                stream.emit('error', er);
            } else if (util.isNullOrUndefined(chunk)) {
                state.reading = false;
                if (!state.ended)
                    onEofChunk(stream, state);
            } else if (state.objectMode || chunk && chunk.length > 0) {
                if (state.ended && !addToFront) {
                    var e = new Error('stream.push() after EOF');
                    stream.emit('error', e);
                } else if (state.endEmitted && addToFront) {
                    var e = new Error('stream.unshift() after end event');
                    stream.emit('error', e);
                } else {
                    if (state.decoder && !addToFront && !encoding)
                        chunk = state.decoder.write(chunk);

                    if (!addToFront)
                        state.reading = false;

                    // if we want the data now, just emit it.
                    if (state.flowing && state.length === 0 && !state.sync) {
                        stream.emit('data', chunk);
                        stream.read(0);
                    } else {
                        // update the buffer info.
                        state.length += state.objectMode ? 1 : chunk.length;
                        if (addToFront)
                            state.buffer.unshift(chunk);
                        else
                            state.buffer.push(chunk);

                        if (state.needReadable)
                            emitReadable(stream);
                    }

                    maybeReadMore(stream, state);
                }
            } else if (!addToFront) {
                state.reading = false;
            }

            return needMoreData(state);
        }



        // if it's past the high water mark, we can push in some more.
        // Also, if we have no data yet, we can stand some
        // more bytes.  This is to work around cases where hwm=0,
        // such as the repl.  Also, if the push() triggered a
        // readable event, and the user called read(largeNumber) such that
        // needReadable was set, then we ought to push more, so that another
        // 'readable' event will be triggered.
        function needMoreData(state) {
            return !state.ended &&
            (state.needReadable ||
            state.length < state.highWaterMark ||
            state.length === 0);
        }

        // backwards compatibility.
        Readable.prototype.setEncoding = function(enc) {
            if (!StringDecoder)
                StringDecoder = require('string_decoder/').StringDecoder;
            this._readableState.decoder = new StringDecoder(enc);
            this._readableState.encoding = enc;
            return this;
        };

        // Don't raise the hwm > 128MB
        var MAX_HWM = 0x800000;
        function roundUpToNextPowerOf2(n) {
            if (n >= MAX_HWM) {
                n = MAX_HWM;
            } else {
                // Get the next highest power of 2
                n--;
                for (var p = 1; p < 32; p <<= 1)
                    n |= n >> p;
                n++;
            }
            return n;
        }

        function howMuchToRead(n, state) {
            if (state.length === 0 && state.ended)
                return 0;

            if (state.objectMode)
                return n === 0 ? 0 : 1;

            if (isNaN(n) || util.isNull(n)) {
                // only flow one buffer at a time
                if (state.flowing && state.buffer.length)
                    return state.buffer[0].length;
                else
                    return state.length;
            }

            if (n <= 0)
                return 0;

            // If we're asking for more than the target buffer level,
            // then raise the water mark.  Bump up to the next highest
            // power of 2, to prevent increasing it excessively in tiny
            // amounts.
            if (n > state.highWaterMark)
                state.highWaterMark = roundUpToNextPowerOf2(n);

            // don't have that much.  return null, unless we've ended.
            if (n > state.length) {
                if (!state.ended) {
                    state.needReadable = true;
                    return 0;
                } else
                    return state.length;
            }

            return n;
        }

        // you can override either this method, or the async _read(n) below.
        Readable.prototype.read = function(n) {
            debug('read', n);
            var state = this._readableState;
            var nOrig = n;

            if (!util.isNumber(n) || n > 0)
                state.emittedReadable = false;

            // if we're doing read(0) to trigger a readable event, but we
            // already have a bunch of data in the buffer, then just trigger
            // the 'readable' event and move on.
            if (n === 0 &&
            state.needReadable &&
            (state.length >= state.highWaterMark || state.ended)) {
                debug('read: emitReadable', state.length, state.ended);
                if (state.length === 0 && state.ended)
                    endReadable(this);
                else
                    emitReadable(this);
                return null;
            }

            n = howMuchToRead(n, state);

            // if we've ended, and we're now clear, then finish it up.
            if (n === 0 && state.ended) {
                if (state.length === 0)
                    endReadable(this);
                return null;
            }

            // All the actual chunk generation logic needs to be
            // *below* the call to _read.  The reason is that in certain
            // synthetic stream cases, such as passthrough streams, _read
            // may be a completely synchronous operation which may change
            // the state of the read buffer, providing enough data when
            // before there was *not* enough.
            //
            // So, the steps are:
            // 1. Figure out what the state of things will be after we do
            // a read from the buffer.
            //
            // 2. If that resulting state will trigger a _read, then call _read.
            // Note that this may be asynchronous, or synchronous.  Yes, it is
            // deeply ugly to write APIs this way, but that still doesn't mean
            // that the Readable class should behave improperly, as streams are
            // designed to be sync/async agnostic.
            // Take note if the _read call is sync or async (ie, if the read call
            // has returned yet), so that we know whether or not it's safe to emit
            // 'readable' etc.
            //
            // 3. Actually pull the requested chunks out of the buffer and return.

            // if we need a readable event, then we need to do some reading.
            var doRead = state.needReadable;
            debug('need readable', doRead);

            // if we currently have less than the highWaterMark, then also read some
            if (state.length === 0 || state.length - n < state.highWaterMark) {
                doRead = true;
                debug('length less than watermark', doRead);
            }

            // however, if we've ended, then there's no point, and if we're already
            // reading, then it's unnecessary.
            if (state.ended || state.reading) {
                doRead = false;
                debug('reading or ended', doRead);
            }

            if (doRead) {
                debug('do read');
                state.reading = true;
                state.sync = true;
                // if the length is currently zero, then we *need* a readable event.
                if (state.length === 0)
                    state.needReadable = true;
                // call internal read method
                this._read(state.highWaterMark);
                state.sync = false;
            }

            // If _read pushed data synchronously, then `reading` will be false,
            // and we need to re-evaluate how much data we can return to the user.
            if (doRead && !state.reading)
                n = howMuchToRead(nOrig, state);

            var ret;
            if (n > 0)
                ret = fromList(n, state);
            else
                ret = null;

            if (util.isNull(ret)) {
                state.needReadable = true;
                n = 0;
            }

            state.length -= n;

            // If we have nothing in the buffer, then we want to know
            // as soon as we *do* get something into the buffer.
            if (state.length === 0 && !state.ended)
                state.needReadable = true;

            // If we tried to read() past the EOF, then emit end on the next tick.
            if (nOrig !== n && state.ended && state.length === 0)
                endReadable(this);

            if (!util.isNull(ret))
                this.emit('data', ret);

            return ret;
        };

        function chunkInvalid(state, chunk) {
            var er = null;
            if (!util.isBuffer(chunk) &&
            !util.isString(chunk) &&
            !util.isNullOrUndefined(chunk) &&
            !state.objectMode) {
                er = new TypeError('Invalid non-string/buffer chunk');
            }
            return er;
        }


        function onEofChunk(stream, state) {
            if (state.decoder && !state.ended) {
                var chunk = state.decoder.end();
                if (chunk && chunk.length) {
                    state.buffer.push(chunk);
                    state.length += state.objectMode ? 1 : chunk.length;
                }
            }
            state.ended = true;

            // emit 'readable' now to make sure it gets picked up.
            emitReadable(stream);
        }

        // Don't emit readable right away in sync mode, because this can trigger
        // another read() call => stack overflow.  This way, it might trigger
        // a nextTick recursion warning, but that's not so bad.
        function emitReadable(stream) {
            var state = stream._readableState;
            state.needReadable = false;
            if (!state.emittedReadable) {
                debug('emitReadable', state.flowing);
                state.emittedReadable = true;
                if (state.sync)
                    process.nextTick(function() {
                        emitReadable_(stream);
                    });
                else
                    emitReadable_(stream);
            }
        }

        function emitReadable_(stream) {
            debug('emit readable');
            stream.emit('readable');
            flow(stream);
        }


        // at this point, the user has presumably seen the 'readable' event,
        // and called read() to consume some data.  that may have triggered
        // in turn another _read(n) call, in which case reading = true if
        // it's in progress.
        // However, if we're not ended, or reading, and the length < hwm,
        // then go ahead and try to read some more preemptively.
        function maybeReadMore(stream, state) {
            if (!state.readingMore) {
                state.readingMore = true;
                process.nextTick(function() {
                    maybeReadMore_(stream, state);
                });
            }
        }

        function maybeReadMore_(stream, state) {
            var len = state.length;
            while (!state.reading && !state.flowing && !state.ended &&
            state.length < state.highWaterMark) {
                debug('maybeReadMore read 0');
                stream.read(0);
                if (len === state.length)
                // didn't get any data, stop spinning.
                break;
                else
                    len = state.length;
            }
            state.readingMore = false;
        }

        // abstract method.  to be overridden in specific implementation classes.
        // call cb(er, data) where data is <= n in length.
        // for virtual (non-string, non-buffer) streams, "length" is somewhat
        // arbitrary, and perhaps not very meaningful.
        Readable.prototype._read = function(n) {
            this.emit('error', new Error('not implemented'));
        };

        Readable.prototype.pipe = function(dest, pipeOpts) {
            var src = this;
            var state = this._readableState;

            switch (state.pipesCount) {
            case 0:
                state.pipes = dest;
                break;
            case 1:
                state.pipes = [state.pipes, dest];
                break;
            default:
                state.pipes.push(dest);
                break;
            }
            state.pipesCount += 1;
            debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

            var doEnd = (!pipeOpts || pipeOpts.end !== false) &&
            dest !== process.stdout &&
            dest !== process.stderr;

            var endFn = doEnd ? onend : cleanup;
            if (state.endEmitted)
                process.nextTick(endFn);
            else
                src.once('end', endFn);

            dest.on('unpipe', onunpipe);
            function onunpipe(readable) {
                debug('onunpipe');
                if (readable === src) {
                    cleanup();
                }
            }

            function onend() {
                debug('onend');
                dest.end();
            }

            // when the dest drains, it reduces the awaitDrain counter
            // on the source.  This would be more elegant with a .once()
            // handler in flow(), but adding and removing repeatedly is
            // too slow.
            var ondrain = pipeOnDrain(src);
            dest.on('drain', ondrain);

            function cleanup() {
                debug('cleanup');
                // cleanup event handlers once the pipe is broken
                dest.removeListener('close', onclose);
                dest.removeListener('finish', onfinish);
                dest.removeListener('drain', ondrain);
                dest.removeListener('error', onerror);
                dest.removeListener('unpipe', onunpipe);
                src.removeListener('end', onend);
                src.removeListener('end', cleanup);
                src.removeListener('data', ondata);

                // if the reader is waiting for a drain event from this
                // specific writer, then it would cause it to never start
                // flowing again.
                // So, if this is awaiting a drain, then we just call it now.
                // If we don't know, then assume that we are waiting for one.
                if (state.awaitDrain &&
                (!dest._writableState || dest._writableState.needDrain))
                    ondrain();
            }

            src.on('data', ondata);
            function ondata(chunk) {
                debug('ondata');
                var ret = dest.write(chunk);
                if (false === ret) {
                    debug('false write response, pause',
                    src._readableState.awaitDrain);
                    src._readableState.awaitDrain++;
                    src.pause();
                }
            }

            // if the dest has an error, then stop piping into it.
            // however, don't suppress the throwing behavior for this.
            function onerror(er) {
                debug('onerror', er);
                unpipe();
                dest.removeListener('error', onerror);
                if (EE.listenerCount(dest, 'error') === 0)
                    dest.emit('error', er);
            }
            // This is a brutally ugly hack to make sure that our error handler
            // is attached before any userland ones.  NEVER DO THIS.
            if (!dest._events || !dest._events.error)
                dest.on('error', onerror);
            else if (isArray(dest._events.error))
                dest._events.error.unshift(onerror);
            else
                dest._events.error = [onerror, dest._events.error];



            // Both close and finish should trigger unpipe, but only once.
            function onclose() {
                dest.removeListener('finish', onfinish);
                unpipe();
            }
            dest.once('close', onclose);
            function onfinish() {
                debug('onfinish');
                dest.removeListener('close', onclose);
                unpipe();
            }
            dest.once('finish', onfinish);

            function unpipe() {
                debug('unpipe');
                src.unpipe(dest);
            }

            // tell the dest that it's being piped to
            dest.emit('pipe', src);

            // start the flow if it hasn't been started already.
            if (!state.flowing) {
                debug('pipe resume');
                src.resume();
            }

            return dest;
        };

        function pipeOnDrain(src) {
            return function() {
                var state = src._readableState;
                debug('pipeOnDrain', state.awaitDrain);
                if (state.awaitDrain)
                    state.awaitDrain--;
                if (state.awaitDrain === 0 && EE.listenerCount(src, 'data')) {
                    state.flowing = true;
                    flow(src);
                }
            };
        }


        Readable.prototype.unpipe = function(dest) {
            var state = this._readableState;

            // if we're not piping anywhere, then do nothing.
            if (state.pipesCount === 0)
                return this;

            // just one destination.  most common case.
            if (state.pipesCount === 1) {
                // passed in one, but it's not the right one.
                if (dest && dest !== state.pipes)
                    return this;

                if (!dest)
                    dest = state.pipes;

                // got a match.
                state.pipes = null;
                state.pipesCount = 0;
                state.flowing = false;
                if (dest)
                    dest.emit('unpipe', this);
                return this;
            }

            // slow case. multiple pipe destinations.

            if (!dest) {
                // remove all.
                var dests = state.pipes;
                var len = state.pipesCount;
                state.pipes = null;
                state.pipesCount = 0;
                state.flowing = false;

                for (var i = 0; i < len; i++)
                    dests[i].emit('unpipe', this);
                return this;
            }

            // try to find the right one.
            var i = indexOf(state.pipes, dest);
            if (i === - 1)
                return this;

            state.pipes.splice(i, 1);
            state.pipesCount -= 1;
            if (state.pipesCount === 1)
                state.pipes = state.pipes[0];

            dest.emit('unpipe', this);

            return this;
        };

        // set up data events if they are asked for
        // Ensure readable listeners eventually get something
        Readable.prototype.on = function(ev, fn) {
            var res = Stream.prototype.on.call(this, ev, fn);

            // If listening to data, and it has not explicitly been paused,
            // then call resume to start the flow of data on the next tick.
            if (ev === 'data' && false !== this._readableState.flowing) {
                this.resume();
            }

            if (ev === 'readable' && this.readable) {
                var state = this._readableState;
                if (!state.readableListening) {
                    state.readableListening = true;
                    state.emittedReadable = false;
                    state.needReadable = true;
                    if (!state.reading) {
                        var self = this;
                        process.nextTick(function() {
                            debug('readable nexttick read 0');
                            self.read(0);
                        });
                    } else if (state.length) {
                        emitReadable(this, state);
                    }
                }
            }

            return res;
        };
        Readable.prototype.addListener = Readable.prototype.on;

        // pause() and resume() are remnants of the legacy readable stream API
        // If the user uses them, then switch into old mode.
        Readable.prototype.resume = function() {
            var state = this._readableState;
            if (!state.flowing) {
                debug('resume');
                state.flowing = true;
                if (!state.reading) {
                    debug('resume read 0');
                    this.read(0);
                }
                resume(this, state);
            }
            return this;
        };

        function resume(stream, state) {
            if (!state.resumeScheduled) {
                state.resumeScheduled = true;
                process.nextTick(function() {
                    resume_(stream, state);
                });
            }
        }

        function resume_(stream, state) {
            state.resumeScheduled = false;
            stream.emit('resume');
            flow(stream);
            if (state.flowing && !state.reading)
                stream.read(0);
        }

        Readable.prototype.pause = function() {
            debug('call pause flowing=%j', this._readableState.flowing);
            if (false !== this._readableState.flowing) {
                debug('pause');
                this._readableState.flowing = false;
                this.emit('pause');
            }
            return this;
        };

        function flow(stream) {
            var state = stream._readableState;
            debug('flow', state.flowing);
            if (state.flowing) {
                do {
                    var chunk = stream.read();
                }
                while (null !== chunk && state.flowing);
            }
        }

        // wrap an old-style stream as the async data source.
        // This is *not* part of the readable stream interface.
        // It is an ugly unfortunate mess of history.
        Readable.prototype.wrap = function(stream) {
            var state = this._readableState;
            var paused = false;

            var self = this;
            stream.on('end', function() {
                debug('wrapped end');
                if (state.decoder && !state.ended) {
                    var chunk = state.decoder.end();
                    if (chunk && chunk.length)
                        self.push(chunk);
                }

                self.push(null);
            });

            stream.on('data', function(chunk) {
                debug('wrapped data');
                if (state.decoder)
                    chunk = state.decoder.write(chunk);
                if (!chunk || !state.objectMode && !chunk.length)
                    return;

                var ret = self.push(chunk);
                if (!ret) {
                    paused = true;
                    stream.pause();
                }
            });

            // proxy all the other methods.
            // important when wrapping filters and duplexes.
            for (var i in stream) {
                if (util.isFunction(stream[i]) && util.isUndefined(this[i])) {
                    this[i] = function(method) {
                        return function() {
                            return stream[method].apply(stream, arguments);
                        }
                    }(i);
                }
            }

            // proxy certain important events.
            var events = ['error', 'close', 'destroy', 'pause', 'resume'];
            forEach(events, function(ev) {
                stream.on(ev, self.emit.bind(self, ev));
            });

            // when we try to consume some more bytes, simply unpause the
            // underlying stream.
            self._read = function(n) {
                debug('wrapped _read', n);
                if (paused) {
                    paused = false;
                    stream.resume();
                }
            };

            return self;
        };



        // exposed for testing purposes only.
        Readable._fromList = fromList;

        // Pluck off n bytes from an array of buffers.
        // Length is the combined lengths of all the buffers in the list.
        function fromList(n, state) {
            var list = state.buffer;
            var length = state.length;
            var stringMode = !!state.decoder;
            var objectMode = !!state.objectMode;
            var ret;

            // nothing in the list, definitely empty.
            if (list.length === 0)
                return null;

            if (length === 0)
                ret = null;
            else if (objectMode)
                ret = list.shift();
            else if (!n || n >= length) {
                // read it all, truncate the array.
                if (stringMode)
                    ret = list.join('');
                else
                    ret = Buffer.concat(list, length);
                list.length = 0;
            } else {
                // read just some of it.
                if (n < list[0].length) {
                    // just take a part of the first list item.
                    // slice is the same for buffers and strings.
                    var buf = list[0];
                    ret = buf.slice(0, n);
                    list[0] = buf.slice(n);
                } else if (n === list[0].length) {
                    // first list is a perfect match
                    ret = list.shift();
                } else {
                    // complex case.
                    // we have enough to cover it, but it spans past the first buffer.
                    if (stringMode)
                        ret = '';
                    else
                        ret = new Buffer(n);

                    var c = 0;
                    for (var i = 0, l = list.length; i < l && c < n; i++) {
                        var buf = list[0];
                        var cpy = Math.min(n - c, buf.length);

                        if (stringMode)
                            ret += buf.slice(0, cpy);
                        else
                            buf.copy(ret, c, 0, cpy);

                        if (cpy < buf.length)
                            list[0] = buf.slice(cpy);
                        else
                            list.shift();

                        c += cpy;
                    }
                }
            }

            return ret;
        }

        function endReadable(stream) {
            var state = stream._readableState;

            // If we get here before consuming all the bytes, then that is a
            // bug in node.  Should never happen.
            if (state.length > 0)
                throw new Error('endReadable called on non-empty stream');

            if (!state.endEmitted) {
                state.ended = true;
                process.nextTick(function() {
                    // Check that we didn't get one last unshift.
                    if (!state.endEmitted && state.length === 0) {
                        state.endEmitted = true;
                        stream.readable = false;
                        stream.emit('end');
                    }
                });
            }
        }

        function forEach (xs, f) {
            for (var i = 0, l = xs.length; i < l; i++) {
                f(xs[i], i);
            }
        }

        function indexOf (xs, x) {
            for (var i = 0, l = xs.length; i < l; i++) {
                if (xs[i] === x)
                    return i;
            }
            return - 1;
        }

    }).call(this, require('_process'))
}, {
    "./_stream_duplex": 23,
    "_process": 17,
    "buffer": 5,
    "core-util-is": 28,
    "events": 9,
    "inherits": 14,
    "isarray": 16,
    "stream": 33,
    "string_decoder/": 34,
    "util": 4
}
],
26: [function(require, module, exports) {
    // Copyright Joyent, Inc. and other Node contributors.
    //
    // Permission is hereby granted, free of charge, to any person obtaining a
    // copy of this software and associated documentation files (the
    // "Software"), to deal in the Software without restriction, including
    // without limitation the rights to use, copy, modify, merge, publish,
    // distribute, sublicense, and/or sell copies of the Software, and to permit
    // persons to whom the Software is furnished to do so, subject to the
    // following conditions:
    //
    // The above copyright notice and this permission notice shall be included
    // in all copies or substantial portions of the Software.
    //
    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
    // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
    // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
    // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
    // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
    // USE OR OTHER DEALINGS IN THE SOFTWARE.


    // a transform stream is a readable/writable stream where you do
    // something with the data.  Sometimes it's called a "filter",
    // but that's not a great name for it, since that implies a thing where
    // some bits pass through, and others are simply ignored.  (That would
    // be a valid example of a transform, of course.)
    //
    // While the output is causally related to the input, it's not a
    // necessarily symmetric or synchronous transformation.  For example,
    // a zlib stream might take multiple plain-text writes(), and then
    // emit a single compressed chunk some time in the future.
    //
    // Here's how this works:
    //
    // The Transform stream has all the aspects of the readable and writable
    // stream classes.  When you write(chunk), that calls _write(chunk,cb)
    // internally, and returns false if there's a lot of pending writes
    // buffered up.  When you call read(), that calls _read(n) until
    // there's enough pending readable data buffered up.
    //
    // In a transform stream, the written data is placed in a buffer.  When
    // _read(n) is called, it transforms the queued up data, calling the
    // buffered _write cb's as it consumes chunks.  If consuming a single
    // written chunk would result in multiple output chunks, then the first
    // outputted bit calls the readcb, and subsequent chunks just go into
    // the read buffer, and will cause it to emit 'readable' if necessary.
    //
    // This way, back-pressure is actually determined by the reading side,
    // since _read has to be called to start processing a new chunk.  However,
    // a pathological inflate type of transform can cause excessive buffering
    // here.  For example, imagine a stream where every byte of input is
    // interpreted as an integer from 0-255, and then results in that many
    // bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
    // 1kb of data being output.  In this case, you could write a very small
    // amount of input, and end up with a very large amount of output.  In
    // such a pathological inflating mechanism, there'd be no way to tell
    // the system to stop doing the transform.  A single 4MB write could
    // cause the system to run out of memory.
    //
    // However, even in such a pathological case, only a single written chunk
    // would be consumed, and then the rest would wait (un-transformed) until
    // the results of the previous transformed chunk were consumed.

    module.exports = Transform;

    var Duplex = require('./_stream_duplex');

    /*<replacement>*/
    var util = require('core-util-is');
    util.inherits = require('inherits');
    /*</replacement>*/

    util.inherits(Transform, Duplex);


    function TransformState(options, stream) {
        this.afterTransform = function(er, data) {
            return afterTransform(stream, er, data);
        };

        this.needTransform = false;
        this.transforming = false;
        this.writecb = null;
        this.writechunk = null;
    }

    function afterTransform(stream, er, data) {
        var ts = stream._transformState;
        ts.transforming = false;

        var cb = ts.writecb;

        if (!cb)
            return stream.emit('error', new Error('no writecb in Transform class'));

        ts.writechunk = null;
        ts.writecb = null;

        if (!util.isNullOrUndefined(data))
            stream.push(data);

        if (cb)
            cb(er);

        var rs = stream._readableState;
        rs.reading = false;
        if (rs.needReadable || rs.length < rs.highWaterMark) {
            stream._read(rs.highWaterMark);
        }
    }


    function Transform(options) {
        if (!(this instanceof Transform))
            return new Transform(options);

        Duplex.call(this, options);

        this._transformState = new TransformState(options, this);

        // when the writable side finishes, then flush out anything remaining.
        var stream = this;

        // start out asking for a readable event once data is transformed.
        this._readableState.needReadable = true;

        // we have implemented the _read method, and done the other things
        // that Readable wants before the first _read call, so unset the
        // sync guard flag.
        this._readableState.sync = false;

        this.once('prefinish', function() {
            if (util.isFunction(this._flush))
                this._flush(function(er) {
                    done(stream, er);
                });
            else
                done(stream);
        });
    }

    Transform.prototype.push = function(chunk, encoding) {
        this._transformState.needTransform = false;
        return Duplex.prototype.push.call(this, chunk, encoding);
    };

    // This is the part where you do stuff!
    // override this function in implementation classes.
    // 'chunk' is an input chunk.
    //
    // Call `push(newChunk)` to pass along transformed output
    // to the readable side.  You may call 'push' zero or more times.
    //
    // Call `cb(err)` when you are done with this chunk.  If you pass
    // an error, then that'll put the hurt on the whole operation.  If you
    // never call cb(), then you'll never get another chunk.
    Transform.prototype._transform = function(chunk, encoding, cb) {
        throw new Error('not implemented');
    };

    Transform.prototype._write = function(chunk, encoding, cb) {
        var ts = this._transformState;
        ts.writecb = cb;
        ts.writechunk = chunk;
        ts.writeencoding = encoding;
        if (!ts.transforming) {
            var rs = this._readableState;
            if (ts.needTransform ||
            rs.needReadable ||
            rs.length < rs.highWaterMark)
                this._read(rs.highWaterMark);
        }
    };

    // Doesn't matter what the args are here.
    // _transform does all the work.
    // That we got here means that the readable side wants more data.
    Transform.prototype._read = function(n) {
        var ts = this._transformState;

        if (!util.isNull(ts.writechunk) && ts.writecb && !ts.transforming) {
            ts.transforming = true;
            this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
        } else {
            // mark that we need a transform, so that any data that comes in
            // will get processed, now that we've asked for it.
            ts.needTransform = true;
        }
    };


    function done(stream, er) {
        if (er)
            return stream.emit('error', er);

        // if there's nothing in the write buffer, then that means
        // that nothing more will ever be provided
        var ws = stream._writableState;
        var ts = stream._transformState;

        if (ws.length)
            throw new Error('calling transform done when ws.length != 0');

        if (ts.transforming)
            throw new Error('calling transform done when still transforming');

        return stream.push(null);
    }

}, {
    "./_stream_duplex": 23,
    "core-util-is": 28,
    "inherits": 14
}
],
27: [function(require, module, exports) {
    (function (process) {
        // Copyright Joyent, Inc. and other Node contributors.
        //
        // Permission is hereby granted, free of charge, to any person obtaining a
        // copy of this software and associated documentation files (the
        // "Software"), to deal in the Software without restriction, including
        // without limitation the rights to use, copy, modify, merge, publish,
        // distribute, sublicense, and/or sell copies of the Software, and to permit
        // persons to whom the Software is furnished to do so, subject to the
        // following conditions:
        //
        // The above copyright notice and this permission notice shall be included
        // in all copies or substantial portions of the Software.
        //
        // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
        // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
        // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
        // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
        // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
        // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
        // USE OR OTHER DEALINGS IN THE SOFTWARE.

        // A bit simpler than readable streams.
        // Implement an async ._write(chunk, cb), and it'll handle all
        // the drain event emission and buffering.

        module.exports = Writable;

        /*<replacement>*/
        var Buffer = require('buffer').Buffer;
        /*</replacement>*/

        Writable.WritableState = WritableState;


        /*<replacement>*/
        var util = require('core-util-is');
        util.inherits = require('inherits');
        /*</replacement>*/

        var Stream = require('stream');

        util.inherits(Writable, Stream);

        function WriteReq(chunk, encoding, cb) {
            this.chunk = chunk;
            this.encoding = encoding;
            this.callback = cb;
        }

        function WritableState(options, stream) {
            var Duplex = require('./_stream_duplex');

            options = options || {};

            // the point at which write() starts returning false
            // Note: 0 is a valid value, means that we always return false if
            // the entire buffer is not flushed immediately on write()
            var hwm = options.highWaterMark;
            var defaultHwm = options.objectMode ? 16 : 16 * 1024;
            this.highWaterMark = (hwm || hwm === 0) ? hwm : defaultHwm;

            // object stream flag to indicate whether or not this stream
            // contains buffers or objects.
            this.objectMode = !!options.objectMode;

            if (stream instanceof Duplex)
                this.objectMode = this.objectMode || !!options.writableObjectMode;

            // cast to ints.
            this.highWaterMark = ~~this.highWaterMark;

            this.needDrain = false;
            // at the start of calling end()
            this.ending = false;
            // when end() has been called, and returned
            this.ended = false;
            // when 'finish' is emitted
            this.finished = false;

            // should we decode strings into buffers before passing to _write?
            // this is here so that some node-core streams can optimize string
            // handling at a lower level.
            var noDecode = options.decodeStrings === false;
            this.decodeStrings = !noDecode;

            // Crypto is kind of old and crusty.  Historically, its default string
            // encoding is 'binary' so we have to make this configurable.
            // Everything else in the universe uses 'utf8', though.
            this.defaultEncoding = options.defaultEncoding || 'utf8';

            // not an actual buffer we keep track of, but a measurement
            // of how much we're waiting to get pushed to some underlying
            // socket or file.
            this.length = 0;

            // a flag to see when we're in the middle of a write.
            this.writing = false;

            // when true all writes will be buffered until .uncork() call
            this.corked = 0;

            // a flag to be able to tell if the onwrite cb is called immediately,
            // or on a later tick.  We set this to true at first, because any
            // actions that shouldn't happen until "later" should generally also
            // not happen before the first write call.
            this.sync = true;

            // a flag to know if we're processing previously buffered items, which
            // may call the _write() callback in the same tick, so that we don't
            // end up in an overlapped onwrite situation.
            this.bufferProcessing = false;

            // the callback that's passed to _write(chunk,cb)
            this.onwrite = function(er) {
                onwrite(stream, er);
            };

            // the callback that the user supplies to write(chunk,encoding,cb)
            this.writecb = null;

            // the amount that is being written when _write is called.
            this.writelen = 0;

            this.buffer = [];

            // number of pending user-supplied write callbacks
            // this must be 0 before 'finish' can be emitted
            this.pendingcb = 0;

            // emit prefinish if the only thing we're waiting for is _write cbs
            // This is relevant for synchronous Transform streams
            this.prefinished = false;

            // True if the error was already emitted and should not be thrown again
            this.errorEmitted = false;
        }

        function Writable(options) {
            var Duplex = require('./_stream_duplex');

            // Writable ctor is applied to Duplexes, though they're not
            // instanceof Writable, they're instanceof Readable.
            if (!(this instanceof Writable) && !(this instanceof Duplex))
                return new Writable(options);

            this._writableState = new WritableState(options, this);

            // legacy.
            this.writable = true;

            Stream.call(this);
        }

        // Otherwise people can pipe Writable streams, which is just wrong.
        Writable.prototype.pipe = function() {
            this.emit('error', new Error('Cannot pipe. Not readable.'));
        };


        function writeAfterEnd(stream, state, cb) {
            var er = new Error('write after end');
            // TODO: defer error events consistently everywhere, not just the cb
            stream.emit('error', er);
            process.nextTick(function() {
                cb(er);
            });
        }

        // If we get something that is not a buffer, string, null, or undefined,
        // and we're not in objectMode, then that's an error.
        // Otherwise stream chunks are all considered to be of length=1, and the
        // watermarks determine how many objects to keep in the buffer, rather than
        // how many bytes or characters.
        function validChunk(stream, state, chunk, cb) {
            var valid = true;
            if (!util.isBuffer(chunk) &&
            !util.isString(chunk) &&
            !util.isNullOrUndefined(chunk) &&
            !state.objectMode) {
                var er = new TypeError('Invalid non-string/buffer chunk');
                stream.emit('error', er);
                process.nextTick(function() {
                    cb(er);
                });
                valid = false;
            }
            return valid;
        }

        Writable.prototype.write = function(chunk, encoding, cb) {
            var state = this._writableState;
            var ret = false;

            if (util.isFunction(encoding)) {
                cb = encoding;
                encoding = null;
            }

            if (util.isBuffer(chunk))
                encoding = 'buffer';
            else if (!encoding)
                encoding = state.defaultEncoding;

            if (!util.isFunction(cb))
                cb = function() {};

            if (state.ended)
                writeAfterEnd(this, state, cb);
            else if (validChunk(this, state, chunk, cb)) {
                state.pendingcb++;
                ret = writeOrBuffer(this, state, chunk, encoding, cb);
            }

            return ret;
        };

        Writable.prototype.cork = function() {
            var state = this._writableState;

            state.corked++;
        };

        Writable.prototype.uncork = function() {
            var state = this._writableState;

            if (state.corked) {
                state.corked--;

                if (!state.writing &&
                !state.corked &&
                !state.finished &&
                !state.bufferProcessing &&
                state.buffer.length)
                    clearBuffer(this, state);
            }
        };

        function decodeChunk(state, chunk, encoding) {
            if (!state.objectMode &&
            state.decodeStrings !== false &&
            util.isString(chunk)) {
                chunk = new Buffer(chunk, encoding);
            }
            return chunk;
        }

        // if we're already writing something, then just put this
        // in the queue, and wait our turn.  Otherwise, call _write
        // If we return false, then we need a drain event, so set that flag.
        function writeOrBuffer(stream, state, chunk, encoding, cb) {
            chunk = decodeChunk(state, chunk, encoding);
            if (util.isBuffer(chunk))
                encoding = 'buffer';
            var len = state.objectMode ? 1 : chunk.length;

            state.length += len;

            var ret = state.length < state.highWaterMark;
            // we must ensure that previous needDrain will not be reset to false.
            if (!ret)
                state.needDrain = true;

            if (state.writing || state.corked)
                state.buffer.push(new WriteReq(chunk, encoding, cb));
            else
                doWrite(stream, state, false, len, chunk, encoding, cb);

            return ret;
        }

        function doWrite(stream, state, writev, len, chunk, encoding, cb) {
            state.writelen = len;
            state.writecb = cb;
            state.writing = true;
            state.sync = true;
            if (writev)
                stream._writev(chunk, state.onwrite);
            else
                stream._write(chunk, encoding, state.onwrite);
            state.sync = false;
        }

        function onwriteError(stream, state, sync, er, cb) {
            if (sync)
                process.nextTick(function() {
                    state.pendingcb--;
                    cb(er);
                });
            else {
                state.pendingcb--;
                cb(er);
            }

            stream._writableState.errorEmitted = true;
            stream.emit('error', er);
        }

        function onwriteStateUpdate(state) {
            state.writing = false;
            state.writecb = null;
            state.length -= state.writelen;
            state.writelen = 0;
        }

        function onwrite(stream, er) {
            var state = stream._writableState;
            var sync = state.sync;
            var cb = state.writecb;

            onwriteStateUpdate(state);

            if (er)
                onwriteError(stream, state, sync, er, cb);
            else {
                // Check if we're actually ready to finish, but don't emit yet
                var finished = needFinish(stream, state);

                if (!finished &&
                !state.corked &&
                !state.bufferProcessing &&
                state.buffer.length) {
                    clearBuffer(stream, state);
                }

                if (sync) {
                    process.nextTick(function() {
                        afterWrite(stream, state, finished, cb);
                    });
                } else {
                    afterWrite(stream, state, finished, cb);
                }
            }
        }

        function afterWrite(stream, state, finished, cb) {
            if (!finished)
                onwriteDrain(stream, state);
            state.pendingcb--;
            cb();
            finishMaybe(stream, state);
        }

        // Must force callback to be called on nextTick, so that we don't
        // emit 'drain' before the write() consumer gets the 'false' return
        // value, and has a chance to attach a 'drain' listener.
        function onwriteDrain(stream, state) {
            if (state.length === 0 && state.needDrain) {
                state.needDrain = false;
                stream.emit('drain');
            }
        }


        // if there's something in the buffer waiting, then process it
        function clearBuffer(stream, state) {
            state.bufferProcessing = true;

            if (stream._writev && state.buffer.length > 1) {
                // Fast case, write everything using _writev()
                var cbs = [];
                for (var c = 0; c < state.buffer.length; c++)
                    cbs.push(state.buffer[c].callback);

                // count the one we are adding, as well.
                // TODO(isaacs) clean this up
                state.pendingcb++;
                doWrite(stream, state, true, state.length, state.buffer, '', function(err) {
                    for (var i = 0; i < cbs.length; i++) {
                        state.pendingcb--;
                        cbs[i](err);
                    }
                });

                // Clear buffer
                state.buffer = [];
            } else {
                // Slow case, write chunks one-by-one
                for (var c = 0; c < state.buffer.length; c++) {
                    var entry = state.buffer[c];
                    var chunk = entry.chunk;
                    var encoding = entry.encoding;
                    var cb = entry.callback;
                    var len = state.objectMode ? 1 : chunk.length;

                    doWrite(stream, state, false, len, chunk, encoding, cb);

                    // if we didn't call the onwrite immediately, then
                    // it means that we need to wait until it does.
                    // also, that means that the chunk and cb are currently
                    // being processed, so move the buffer counter past them.
                    if (state.writing) {
                        c++;
                        break;
                    }
                }

                if (c < state.buffer.length)
                    state.buffer = state.buffer.slice(c);
                else
                    state.buffer.length = 0;
            }

            state.bufferProcessing = false;
        }

        Writable.prototype._write = function(chunk, encoding, cb) {
            cb(new Error('not implemented'));

        };

        Writable.prototype._writev = null;

        Writable.prototype.end = function(chunk, encoding, cb) {
            var state = this._writableState;

            if (util.isFunction(chunk)) {
                cb = chunk;
                chunk = null;
                encoding = null;
            } else if (util.isFunction(encoding)) {
                cb = encoding;
                encoding = null;
            }

            if (!util.isNullOrUndefined(chunk))
                this.write(chunk, encoding);

            // .end() fully uncorks
            if (state.corked) {
                state.corked = 1;
                this.uncork();
            }

            // ignore unnecessary end() calls.
            if (!state.ending && !state.finished)
                endWritable(this, state, cb);
        };


        function needFinish(stream, state) {
            return (state.ending &&
            state.length === 0 &&
            !state.finished &&
            !state.writing);
        }

        function prefinish(stream, state) {
            if (!state.prefinished) {
                state.prefinished = true;
                stream.emit('prefinish');
            }
        }

        function finishMaybe(stream, state) {
            var need = needFinish(stream, state);
            if (need) {
                if (state.pendingcb === 0) {
                    prefinish(stream, state);
                    state.finished = true;
                    stream.emit('finish');
                } else
                    prefinish(stream, state);
            }
            return need;
        }

        function endWritable(stream, state, cb) {
            state.ending = true;
            finishMaybe(stream, state);
            if (cb) {
                if (state.finished)
                    process.nextTick(cb);
                else
                    stream.once('finish', cb);
            }
            state.ended = true;
        }

    }).call(this, require('_process'))
}, {
    "./_stream_duplex": 23,
    "_process": 17,
    "buffer": 5,
    "core-util-is": 28,
    "inherits": 14,
    "stream": 33
}
],
28: [function(require, module, exports) {
    (function (Buffer) {
        // Copyright Joyent, Inc. and other Node contributors.
        //
        // Permission is hereby granted, free of charge, to any person obtaining a
        // copy of this software and associated documentation files (the
        // "Software"), to deal in the Software without restriction, including
        // without limitation the rights to use, copy, modify, merge, publish,
        // distribute, sublicense, and/or sell copies of the Software, and to permit
        // persons to whom the Software is furnished to do so, subject to the
        // following conditions:
        //
        // The above copyright notice and this permission notice shall be included
        // in all copies or substantial portions of the Software.
        //
        // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
        // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
        // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
        // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
        // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
        // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
        // USE OR OTHER DEALINGS IN THE SOFTWARE.

        // NOTE: These type checking functions intentionally don't use `instanceof`
        // because it is fragile and can be easily faked with `Object.create()`.
        function isArray(ar) {
            return Array.isArray(ar);
        }
        exports.isArray = isArray;

        function isBoolean(arg) {
            return typeof arg === 'boolean';
        }
        exports.isBoolean = isBoolean;

        function isNull(arg) {
            return arg === null;
        }
        exports.isNull = isNull;

        function isNullOrUndefined(arg) {
            return arg == null;
        }
        exports.isNullOrUndefined = isNullOrUndefined;

        function isNumber(arg) {
            return typeof arg === 'number';
        }
        exports.isNumber = isNumber;

        function isString(arg) {
            return typeof arg === 'string';
        }
        exports.isString = isString;

        function isSymbol(arg) {
            return typeof arg === 'symbol';
        }
        exports.isSymbol = isSymbol;

        function isUndefined(arg) {
            return arg === void 0;
        }
        exports.isUndefined = isUndefined;

        function isRegExp(re) {
            return isObject(re) && objectToString(re) === '[object RegExp]';
        }
        exports.isRegExp = isRegExp;

        function isObject(arg) {
            return typeof arg === 'object' && arg !== null;
        }
        exports.isObject = isObject;

        function isDate(d) {
            return isObject(d) && objectToString(d) === '[object Date]';
        }
        exports.isDate = isDate;

        function isError(e) {
            return isObject(e) &&
            (objectToString(e) === '[object Error]' || e instanceof Error);
        }
        exports.isError = isError;

        function isFunction(arg) {
            return typeof arg === 'function';
        }
        exports.isFunction = isFunction;

        function isPrimitive(arg) {
            return arg === null ||
            typeof arg === 'boolean' ||
            typeof arg === 'number' ||
            typeof arg === 'string' ||
            typeof arg === 'symbol' || // ES6 symbol
            typeof arg === 'undefined';
        }
        exports.isPrimitive = isPrimitive;

        function isBuffer(arg) {
            return Buffer.isBuffer(arg);
        }
        exports.isBuffer = isBuffer;

        function objectToString(o) {
            return Object.prototype.toString.call(o);
        }
    }).call(this, {
        "isBuffer": require("/Users/sheffernan/Code/videojs.com/node_modules/grunt-browserify/node_modules/browserify/node_modules/insert-module-globals/node_modules/is-buffer/index.js")
    })
}, {
    "/Users/sheffernan/Code/videojs.com/node_modules/grunt-browserify/node_modules/browserify/node_modules/insert-module-globals/node_modules/is-buffer/index.js": 15
}
],
29: [function(require, module, exports) {
    module.exports = require("./lib/_stream_passthrough.js")
}, {
    "./lib/_stream_passthrough.js": 24
}
],
30: [function(require, module, exports) {
    exports = module.exports = require('./lib/_stream_readable.js');
    exports.Stream = require('stream');
    exports.Readable = exports;
    exports.Writable = require('./lib/_stream_writable.js');
    exports.Duplex = require('./lib/_stream_duplex.js');
    exports.Transform = require('./lib/_stream_transform.js');
    exports.PassThrough = require('./lib/_stream_passthrough.js');

}, {
    "./lib/_stream_duplex.js": 23,
    "./lib/_stream_passthrough.js": 24,
    "./lib/_stream_readable.js": 25,
    "./lib/_stream_transform.js": 26,
    "./lib/_stream_writable.js": 27,
    "stream": 33
}
],
31: [function(require, module, exports) {
    module.exports = require("./lib/_stream_transform.js")
}, {
    "./lib/_stream_transform.js": 26
}
],
32: [function(require, module, exports) {
    module.exports = require("./lib/_stream_writable.js")
}, {
    "./lib/_stream_writable.js": 27
}
],
33: [function(require, module, exports) {
    // Copyright Joyent, Inc. and other Node contributors.
    //
    // Permission is hereby granted, free of charge, to any person obtaining a
    // copy of this software and associated documentation files (the
    // "Software"), to deal in the Software without restriction, including
    // without limitation the rights to use, copy, modify, merge, publish,
    // distribute, sublicense, and/or sell copies of the Software, and to permit
    // persons to whom the Software is furnished to do so, subject to the
    // following conditions:
    //
    // The above copyright notice and this permission notice shall be included
    // in all copies or substantial portions of the Software.
    //
    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
    // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
    // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
    // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
    // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
    // USE OR OTHER DEALINGS IN THE SOFTWARE.

    module.exports = Stream;

    var EE = require('events').EventEmitter;
    var inherits = require('inherits');

    inherits(Stream, EE);
    Stream.Readable = require('readable-stream/readable.js');
    Stream.Writable = require('readable-stream/writable.js');
    Stream.Duplex = require('readable-stream/duplex.js');
    Stream.Transform = require('readable-stream/transform.js');
    Stream.PassThrough = require('readable-stream/passthrough.js');

    // Backwards-compat with node 0.4.x
    Stream.Stream = Stream;



    // old-style streams.  Note that the pipe method (the only relevant
    // part of this class) is overridden in the Readable class.

    function Stream() {
        EE.call(this);
    }

    Stream.prototype.pipe = function(dest, options) {
        var source = this;

        function ondata(chunk) {
            if (dest.writable) {
                if (false === dest.write(chunk) && source.pause) {
                    source.pause();
                }
            }
        }

        source.on('data', ondata);

        function ondrain() {
            if (source.readable && source.resume) {
                source.resume();
            }
        }

        dest.on('drain', ondrain);

        // If the 'end' option is not supplied, dest.end() will be called when
        // source gets the 'end' or 'close' events.  Only dest.end() once.
        if (!dest._isStdio && (!options || options.end !== false)) {
            source.on('end', onend);
            source.on('close', onclose);
        }

        var didOnEnd = false;
        function onend() {
            if (didOnEnd)
                return;
            didOnEnd = true;

            dest.end();
        }


        function onclose() {
            if (didOnEnd)
                return;
            didOnEnd = true;

            if (typeof dest.destroy === 'function')
                dest.destroy();
        }

        // don't leave dangling pipes when there are errors.
        function onerror(er) {
            cleanup();
            if (EE.listenerCount(this, 'error') === 0) {
                throw er; // Unhandled stream error in pipe.
            }
        }

        source.on('error', onerror);
        dest.on('error', onerror);

        // remove all the event listeners that were added.
        function cleanup() {
            source.removeListener('data', ondata);
            dest.removeListener('drain', ondrain);

            source.removeListener('end', onend);
            source.removeListener('close', onclose);

            source.removeListener('error', onerror);
            dest.removeListener('error', onerror);

            source.removeListener('end', cleanup);
            source.removeListener('close', cleanup);

            dest.removeListener('close', cleanup);
        }

        source.on('end', cleanup);
        source.on('close', cleanup);

        dest.on('close', cleanup);

        dest.emit('pipe', source);

        // Allow for unix-like usage: A.pipe(B).pipe(C)
        return dest;
    };

}, {
    "events": 9,
    "inherits": 14,
    "readable-stream/duplex.js": 22,
    "readable-stream/passthrough.js": 29,
    "readable-stream/readable.js": 30,
    "readable-stream/transform.js": 31,
    "readable-stream/writable.js": 32
}
],
34: [function(require, module, exports) {
    // Copyright Joyent, Inc. and other Node contributors.
    //
    // Permission is hereby granted, free of charge, to any person obtaining a
    // copy of this software and associated documentation files (the
    // "Software"), to deal in the Software without restriction, including
    // without limitation the rights to use, copy, modify, merge, publish,
    // distribute, sublicense, and/or sell copies of the Software, and to permit
    // persons to whom the Software is furnished to do so, subject to the
    // following conditions:
    //
    // The above copyright notice and this permission notice shall be included
    // in all copies or substantial portions of the Software.
    //
    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
    // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
    // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
    // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
    // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
    // USE OR OTHER DEALINGS IN THE SOFTWARE.

    var Buffer = require('buffer').Buffer;

    var isBufferEncoding = Buffer.isEncoding
    || function(encoding) {
        switch (encoding && encoding.toLowerCase()) {
        case 'hex':
        case 'utf8':
        case 'utf-8':
        case 'ascii':
        case 'binary':
        case 'base64':
        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
        case 'raw':
            return true;
        default:
            return false;
        }
    }


    function assertEncoding(encoding) {
        if (encoding && !isBufferEncoding(encoding)) {
            throw new Error('Unknown encoding: ' + encoding);
        }
    }

    // StringDecoder provides an interface for efficiently splitting a series of
    // buffers into a series of JS strings without breaking apart multi-byte
    // characters. CESU-8 is handled as part of the UTF-8 encoding.
    //
    // @TODO Handling all encodings inside a single object makes it very difficult
    // to reason about this code, so it should be split up in the future.
    // @TODO There should be a utf8-strict encoding that rejects invalid UTF-8 code
    // points as used by CESU-8.
    var StringDecoder = exports.StringDecoder = function(encoding) {
        this.encoding = (encoding || 'utf8').toLowerCase().replace(/[-_]/, '');
        assertEncoding(encoding);
        switch (this.encoding) {
        case 'utf8':
            // CESU-8 represents each of Surrogate Pair by 3-bytes
            this.surrogateSize = 3;
            break;
        case 'ucs2':
        case 'utf16le':
            // UTF-16 represents each of Surrogate Pair by 2-bytes
            this.surrogateSize = 2;
            this.detectIncompleteChar = utf16DetectIncompleteChar;
            break;
        case 'base64':
            // Base-64 stores 3 bytes in 4 chars, and pads the remainder.
            this.surrogateSize = 3;
            this.detectIncompleteChar = base64DetectIncompleteChar;
            break;
        default:
            this.write = passThroughWrite;
            return;
        }

        // Enough space to store all bytes of a single character. UTF-8 needs 4
        // bytes, but CESU-8 may require up to 6 (3 bytes per surrogate).
        this.charBuffer = new Buffer(6);
        // Number of bytes received for the current incomplete multi-byte character.
        this.charReceived = 0;
        // Number of bytes expected for the current incomplete multi-byte character.
        this.charLength = 0;
    };


    // write decodes the given buffer and returns it as JS string that is
    // guaranteed to not contain any partial multi-byte characters. Any partial
    // character found at the end of the buffer is buffered up, and will be
    // returned when calling write again with the remaining bytes.
    //
    // Note: Converting a Buffer containing an orphan surrogate to a String
    // currently works, but converting a String to a Buffer (via `new Buffer`, or
    // Buffer#write) will replace incomplete surrogates with the unicode
    // replacement character. See https://codereview.chromium.org/121173009/ .
    StringDecoder.prototype.write = function(buffer) {
        var charStr = '';
        // if our last write ended with an incomplete multibyte character
        while (this.charLength) {
            // determine how many remaining bytes this buffer has to offer for this char
            var available = (buffer.length >= this.charLength - this.charReceived) ?
            this.charLength - this.charReceived :
            buffer.length;

            // add the new bytes to the char buffer
            buffer.copy(this.charBuffer, this.charReceived, 0, available);
            this.charReceived += available;

            if (this.charReceived < this.charLength) {
                // still not enough chars in this buffer? wait for more ...
                return '';
            }

            // remove bytes belonging to the current character from the buffer
            buffer = buffer.slice(available, buffer.length);

            // get the character that was split
            charStr = this.charBuffer.slice(0, this.charLength).toString(this.encoding);

            // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
            var charCode = charStr.charCodeAt(charStr.length - 1);
            if (charCode >= 0xD800 && charCode <= 0xDBFF) {
                this.charLength += this.surrogateSize;
                charStr = '';
                continue;
            }
            this.charReceived = this.charLength = 0;

            // if there are no more bytes in this buffer, just emit our char
            if (buffer.length === 0) {
                return charStr;
            }
            break;
        }

        // determine and set charLength / charReceived
        this.detectIncompleteChar(buffer);

        var end = buffer.length;
        if (this.charLength) {
            // buffer the incomplete character bytes we got
            buffer.copy(this.charBuffer, 0, buffer.length - this.charReceived, end);
            end -= this.charReceived;
        }

        charStr += buffer.toString(this.encoding, 0, end);

        var end = charStr.length - 1;
        var charCode = charStr.charCodeAt(end);
        // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
        if (charCode >= 0xD800 && charCode <= 0xDBFF) {
            var size = this.surrogateSize;
            this.charLength += size;
            this.charReceived += size;
            this.charBuffer.copy(this.charBuffer, size, 0, size);
            buffer.copy(this.charBuffer, 0, 0, size);
            return charStr.substring(0, end);
        }

        // or just emit the charStr
        return charStr;
    };

    // detectIncompleteChar determines if there is an incomplete UTF-8 character at
    // the end of the given buffer. If so, it sets this.charLength to the byte
    // length that character, and sets this.charReceived to the number of bytes
    // that are available for this character.
    StringDecoder.prototype.detectIncompleteChar = function(buffer) {
        // determine how many bytes we have to check at the end of this buffer
        var i = (buffer.length >= 3) ? 3 : buffer.length;

        // Figure out if one of the last i bytes of our buffer announces an
        // incomplete char.
        for (; i > 0; i--) {
            var c = buffer[buffer.length - i];

            // See http://en.wikipedia.org/wiki/UTF-8#Description

            // 110XXXXX
            if (i == 1 && c >> 5 == 0x06) {
                this.charLength = 2;
                break;
            }

            // 1110XXXX
            if (i <= 2 && c >> 4 == 0x0E) {
                this.charLength = 3;
                break;
            }

            // 11110XXX
            if (i <= 3 && c >> 3 == 0x1E) {
                this.charLength = 4;
                break;
            }
        }
        this.charReceived = i;
    };

    StringDecoder.prototype.end = function(buffer) {
        var res = '';
        if (buffer && buffer.length)
            res = this.write(buffer);

        if (this.charReceived) {
            var cr = this.charReceived;
            var buf = this.charBuffer;
            var enc = this.encoding;
            res += buf.slice(0, cr).toString(enc);
        }

        return res;
    };

    function passThroughWrite(buffer) {
        return buffer.toString(this.encoding);
    }

    function utf16DetectIncompleteChar(buffer) {
        this.charReceived = buffer.length % 2;
        this.charLength = this.charReceived ? 2 : 0;
    }

    function base64DetectIncompleteChar(buffer) {
        this.charReceived = buffer.length % 3;
        this.charLength = this.charReceived ? 3 : 0;
    }

}, {
    "buffer": 5
}
],
35: [function(require, module, exports) {
    // Copyright Joyent, Inc. and other Node contributors.
    //
    // Permission is hereby granted, free of charge, to any person obtaining a
    // copy of this software and associated documentation files (the
    // "Software"), to deal in the Software without restriction, including
    // without limitation the rights to use, copy, modify, merge, publish,
    // distribute, sublicense, and/or sell copies of the Software, and to permit
    // persons to whom the Software is furnished to do so, subject to the
    // following conditions:
    //
    // The above copyright notice and this permission notice shall be included
    // in all copies or substantial portions of the Software.
    //
    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
    // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
    // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
    // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
    // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
    // USE OR OTHER DEALINGS IN THE SOFTWARE.

    var punycode = require('punycode');

    exports.parse = urlParse;
    exports.resolve = urlResolve;
    exports.resolveObject = urlResolveObject;
    exports.format = urlFormat;

    exports.Url = Url;

    function Url() {
        this.protocol = null;
        this.slashes = null;
        this.auth = null;
        this.host = null;
        this.port = null;
        this.hostname = null;
        this.hash = null;
        this.search = null;
        this.query = null;
        this.pathname = null;
        this.path = null;
        this.href = null;
    }

    // Reference: RFC 3986, RFC 1808, RFC 2396

    // define these here so at least they only have to be
    // compiled once on the first module load.
    var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,
    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],
    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),
    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
    hostEndingChars = ['/', '?', '#'],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
        'javascript': true,
        'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
        'javascript': true,
        'javascript:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
        'http': true,
        'https': true,
        'ftp': true,
        'gopher': true,
        'file': true,
        'http:': true,
        'https:': true,
        'ftp:': true,
        'gopher:': true,
        'file:': true
    },
    querystring = require('querystring');

    function urlParse(url, parseQueryString, slashesDenoteHost) {
        if (url && isObject(url) && url instanceof Url)
            return url;

        var u = new Url;
        u.parse(url, parseQueryString, slashesDenoteHost);
        return u;
    }

    Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
        if (!isString(url)) {
            throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
        }

        var rest = url;

        // trim before proceeding.
        // This is to support parse stuff like "  http://foo.com  \n"
        rest = rest.trim();

        var proto = protocolPattern.exec(rest);
        if (proto) {
            proto = proto[0];
            var lowerProto = proto.toLowerCase();
            this.protocol = lowerProto;
            rest = rest.substr(proto.length);
        }

        // figure out if it's got a host
        // user@server is *always* interpreted as a hostname, and url
        // resolution will treat //foo/bar as host=foo,path=bar because that's
        // how the browser resolves relative URLs.
        if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
            var slashes = rest.substr(0, 2) === '//';
            if (slashes && !(proto && hostlessProtocol[proto])) {
                rest = rest.substr(2);
                this.slashes = true;
            }
        }

        if (!hostlessProtocol[proto] &&
        (slashes || (proto && !slashedProtocol[proto]))) {

            // there's a hostname.
            // the first instance of /, ?, ;, or # ends the host.
            //
            // If there is an @ in the hostname, then non-host chars *are* allowed
            // to the left of the last @ sign, unless some host-ending character
            // comes *before* the @-sign.
            // URLs are obnoxious.
            //
            // ex:
            // http://a@b@c/ => user:a@b host:c
            // http://a@b?@c => user:a host:c path:/?@c

            // v0.12 TODO(isaacs): This is not quite how Chrome does things.
            // Review our test case against browsers more comprehensively.

            // find the first instance of any hostEndingChars
            var hostEnd = - 1;
            for (var i = 0; i < hostEndingChars.length; i++) {
                var hec = rest.indexOf(hostEndingChars[i]);
                if (hec !== - 1 && (hostEnd === - 1 || hec < hostEnd))
                    hostEnd = hec;
            }

            // at this point, either we have an explicit point where the
            // auth portion cannot go past, or the last @ char is the decider.
            var auth, atSign;
            if (hostEnd === - 1) {
                // atSign can be anywhere.
                atSign = rest.lastIndexOf('@');
            } else {
                // atSign must be in auth portion.
                // http://a@b/c@d => host:b auth:a path:/c@d
                atSign = rest.lastIndexOf('@', hostEnd);
            }

            // Now we have a portion which is definitely the auth.
            // Pull that off.
            if (atSign !== - 1) {
                auth = rest.slice(0, atSign);
                rest = rest.slice(atSign + 1);
                this.auth = decodeURIComponent(auth);
            }

            // the host is the remaining to the left of the first non-host char
            hostEnd = - 1;
            for (var i = 0; i < nonHostChars.length; i++) {
                var hec = rest.indexOf(nonHostChars[i]);
                if (hec !== - 1 && (hostEnd === - 1 || hec < hostEnd))
                    hostEnd = hec;
            }
            // if we still have not hit it, then the entire thing is a host.
            if (hostEnd === - 1)
                hostEnd = rest.length;

            this.host = rest.slice(0, hostEnd);
            rest = rest.slice(hostEnd);

            // pull out port.
            this.parseHost();

            // we've indicated that there is a hostname,
            // so even if it's empty, it has to be present.
            this.hostname = this.hostname || '';

            // if hostname begins with [ and ends with ]
            // assume that it's an IPv6 address.
            var ipv6Hostname = this.hostname[0] === '[' &&
            this.hostname[this.hostname.length - 1] === ']';

            // validate a little.
            if (!ipv6Hostname) {
                var hostparts = this.hostname.split(/\./);
                for (var i = 0, l = hostparts.length; i < l; i++) {
                    var part = hostparts[i];
                    if (!part)
                        continue;
                    if (!part.match(hostnamePartPattern)) {
                        var newpart = '';
                        for (var j = 0, k = part.length; j < k; j++) {
                            if (part.charCodeAt(j) > 127) {
                                // we replace non-ASCII char with a temporary placeholder
                                // we need this to make sure size of hostname is not
                                // broken by replacing non-ASCII by nothing
                                newpart += 'x';
                            } else {
                                newpart += part[j];
                            }
                        }
                        // we test again with ASCII char only
                        if (!newpart.match(hostnamePartPattern)) {
                            var validParts = hostparts.slice(0, i);
                            var notHost = hostparts.slice(i + 1);
                            var bit = part.match(hostnamePartStart);
                            if (bit) {
                                validParts.push(bit[1]);
                                notHost.unshift(bit[2]);
                            }
                            if (notHost.length) {
                                rest = '/' + notHost.join('.') + rest;
                            }
                            this.hostname = validParts.join('.');
                            break;
                        }
                    }
                }
            }

            if (this.hostname.length > hostnameMaxLen) {
                this.hostname = '';
            } else {
                // hostnames are always lower case.
                this.hostname = this.hostname.toLowerCase();
            }

            if (!ipv6Hostname) {
                // IDNA Support: Returns a puny coded representation of "domain".
                // It only converts the part of the domain name that
                // has non ASCII characters. I.e. it dosent matter if
                // you call it with a domain that already is in ASCII.
                var domainArray = this.hostname.split('.');
                var newOut = [];
                for (var i = 0; i < domainArray.length; ++i) {
                    var s = domainArray[i];
                    newOut.push(s.match(/[^A-Za-z0-9_-]/) ?
                    'xn--' + punycode.encode(s) : s);
                }
                this.hostname = newOut.join('.');
            }

            var p = this.port ? ':' + this.port : '';
            var h = this.hostname || '';
            this.host = h + p;
            this.href += this.host;

            // strip [ and ] from the hostname
            // the host field still retains them, though
            if (ipv6Hostname) {
                this.hostname = this.hostname.substr(1, this.hostname.length - 2);
                if (rest[0] !== '/') {
                    rest = '/' + rest;
                }
            }
        }

        // now rest is set to the post-host stuff.
        // chop off any delim chars.
        if (!unsafeProtocol[lowerProto]) {

            // First, make 100% sure that any "autoEscape" chars get
            // escaped, even if encodeURIComponent doesn't think they
            // need to be.
            for (var i = 0, l = autoEscape.length; i < l; i++) {
                var ae = autoEscape[i];
                var esc = encodeURIComponent(ae);
                if (esc === ae) {
                    esc = escape(ae);
                }
                rest = rest.split(ae).join(esc);
            }
        }


        // chop off from the tail first.
        var hash = rest.indexOf('#');
        if (hash !== - 1) {
            // got a fragment string.
            this.hash = rest.substr(hash);
            rest = rest.slice(0, hash);
        }
        var qm = rest.indexOf('?');
        if (qm !== - 1) {
            this.search = rest.substr(qm);
            this.query = rest.substr(qm + 1);
            if (parseQueryString) {
                this.query = querystring.parse(this.query);
            }
            rest = rest.slice(0, qm);
        } else if (parseQueryString) {
            // no query string, but parseQueryString still requested
            this.search = '';
            this.query = {};
        }
        if (rest)
            this.pathname = rest;
        if (slashedProtocol[lowerProto] &&
        this.hostname && !this.pathname) {
            this.pathname = '/';
        }

        //to support http.request
        if (this.pathname || this.search) {
            var p = this.pathname || '';
            var s = this.search || '';
            this.path = p + s;
        }

        // finally, reconstruct the href based on what has been validated.
        this.href = this.format();
        return this;
    };

    // format a parsed object into a url string
    function urlFormat(obj) {
        // ensure it's an object, and not a string url.
        // If it's an obj, this is a no-op.
        // this way, you can call url_format() on strings
        // to clean up potentially wonky urls.
        if (isString(obj))
            obj = urlParse(obj);
        if (!(obj instanceof Url))
            return Url.prototype.format.call(obj);
        return obj.format();
    }

    Url.prototype.format = function() {
        var auth = this.auth || '';
        if (auth) {
            auth = encodeURIComponent(auth);
            auth = auth.replace(/%3A/i, ':');
            auth += '@';
        }

        var protocol = this.protocol || '',
        pathname = this.pathname || '',
        hash = this.hash || '',
        host = false,
        query = '';

        if (this.host) {
            host = auth + this.host;
        } else if (this.hostname) {
            host = auth + (this.hostname.indexOf(':') === - 1 ?
            this.hostname :
            '[' + this.hostname + ']');
            if (this.port) {
                host += ':' + this.port;
            }
        }

        if (this.query &&
        isObject(this.query) &&
        Object.keys(this.query).length) {
            query = querystring.stringify(this.query);
        }

        var search = this.search || (query && ('?' + query)) || '';

        if (protocol && protocol.substr( - 1) !== ':')
            protocol += ':';

        // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
        // unless they had them to begin with.
        if (this.slashes ||
        (!protocol || slashedProtocol[protocol]) && host !== false) {
            host = '//' + (host || '');
            if (pathname && pathname.charAt(0) !== '/')
                pathname = '/' + pathname;
        } else if (!host) {
            host = '';
        }

        if (hash && hash.charAt(0) !== '#')
            hash = '#' + hash;
        if (search && search.charAt(0) !== '?')
            search = '?' + search;

        pathname = pathname.replace(/[?#]/g, function(match) {
            return encodeURIComponent(match);
        });
        search = search.replace('#', '%23');

        return protocol + host + pathname + search + hash;
    };

    function urlResolve(source, relative) {
        return urlParse(source, false, true).resolve(relative);
    }

    Url.prototype.resolve = function(relative) {
        return this.resolveObject(urlParse(relative, false, true)).format();
    };

    function urlResolveObject(source, relative) {
        if (!source)
            return relative;
        return urlParse(source, false, true).resolveObject(relative);
    }

    Url.prototype.resolveObject = function(relative) {
        if (isString(relative)) {
            var rel = new Url();
            rel.parse(relative, false, true);
            relative = rel;
        }

        var result = new Url();
        Object.keys(this).forEach(function(k) {
            result[k] = this[k];
        }, this);

        // hash is always overridden, no matter what.
        // even href="" will remove it.
        result.hash = relative.hash;

        // if the relative url is empty, then there's nothing left to do here.
        if (relative.href === '') {
            result.href = result.format();
            return result;
        }

        // hrefs like //foo/bar always cut to the protocol.
        if (relative.slashes && !relative.protocol) {
            // take everything except the protocol from relative
            Object.keys(relative).forEach(function(k) {
                if (k !== 'protocol')
                    result[k] = relative[k];
            });

            //urlParse appends trailing / to urls like http://www.example.com
            if (slashedProtocol[result.protocol] &&
            result.hostname && !result.pathname) {
                result.path = result.pathname = '/';
            }

            result.href = result.format();
            return result;
        }

        if (relative.protocol && relative.protocol !== result.protocol) {
            // if it's a known url protocol, then changing
            // the protocol does weird things
            // first, if it's not file:, then we MUST have a host,
            // and if there was a path
            // to begin with, then we MUST have a path.
            // if it is file:, then the host is dropped,
            // because that's known to be hostless.
            // anything else is assumed to be absolute.
            if (!slashedProtocol[relative.protocol]) {
                Object.keys(relative).forEach(function(k) {
                    result[k] = relative[k];
                });
                result.href = result.format();
                return result;
            }

            result.protocol = relative.protocol;
            if (!relative.host && !hostlessProtocol[relative.protocol]) {
                var relPath = (relative.pathname || '').split('/');
                while (relPath.length && !(relative.host = relPath.shift()));
                if (!relative.host)
                    relative.host = '';
                if (!relative.hostname)
                    relative.hostname = '';
                if (relPath[0] !== '')
                    relPath.unshift('');
                if (relPath.length < 2)
                    relPath.unshift('');
                result.pathname = relPath.join('/');
            } else {
                result.pathname = relative.pathname;
            }
            result.search = relative.search;
            result.query = relative.query;
            result.host = relative.host || '';
            result.auth = relative.auth;
            result.hostname = relative.hostname || relative.host;
            result.port = relative.port;
            // to support http.request
            if (result.pathname || result.search) {
                var p = result.pathname || '';
                var s = result.search || '';
                result.path = p + s;
            }
            result.slashes = result.slashes || relative.slashes;
            result.href = result.format();
            return result;
        }

        var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
        isRelAbs = (
        relative.host ||
        relative.pathname && relative.pathname.charAt(0) === '/'
        ),
        mustEndAbs = (isRelAbs || isSourceAbs ||
        (result.host && relative.pathname)),
        removeAllDots = mustEndAbs,
        srcPath = result.pathname && result.pathname.split('/') || [],
        relPath = relative.pathname && relative.pathname.split('/') || [],
        psychotic = result.protocol && !slashedProtocol[result.protocol];

        // if the url is a non-slashed url, then relative
        // links like ../.. should be able
        // to crawl up to the hostname, as well.  This is strange.
        // result.protocol has already been set by now.
        // Later on, put the first path part into the host field.
        if (psychotic) {
            result.hostname = '';
            result.port = null;
            if (result.host) {
                if (srcPath[0] === '')
                    srcPath[0] = result.host;
                else
                    srcPath.unshift(result.host);
            }
            result.host = '';
            if (relative.protocol) {
                relative.hostname = null;
                relative.port = null;
                if (relative.host) {
                    if (relPath[0] === '')
                        relPath[0] = relative.host;
                    else
                        relPath.unshift(relative.host);
                }
                relative.host = null;
            }
            mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
        }

        if (isRelAbs) {
            // it's absolute.
            result.host = (relative.host || relative.host === '') ?
            relative.host : result.host;
            result.hostname = (relative.hostname || relative.hostname === '') ?
            relative.hostname : result.hostname;
            result.search = relative.search;
            result.query = relative.query;
            srcPath = relPath;
            // fall through to the dot-handling below.
        } else if (relPath.length) {
            // it's relative
            // throw away the existing file, and take the new path instead.
            if (!srcPath)
                srcPath = [];
            srcPath.pop();
            srcPath = srcPath.concat(relPath);
            result.search = relative.search;
            result.query = relative.query;
        } else if (!isNullOrUndefined(relative.search)) {
            // just pull out the search.
            // like href='?foo'.
            // Put this after the other two cases because it simplifies the booleans
            if (psychotic) {
                result.hostname = result.host = srcPath.shift();
                //occationaly the auth can get stuck only in host
                //this especialy happens in cases like
                //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
                var authInHost = result.host && result.host.indexOf('@') > 0 ?
                result.host.split('@') : false;
                if (authInHost) {
                    result.auth = authInHost.shift();
                    result.host = result.hostname = authInHost.shift();
                }
            }
            result.search = relative.search;
            result.query = relative.query;
            //to support http.request
            if (!isNull(result.pathname) || !isNull(result.search)) {
                result.path = (result.pathname ? result.pathname : '') +
                (result.search ? result.search : '');
            }
            result.href = result.format();
            return result;
        }

        if (!srcPath.length) {
            // no path at all.  easy.
            // we've already handled the other stuff above.
            result.pathname = null;
            //to support http.request
            if (result.search) {
                result.path = '/' + result.search;
            } else {
                result.path = null;
            }
            result.href = result.format();
            return result;
        }

        // if a url ENDs in . or .., then it must get a trailing slash.
        // however, if it ends in anything else non-slashy,
        // then it must NOT get a trailing slash.
        var last = srcPath.slice( - 1)[0];
        var hasTrailingSlash = (
        (result.host || relative.host) && (last === '.' || last === '..') ||
        last === '');

        // strip single dots, resolve double dots to parent dir
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = srcPath.length; i >= 0; i--) {
            last = srcPath[i];
            if (last == '.') {
                srcPath.splice(i, 1);
            } else if (last === '..') {
                srcPath.splice(i, 1);
                up++;
            } else if (up) {
                srcPath.splice(i, 1);
                up--;
            }
        }

        // if the path is allowed to go above the root, restore leading ..s
        if (!mustEndAbs && !removeAllDots) {
            for (; up--; up) {
                srcPath.unshift('..');
            }
        }

        if (mustEndAbs && srcPath[0] !== '' &&
        (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
            srcPath.unshift('');
        }

        if (hasTrailingSlash && (srcPath.join('/').substr( - 1) !== '/')) {
            srcPath.push('');
        }

        var isAbsolute = srcPath[0] === '' ||
        (srcPath[0] && srcPath[0].charAt(0) === '/');

        // put the host back
        if (psychotic) {
            result.hostname = result.host = isAbsolute ? '' :
            srcPath.length ? srcPath.shift() : '';
            //occationaly the auth can get stuck only in host
            //this especialy happens in cases like
            //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
            var authInHost = result.host && result.host.indexOf('@') > 0 ?
            result.host.split('@') : false;
            if (authInHost) {
                result.auth = authInHost.shift();
                result.host = result.hostname = authInHost.shift();
            }
        }

        mustEndAbs = mustEndAbs || (result.host && srcPath.length);

        if (mustEndAbs && !isAbsolute) {
            srcPath.unshift('');
        }

        if (!srcPath.length) {
            result.pathname = null;
            result.path = null;
        } else {
            result.pathname = srcPath.join('/');
        }

        //to support request.http
        if (!isNull(result.pathname) || !isNull(result.search)) {
            result.path = (result.pathname ? result.pathname : '') +
            (result.search ? result.search : '');
        }
        result.auth = relative.auth || result.auth;
        result.slashes = result.slashes || relative.slashes;
        result.href = result.format();
        return result;
    };

    Url.prototype.parseHost = function() {
        var host = this.host;
        var port = portPattern.exec(host);
        if (port) {
            port = port[0];
            if (port !== ':') {
                this.port = port.substr(1);
            }
            host = host.substr(0, host.length - port.length);
        }
        if (host)
            this.hostname = host;
    };

    function isString(arg) {
        return typeof arg === "string";
    }

    function isObject(arg) {
        return typeof arg === 'object' && arg !== null;
    }

    function isNull(arg) {
        return arg === null;
    }
    function isNullOrUndefined(arg) {
        return arg == null;
    }

}, {
    "punycode": 18,
    "querystring": 21
}
],
36: [function(require, module, exports) {
    module.exports = function isBuffer(arg) {
        return arg && typeof arg === 'object'
        && typeof arg.copy === 'function'
        && typeof arg.fill === 'function'
        && typeof arg.readUInt8 === 'function';
    }
}, {}
],
37: [function(require, module, exports) {
    (function (process, global) {
        // Copyright Joyent, Inc. and other Node contributors.
        //
        // Permission is hereby granted, free of charge, to any person obtaining a
        // copy of this software and associated documentation files (the
        // "Software"), to deal in the Software without restriction, including
        // without limitation the rights to use, copy, modify, merge, publish,
        // distribute, sublicense, and/or sell copies of the Software, and to permit
        // persons to whom the Software is furnished to do so, subject to the
        // following conditions:
        //
        // The above copyright notice and this permission notice shall be included
        // in all copies or substantial portions of the Software.
        //
        // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
        // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
        // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
        // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
        // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
        // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
        // USE OR OTHER DEALINGS IN THE SOFTWARE.

        var formatRegExp = /%[sdj%]/g;
        exports.format = function(f) {
            if (!isString(f)) {
                var objects = [];
                for (var i = 0; i < arguments.length; i++) {
                    objects.push(inspect(arguments[i]));
                }
                return objects.join(' ');
            }

            var i = 1;
            var args = arguments;
            var len = args.length;
            var str = String(f).replace(formatRegExp, function(x) {
                if (x === '%%')
                    return '%';
                if (i >= len)
                    return x;
                switch (x) {
                case '%s':
                    return String(args[i++]);
                case '%d':
                    return Number(args[i++]);
                case '%j':
                    try {
                        return JSON.stringify(args[i++]);
                    } catch (_) {
                        return '[Circular]';
                    }
                default:
                    return x;
                }
            });
            for (var x = args[i]; i < len; x = args[++i]) {
                if (isNull(x) || !isObject(x)) {
                    str += ' ' + x;
                } else {
                    str += ' ' + inspect(x);
                }
            }
            return str;
        };


        // Mark that a method should not be used.
        // Returns a modified function which warns once by default.
        // If --no-deprecation is set, then it is a no-op.
        exports.deprecate = function(fn, msg) {
            // Allow for deprecating things in the process of starting up.
            if (isUndefined(global.process)) {
                return function() {
                    return exports.deprecate(fn, msg).apply(this, arguments);
                };
            }

            if (process.noDeprecation === true) {
                return fn;
            }

            var warned = false;
            function deprecated() {
                if (!warned) {
                    if (process.throwDeprecation) {
                        throw new Error(msg);
                    } else if (process.traceDeprecation) {
                        console.trace(msg);
                    } else {
                        console.error(msg);
                    }
                    warned = true;
                }
                return fn.apply(this, arguments);
            }

            return deprecated;
        };


        var debugs = {};
        var debugEnviron;
        exports.debuglog = function(set) {
            if (isUndefined(debugEnviron))
                debugEnviron = process.env.NODE_DEBUG || '';
            set = set.toUpperCase();
            if (!debugs[set]) {
                if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
                    var pid = process.pid;
                    debugs[set] = function() {
                        var msg = exports.format.apply(exports, arguments);
                        console.error('%s %d: %s', set, pid, msg);
                    };
                } else {
                    debugs[set] = function() {};
                }
            }
            return debugs[set];
        };


        /**
         * Echos the value of a value. Trys to print the value out
         * in the best way possible given the different types.
         *
         * @param {Object} obj The object to print out.
         * @param {Object} opts Optional options object that alters the output.
         */
        /* legacy: obj, showHidden, depth, colors*/
        function inspect(obj, opts) {
            // default options
            var ctx = {
                seen: [],
                stylize: stylizeNoColor
            };
            // legacy...
            if (arguments.length >= 3)
                ctx.depth = arguments[2];
            if (arguments.length >= 4)
                ctx.colors = arguments[3];
            if (isBoolean(opts)) {
                // legacy...
                ctx.showHidden = opts;
            } else if (opts) {
                // got an "options" object
                exports._extend(ctx, opts);
            }
            // set default options
            if (isUndefined(ctx.showHidden))
                ctx.showHidden = false;
            if (isUndefined(ctx.depth))
                ctx.depth = 2;
            if (isUndefined(ctx.colors))
                ctx.colors = false;
            if (isUndefined(ctx.customInspect))
                ctx.customInspect = true;
            if (ctx.colors)
                ctx.stylize = stylizeWithColor;
            return formatValue(ctx, obj, ctx.depth);
        }
        exports.inspect = inspect;


        // http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
        inspect.colors = {
            'bold' : [1, 22],
            'italic' : [3, 23],
            'underline' : [4, 24],
            'inverse' : [7, 27],
            'white' : [37, 39],
            'grey' : [90, 39],
            'black' : [30, 39],
            'blue' : [34, 39],
            'cyan' : [36, 39],
            'green' : [32, 39],
            'magenta' : [35, 39],
            'red' : [31, 39],
            'yellow' : [33, 39]
        };

        // Don't use 'blue' not visible on cmd.exe
        inspect.styles = {
            'special': 'cyan',
            'number': 'yellow',
            'boolean': 'yellow',
            'undefined': 'grey',
            'null': 'bold',
            'string': 'green',
            'date': 'magenta',
            // "name": intentionally not styling
            'regexp': 'red'
        };


        function stylizeWithColor(str, styleType) {
            var style = inspect.styles[styleType];

            if (style) {
                return '\u001b[' + inspect.colors[style][0] + 'm' + str +
                '\u001b[' + inspect.colors[style][1] + 'm';
            } else {
                return str;
            }
        }


        function stylizeNoColor(str, styleType) {
            return str;
        }


        function arrayToHash(array) {
            var hash = {};

            array.forEach(function(val, idx) {
                hash[val] = true;
            });

            return hash;
        }


        function formatValue(ctx, value, recurseTimes) {
            // Provide a hook for user-specified inspect functions.
            // Check that value is an object with an inspect function on it
            if (ctx.customInspect &&
            value &&
            isFunction(value.inspect) &&
            // Filter out the util module, it's inspect function is special
            value.inspect !== exports.inspect &&
            // Also filter out any prototype objects using the circular check.
            !(value.constructor && value.constructor.prototype === value)) {
                var ret = value.inspect(recurseTimes, ctx);
                if (!isString(ret)) {
                    ret = formatValue(ctx, ret, recurseTimes);
                }
                return ret;
            }

            // Primitive types cannot have properties
            var primitive = formatPrimitive(ctx, value);
            if (primitive) {
                return primitive;
            }

            // Look up the keys of the object.
            var keys = Object.keys(value);
            var visibleKeys = arrayToHash(keys);

            if (ctx.showHidden) {
                keys = Object.getOwnPropertyNames(value);
            }

            // IE doesn't make error fields non-enumerable
            // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
            if (isError(value)
            && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
                return formatError(value);
            }

            // Some type of object without properties can be shortcutted.
            if (keys.length === 0) {
                if (isFunction(value)) {
                    var name = value.name ? ': ' + value.name : '';
                    return ctx.stylize('[Function' + name + ']', 'special');
                }
                if (isRegExp(value)) {
                    return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
                }
                if (isDate(value)) {
                    return ctx.stylize(Date.prototype.toString.call(value), 'date');
                }
                if (isError(value)) {
                    return formatError(value);
                }
            }

            var base = '', array = false, braces = ['{', '}'];

            // Make Array say that they are Array
            if (isArray(value)) {
                array = true;
                braces = ['[', ']'];
            }

            // Make functions say that they are functions
            if (isFunction(value)) {
                var n = value.name ? ': ' + value.name : '';
                base = ' [Function' + n + ']';
            }

            // Make RegExps say that they are RegExps
            if (isRegExp(value)) {
                base = ' ' + RegExp.prototype.toString.call(value);
            }

            // Make dates with properties first say the date
            if (isDate(value)) {
                base = ' ' + Date.prototype.toUTCString.call(value);
            }

            // Make error with message first say the error
            if (isError(value)) {
                base = ' ' + formatError(value);
            }

            if (keys.length === 0 && (!array || value.length == 0)) {
                return braces[0] + base + braces[1];
            }

            if (recurseTimes < 0) {
                if (isRegExp(value)) {
                    return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
                } else {
                    return ctx.stylize('[Object]', 'special');
                }
            }

            ctx.seen.push(value);

            var output;
            if (array) {
                output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
            } else {
                output = keys.map(function(key) {
                    return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
                });
            }

            ctx.seen.pop();

            return reduceToSingleString(output, base, braces);
        }


        function formatPrimitive(ctx, value) {
            if (isUndefined(value))
                return ctx.stylize('undefined', 'undefined');
            if (isString(value)) {
                var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                .replace(/'/g, "\\'")
                .replace(/\\"/g, '"') + '\'';
                return ctx.stylize(simple, 'string');
            }
            if (isNumber(value))
                return ctx.stylize('' + value, 'number');
            if (isBoolean(value))
                return ctx.stylize('' + value, 'boolean');
            // For some reason typeof null is "object", so special case here.
            if (isNull(value))
                return ctx.stylize('null', 'null');
        }


        function formatError(value) {
            return '[' + Error.prototype.toString.call(value) + ']';
        }


        function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
            var output = [];
            for (var i = 0, l = value.length; i < l; ++i) {
                if (hasOwnProperty(value, String(i))) {
                    output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
                    String(i), true));
                } else {
                    output.push('');
                }
            }
            keys.forEach(function(key) {
                if (!key.match(/^\d+$/)) {
                    output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
                    key, true));
                }
            });
            return output;
        }


        function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
            var name, str, desc;
            desc = Object.getOwnPropertyDescriptor(value, key) || {
                value: value[key]
            };
            if (desc.get) {
                if (desc.set) {
                    str = ctx.stylize('[Getter/Setter]', 'special');
                } else {
                    str = ctx.stylize('[Getter]', 'special');
                }
            } else {
                if (desc.set) {
                    str = ctx.stylize('[Setter]', 'special');
                }
            }
            if (!hasOwnProperty(visibleKeys, key)) {
                name = '[' + key + ']';
            }
            if (!str) {
                if (ctx.seen.indexOf(desc.value) < 0) {
                    if (isNull(recurseTimes)) {
                        str = formatValue(ctx, desc.value, null);
                    } else {
                        str = formatValue(ctx, desc.value, recurseTimes - 1);
                    }
                    if (str.indexOf('\n') > - 1) {
                        if (array) {
                            str = str.split('\n').map(function(line) {
                                return '  ' + line;
                            }).join('\n').substr(2);
                        } else {
                            str = '\n' + str.split('\n').map(function(line) {
                                return '   ' + line;
                            }).join('\n');
                        }
                    }
                } else {
                    str = ctx.stylize('[Circular]', 'special');
                }
            }
            if (isUndefined(name)) {
                if (array && key.match(/^\d+$/)) {
                    return str;
                }
                name = JSON.stringify('' + key);
                if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
                    name = name.substr(1, name.length - 2);
                    name = ctx.stylize(name, 'name');
                } else {
                    name = name.replace(/'/g, "\\'")
                    .replace(/\\"/g, '"')
                    .replace(/(^"|"$)/g, "'");
                    name = ctx.stylize(name, 'string');
                }
            }

            return name + ': ' + str;
        }


        function reduceToSingleString(output, base, braces) {
            var numLinesEst = 0;
            var length = output.reduce(function(prev, cur) {
                numLinesEst++;
                if (cur.indexOf('\n') >= 0)
                    numLinesEst++;
                return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
            }, 0);

            if (length > 60) {
                return braces[0] +
                (base === '' ? '' : base + '\n ') +
                ' ' +
                output.join(',\n  ') +
                ' ' +
                braces[1];
            }

            return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
        }


        // NOTE: These type checking functions intentionally don't use `instanceof`
        // because it is fragile and can be easily faked with `Object.create()`.
        function isArray(ar) {
            return Array.isArray(ar);
        }
        exports.isArray = isArray;

        function isBoolean(arg) {
            return typeof arg === 'boolean';
        }
        exports.isBoolean = isBoolean;

        function isNull(arg) {
            return arg === null;
        }
        exports.isNull = isNull;

        function isNullOrUndefined(arg) {
            return arg == null;
        }
        exports.isNullOrUndefined = isNullOrUndefined;

        function isNumber(arg) {
            return typeof arg === 'number';
        }
        exports.isNumber = isNumber;

        function isString(arg) {
            return typeof arg === 'string';
        }
        exports.isString = isString;

        function isSymbol(arg) {
            return typeof arg === 'symbol';
        }
        exports.isSymbol = isSymbol;

        function isUndefined(arg) {
            return arg === void 0;
        }
        exports.isUndefined = isUndefined;

        function isRegExp(re) {
            return isObject(re) && objectToString(re) === '[object RegExp]';
        }
        exports.isRegExp = isRegExp;

        function isObject(arg) {
            return typeof arg === 'object' && arg !== null;
        }
        exports.isObject = isObject;

        function isDate(d) {
            return isObject(d) && objectToString(d) === '[object Date]';
        }
        exports.isDate = isDate;

        function isError(e) {
            return isObject(e) &&
            (objectToString(e) === '[object Error]' || e instanceof Error);
        }
        exports.isError = isError;

        function isFunction(arg) {
            return typeof arg === 'function';
        }
        exports.isFunction = isFunction;

        function isPrimitive(arg) {
            return arg === null ||
            typeof arg === 'boolean' ||
            typeof arg === 'number' ||
            typeof arg === 'string' ||
            typeof arg === 'symbol' || // ES6 symbol
            typeof arg === 'undefined';
        }
        exports.isPrimitive = isPrimitive;

        exports.isBuffer = require('./support/isBuffer');

        function objectToString(o) {
            return Object.prototype.toString.call(o);
        }


        function pad(n) {
            return n < 10 ? '0' + n.toString(10) : n.toString(10);
        }


        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
        'Oct', 'Nov', 'Dec'];

        // 26 Feb 16:19:34
        function timestamp() {
            var d = new Date();
            var time = [pad(d.getHours()),
            pad(d.getMinutes()),
            pad(d.getSeconds())].join(':');
            return [d.getDate(), months[d.getMonth()], time].join(' ');
        }


        // log is just a thin wrapper to console.log that prepends a timestamp
        exports.log = function() {
            console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
        };


        /**
         * Inherit the prototype methods from one constructor into another.
         *
         * The Function.prototype.inherits from lang.js rewritten as a standalone
         * function (not on Function.prototype). NOTE: If this file is to be loaded
         * during bootstrapping this function needs to be rewritten using some native
         * functions as prototype setup using normal JavaScript does not work as
         * expected during bootstrapping (see mirror.js in r114903).
         *
         * @param {function} ctor Constructor function which needs to inherit the
         *     prototype.
         * @param {function} superCtor Constructor function to inherit prototype from.
         */
        exports.inherits = require('inherits');

        exports._extend = function(origin, add) {
            // Don't do anything if add isn't an object
            if (!add || !isObject(add))
                return origin;

            var keys = Object.keys(add);
            var i = keys.length;
            while (i--) {
                origin[keys[i]] = add[keys[i]];
            }
            return origin;
        };

        function hasOwnProperty(obj, prop) {
            return Object.prototype.hasOwnProperty.call(obj, prop);
        }

    }).call(this, require('_process'), typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
}, {
    "./support/isBuffer": 36,
    "_process": 17,
    "inherits": 14
}
],
38: [function(require, module, exports) {
    /*
    Syntax highlighting with language autodetection.
    https://highlightjs.org/
    */

    (function(factory) {

        // Setup highlight.js for different environments. First is Node.js or
        // CommonJS.
        if (typeof exports !== 'undefined') {
            factory(exports);
        } else {
            // Export hljs globally even when using AMD for cases when this script
            // is loaded with others that may still expect a global hljs.
            window.hljs = factory({});

            // Finally register the global hljs with AMD.
            if (typeof define === 'function' && define.amd) {
                define('hljs', [], function() {
                    return window.hljs;
                });
            }
        }

    }(function(hljs) {

        /* Utility functions */

        function escape(value) {
            return value.replace(/&/gm, '&amp;').replace(/</gm, '&lt;').replace(/>/gm, '&gt;');
        }

        function tag(node) {
            return node.nodeName.toLowerCase();
        }

        function testRe(re, lexeme) {
            var match = re && re.exec(lexeme);
            return match && match.index == 0;
        }

        function isNotHighlighted(language) {
            return (/^(no-?highlight|plain|text)$/i).test(language);
        }

        function blockLanguage(block) {
            var i, match, length,
            classes = block.className + ' ';

            classes += block.parentNode ? block.parentNode.className : '';

            // language-* takes precedence over non-prefixed class names
            match = (/\blang(?:uage)?-([\w-]+)\b/i).exec(classes);
            if (match) {
                return getLanguage(match[1]) ? match[1] : 'no-highlight';
            }

            classes = classes.split(/\s+/);
            for (i = 0, length = classes.length; i < length; i++) {
                if (getLanguage(classes[i]) || isNotHighlighted(classes[i])) {
                    return classes[i];
                }
            }
        }

        function inherit(parent, obj) {
            var result = {}, key;
            for (key in parent)
                result[key] = parent[key];
            if (obj)
                for (key in obj)
                    result[key] = obj[key];
            return result;
        }

        /* Stream merging */

        function nodeStream(node) {
            var result = [];
            (function _nodeStream(node, offset) {
                for (var child = node.firstChild; child; child = child.nextSibling) {
                    if (child.nodeType == 3)
                        offset += child.nodeValue.length;
                    else if (child.nodeType == 1) {
                        result.push({
                            event: 'start',
                            offset: offset,
                            node: child
                        });
                        offset = _nodeStream(child, offset);
                        // Prevent void elements from having an end tag that would actually
                        // double them in the output. There are more void elements in HTML
                        // but we list only those realistically expected in code display.
                        if (!tag(child).match(/br|hr|img|input/)) {
                            result.push({
                                event: 'stop',
                                offset: offset,
                                node: child
                            });
                        }
                    }
                }
                return offset;
            })(node, 0);
            return result;
        }

        function mergeStreams(original, highlighted, value) {
            var processed = 0;
            var result = '';
            var nodeStack = [];

            function selectStream() {
                if (!original.length || !highlighted.length) {
                    return original.length ? original : highlighted;
                }
                if (original[0].offset != highlighted[0].offset) {
                    return (original[0].offset < highlighted[0].offset) ? original : highlighted;
                }

                /*
                      To avoid starting the stream just before it should stop the order is
                      ensured that original always starts first and closes last:

                      if (event1 == 'start' && event2 == 'start')
                        return original;
                      if (event1 == 'start' && event2 == 'stop')
                        return highlighted;
                      if (event1 == 'stop' && event2 == 'start')
                        return original;
                      if (event1 == 'stop' && event2 == 'stop')
                        return highlighted;

                      ... which is collapsed to:
                      */
                return highlighted[0].event == 'start' ? original : highlighted;
            }

            function open(node) {
                function attr_str(a) {
                    return ' ' + a.nodeName + '="' + escape(a.value) + '"';
                }
                result += '<' + tag(node) + Array.prototype.map.call(node.attributes, attr_str).join('') + '>';
            }

            function close(node) {
                result += '</' + tag(node) + '>';
            }

            function render(event) {
                (event.event == 'start' ? open : close)(event.node);
            }

            while (original.length || highlighted.length) {
                var stream = selectStream();
                result += escape(value.substr(processed, stream[0].offset - processed));
                processed = stream[0].offset;
                if (stream == original) {
                    /*
                            On any opening or closing tag of the original markup we first close
                            the entire highlighted node stack, then render the original tag along
                            with all the following original tags at the same offset and then
                            reopen all the tags on the highlighted stack.
                            */
                    nodeStack.reverse().forEach(close);
                    do {
                        render(stream.splice(0, 1)[0]);
                        stream = selectStream();
                    }
                    while (stream == original && stream.length && stream[0].offset == processed);
                    nodeStack.reverse().forEach(open);
                } else {
                    if (stream[0].event == 'start') {
                        nodeStack.push(stream[0].node);
                    } else {
                        nodeStack.pop();
                    }
                    render(stream.splice(0, 1)[0]);
                }
            }
            return result + escape(value.substr(processed));
        }

        /* Initialization */

        function compileLanguage(language) {

            function reStr(re) {
                return (re && re.source) || re;
            }

            function langRe(value, global) {
                return new RegExp(
                reStr(value),
                'm' + (language.case_insensitive ? 'i' : '') + (global ? 'g' : '')
                );
            }

            function compileMode(mode, parent) {
                if (mode.compiled)
                    return;
                mode.compiled = true;

                mode.keywords = mode.keywords || mode.beginKeywords;
                if (mode.keywords) {
                    var compiled_keywords = {};

                    var flatten = function(className, str) {
                        if (language.case_insensitive) {
                            str = str.toLowerCase();
                        }
                        str.split(' ').forEach(function(kw) {
                            var pair = kw.split('|');
                            compiled_keywords[pair[0]] = [className, pair[1] ? Number(pair[1]) : 1];
                        });
                    };

                    if (typeof mode.keywords == 'string') {
                        // string
                        flatten('keyword', mode.keywords);
                    } else {
                        Object.keys(mode.keywords).forEach(function (className) {
                            flatten(className, mode.keywords[className]);
                        });
                    }
                    mode.keywords = compiled_keywords;
                }
                mode.lexemesRe = langRe(mode.lexemes || /\b\w+\b/, true);

                if (parent) {
                    if (mode.beginKeywords) {
                        mode.begin = '\\b(' + mode.beginKeywords.split(' ').join('|') + ')\\b';
                    }
                    if (!mode.begin)
                        mode.begin = /\B|\b/;
                    mode.beginRe = langRe(mode.begin);
                    if (!mode.end && !mode.endsWithParent)
                        mode.end = /\B|\b/;
                    if (mode.end)
                        mode.endRe = langRe(mode.end);
                    mode.terminator_end = reStr(mode.end) || '';
                    if (mode.endsWithParent && parent.terminator_end)
                        mode.terminator_end += (mode.end ? '|' : '') + parent.terminator_end;
                }
                if (mode.illegal)
                    mode.illegalRe = langRe(mode.illegal);
                if (mode.relevance === undefined)
                    mode.relevance = 1;
                if (!mode.contains) {
                    mode.contains = [];
                }
                var expanded_contains = [];
                mode.contains.forEach(function(c) {
                    if (c.variants) {
                        c.variants.forEach(function(v) {
                            expanded_contains.push(inherit(c, v));
                        });
                    } else {
                        expanded_contains.push(c == 'self' ? mode : c);
                    }
                });
                mode.contains = expanded_contains;
                mode.contains.forEach(function(c) {
                    compileMode(c, mode);
                });

                if (mode.starts) {
                    compileMode(mode.starts, parent);
                }

                var terminators =
                mode.contains.map(function(c) {
                    return c.beginKeywords ? '\\.?(' + c.begin + ')\\.?' : c.begin;
                })
                .concat([mode.terminator_end, mode.illegal])
                .map(reStr)
                .filter(Boolean);
                mode.terminators = terminators.length ? langRe(terminators.join('|'), true) : {
                    exec: function( /*s*/
                    ) {
                        return null;
                    }
                };
            }

            compileMode(language);
        }

        /*
          Core highlighting function. Accepts a language name, or an alias, and a
          string with the code to highlight. Returns an object with the following
          properties:

          - relevance (int)
          - value (an HTML string with highlighting markup)

          */
        function highlight(name, value, ignore_illegals, continuation) {

            function subMode(lexeme, mode) {
                for (var i = 0; i < mode.contains.length; i++) {
                    if (testRe(mode.contains[i].beginRe, lexeme)) {
                        return mode.contains[i];
                    }
                }
            }

            function endOfMode(mode, lexeme) {
                if (testRe(mode.endRe, lexeme)) {
                    while (mode.endsParent && mode.parent) {
                        mode = mode.parent;
                    }
                    return mode;
                }
                if (mode.endsWithParent) {
                    return endOfMode(mode.parent, lexeme);
                }
            }

            function isIllegal(lexeme, mode) {
                return !ignore_illegals && testRe(mode.illegalRe, lexeme);
            }

            function keywordMatch(mode, match) {
                var match_str = language.case_insensitive ? match[0].toLowerCase() : match[0];
                return mode.keywords.hasOwnProperty(match_str) && mode.keywords[match_str];
            }

            function buildSpan(classname, insideSpan, leaveOpen, noPrefix) {
                var classPrefix = noPrefix ? '' : options.classPrefix,
                openSpan = '<span class="' + classPrefix,
                closeSpan = leaveOpen ? '' : '</span>';

                openSpan += classname + '">';

                return openSpan + insideSpan + closeSpan;
            }

            function processKeywords() {
                if (!top.keywords)
                    return escape(mode_buffer);
                var result = '';
                var last_index = 0;
                top.lexemesRe.lastIndex = 0;
                var match = top.lexemesRe.exec(mode_buffer);
                while (match) {
                    result += escape(mode_buffer.substr(last_index, match.index - last_index));
                    var keyword_match = keywordMatch(top, match);
                    if (keyword_match) {
                        relevance += keyword_match[1];
                        result += buildSpan(keyword_match[0], escape(match[0]));
                    } else {
                        result += escape(match[0]);
                    }
                    last_index = top.lexemesRe.lastIndex;
                    match = top.lexemesRe.exec(mode_buffer);
                }
                return result + escape(mode_buffer.substr(last_index));
            }

            function processSubLanguage() {
                var explicit = typeof top.subLanguage == 'string';
                if (explicit && !languages[top.subLanguage]) {
                    return escape(mode_buffer);
                }

                var result = explicit ?
                highlight(top.subLanguage, mode_buffer, true, continuations[top.subLanguage]) :
                highlightAuto(mode_buffer, top.subLanguage.length ? top.subLanguage : undefined);

                // Counting embedded language score towards the host language may be disabled
                // with zeroing the containing mode relevance. Usecase in point is Markdown that
                // allows XML everywhere and makes every XML snippet to have a much larger Markdown
                // score.
                if (top.relevance > 0) {
                    relevance += result.relevance;
                }
                if (explicit) {
                    continuations[top.subLanguage] = result.top;
                }
                return buildSpan(result.language, result.value, false, true);
            }

            function processBuffer() {
                return top.subLanguage !== undefined ? processSubLanguage() : processKeywords();
            }

            function startNewMode(mode, lexeme) {
                var markup = mode.className ? buildSpan(mode.className, '', true): '';
                if (mode.returnBegin) {
                    result += markup;
                    mode_buffer = '';
                } else if (mode.excludeBegin) {
                    result += escape(lexeme) + markup;
                    mode_buffer = '';
                } else {
                    result += markup;
                    mode_buffer = lexeme;
                }
                top = Object.create(mode, {
                    parent: {
                        value: top
                    }
                });
            }

            function processLexeme(buffer, lexeme) {

                mode_buffer += buffer;
                if (lexeme === undefined) {
                    result += processBuffer();
                    return 0;
                }

                var new_mode = subMode(lexeme, top);
                if (new_mode) {
                    result += processBuffer();
                    startNewMode(new_mode, lexeme);
                    return new_mode.returnBegin ? 0 : lexeme.length;
                }

                var end_mode = endOfMode(top, lexeme);
                if (end_mode) {
                    var origin = top;
                    if (!(origin.returnEnd || origin.excludeEnd)) {
                        mode_buffer += lexeme;
                    }
                    result += processBuffer();
                    do {
                        if (top.className) {
                            result += '</span>';
                        }
                        relevance += top.relevance;
                        top = top.parent;
                    }
                    while (top != end_mode.parent);
                    if (origin.excludeEnd) {
                        result += escape(lexeme);
                    }
                    mode_buffer = '';
                    if (end_mode.starts) {
                        startNewMode(end_mode.starts, '');
                    }
                    return origin.returnEnd ? 0 : lexeme.length;
                }

                if (isIllegal(lexeme, top))
                    throw new Error('Illegal lexeme "' + lexeme + '" for mode "' + (top.className || '<unnamed>') + '"');

                /*
                      Parser should not reach this point as all types of lexemes should be caught
                      earlier, but if it does due to some bug make sure it advances at least one
                      character forward to prevent infinite looping.
                      */
                mode_buffer += lexeme;
                return lexeme.length || 1;
            }

            var language = getLanguage(name);
            if (!language) {
                throw new Error('Unknown language: "' + name + '"');
            }

            compileLanguage(language);
            var top = continuation || language;
            var continuations = {}; // keep continuations for sub-languages
            var result = '', current;
            for (current = top; current != language; current = current.parent) {
                if (current.className) {
                    result = buildSpan(current.className, '', true) + result;
                }
            }
            var mode_buffer = '';
            var relevance = 0;
            try {
                var match, count, index = 0;
                while (true) {
                    top.terminators.lastIndex = index;
                    match = top.terminators.exec(value);
                    if (!match)
                        break;
                    count = processLexeme(value.substr(index, match.index - index), match[0]);
                    index = match.index + count;
                }
                processLexeme(value.substr(index));
                for (current = top; current.parent; current = current.parent) {
                    // close dangling modes
                    if (current.className) {
                        result += '</span>';
                    }
                }
                return {
                    relevance: relevance,
                    value: result,
                    language: name,
                    top: top
                };
            } catch (e) {
                if (e.message.indexOf('Illegal') != - 1) {
                    return {
                        relevance: 0,
                        value: escape(value)
                    };
                } else {
                    throw e;
                }
            }
        }

        /*
          Highlighting with language detection. Accepts a string with the code to
          highlight. Returns an object with the following properties:

          - language (detected language)
          - relevance (int)
          - value (an HTML string with highlighting markup)
          - second_best (object with the same structure for second-best heuristically
            detected language, may be absent)

          */
        function highlightAuto(text, languageSubset) {
            languageSubset = languageSubset || options.languages || Object.keys(languages);
            var result = {
                relevance: 0,
                value: escape(text)
            };
            var second_best = result;
            languageSubset.forEach(function(name) {
                if (!getLanguage(name)) {
                    return;
                }
                var current = highlight(name, text, false);
                current.language = name;
                if (current.relevance > second_best.relevance) {
                    second_best = current;
                }
                if (current.relevance > result.relevance) {
                    second_best = result;
                    result = current;
                }
            });
            if (second_best.language) {
                result.second_best = second_best;
            }
            return result;
        }

        /*
          Post-processing of the highlighted markup:

          - replace TABs with something more useful
          - replace real line-breaks with '<br>' for non-pre containers

          */
        function fixMarkup(value) {
            if (options.tabReplace) {
                value = value.replace(/^((<[^>]+>|\t)+)/gm, function(match, p1 /*..., offset, s*/
                ) {
                    return p1.replace(/\t/g, options.tabReplace);
                });
            }
            if (options.useBR) {
                value = value.replace(/\n/g, '<br>');
            }
            return value;
        }

        function buildClassName(prevClassName, currentLang, resultLang) {
            var language = currentLang ? aliases[currentLang] : resultLang,
            result = [prevClassName.trim()];

            if (!prevClassName.match(/\bhljs\b/)) {
                result.push('hljs');
            }

            if (prevClassName.indexOf(language) === - 1) {
                result.push(language);
            }

            return result.join(' ').trim();
        }

        /*
          Applies highlighting to a DOM node containing code. Accepts a DOM node and
          two optional parameters for fixMarkup.
          */
        function highlightBlock(block) {
            var language = blockLanguage(block);
            if (isNotHighlighted(language))
                return;

            var node;
            if (options.useBR) {
                node = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
                node.innerHTML = block.innerHTML.replace(/\n/g, '').replace(/<br[ \/]*>/g, '\n');
            } else {
                node = block;
            }
            var text = node.textContent;
            var result = language ? highlight(language, text, true) : highlightAuto(text);

            var originalStream = nodeStream(node);
            if (originalStream.length) {
                var resultNode = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
                resultNode.innerHTML = result.value;
                result.value = mergeStreams(originalStream, nodeStream(resultNode), text);
            }
            result.value = fixMarkup(result.value);

            block.innerHTML = result.value;
            block.className = buildClassName(block.className, language, result.language);
            block.result = {
                language: result.language,
                re: result.relevance
            };
            if (result.second_best) {
                block.second_best = {
                    language: result.second_best.language,
                    re: result.second_best.relevance
                };
            }
        }

        var options = {
            classPrefix: 'hljs-',
            tabReplace: null,
            useBR: false,
            languages: undefined
        };

        /*
          Updates highlight.js global options with values passed in the form of an object
          */
        function configure(user_options) {
            options = inherit(options, user_options);
        }

        /*
          Applies highlighting to all <pre><code>..</code></pre> blocks on a page.
          */
        function initHighlighting() {
            if (initHighlighting.called)
                return;
            initHighlighting.called = true;

            var blocks = document.querySelectorAll('pre code');
            Array.prototype.forEach.call(blocks, highlightBlock);
        }

        /*
          Attaches highlighting to the page load event.
          */
        function initHighlightingOnLoad() {
            addEventListener('DOMContentLoaded', initHighlighting, false);
            addEventListener('load', initHighlighting, false);
        }

        var languages = {};
        var aliases = {};

        function registerLanguage(name, language) {
            var lang = languages[name] = language(hljs);
            if (lang.aliases) {
                lang.aliases.forEach(function(alias) {
                    aliases[alias] = name;
                });
            }
        }

        function listLanguages() {
            return Object.keys(languages);
        }

        function getLanguage(name) {
            name = name.toLowerCase();
            return languages[name] || languages[aliases[name]];
        }

        /* Interface definition */

        hljs.highlight = highlight;
        hljs.highlightAuto = highlightAuto;
        hljs.fixMarkup = fixMarkup;
        hljs.highlightBlock = highlightBlock;
        hljs.configure = configure;
        hljs.initHighlighting = initHighlighting;
        hljs.initHighlightingOnLoad = initHighlightingOnLoad;
        hljs.registerLanguage = registerLanguage;
        hljs.listLanguages = listLanguages;
        hljs.getLanguage = getLanguage;
        hljs.inherit = inherit;

        // Common regexps
        hljs.IDENT_RE = '[a-zA-Z]\\w*';
        hljs.UNDERSCORE_IDENT_RE = '[a-zA-Z_]\\w*';
        hljs.NUMBER_RE = '\\b\\d+(\\.\\d+)?';
        hljs.C_NUMBER_RE = '(\\b0[xX][a-fA-F0-9]+|(\\b\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)'; // 0x..., 0..., decimal, float
        hljs.BINARY_NUMBER_RE = '\\b(0b[01]+)'; // 0b...
        hljs.RE_STARTERS_RE = '!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|-|-=|/=|/|:|;|<<|<<=|<=|<|===|==|=|>>>=|>>=|>=|>>>|>>|>|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~';

        // Common modes
        hljs.BACKSLASH_ESCAPE = {
            begin: '\\\\[\\s\\S]',
            relevance: 0
        };
        hljs.APOS_STRING_MODE = {
            className: 'string',
            begin: '\'',
            end: '\'',
            illegal: '\\n',
            contains: [hljs.BACKSLASH_ESCAPE]
        };
        hljs.QUOTE_STRING_MODE = {
            className: 'string',
            begin: '"',
            end: '"',
            illegal: '\\n',
            contains: [hljs.BACKSLASH_ESCAPE]
        };
        hljs.PHRASAL_WORDS_MODE = {
            begin: /\b(a|an|the|are|I|I'm|isn't|don't|doesn't|won't|but|just|should|pretty|simply|enough|gonna|going|wtf|so|such)\b/
        };
        hljs.COMMENT = function (begin, end, inherits) {
            var mode = hljs.inherit(
            {
                className: 'comment',
                begin: begin,
                end: end,
                contains: []
            },
            inherits || {});
            mode.contains.push(hljs.PHRASAL_WORDS_MODE);
            mode.contains.push({
                className: 'doctag',
                begin: "(?:TODO|FIXME|NOTE|BUG|XXX):",
                relevance: 0
            });
            return mode;
        };
        hljs.C_LINE_COMMENT_MODE = hljs.COMMENT('//', '$');
        hljs.C_BLOCK_COMMENT_MODE = hljs.COMMENT('/\\*', '\\*/');
        hljs.HASH_COMMENT_MODE = hljs.COMMENT('#', '$');
        hljs.NUMBER_MODE = {
            className: 'number',
            begin: hljs.NUMBER_RE,
            relevance: 0
        };
        hljs.C_NUMBER_MODE = {
            className: 'number',
            begin: hljs.C_NUMBER_RE,
            relevance: 0
        };
        hljs.BINARY_NUMBER_MODE = {
            className: 'number',
            begin: hljs.BINARY_NUMBER_RE,
            relevance: 0
        };
        hljs.CSS_NUMBER_MODE = {
            className: 'number',
            begin: hljs.NUMBER_RE + '(' +
            '%|em|ex|ch|rem' +
            '|vw|vh|vmin|vmax' +
            '|cm|mm|in|pt|pc|px' +
            '|deg|grad|rad|turn' +
            '|s|ms' +
            '|Hz|kHz' +
            '|dpi|dpcm|dppx' +
            ')?',
            relevance: 0
        };
        hljs.REGEXP_MODE = {
            className: 'regexp',
            begin: /\//,
            end: /\/[gimuy]*/,
            illegal: /\n/,
            contains: [
            hljs.BACKSLASH_ESCAPE,
            {
                begin: /\[/,
                end: /\]/,
                relevance: 0,
                contains: [hljs.BACKSLASH_ESCAPE]
            }
            ]
        };
        hljs.TITLE_MODE = {
            className: 'title',
            begin: hljs.IDENT_RE,
            relevance: 0
        };
        hljs.UNDERSCORE_TITLE_MODE = {
            className: 'title',
            begin: hljs.UNDERSCORE_IDENT_RE,
            relevance: 0
        };

        return hljs;
    }));

}, {}
],
39: [function(require, module, exports) {
    var hljs = require('./highlight');

    hljs.registerLanguage('1c', require('./languages/1c'));
    hljs.registerLanguage('accesslog', require('./languages/accesslog'));
    hljs.registerLanguage('actionscript', require('./languages/actionscript'));
    hljs.registerLanguage('apache', require('./languages/apache'));
    hljs.registerLanguage('applescript', require('./languages/applescript'));
    hljs.registerLanguage('armasm', require('./languages/armasm'));
    hljs.registerLanguage('xml', require('./languages/xml'));
    hljs.registerLanguage('asciidoc', require('./languages/asciidoc'));
    hljs.registerLanguage('aspectj', require('./languages/aspectj'));
    hljs.registerLanguage('autohotkey', require('./languages/autohotkey'));
    hljs.registerLanguage('autoit', require('./languages/autoit'));
    hljs.registerLanguage('avrasm', require('./languages/avrasm'));
    hljs.registerLanguage('axapta', require('./languages/axapta'));
    hljs.registerLanguage('bash', require('./languages/bash'));
    hljs.registerLanguage('brainfuck', require('./languages/brainfuck'));
    hljs.registerLanguage('cal', require('./languages/cal'));
    hljs.registerLanguage('capnproto', require('./languages/capnproto'));
    hljs.registerLanguage('ceylon', require('./languages/ceylon'));
    hljs.registerLanguage('clojure', require('./languages/clojure'));
    hljs.registerLanguage('clojure-repl', require('./languages/clojure-repl'));
    hljs.registerLanguage('cmake', require('./languages/cmake'));
    hljs.registerLanguage('coffeescript', require('./languages/coffeescript'));
    hljs.registerLanguage('cpp', require('./languages/cpp'));
    hljs.registerLanguage('crystal', require('./languages/crystal'));
    hljs.registerLanguage('cs', require('./languages/cs'));
    hljs.registerLanguage('css', require('./languages/css'));
    hljs.registerLanguage('d', require('./languages/d'));
    hljs.registerLanguage('markdown', require('./languages/markdown'));
    hljs.registerLanguage('dart', require('./languages/dart'));
    hljs.registerLanguage('delphi', require('./languages/delphi'));
    hljs.registerLanguage('diff', require('./languages/diff'));
    hljs.registerLanguage('django', require('./languages/django'));
    hljs.registerLanguage('dns', require('./languages/dns'));
    hljs.registerLanguage('dockerfile', require('./languages/dockerfile'));
    hljs.registerLanguage('dos', require('./languages/dos'));
    hljs.registerLanguage('dust', require('./languages/dust'));
    hljs.registerLanguage('elixir', require('./languages/elixir'));
    hljs.registerLanguage('elm', require('./languages/elm'));
    hljs.registerLanguage('ruby', require('./languages/ruby'));
    hljs.registerLanguage('erb', require('./languages/erb'));
    hljs.registerLanguage('erlang-repl', require('./languages/erlang-repl'));
    hljs.registerLanguage('erlang', require('./languages/erlang'));
    hljs.registerLanguage('fix', require('./languages/fix'));
    hljs.registerLanguage('fortran', require('./languages/fortran'));
    hljs.registerLanguage('fsharp', require('./languages/fsharp'));
    hljs.registerLanguage('gams', require('./languages/gams'));
    hljs.registerLanguage('gcode', require('./languages/gcode'));
    hljs.registerLanguage('gherkin', require('./languages/gherkin'));
    hljs.registerLanguage('glsl', require('./languages/glsl'));
    hljs.registerLanguage('go', require('./languages/go'));
    hljs.registerLanguage('golo', require('./languages/golo'));
    hljs.registerLanguage('gradle', require('./languages/gradle'));
    hljs.registerLanguage('groovy', require('./languages/groovy'));
    hljs.registerLanguage('haml', require('./languages/haml'));
    hljs.registerLanguage('handlebars', require('./languages/handlebars'));
    hljs.registerLanguage('haskell', require('./languages/haskell'));
    hljs.registerLanguage('haxe', require('./languages/haxe'));
    hljs.registerLanguage('http', require('./languages/http'));
    hljs.registerLanguage('inform7', require('./languages/inform7'));
    hljs.registerLanguage('ini', require('./languages/ini'));
    hljs.registerLanguage('irpf90', require('./languages/irpf90'));
    hljs.registerLanguage('java', require('./languages/java'));
    hljs.registerLanguage('javascript', require('./languages/javascript'));
    hljs.registerLanguage('json', require('./languages/json'));
    hljs.registerLanguage('julia', require('./languages/julia'));
    hljs.registerLanguage('kotlin', require('./languages/kotlin'));
    hljs.registerLanguage('lasso', require('./languages/lasso'));
    hljs.registerLanguage('less', require('./languages/less'));
    hljs.registerLanguage('lisp', require('./languages/lisp'));
    hljs.registerLanguage('livecodeserver', require('./languages/livecodeserver'));
    hljs.registerLanguage('livescript', require('./languages/livescript'));
    hljs.registerLanguage('lua', require('./languages/lua'));
    hljs.registerLanguage('makefile', require('./languages/makefile'));
    hljs.registerLanguage('mathematica', require('./languages/mathematica'));
    hljs.registerLanguage('matlab', require('./languages/matlab'));
    hljs.registerLanguage('mel', require('./languages/mel'));
    hljs.registerLanguage('mercury', require('./languages/mercury'));
    hljs.registerLanguage('mizar', require('./languages/mizar'));
    hljs.registerLanguage('perl', require('./languages/perl'));
    hljs.registerLanguage('mojolicious', require('./languages/mojolicious'));
    hljs.registerLanguage('monkey', require('./languages/monkey'));
    hljs.registerLanguage('nginx', require('./languages/nginx'));
    hljs.registerLanguage('nimrod', require('./languages/nimrod'));
    hljs.registerLanguage('nix', require('./languages/nix'));
    hljs.registerLanguage('nsis', require('./languages/nsis'));
    hljs.registerLanguage('objectivec', require('./languages/objectivec'));
    hljs.registerLanguage('ocaml', require('./languages/ocaml'));
    hljs.registerLanguage('openscad', require('./languages/openscad'));
    hljs.registerLanguage('oxygene', require('./languages/oxygene'));
    hljs.registerLanguage('parser3', require('./languages/parser3'));
    hljs.registerLanguage('pf', require('./languages/pf'));
    hljs.registerLanguage('php', require('./languages/php'));
    hljs.registerLanguage('powershell', require('./languages/powershell'));
    hljs.registerLanguage('processing', require('./languages/processing'));
    hljs.registerLanguage('profile', require('./languages/profile'));
    hljs.registerLanguage('prolog', require('./languages/prolog'));
    hljs.registerLanguage('protobuf', require('./languages/protobuf'));
    hljs.registerLanguage('puppet', require('./languages/puppet'));
    hljs.registerLanguage('python', require('./languages/python'));
    hljs.registerLanguage('q', require('./languages/q'));
    hljs.registerLanguage('r', require('./languages/r'));
    hljs.registerLanguage('rib', require('./languages/rib'));
    hljs.registerLanguage('roboconf', require('./languages/roboconf'));
    hljs.registerLanguage('rsl', require('./languages/rsl'));
    hljs.registerLanguage('ruleslanguage', require('./languages/ruleslanguage'));
    hljs.registerLanguage('rust', require('./languages/rust'));
    hljs.registerLanguage('scala', require('./languages/scala'));
    hljs.registerLanguage('scheme', require('./languages/scheme'));
    hljs.registerLanguage('scilab', require('./languages/scilab'));
    hljs.registerLanguage('scss', require('./languages/scss'));
    hljs.registerLanguage('smali', require('./languages/smali'));
    hljs.registerLanguage('smalltalk', require('./languages/smalltalk'));
    hljs.registerLanguage('sml', require('./languages/sml'));
    hljs.registerLanguage('sql', require('./languages/sql'));
    hljs.registerLanguage('stata', require('./languages/stata'));
    hljs.registerLanguage('step21', require('./languages/step21'));
    hljs.registerLanguage('stylus', require('./languages/stylus'));
    hljs.registerLanguage('swift', require('./languages/swift'));
    hljs.registerLanguage('tcl', require('./languages/tcl'));
    hljs.registerLanguage('tex', require('./languages/tex'));
    hljs.registerLanguage('thrift', require('./languages/thrift'));
    hljs.registerLanguage('tp', require('./languages/tp'));
    hljs.registerLanguage('twig', require('./languages/twig'));
    hljs.registerLanguage('typescript', require('./languages/typescript'));
    hljs.registerLanguage('vala', require('./languages/vala'));
    hljs.registerLanguage('vbnet', require('./languages/vbnet'));
    hljs.registerLanguage('vbscript', require('./languages/vbscript'));
    hljs.registerLanguage('vbscript-html', require('./languages/vbscript-html'));
    hljs.registerLanguage('verilog', require('./languages/verilog'));
    hljs.registerLanguage('vhdl', require('./languages/vhdl'));
    hljs.registerLanguage('vim', require('./languages/vim'));
    hljs.registerLanguage('x86asm', require('./languages/x86asm'));
    hljs.registerLanguage('xl', require('./languages/xl'));
    hljs.registerLanguage('xquery', require('./languages/xquery'));
    hljs.registerLanguage('zephir', require('./languages/zephir'));

    module.exports = hljs;
}, {
    "./highlight": 38,
    "./languages/1c": 40,
    "./languages/accesslog": 41,
    "./languages/actionscript": 42,
    "./languages/apache": 43,
    "./languages/applescript": 44,
    "./languages/armasm": 45,
    "./languages/asciidoc": 46,
    "./languages/aspectj": 47,
    "./languages/autohotkey": 48,
    "./languages/autoit": 49,
    "./languages/avrasm": 50,
    "./languages/axapta": 51,
    "./languages/bash": 52,
    "./languages/brainfuck": 53,
    "./languages/cal": 54,
    "./languages/capnproto": 55,
    "./languages/ceylon": 56,
    "./languages/clojure": 58,
    "./languages/clojure-repl": 57,
    "./languages/cmake": 59,
    "./languages/coffeescript": 60,
    "./languages/cpp": 61,
    "./languages/crystal": 62,
    "./languages/cs": 63,
    "./languages/css": 64,
    "./languages/d": 65,
    "./languages/dart": 66,
    "./languages/delphi": 67,
    "./languages/diff": 68,
    "./languages/django": 69,
    "./languages/dns": 70,
    "./languages/dockerfile": 71,
    "./languages/dos": 72,
    "./languages/dust": 73,
    "./languages/elixir": 74,
    "./languages/elm": 75,
    "./languages/erb": 76,
    "./languages/erlang": 78,
    "./languages/erlang-repl": 77,
    "./languages/fix": 79,
    "./languages/fortran": 80,
    "./languages/fsharp": 81,
    "./languages/gams": 82,
    "./languages/gcode": 83,
    "./languages/gherkin": 84,
    "./languages/glsl": 85,
    "./languages/go": 86,
    "./languages/golo": 87,
    "./languages/gradle": 88,
    "./languages/groovy": 89,
    "./languages/haml": 90,
    "./languages/handlebars": 91,
    "./languages/haskell": 92,
    "./languages/haxe": 93,
    "./languages/http": 94,
    "./languages/inform7": 95,
    "./languages/ini": 96,
    "./languages/irpf90": 97,
    "./languages/java": 98,
    "./languages/javascript": 99,
    "./languages/json": 100,
    "./languages/julia": 101,
    "./languages/kotlin": 102,
    "./languages/lasso": 103,
    "./languages/less": 104,
    "./languages/lisp": 105,
    "./languages/livecodeserver": 106,
    "./languages/livescript": 107,
    "./languages/lua": 108,
    "./languages/makefile": 109,
    "./languages/markdown": 110,
    "./languages/mathematica": 111,
    "./languages/matlab": 112,
    "./languages/mel": 113,
    "./languages/mercury": 114,
    "./languages/mizar": 115,
    "./languages/mojolicious": 116,
    "./languages/monkey": 117,
    "./languages/nginx": 118,
    "./languages/nimrod": 119,
    "./languages/nix": 120,
    "./languages/nsis": 121,
    "./languages/objectivec": 122,
    "./languages/ocaml": 123,
    "./languages/openscad": 124,
    "./languages/oxygene": 125,
    "./languages/parser3": 126,
    "./languages/perl": 127,
    "./languages/pf": 128,
    "./languages/php": 129,
    "./languages/powershell": 130,
    "./languages/processing": 131,
    "./languages/profile": 132,
    "./languages/prolog": 133,
    "./languages/protobuf": 134,
    "./languages/puppet": 135,
    "./languages/python": 136,
    "./languages/q": 137,
    "./languages/r": 138,
    "./languages/rib": 139,
    "./languages/roboconf": 140,
    "./languages/rsl": 141,
    "./languages/ruby": 142,
    "./languages/ruleslanguage": 143,
    "./languages/rust": 144,
    "./languages/scala": 145,
    "./languages/scheme": 146,
    "./languages/scilab": 147,
    "./languages/scss": 148,
    "./languages/smali": 149,
    "./languages/smalltalk": 150,
    "./languages/sml": 151,
    "./languages/sql": 152,
    "./languages/stata": 153,
    "./languages/step21": 154,
    "./languages/stylus": 155,
    "./languages/swift": 156,
    "./languages/tcl": 157,
    "./languages/tex": 158,
    "./languages/thrift": 159,
    "./languages/tp": 160,
    "./languages/twig": 161,
    "./languages/typescript": 162,
    "./languages/vala": 163,
    "./languages/vbnet": 164,
    "./languages/vbscript": 166,
    "./languages/vbscript-html": 165,
    "./languages/verilog": 167,
    "./languages/vhdl": 168,
    "./languages/vim": 169,
    "./languages/x86asm": 170,
    "./languages/xl": 171,
    "./languages/xml": 172,
    "./languages/xquery": 173,
    "./languages/zephir": 174
}
],
40: [function(require, module, exports) {
    module.exports = function(hljs) {
        var IDENT_RE_RU = '[a-zA-Zа-яА-Я][a-zA-Z0-9_а-яА-Я]*';
        var OneS_KEYWORDS = 'возврат дата для если и или иначе иначеесли исключение конецесли ' +
        'конецпопытки конецпроцедуры конецфункции конеццикла константа не перейти перем ' +
        'перечисление по пока попытка прервать продолжить процедура строка тогда фс функция цикл ' +
        'число экспорт';
        var OneS_BUILT_IN = 'ansitooem oemtoansi ввестивидсубконто ввестидату ввестизначение ' +
        'ввестиперечисление ввестипериод ввестиплансчетов ввестистроку ввестичисло вопрос ' +
        'восстановитьзначение врег выбранныйплансчетов вызватьисключение датагод датамесяц ' +
        'датачисло добавитьмесяц завершитьработусистемы заголовоксистемы записьжурналарегистрации ' +
        'запуститьприложение зафиксироватьтранзакцию значениевстроку значениевстрокувнутр ' +
        'значениевфайл значениеизстроки значениеизстрокивнутр значениеизфайла имякомпьютера ' +
        'имяпользователя каталогвременныхфайлов каталогиб каталогпользователя каталогпрограммы ' +
        'кодсимв командасистемы конгода конецпериодаби конецрассчитанногопериодаби ' +
        'конецстандартногоинтервала конквартала конмесяца коннедели лев лог лог10 макс ' +
        'максимальноеколичествосубконто мин монопольныйрежим названиеинтерфейса названиенабораправ ' +
        'назначитьвид назначитьсчет найти найтипомеченныенаудаление найтиссылки началопериодаби ' +
        'началостандартногоинтервала начатьтранзакцию начгода начквартала начмесяца начнедели ' +
        'номерднягода номерднянедели номернеделигода нрег обработкаожидания окр описаниеошибки ' +
        'основнойжурналрасчетов основнойплансчетов основнойязык открытьформу открытьформумодально ' +
        'отменитьтранзакцию очиститьокносообщений периодстр полноеимяпользователя получитьвремята ' +
        'получитьдатута получитьдокументта получитьзначенияотбора получитьпозициюта ' +
        'получитьпустоезначение получитьта прав праводоступа предупреждение префиксавтонумерации ' +
        'пустаястрока пустоезначение рабочаядаттьпустоезначение рабочаядата разделительстраниц ' +
        'разделительстрок разм разобратьпозициюдокумента рассчитатьрегистрына ' +
        'рассчитатьрегистрыпо сигнал симв символтабуляции создатьобъект сокрл сокрлп сокрп ' +
        'сообщить состояние сохранитьзначение сред статусвозврата стрдлина стрзаменить ' +
        'стрколичествострок стрполучитьстроку  стрчисловхождений сформироватьпозициюдокумента ' +
        'счетпокоду текущаядата текущеевремя типзначения типзначениястр удалитьобъекты ' +
        'установитьтана установитьтапо фиксшаблон формат цел шаблон';
        var DQUOTE = {
            className: 'dquote',
            begin: '""'
        };
        var STR_START = {
            className: 'string',
            begin: '"',
            end: '"|$',
            contains: [DQUOTE]
        };
        var STR_CONT = {
            className: 'string',
            begin: '\\|',
            end: '"|$',
            contains: [DQUOTE]
        };

        return {
            case_insensitive: true,
            lexemes: IDENT_RE_RU,
            keywords: {
                keyword: OneS_KEYWORDS,
                built_in: OneS_BUILT_IN
            },
            contains: [
            hljs.C_LINE_COMMENT_MODE,
            hljs.NUMBER_MODE,
            STR_START, STR_CONT,
            {
                className: 'function',
                begin: '(процедура|функция)',
                end: '$',
                lexemes: IDENT_RE_RU,
                keywords: 'процедура функция',
                contains: [
                hljs.inherit(hljs.TITLE_MODE, {
                    begin: IDENT_RE_RU
                }),
                {
                    className: 'tail',
                    endsWithParent: true,
                    contains: [
                    {
                        className: 'params',
                        begin: '\\(',
                        end: '\\)',
                        lexemes: IDENT_RE_RU,
                        keywords: 'знач',
                        contains: [STR_START, STR_CONT]
                    },
                    {
                        className: 'export',
                        begin: 'экспорт',
                        endsWithParent: true,
                        lexemes: IDENT_RE_RU,
                        keywords: 'экспорт',
                        contains: [hljs.C_LINE_COMMENT_MODE]
                    }
                    ]
                },
                hljs.C_LINE_COMMENT_MODE
                ]
            },
            {
                className: 'preprocessor',
                begin: '#',
                end: '$'
            },
            {
                className: 'date',
                begin: '\'\\d{2}\\.\\d{2}\\.(\\d{2}|\\d{4})\''
            }
            ]
        };
    };
}, {}
],
41: [function(require, module, exports) {
    module.exports = function(hljs) {
        return {
            contains: [
            // IP
            {
                className: 'number',
                begin: '\\b\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}(:\\d{1,5})?\\b'
            },
            // Other numbers
            {
                className: 'number',
                begin: '\\b\\d+\\b',
                relevance: 0
            },
            // Requests
            {
                className: 'string',
                begin: '"(GET|POST|HEAD|PUT|DELETE|CONNECT|OPTIONS|PATCH|TRACE)',
                end: '"',
                keywords: 'GET POST HEAD PUT DELETE CONNECT OPTIONS PATCH TRACE',
                illegal: '\\n',
                relevance: 10
            },
            // Dates
            {
                className: 'string',
                begin: /\[/,
                end: /\]/,
                illegal: '\\n'
            },
            // Strings
            {
                className: 'string',
                begin: '"',
                end: '"',
                illegal: '\\n'
            }
            ]
        };
    };
}, {}
],
42: [function(require, module, exports) {
    module.exports = function(hljs) {
        var IDENT_RE = '[a-zA-Z_$][a-zA-Z0-9_$]*';
        var IDENT_FUNC_RETURN_TYPE_RE = '([*]|[a-zA-Z_$][a-zA-Z0-9_$]*)';

        var AS3_REST_ARG_MODE = {
            className: 'rest_arg',
            begin: '[.]{3}',
            end: IDENT_RE,
            relevance: 10
        };

        return {
            aliases: ['as'],
            keywords: {
                keyword: 'as break case catch class const continue default delete do dynamic each ' +
                'else extends final finally for function get if implements import in include ' +
                'instanceof interface internal is namespace native new override package private ' +
                'protected public return set static super switch this throw try typeof use var void ' +
                'while with',
                literal: 'true false null undefined'
            },
            contains: [
            hljs.APOS_STRING_MODE,
            hljs.QUOTE_STRING_MODE,
            hljs.C_LINE_COMMENT_MODE,
            hljs.C_BLOCK_COMMENT_MODE,
            hljs.C_NUMBER_MODE,
            {
                className: 'package',
                beginKeywords: 'package',
                end: '{',
                contains: [hljs.TITLE_MODE]
            },
            {
                className: 'class',
                beginKeywords: 'class interface',
                end: '{',
                excludeEnd: true,
                contains: [
                {
                    beginKeywords: 'extends implements'
                },
                hljs.TITLE_MODE
                ]
            },
            {
                className: 'preprocessor',
                beginKeywords: 'import include',
                end: ';'
            },
            {
                className: 'function',
                beginKeywords: 'function',
                end: '[{;]',
                excludeEnd: true,
                illegal: '\\S',
                contains: [
                hljs.TITLE_MODE,
                {
                    className: 'params',
                    begin: '\\(',
                    end: '\\)',
                    contains: [
                    hljs.APOS_STRING_MODE,
                    hljs.QUOTE_STRING_MODE,
                    hljs.C_LINE_COMMENT_MODE,
                    hljs.C_BLOCK_COMMENT_MODE,
                    AS3_REST_ARG_MODE
                    ]
                },
                {
                    className: 'type',
                    begin: ':',
                    end: IDENT_FUNC_RETURN_TYPE_RE,
                    relevance: 10
                }
                ]
            }
            ],
            illegal: /#/
        };
    };
}, {}
],
43: [function(require, module, exports) {
    module.exports = function(hljs) {
        var NUMBER = {
            className: 'number',
            begin: '[\\$%]\\d+'
        };
        return {
            aliases: ['apacheconf'],
            case_insensitive: true,
            contains: [
            hljs.HASH_COMMENT_MODE,
            {
                className: 'tag',
                begin: '</?',
                end: '>'
            },
            {
                className: 'keyword',
                begin: /\w+/,
                relevance: 0,
                // keywords aren’t needed for highlighting per se, they only boost relevance
                // for a very generally defined mode (starts with a word, ends with line-end
                keywords: {
                    common:
                    'order deny allow setenv rewriterule rewriteengine rewritecond documentroot ' +
                    'sethandler errordocument loadmodule options header listen serverroot ' +
                    'servername'
                },
                starts: {
                    end: /$/,
                    relevance: 0,
                    keywords: {
                        literal: 'on off all'
                    },
                    contains: [
                    {
                        className: 'sqbracket',
                        begin: '\\s\\[',
                        end: '\\]$'
                    },
                    {
                        className: 'cbracket',
                        begin: '[\\$%]\\{',
                        end: '\\}',
                        contains: ['self', NUMBER]
                    },
                    NUMBER,
                    hljs.QUOTE_STRING_MODE
                    ]
                }
            }
            ],
            illegal: /\S/
        };
    };
}, {}
],
44: [function(require, module, exports) {
    module.exports = function(hljs) {
        var STRING = hljs.inherit(hljs.QUOTE_STRING_MODE, {
            illegal: ''
        });
        var PARAMS = {
            className: 'params',
            begin: '\\(',
            end: '\\)',
            contains: ['self', hljs.C_NUMBER_MODE, STRING]
        };
        var COMMENT_MODE_1 = hljs.COMMENT('--', '$');
        var COMMENT_MODE_2 = hljs.COMMENT(
        '\\(\\*',
        '\\*\\)',
        {
            contains: ['self', COMMENT_MODE_1] //allow nesting
        });
        var COMMENTS = [
        COMMENT_MODE_1,
        COMMENT_MODE_2,
        hljs.HASH_COMMENT_MODE
        ];

        return {
            aliases: ['osascript'],
            keywords: {
                keyword:
                'about above after against and around as at back before beginning ' +
                'behind below beneath beside between but by considering ' +
                'contain contains continue copy div does eighth else end equal ' +
                'equals error every exit fifth first for fourth from front ' +
                'get given global if ignoring in into is it its last local me ' +
                'middle mod my ninth not of on onto or over prop property put ref ' +
                'reference repeat returning script second set seventh since ' +
                'sixth some tell tenth that the|0 then third through thru ' +
                'timeout times to transaction try until where while whose with ' +
                'without',
                constant:
                'AppleScript false linefeed return pi quote result space tab true',
                type:
                'alias application boolean class constant date file integer list ' +
                'number real record string text',
                command:
                'activate beep count delay launch log offset read round ' +
                'run say summarize write',
                property:
                'character characters contents day frontmost id item length ' +
                'month name paragraph paragraphs rest reverse running time version ' +
                'weekday word words year'
            },
            contains: [
            STRING,
            hljs.C_NUMBER_MODE,
            {
                className: 'type',
                begin: '\\bPOSIX file\\b'
            },
            {
                className: 'command',
                begin:
                '\\b(clipboard info|the clipboard|info for|list (disks|folder)|' +
                'mount volume|path to|(close|open for) access|(get|set) eof|' +
                'current date|do shell script|get volume settings|random number|' +
                'set volume|system attribute|system info|time to GMT|' +
                '(load|run|store) script|scripting components|' +
                'ASCII (character|number)|localized string|' +
                'choose (application|color|file|file name|' +
                'folder|from list|remote application|URL)|' +
                'display (alert|dialog))\\b|^\\s*return\\b'
            },
            {
                className: 'constant',
                begin:
                '\\b(text item delimiters|current application|missing value)\\b'
            },
            {
                className: 'keyword',
                begin:
                '\\b(apart from|aside from|instead of|out of|greater than|' +
                "isn't|(doesn't|does not) (equal|come before|come after|contain)|" +
                '(greater|less) than( or equal)?|(starts?|ends|begins?) with|' +
                'contained by|comes (before|after)|a (ref|reference))\\b'
            },
            {
                className: 'property',
                begin:
                '\\b(POSIX path|(date|time) string|quoted form)\\b'
            },
            {
                className: 'function_start',
                beginKeywords: 'on',
                illegal: '[${=;\\n]',
                contains: [hljs.UNDERSCORE_TITLE_MODE, PARAMS]
            }
            ].concat(COMMENTS),
            illegal: '//|->|=>|\\[\\['
        };
    };
}, {}
],
45: [function(require, module, exports) {
    module.exports = function(hljs) {
        //local labels: %?[FB]?[AT]?\d{1,2}\w+
        return {
            case_insensitive: true,
            aliases: ['arm'],
            lexemes: '\\.?' + hljs.IDENT_RE,
            keywords: {
                literal:
                'r0 r1 r2 r3 r4 r5 r6 r7 r8 r9 r10 r11 r12 r13 r14 r15 ' + //standard registers
                'pc lr sp ip sl sb fp ' + //typical regs plus backward compatibility
                'a1 a2 a3 a4 v1 v2 v3 v4 v5 v6 v7 v8 f0 f1 f2 f3 f4 f5 f6 f7 ' + //more regs and fp
                'p0 p1 p2 p3 p4 p5 p6 p7 p8 p9 p10 p11 p12 p13 p14 p15 ' + //coprocessor regs
                'c0 c1 c2 c3 c4 c5 c6 c7 c8 c9 c10 c11 c12 c13 c14 c15 ' + //more coproc
                'q0 q1 q2 q3 q4 q5 q6 q7 q8 q9 q10 q11 q12 q13 q14 q15 ' + //advanced SIMD NEON regs

                //program status registers
                'cpsr_c cpsr_x cpsr_s cpsr_f cpsr_cx cpsr_cxs cpsr_xs cpsr_xsf cpsr_sf cpsr_cxsf ' +
                'spsr_c spsr_x spsr_s spsr_f spsr_cx spsr_cxs spsr_xs spsr_xsf spsr_sf spsr_cxsf ' +
                //NEON and VFP registers
                's0 s1 s2 s3 s4 s5 s6 s7 s8 s9 s10 s11 s12 s13 s14 s15 ' +
                's16 s17 s18 s19 s20 s21 s22 s23 s24 s25 s26 s27 s28 s29 s30 s31 ' +
                'd0 d1 d2 d3 d4 d5 d6 d7 d8 d9 d10 d11 d12 d13 d14 d15 ' +
                'd16 d17 d18 d19 d20 d21 d22 d23 d24 d25 d26 d27 d28 d29 d30 d31 ',
                preprocessor:
                //GNU preprocs
                '.2byte .4byte .align .ascii .asciz .balign .byte .code .data .else .end .endif .endm .endr .equ .err .exitm .extern .global .hword .if .ifdef .ifndef .include .irp .long .macro .rept .req .section .set .skip .space .text .word .arm .thumb .code16 .code32 .force_thumb .thumb_func .ltorg ' +
                //ARM directives
                'ALIAS ALIGN ARM AREA ASSERT ATTR CN CODE CODE16 CODE32 COMMON CP DATA DCB DCD DCDU DCDO DCFD DCFDU DCI DCQ DCQU DCW DCWU DN ELIF ELSE END ENDFUNC ENDIF ENDP ENTRY EQU EXPORT EXPORTAS EXTERN FIELD FILL FUNCTION GBLA GBLL GBLS GET GLOBAL IF IMPORT INCBIN INCLUDE INFO KEEP LCLA LCLL LCLS LTORG MACRO MAP MEND MEXIT NOFP OPT PRESERVE8 PROC QN READONLY RELOC REQUIRE REQUIRE8 RLIST FN ROUT SETA SETL SETS SN SPACE SUBT THUMB THUMBX TTL WHILE WEND ',
                built_in:
                '{PC} {VAR} {TRUE} {FALSE} {OPT} {CONFIG} {ENDIAN} {CODESIZE} {CPU} {FPU} {ARCHITECTURE} {PCSTOREOFFSET} {ARMASM_VERSION} {INTER} {ROPI} {RWPI} {SWST} {NOSWST} . @ '
            },
            contains: [
            {
                className: 'keyword',
                begin: '\\b(' + //mnemonics
                'adc|' +
                '(qd?|sh?|u[qh]?)?add(8|16)?|usada?8|(q|sh?|u[qh]?)?(as|sa)x|' +
                'and|adrl?|sbc|rs[bc]|asr|b[lx]?|blx|bxj|cbn?z|tb[bh]|bic|' +
                'bfc|bfi|[su]bfx|bkpt|cdp2?|clz|clrex|cmp|cmn|cpsi[ed]|cps|' +
                'setend|dbg|dmb|dsb|eor|isb|it[te]{0,3}|lsl|lsr|ror|rrx|' +
                'ldm(([id][ab])|f[ds])?|ldr((s|ex)?[bhd])?|movt?|mvn|mra|mar|' +
                'mul|[us]mull|smul[bwt][bt]|smu[as]d|smmul|smmla|' +
                'mla|umlaal|smlal?([wbt][bt]|d)|mls|smlsl?[ds]|smc|svc|sev|' +
                'mia([bt]{2}|ph)?|mrr?c2?|mcrr2?|mrs|msr|orr|orn|pkh(tb|bt)|rbit|' +
                'rev(16|sh)?|sel|[su]sat(16)?|nop|pop|push|rfe([id][ab])?|' +
                'stm([id][ab])?|str(ex)?[bhd]?|(qd?)?sub|(sh?|q|u[qh]?)?sub(8|16)|' +
                '[su]xt(a?h|a?b(16)?)|srs([id][ab])?|swpb?|swi|smi|tst|teq|' +
                'wfe|wfi|yield' +
                ')' +
                '(eq|ne|cs|cc|mi|pl|vs|vc|hi|ls|ge|lt|gt|le|al|hs|lo)?' + //condition codes
                '[sptrx]?' ,
                //legal postfixes
                end: '\\s'
            },
            hljs.COMMENT('[;@]', '$', {
                relevance: 0
            }),
            hljs.C_BLOCK_COMMENT_MODE,
            hljs.QUOTE_STRING_MODE,
            {
                className: 'string',
                begin: '\'',
                end: '[^\\\\]\'',
                relevance: 0
            },
            {
                className: 'title',
                begin: '\\|',
                end: '\\|',
                illegal: '\\n',
                relevance: 0
            },
            {
                className: 'number',
                variants: [
                {
                    begin: '[#$=]?0x[0-9a-f]+'
                }, //hex
                {
                    begin: '[#$=]?0b[01]+'
                }, //bin
                {
                    begin: '[#$=]\\d+'
                }, //literal
                {
                    begin: '\\b\\d+'
                }
                //bare number
                ],
                relevance: 0
            },
            {
                className: 'label',
                variants: [
                {
                    begin: '^[a-z_\\.\\$][a-z0-9_\\.\\$]+'
                }, //ARM syntax
                {
                    begin: '^\\s*[a-z_\\.\\$][a-z0-9_\\.\\$]+:'
                }, //GNU ARM syntax
                {
                    begin: '[=#]\\w+'
                }
                //label reference
                ],
                relevance: 0
            }
            ]
        };
    };
}, {}
],
46: [function(require, module, exports) {
    module.exports = function(hljs) {
        return {
            aliases: ['adoc'],
            contains: [
            // block comment
            hljs.COMMENT(
            '^/{4,}\\n',
            '\\n/{4,}$',
            // can also be done as...
            //'^/{4,}$',
            //'^/{4,}$',
            {
                relevance: 10
            }),
            // line comment
            hljs.COMMENT(
            '^//',
            '$',
            {
                relevance: 0
            }),
            // title
            {
                className: 'title',
                begin: '^\\.\\w.*$'
            },
            // example, admonition & sidebar blocks
            {
                begin: '^[=\\*]{4,}\\n',
                end: '\\n^[=\\*]{4,}$',
                relevance: 10
            },
            // headings
            {
                className: 'header',
                begin: '^(={1,5}) .+?( \\1)?$',
                relevance: 10
            },
            {
                className: 'header',
                begin: '^[^\\[\\]\\n]+?\\n[=\\-~\\^\\+]{2,}$',
                relevance: 10
            },
            // document attributes
            {
                className: 'attribute',
                begin: '^:.+?:',
                end: '\\s',
                excludeEnd: true,
                relevance: 10
            },
            // block attributes
            {
                className: 'attribute',
                begin: '^\\[.+?\\]$',
                relevance: 0
            },
            // quoteblocks
            {
                className: 'blockquote',
                begin: '^_{4,}\\n',
                end: '\\n_{4,}$',
                relevance: 10
            },
            // listing and literal blocks
            {
                className: 'code',
                begin: '^[\\-\\.]{4,}\\n',
                end: '\\n[\\-\\.]{4,}$',
                relevance: 10
            },
            // passthrough blocks
            {
                begin: '^\\+{4,}\\n',
                end: '\\n\\+{4,}$',
                contains: [
                {
                    begin: '<',
                    end: '>',
                    subLanguage: 'xml',
                    relevance: 0
                }
                ],
                relevance: 10
            },
            // lists (can only capture indicators)
            {
                className: 'bullet',
                begin: '^(\\*+|\\-+|\\.+|[^\\n]+?::)\\s+'
            },
            // admonition
            {
                className: 'label',
                begin: '^(NOTE|TIP|IMPORTANT|WARNING|CAUTION):\\s+',
                relevance: 10
            },
            // inline strong
            {
                className: 'strong',
                // must not follow a word character or be followed by an asterisk or space
                begin: '\\B\\*(?![\\*\\s])',
                end: '(\\n{2}|\\*)',
                // allow escaped asterisk followed by word char
                contains: [
                {
                    begin: '\\\\*\\w',
                    relevance: 0
                }
                ]
            },
            // inline emphasis
            {
                className: 'emphasis',
                // must not follow a word character or be followed by a single quote or space
                begin: '\\B\'(?![\'\\s])',
                end: '(\\n{2}|\')',
                // allow escaped single quote followed by word char
                contains: [
                {
                    begin: '\\\\\'\\w',
                    relevance: 0
                }
                ],
                relevance: 0
            },
            // inline emphasis (alt)
            {
                className: 'emphasis',
                // must not follow a word character or be followed by an underline or space
                begin: '_(?![_\\s])',
                end: '(\\n{2}|_)',
                relevance: 0
            },
            // inline smart quotes
            {
                className: 'smartquote',
                variants: [
                {
                    begin: "``.+?''"
                },
                {
                    begin: "`.+?'"
                }
                ]
            },
            // inline code snippets (TODO should get same treatment as strong and emphasis)
            {
                className: 'code',
                begin: '(`.+?`|\\+.+?\\+)',
                relevance: 0
            },
            // indented literal block
            {
                className: 'code',
                begin: '^[ \\t]',
                end: '$',
                relevance: 0
            },
            // horizontal rules
            {
                className: 'horizontal_rule',
                begin: '^\'{3,}[ \\t]*$',
                relevance: 10
            },
            // images and links
            {
                begin: '(link:)?(http|https|ftp|file|irc|image:?):\\S+\\[.*?\\]',
                returnBegin: true,
                contains: [
                {
                    //className: 'macro',
                    begin: '(link|image:?):',
                    relevance: 0
                },
                {
                    className: 'link_url',
                    begin: '\\w',
                    end: '[^\\[]+',
                    relevance: 0
                },
                {
                    className: 'link_label',
                    begin: '\\[',
                    end: '\\]',
                    excludeBegin: true,
                    excludeEnd: true,
                    relevance: 0
                }
                ],
                relevance: 10
            }
            ]
        };
    };
}, {}
],
47: [function(require, module, exports) {
    module.exports = function (hljs) {
        var KEYWORDS =
        'false synchronized int abstract float private char boolean static null if const ' +
        'for true while long throw strictfp finally protected import native final return void ' +
        'enum else extends implements break transient new catch instanceof byte super volatile case ' +
        'assert short package default double public try this switch continue throws privileged ' +
        'aspectOf adviceexecution proceed cflowbelow cflow initialization preinitialization ' +
        'staticinitialization withincode target within execution getWithinTypeName handler ' +
        'thisJoinPoint thisJoinPointStaticPart thisEnclosingJoinPointStaticPart declare parents ' +
        'warning error soft precedence thisAspectInstance';
        var SHORTKEYS = 'get set args call';
        return {
            keywords : KEYWORDS,
            illegal : /<\/|#/,
            contains : [
            hljs.COMMENT(
            '/\\*\\*',
            '\\*/',
            {
                relevance : 0,
                contains : [{
                    className : 'doctag',
                    begin : '@[A-Za-z]+'
                }
                ]
            }),
            hljs.C_LINE_COMMENT_MODE,
            hljs.C_BLOCK_COMMENT_MODE,
            hljs.APOS_STRING_MODE,
            hljs.QUOTE_STRING_MODE,
            {
                className : 'aspect',
                beginKeywords : 'aspect',
                end : /[{;=]/,
                excludeEnd : true,
                illegal : /[:;"\[\]]/,
                contains : [
                {
                    beginKeywords : 'extends implements pertypewithin perthis pertarget percflowbelow percflow issingleton'
                },
                hljs.UNDERSCORE_TITLE_MODE,
                {
                    begin : /\([^\)]*/,
                    end : /[)]+/,
                    keywords : KEYWORDS + ' ' + SHORTKEYS,
                    excludeEnd : false
                }
                ]
            },
            {
                className : 'class',
                beginKeywords : 'class interface',
                end : /[{;=]/,
                excludeEnd : true,
                relevance: 0,
                keywords : 'class interface',
                illegal : /[:"\[\]]/,
                contains : [
                {
                    beginKeywords : 'extends implements'
                },
                hljs.UNDERSCORE_TITLE_MODE
                ]
            },
            {
                // AspectJ Constructs
                beginKeywords : 'pointcut after before around throwing returning',
                end : /[)]/,
                excludeEnd : false,
                illegal : /["\[\]]/,
                contains : [
                {
                    begin : hljs.UNDERSCORE_IDENT_RE + '\\s*\\(',
                    returnBegin : true,
                    contains : [hljs.UNDERSCORE_TITLE_MODE]
                }
                ]
            },
            {
                begin : /[:]/,
                returnBegin : true,
                end : /[{;]/,
                relevance: 0,
                excludeEnd : false,
                keywords : KEYWORDS,
                illegal : /["\[\]]/,
                contains : [
                {
                    begin : hljs.UNDERSCORE_IDENT_RE + '\\s*\\(',
                    keywords : KEYWORDS + ' ' + SHORTKEYS
                },
                hljs.QUOTE_STRING_MODE
                ]
            },
            {
                // this prevents 'new Name(...), or throw ...' from being recognized as a function definition
                beginKeywords : 'new throw',
                relevance : 0
            },
            {
                // the function class is a bit different for AspectJ compared to the Java language
                className : 'function',
                begin : /\w+ +\w+(\.)?\w+\s*\([^\)]*\)\s*((throws)[\w\s,]+)?[\{;]/,
                returnBegin : true,
                end : /[{;=]/,
                keywords : KEYWORDS,
                excludeEnd : true,
                contains : [
                {
                    begin : hljs.UNDERSCORE_IDENT_RE + '\\s*\\(',
                    returnBegin : true,
                    relevance: 0,
                    contains : [hljs.UNDERSCORE_TITLE_MODE]
                },
                {
                    className : 'params',
                    begin : /\(/,
                    end : /\)/,
                    relevance: 0,
                    keywords : KEYWORDS,
                    contains : [
                    hljs.APOS_STRING_MODE,
                    hljs.QUOTE_STRING_MODE,
                    hljs.C_NUMBER_MODE,
                    hljs.C_BLOCK_COMMENT_MODE
                    ]
                },
                hljs.C_LINE_COMMENT_MODE,
                hljs.C_BLOCK_COMMENT_MODE
                ]
            },
            hljs.C_NUMBER_MODE,
            {
                // annotation is also used in this language
                className : 'annotation',
                begin : '@[A-Za-z]+'
            }
            ]
        };
    };
}, {}
],
48: [function(require, module, exports) {
    module.exports = function(hljs) {
        var BACKTICK_ESCAPE = {
            className: 'escape',
            begin: '`[\\s\\S]'
        };
        var COMMENTS = hljs.COMMENT(
        ';',
        '$',
        {
            relevance: 0
        });
        var BUILT_IN = [
        {
            className: 'built_in',
            begin: 'A_[a-zA-Z0-9]+'
        },
        {
            className: 'built_in',
            beginKeywords: 'ComSpec Clipboard ClipboardAll ErrorLevel'
        }
        ];

        return {
            case_insensitive: true,
            keywords: {
                keyword: 'Break Continue Else Gosub If Loop Return While',
                literal: 'A true false NOT AND OR'
            },
            contains: BUILT_IN.concat([
            BACKTICK_ESCAPE,
            hljs.inherit(hljs.QUOTE_STRING_MODE, {
                contains: [BACKTICK_ESCAPE]
            }),
            COMMENTS,
            {
                className: 'number',
                begin: hljs.NUMBER_RE,
                relevance: 0
            },
            {
                className: 'var_expand',
                // FIXME
                begin: '%',
                end: '%',
                illegal: '\\n',
                contains: [BACKTICK_ESCAPE]
            },
            {
                className: 'label',
                contains: [BACKTICK_ESCAPE],
                variants: [
                {
                    begin: '^[^\\n";]+::(?!=)'
                },
                {
                    begin: '^[^\\n";]+:(?!=)',
                    relevance: 0
                }
                // zero relevance as it catches a lot of things
                // followed by a single ':' in many languages
                ]
            },
            {
                // consecutive commas, not for highlighting but just for relevance
                begin: ',\\s*,',
                relevance: 10
            }
            ])
        }
    };
}, {}
],
49: [function(require, module, exports) {
    module.exports = function(hljs) {
        var KEYWORDS = 'ByRef Case Const ContinueCase ContinueLoop ' +
        'Default Dim Do Else ElseIf EndFunc EndIf EndSelect ' +
        'EndSwitch EndWith Enum Exit ExitLoop For Func ' +
        'Global If In Local Next ReDim Return Select Static ' +
        'Step Switch Then To Until Volatile WEnd While With',
        LITERAL = 'True False And Null Not Or',
        BUILT_IN = 'Abs ACos AdlibRegister AdlibUnRegister Asc AscW ASin ' +
        'Assign ATan AutoItSetOption AutoItWinGetTitle ' +
        'AutoItWinSetTitle Beep Binary BinaryLen BinaryMid ' +
        'BinaryToString BitAND BitNOT BitOR BitRotate BitShift ' +
        'BitXOR BlockInput Break Call CDTray Ceiling Chr ' +
        'ChrW ClipGet ClipPut ConsoleRead ConsoleWrite ' +
        'ConsoleWriteError ControlClick ControlCommand ' +
        'ControlDisable ControlEnable ControlFocus ControlGetFocus ' +
        'ControlGetHandle ControlGetPos ControlGetText ControlHide ' +
        'ControlListView ControlMove ControlSend ControlSetText ' +
        'ControlShow ControlTreeView Cos Dec DirCopy DirCreate ' +
        'DirGetSize DirMove DirRemove DllCall DllCallAddress ' +
        'DllCallbackFree DllCallbackGetPtr DllCallbackRegister ' +
        'DllClose DllOpen DllStructCreate DllStructGetData ' +
        'DllStructGetPtr DllStructGetSize DllStructSetData ' +
        'DriveGetDrive DriveGetFileSystem DriveGetLabel ' +
        'DriveGetSerial DriveGetType DriveMapAdd DriveMapDel ' +
        'DriveMapGet DriveSetLabel DriveSpaceFree DriveSpaceTotal ' +
        'DriveStatus EnvGet EnvSet EnvUpdate Eval Execute Exp ' +
        'FileChangeDir FileClose FileCopy FileCreateNTFSLink ' +
        'FileCreateShortcut FileDelete FileExists FileFindFirstFile ' +
        'FileFindNextFile FileFlush FileGetAttrib FileGetEncoding ' +
        'FileGetLongName FileGetPos FileGetShortcut FileGetShortName ' +
        'FileGetSize FileGetTime FileGetVersion FileInstall ' +
        'FileMove FileOpen FileOpenDialog FileRead FileReadLine ' +
        'FileReadToArray FileRecycle FileRecycleEmpty FileSaveDialog ' +
        'FileSelectFolder FileSetAttrib FileSetEnd FileSetPos ' +
        'FileSetTime FileWrite FileWriteLine Floor FtpSetProxy ' +
        'FuncName GUICreate GUICtrlCreateAvi GUICtrlCreateButton ' +
        'GUICtrlCreateCheckbox GUICtrlCreateCombo ' +
        'GUICtrlCreateContextMenu GUICtrlCreateDate GUICtrlCreateDummy ' +
        'GUICtrlCreateEdit GUICtrlCreateGraphic GUICtrlCreateGroup ' +
        'GUICtrlCreateIcon GUICtrlCreateInput GUICtrlCreateLabel ' +
        'GUICtrlCreateList GUICtrlCreateListView ' +
        'GUICtrlCreateListViewItem GUICtrlCreateMenu ' +
        'GUICtrlCreateMenuItem GUICtrlCreateMonthCal GUICtrlCreateObj ' +
        'GUICtrlCreatePic GUICtrlCreateProgress GUICtrlCreateRadio ' +
        'GUICtrlCreateSlider GUICtrlCreateTab GUICtrlCreateTabItem ' +
        'GUICtrlCreateTreeView GUICtrlCreateTreeViewItem ' +
        'GUICtrlCreateUpdown GUICtrlDelete GUICtrlGetHandle ' +
        'GUICtrlGetState GUICtrlRead GUICtrlRecvMsg ' +
        'GUICtrlRegisterListViewSort GUICtrlSendMsg GUICtrlSendToDummy ' +
        'GUICtrlSetBkColor GUICtrlSetColor GUICtrlSetCursor ' +
        'GUICtrlSetData GUICtrlSetDefBkColor GUICtrlSetDefColor ' +
        'GUICtrlSetFont GUICtrlSetGraphic GUICtrlSetImage ' +
        'GUICtrlSetLimit GUICtrlSetOnEvent GUICtrlSetPos ' +
        'GUICtrlSetResizing GUICtrlSetState GUICtrlSetStyle ' +
        'GUICtrlSetTip GUIDelete GUIGetCursorInfo GUIGetMsg ' +
        'GUIGetStyle GUIRegisterMsg GUISetAccelerators GUISetBkColor ' +
        'GUISetCoord GUISetCursor GUISetFont GUISetHelp GUISetIcon ' +
        'GUISetOnEvent GUISetState GUISetStyle GUIStartGroup ' +
        'GUISwitch Hex HotKeySet HttpSetProxy HttpSetUserAgent ' +
        'HWnd InetClose InetGet InetGetInfo InetGetSize InetRead ' +
        'IniDelete IniRead IniReadSection IniReadSectionNames ' +
        'IniRenameSection IniWrite IniWriteSection InputBox Int ' +
        'IsAdmin IsArray IsBinary IsBool IsDeclared IsDllStruct ' +
        'IsFloat IsFunc IsHWnd IsInt IsKeyword IsNumber IsObj ' +
        'IsPtr IsString Log MemGetStats Mod MouseClick ' +
        'MouseClickDrag MouseDown MouseGetCursor MouseGetPos ' +
        'MouseMove MouseUp MouseWheel MsgBox Number ObjCreate ' +
        'ObjCreateInterface ObjEvent ObjGet ObjName ' +
        'OnAutoItExitRegister OnAutoItExitUnRegister Opt Ping ' +
        'PixelChecksum PixelGetColor PixelSearch ProcessClose ' +
        'ProcessExists ProcessGetStats ProcessList ' +
        'ProcessSetPriority ProcessWait ProcessWaitClose ProgressOff ' +
        'ProgressOn ProgressSet Ptr Random RegDelete RegEnumKey ' +
        'RegEnumVal RegRead RegWrite Round Run RunAs RunAsWait ' +
        'RunWait Send SendKeepActive SetError SetExtended ' +
        'ShellExecute ShellExecuteWait Shutdown Sin Sleep ' +
        'SoundPlay SoundSetWaveVolume SplashImageOn SplashOff ' +
        'SplashTextOn Sqrt SRandom StatusbarGetText StderrRead ' +
        'StdinWrite StdioClose StdoutRead String StringAddCR ' +
        'StringCompare StringFormat StringFromASCIIArray StringInStr ' +
        'StringIsAlNum StringIsAlpha StringIsASCII StringIsDigit ' +
        'StringIsFloat StringIsInt StringIsLower StringIsSpace ' +
        'StringIsUpper StringIsXDigit StringLeft StringLen ' +
        'StringLower StringMid StringRegExp StringRegExpReplace ' +
        'StringReplace StringReverse StringRight StringSplit ' +
        'StringStripCR StringStripWS StringToASCIIArray ' +
        'StringToBinary StringTrimLeft StringTrimRight StringUpper ' +
        'Tan TCPAccept TCPCloseSocket TCPConnect TCPListen ' +
        'TCPNameToIP TCPRecv TCPSend TCPShutdown TCPStartup ' +
        'TimerDiff TimerInit ToolTip TrayCreateItem TrayCreateMenu ' +
        'TrayGetMsg TrayItemDelete TrayItemGetHandle ' +
        'TrayItemGetState TrayItemGetText TrayItemSetOnEvent ' +
        'TrayItemSetState TrayItemSetText TraySetClick TraySetIcon ' +
        'TraySetOnEvent TraySetPauseIcon TraySetState TraySetToolTip ' +
        'TrayTip UBound UDPBind UDPCloseSocket UDPOpen UDPRecv ' +
        'UDPSend UDPShutdown UDPStartup VarGetType WinActivate ' +
        'WinActive WinClose WinExists WinFlash WinGetCaretPos ' +
        'WinGetClassList WinGetClientSize WinGetHandle WinGetPos ' +
        'WinGetProcess WinGetState WinGetText WinGetTitle WinKill ' +
        'WinList WinMenuSelectItem WinMinimizeAll WinMinimizeAllUndo ' +
        'WinMove WinSetOnTop WinSetState WinSetTitle WinSetTrans ' +
        'WinWait WinWaitActive WinWaitClose WinWaitNotActive ' +
        'Array1DToHistogram ArrayAdd ArrayBinarySearch ' +
        'ArrayColDelete ArrayColInsert ArrayCombinations ' +
        'ArrayConcatenate ArrayDelete ArrayDisplay ArrayExtract ' +
        'ArrayFindAll ArrayInsert ArrayMax ArrayMaxIndex ArrayMin ' +
        'ArrayMinIndex ArrayPermute ArrayPop ArrayPush ' +
        'ArrayReverse ArraySearch ArrayShuffle ArraySort ArraySwap ' +
        'ArrayToClip ArrayToString ArrayTranspose ArrayTrim ' +
        'ArrayUnique Assert ChooseColor ChooseFont ' +
        'ClipBoard_ChangeChain ClipBoard_Close ClipBoard_CountFormats ' +
        'ClipBoard_Empty ClipBoard_EnumFormats ClipBoard_FormatStr ' +
        'ClipBoard_GetData ClipBoard_GetDataEx ClipBoard_GetFormatName ' +
        'ClipBoard_GetOpenWindow ClipBoard_GetOwner ' +
        'ClipBoard_GetPriorityFormat ClipBoard_GetSequenceNumber ' +
        'ClipBoard_GetViewer ClipBoard_IsFormatAvailable ' +
        'ClipBoard_Open ClipBoard_RegisterFormat ClipBoard_SetData ' +
        'ClipBoard_SetDataEx ClipBoard_SetViewer ClipPutFile ' +
        'ColorConvertHSLtoRGB ColorConvertRGBtoHSL ColorGetBlue ' +
        'ColorGetCOLORREF ColorGetGreen ColorGetRed ColorGetRGB ' +
        'ColorSetCOLORREF ColorSetRGB Crypt_DecryptData ' +
        'Crypt_DecryptFile Crypt_DeriveKey Crypt_DestroyKey ' +
        'Crypt_EncryptData Crypt_EncryptFile Crypt_GenRandom ' +
        'Crypt_HashData Crypt_HashFile Crypt_Shutdown Crypt_Startup ' +
        'DateAdd DateDayOfWeek DateDaysInMonth DateDiff ' +
        'DateIsLeapYear DateIsValid DateTimeFormat DateTimeSplit ' +
        'DateToDayOfWeek DateToDayOfWeekISO DateToDayValue ' +
        'DateToMonth Date_Time_CompareFileTime ' +
        'Date_Time_DOSDateTimeToArray Date_Time_DOSDateTimeToFileTime ' +
        'Date_Time_DOSDateTimeToStr Date_Time_DOSDateToArray ' +
        'Date_Time_DOSDateToStr Date_Time_DOSTimeToArray ' +
        'Date_Time_DOSTimeToStr Date_Time_EncodeFileTime ' +
        'Date_Time_EncodeSystemTime Date_Time_FileTimeToArray ' +
        'Date_Time_FileTimeToDOSDateTime ' +
        'Date_Time_FileTimeToLocalFileTime Date_Time_FileTimeToStr ' +
        'Date_Time_FileTimeToSystemTime Date_Time_GetFileTime ' +
        'Date_Time_GetLocalTime Date_Time_GetSystemTime ' +
        'Date_Time_GetSystemTimeAdjustment ' +
        'Date_Time_GetSystemTimeAsFileTime Date_Time_GetSystemTimes ' +
        'Date_Time_GetTickCount Date_Time_GetTimeZoneInformation ' +
        'Date_Time_LocalFileTimeToFileTime Date_Time_SetFileTime ' +
        'Date_Time_SetLocalTime Date_Time_SetSystemTime ' +
        'Date_Time_SetSystemTimeAdjustment ' +
        'Date_Time_SetTimeZoneInformation Date_Time_SystemTimeToArray ' +
        'Date_Time_SystemTimeToDateStr Date_Time_SystemTimeToDateTimeStr ' +
        'Date_Time_SystemTimeToFileTime Date_Time_SystemTimeToTimeStr ' +
        'Date_Time_SystemTimeToTzSpecificLocalTime ' +
        'Date_Time_TzSpecificLocalTimeToSystemTime DayValueToDate ' +
        'DebugBugReportEnv DebugCOMError DebugOut DebugReport ' +
        'DebugReportEx DebugReportVar DebugSetup Degree ' +
        'EventLog__Backup EventLog__Clear EventLog__Close ' +
        'EventLog__Count EventLog__DeregisterSource EventLog__Full ' +
        'EventLog__Notify EventLog__Oldest EventLog__Open ' +
        'EventLog__OpenBackup EventLog__Read EventLog__RegisterSource ' +
        'EventLog__Report Excel_BookAttach Excel_BookClose ' +
        'Excel_BookList Excel_BookNew Excel_BookOpen ' +
        'Excel_BookOpenText Excel_BookSave Excel_BookSaveAs ' +
        'Excel_Close Excel_ColumnToLetter Excel_ColumnToNumber ' +
        'Excel_ConvertFormula Excel_Export Excel_FilterGet ' +
        'Excel_FilterSet Excel_Open Excel_PictureAdd Excel_Print ' +
        'Excel_RangeCopyPaste Excel_RangeDelete Excel_RangeFind ' +
        'Excel_RangeInsert Excel_RangeLinkAddRemove Excel_RangeRead ' +
        'Excel_RangeReplace Excel_RangeSort Excel_RangeValidate ' +
        'Excel_RangeWrite Excel_SheetAdd Excel_SheetCopyMove ' +
        'Excel_SheetDelete Excel_SheetList FileCountLines FileCreate ' +
        'FileListToArray FileListToArrayRec FilePrint ' +
        'FileReadToArray FileWriteFromArray FileWriteLog ' +
        'FileWriteToLine FTP_Close FTP_Command FTP_Connect ' +
        'FTP_DecodeInternetStatus FTP_DirCreate FTP_DirDelete ' +
        'FTP_DirGetCurrent FTP_DirPutContents FTP_DirSetCurrent ' +
        'FTP_FileClose FTP_FileDelete FTP_FileGet FTP_FileGetSize ' +
        'FTP_FileOpen FTP_FilePut FTP_FileRead FTP_FileRename ' +
        'FTP_FileTimeLoHiToStr FTP_FindFileClose FTP_FindFileFirst ' +
        'FTP_FindFileNext FTP_GetLastResponseInfo FTP_ListToArray ' +
        'FTP_ListToArray2D FTP_ListToArrayEx FTP_Open ' +
        'FTP_ProgressDownload FTP_ProgressUpload FTP_SetStatusCallback ' +
        'GDIPlus_ArrowCapCreate GDIPlus_ArrowCapDispose ' +
        'GDIPlus_ArrowCapGetFillState GDIPlus_ArrowCapGetHeight ' +
        'GDIPlus_ArrowCapGetMiddleInset GDIPlus_ArrowCapGetWidth ' +
        'GDIPlus_ArrowCapSetFillState GDIPlus_ArrowCapSetHeight ' +
        'GDIPlus_ArrowCapSetMiddleInset GDIPlus_ArrowCapSetWidth ' +
        'GDIPlus_BitmapApplyEffect GDIPlus_BitmapApplyEffectEx ' +
        'GDIPlus_BitmapCloneArea GDIPlus_BitmapConvertFormat ' +
        'GDIPlus_BitmapCreateApplyEffect ' +
        'GDIPlus_BitmapCreateApplyEffectEx ' +
        'GDIPlus_BitmapCreateDIBFromBitmap GDIPlus_BitmapCreateFromFile ' +
        'GDIPlus_BitmapCreateFromGraphics ' +
        'GDIPlus_BitmapCreateFromHBITMAP GDIPlus_BitmapCreateFromHICON ' +
        'GDIPlus_BitmapCreateFromHICON32 GDIPlus_BitmapCreateFromMemory ' +
        'GDIPlus_BitmapCreateFromResource GDIPlus_BitmapCreateFromScan0 ' +
        'GDIPlus_BitmapCreateFromStream ' +
        'GDIPlus_BitmapCreateHBITMAPFromBitmap GDIPlus_BitmapDispose ' +
        'GDIPlus_BitmapGetHistogram GDIPlus_BitmapGetHistogramEx ' +
        'GDIPlus_BitmapGetHistogramSize GDIPlus_BitmapGetPixel ' +
        'GDIPlus_BitmapLockBits GDIPlus_BitmapSetPixel ' +
        'GDIPlus_BitmapUnlockBits GDIPlus_BrushClone ' +
        'GDIPlus_BrushCreateSolid GDIPlus_BrushDispose ' +
        'GDIPlus_BrushGetSolidColor GDIPlus_BrushGetType ' +
        'GDIPlus_BrushSetSolidColor GDIPlus_ColorMatrixCreate ' +
        'GDIPlus_ColorMatrixCreateGrayScale ' +
        'GDIPlus_ColorMatrixCreateNegative ' +
        'GDIPlus_ColorMatrixCreateSaturation ' +
        'GDIPlus_ColorMatrixCreateScale ' +
        'GDIPlus_ColorMatrixCreateTranslate GDIPlus_CustomLineCapClone ' +
        'GDIPlus_CustomLineCapCreate GDIPlus_CustomLineCapDispose ' +
        'GDIPlus_CustomLineCapGetStrokeCaps ' +
        'GDIPlus_CustomLineCapSetStrokeCaps GDIPlus_Decoders ' +
        'GDIPlus_DecodersGetCount GDIPlus_DecodersGetSize ' +
        'GDIPlus_DrawImageFX GDIPlus_DrawImageFXEx ' +
        'GDIPlus_DrawImagePoints GDIPlus_EffectCreate ' +
        'GDIPlus_EffectCreateBlur GDIPlus_EffectCreateBrightnessContrast ' +
        'GDIPlus_EffectCreateColorBalance GDIPlus_EffectCreateColorCurve ' +
        'GDIPlus_EffectCreateColorLUT GDIPlus_EffectCreateColorMatrix ' +
        'GDIPlus_EffectCreateHueSaturationLightness ' +
        'GDIPlus_EffectCreateLevels GDIPlus_EffectCreateRedEyeCorrection ' +
        'GDIPlus_EffectCreateSharpen GDIPlus_EffectCreateTint ' +
        'GDIPlus_EffectDispose GDIPlus_EffectGetParameters ' +
        'GDIPlus_EffectSetParameters GDIPlus_Encoders ' +
        'GDIPlus_EncodersGetCLSID GDIPlus_EncodersGetCount ' +
        'GDIPlus_EncodersGetParamList GDIPlus_EncodersGetParamListSize ' +
        'GDIPlus_EncodersGetSize GDIPlus_FontCreate ' +
        'GDIPlus_FontDispose GDIPlus_FontFamilyCreate ' +
        'GDIPlus_FontFamilyCreateFromCollection ' +
        'GDIPlus_FontFamilyDispose GDIPlus_FontFamilyGetCellAscent ' +
        'GDIPlus_FontFamilyGetCellDescent GDIPlus_FontFamilyGetEmHeight ' +
        'GDIPlus_FontFamilyGetLineSpacing GDIPlus_FontGetHeight ' +
        'GDIPlus_FontPrivateAddFont GDIPlus_FontPrivateAddMemoryFont ' +
        'GDIPlus_FontPrivateCollectionDispose ' +
        'GDIPlus_FontPrivateCreateCollection GDIPlus_GraphicsClear ' +
        'GDIPlus_GraphicsCreateFromHDC GDIPlus_GraphicsCreateFromHWND ' +
        'GDIPlus_GraphicsDispose GDIPlus_GraphicsDrawArc ' +
        'GDIPlus_GraphicsDrawBezier GDIPlus_GraphicsDrawClosedCurve ' +
        'GDIPlus_GraphicsDrawClosedCurve2 GDIPlus_GraphicsDrawCurve ' +
        'GDIPlus_GraphicsDrawCurve2 GDIPlus_GraphicsDrawEllipse ' +
        'GDIPlus_GraphicsDrawImage GDIPlus_GraphicsDrawImagePointsRect ' +
        'GDIPlus_GraphicsDrawImageRect GDIPlus_GraphicsDrawImageRectRect ' +
        'GDIPlus_GraphicsDrawLine GDIPlus_GraphicsDrawPath ' +
        'GDIPlus_GraphicsDrawPie GDIPlus_GraphicsDrawPolygon ' +
        'GDIPlus_GraphicsDrawRect GDIPlus_GraphicsDrawString ' +
        'GDIPlus_GraphicsDrawStringEx GDIPlus_GraphicsFillClosedCurve ' +
        'GDIPlus_GraphicsFillClosedCurve2 GDIPlus_GraphicsFillEllipse ' +
        'GDIPlus_GraphicsFillPath GDIPlus_GraphicsFillPie ' +
        'GDIPlus_GraphicsFillPolygon GDIPlus_GraphicsFillRect ' +
        'GDIPlus_GraphicsFillRegion GDIPlus_GraphicsGetCompositingMode ' +
        'GDIPlus_GraphicsGetCompositingQuality GDIPlus_GraphicsGetDC ' +
        'GDIPlus_GraphicsGetInterpolationMode ' +
        'GDIPlus_GraphicsGetSmoothingMode GDIPlus_GraphicsGetTransform ' +
        'GDIPlus_GraphicsMeasureCharacterRanges ' +
        'GDIPlus_GraphicsMeasureString GDIPlus_GraphicsReleaseDC ' +
        'GDIPlus_GraphicsResetClip GDIPlus_GraphicsResetTransform ' +
        'GDIPlus_GraphicsRestore GDIPlus_GraphicsRotateTransform ' +
        'GDIPlus_GraphicsSave GDIPlus_GraphicsScaleTransform ' +
        'GDIPlus_GraphicsSetClipPath GDIPlus_GraphicsSetClipRect ' +
        'GDIPlus_GraphicsSetClipRegion ' +
        'GDIPlus_GraphicsSetCompositingMode ' +
        'GDIPlus_GraphicsSetCompositingQuality ' +
        'GDIPlus_GraphicsSetInterpolationMode ' +
        'GDIPlus_GraphicsSetPixelOffsetMode ' +
        'GDIPlus_GraphicsSetSmoothingMode ' +
        'GDIPlus_GraphicsSetTextRenderingHint ' +
        'GDIPlus_GraphicsSetTransform GDIPlus_GraphicsTransformPoints ' +
        'GDIPlus_GraphicsTranslateTransform GDIPlus_HatchBrushCreate ' +
        'GDIPlus_HICONCreateFromBitmap GDIPlus_ImageAttributesCreate ' +
        'GDIPlus_ImageAttributesDispose ' +
        'GDIPlus_ImageAttributesSetColorKeys ' +
        'GDIPlus_ImageAttributesSetColorMatrix GDIPlus_ImageDispose ' +
        'GDIPlus_ImageGetDimension GDIPlus_ImageGetFlags ' +
        'GDIPlus_ImageGetGraphicsContext GDIPlus_ImageGetHeight ' +
        'GDIPlus_ImageGetHorizontalResolution ' +
        'GDIPlus_ImageGetPixelFormat GDIPlus_ImageGetRawFormat ' +
        'GDIPlus_ImageGetThumbnail GDIPlus_ImageGetType ' +
        'GDIPlus_ImageGetVerticalResolution GDIPlus_ImageGetWidth ' +
        'GDIPlus_ImageLoadFromFile GDIPlus_ImageLoadFromStream ' +
        'GDIPlus_ImageResize GDIPlus_ImageRotateFlip ' +
        'GDIPlus_ImageSaveToFile GDIPlus_ImageSaveToFileEx ' +
        'GDIPlus_ImageSaveToStream GDIPlus_ImageScale ' +
        'GDIPlus_LineBrushCreate GDIPlus_LineBrushCreateFromRect ' +
        'GDIPlus_LineBrushCreateFromRectWithAngle ' +
        'GDIPlus_LineBrushGetColors GDIPlus_LineBrushGetRect ' +
        'GDIPlus_LineBrushMultiplyTransform ' +
        'GDIPlus_LineBrushResetTransform GDIPlus_LineBrushSetBlend ' +
        'GDIPlus_LineBrushSetColors GDIPlus_LineBrushSetGammaCorrection ' +
        'GDIPlus_LineBrushSetLinearBlend GDIPlus_LineBrushSetPresetBlend ' +
        'GDIPlus_LineBrushSetSigmaBlend GDIPlus_LineBrushSetTransform ' +
        'GDIPlus_MatrixClone GDIPlus_MatrixCreate ' +
        'GDIPlus_MatrixDispose GDIPlus_MatrixGetElements ' +
        'GDIPlus_MatrixInvert GDIPlus_MatrixMultiply ' +
        'GDIPlus_MatrixRotate GDIPlus_MatrixScale ' +
        'GDIPlus_MatrixSetElements GDIPlus_MatrixShear ' +
        'GDIPlus_MatrixTransformPoints GDIPlus_MatrixTranslate ' +
        'GDIPlus_PaletteInitialize GDIPlus_ParamAdd GDIPlus_ParamInit ' +
        'GDIPlus_ParamSize GDIPlus_PathAddArc GDIPlus_PathAddBezier ' +
        'GDIPlus_PathAddClosedCurve GDIPlus_PathAddClosedCurve2 ' +
        'GDIPlus_PathAddCurve GDIPlus_PathAddCurve2 ' +
        'GDIPlus_PathAddCurve3 GDIPlus_PathAddEllipse ' +
        'GDIPlus_PathAddLine GDIPlus_PathAddLine2 GDIPlus_PathAddPath ' +
        'GDIPlus_PathAddPie GDIPlus_PathAddPolygon ' +
        'GDIPlus_PathAddRectangle GDIPlus_PathAddString ' +
        'GDIPlus_PathBrushCreate GDIPlus_PathBrushCreateFromPath ' +
        'GDIPlus_PathBrushGetCenterPoint GDIPlus_PathBrushGetFocusScales ' +
        'GDIPlus_PathBrushGetPointCount GDIPlus_PathBrushGetRect ' +
        'GDIPlus_PathBrushGetWrapMode GDIPlus_PathBrushMultiplyTransform ' +
        'GDIPlus_PathBrushResetTransform GDIPlus_PathBrushSetBlend ' +
        'GDIPlus_PathBrushSetCenterColor GDIPlus_PathBrushSetCenterPoint ' +
        'GDIPlus_PathBrushSetFocusScales ' +
        'GDIPlus_PathBrushSetGammaCorrection ' +
        'GDIPlus_PathBrushSetLinearBlend GDIPlus_PathBrushSetPresetBlend ' +
        'GDIPlus_PathBrushSetSigmaBlend ' +
        'GDIPlus_PathBrushSetSurroundColor ' +
        'GDIPlus_PathBrushSetSurroundColorsWithCount ' +
        'GDIPlus_PathBrushSetTransform GDIPlus_PathBrushSetWrapMode ' +
        'GDIPlus_PathClone GDIPlus_PathCloseFigure GDIPlus_PathCreate ' +
        'GDIPlus_PathCreate2 GDIPlus_PathDispose GDIPlus_PathFlatten ' +
        'GDIPlus_PathGetData GDIPlus_PathGetFillMode ' +
        'GDIPlus_PathGetLastPoint GDIPlus_PathGetPointCount ' +
        'GDIPlus_PathGetPoints GDIPlus_PathGetWorldBounds ' +
        'GDIPlus_PathIsOutlineVisiblePoint GDIPlus_PathIsVisiblePoint ' +
        'GDIPlus_PathIterCreate GDIPlus_PathIterDispose ' +
        'GDIPlus_PathIterGetSubpathCount GDIPlus_PathIterNextMarkerPath ' +
        'GDIPlus_PathIterNextSubpathPath GDIPlus_PathIterRewind ' +
        'GDIPlus_PathReset GDIPlus_PathReverse GDIPlus_PathSetFillMode ' +
        'GDIPlus_PathSetMarker GDIPlus_PathStartFigure ' +
        'GDIPlus_PathTransform GDIPlus_PathWarp GDIPlus_PathWiden ' +
        'GDIPlus_PathWindingModeOutline GDIPlus_PenCreate ' +
        'GDIPlus_PenCreate2 GDIPlus_PenDispose GDIPlus_PenGetAlignment ' +
        'GDIPlus_PenGetColor GDIPlus_PenGetCustomEndCap ' +
        'GDIPlus_PenGetDashCap GDIPlus_PenGetDashStyle ' +
        'GDIPlus_PenGetEndCap GDIPlus_PenGetMiterLimit ' +
        'GDIPlus_PenGetWidth GDIPlus_PenSetAlignment ' +
        'GDIPlus_PenSetColor GDIPlus_PenSetCustomEndCap ' +
        'GDIPlus_PenSetDashCap GDIPlus_PenSetDashStyle ' +
        'GDIPlus_PenSetEndCap GDIPlus_PenSetLineCap ' +
        'GDIPlus_PenSetLineJoin GDIPlus_PenSetMiterLimit ' +
        'GDIPlus_PenSetStartCap GDIPlus_PenSetWidth ' +
        'GDIPlus_RectFCreate GDIPlus_RegionClone ' +
        'GDIPlus_RegionCombinePath GDIPlus_RegionCombineRect ' +
        'GDIPlus_RegionCombineRegion GDIPlus_RegionCreate ' +
        'GDIPlus_RegionCreateFromPath GDIPlus_RegionCreateFromRect ' +
        'GDIPlus_RegionDispose GDIPlus_RegionGetBounds ' +
        'GDIPlus_RegionGetHRgn GDIPlus_RegionTransform ' +
        'GDIPlus_RegionTranslate GDIPlus_Shutdown GDIPlus_Startup ' +
        'GDIPlus_StringFormatCreate GDIPlus_StringFormatDispose ' +
        'GDIPlus_StringFormatGetMeasurableCharacterRangeCount ' +
        'GDIPlus_StringFormatSetAlign GDIPlus_StringFormatSetLineAlign ' +
        'GDIPlus_StringFormatSetMeasurableCharacterRanges ' +
        'GDIPlus_TextureCreate GDIPlus_TextureCreate2 ' +
        'GDIPlus_TextureCreateIA GetIP GUICtrlAVI_Close ' +
        'GUICtrlAVI_Create GUICtrlAVI_Destroy GUICtrlAVI_IsPlaying ' +
        'GUICtrlAVI_Open GUICtrlAVI_OpenEx GUICtrlAVI_Play ' +
        'GUICtrlAVI_Seek GUICtrlAVI_Show GUICtrlAVI_Stop ' +
        'GUICtrlButton_Click GUICtrlButton_Create ' +
        'GUICtrlButton_Destroy GUICtrlButton_Enable ' +
        'GUICtrlButton_GetCheck GUICtrlButton_GetFocus ' +
        'GUICtrlButton_GetIdealSize GUICtrlButton_GetImage ' +
        'GUICtrlButton_GetImageList GUICtrlButton_GetNote ' +
        'GUICtrlButton_GetNoteLength GUICtrlButton_GetSplitInfo ' +
        'GUICtrlButton_GetState GUICtrlButton_GetText ' +
        'GUICtrlButton_GetTextMargin GUICtrlButton_SetCheck ' +
        'GUICtrlButton_SetDontClick GUICtrlButton_SetFocus ' +
        'GUICtrlButton_SetImage GUICtrlButton_SetImageList ' +
        'GUICtrlButton_SetNote GUICtrlButton_SetShield ' +
        'GUICtrlButton_SetSize GUICtrlButton_SetSplitInfo ' +
        'GUICtrlButton_SetState GUICtrlButton_SetStyle ' +
        'GUICtrlButton_SetText GUICtrlButton_SetTextMargin ' +
        'GUICtrlButton_Show GUICtrlComboBoxEx_AddDir ' +
        'GUICtrlComboBoxEx_AddString GUICtrlComboBoxEx_BeginUpdate ' +
        'GUICtrlComboBoxEx_Create GUICtrlComboBoxEx_CreateSolidBitMap ' +
        'GUICtrlComboBoxEx_DeleteString GUICtrlComboBoxEx_Destroy ' +
        'GUICtrlComboBoxEx_EndUpdate GUICtrlComboBoxEx_FindStringExact ' +
        'GUICtrlComboBoxEx_GetComboBoxInfo ' +
        'GUICtrlComboBoxEx_GetComboControl GUICtrlComboBoxEx_GetCount ' +
        'GUICtrlComboBoxEx_GetCurSel ' +
        'GUICtrlComboBoxEx_GetDroppedControlRect ' +
        'GUICtrlComboBoxEx_GetDroppedControlRectEx ' +
        'GUICtrlComboBoxEx_GetDroppedState ' +
        'GUICtrlComboBoxEx_GetDroppedWidth ' +
        'GUICtrlComboBoxEx_GetEditControl GUICtrlComboBoxEx_GetEditSel ' +
        'GUICtrlComboBoxEx_GetEditText ' +
        'GUICtrlComboBoxEx_GetExtendedStyle ' +
        'GUICtrlComboBoxEx_GetExtendedUI GUICtrlComboBoxEx_GetImageList ' +
        'GUICtrlComboBoxEx_GetItem GUICtrlComboBoxEx_GetItemEx ' +
        'GUICtrlComboBoxEx_GetItemHeight GUICtrlComboBoxEx_GetItemImage ' +
        'GUICtrlComboBoxEx_GetItemIndent ' +
        'GUICtrlComboBoxEx_GetItemOverlayImage ' +
        'GUICtrlComboBoxEx_GetItemParam ' +
        'GUICtrlComboBoxEx_GetItemSelectedImage ' +
        'GUICtrlComboBoxEx_GetItemText GUICtrlComboBoxEx_GetItemTextLen ' +
        'GUICtrlComboBoxEx_GetList GUICtrlComboBoxEx_GetListArray ' +
        'GUICtrlComboBoxEx_GetLocale GUICtrlComboBoxEx_GetLocaleCountry ' +
        'GUICtrlComboBoxEx_GetLocaleLang ' +
        'GUICtrlComboBoxEx_GetLocalePrimLang ' +
        'GUICtrlComboBoxEx_GetLocaleSubLang ' +
        'GUICtrlComboBoxEx_GetMinVisible GUICtrlComboBoxEx_GetTopIndex ' +
        'GUICtrlComboBoxEx_GetUnicode GUICtrlComboBoxEx_InitStorage ' +
        'GUICtrlComboBoxEx_InsertString GUICtrlComboBoxEx_LimitText ' +
        'GUICtrlComboBoxEx_ReplaceEditSel GUICtrlComboBoxEx_ResetContent ' +
        'GUICtrlComboBoxEx_SetCurSel GUICtrlComboBoxEx_SetDroppedWidth ' +
        'GUICtrlComboBoxEx_SetEditSel GUICtrlComboBoxEx_SetEditText ' +
        'GUICtrlComboBoxEx_SetExtendedStyle ' +
        'GUICtrlComboBoxEx_SetExtendedUI GUICtrlComboBoxEx_SetImageList ' +
        'GUICtrlComboBoxEx_SetItem GUICtrlComboBoxEx_SetItemEx ' +
        'GUICtrlComboBoxEx_SetItemHeight GUICtrlComboBoxEx_SetItemImage ' +
        'GUICtrlComboBoxEx_SetItemIndent ' +
        'GUICtrlComboBoxEx_SetItemOverlayImage ' +
        'GUICtrlComboBoxEx_SetItemParam ' +
        'GUICtrlComboBoxEx_SetItemSelectedImage ' +
        'GUICtrlComboBoxEx_SetMinVisible GUICtrlComboBoxEx_SetTopIndex ' +
        'GUICtrlComboBoxEx_SetUnicode GUICtrlComboBoxEx_ShowDropDown ' +
        'GUICtrlComboBox_AddDir GUICtrlComboBox_AddString ' +
        'GUICtrlComboBox_AutoComplete GUICtrlComboBox_BeginUpdate ' +
        'GUICtrlComboBox_Create GUICtrlComboBox_DeleteString ' +
        'GUICtrlComboBox_Destroy GUICtrlComboBox_EndUpdate ' +
        'GUICtrlComboBox_FindString GUICtrlComboBox_FindStringExact ' +
        'GUICtrlComboBox_GetComboBoxInfo GUICtrlComboBox_GetCount ' +
        'GUICtrlComboBox_GetCueBanner GUICtrlComboBox_GetCurSel ' +
        'GUICtrlComboBox_GetDroppedControlRect ' +
        'GUICtrlComboBox_GetDroppedControlRectEx ' +
        'GUICtrlComboBox_GetDroppedState GUICtrlComboBox_GetDroppedWidth ' +
        'GUICtrlComboBox_GetEditSel GUICtrlComboBox_GetEditText ' +
        'GUICtrlComboBox_GetExtendedUI ' +
        'GUICtrlComboBox_GetHorizontalExtent ' +
        'GUICtrlComboBox_GetItemHeight GUICtrlComboBox_GetLBText ' +
        'GUICtrlComboBox_GetLBTextLen GUICtrlComboBox_GetList ' +
        'GUICtrlComboBox_GetListArray GUICtrlComboBox_GetLocale ' +
        'GUICtrlComboBox_GetLocaleCountry GUICtrlComboBox_GetLocaleLang ' +
        'GUICtrlComboBox_GetLocalePrimLang ' +
        'GUICtrlComboBox_GetLocaleSubLang GUICtrlComboBox_GetMinVisible ' +
        'GUICtrlComboBox_GetTopIndex GUICtrlComboBox_InitStorage ' +
        'GUICtrlComboBox_InsertString GUICtrlComboBox_LimitText ' +
        'GUICtrlComboBox_ReplaceEditSel GUICtrlComboBox_ResetContent ' +
        'GUICtrlComboBox_SelectString GUICtrlComboBox_SetCueBanner ' +
        'GUICtrlComboBox_SetCurSel GUICtrlComboBox_SetDroppedWidth ' +
        'GUICtrlComboBox_SetEditSel GUICtrlComboBox_SetEditText ' +
        'GUICtrlComboBox_SetExtendedUI ' +
        'GUICtrlComboBox_SetHorizontalExtent ' +
        'GUICtrlComboBox_SetItemHeight GUICtrlComboBox_SetMinVisible ' +
        'GUICtrlComboBox_SetTopIndex GUICtrlComboBox_ShowDropDown ' +
        'GUICtrlDTP_Create GUICtrlDTP_Destroy GUICtrlDTP_GetMCColor ' +
        'GUICtrlDTP_GetMCFont GUICtrlDTP_GetMonthCal ' +
        'GUICtrlDTP_GetRange GUICtrlDTP_GetRangeEx ' +
        'GUICtrlDTP_GetSystemTime GUICtrlDTP_GetSystemTimeEx ' +
        'GUICtrlDTP_SetFormat GUICtrlDTP_SetMCColor ' +
        'GUICtrlDTP_SetMCFont GUICtrlDTP_SetRange ' +
        'GUICtrlDTP_SetRangeEx GUICtrlDTP_SetSystemTime ' +
        'GUICtrlDTP_SetSystemTimeEx GUICtrlEdit_AppendText ' +
        'GUICtrlEdit_BeginUpdate GUICtrlEdit_CanUndo ' +
        'GUICtrlEdit_CharFromPos GUICtrlEdit_Create ' +
        'GUICtrlEdit_Destroy GUICtrlEdit_EmptyUndoBuffer ' +
        'GUICtrlEdit_EndUpdate GUICtrlEdit_Find GUICtrlEdit_FmtLines ' +
        'GUICtrlEdit_GetCueBanner GUICtrlEdit_GetFirstVisibleLine ' +
        'GUICtrlEdit_GetLimitText GUICtrlEdit_GetLine ' +
        'GUICtrlEdit_GetLineCount GUICtrlEdit_GetMargins ' +
        'GUICtrlEdit_GetModify GUICtrlEdit_GetPasswordChar ' +
        'GUICtrlEdit_GetRECT GUICtrlEdit_GetRECTEx GUICtrlEdit_GetSel ' +
        'GUICtrlEdit_GetText GUICtrlEdit_GetTextLen ' +
        'GUICtrlEdit_HideBalloonTip GUICtrlEdit_InsertText ' +
        'GUICtrlEdit_LineFromChar GUICtrlEdit_LineIndex ' +
        'GUICtrlEdit_LineLength GUICtrlEdit_LineScroll ' +
        'GUICtrlEdit_PosFromChar GUICtrlEdit_ReplaceSel ' +
        'GUICtrlEdit_Scroll GUICtrlEdit_SetCueBanner ' +
        'GUICtrlEdit_SetLimitText GUICtrlEdit_SetMargins ' +
        'GUICtrlEdit_SetModify GUICtrlEdit_SetPasswordChar ' +
        'GUICtrlEdit_SetReadOnly GUICtrlEdit_SetRECT ' +
        'GUICtrlEdit_SetRECTEx GUICtrlEdit_SetRECTNP ' +
        'GUICtrlEdit_SetRectNPEx GUICtrlEdit_SetSel ' +
        'GUICtrlEdit_SetTabStops GUICtrlEdit_SetText ' +
        'GUICtrlEdit_ShowBalloonTip GUICtrlEdit_Undo ' +
        'GUICtrlHeader_AddItem GUICtrlHeader_ClearFilter ' +
        'GUICtrlHeader_ClearFilterAll GUICtrlHeader_Create ' +
        'GUICtrlHeader_CreateDragImage GUICtrlHeader_DeleteItem ' +
        'GUICtrlHeader_Destroy GUICtrlHeader_EditFilter ' +
        'GUICtrlHeader_GetBitmapMargin GUICtrlHeader_GetImageList ' +
        'GUICtrlHeader_GetItem GUICtrlHeader_GetItemAlign ' +
        'GUICtrlHeader_GetItemBitmap GUICtrlHeader_GetItemCount ' +
        'GUICtrlHeader_GetItemDisplay GUICtrlHeader_GetItemFlags ' +
        'GUICtrlHeader_GetItemFormat GUICtrlHeader_GetItemImage ' +
        'GUICtrlHeader_GetItemOrder GUICtrlHeader_GetItemParam ' +
        'GUICtrlHeader_GetItemRect GUICtrlHeader_GetItemRectEx ' +
        'GUICtrlHeader_GetItemText GUICtrlHeader_GetItemWidth ' +
        'GUICtrlHeader_GetOrderArray GUICtrlHeader_GetUnicodeFormat ' +
        'GUICtrlHeader_HitTest GUICtrlHeader_InsertItem ' +
        'GUICtrlHeader_Layout GUICtrlHeader_OrderToIndex ' +
        'GUICtrlHeader_SetBitmapMargin ' +
        'GUICtrlHeader_SetFilterChangeTimeout ' +
        'GUICtrlHeader_SetHotDivider GUICtrlHeader_SetImageList ' +
        'GUICtrlHeader_SetItem GUICtrlHeader_SetItemAlign ' +
        'GUICtrlHeader_SetItemBitmap GUICtrlHeader_SetItemDisplay ' +
        'GUICtrlHeader_SetItemFlags GUICtrlHeader_SetItemFormat ' +
        'GUICtrlHeader_SetItemImage GUICtrlHeader_SetItemOrder ' +
        'GUICtrlHeader_SetItemParam GUICtrlHeader_SetItemText ' +
        'GUICtrlHeader_SetItemWidth GUICtrlHeader_SetOrderArray ' +
        'GUICtrlHeader_SetUnicodeFormat GUICtrlIpAddress_ClearAddress ' +
        'GUICtrlIpAddress_Create GUICtrlIpAddress_Destroy ' +
        'GUICtrlIpAddress_Get GUICtrlIpAddress_GetArray ' +
        'GUICtrlIpAddress_GetEx GUICtrlIpAddress_IsBlank ' +
        'GUICtrlIpAddress_Set GUICtrlIpAddress_SetArray ' +
        'GUICtrlIpAddress_SetEx GUICtrlIpAddress_SetFocus ' +
        'GUICtrlIpAddress_SetFont GUICtrlIpAddress_SetRange ' +
        'GUICtrlIpAddress_ShowHide GUICtrlListBox_AddFile ' +
        'GUICtrlListBox_AddString GUICtrlListBox_BeginUpdate ' +
        'GUICtrlListBox_ClickItem GUICtrlListBox_Create ' +
        'GUICtrlListBox_DeleteString GUICtrlListBox_Destroy ' +
        'GUICtrlListBox_Dir GUICtrlListBox_EndUpdate ' +
        'GUICtrlListBox_FindInText GUICtrlListBox_FindString ' +
        'GUICtrlListBox_GetAnchorIndex GUICtrlListBox_GetCaretIndex ' +
        'GUICtrlListBox_GetCount GUICtrlListBox_GetCurSel ' +
        'GUICtrlListBox_GetHorizontalExtent GUICtrlListBox_GetItemData ' +
        'GUICtrlListBox_GetItemHeight GUICtrlListBox_GetItemRect ' +
        'GUICtrlListBox_GetItemRectEx GUICtrlListBox_GetListBoxInfo ' +
        'GUICtrlListBox_GetLocale GUICtrlListBox_GetLocaleCountry ' +
        'GUICtrlListBox_GetLocaleLang GUICtrlListBox_GetLocalePrimLang ' +
        'GUICtrlListBox_GetLocaleSubLang GUICtrlListBox_GetSel ' +
        'GUICtrlListBox_GetSelCount GUICtrlListBox_GetSelItems ' +
        'GUICtrlListBox_GetSelItemsText GUICtrlListBox_GetText ' +
        'GUICtrlListBox_GetTextLen GUICtrlListBox_GetTopIndex ' +
        'GUICtrlListBox_InitStorage GUICtrlListBox_InsertString ' +
        'GUICtrlListBox_ItemFromPoint GUICtrlListBox_ReplaceString ' +
        'GUICtrlListBox_ResetContent GUICtrlListBox_SelectString ' +
        'GUICtrlListBox_SelItemRange GUICtrlListBox_SelItemRangeEx ' +
        'GUICtrlListBox_SetAnchorIndex GUICtrlListBox_SetCaretIndex ' +
        'GUICtrlListBox_SetColumnWidth GUICtrlListBox_SetCurSel ' +
        'GUICtrlListBox_SetHorizontalExtent GUICtrlListBox_SetItemData ' +
        'GUICtrlListBox_SetItemHeight GUICtrlListBox_SetLocale ' +
        'GUICtrlListBox_SetSel GUICtrlListBox_SetTabStops ' +
        'GUICtrlListBox_SetTopIndex GUICtrlListBox_Sort ' +
        'GUICtrlListBox_SwapString GUICtrlListBox_UpdateHScroll ' +
        'GUICtrlListView_AddArray GUICtrlListView_AddColumn ' +
        'GUICtrlListView_AddItem GUICtrlListView_AddSubItem ' +
        'GUICtrlListView_ApproximateViewHeight ' +
        'GUICtrlListView_ApproximateViewRect ' +
        'GUICtrlListView_ApproximateViewWidth GUICtrlListView_Arrange ' +
        'GUICtrlListView_BeginUpdate GUICtrlListView_CancelEditLabel ' +
        'GUICtrlListView_ClickItem GUICtrlListView_CopyItems ' +
        'GUICtrlListView_Create GUICtrlListView_CreateDragImage ' +
        'GUICtrlListView_CreateSolidBitMap ' +
        'GUICtrlListView_DeleteAllItems GUICtrlListView_DeleteColumn ' +
        'GUICtrlListView_DeleteItem GUICtrlListView_DeleteItemsSelected ' +
        'GUICtrlListView_Destroy GUICtrlListView_DrawDragImage ' +
        'GUICtrlListView_EditLabel GUICtrlListView_EnableGroupView ' +
        'GUICtrlListView_EndUpdate GUICtrlListView_EnsureVisible ' +
        'GUICtrlListView_FindInText GUICtrlListView_FindItem ' +
        'GUICtrlListView_FindNearest GUICtrlListView_FindParam ' +
        'GUICtrlListView_FindText GUICtrlListView_GetBkColor ' +
        'GUICtrlListView_GetBkImage GUICtrlListView_GetCallbackMask ' +
        'GUICtrlListView_GetColumn GUICtrlListView_GetColumnCount ' +
        'GUICtrlListView_GetColumnOrder ' +
        'GUICtrlListView_GetColumnOrderArray ' +
        'GUICtrlListView_GetColumnWidth GUICtrlListView_GetCounterPage ' +
        'GUICtrlListView_GetEditControl ' +
        'GUICtrlListView_GetExtendedListViewStyle ' +
        'GUICtrlListView_GetFocusedGroup GUICtrlListView_GetGroupCount ' +
        'GUICtrlListView_GetGroupInfo ' +
        'GUICtrlListView_GetGroupInfoByIndex ' +
        'GUICtrlListView_GetGroupRect ' +
        'GUICtrlListView_GetGroupViewEnabled GUICtrlListView_GetHeader ' +
        'GUICtrlListView_GetHotCursor GUICtrlListView_GetHotItem ' +
        'GUICtrlListView_GetHoverTime GUICtrlListView_GetImageList ' +
        'GUICtrlListView_GetISearchString GUICtrlListView_GetItem ' +
        'GUICtrlListView_GetItemChecked GUICtrlListView_GetItemCount ' +
        'GUICtrlListView_GetItemCut GUICtrlListView_GetItemDropHilited ' +
        'GUICtrlListView_GetItemEx GUICtrlListView_GetItemFocused ' +
        'GUICtrlListView_GetItemGroupID GUICtrlListView_GetItemImage ' +
        'GUICtrlListView_GetItemIndent GUICtrlListView_GetItemParam ' +
        'GUICtrlListView_GetItemPosition ' +
        'GUICtrlListView_GetItemPositionX ' +
        'GUICtrlListView_GetItemPositionY GUICtrlListView_GetItemRect ' +
        'GUICtrlListView_GetItemRectEx GUICtrlListView_GetItemSelected ' +
        'GUICtrlListView_GetItemSpacing GUICtrlListView_GetItemSpacingX ' +
        'GUICtrlListView_GetItemSpacingY GUICtrlListView_GetItemState ' +
        'GUICtrlListView_GetItemStateImage GUICtrlListView_GetItemText ' +
        'GUICtrlListView_GetItemTextArray ' +
        'GUICtrlListView_GetItemTextString GUICtrlListView_GetNextItem ' +
        'GUICtrlListView_GetNumberOfWorkAreas GUICtrlListView_GetOrigin ' +
        'GUICtrlListView_GetOriginX GUICtrlListView_GetOriginY ' +
        'GUICtrlListView_GetOutlineColor ' +
        'GUICtrlListView_GetSelectedColumn ' +
        'GUICtrlListView_GetSelectedCount ' +
        'GUICtrlListView_GetSelectedIndices ' +
        'GUICtrlListView_GetSelectionMark GUICtrlListView_GetStringWidth ' +
        'GUICtrlListView_GetSubItemRect GUICtrlListView_GetTextBkColor ' +
        'GUICtrlListView_GetTextColor GUICtrlListView_GetToolTips ' +
        'GUICtrlListView_GetTopIndex GUICtrlListView_GetUnicodeFormat ' +
        'GUICtrlListView_GetView GUICtrlListView_GetViewDetails ' +
        'GUICtrlListView_GetViewLarge GUICtrlListView_GetViewList ' +
        'GUICtrlListView_GetViewRect GUICtrlListView_GetViewSmall ' +
        'GUICtrlListView_GetViewTile GUICtrlListView_HideColumn ' +
        'GUICtrlListView_HitTest GUICtrlListView_InsertColumn ' +
        'GUICtrlListView_InsertGroup GUICtrlListView_InsertItem ' +
        'GUICtrlListView_JustifyColumn GUICtrlListView_MapIDToIndex ' +
        'GUICtrlListView_MapIndexToID GUICtrlListView_RedrawItems ' +
        'GUICtrlListView_RegisterSortCallBack ' +
        'GUICtrlListView_RemoveAllGroups GUICtrlListView_RemoveGroup ' +
        'GUICtrlListView_Scroll GUICtrlListView_SetBkColor ' +
        'GUICtrlListView_SetBkImage GUICtrlListView_SetCallBackMask ' +
        'GUICtrlListView_SetColumn GUICtrlListView_SetColumnOrder ' +
        'GUICtrlListView_SetColumnOrderArray ' +
        'GUICtrlListView_SetColumnWidth ' +
        'GUICtrlListView_SetExtendedListViewStyle ' +
        'GUICtrlListView_SetGroupInfo GUICtrlListView_SetHotItem ' +
        'GUICtrlListView_SetHoverTime GUICtrlListView_SetIconSpacing ' +
        'GUICtrlListView_SetImageList GUICtrlListView_SetItem ' +
        'GUICtrlListView_SetItemChecked GUICtrlListView_SetItemCount ' +
        'GUICtrlListView_SetItemCut GUICtrlListView_SetItemDropHilited ' +
        'GUICtrlListView_SetItemEx GUICtrlListView_SetItemFocused ' +
        'GUICtrlListView_SetItemGroupID GUICtrlListView_SetItemImage ' +
        'GUICtrlListView_SetItemIndent GUICtrlListView_SetItemParam ' +
        'GUICtrlListView_SetItemPosition ' +
        'GUICtrlListView_SetItemPosition32 ' +
        'GUICtrlListView_SetItemSelected GUICtrlListView_SetItemState ' +
        'GUICtrlListView_SetItemStateImage GUICtrlListView_SetItemText ' +
        'GUICtrlListView_SetOutlineColor ' +
        'GUICtrlListView_SetSelectedColumn ' +
        'GUICtrlListView_SetSelectionMark GUICtrlListView_SetTextBkColor ' +
        'GUICtrlListView_SetTextColor GUICtrlListView_SetToolTips ' +
        'GUICtrlListView_SetUnicodeFormat GUICtrlListView_SetView ' +
        'GUICtrlListView_SetWorkAreas GUICtrlListView_SimpleSort ' +
        'GUICtrlListView_SortItems GUICtrlListView_SubItemHitTest ' +
        'GUICtrlListView_UnRegisterSortCallBack GUICtrlMenu_AddMenuItem ' +
        'GUICtrlMenu_AppendMenu GUICtrlMenu_CalculatePopupWindowPosition ' +
        'GUICtrlMenu_CheckMenuItem GUICtrlMenu_CheckRadioItem ' +
        'GUICtrlMenu_CreateMenu GUICtrlMenu_CreatePopup ' +
        'GUICtrlMenu_DeleteMenu GUICtrlMenu_DestroyMenu ' +
        'GUICtrlMenu_DrawMenuBar GUICtrlMenu_EnableMenuItem ' +
        'GUICtrlMenu_FindItem GUICtrlMenu_FindParent ' +
        'GUICtrlMenu_GetItemBmp GUICtrlMenu_GetItemBmpChecked ' +
        'GUICtrlMenu_GetItemBmpUnchecked GUICtrlMenu_GetItemChecked ' +
        'GUICtrlMenu_GetItemCount GUICtrlMenu_GetItemData ' +
        'GUICtrlMenu_GetItemDefault GUICtrlMenu_GetItemDisabled ' +
        'GUICtrlMenu_GetItemEnabled GUICtrlMenu_GetItemGrayed ' +
        'GUICtrlMenu_GetItemHighlighted GUICtrlMenu_GetItemID ' +
        'GUICtrlMenu_GetItemInfo GUICtrlMenu_GetItemRect ' +
        'GUICtrlMenu_GetItemRectEx GUICtrlMenu_GetItemState ' +
        'GUICtrlMenu_GetItemStateEx GUICtrlMenu_GetItemSubMenu ' +
        'GUICtrlMenu_GetItemText GUICtrlMenu_GetItemType ' +
        'GUICtrlMenu_GetMenu GUICtrlMenu_GetMenuBackground ' +
        'GUICtrlMenu_GetMenuBarInfo GUICtrlMenu_GetMenuContextHelpID ' +
        'GUICtrlMenu_GetMenuData GUICtrlMenu_GetMenuDefaultItem ' +
        'GUICtrlMenu_GetMenuHeight GUICtrlMenu_GetMenuInfo ' +
        'GUICtrlMenu_GetMenuStyle GUICtrlMenu_GetSystemMenu ' +
        'GUICtrlMenu_InsertMenuItem GUICtrlMenu_InsertMenuItemEx ' +
        'GUICtrlMenu_IsMenu GUICtrlMenu_LoadMenu ' +
        'GUICtrlMenu_MapAccelerator GUICtrlMenu_MenuItemFromPoint ' +
        'GUICtrlMenu_RemoveMenu GUICtrlMenu_SetItemBitmaps ' +
        'GUICtrlMenu_SetItemBmp GUICtrlMenu_SetItemBmpChecked ' +
        'GUICtrlMenu_SetItemBmpUnchecked GUICtrlMenu_SetItemChecked ' +
        'GUICtrlMenu_SetItemData GUICtrlMenu_SetItemDefault ' +
        'GUICtrlMenu_SetItemDisabled GUICtrlMenu_SetItemEnabled ' +
        'GUICtrlMenu_SetItemGrayed GUICtrlMenu_SetItemHighlighted ' +
        'GUICtrlMenu_SetItemID GUICtrlMenu_SetItemInfo ' +
        'GUICtrlMenu_SetItemState GUICtrlMenu_SetItemSubMenu ' +
        'GUICtrlMenu_SetItemText GUICtrlMenu_SetItemType ' +
        'GUICtrlMenu_SetMenu GUICtrlMenu_SetMenuBackground ' +
        'GUICtrlMenu_SetMenuContextHelpID GUICtrlMenu_SetMenuData ' +
        'GUICtrlMenu_SetMenuDefaultItem GUICtrlMenu_SetMenuHeight ' +
        'GUICtrlMenu_SetMenuInfo GUICtrlMenu_SetMenuStyle ' +
        'GUICtrlMenu_TrackPopupMenu GUICtrlMonthCal_Create ' +
        'GUICtrlMonthCal_Destroy GUICtrlMonthCal_GetCalendarBorder ' +
        'GUICtrlMonthCal_GetCalendarCount GUICtrlMonthCal_GetColor ' +
        'GUICtrlMonthCal_GetColorArray GUICtrlMonthCal_GetCurSel ' +
        'GUICtrlMonthCal_GetCurSelStr GUICtrlMonthCal_GetFirstDOW ' +
        'GUICtrlMonthCal_GetFirstDOWStr GUICtrlMonthCal_GetMaxSelCount ' +
        'GUICtrlMonthCal_GetMaxTodayWidth ' +
        'GUICtrlMonthCal_GetMinReqHeight GUICtrlMonthCal_GetMinReqRect ' +
        'GUICtrlMonthCal_GetMinReqRectArray ' +
        'GUICtrlMonthCal_GetMinReqWidth GUICtrlMonthCal_GetMonthDelta ' +
        'GUICtrlMonthCal_GetMonthRange GUICtrlMonthCal_GetMonthRangeMax ' +
        'GUICtrlMonthCal_GetMonthRangeMaxStr ' +
        'GUICtrlMonthCal_GetMonthRangeMin ' +
        'GUICtrlMonthCal_GetMonthRangeMinStr ' +
        'GUICtrlMonthCal_GetMonthRangeSpan GUICtrlMonthCal_GetRange ' +
        'GUICtrlMonthCal_GetRangeMax GUICtrlMonthCal_GetRangeMaxStr ' +
        'GUICtrlMonthCal_GetRangeMin GUICtrlMonthCal_GetRangeMinStr ' +
        'GUICtrlMonthCal_GetSelRange GUICtrlMonthCal_GetSelRangeMax ' +
        'GUICtrlMonthCal_GetSelRangeMaxStr ' +
        'GUICtrlMonthCal_GetSelRangeMin ' +
        'GUICtrlMonthCal_GetSelRangeMinStr GUICtrlMonthCal_GetToday ' +
        'GUICtrlMonthCal_GetTodayStr GUICtrlMonthCal_GetUnicodeFormat ' +
        'GUICtrlMonthCal_HitTest GUICtrlMonthCal_SetCalendarBorder ' +
        'GUICtrlMonthCal_SetColor GUICtrlMonthCal_SetCurSel ' +
        'GUICtrlMonthCal_SetDayState GUICtrlMonthCal_SetFirstDOW ' +
        'GUICtrlMonthCal_SetMaxSelCount GUICtrlMonthCal_SetMonthDelta ' +
        'GUICtrlMonthCal_SetRange GUICtrlMonthCal_SetSelRange ' +
        'GUICtrlMonthCal_SetToday GUICtrlMonthCal_SetUnicodeFormat ' +
        'GUICtrlRebar_AddBand GUICtrlRebar_AddToolBarBand ' +
        'GUICtrlRebar_BeginDrag GUICtrlRebar_Create ' +
        'GUICtrlRebar_DeleteBand GUICtrlRebar_Destroy ' +
        'GUICtrlRebar_DragMove GUICtrlRebar_EndDrag ' +
        'GUICtrlRebar_GetBandBackColor GUICtrlRebar_GetBandBorders ' +
        'GUICtrlRebar_GetBandBordersEx GUICtrlRebar_GetBandChildHandle ' +
        'GUICtrlRebar_GetBandChildSize GUICtrlRebar_GetBandCount ' +
        'GUICtrlRebar_GetBandForeColor GUICtrlRebar_GetBandHeaderSize ' +
        'GUICtrlRebar_GetBandID GUICtrlRebar_GetBandIdealSize ' +
        'GUICtrlRebar_GetBandLength GUICtrlRebar_GetBandLParam ' +
        'GUICtrlRebar_GetBandMargins GUICtrlRebar_GetBandMarginsEx ' +
        'GUICtrlRebar_GetBandRect GUICtrlRebar_GetBandRectEx ' +
        'GUICtrlRebar_GetBandStyle GUICtrlRebar_GetBandStyleBreak ' +
        'GUICtrlRebar_GetBandStyleChildEdge ' +
        'GUICtrlRebar_GetBandStyleFixedBMP ' +
        'GUICtrlRebar_GetBandStyleFixedSize ' +
        'GUICtrlRebar_GetBandStyleGripperAlways ' +
        'GUICtrlRebar_GetBandStyleHidden ' +
        'GUICtrlRebar_GetBandStyleHideTitle ' +
        'GUICtrlRebar_GetBandStyleNoGripper ' +
        'GUICtrlRebar_GetBandStyleTopAlign ' +
        'GUICtrlRebar_GetBandStyleUseChevron ' +
        'GUICtrlRebar_GetBandStyleVariableHeight ' +
        'GUICtrlRebar_GetBandText GUICtrlRebar_GetBarHeight ' +
        'GUICtrlRebar_GetBarInfo GUICtrlRebar_GetBKColor ' +
        'GUICtrlRebar_GetColorScheme GUICtrlRebar_GetRowCount ' +
        'GUICtrlRebar_GetRowHeight GUICtrlRebar_GetTextColor ' +
        'GUICtrlRebar_GetToolTips GUICtrlRebar_GetUnicodeFormat ' +
        'GUICtrlRebar_HitTest GUICtrlRebar_IDToIndex ' +
        'GUICtrlRebar_MaximizeBand GUICtrlRebar_MinimizeBand ' +
        'GUICtrlRebar_MoveBand GUICtrlRebar_SetBandBackColor ' +
        'GUICtrlRebar_SetBandForeColor GUICtrlRebar_SetBandHeaderSize ' +
        'GUICtrlRebar_SetBandID GUICtrlRebar_SetBandIdealSize ' +
        'GUICtrlRebar_SetBandLength GUICtrlRebar_SetBandLParam ' +
        'GUICtrlRebar_SetBandStyle GUICtrlRebar_SetBandStyleBreak ' +
        'GUICtrlRebar_SetBandStyleChildEdge ' +
        'GUICtrlRebar_SetBandStyleFixedBMP ' +
        'GUICtrlRebar_SetBandStyleFixedSize ' +
        'GUICtrlRebar_SetBandStyleGripperAlways ' +
        'GUICtrlRebar_SetBandStyleHidden ' +
        'GUICtrlRebar_SetBandStyleHideTitle ' +
        'GUICtrlRebar_SetBandStyleNoGripper ' +
        'GUICtrlRebar_SetBandStyleTopAlign ' +
        'GUICtrlRebar_SetBandStyleUseChevron ' +
        'GUICtrlRebar_SetBandStyleVariableHeight ' +
        'GUICtrlRebar_SetBandText GUICtrlRebar_SetBarInfo ' +
        'GUICtrlRebar_SetBKColor GUICtrlRebar_SetColorScheme ' +
        'GUICtrlRebar_SetTextColor GUICtrlRebar_SetToolTips ' +
        'GUICtrlRebar_SetUnicodeFormat GUICtrlRebar_ShowBand ' +
        'GUICtrlRichEdit_AppendText GUICtrlRichEdit_AutoDetectURL ' +
        'GUICtrlRichEdit_CanPaste GUICtrlRichEdit_CanPasteSpecial ' +
        'GUICtrlRichEdit_CanRedo GUICtrlRichEdit_CanUndo ' +
        'GUICtrlRichEdit_ChangeFontSize GUICtrlRichEdit_Copy ' +
        'GUICtrlRichEdit_Create GUICtrlRichEdit_Cut ' +
        'GUICtrlRichEdit_Deselect GUICtrlRichEdit_Destroy ' +
        'GUICtrlRichEdit_EmptyUndoBuffer GUICtrlRichEdit_FindText ' +
        'GUICtrlRichEdit_FindTextInRange GUICtrlRichEdit_GetBkColor ' +
        'GUICtrlRichEdit_GetCharAttributes ' +
        'GUICtrlRichEdit_GetCharBkColor GUICtrlRichEdit_GetCharColor ' +
        'GUICtrlRichEdit_GetCharPosFromXY ' +
        'GUICtrlRichEdit_GetCharPosOfNextWord ' +
        'GUICtrlRichEdit_GetCharPosOfPreviousWord ' +
        'GUICtrlRichEdit_GetCharWordBreakInfo ' +
        'GUICtrlRichEdit_GetFirstCharPosOnLine GUICtrlRichEdit_GetFont ' +
        'GUICtrlRichEdit_GetLineCount GUICtrlRichEdit_GetLineLength ' +
        'GUICtrlRichEdit_GetLineNumberFromCharPos ' +
        'GUICtrlRichEdit_GetNextRedo GUICtrlRichEdit_GetNextUndo ' +
        'GUICtrlRichEdit_GetNumberOfFirstVisibleLine ' +
        'GUICtrlRichEdit_GetParaAlignment ' +
        'GUICtrlRichEdit_GetParaAttributes GUICtrlRichEdit_GetParaBorder ' +
        'GUICtrlRichEdit_GetParaIndents GUICtrlRichEdit_GetParaNumbering ' +
        'GUICtrlRichEdit_GetParaShading GUICtrlRichEdit_GetParaSpacing ' +
        'GUICtrlRichEdit_GetParaTabStops GUICtrlRichEdit_GetPasswordChar ' +
        'GUICtrlRichEdit_GetRECT GUICtrlRichEdit_GetScrollPos ' +
        'GUICtrlRichEdit_GetSel GUICtrlRichEdit_GetSelAA ' +
        'GUICtrlRichEdit_GetSelText GUICtrlRichEdit_GetSpaceUnit ' +
        'GUICtrlRichEdit_GetText GUICtrlRichEdit_GetTextInLine ' +
        'GUICtrlRichEdit_GetTextInRange GUICtrlRichEdit_GetTextLength ' +
        'GUICtrlRichEdit_GetVersion GUICtrlRichEdit_GetXYFromCharPos ' +
        'GUICtrlRichEdit_GetZoom GUICtrlRichEdit_GotoCharPos ' +
        'GUICtrlRichEdit_HideSelection GUICtrlRichEdit_InsertText ' +
        'GUICtrlRichEdit_IsModified GUICtrlRichEdit_IsTextSelected ' +
        'GUICtrlRichEdit_Paste GUICtrlRichEdit_PasteSpecial ' +
        'GUICtrlRichEdit_PauseRedraw GUICtrlRichEdit_Redo ' +
        'GUICtrlRichEdit_ReplaceText GUICtrlRichEdit_ResumeRedraw ' +
        'GUICtrlRichEdit_ScrollLineOrPage GUICtrlRichEdit_ScrollLines ' +
        'GUICtrlRichEdit_ScrollToCaret GUICtrlRichEdit_SetBkColor ' +
        'GUICtrlRichEdit_SetCharAttributes ' +
        'GUICtrlRichEdit_SetCharBkColor GUICtrlRichEdit_SetCharColor ' +
        'GUICtrlRichEdit_SetEventMask GUICtrlRichEdit_SetFont ' +
        'GUICtrlRichEdit_SetLimitOnText GUICtrlRichEdit_SetModified ' +
        'GUICtrlRichEdit_SetParaAlignment ' +
        'GUICtrlRichEdit_SetParaAttributes GUICtrlRichEdit_SetParaBorder ' +
        'GUICtrlRichEdit_SetParaIndents GUICtrlRichEdit_SetParaNumbering ' +
        'GUICtrlRichEdit_SetParaShading GUICtrlRichEdit_SetParaSpacing ' +
        'GUICtrlRichEdit_SetParaTabStops GUICtrlRichEdit_SetPasswordChar ' +
        'GUICtrlRichEdit_SetReadOnly GUICtrlRichEdit_SetRECT ' +
        'GUICtrlRichEdit_SetScrollPos GUICtrlRichEdit_SetSel ' +
        'GUICtrlRichEdit_SetSpaceUnit GUICtrlRichEdit_SetTabStops ' +
        'GUICtrlRichEdit_SetText GUICtrlRichEdit_SetUndoLimit ' +
        'GUICtrlRichEdit_SetZoom GUICtrlRichEdit_StreamFromFile ' +
        'GUICtrlRichEdit_StreamFromVar GUICtrlRichEdit_StreamToFile ' +
        'GUICtrlRichEdit_StreamToVar GUICtrlRichEdit_Undo ' +
        'GUICtrlSlider_ClearSel GUICtrlSlider_ClearTics ' +
        'GUICtrlSlider_Create GUICtrlSlider_Destroy ' +
        'GUICtrlSlider_GetBuddy GUICtrlSlider_GetChannelRect ' +
        'GUICtrlSlider_GetChannelRectEx GUICtrlSlider_GetLineSize ' +
        'GUICtrlSlider_GetLogicalTics GUICtrlSlider_GetNumTics ' +
        'GUICtrlSlider_GetPageSize GUICtrlSlider_GetPos ' +
        'GUICtrlSlider_GetRange GUICtrlSlider_GetRangeMax ' +
        'GUICtrlSlider_GetRangeMin GUICtrlSlider_GetSel ' +
        'GUICtrlSlider_GetSelEnd GUICtrlSlider_GetSelStart ' +
        'GUICtrlSlider_GetThumbLength GUICtrlSlider_GetThumbRect ' +
        'GUICtrlSlider_GetThumbRectEx GUICtrlSlider_GetTic ' +
        'GUICtrlSlider_GetTicPos GUICtrlSlider_GetToolTips ' +
        'GUICtrlSlider_GetUnicodeFormat GUICtrlSlider_SetBuddy ' +
        'GUICtrlSlider_SetLineSize GUICtrlSlider_SetPageSize ' +
        'GUICtrlSlider_SetPos GUICtrlSlider_SetRange ' +
        'GUICtrlSlider_SetRangeMax GUICtrlSlider_SetRangeMin ' +
        'GUICtrlSlider_SetSel GUICtrlSlider_SetSelEnd ' +
        'GUICtrlSlider_SetSelStart GUICtrlSlider_SetThumbLength ' +
        'GUICtrlSlider_SetTic GUICtrlSlider_SetTicFreq ' +
        'GUICtrlSlider_SetTipSide GUICtrlSlider_SetToolTips ' +
        'GUICtrlSlider_SetUnicodeFormat GUICtrlStatusBar_Create ' +
        'GUICtrlStatusBar_Destroy GUICtrlStatusBar_EmbedControl ' +
        'GUICtrlStatusBar_GetBorders GUICtrlStatusBar_GetBordersHorz ' +
        'GUICtrlStatusBar_GetBordersRect GUICtrlStatusBar_GetBordersVert ' +
        'GUICtrlStatusBar_GetCount GUICtrlStatusBar_GetHeight ' +
        'GUICtrlStatusBar_GetIcon GUICtrlStatusBar_GetParts ' +
        'GUICtrlStatusBar_GetRect GUICtrlStatusBar_GetRectEx ' +
        'GUICtrlStatusBar_GetText GUICtrlStatusBar_GetTextFlags ' +
        'GUICtrlStatusBar_GetTextLength GUICtrlStatusBar_GetTextLengthEx ' +
        'GUICtrlStatusBar_GetTipText GUICtrlStatusBar_GetUnicodeFormat ' +
        'GUICtrlStatusBar_GetWidth GUICtrlStatusBar_IsSimple ' +
        'GUICtrlStatusBar_Resize GUICtrlStatusBar_SetBkColor ' +
        'GUICtrlStatusBar_SetIcon GUICtrlStatusBar_SetMinHeight ' +
        'GUICtrlStatusBar_SetParts GUICtrlStatusBar_SetSimple ' +
        'GUICtrlStatusBar_SetText GUICtrlStatusBar_SetTipText ' +
        'GUICtrlStatusBar_SetUnicodeFormat GUICtrlStatusBar_ShowHide ' +
        'GUICtrlTab_ActivateTab GUICtrlTab_ClickTab GUICtrlTab_Create ' +
        'GUICtrlTab_DeleteAllItems GUICtrlTab_DeleteItem ' +
        'GUICtrlTab_DeselectAll GUICtrlTab_Destroy GUICtrlTab_FindTab ' +
        'GUICtrlTab_GetCurFocus GUICtrlTab_GetCurSel ' +
        'GUICtrlTab_GetDisplayRect GUICtrlTab_GetDisplayRectEx ' +
        'GUICtrlTab_GetExtendedStyle GUICtrlTab_GetImageList ' +
        'GUICtrlTab_GetItem GUICtrlTab_GetItemCount ' +
        'GUICtrlTab_GetItemImage GUICtrlTab_GetItemParam ' +
        'GUICtrlTab_GetItemRect GUICtrlTab_GetItemRectEx ' +
        'GUICtrlTab_GetItemState GUICtrlTab_GetItemText ' +
        'GUICtrlTab_GetRowCount GUICtrlTab_GetToolTips ' +
        'GUICtrlTab_GetUnicodeFormat GUICtrlTab_HighlightItem ' +
        'GUICtrlTab_HitTest GUICtrlTab_InsertItem ' +
        'GUICtrlTab_RemoveImage GUICtrlTab_SetCurFocus ' +
        'GUICtrlTab_SetCurSel GUICtrlTab_SetExtendedStyle ' +
        'GUICtrlTab_SetImageList GUICtrlTab_SetItem ' +
        'GUICtrlTab_SetItemImage GUICtrlTab_SetItemParam ' +
        'GUICtrlTab_SetItemSize GUICtrlTab_SetItemState ' +
        'GUICtrlTab_SetItemText GUICtrlTab_SetMinTabWidth ' +
        'GUICtrlTab_SetPadding GUICtrlTab_SetToolTips ' +
        'GUICtrlTab_SetUnicodeFormat GUICtrlToolbar_AddBitmap ' +
        'GUICtrlToolbar_AddButton GUICtrlToolbar_AddButtonSep ' +
        'GUICtrlToolbar_AddString GUICtrlToolbar_ButtonCount ' +
        'GUICtrlToolbar_CheckButton GUICtrlToolbar_ClickAccel ' +
        'GUICtrlToolbar_ClickButton GUICtrlToolbar_ClickIndex ' +
        'GUICtrlToolbar_CommandToIndex GUICtrlToolbar_Create ' +
        'GUICtrlToolbar_Customize GUICtrlToolbar_DeleteButton ' +
        'GUICtrlToolbar_Destroy GUICtrlToolbar_EnableButton ' +
        'GUICtrlToolbar_FindToolbar GUICtrlToolbar_GetAnchorHighlight ' +
        'GUICtrlToolbar_GetBitmapFlags GUICtrlToolbar_GetButtonBitmap ' +
        'GUICtrlToolbar_GetButtonInfo GUICtrlToolbar_GetButtonInfoEx ' +
        'GUICtrlToolbar_GetButtonParam GUICtrlToolbar_GetButtonRect ' +
        'GUICtrlToolbar_GetButtonRectEx GUICtrlToolbar_GetButtonSize ' +
        'GUICtrlToolbar_GetButtonState GUICtrlToolbar_GetButtonStyle ' +
        'GUICtrlToolbar_GetButtonText GUICtrlToolbar_GetColorScheme ' +
        'GUICtrlToolbar_GetDisabledImageList ' +
        'GUICtrlToolbar_GetExtendedStyle GUICtrlToolbar_GetHotImageList ' +
        'GUICtrlToolbar_GetHotItem GUICtrlToolbar_GetImageList ' +
        'GUICtrlToolbar_GetInsertMark GUICtrlToolbar_GetInsertMarkColor ' +
        'GUICtrlToolbar_GetMaxSize GUICtrlToolbar_GetMetrics ' +
        'GUICtrlToolbar_GetPadding GUICtrlToolbar_GetRows ' +
        'GUICtrlToolbar_GetString GUICtrlToolbar_GetStyle ' +
        'GUICtrlToolbar_GetStyleAltDrag ' +
        'GUICtrlToolbar_GetStyleCustomErase GUICtrlToolbar_GetStyleFlat ' +
        'GUICtrlToolbar_GetStyleList GUICtrlToolbar_GetStyleRegisterDrop ' +
        'GUICtrlToolbar_GetStyleToolTips ' +
        'GUICtrlToolbar_GetStyleTransparent ' +
        'GUICtrlToolbar_GetStyleWrapable GUICtrlToolbar_GetTextRows ' +
        'GUICtrlToolbar_GetToolTips GUICtrlToolbar_GetUnicodeFormat ' +
        'GUICtrlToolbar_HideButton GUICtrlToolbar_HighlightButton ' +
        'GUICtrlToolbar_HitTest GUICtrlToolbar_IndexToCommand ' +
        'GUICtrlToolbar_InsertButton GUICtrlToolbar_InsertMarkHitTest ' +
        'GUICtrlToolbar_IsButtonChecked GUICtrlToolbar_IsButtonEnabled ' +
        'GUICtrlToolbar_IsButtonHidden ' +
        'GUICtrlToolbar_IsButtonHighlighted ' +
        'GUICtrlToolbar_IsButtonIndeterminate ' +
        'GUICtrlToolbar_IsButtonPressed GUICtrlToolbar_LoadBitmap ' +
        'GUICtrlToolbar_LoadImages GUICtrlToolbar_MapAccelerator ' +
        'GUICtrlToolbar_MoveButton GUICtrlToolbar_PressButton ' +
        'GUICtrlToolbar_SetAnchorHighlight GUICtrlToolbar_SetBitmapSize ' +
        'GUICtrlToolbar_SetButtonBitMap GUICtrlToolbar_SetButtonInfo ' +
        'GUICtrlToolbar_SetButtonInfoEx GUICtrlToolbar_SetButtonParam ' +
        'GUICtrlToolbar_SetButtonSize GUICtrlToolbar_SetButtonState ' +
        'GUICtrlToolbar_SetButtonStyle GUICtrlToolbar_SetButtonText ' +
        'GUICtrlToolbar_SetButtonWidth GUICtrlToolbar_SetCmdID ' +
        'GUICtrlToolbar_SetColorScheme ' +
        'GUICtrlToolbar_SetDisabledImageList ' +
        'GUICtrlToolbar_SetDrawTextFlags GUICtrlToolbar_SetExtendedStyle ' +
        'GUICtrlToolbar_SetHotImageList GUICtrlToolbar_SetHotItem ' +
        'GUICtrlToolbar_SetImageList GUICtrlToolbar_SetIndent ' +
        'GUICtrlToolbar_SetIndeterminate GUICtrlToolbar_SetInsertMark ' +
        'GUICtrlToolbar_SetInsertMarkColor GUICtrlToolbar_SetMaxTextRows ' +
        'GUICtrlToolbar_SetMetrics GUICtrlToolbar_SetPadding ' +
        'GUICtrlToolbar_SetParent GUICtrlToolbar_SetRows ' +
        'GUICtrlToolbar_SetStyle GUICtrlToolbar_SetStyleAltDrag ' +
        'GUICtrlToolbar_SetStyleCustomErase GUICtrlToolbar_SetStyleFlat ' +
        'GUICtrlToolbar_SetStyleList GUICtrlToolbar_SetStyleRegisterDrop ' +
        'GUICtrlToolbar_SetStyleToolTips ' +
        'GUICtrlToolbar_SetStyleTransparent ' +
        'GUICtrlToolbar_SetStyleWrapable GUICtrlToolbar_SetToolTips ' +
        'GUICtrlToolbar_SetUnicodeFormat GUICtrlToolbar_SetWindowTheme ' +
        'GUICtrlTreeView_Add GUICtrlTreeView_AddChild ' +
        'GUICtrlTreeView_AddChildFirst GUICtrlTreeView_AddFirst ' +
        'GUICtrlTreeView_BeginUpdate GUICtrlTreeView_ClickItem ' +
        'GUICtrlTreeView_Create GUICtrlTreeView_CreateDragImage ' +
        'GUICtrlTreeView_CreateSolidBitMap GUICtrlTreeView_Delete ' +
        'GUICtrlTreeView_DeleteAll GUICtrlTreeView_DeleteChildren ' +
        'GUICtrlTreeView_Destroy GUICtrlTreeView_DisplayRect ' +
        'GUICtrlTreeView_DisplayRectEx GUICtrlTreeView_EditText ' +
        'GUICtrlTreeView_EndEdit GUICtrlTreeView_EndUpdate ' +
        'GUICtrlTreeView_EnsureVisible GUICtrlTreeView_Expand ' +
        'GUICtrlTreeView_ExpandedOnce GUICtrlTreeView_FindItem ' +
        'GUICtrlTreeView_FindItemEx GUICtrlTreeView_GetBkColor ' +
        'GUICtrlTreeView_GetBold GUICtrlTreeView_GetChecked ' +
        'GUICtrlTreeView_GetChildCount GUICtrlTreeView_GetChildren ' +
        'GUICtrlTreeView_GetCount GUICtrlTreeView_GetCut ' +
        'GUICtrlTreeView_GetDropTarget GUICtrlTreeView_GetEditControl ' +
        'GUICtrlTreeView_GetExpanded GUICtrlTreeView_GetFirstChild ' +
        'GUICtrlTreeView_GetFirstItem GUICtrlTreeView_GetFirstVisible ' +
        'GUICtrlTreeView_GetFocused GUICtrlTreeView_GetHeight ' +
        'GUICtrlTreeView_GetImageIndex ' +
        'GUICtrlTreeView_GetImageListIconHandle ' +
        'GUICtrlTreeView_GetIndent GUICtrlTreeView_GetInsertMarkColor ' +
        'GUICtrlTreeView_GetISearchString GUICtrlTreeView_GetItemByIndex ' +
        'GUICtrlTreeView_GetItemHandle GUICtrlTreeView_GetItemParam ' +
        'GUICtrlTreeView_GetLastChild GUICtrlTreeView_GetLineColor ' +
        'GUICtrlTreeView_GetNext GUICtrlTreeView_GetNextChild ' +
        'GUICtrlTreeView_GetNextSibling GUICtrlTreeView_GetNextVisible ' +
        'GUICtrlTreeView_GetNormalImageList ' +
        'GUICtrlTreeView_GetParentHandle GUICtrlTreeView_GetParentParam ' +
        'GUICtrlTreeView_GetPrev GUICtrlTreeView_GetPrevChild ' +
        'GUICtrlTreeView_GetPrevSibling GUICtrlTreeView_GetPrevVisible ' +
        'GUICtrlTreeView_GetScrollTime GUICtrlTreeView_GetSelected ' +
        'GUICtrlTreeView_GetSelectedImageIndex ' +
        'GUICtrlTreeView_GetSelection GUICtrlTreeView_GetSiblingCount ' +
        'GUICtrlTreeView_GetState GUICtrlTreeView_GetStateImageIndex ' +
        'GUICtrlTreeView_GetStateImageList GUICtrlTreeView_GetText ' +
        'GUICtrlTreeView_GetTextColor GUICtrlTreeView_GetToolTips ' +
        'GUICtrlTreeView_GetTree GUICtrlTreeView_GetUnicodeFormat ' +
        'GUICtrlTreeView_GetVisible GUICtrlTreeView_GetVisibleCount ' +
        'GUICtrlTreeView_HitTest GUICtrlTreeView_HitTestEx ' +
        'GUICtrlTreeView_HitTestItem GUICtrlTreeView_Index ' +
        'GUICtrlTreeView_InsertItem GUICtrlTreeView_IsFirstItem ' +
        'GUICtrlTreeView_IsParent GUICtrlTreeView_Level ' +
        'GUICtrlTreeView_SelectItem GUICtrlTreeView_SelectItemByIndex ' +
        'GUICtrlTreeView_SetBkColor GUICtrlTreeView_SetBold ' +
        'GUICtrlTreeView_SetChecked GUICtrlTreeView_SetCheckedByIndex ' +
        'GUICtrlTreeView_SetChildren GUICtrlTreeView_SetCut ' +
        'GUICtrlTreeView_SetDropTarget GUICtrlTreeView_SetFocused ' +
        'GUICtrlTreeView_SetHeight GUICtrlTreeView_SetIcon ' +
        'GUICtrlTreeView_SetImageIndex GUICtrlTreeView_SetIndent ' +
        'GUICtrlTreeView_SetInsertMark ' +
        'GUICtrlTreeView_SetInsertMarkColor ' +
        'GUICtrlTreeView_SetItemHeight GUICtrlTreeView_SetItemParam ' +
        'GUICtrlTreeView_SetLineColor GUICtrlTreeView_SetNormalImageList ' +
        'GUICtrlTreeView_SetScrollTime GUICtrlTreeView_SetSelected ' +
        'GUICtrlTreeView_SetSelectedImageIndex GUICtrlTreeView_SetState ' +
        'GUICtrlTreeView_SetStateImageIndex ' +
        'GUICtrlTreeView_SetStateImageList GUICtrlTreeView_SetText ' +
        'GUICtrlTreeView_SetTextColor GUICtrlTreeView_SetToolTips ' +
        'GUICtrlTreeView_SetUnicodeFormat GUICtrlTreeView_Sort ' +
        'GUIImageList_Add GUIImageList_AddBitmap GUIImageList_AddIcon ' +
        'GUIImageList_AddMasked GUIImageList_BeginDrag ' +
        'GUIImageList_Copy GUIImageList_Create GUIImageList_Destroy ' +
        'GUIImageList_DestroyIcon GUIImageList_DragEnter ' +
        'GUIImageList_DragLeave GUIImageList_DragMove ' +
        'GUIImageList_Draw GUIImageList_DrawEx GUIImageList_Duplicate ' +
        'GUIImageList_EndDrag GUIImageList_GetBkColor ' +
        'GUIImageList_GetIcon GUIImageList_GetIconHeight ' +
        'GUIImageList_GetIconSize GUIImageList_GetIconSizeEx ' +
        'GUIImageList_GetIconWidth GUIImageList_GetImageCount ' +
        'GUIImageList_GetImageInfoEx GUIImageList_Remove ' +
        'GUIImageList_ReplaceIcon GUIImageList_SetBkColor ' +
        'GUIImageList_SetIconSize GUIImageList_SetImageCount ' +
        'GUIImageList_Swap GUIScrollBars_EnableScrollBar ' +
        'GUIScrollBars_GetScrollBarInfoEx GUIScrollBars_GetScrollBarRect ' +
        'GUIScrollBars_GetScrollBarRGState ' +
        'GUIScrollBars_GetScrollBarXYLineButton ' +
        'GUIScrollBars_GetScrollBarXYThumbBottom ' +
        'GUIScrollBars_GetScrollBarXYThumbTop ' +
        'GUIScrollBars_GetScrollInfo GUIScrollBars_GetScrollInfoEx ' +
        'GUIScrollBars_GetScrollInfoMax GUIScrollBars_GetScrollInfoMin ' +
        'GUIScrollBars_GetScrollInfoPage GUIScrollBars_GetScrollInfoPos ' +
        'GUIScrollBars_GetScrollInfoTrackPos GUIScrollBars_GetScrollPos ' +
        'GUIScrollBars_GetScrollRange GUIScrollBars_Init ' +
        'GUIScrollBars_ScrollWindow GUIScrollBars_SetScrollInfo ' +
        'GUIScrollBars_SetScrollInfoMax GUIScrollBars_SetScrollInfoMin ' +
        'GUIScrollBars_SetScrollInfoPage GUIScrollBars_SetScrollInfoPos ' +
        'GUIScrollBars_SetScrollRange GUIScrollBars_ShowScrollBar ' +
        'GUIToolTip_Activate GUIToolTip_AddTool GUIToolTip_AdjustRect ' +
        'GUIToolTip_BitsToTTF GUIToolTip_Create GUIToolTip_Deactivate ' +
        'GUIToolTip_DelTool GUIToolTip_Destroy GUIToolTip_EnumTools ' +
        'GUIToolTip_GetBubbleHeight GUIToolTip_GetBubbleSize ' +
        'GUIToolTip_GetBubbleWidth GUIToolTip_GetCurrentTool ' +
        'GUIToolTip_GetDelayTime GUIToolTip_GetMargin ' +
        'GUIToolTip_GetMarginEx GUIToolTip_GetMaxTipWidth ' +
        'GUIToolTip_GetText GUIToolTip_GetTipBkColor ' +
        'GUIToolTip_GetTipTextColor GUIToolTip_GetTitleBitMap ' +
        'GUIToolTip_GetTitleText GUIToolTip_GetToolCount ' +
        'GUIToolTip_GetToolInfo GUIToolTip_HitTest ' +
        'GUIToolTip_NewToolRect GUIToolTip_Pop GUIToolTip_PopUp ' +
        'GUIToolTip_SetDelayTime GUIToolTip_SetMargin ' +
        'GUIToolTip_SetMaxTipWidth GUIToolTip_SetTipBkColor ' +
        'GUIToolTip_SetTipTextColor GUIToolTip_SetTitle ' +
        'GUIToolTip_SetToolInfo GUIToolTip_SetWindowTheme ' +
        'GUIToolTip_ToolExists GUIToolTip_ToolToArray ' +
        'GUIToolTip_TrackActivate GUIToolTip_TrackPosition ' +
        'GUIToolTip_Update GUIToolTip_UpdateTipText HexToString ' +
        'IEAction IEAttach IEBodyReadHTML IEBodyReadText ' +
        'IEBodyWriteHTML IECreate IECreateEmbedded IEDocGetObj ' +
        'IEDocInsertHTML IEDocInsertText IEDocReadHTML ' +
        'IEDocWriteHTML IEErrorNotify IEFormElementCheckBoxSelect ' +
        'IEFormElementGetCollection IEFormElementGetObjByName ' +
        'IEFormElementGetValue IEFormElementOptionSelect ' +
        'IEFormElementRadioSelect IEFormElementSetValue ' +
        'IEFormGetCollection IEFormGetObjByName IEFormImageClick ' +
        'IEFormReset IEFormSubmit IEFrameGetCollection ' +
        'IEFrameGetObjByName IEGetObjById IEGetObjByName ' +
        'IEHeadInsertEventScript IEImgClick IEImgGetCollection ' +
        'IEIsFrameSet IELinkClickByIndex IELinkClickByText ' +
        'IELinkGetCollection IELoadWait IELoadWaitTimeout IENavigate ' +
        'IEPropertyGet IEPropertySet IEQuit IETableGetCollection ' +
        'IETableWriteToArray IETagNameAllGetCollection ' +
        'IETagNameGetCollection IE_Example IE_Introduction ' +
        'IE_VersionInfo INetExplorerCapable INetGetSource INetMail ' +
        'INetSmtpMail IsPressed MathCheckDiv Max MemGlobalAlloc ' +
        'MemGlobalFree MemGlobalLock MemGlobalSize MemGlobalUnlock ' +
        'MemMoveMemory MemVirtualAlloc MemVirtualAllocEx ' +
        'MemVirtualFree MemVirtualFreeEx Min MouseTrap ' +
        'NamedPipes_CallNamedPipe NamedPipes_ConnectNamedPipe ' +
        'NamedPipes_CreateNamedPipe NamedPipes_CreatePipe ' +
        'NamedPipes_DisconnectNamedPipe ' +
        'NamedPipes_GetNamedPipeHandleState NamedPipes_GetNamedPipeInfo ' +
        'NamedPipes_PeekNamedPipe NamedPipes_SetNamedPipeHandleState ' +
        'NamedPipes_TransactNamedPipe NamedPipes_WaitNamedPipe ' +
        'Net_Share_ConnectionEnum Net_Share_FileClose ' +
        'Net_Share_FileEnum Net_Share_FileGetInfo Net_Share_PermStr ' +
        'Net_Share_ResourceStr Net_Share_SessionDel ' +
        'Net_Share_SessionEnum Net_Share_SessionGetInfo ' +
        'Net_Share_ShareAdd Net_Share_ShareCheck Net_Share_ShareDel ' +
        'Net_Share_ShareEnum Net_Share_ShareGetInfo ' +
        'Net_Share_ShareSetInfo Net_Share_StatisticsGetSvr ' +
        'Net_Share_StatisticsGetWrk Now NowCalc NowCalcDate ' +
        'NowDate NowTime PathFull PathGetRelative PathMake ' +
        'PathSplit ProcessGetName ProcessGetPriority Radian ' +
        'ReplaceStringInFile RunDos ScreenCapture_Capture ' +
        'ScreenCapture_CaptureWnd ScreenCapture_SaveImage ' +
        'ScreenCapture_SetBMPFormat ScreenCapture_SetJPGQuality ' +
        'ScreenCapture_SetTIFColorDepth ScreenCapture_SetTIFCompression ' +
        'Security__AdjustTokenPrivileges ' +
        'Security__CreateProcessWithToken Security__DuplicateTokenEx ' +
        'Security__GetAccountSid Security__GetLengthSid ' +
        'Security__GetTokenInformation Security__ImpersonateSelf ' +
        'Security__IsValidSid Security__LookupAccountName ' +
        'Security__LookupAccountSid Security__LookupPrivilegeValue ' +
        'Security__OpenProcessToken Security__OpenThreadToken ' +
        'Security__OpenThreadTokenEx Security__SetPrivilege ' +
        'Security__SetTokenInformation Security__SidToStringSid ' +
        'Security__SidTypeStr Security__StringSidToSid SendMessage ' +
        'SendMessageA SetDate SetTime Singleton SoundClose ' +
        'SoundLength SoundOpen SoundPause SoundPlay SoundPos ' +
        'SoundResume SoundSeek SoundStatus SoundStop ' +
        'SQLite_Changes SQLite_Close SQLite_Display2DResult ' +
        'SQLite_Encode SQLite_ErrCode SQLite_ErrMsg SQLite_Escape ' +
        'SQLite_Exec SQLite_FastEncode SQLite_FastEscape ' +
        'SQLite_FetchData SQLite_FetchNames SQLite_GetTable ' +
        'SQLite_GetTable2d SQLite_LastInsertRowID SQLite_LibVersion ' +
        'SQLite_Open SQLite_Query SQLite_QueryFinalize ' +
        'SQLite_QueryReset SQLite_QuerySingleRow SQLite_SafeMode ' +
        'SQLite_SetTimeout SQLite_Shutdown SQLite_SQLiteExe ' +
        'SQLite_Startup SQLite_TotalChanges StringBetween ' +
        'StringExplode StringInsert StringProper StringRepeat ' +
        'StringTitleCase StringToHex TCPIpToName TempFile ' +
        'TicksToTime Timer_Diff Timer_GetIdleTime Timer_GetTimerID ' +
        'Timer_Init Timer_KillAllTimers Timer_KillTimer ' +
        'Timer_SetTimer TimeToTicks VersionCompare viClose ' +
        'viExecCommand viFindGpib viGpibBusReset viGTL ' +
        'viInteractiveControl viOpen viSetAttribute viSetTimeout ' +
        'WeekNumberISO WinAPI_AbortPath WinAPI_ActivateKeyboardLayout ' +
        'WinAPI_AddClipboardFormatListener WinAPI_AddFontMemResourceEx ' +
        'WinAPI_AddFontResourceEx WinAPI_AddIconOverlay ' +
        'WinAPI_AddIconTransparency WinAPI_AddMRUString ' +
        'WinAPI_AdjustBitmap WinAPI_AdjustTokenPrivileges ' +
        'WinAPI_AdjustWindowRectEx WinAPI_AlphaBlend WinAPI_AngleArc ' +
        'WinAPI_AnimateWindow WinAPI_Arc WinAPI_ArcTo ' +
        'WinAPI_ArrayToStruct WinAPI_AssignProcessToJobObject ' +
        'WinAPI_AssocGetPerceivedType WinAPI_AssocQueryString ' +
        'WinAPI_AttachConsole WinAPI_AttachThreadInput ' +
        'WinAPI_BackupRead WinAPI_BackupReadAbort WinAPI_BackupSeek ' +
        'WinAPI_BackupWrite WinAPI_BackupWriteAbort WinAPI_Beep ' +
        'WinAPI_BeginBufferedPaint WinAPI_BeginDeferWindowPos ' +
        'WinAPI_BeginPaint WinAPI_BeginPath WinAPI_BeginUpdateResource ' +
        'WinAPI_BitBlt WinAPI_BringWindowToTop ' +
        'WinAPI_BroadcastSystemMessage WinAPI_BrowseForFolderDlg ' +
        'WinAPI_BufferedPaintClear WinAPI_BufferedPaintInit ' +
        'WinAPI_BufferedPaintSetAlpha WinAPI_BufferedPaintUnInit ' +
        'WinAPI_CallNextHookEx WinAPI_CallWindowProc ' +
        'WinAPI_CallWindowProcW WinAPI_CascadeWindows ' +
        'WinAPI_ChangeWindowMessageFilterEx WinAPI_CharToOem ' +
        'WinAPI_ChildWindowFromPointEx WinAPI_ClientToScreen ' +
        'WinAPI_ClipCursor WinAPI_CloseDesktop WinAPI_CloseEnhMetaFile ' +
        'WinAPI_CloseFigure WinAPI_CloseHandle WinAPI_CloseThemeData ' +
        'WinAPI_CloseWindow WinAPI_CloseWindowStation ' +
        'WinAPI_CLSIDFromProgID WinAPI_CoInitialize ' +
        'WinAPI_ColorAdjustLuma WinAPI_ColorHLSToRGB ' +
        'WinAPI_ColorRGBToHLS WinAPI_CombineRgn ' +
        'WinAPI_CombineTransform WinAPI_CommandLineToArgv ' +
        'WinAPI_CommDlgExtendedError WinAPI_CommDlgExtendedErrorEx ' +
        'WinAPI_CompareString WinAPI_CompressBitmapBits ' +
        'WinAPI_CompressBuffer WinAPI_ComputeCrc32 ' +
        'WinAPI_ConfirmCredentials WinAPI_CopyBitmap WinAPI_CopyCursor ' +
        'WinAPI_CopyEnhMetaFile WinAPI_CopyFileEx WinAPI_CopyIcon ' +
        'WinAPI_CopyImage WinAPI_CopyRect WinAPI_CopyStruct ' +
        'WinAPI_CoTaskMemAlloc WinAPI_CoTaskMemFree ' +
        'WinAPI_CoTaskMemRealloc WinAPI_CoUninitialize ' +
        'WinAPI_Create32BitHBITMAP WinAPI_Create32BitHICON ' +
        'WinAPI_CreateANDBitmap WinAPI_CreateBitmap ' +
        'WinAPI_CreateBitmapIndirect WinAPI_CreateBrushIndirect ' +
        'WinAPI_CreateBuffer WinAPI_CreateBufferFromStruct ' +
        'WinAPI_CreateCaret WinAPI_CreateColorAdjustment ' +
        'WinAPI_CreateCompatibleBitmap WinAPI_CreateCompatibleBitmapEx ' +
        'WinAPI_CreateCompatibleDC WinAPI_CreateDesktop ' +
        'WinAPI_CreateDIB WinAPI_CreateDIBColorTable ' +
        'WinAPI_CreateDIBitmap WinAPI_CreateDIBSection ' +
        'WinAPI_CreateDirectory WinAPI_CreateDirectoryEx ' +
        'WinAPI_CreateEllipticRgn WinAPI_CreateEmptyIcon ' +
        'WinAPI_CreateEnhMetaFile WinAPI_CreateEvent WinAPI_CreateFile ' +
        'WinAPI_CreateFileEx WinAPI_CreateFileMapping ' +
        'WinAPI_CreateFont WinAPI_CreateFontEx ' +
        'WinAPI_CreateFontIndirect WinAPI_CreateGUID ' +
        'WinAPI_CreateHardLink WinAPI_CreateIcon ' +
        'WinAPI_CreateIconFromResourceEx WinAPI_CreateIconIndirect ' +
        'WinAPI_CreateJobObject WinAPI_CreateMargins ' +
        'WinAPI_CreateMRUList WinAPI_CreateMutex WinAPI_CreateNullRgn ' +
        'WinAPI_CreateNumberFormatInfo WinAPI_CreateObjectID ' +
        'WinAPI_CreatePen WinAPI_CreatePoint WinAPI_CreatePolygonRgn ' +
        'WinAPI_CreateProcess WinAPI_CreateProcessWithToken ' +
        'WinAPI_CreateRect WinAPI_CreateRectEx WinAPI_CreateRectRgn ' +
        'WinAPI_CreateRectRgnIndirect WinAPI_CreateRoundRectRgn ' +
        'WinAPI_CreateSemaphore WinAPI_CreateSize ' +
        'WinAPI_CreateSolidBitmap WinAPI_CreateSolidBrush ' +
        'WinAPI_CreateStreamOnHGlobal WinAPI_CreateString ' +
        'WinAPI_CreateSymbolicLink WinAPI_CreateTransform ' +
        'WinAPI_CreateWindowEx WinAPI_CreateWindowStation ' +
        'WinAPI_DecompressBuffer WinAPI_DecryptFile ' +
        'WinAPI_DeferWindowPos WinAPI_DefineDosDevice ' +
        'WinAPI_DefRawInputProc WinAPI_DefSubclassProc ' +
        'WinAPI_DefWindowProc WinAPI_DefWindowProcW WinAPI_DeleteDC ' +
        'WinAPI_DeleteEnhMetaFile WinAPI_DeleteFile ' +
        'WinAPI_DeleteObject WinAPI_DeleteObjectID ' +
        'WinAPI_DeleteVolumeMountPoint WinAPI_DeregisterShellHookWindow ' +
        'WinAPI_DestroyCaret WinAPI_DestroyCursor WinAPI_DestroyIcon ' +
        'WinAPI_DestroyWindow WinAPI_DeviceIoControl ' +
        'WinAPI_DisplayStruct WinAPI_DllGetVersion WinAPI_DllInstall ' +
        'WinAPI_DllUninstall WinAPI_DPtoLP WinAPI_DragAcceptFiles ' +
        'WinAPI_DragFinish WinAPI_DragQueryFileEx ' +
        'WinAPI_DragQueryPoint WinAPI_DrawAnimatedRects ' +
        'WinAPI_DrawBitmap WinAPI_DrawEdge WinAPI_DrawFocusRect ' +
        'WinAPI_DrawFrameControl WinAPI_DrawIcon WinAPI_DrawIconEx ' +
        'WinAPI_DrawLine WinAPI_DrawShadowText WinAPI_DrawText ' +
        'WinAPI_DrawThemeBackground WinAPI_DrawThemeEdge ' +
        'WinAPI_DrawThemeIcon WinAPI_DrawThemeParentBackground ' +
        'WinAPI_DrawThemeText WinAPI_DrawThemeTextEx ' +
        'WinAPI_DuplicateEncryptionInfoFile WinAPI_DuplicateHandle ' +
        'WinAPI_DuplicateTokenEx WinAPI_DwmDefWindowProc ' +
        'WinAPI_DwmEnableBlurBehindWindow WinAPI_DwmEnableComposition ' +
        'WinAPI_DwmExtendFrameIntoClientArea ' +
        'WinAPI_DwmGetColorizationColor ' +
        'WinAPI_DwmGetColorizationParameters ' +
        'WinAPI_DwmGetWindowAttribute WinAPI_DwmInvalidateIconicBitmaps ' +
        'WinAPI_DwmIsCompositionEnabled ' +
        'WinAPI_DwmQueryThumbnailSourceSize WinAPI_DwmRegisterThumbnail ' +
        'WinAPI_DwmSetColorizationParameters ' +
        'WinAPI_DwmSetIconicLivePreviewBitmap ' +
        'WinAPI_DwmSetIconicThumbnail WinAPI_DwmSetWindowAttribute ' +
        'WinAPI_DwmUnregisterThumbnail ' +
        'WinAPI_DwmUpdateThumbnailProperties WinAPI_DWordToFloat ' +
        'WinAPI_DWordToInt WinAPI_EjectMedia WinAPI_Ellipse ' +
        'WinAPI_EmptyWorkingSet WinAPI_EnableWindow WinAPI_EncryptFile ' +
        'WinAPI_EncryptionDisable WinAPI_EndBufferedPaint ' +
        'WinAPI_EndDeferWindowPos WinAPI_EndPaint WinAPI_EndPath ' +
        'WinAPI_EndUpdateResource WinAPI_EnumChildProcess ' +
        'WinAPI_EnumChildWindows WinAPI_EnumDesktops ' +
        'WinAPI_EnumDesktopWindows WinAPI_EnumDeviceDrivers ' +
        'WinAPI_EnumDisplayDevices WinAPI_EnumDisplayMonitors ' +
        'WinAPI_EnumDisplaySettings WinAPI_EnumDllProc ' +
        'WinAPI_EnumFiles WinAPI_EnumFileStreams ' +
        'WinAPI_EnumFontFamilies WinAPI_EnumHardLinks ' +
        'WinAPI_EnumMRUList WinAPI_EnumPageFiles ' +
        'WinAPI_EnumProcessHandles WinAPI_EnumProcessModules ' +
        'WinAPI_EnumProcessThreads WinAPI_EnumProcessWindows ' +
        'WinAPI_EnumRawInputDevices WinAPI_EnumResourceLanguages ' +
        'WinAPI_EnumResourceNames WinAPI_EnumResourceTypes ' +
        'WinAPI_EnumSystemGeoID WinAPI_EnumSystemLocales ' +
        'WinAPI_EnumUILanguages WinAPI_EnumWindows ' +
        'WinAPI_EnumWindowsPopup WinAPI_EnumWindowStations ' +
        'WinAPI_EnumWindowsTop WinAPI_EqualMemory WinAPI_EqualRect ' +
        'WinAPI_EqualRgn WinAPI_ExcludeClipRect ' +
        'WinAPI_ExpandEnvironmentStrings WinAPI_ExtCreatePen ' +
        'WinAPI_ExtCreateRegion WinAPI_ExtFloodFill WinAPI_ExtractIcon ' +
        'WinAPI_ExtractIconEx WinAPI_ExtSelectClipRgn ' +
        'WinAPI_FatalAppExit WinAPI_FatalExit ' +
        'WinAPI_FileEncryptionStatus WinAPI_FileExists ' +
        'WinAPI_FileIconInit WinAPI_FileInUse WinAPI_FillMemory ' +
        'WinAPI_FillPath WinAPI_FillRect WinAPI_FillRgn ' +
        'WinAPI_FindClose WinAPI_FindCloseChangeNotification ' +
        'WinAPI_FindExecutable WinAPI_FindFirstChangeNotification ' +
        'WinAPI_FindFirstFile WinAPI_FindFirstFileName ' +
        'WinAPI_FindFirstStream WinAPI_FindNextChangeNotification ' +
        'WinAPI_FindNextFile WinAPI_FindNextFileName ' +
        'WinAPI_FindNextStream WinAPI_FindResource ' +
        'WinAPI_FindResourceEx WinAPI_FindTextDlg WinAPI_FindWindow ' +
        'WinAPI_FlashWindow WinAPI_FlashWindowEx WinAPI_FlattenPath ' +
        'WinAPI_FloatToDWord WinAPI_FloatToInt WinAPI_FlushFileBuffers ' +
        'WinAPI_FlushFRBuffer WinAPI_FlushViewOfFile ' +
        'WinAPI_FormatDriveDlg WinAPI_FormatMessage WinAPI_FrameRect ' +
        'WinAPI_FrameRgn WinAPI_FreeLibrary WinAPI_FreeMemory ' +
        'WinAPI_FreeMRUList WinAPI_FreeResource WinAPI_GdiComment ' +
        'WinAPI_GetActiveWindow WinAPI_GetAllUsersProfileDirectory ' +
        'WinAPI_GetAncestor WinAPI_GetApplicationRestartSettings ' +
        'WinAPI_GetArcDirection WinAPI_GetAsyncKeyState ' +
        'WinAPI_GetBinaryType WinAPI_GetBitmapBits ' +
        'WinAPI_GetBitmapDimension WinAPI_GetBitmapDimensionEx ' +
        'WinAPI_GetBkColor WinAPI_GetBkMode WinAPI_GetBoundsRect ' +
        'WinAPI_GetBrushOrg WinAPI_GetBufferedPaintBits ' +
        'WinAPI_GetBufferedPaintDC WinAPI_GetBufferedPaintTargetDC ' +
        'WinAPI_GetBufferedPaintTargetRect WinAPI_GetBValue ' +
        'WinAPI_GetCaretBlinkTime WinAPI_GetCaretPos WinAPI_GetCDType ' +
        'WinAPI_GetClassInfoEx WinAPI_GetClassLongEx ' +
        'WinAPI_GetClassName WinAPI_GetClientHeight ' +
        'WinAPI_GetClientRect WinAPI_GetClientWidth ' +
        'WinAPI_GetClipboardSequenceNumber WinAPI_GetClipBox ' +
        'WinAPI_GetClipCursor WinAPI_GetClipRgn ' +
        'WinAPI_GetColorAdjustment WinAPI_GetCompressedFileSize ' +
        'WinAPI_GetCompression WinAPI_GetConnectedDlg ' +
        'WinAPI_GetCurrentDirectory WinAPI_GetCurrentHwProfile ' +
        'WinAPI_GetCurrentObject WinAPI_GetCurrentPosition ' +
        'WinAPI_GetCurrentProcess ' +
        'WinAPI_GetCurrentProcessExplicitAppUserModelID ' +
        'WinAPI_GetCurrentProcessID WinAPI_GetCurrentThemeName ' +
        'WinAPI_GetCurrentThread WinAPI_GetCurrentThreadId ' +
        'WinAPI_GetCursor WinAPI_GetCursorInfo WinAPI_GetDateFormat ' +
        'WinAPI_GetDC WinAPI_GetDCEx WinAPI_GetDefaultPrinter ' +
        'WinAPI_GetDefaultUserProfileDirectory WinAPI_GetDesktopWindow ' +
        'WinAPI_GetDeviceCaps WinAPI_GetDeviceDriverBaseName ' +
        'WinAPI_GetDeviceDriverFileName WinAPI_GetDeviceGammaRamp ' +
        'WinAPI_GetDIBColorTable WinAPI_GetDIBits ' +
        'WinAPI_GetDiskFreeSpaceEx WinAPI_GetDlgCtrlID ' +
        'WinAPI_GetDlgItem WinAPI_GetDllDirectory ' +
        'WinAPI_GetDriveBusType WinAPI_GetDriveGeometryEx ' +
        'WinAPI_GetDriveNumber WinAPI_GetDriveType ' +
        'WinAPI_GetDurationFormat WinAPI_GetEffectiveClientRect ' +
        'WinAPI_GetEnhMetaFile WinAPI_GetEnhMetaFileBits ' +
        'WinAPI_GetEnhMetaFileDescription WinAPI_GetEnhMetaFileDimension ' +
        'WinAPI_GetEnhMetaFileHeader WinAPI_GetErrorMessage ' +
        'WinAPI_GetErrorMode WinAPI_GetExitCodeProcess ' +
        'WinAPI_GetExtended WinAPI_GetFileAttributes WinAPI_GetFileID ' +
        'WinAPI_GetFileInformationByHandle ' +
        'WinAPI_GetFileInformationByHandleEx WinAPI_GetFilePointerEx ' +
        'WinAPI_GetFileSizeEx WinAPI_GetFileSizeOnDisk ' +
        'WinAPI_GetFileTitle WinAPI_GetFileType ' +
        'WinAPI_GetFileVersionInfo WinAPI_GetFinalPathNameByHandle ' +
        'WinAPI_GetFinalPathNameByHandleEx WinAPI_GetFocus ' +
        'WinAPI_GetFontMemoryResourceInfo WinAPI_GetFontName ' +
        'WinAPI_GetFontResourceInfo WinAPI_GetForegroundWindow ' +
        'WinAPI_GetFRBuffer WinAPI_GetFullPathName WinAPI_GetGeoInfo ' +
        'WinAPI_GetGlyphOutline WinAPI_GetGraphicsMode ' +
        'WinAPI_GetGuiResources WinAPI_GetGUIThreadInfo ' +
        'WinAPI_GetGValue WinAPI_GetHandleInformation ' +
        'WinAPI_GetHGlobalFromStream WinAPI_GetIconDimension ' +
        'WinAPI_GetIconInfo WinAPI_GetIconInfoEx WinAPI_GetIdleTime ' +
        'WinAPI_GetKeyboardLayout WinAPI_GetKeyboardLayoutList ' +
        'WinAPI_GetKeyboardState WinAPI_GetKeyboardType ' +
        'WinAPI_GetKeyNameText WinAPI_GetKeyState ' +
        'WinAPI_GetLastActivePopup WinAPI_GetLastError ' +
        'WinAPI_GetLastErrorMessage WinAPI_GetLayeredWindowAttributes ' +
        'WinAPI_GetLocaleInfo WinAPI_GetLogicalDrives ' +
        'WinAPI_GetMapMode WinAPI_GetMemorySize ' +
        'WinAPI_GetMessageExtraInfo WinAPI_GetModuleFileNameEx ' +
        'WinAPI_GetModuleHandle WinAPI_GetModuleHandleEx ' +
        'WinAPI_GetModuleInformation WinAPI_GetMonitorInfo ' +
        'WinAPI_GetMousePos WinAPI_GetMousePosX WinAPI_GetMousePosY ' +
        'WinAPI_GetMUILanguage WinAPI_GetNumberFormat WinAPI_GetObject ' +
        'WinAPI_GetObjectID WinAPI_GetObjectInfoByHandle ' +
        'WinAPI_GetObjectNameByHandle WinAPI_GetObjectType ' +
        'WinAPI_GetOpenFileName WinAPI_GetOutlineTextMetrics ' +
        'WinAPI_GetOverlappedResult WinAPI_GetParent ' +
        'WinAPI_GetParentProcess WinAPI_GetPerformanceInfo ' +
        'WinAPI_GetPEType WinAPI_GetPhysicallyInstalledSystemMemory ' +
        'WinAPI_GetPixel WinAPI_GetPolyFillMode WinAPI_GetPosFromRect ' +
        'WinAPI_GetPriorityClass WinAPI_GetProcAddress ' +
        'WinAPI_GetProcessAffinityMask WinAPI_GetProcessCommandLine ' +
        'WinAPI_GetProcessFileName WinAPI_GetProcessHandleCount ' +
        'WinAPI_GetProcessID WinAPI_GetProcessIoCounters ' +
        'WinAPI_GetProcessMemoryInfo WinAPI_GetProcessName ' +
        'WinAPI_GetProcessShutdownParameters WinAPI_GetProcessTimes ' +
        'WinAPI_GetProcessUser WinAPI_GetProcessWindowStation ' +
        'WinAPI_GetProcessWorkingDirectory WinAPI_GetProfilesDirectory ' +
        'WinAPI_GetPwrCapabilities WinAPI_GetRawInputBuffer ' +
        'WinAPI_GetRawInputBufferLength WinAPI_GetRawInputData ' +
        'WinAPI_GetRawInputDeviceInfo WinAPI_GetRegionData ' +
        'WinAPI_GetRegisteredRawInputDevices ' +
        'WinAPI_GetRegKeyNameByHandle WinAPI_GetRgnBox WinAPI_GetROP2 ' +
        'WinAPI_GetRValue WinAPI_GetSaveFileName WinAPI_GetShellWindow ' +
        'WinAPI_GetStartupInfo WinAPI_GetStdHandle ' +
        'WinAPI_GetStockObject WinAPI_GetStretchBltMode ' +
        'WinAPI_GetString WinAPI_GetSysColor WinAPI_GetSysColorBrush ' +
        'WinAPI_GetSystemDefaultLangID WinAPI_GetSystemDefaultLCID ' +
        'WinAPI_GetSystemDefaultUILanguage WinAPI_GetSystemDEPPolicy ' +
        'WinAPI_GetSystemInfo WinAPI_GetSystemMetrics ' +
        'WinAPI_GetSystemPowerStatus WinAPI_GetSystemTimes ' +
        'WinAPI_GetSystemWow64Directory WinAPI_GetTabbedTextExtent ' +
        'WinAPI_GetTempFileName WinAPI_GetTextAlign ' +
        'WinAPI_GetTextCharacterExtra WinAPI_GetTextColor ' +
        'WinAPI_GetTextExtentPoint32 WinAPI_GetTextFace ' +
        'WinAPI_GetTextMetrics WinAPI_GetThemeAppProperties ' +
        'WinAPI_GetThemeBackgroundContentRect ' +
        'WinAPI_GetThemeBackgroundExtent WinAPI_GetThemeBackgroundRegion ' +
        'WinAPI_GetThemeBitmap WinAPI_GetThemeBool ' +
        'WinAPI_GetThemeColor WinAPI_GetThemeDocumentationProperty ' +
        'WinAPI_GetThemeEnumValue WinAPI_GetThemeFilename ' +
        'WinAPI_GetThemeFont WinAPI_GetThemeInt WinAPI_GetThemeMargins ' +
        'WinAPI_GetThemeMetric WinAPI_GetThemePartSize ' +
        'WinAPI_GetThemePosition WinAPI_GetThemePropertyOrigin ' +
        'WinAPI_GetThemeRect WinAPI_GetThemeString ' +
        'WinAPI_GetThemeSysBool WinAPI_GetThemeSysColor ' +
        'WinAPI_GetThemeSysColorBrush WinAPI_GetThemeSysFont ' +
        'WinAPI_GetThemeSysInt WinAPI_GetThemeSysSize ' +
        'WinAPI_GetThemeSysString WinAPI_GetThemeTextExtent ' +
        'WinAPI_GetThemeTextMetrics WinAPI_GetThemeTransitionDuration ' +
        'WinAPI_GetThreadDesktop WinAPI_GetThreadErrorMode ' +
        'WinAPI_GetThreadLocale WinAPI_GetThreadUILanguage ' +
        'WinAPI_GetTickCount WinAPI_GetTickCount64 ' +
        'WinAPI_GetTimeFormat WinAPI_GetTopWindow ' +
        'WinAPI_GetUDFColorMode WinAPI_GetUpdateRect ' +
        'WinAPI_GetUpdateRgn WinAPI_GetUserDefaultLangID ' +
        'WinAPI_GetUserDefaultLCID WinAPI_GetUserDefaultUILanguage ' +
        'WinAPI_GetUserGeoID WinAPI_GetUserObjectInformation ' +
        'WinAPI_GetVersion WinAPI_GetVersionEx ' +
        'WinAPI_GetVolumeInformation WinAPI_GetVolumeInformationByHandle ' +
        'WinAPI_GetVolumeNameForVolumeMountPoint WinAPI_GetWindow ' +
        'WinAPI_GetWindowDC WinAPI_GetWindowDisplayAffinity ' +
        'WinAPI_GetWindowExt WinAPI_GetWindowFileName ' +
        'WinAPI_GetWindowHeight WinAPI_GetWindowInfo ' +
        'WinAPI_GetWindowLong WinAPI_GetWindowOrg ' +
        'WinAPI_GetWindowPlacement WinAPI_GetWindowRect ' +
        'WinAPI_GetWindowRgn WinAPI_GetWindowRgnBox ' +
        'WinAPI_GetWindowSubclass WinAPI_GetWindowText ' +
        'WinAPI_GetWindowTheme WinAPI_GetWindowThreadProcessId ' +
        'WinAPI_GetWindowWidth WinAPI_GetWorkArea ' +
        'WinAPI_GetWorldTransform WinAPI_GetXYFromPoint ' +
        'WinAPI_GlobalMemoryStatus WinAPI_GradientFill ' +
        'WinAPI_GUIDFromString WinAPI_GUIDFromStringEx WinAPI_HashData ' +
        'WinAPI_HashString WinAPI_HiByte WinAPI_HideCaret ' +
        'WinAPI_HiDWord WinAPI_HiWord WinAPI_InflateRect ' +
        'WinAPI_InitMUILanguage WinAPI_InProcess ' +
        'WinAPI_IntersectClipRect WinAPI_IntersectRect ' +
        'WinAPI_IntToDWord WinAPI_IntToFloat WinAPI_InvalidateRect ' +
        'WinAPI_InvalidateRgn WinAPI_InvertANDBitmap ' +
        'WinAPI_InvertColor WinAPI_InvertRect WinAPI_InvertRgn ' +
        'WinAPI_IOCTL WinAPI_IsAlphaBitmap WinAPI_IsBadCodePtr ' +
        'WinAPI_IsBadReadPtr WinAPI_IsBadStringPtr ' +
        'WinAPI_IsBadWritePtr WinAPI_IsChild WinAPI_IsClassName ' +
        'WinAPI_IsDoorOpen WinAPI_IsElevated WinAPI_IsHungAppWindow ' +
        'WinAPI_IsIconic WinAPI_IsInternetConnected ' +
        'WinAPI_IsLoadKBLayout WinAPI_IsMemory ' +
        'WinAPI_IsNameInExpression WinAPI_IsNetworkAlive ' +
        'WinAPI_IsPathShared WinAPI_IsProcessInJob ' +
        'WinAPI_IsProcessorFeaturePresent WinAPI_IsRectEmpty ' +
        'WinAPI_IsThemeActive ' +
        'WinAPI_IsThemeBackgroundPartiallyTransparent ' +
        'WinAPI_IsThemePartDefined WinAPI_IsValidLocale ' +
        'WinAPI_IsWindow WinAPI_IsWindowEnabled WinAPI_IsWindowUnicode ' +
        'WinAPI_IsWindowVisible WinAPI_IsWow64Process ' +
        'WinAPI_IsWritable WinAPI_IsZoomed WinAPI_Keybd_Event ' +
        'WinAPI_KillTimer WinAPI_LineDDA WinAPI_LineTo ' +
        'WinAPI_LoadBitmap WinAPI_LoadCursor WinAPI_LoadCursorFromFile ' +
        'WinAPI_LoadIcon WinAPI_LoadIconMetric ' +
        'WinAPI_LoadIconWithScaleDown WinAPI_LoadImage ' +
        'WinAPI_LoadIndirectString WinAPI_LoadKeyboardLayout ' +
        'WinAPI_LoadLibrary WinAPI_LoadLibraryEx WinAPI_LoadMedia ' +
        'WinAPI_LoadResource WinAPI_LoadShell32Icon WinAPI_LoadString ' +
        'WinAPI_LoadStringEx WinAPI_LoByte WinAPI_LocalFree ' +
        'WinAPI_LockDevice WinAPI_LockFile WinAPI_LockResource ' +
        'WinAPI_LockWindowUpdate WinAPI_LockWorkStation WinAPI_LoDWord ' +
        'WinAPI_LongMid WinAPI_LookupIconIdFromDirectoryEx ' +
        'WinAPI_LoWord WinAPI_LPtoDP WinAPI_MAKELANGID ' +
        'WinAPI_MAKELCID WinAPI_MakeLong WinAPI_MakeQWord ' +
        'WinAPI_MakeWord WinAPI_MapViewOfFile WinAPI_MapVirtualKey ' +
        'WinAPI_MaskBlt WinAPI_MessageBeep WinAPI_MessageBoxCheck ' +
        'WinAPI_MessageBoxIndirect WinAPI_MirrorIcon ' +
        'WinAPI_ModifyWorldTransform WinAPI_MonitorFromPoint ' +
        'WinAPI_MonitorFromRect WinAPI_MonitorFromWindow ' +
        'WinAPI_Mouse_Event WinAPI_MoveFileEx WinAPI_MoveMemory ' +
        'WinAPI_MoveTo WinAPI_MoveToEx WinAPI_MoveWindow ' +
        'WinAPI_MsgBox WinAPI_MulDiv WinAPI_MultiByteToWideChar ' +
        'WinAPI_MultiByteToWideCharEx WinAPI_NtStatusToDosError ' +
        'WinAPI_OemToChar WinAPI_OffsetClipRgn WinAPI_OffsetPoints ' +
        'WinAPI_OffsetRect WinAPI_OffsetRgn WinAPI_OffsetWindowOrg ' +
        'WinAPI_OpenDesktop WinAPI_OpenFileById WinAPI_OpenFileDlg ' +
        'WinAPI_OpenFileMapping WinAPI_OpenIcon ' +
        'WinAPI_OpenInputDesktop WinAPI_OpenJobObject WinAPI_OpenMutex ' +
        'WinAPI_OpenProcess WinAPI_OpenProcessToken ' +
        'WinAPI_OpenSemaphore WinAPI_OpenThemeData ' +
        'WinAPI_OpenWindowStation WinAPI_PageSetupDlg ' +
        'WinAPI_PaintDesktop WinAPI_PaintRgn WinAPI_ParseURL ' +
        'WinAPI_ParseUserName WinAPI_PatBlt WinAPI_PathAddBackslash ' +
        'WinAPI_PathAddExtension WinAPI_PathAppend ' +
        'WinAPI_PathBuildRoot WinAPI_PathCanonicalize ' +
        'WinAPI_PathCommonPrefix WinAPI_PathCompactPath ' +
        'WinAPI_PathCompactPathEx WinAPI_PathCreateFromUrl ' +
        'WinAPI_PathFindExtension WinAPI_PathFindFileName ' +
        'WinAPI_PathFindNextComponent WinAPI_PathFindOnPath ' +
        'WinAPI_PathGetArgs WinAPI_PathGetCharType ' +
        'WinAPI_PathGetDriveNumber WinAPI_PathIsContentType ' +
        'WinAPI_PathIsDirectory WinAPI_PathIsDirectoryEmpty ' +
        'WinAPI_PathIsExe WinAPI_PathIsFileSpec ' +
        'WinAPI_PathIsLFNFileSpec WinAPI_PathIsRelative ' +
        'WinAPI_PathIsRoot WinAPI_PathIsSameRoot ' +
        'WinAPI_PathIsSystemFolder WinAPI_PathIsUNC ' +
        'WinAPI_PathIsUNCServer WinAPI_PathIsUNCServerShare ' +
        'WinAPI_PathMakeSystemFolder WinAPI_PathMatchSpec ' +
        'WinAPI_PathParseIconLocation WinAPI_PathRelativePathTo ' +
        'WinAPI_PathRemoveArgs WinAPI_PathRemoveBackslash ' +
        'WinAPI_PathRemoveExtension WinAPI_PathRemoveFileSpec ' +
        'WinAPI_PathRenameExtension WinAPI_PathSearchAndQualify ' +
        'WinAPI_PathSkipRoot WinAPI_PathStripPath ' +
        'WinAPI_PathStripToRoot WinAPI_PathToRegion ' +
        'WinAPI_PathUndecorate WinAPI_PathUnExpandEnvStrings ' +
        'WinAPI_PathUnmakeSystemFolder WinAPI_PathUnquoteSpaces ' +
        'WinAPI_PathYetAnotherMakeUniqueName WinAPI_PickIconDlg ' +
        'WinAPI_PlayEnhMetaFile WinAPI_PlaySound WinAPI_PlgBlt ' +
        'WinAPI_PointFromRect WinAPI_PolyBezier WinAPI_PolyBezierTo ' +
        'WinAPI_PolyDraw WinAPI_Polygon WinAPI_PostMessage ' +
        'WinAPI_PrimaryLangId WinAPI_PrintDlg WinAPI_PrintDlgEx ' +
        'WinAPI_PrintWindow WinAPI_ProgIDFromCLSID WinAPI_PtInRect ' +
        'WinAPI_PtInRectEx WinAPI_PtInRegion WinAPI_PtVisible ' +
        'WinAPI_QueryDosDevice WinAPI_QueryInformationJobObject ' +
        'WinAPI_QueryPerformanceCounter WinAPI_QueryPerformanceFrequency ' +
        'WinAPI_RadialGradientFill WinAPI_ReadDirectoryChanges ' +
        'WinAPI_ReadFile WinAPI_ReadProcessMemory WinAPI_Rectangle ' +
        'WinAPI_RectInRegion WinAPI_RectIsEmpty WinAPI_RectVisible ' +
        'WinAPI_RedrawWindow WinAPI_RegCloseKey ' +
        'WinAPI_RegConnectRegistry WinAPI_RegCopyTree ' +
        'WinAPI_RegCopyTreeEx WinAPI_RegCreateKey ' +
        'WinAPI_RegDeleteEmptyKey WinAPI_RegDeleteKey ' +
        'WinAPI_RegDeleteKeyValue WinAPI_RegDeleteTree ' +
        'WinAPI_RegDeleteTreeEx WinAPI_RegDeleteValue ' +
        'WinAPI_RegDisableReflectionKey WinAPI_RegDuplicateHKey ' +
        'WinAPI_RegEnableReflectionKey WinAPI_RegEnumKey ' +
        'WinAPI_RegEnumValue WinAPI_RegFlushKey ' +
        'WinAPI_RegisterApplicationRestart WinAPI_RegisterClass ' +
        'WinAPI_RegisterClassEx WinAPI_RegisterHotKey ' +
        'WinAPI_RegisterPowerSettingNotification ' +
        'WinAPI_RegisterRawInputDevices WinAPI_RegisterShellHookWindow ' +
        'WinAPI_RegisterWindowMessage WinAPI_RegLoadMUIString ' +
        'WinAPI_RegNotifyChangeKeyValue WinAPI_RegOpenKey ' +
        'WinAPI_RegQueryInfoKey WinAPI_RegQueryLastWriteTime ' +
        'WinAPI_RegQueryMultipleValues WinAPI_RegQueryReflectionKey ' +
        'WinAPI_RegQueryValue WinAPI_RegRestoreKey WinAPI_RegSaveKey ' +
        'WinAPI_RegSetValue WinAPI_ReleaseCapture WinAPI_ReleaseDC ' +
        'WinAPI_ReleaseMutex WinAPI_ReleaseSemaphore ' +
        'WinAPI_ReleaseStream WinAPI_RemoveClipboardFormatListener ' +
        'WinAPI_RemoveDirectory WinAPI_RemoveFontMemResourceEx ' +
        'WinAPI_RemoveFontResourceEx WinAPI_RemoveWindowSubclass ' +
        'WinAPI_ReOpenFile WinAPI_ReplaceFile WinAPI_ReplaceTextDlg ' +
        'WinAPI_ResetEvent WinAPI_RestartDlg WinAPI_RestoreDC ' +
        'WinAPI_RGB WinAPI_RotatePoints WinAPI_RoundRect ' +
        'WinAPI_SaveDC WinAPI_SaveFileDlg WinAPI_SaveHBITMAPToFile ' +
        'WinAPI_SaveHICONToFile WinAPI_ScaleWindowExt ' +
        'WinAPI_ScreenToClient WinAPI_SearchPath WinAPI_SelectClipPath ' +
        'WinAPI_SelectClipRgn WinAPI_SelectObject ' +
        'WinAPI_SendMessageTimeout WinAPI_SetActiveWindow ' +
        'WinAPI_SetArcDirection WinAPI_SetBitmapBits ' +
        'WinAPI_SetBitmapDimensionEx WinAPI_SetBkColor ' +
        'WinAPI_SetBkMode WinAPI_SetBoundsRect WinAPI_SetBrushOrg ' +
        'WinAPI_SetCapture WinAPI_SetCaretBlinkTime WinAPI_SetCaretPos ' +
        'WinAPI_SetClassLongEx WinAPI_SetColorAdjustment ' +
        'WinAPI_SetCompression WinAPI_SetCurrentDirectory ' +
        'WinAPI_SetCurrentProcessExplicitAppUserModelID WinAPI_SetCursor ' +
        'WinAPI_SetDCBrushColor WinAPI_SetDCPenColor ' +
        'WinAPI_SetDefaultPrinter WinAPI_SetDeviceGammaRamp ' +
        'WinAPI_SetDIBColorTable WinAPI_SetDIBits ' +
        'WinAPI_SetDIBitsToDevice WinAPI_SetDllDirectory ' +
        'WinAPI_SetEndOfFile WinAPI_SetEnhMetaFileBits ' +
        'WinAPI_SetErrorMode WinAPI_SetEvent WinAPI_SetFileAttributes ' +
        'WinAPI_SetFileInformationByHandleEx WinAPI_SetFilePointer ' +
        'WinAPI_SetFilePointerEx WinAPI_SetFileShortName ' +
        'WinAPI_SetFileValidData WinAPI_SetFocus WinAPI_SetFont ' +
        'WinAPI_SetForegroundWindow WinAPI_SetFRBuffer ' +
        'WinAPI_SetGraphicsMode WinAPI_SetHandleInformation ' +
        'WinAPI_SetInformationJobObject WinAPI_SetKeyboardLayout ' +
        'WinAPI_SetKeyboardState WinAPI_SetLastError ' +
        'WinAPI_SetLayeredWindowAttributes WinAPI_SetLocaleInfo ' +
        'WinAPI_SetMapMode WinAPI_SetMessageExtraInfo WinAPI_SetParent ' +
        'WinAPI_SetPixel WinAPI_SetPolyFillMode ' +
        'WinAPI_SetPriorityClass WinAPI_SetProcessAffinityMask ' +
        'WinAPI_SetProcessShutdownParameters ' +
        'WinAPI_SetProcessWindowStation WinAPI_SetRectRgn ' +
        'WinAPI_SetROP2 WinAPI_SetSearchPathMode ' +
        'WinAPI_SetStretchBltMode WinAPI_SetSysColors ' +
        'WinAPI_SetSystemCursor WinAPI_SetTextAlign ' +
        'WinAPI_SetTextCharacterExtra WinAPI_SetTextColor ' +
        'WinAPI_SetTextJustification WinAPI_SetThemeAppProperties ' +
        'WinAPI_SetThreadDesktop WinAPI_SetThreadErrorMode ' +
        'WinAPI_SetThreadExecutionState WinAPI_SetThreadLocale ' +
        'WinAPI_SetThreadUILanguage WinAPI_SetTimer ' +
        'WinAPI_SetUDFColorMode WinAPI_SetUserGeoID ' +
        'WinAPI_SetUserObjectInformation WinAPI_SetVolumeMountPoint ' +
        'WinAPI_SetWindowDisplayAffinity WinAPI_SetWindowExt ' +
        'WinAPI_SetWindowLong WinAPI_SetWindowOrg ' +
        'WinAPI_SetWindowPlacement WinAPI_SetWindowPos ' +
        'WinAPI_SetWindowRgn WinAPI_SetWindowsHookEx ' +
        'WinAPI_SetWindowSubclass WinAPI_SetWindowText ' +
        'WinAPI_SetWindowTheme WinAPI_SetWinEventHook ' +
        'WinAPI_SetWorldTransform WinAPI_SfcIsFileProtected ' +
        'WinAPI_SfcIsKeyProtected WinAPI_ShellAboutDlg ' +
        'WinAPI_ShellAddToRecentDocs WinAPI_ShellChangeNotify ' +
        'WinAPI_ShellChangeNotifyDeregister ' +
        'WinAPI_ShellChangeNotifyRegister WinAPI_ShellCreateDirectory ' +
        'WinAPI_ShellEmptyRecycleBin WinAPI_ShellExecute ' +
        'WinAPI_ShellExecuteEx WinAPI_ShellExtractAssociatedIcon ' +
        'WinAPI_ShellExtractIcon WinAPI_ShellFileOperation ' +
        'WinAPI_ShellFlushSFCache WinAPI_ShellGetFileInfo ' +
        'WinAPI_ShellGetIconOverlayIndex WinAPI_ShellGetImageList ' +
        'WinAPI_ShellGetKnownFolderIDList WinAPI_ShellGetKnownFolderPath ' +
        'WinAPI_ShellGetLocalizedName WinAPI_ShellGetPathFromIDList ' +
        'WinAPI_ShellGetSetFolderCustomSettings WinAPI_ShellGetSettings ' +
        'WinAPI_ShellGetSpecialFolderLocation ' +
        'WinAPI_ShellGetSpecialFolderPath WinAPI_ShellGetStockIconInfo ' +
        'WinAPI_ShellILCreateFromPath WinAPI_ShellNotifyIcon ' +
        'WinAPI_ShellNotifyIconGetRect WinAPI_ShellObjectProperties ' +
        'WinAPI_ShellOpenFolderAndSelectItems WinAPI_ShellOpenWithDlg ' +
        'WinAPI_ShellQueryRecycleBin ' +
        'WinAPI_ShellQueryUserNotificationState ' +
        'WinAPI_ShellRemoveLocalizedName WinAPI_ShellRestricted ' +
        'WinAPI_ShellSetKnownFolderPath WinAPI_ShellSetLocalizedName ' +
        'WinAPI_ShellSetSettings WinAPI_ShellStartNetConnectionDlg ' +
        'WinAPI_ShellUpdateImage WinAPI_ShellUserAuthenticationDlg ' +
        'WinAPI_ShellUserAuthenticationDlgEx WinAPI_ShortToWord ' +
        'WinAPI_ShowCaret WinAPI_ShowCursor WinAPI_ShowError ' +
        'WinAPI_ShowLastError WinAPI_ShowMsg WinAPI_ShowOwnedPopups ' +
        'WinAPI_ShowWindow WinAPI_ShutdownBlockReasonCreate ' +
        'WinAPI_ShutdownBlockReasonDestroy ' +
        'WinAPI_ShutdownBlockReasonQuery WinAPI_SizeOfResource ' +
        'WinAPI_StretchBlt WinAPI_StretchDIBits ' +
        'WinAPI_StrFormatByteSize WinAPI_StrFormatByteSizeEx ' +
        'WinAPI_StrFormatKBSize WinAPI_StrFromTimeInterval ' +
        'WinAPI_StringFromGUID WinAPI_StringLenA WinAPI_StringLenW ' +
        'WinAPI_StrLen WinAPI_StrokeAndFillPath WinAPI_StrokePath ' +
        'WinAPI_StructToArray WinAPI_SubLangId WinAPI_SubtractRect ' +
        'WinAPI_SwapDWord WinAPI_SwapQWord WinAPI_SwapWord ' +
        'WinAPI_SwitchColor WinAPI_SwitchDesktop ' +
        'WinAPI_SwitchToThisWindow WinAPI_SystemParametersInfo ' +
        'WinAPI_TabbedTextOut WinAPI_TerminateJobObject ' +
        'WinAPI_TerminateProcess WinAPI_TextOut WinAPI_TileWindows ' +
        'WinAPI_TrackMouseEvent WinAPI_TransparentBlt ' +
        'WinAPI_TwipsPerPixelX WinAPI_TwipsPerPixelY ' +
        'WinAPI_UnhookWindowsHookEx WinAPI_UnhookWinEvent ' +
        'WinAPI_UnionRect WinAPI_UnionStruct WinAPI_UniqueHardwareID ' +
        'WinAPI_UnloadKeyboardLayout WinAPI_UnlockFile ' +
        'WinAPI_UnmapViewOfFile WinAPI_UnregisterApplicationRestart ' +
        'WinAPI_UnregisterClass WinAPI_UnregisterHotKey ' +
        'WinAPI_UnregisterPowerSettingNotification ' +
        'WinAPI_UpdateLayeredWindow WinAPI_UpdateLayeredWindowEx ' +
        'WinAPI_UpdateLayeredWindowIndirect WinAPI_UpdateResource ' +
        'WinAPI_UpdateWindow WinAPI_UrlApplyScheme ' +
        'WinAPI_UrlCanonicalize WinAPI_UrlCombine WinAPI_UrlCompare ' +
        'WinAPI_UrlCreateFromPath WinAPI_UrlFixup WinAPI_UrlGetPart ' +
        'WinAPI_UrlHash WinAPI_UrlIs WinAPI_UserHandleGrantAccess ' +
        'WinAPI_ValidateRect WinAPI_ValidateRgn WinAPI_VerQueryRoot ' +
        'WinAPI_VerQueryValue WinAPI_VerQueryValueEx ' +
        'WinAPI_WaitForInputIdle WinAPI_WaitForMultipleObjects ' +
        'WinAPI_WaitForSingleObject WinAPI_WideCharToMultiByte ' +
        'WinAPI_WidenPath WinAPI_WindowFromDC WinAPI_WindowFromPoint ' +
        'WinAPI_WordToShort WinAPI_Wow64EnableWow64FsRedirection ' +
        'WinAPI_WriteConsole WinAPI_WriteFile ' +
        'WinAPI_WriteProcessMemory WinAPI_ZeroMemory ' +
        'WinNet_AddConnection WinNet_AddConnection2 ' +
        'WinNet_AddConnection3 WinNet_CancelConnection ' +
        'WinNet_CancelConnection2 WinNet_CloseEnum ' +
        'WinNet_ConnectionDialog WinNet_ConnectionDialog1 ' +
        'WinNet_DisconnectDialog WinNet_DisconnectDialog1 ' +
        'WinNet_EnumResource WinNet_GetConnection ' +
        'WinNet_GetConnectionPerformance WinNet_GetLastError ' +
        'WinNet_GetNetworkInformation WinNet_GetProviderName ' +
        'WinNet_GetResourceInformation WinNet_GetResourceParent ' +
        'WinNet_GetUniversalName WinNet_GetUser WinNet_OpenEnum ' +
        'WinNet_RestoreConnection WinNet_UseConnection Word_Create ' +
        'Word_DocAdd Word_DocAttach Word_DocClose Word_DocExport ' +
        'Word_DocFind Word_DocFindReplace Word_DocGet ' +
        'Word_DocLinkAdd Word_DocLinkGet Word_DocOpen ' +
        'Word_DocPictureAdd Word_DocPrint Word_DocRangeSet ' +
        'Word_DocSave Word_DocSaveAs Word_DocTableRead ' +
        'Word_DocTableWrite Word_Quit',
        COMMENT = {
            variants: [
            hljs.COMMENT(';', '$', {
                relevance: 0
            }),
            hljs.COMMENT('#cs', '#ce'),
            hljs.COMMENT('#comments-start', '#comments-end')
            ]
        },
        VARIABLE = {
            className: 'variable',
            begin: '\\$[A-z0-9_]+'
        },
        STRING = {
            className: 'string',
            variants: [{
                begin: /"/,
                end: /"/,
                contains: [{
                    begin: /""/,
                    relevance: 0
                }
                ]
            }, {
                begin: /'/,
                end: /'/,
                contains: [{
                    begin: /''/,
                    relevance: 0
                }
                ]
            }
            ]
        },
        NUMBER = {
            variants: [hljs.BINARY_NUMBER_MODE, hljs.C_NUMBER_MODE]
        },
        PREPROCESSOR = {
            className: 'preprocessor',
            begin: '#',
            end: '$',
            keywords: 'include include-once NoTrayIcon OnAutoItStartRegister RequireAdmin pragma ' +
            'Au3Stripper_Ignore_Funcs Au3Stripper_Ignore_Variables ' +
            'Au3Stripper_Off Au3Stripper_On Au3Stripper_Parameters ' +
            'AutoIt3Wrapper_Add_Constants AutoIt3Wrapper_Au3Check_Parameters ' +
            'AutoIt3Wrapper_Au3Check_Stop_OnWarning AutoIt3Wrapper_Aut2Exe ' +
            'AutoIt3Wrapper_AutoIt3 AutoIt3Wrapper_AutoIt3Dir ' +
            'AutoIt3Wrapper_Change2CUI AutoIt3Wrapper_Compile_Both ' +
            'AutoIt3Wrapper_Compression AutoIt3Wrapper_EndIf ' +
            'AutoIt3Wrapper_Icon AutoIt3Wrapper_If_Compile ' +
            'AutoIt3Wrapper_If_Run AutoIt3Wrapper_Jump_To_First_Error ' +
            'AutoIt3Wrapper_OutFile AutoIt3Wrapper_OutFile_Type ' +
            'AutoIt3Wrapper_OutFile_X64 AutoIt3Wrapper_PlugIn_Funcs ' +
            'AutoIt3Wrapper_Res_Comment Autoit3Wrapper_Res_Compatibility ' +
            'AutoIt3Wrapper_Res_Description AutoIt3Wrapper_Res_Field ' +
            'AutoIt3Wrapper_Res_File_Add AutoIt3Wrapper_Res_FileVersion ' +
            'AutoIt3Wrapper_Res_FileVersion_AutoIncrement ' +
            'AutoIt3Wrapper_Res_Icon_Add AutoIt3Wrapper_Res_Language ' +
            'AutoIt3Wrapper_Res_LegalCopyright ' +
            'AutoIt3Wrapper_Res_ProductVersion ' +
            'AutoIt3Wrapper_Res_requestedExecutionLevel ' +
            'AutoIt3Wrapper_Res_SaveSource AutoIt3Wrapper_Run_After ' +
            'AutoIt3Wrapper_Run_Au3Check AutoIt3Wrapper_Run_Au3Stripper ' +
            'AutoIt3Wrapper_Run_Before AutoIt3Wrapper_Run_Debug_Mode ' +
            'AutoIt3Wrapper_Run_SciTE_Minimized ' +
            'AutoIt3Wrapper_Run_SciTE_OutputPane_Minimized ' +
            'AutoIt3Wrapper_Run_Tidy AutoIt3Wrapper_ShowProgress ' +
            'AutoIt3Wrapper_Testing AutoIt3Wrapper_Tidy_Stop_OnError ' +
            'AutoIt3Wrapper_UPX_Parameters AutoIt3Wrapper_UseUPX ' +
            'AutoIt3Wrapper_UseX64 AutoIt3Wrapper_Version ' +
            'AutoIt3Wrapper_Versioning AutoIt3Wrapper_Versioning_Parameters ' +
            'Tidy_Off Tidy_On Tidy_Parameters EndRegion Region',
            contains: [{
                begin: /\\\n/,
                relevance: 0
            }, {
                beginKeywords: 'include',
                end: '$',
                contains: [
                STRING, {
                    className: 'string',
                    variants: [{
                        begin: '<',
                        end: '>'
                    }, {
                        begin: /"/,
                        end: /"/,
                        contains: [{
                            begin: /""/,
                            relevance: 0
                        }
                        ]
                    }, {
                        begin: /'/,
                        end: /'/,
                        contains: [{
                            begin: /''/,
                            relevance: 0
                        }
                        ]
                    }
                    ]
                }
                ]
            },
            STRING,
            COMMENT
            ]
        },
        CONSTANT = {
            className: 'constant',
            // begin: '@',
            // end: '$',
            // keywords: 'AppDataCommonDir AppDataDir AutoItExe AutoItPID AutoItVersion AutoItX64 COM_EventObj CommonFilesDir Compiled ComputerName ComSpec CPUArch CR CRLF DesktopCommonDir DesktopDepth DesktopDir DesktopHeight DesktopRefresh DesktopWidth DocumentsCommonDir error exitCode exitMethod extended FavoritesCommonDir FavoritesDir GUI_CtrlHandle GUI_CtrlId GUI_DragFile GUI_DragId GUI_DropId GUI_WinHandle HomeDrive HomePath HomeShare HotKeyPressed HOUR IPAddress1 IPAddress2 IPAddress3 IPAddress4 KBLayout LF LocalAppDataDir LogonDNSDomain LogonDomain LogonServer MDAY MIN MON MSEC MUILang MyDocumentsDir NumParams OSArch OSBuild OSLang OSServicePack OSType OSVersion ProgramFilesDir ProgramsCommonDir ProgramsDir ScriptDir ScriptFullPath ScriptLineNumber ScriptName SEC StartMenuCommonDir StartMenuDir StartupCommonDir StartupDir SW_DISABLE SW_ENABLE SW_HIDE SW_LOCK SW_MAXIMIZE SW_MINIMIZE SW_RESTORE SW_SHOW SW_SHOWDEFAULT SW_SHOWMAXIMIZED SW_SHOWMINIMIZED SW_SHOWMINNOACTIVE SW_SHOWNA SW_SHOWNOACTIVATE SW_SHOWNORMAL SW_UNLOCK SystemDir TAB TempDir TRAY_ID TrayIconFlashing TrayIconVisible UserName UserProfileDir WDAY WindowsDir WorkingDir YDAY YEAR',
            // relevance: 5
            begin: '@[A-z0-9_]+'
        },
        FUNCTION = {
            className: 'function',
            beginKeywords: 'Func',
            end: '$',
            excludeEnd: true,
            illegal: '\\$|\\[|%',
            contains: [
            hljs.UNDERSCORE_TITLE_MODE, {
                className: 'params',
                begin: '\\(',
                end: '\\)',
                contains: [
                VARIABLE,
                STRING,
                NUMBER
                ]
            }
            ]
        };

        return {
            case_insensitive: true,
            keywords: {
                keyword: KEYWORDS,
                built_in: BUILT_IN,
                literal: LITERAL
            },
            contains: [
            COMMENT,
            VARIABLE,
            STRING,
            NUMBER,
            PREPROCESSOR,
            CONSTANT,
            FUNCTION
            ]
        }
    };
}, {}
],
50: [function(require, module, exports) {
    module.exports = function(hljs) {
        return {
            case_insensitive: true,
            lexemes: '\\.?' + hljs.IDENT_RE,
            keywords: {
                keyword:
                /* mnemonic */
                'adc add adiw and andi asr bclr bld brbc brbs brcc brcs break breq brge brhc brhs ' +
                'brid brie brlo brlt brmi brne brpl brsh brtc brts brvc brvs bset bst call cbi cbr ' +
                'clc clh cli cln clr cls clt clv clz com cp cpc cpi cpse dec eicall eijmp elpm eor ' +
                'fmul fmuls fmulsu icall ijmp in inc jmp ld ldd ldi lds lpm lsl lsr mov movw mul ' +
                'muls mulsu neg nop or ori out pop push rcall ret reti rjmp rol ror sbc sbr sbrc sbrs ' +
                'sec seh sbi sbci sbic sbis sbiw sei sen ser ses set sev sez sleep spm st std sts sub ' +
                'subi swap tst wdr',
                built_in:
                /* general purpose registers */
                'r0 r1 r2 r3 r4 r5 r6 r7 r8 r9 r10 r11 r12 r13 r14 r15 r16 r17 r18 r19 r20 r21 r22 ' +
                'r23 r24 r25 r26 r27 r28 r29 r30 r31 x|0 xh xl y|0 yh yl z|0 zh zl ' +
                /* IO Registers (ATMega128) */
                'ucsr1c udr1 ucsr1a ucsr1b ubrr1l ubrr1h ucsr0c ubrr0h tccr3c tccr3a tccr3b tcnt3h ' +
                'tcnt3l ocr3ah ocr3al ocr3bh ocr3bl ocr3ch ocr3cl icr3h icr3l etimsk etifr tccr1c ' +
                'ocr1ch ocr1cl twcr twdr twar twsr twbr osccal xmcra xmcrb eicra spmcsr spmcr portg ' +
                'ddrg ping portf ddrf sreg sph spl xdiv rampz eicrb eimsk gimsk gicr eifr gifr timsk ' +
                'tifr mcucr mcucsr tccr0 tcnt0 ocr0 assr tccr1a tccr1b tcnt1h tcnt1l ocr1ah ocr1al ' +
                'ocr1bh ocr1bl icr1h icr1l tccr2 tcnt2 ocr2 ocdr wdtcr sfior eearh eearl eedr eecr ' +
                'porta ddra pina portb ddrb pinb portc ddrc pinc portd ddrd pind spdr spsr spcr udr0 ' +
                'ucsr0a ucsr0b ubrr0l acsr admux adcsr adch adcl porte ddre pine pinf',
                preprocessor:
                '.byte .cseg .db .def .device .dseg .dw .endmacro .equ .eseg .exit .include .list ' +
                '.listmac .macro .nolist .org .set'
            },
            contains: [
            hljs.C_BLOCK_COMMENT_MODE,
            hljs.COMMENT(
            ';',
            '$',
            {
                relevance: 0
            }),
            hljs.C_NUMBER_MODE, // 0x..., decimal, float
            hljs.BINARY_NUMBER_MODE, // 0b...
            {
                className: 'number',
                begin: '\\b(\\$[a-zA-Z0-9]+|0o[0-7]+)' // $..., 0o...
            },
            hljs.QUOTE_STRING_MODE,
            {
                className: 'string',
                begin: '\'',
                end: '[^\\\\]\'',
                illegal: '[^\\\\][^\']'
            },
            {
                className: 'label',
                begin: '^[A-Za-z0-9_.$]+:'
            },
            {
                className: 'preprocessor',
                begin: '#',
                end: '$'
            },
            {
                // подстановка в «.macro»
                className: 'localvars',
                begin: '@[0-9]+'
            }
            ]
        };
    };
}, {}
],
51: [function(require, module, exports) {
    module.exports = function(hljs) {
        return {
            keywords: 'false int abstract private char boolean static null if for true ' +
            'while long throw finally protected final return void enum else ' +
            'break new catch byte super case short default double public try this switch ' +
            'continue reverse firstfast firstonly forupdate nofetch sum avg minof maxof count ' +
            'order group by asc desc index hint like dispaly edit client server ttsbegin ' +
            'ttscommit str real date container anytype common div mod',
            contains: [
            hljs.C_LINE_COMMENT_MODE,
            hljs.C_BLOCK_COMMENT_MODE,
            hljs.APOS_STRING_MODE,
            hljs.QUOTE_STRING_MODE,
            hljs.C_NUMBER_MODE,
            {
                className: 'preprocessor',
                begin: '#',
                end: '$'
            },
            {
                className: 'class',
                beginKeywords: 'class interface',
                end: '{',
                excludeEnd: true,
                illegal: ':',
                contains: [
                {
                    beginKeywords: 'extends implements'
                },
                hljs.UNDERSCORE_TITLE_MODE
                ]
            }
            ]
        };
    };
}, {}
],
52: [function(require, module, exports) {
    module.exports = function(hljs) {
        var VAR = {
            className: 'variable',
            variants: [
            {
                begin: /\$[\w\d#@][\w\d_]*/
            },
            {
                begin: /\$\{(.*?)}/
            }
            ]
        };
        var QUOTE_STRING = {
            className: 'string',
            begin: /"/,
            end: /"/,
            contains: [
            hljs.BACKSLASH_ESCAPE,
            VAR,
            {
                className: 'variable',
                begin: /\$\(/,
                end: /\)/,
                contains: [hljs.BACKSLASH_ESCAPE]
            }
            ]
        };
        var APOS_STRING = {
            className: 'string',
            begin: /'/,
            end: /'/
        };

        return {
            aliases: ['sh', 'zsh'],
            lexemes: /-?[a-z\.]+/,
            keywords: {
                keyword:
                'if then else elif fi for while in do done case esac function',
                literal:
                'true false',
                built_in:
                // Shell built-ins
                // http://www.gnu.org/software/bash/manual/html_node/Shell-Builtin-Commands.html
                'break cd continue eval exec exit export getopts hash pwd readonly return shift test times ' +
                'trap umask unset ' +
                // Bash built-ins
                'alias bind builtin caller command declare echo enable help let local logout mapfile printf ' +
                'read readarray source type typeset ulimit unalias ' +
                // Shell modifiers
                'set shopt ' +
                // Zsh built-ins
                'autoload bg bindkey bye cap chdir clone comparguments compcall compctl compdescribe compfiles ' +
                'compgroups compquote comptags comptry compvalues dirs disable disown echotc echoti emulate ' +
                'fc fg float functions getcap getln history integer jobs kill limit log noglob popd print ' +
                'pushd pushln rehash sched setcap setopt stat suspend ttyctl unfunction unhash unlimit ' +
                'unsetopt vared wait whence where which zcompile zformat zftp zle zmodload zparseopts zprof ' +
                'zpty zregexparse zsocket zstyle ztcp',
                operator:
                '-ne -eq -lt -gt -f -d -e -s -l -a' // relevance booster
            },
            contains: [
            {
                className: 'shebang',
                begin: /^#![^\n]+sh\s*$/,
                relevance: 10
            },
            {
                className: 'function',
                begin: /\w[\w\d_]*\s*\(\s*\)\s*\{/,
                returnBegin: true,
                contains: [hljs.inherit(hljs.TITLE_MODE, {
                    begin: /\w[\w\d_]*/
                })],
                relevance: 0
            },
            hljs.HASH_COMMENT_MODE,
            hljs.NUMBER_MODE,
            QUOTE_STRING,
            APOS_STRING,
            VAR
            ]
        };
    };
}, {}
],
53: [function(require, module, exports) {
    module.exports = function(hljs) {
        var LITERAL = {
            className: 'literal',
            begin: '[\\+\\-]',
            relevance: 0
        };
        return {
            aliases: ['bf'],
            contains: [
            hljs.COMMENT(
            '[^\\[\\]\\.,\\+\\-<> \r\n]',
            '[\\[\\]\\.,\\+\\-<> \r\n]',
            {
                returnEnd: true,
                relevance: 0
            }),
            {
                className: 'title',
                begin: '[\\[\\]]',
                relevance: 0
            },
            {
                className: 'string',
                begin: '[\\.,]',
                relevance: 0
            },
            {
                // this mode works as the only relevance counter
                begin: /\+\+|\-\-/,
                returnBegin: true,
                contains: [LITERAL]
            },
            LITERAL
            ]
        };
    };
}, {}
],
54: [function(require, module, exports) {
    module.exports = function(hljs) {
        var KEYWORDS =
        'div mod in and or not xor asserterror begin case do downto else end exit for if of repeat then to ' +
        'until while with var';
        var LITERALS = 'false true';
        var COMMENT_MODES = [
        hljs.C_LINE_COMMENT_MODE,
        hljs.COMMENT(
        /\{/,
        /\}/,
        {
            relevance: 0
        }),
        hljs.COMMENT(
        /\(\*/,
        /\*\)/,
        {
            relevance: 10
        })
        ];
        var STRING = {
            className: 'string',
            begin: /'/,
            end: /'/,
            contains: [{
                begin: /''/
            }
            ]
        };
        var CHAR_STRING = {
            className: 'string',
            begin: /(#\d+)+/
        };
        var DATE = {
            className: 'date',
            begin: '\\b\\d+(\\.\\d+)?(DT|D|T)',
            relevance: 0
        };
        var DBL_QUOTED_VARIABLE = {
            className: 'variable',
            begin: '"',
            end: '"'
        };

        var PROCEDURE = {
            className: 'function',
            beginKeywords: 'procedure',
            end: /[:;]/,
            keywords: 'procedure|10',
            contains: [
            hljs.TITLE_MODE,
            {
                className: 'params',
                begin: /\(/,
                end: /\)/,
                keywords: KEYWORDS,
                contains: [STRING, CHAR_STRING]
            }
            ].concat(COMMENT_MODES)
        };

        var OBJECT = {
            className: 'class',
            begin: 'OBJECT (Table|Form|Report|Dataport|Codeunit|XMLport|MenuSuite|Page|Query) (\\d+) ([^\\r\\n]+)',
            returnBegin: true,
            contains: [
            hljs.TITLE_MODE,
            PROCEDURE
            ]
        };

        return {
            case_insensitive: true,
            keywords: {
                keyword: KEYWORDS,
                literal: LITERALS
            },
            contains: [
            STRING, CHAR_STRING,
            DATE, DBL_QUOTED_VARIABLE,
            hljs.NUMBER_MODE,
            OBJECT,
            PROCEDURE
            ]
        };
    };
}, {}
],
55: [function(require, module, exports) {
    module.exports = function(hljs) {
        return {
            aliases: ['capnp'],
            keywords: {
                keyword:
                'struct enum interface union group import using const annotation extends in of on as with from fixed',
                built_in:
                'Void Bool Int8 Int16 Int32 Int64 UInt8 UInt16 UInt32 UInt64 Float32 Float64 ' +
                'Text Data AnyPointer AnyStruct Capability List',
                literal:
                'true false'
            },
            contains: [
            hljs.QUOTE_STRING_MODE,
            hljs.NUMBER_MODE,
            hljs.HASH_COMMENT_MODE,
            {
                className: 'shebang',
                begin: /@0x[\w\d]{16};/,
                illegal: /\n/
            },
            {
                className: 'number',
                begin: /@\d+\b/
            },
            {
                className: 'class',
                beginKeywords: 'struct enum',
                end: /\{/,
                illegal: /\n/,
                contains: [
                hljs.inherit(hljs.TITLE_MODE, {
                    starts: {
                        endsWithParent: true,
                        excludeEnd: true
                    }
                    // hack: eating everything after the first title
                })
                ]
            },
            {
                className: 'class',
                beginKeywords: 'interface',
                end: /\{/,
                illegal: /\n/,
                contains: [
                hljs.inherit(hljs.TITLE_MODE, {
                    starts: {
                        endsWithParent: true,
                        excludeEnd: true
                    }
                    // hack: eating everything after the first title
                })
                ]
            }
            ]
        };
    };
}, {}
],
56: [function(require, module, exports) {
    module.exports = function(hljs) {
        // 2.3. Identifiers and keywords
        var KEYWORDS =
        'assembly module package import alias class interface object given value ' +
        'assign void function new of extends satisfies abstracts in out return ' +
        'break continue throw assert dynamic if else switch case for while try ' +
        'catch finally then let this outer super is exists nonempty';
        // 7.4.1 Declaration Modifiers
        var DECLARATION_MODIFIERS =
        'shared abstract formal default actual variable late native deprecated' +
        'final sealed annotation suppressWarnings small';
        // 7.4.2 Documentation
        var DOCUMENTATION =
        'doc by license see throws tagged';
        var LANGUAGE_ANNOTATIONS = DECLARATION_MODIFIERS + ' ' + DOCUMENTATION;
        var SUBST = {
            className: 'subst',
            excludeBegin: true,
            excludeEnd: true,
            begin: /``/,
            end: /``/,
            keywords: KEYWORDS,
            relevance: 10
        };
        var EXPRESSIONS = [
        {
            // verbatim string
            className: 'string',
            begin: '"""',
            end: '"""',
            relevance: 10
        },
        {
            // string literal or template
            className: 'string',
            begin: '"',
            end: '"',
            contains: [SUBST]
        },
        {
            // character literal
            className: 'string',
            begin: "'",
            end: "'"
        },
        {
            // numeric literal
            className: 'number',
            begin: '#[0-9a-fA-F_]+|\\$[01_]+|[0-9_]+(?:\\.[0-9_](?:[eE][+-]?\\d+)?)?[kMGTPmunpf]?',
            relevance: 0
        }
        ];
        SUBST.contains = EXPRESSIONS;

        return {
            keywords: {
                keyword: KEYWORDS,
                annotation: LANGUAGE_ANNOTATIONS
            },
            illegal: '\\$[^01]|#[^0-9a-fA-F]',
            contains: [
            hljs.C_LINE_COMMENT_MODE,
            hljs.COMMENT('/\\*', '\\*/', {
                contains: ['self']
            }),
            {
                // compiler annotation
                className: 'annotation',
                begin: '@[a-z]\\w*(?:\\:\"[^\"]*\")?'
            }
            ].concat(EXPRESSIONS)
        };
    };
}, {}
],
57: [function(require, module, exports) {
    module.exports = function(hljs) {
        return {
            contains: [
            {
                className: 'prompt',
                begin: /^([\w.-]+|\s*#_)=>/,
                starts: {
                    end: /$/,
                    subLanguage: 'clojure'
                }
            }
            ]
        }
    };
}, {}
],
58: [function(require, module, exports) {
    module.exports = function(hljs) {
        var keywords = {
            built_in:
            // Clojure keywords
            'def defonce cond apply if-not if-let if not not= = < > <= >= == + / * - rem ' +
            'quot neg? pos? delay? symbol? keyword? true? false? integer? empty? coll? list? ' +
            'set? ifn? fn? associative? sequential? sorted? counted? reversible? number? decimal? ' +
            'class? distinct? isa? float? rational? reduced? ratio? odd? even? char? seq? vector? ' +
            'string? map? nil? contains? zero? instance? not-every? not-any? libspec? -> ->> .. . ' +
            'inc compare do dotimes mapcat take remove take-while drop letfn drop-last take-last ' +
            'drop-while while intern condp case reduced cycle split-at split-with repeat replicate ' +
            'iterate range merge zipmap declare line-seq sort comparator sort-by dorun doall nthnext ' +
            'nthrest partition eval doseq await await-for let agent atom send send-off release-pending-sends ' +
            'add-watch mapv filterv remove-watch agent-error restart-agent set-error-handler error-handler ' +
            'set-error-mode! error-mode shutdown-agents quote var fn loop recur throw try monitor-enter ' +
            'monitor-exit defmacro defn defn- macroexpand macroexpand-1 for dosync and or ' +
            'when when-not when-let comp juxt partial sequence memoize constantly complement identity assert ' +
            'peek pop doto proxy defstruct first rest cons defprotocol cast coll deftype defrecord last butlast ' +
            'sigs reify second ffirst fnext nfirst nnext defmulti defmethod meta with-meta ns in-ns create-ns import ' +
            'refer keys select-keys vals key val rseq name namespace promise into transient persistent! conj! ' +
            'assoc! dissoc! pop! disj! use class type num float double short byte boolean bigint biginteger ' +
            'bigdec print-method print-dup throw-if printf format load compile get-in update-in pr pr-on newline ' +
            'flush read slurp read-line subvec with-open memfn time re-find re-groups rand-int rand mod locking ' +
            'assert-valid-fdecl alias resolve ref deref refset swap! reset! set-validator! compare-and-set! alter-meta! ' +
            'reset-meta! commute get-validator alter ref-set ref-history-count ref-min-history ref-max-history ensure sync io! ' +
            'new next conj set! to-array future future-call into-array aset gen-class reduce map filter find empty ' +
            'hash-map hash-set sorted-map sorted-map-by sorted-set sorted-set-by vec vector seq flatten reverse assoc dissoc list ' +
            'disj get union difference intersection extend extend-type extend-protocol int nth delay count concat chunk chunk-buffer ' +
            'chunk-append chunk-first chunk-rest max min dec unchecked-inc-int unchecked-inc unchecked-dec-inc unchecked-dec unchecked-negate ' +
            'unchecked-add-int unchecked-add unchecked-subtract-int unchecked-subtract chunk-next chunk-cons chunked-seq? prn vary-meta ' +
            'lazy-seq spread list* str find-keyword keyword symbol gensym force rationalize'
        };

        var SYMBOLSTART = 'a-zA-Z_\\-!.?+*=<>&#\'';
        var SYMBOL_RE = '[' + SYMBOLSTART + '][' + SYMBOLSTART + '0-9/;:]*';
        var SIMPLE_NUMBER_RE = '[-+]?\\d+(\\.\\d+)?';

        var SYMBOL = {
            begin: SYMBOL_RE,
            relevance: 0
        };
        var NUMBER = {
            className: 'number',
            begin: SIMPLE_NUMBER_RE,
            relevance: 0
        };
        var STRING = hljs.inherit(hljs.QUOTE_STRING_MODE, {
            illegal: null
        });
        var COMMENT = hljs.COMMENT(
        ';',
        '$',
        {
            relevance: 0
        });
        var LITERAL = {
            className: 'literal',
            begin: /\b(true|false|nil)\b/
        };
        var COLLECTION = {
            className: 'collection',
            begin: '[\\[\\{]',
            end: '[\\]\\}]'
        };
        var HINT = {
            className: 'comment',
            begin: '\\^' + SYMBOL_RE
        };
        var HINT_COL = hljs.COMMENT('\\^\\{', '\\}');
        var KEY = {
            className: 'attribute',
            begin: '[:]' + SYMBOL_RE
        };
        var LIST = {
            className: 'list',
            begin: '\\(',
            end: '\\)'
        };
        var BODY = {
            endsWithParent: true,
            relevance: 0
        };
        var NAME = {
            keywords: keywords,
            lexemes: SYMBOL_RE,
            className: 'keyword',
            begin: SYMBOL_RE,
            starts: BODY
        };
        var DEFAULT_CONTAINS = [LIST, STRING, HINT, HINT_COL, COMMENT, KEY, COLLECTION, NUMBER, LITERAL, SYMBOL];

        LIST.contains = [hljs.COMMENT('comment', ''), NAME, BODY];
        BODY.contains = DEFAULT_CONTAINS;
        COLLECTION.contains = DEFAULT_CONTAINS;

        return {
            aliases: ['clj'],
            illegal: /\S/,
            contains: [LIST, STRING, HINT, HINT_COL, COMMENT, KEY, COLLECTION, NUMBER, LITERAL]
        }
    };
}, {}
],
59: [function(require, module, exports) {
    module.exports = function(hljs) {
        return {
            aliases: ['cmake.in'],
            case_insensitive: true,
            keywords: {
                keyword:
                'add_custom_command add_custom_target add_definitions add_dependencies ' +
                'add_executable add_library add_subdirectory add_test aux_source_directory ' +
                'break build_command cmake_minimum_required cmake_policy configure_file ' +
                'create_test_sourcelist define_property else elseif enable_language enable_testing ' +
                'endforeach endfunction endif endmacro endwhile execute_process export find_file ' +
                'find_library find_package find_path find_program fltk_wrap_ui foreach function ' +
                'get_cmake_property get_directory_property get_filename_component get_property ' +
                'get_source_file_property get_target_property get_test_property if include ' +
                'include_directories include_external_msproject include_regular_expression install ' +
                'link_directories load_cache load_command macro mark_as_advanced message option ' +
                'output_required_files project qt_wrap_cpp qt_wrap_ui remove_definitions return ' +
                'separate_arguments set set_directory_properties set_property ' +
                'set_source_files_properties set_target_properties set_tests_properties site_name ' +
                'source_group string target_link_libraries try_compile try_run unset variable_watch ' +
                'while build_name exec_program export_library_dependencies install_files ' +
                'install_programs install_targets link_libraries make_directory remove subdir_depends ' +
                'subdirs use_mangled_mesa utility_source variable_requires write_file ' +
                'qt5_use_modules qt5_use_package qt5_wrap_cpp on off true false and or',
                operator:
                'equal less greater strless strgreater strequal matches'
            },
            contains: [
            {
                className: 'envvar',
                begin: '\\${',
                end: '}'
            },
            hljs.HASH_COMMENT_MODE,
            hljs.QUOTE_STRING_MODE,
            hljs.NUMBER_MODE
            ]
        };
    };
}, {}
],
60: [function(require, module, exports) {
    module.exports = function(hljs) {
        var KEYWORDS = {
            keyword:
            // JS keywords
            'in if for while finally new do return else break catch instanceof throw try this ' +
            'switch continue typeof delete debugger super ' +
            // Coffee keywords
            'then unless until loop of by when and or is isnt not',
            literal:
            // JS literals
            'true false null undefined ' +
            // Coffee literals
            'yes no on off',
            built_in:
            'npm require console print module global window document'
        };
        var JS_IDENT_RE = '[A-Za-z$_][0-9A-Za-z$_]*';
        var SUBST = {
            className: 'subst',
            begin: /#\{/,
            end: /}/,
            keywords: KEYWORDS
        };
        var EXPRESSIONS = [
        hljs.BINARY_NUMBER_MODE,
        hljs.inherit(hljs.C_NUMBER_MODE, {
            starts: {
                end: '(\\s*/)?',
                relevance: 0
            }
        }), // a number tries to eat the following slash to prevent treating it as a regexp
        {
            className: 'string',
            variants: [
            {
                begin: /'''/,
                end: /'''/,
                contains: [hljs.BACKSLASH_ESCAPE]
            },
            {
                begin: /'/,
                end: /'/,
                contains: [hljs.BACKSLASH_ESCAPE]
            },
            {
                begin: /"""/,
                end: /"""/,
                contains: [hljs.BACKSLASH_ESCAPE, SUBST]
            },
            {
                begin: /"/,
                end: /"/,
                contains: [hljs.BACKSLASH_ESCAPE, SUBST]
            }
            ]
        },
        {
            className: 'regexp',
            variants: [
            {
                begin: '///',
                end: '///',
                contains: [SUBST, hljs.HASH_COMMENT_MODE]
            },
            {
                begin: '//[gim]*',
                relevance: 0
            },
            {
                // regex can't start with space to parse x / 2 / 3 as two divisions
                // regex can't start with *, and it supports an "illegal" in the main mode
                begin: /\/(?![ *])(\\\/|.)*?\/[gim]*(?=\W|$)/
            }
            ]
        },
        {
            className: 'property',
            begin: '@' + JS_IDENT_RE
        },
        {
            begin: '`',
            end: '`',
            excludeBegin: true,
            excludeEnd: true,
            subLanguage: 'javascript'
        }
        ];
        SUBST.contains = EXPRESSIONS;

        var TITLE = hljs.inherit(hljs.TITLE_MODE, {
            begin: JS_IDENT_RE
        });
        var PARAMS_RE = '(\\(.*\\))?\\s*\\B[-=]>';
        var PARAMS = {
            className: 'params',
            begin: '\\([^\\(]',
            returnBegin: true,
            /* We need another contained nameless mode to not have every nested
                pair of parens to be called "params" */
            contains: [{
                begin: /\(/,
                end: /\)/,
                keywords: KEYWORDS,
                contains: ['self'].concat(EXPRESSIONS)
            }
            ]
        };

        return {
            aliases: ['coffee', 'cson', 'iced'],
            keywords: KEYWORDS,
            illegal: /\/\*/,
            contains: EXPRESSIONS.concat([
            hljs.COMMENT('###', '###'),
            hljs.HASH_COMMENT_MODE,
            {
                className: 'function',
                begin: '^\\s*' + JS_IDENT_RE + '\\s*=\\s*' + PARAMS_RE,
                end: '[-=]>',
                returnBegin: true,
                contains: [TITLE, PARAMS]
            },
            {
                // anonymous function start
                begin: /[:\(,=]\s*/,
                relevance: 0,
                contains: [
                {
                    className: 'function',
                    begin: PARAMS_RE,
                    end: '[-=]>',
                    returnBegin: true,
                    contains: [PARAMS]
                }
                ]
            },
            {
                className: 'class',
                beginKeywords: 'class',
                end: '$',
                illegal: /[:="\[\]]/,
                contains: [
                {
                    beginKeywords: 'extends',
                    endsWithParent: true,
                    illegal: /[:="\[\]]/,
                    contains: [TITLE]
                },
                TITLE
                ]
            },
            {
                className: 'attribute',
                begin: JS_IDENT_RE + ':',
                end: ':',
                returnBegin: true,
                returnEnd: true,
                relevance: 0
            }
            ])
        };
    };
}, {}
],
61: [function(require, module, exports) {
    module.exports = function(hljs) {
        var CPP_PRIMATIVE_TYPES = {
            className: 'keyword',
            begin: '\\b[a-z\\d_]*_t\\b'
        };

        var STRINGS = {
            className: 'string',
            variants: [
            hljs.inherit(hljs.QUOTE_STRING_MODE, {
                begin: '((u8?|U)|L)?"'
            }),
            {
                begin: '(u8?|U)?R"',
                end: '"',
                contains: [hljs.BACKSLASH_ESCAPE]
            },
            {
                begin: '\'\\\\?.',
                end: '\'',
                illegal: '.'
            }
            ]
        };

        var NUMBERS = {
            className: 'number',
            variants: [
            {
                begin: '\\b(\\d+(\\.\\d*)?|\\.\\d+)(u|U|l|L|ul|UL|f|F)'
            },
            {
                begin: hljs.C_NUMBER_RE
            }
            ]
        };

        var PREPROCESSOR = {
            className: 'preprocessor',
            begin: '#',
            end: '$',
            keywords: 'if else elif endif define undef warning error line ' +
            'pragma ifdef ifndef',
            contains: [
            {
                begin: /\\\n/,
                relevance: 0
            },
            {
                beginKeywords: 'include',
                end: '$',
                contains: [
                STRINGS,
                {
                    className: 'string',
                    begin: '<',
                    end: '>',
                    illegal: '\\n',
                }
                ]
            },
            STRINGS,
            NUMBERS,
            hljs.C_LINE_COMMENT_MODE,
            hljs.C_BLOCK_COMMENT_MODE
            ]
        };

        var FUNCTION_TITLE = hljs.IDENT_RE + '\\s*\\(';

        var CPP_KEYWORDS = {
            keyword: 'int float while private char catch export virtual operator sizeof ' +
            'dynamic_cast|10 typedef const_cast|10 const struct for static_cast|10 union namespace ' +
            'unsigned long volatile static protected bool template mutable if public friend ' +
            'do goto auto void enum else break extern using class asm case typeid ' +
            'short reinterpret_cast|10 default double register explicit signed typename try this ' +
            'switch continue inline delete alignof constexpr decltype ' +
            'noexcept static_assert thread_local restrict _Bool complex _Complex _Imaginary ' +
            'atomic_bool atomic_char atomic_schar ' +
            'atomic_uchar atomic_short atomic_ushort atomic_int atomic_uint atomic_long atomic_ulong atomic_llong ' +
            'atomic_ullong',
            built_in: 'std string cin cout cerr clog stdin stdout stderr stringstream istringstream ostringstream ' +
            'auto_ptr deque list queue stack vector map set bitset multiset multimap unordered_set ' +
            'unordered_map unordered_multiset unordered_multimap array shared_ptr abort abs acos ' +
            'asin atan2 atan calloc ceil cosh cos exit exp fabs floor fmod fprintf fputs free frexp ' +
            'fscanf isalnum isalpha iscntrl isdigit isgraph islower isprint ispunct isspace isupper ' +
            'isxdigit tolower toupper labs ldexp log10 log malloc realloc memchr memcmp memcpy memset modf pow ' +
            'printf putchar puts scanf sinh sin snprintf sprintf sqrt sscanf strcat strchr strcmp ' +
            'strcpy strcspn strlen strncat strncmp strncpy strpbrk strrchr strspn strstr tanh tan ' +
            'vfprintf vprintf vsprintf',
            literal: 'true false nullptr NULL'
        };

        return {
            aliases: ['c', 'cc', 'h', 'c++', 'h++', 'hpp'],
            keywords: CPP_KEYWORDS,
            illegal: '</',
            contains: [
            CPP_PRIMATIVE_TYPES,
            hljs.C_LINE_COMMENT_MODE,
            hljs.C_BLOCK_COMMENT_MODE,
            NUMBERS,
            STRINGS,
            PREPROCESSOR,
            {
                begin: '\\b(deque|list|queue|stack|vector|map|set|bitset|multiset|multimap|unordered_map|unordered_set|unordered_multiset|unordered_multimap|array)\\s*<',
                end: '>',
                keywords: CPP_KEYWORDS,
                contains: ['self', CPP_PRIMATIVE_TYPES]
            },
            {
                begin: hljs.IDENT_RE + '::',
                keywords: CPP_KEYWORDS
            },
            {
                // Expression keywords prevent 'keyword Name(...) or else if(...)' from
                // being recognized as a function definition
                beginKeywords: 'new throw return else',
                relevance: 0
            },
            {
                className: 'function',
                begin: '(' + hljs.IDENT_RE + '[\\*&\\s]+)+' + FUNCTION_TITLE,
                returnBegin: true,
                end: /[{;=]/,
                excludeEnd: true,
                keywords: CPP_KEYWORDS,
                illegal: /[^\w\s\*&]/,
                contains: [
                {
                    begin: FUNCTION_TITLE,
                    returnBegin: true,
                    contains: [hljs.TITLE_MODE],
                    relevance: 0
                },
                {
                    className: 'params',
                    begin: /\(/,
                    end: /\)/,
                    keywords: CPP_KEYWORDS,
                    relevance: 0,
                    contains: [
                    hljs.C_LINE_COMMENT_MODE,
                    hljs.C_BLOCK_COMMENT_MODE,
                    STRINGS,
                    NUMBERS
                    ]
                },
                hljs.C_LINE_COMMENT_MODE,
                hljs.C_BLOCK_COMMENT_MODE,
                PREPROCESSOR
                ]
            }
            ]
        };
    };
}, {}
],
62: [function(require, module, exports) {
    module.exports = function(hljs) {
        var NUM_SUFFIX = '(_[uif](8|16|32|64))?';
        var CRYSTAL_IDENT_RE = '[a-zA-Z_]\\w*[!?=]?';
        var CRYSTAL_METHOD_RE = '[a-zA-Z_]\\w*[!?=]?|[-+~]\\@|<<|>>|=~|===?|<=>|[<>]=?|\\*\\*|[-/+%^&*~`|]|\\[\\][=?]?';
        var CRYSTAL_KEYWORDS = {
            keyword:
            'abstract alias asm begin break case class def do else elsif end ensure enum extend for fun if ifdef ' +
            'include instance_sizeof is_a? lib macro module next of out pointerof private protected rescue responds_to? ' +
            'return require self sizeof struct super then type undef union unless until when while with yield ' +
            '__DIR__ __FILE__ __LINE__',
            literal: 'false nil true'
        };
        var SUBST = {
            className: 'subst',
            begin: '#\\{',
            end: '}',
            keywords: CRYSTAL_KEYWORDS
        };
        var EXPANSION = {
            className: 'expansion',
            variants: [
            {
                begin: '\\{\\{',
                end: '\\}\\}'
            },
            {
                begin: '\\{%',
                end: '%\\}'
            }
            ],
            keywords: CRYSTAL_KEYWORDS,
            relevance: 10
        };
        var
        STRING = {
            className: 'string',
            contains: [hljs.BACKSLASH_ESCAPE, SUBST],
            variants: [
            {
                begin: /'/,
                end: /'/
            },
            {
                begin: /"/,
                end: /"/
            },
            {
                begin: /`/,
                end: /`/
            },
            {
                begin: '%w?\\(',
                end: '\\)'
            },
            {
                begin: '%w?\\[',
                end: '\\]'
            },
            {
                begin: '%w?{',
                end: '}'
            },
            {
                begin: '%w?<',
                end: '>'
            },
            {
                begin: '%w?/',
                end: '/'
            },
            {
                begin: '%w?%',
                end: '%'
            },
            {
                begin: '%w?-',
                end: '-'
            },
            {
                begin: '%w?\\|',
                end: '\\|'
            },
            ],
            relevance: 0,
        };
        var CRYSTAL_DEFAULT_CONTAINS = [
        EXPANSION,
        STRING,
        hljs.HASH_COMMENT_MODE,
        {
            className: 'class',
            beginKeywords: 'class module struct', end: '$|;',
            illegal: /=/,
            contains: [
            hljs.HASH_COMMENT_MODE,
            hljs.inherit(hljs.TITLE_MODE, {
                begin: '[A-Za-z_]\\w*(::\\w+)*(\\?|\\!)?'
            }),
            {
                className: 'inheritance',
                begin: '<\\s*',
                contains: [{
                    className: 'parent',
                    begin: '(' + hljs.IDENT_RE + '::)?' + hljs.IDENT_RE
                }
                ]
            }
            ]
        },
        {
            className: 'class',
            beginKeywords: 'lib enum union',
            end: '$|;',
            illegal: /=/,
            contains: [
            hljs.HASH_COMMENT_MODE,
            hljs.inherit(hljs.TITLE_MODE, {
                begin: '[A-Za-z_]\\w*(::\\w+)*(\\?|\\!)?'
            }),
            ],
            relevance: 10
        },
        {
            className: 'function',
            beginKeywords: 'def', end: /\B\b/,
            contains: [
            hljs.inherit(hljs.TITLE_MODE, {
                begin: CRYSTAL_METHOD_RE,
                endsParent: true
            })
            ]
        },
        {
            className: 'function',
            beginKeywords: 'fun macro',
            end: /\B\b/,
            contains: [
            hljs.inherit(hljs.TITLE_MODE, {
                begin: CRYSTAL_METHOD_RE,
                endsParent: true
            })
            ],
            relevance: 5
        },
        {
            className: 'constant',
            begin: '(::)?(\\b[A-Z]\\w*(::)?)+',
            relevance: 0
        },
        {
            className: 'symbol',
            begin: hljs.UNDERSCORE_IDENT_RE + '(\\!|\\?)?:',
            relevance: 0
        },
        {
            className: 'symbol',
            begin: ':',
            contains: [STRING, {
                begin: CRYSTAL_METHOD_RE
            }
            ],
            relevance: 0
        },
        {
            className: 'number',
            variants: [
            {
                begin: '\\b0b([01_]+)' + NUM_SUFFIX
            },
            {
                begin: '\\b0o([0-7_]+)' + NUM_SUFFIX
            },
            {
                begin: '\\b0x([A-Fa-f0-9_]+)' + NUM_SUFFIX
            },
            {
                begin: '\\b(\\d[\\d_]*(\\.[0-9_]+)?([eE][+-]?[0-9_]+)?)' + NUM_SUFFIX
            }
            ],
            relevance: 0
        },
        {
            className: 'variable',
            begin: '(\\$\\W)|((\\$|\\@\\@?|%)(\\w+))'
        },
        {
            // regexp container
            begin: '(' + hljs.RE_STARTERS_RE + ')\\s*',
            contains: [
            hljs.HASH_COMMENT_MODE,
            {
                className: 'regexp',
                contains: [hljs.BACKSLASH_ESCAPE, SUBST],
                variants: [
                {
                    begin: '/',
                    end: '/[a-z]*'
                },
                ]
            }
            ],
            relevance: 0
        }
        ];
        SUBST.contains = CRYSTAL_DEFAULT_CONTAINS;
        EXPANSION.contains = CRYSTAL_DEFAULT_CONTAINS.slice(1); // without EXPANSION

        return {
            aliases: ['cr'],
            lexemes: CRYSTAL_IDENT_RE,
            keywords: CRYSTAL_KEYWORDS,
            contains: CRYSTAL_DEFAULT_CONTAINS
        };
    };
}, {}
],
63: [function(require, module, exports) {
    module.exports = function(hljs) {
        var KEYWORDS =
        // Normal keywords.
        'abstract as base bool break byte case catch char checked const continue decimal dynamic ' +
        'default delegate do double else enum event explicit extern false finally fixed float ' +
        'for foreach goto if implicit in int interface internal is lock long null when ' +
        'object operator out override params private protected public readonly ref sbyte ' +
        'sealed short sizeof stackalloc static string struct switch this true try typeof ' +
        'uint ulong unchecked unsafe ushort using virtual volatile void while async ' +
        'protected public private internal ' +
        // Contextual keywords.
        'ascending descending from get group into join let orderby partial select set value var ' +
        'where yield';
        var GENERIC_IDENT_RE = hljs.IDENT_RE + '(<' + hljs.IDENT_RE + '>)?';
        return {
            aliases: ['csharp'],
            keywords: KEYWORDS,
            illegal: /::/,
            contains: [
            hljs.COMMENT(
            '///',
            '$',
            {
                returnBegin: true,
                contains: [
                {
                    className: 'xmlDocTag',
                    variants: [
                    {
                        begin: '///',
                        relevance: 0
                    },
                    {
                        begin: '<!--|-->'
                    },
                    {
                        begin: '</?',
                        end: '>'
                    }
                    ]
                }
                ]
            }),
            hljs.C_LINE_COMMENT_MODE,
            hljs.C_BLOCK_COMMENT_MODE,
            {
                className: 'preprocessor',
                begin: '#',
                end: '$',
                keywords: 'if else elif endif define undef warning error line region endregion pragma checksum'
            },
            {
                className: 'string',
                begin: '@"',
                end: '"',
                contains: [{
                    begin: '""'
                }
                ]
            },
            hljs.APOS_STRING_MODE,
            hljs.QUOTE_STRING_MODE,
            hljs.C_NUMBER_MODE,
            {
                beginKeywords: 'class interface',
                end: /[{;=]/,
                illegal: /[^\s:]/,
                contains: [
                hljs.TITLE_MODE,
                hljs.C_LINE_COMMENT_MODE,
                hljs.C_BLOCK_COMMENT_MODE
                ]
            },
            {
                beginKeywords: 'namespace',
                end: /[{;=]/,
                illegal: /[^\s:]/,
                contains: [
                {
                    // Customization of hljs.TITLE_MODE that allows '.'
                    className: 'title',
                    begin: '[a-zA-Z](\\.?\\w)*',
                    relevance: 0
                },
                hljs.C_LINE_COMMENT_MODE,
                hljs.C_BLOCK_COMMENT_MODE
                ]
            },
            {
                // Expression keywords prevent 'keyword Name(...)' from being
                // recognized as a function definition
                beginKeywords: 'new return throw await',
                relevance: 0
            },
            {
                className: 'function',
                begin: '(' + GENERIC_IDENT_RE + '\\s+)+' + hljs.IDENT_RE + '\\s*\\(',
                returnBegin: true,
                end: /[{;=]/,
                excludeEnd: true,
                keywords: KEYWORDS,
                contains: [
                {
                    begin: hljs.IDENT_RE + '\\s*\\(',
                    returnBegin: true,
                    contains: [hljs.TITLE_MODE],
                    relevance: 0
                },
                {
                    className: 'params',
                    begin: /\(/,
                    end: /\)/,
                    excludeBegin: true,
                    excludeEnd: true,
                    keywords: KEYWORDS,
                    relevance: 0,
                    contains: [
                    hljs.APOS_STRING_MODE,
                    hljs.QUOTE_STRING_MODE,
                    hljs.C_NUMBER_MODE,
                    hljs.C_BLOCK_COMMENT_MODE
                    ]
                },
                hljs.C_LINE_COMMENT_MODE,
                hljs.C_BLOCK_COMMENT_MODE
                ]
            }
            ]
        };
    };
}, {}
],
64: [function(require, module, exports) {
    module.exports = function(hljs) {
        var IDENT_RE = '[a-zA-Z-][a-zA-Z0-9_-]*';
        var FUNCTION = {
            className: 'function',
            begin: IDENT_RE + '\\(',
            returnBegin: true,
            excludeEnd: true,
            end: '\\('
        };
        var RULE = {
            className: 'rule',
            begin: /[A-Z\_\.\-]+\s*:/,
            returnBegin: true,
            end: ';',
            endsWithParent: true,
            contains: [
            {
                className: 'attribute',
                begin: /\S/,
                end: ':',
                excludeEnd: true,
                starts: {
                    className: 'value',
                    endsWithParent: true,
                    excludeEnd: true,
                    contains: [
                    FUNCTION,
                    hljs.CSS_NUMBER_MODE,
                    hljs.QUOTE_STRING_MODE,
                    hljs.APOS_STRING_MODE,
                    hljs.C_BLOCK_COMMENT_MODE,
                    {
                        className: 'hexcolor',
                        begin: '#[0-9A-Fa-f]+'
                    },
                    {
                        className: 'important',
                        begin: '!important'
                    }
                    ]
                }
            }
            ]
        };

        return {
            case_insensitive: true,
            illegal: /[=\/|'\$]/,
            contains: [
            hljs.C_BLOCK_COMMENT_MODE,
            RULE,
            {
                className: 'id',
                begin: /\#[A-Za-z0-9_-]+/
            },
            {
                className: 'class',
                begin: /\.[A-Za-z0-9_-]+/
            },
            {
                className: 'attr_selector',
                begin: /\[/,
                end: /\]/,
                illegal: '$'
            },
            {
                className: 'pseudo',
                begin: /:(:)?[a-zA-Z0-9\_\-\+\(\)"']+/
            },
            {
                className: 'at_rule',
                begin: '@(font-face|page)',
                lexemes: '[a-z-]+',
                keywords: 'font-face page'
            },
            {
                className: 'at_rule',
                begin: '@',
                end: '[{;]',
                // at_rule eating first "{" is a good thing
                // because it doesn’t let it to be parsed as
                // a rule set but instead drops parser into
                // the default mode which is how it should be.
                contains: [
                {
                    className: 'keyword',
                    begin: /\S+/
                },
                {
                    begin: /\s/,
                    endsWithParent: true,
                    excludeEnd: true,
                    relevance: 0,
                    contains: [
                    FUNCTION,
                    hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE,
                    hljs.CSS_NUMBER_MODE
                    ]
                }
                ]
            },
            {
                className: 'tag',
                begin: IDENT_RE,
                relevance: 0
            },
            {
                className: 'rules',
                begin: '{',
                end: '}',
                illegal: /\S/,
                contains: [
                hljs.C_BLOCK_COMMENT_MODE,
                RULE,
                ]
            }
            ]
        };
    };
}, {}
],
65: [function(require, module, exports) {
    module.exports = /**
     * Known issues:
     *
     * - invalid hex string literals will be recognized as a double quoted strings
     *   but 'x' at the beginning of string will not be matched
     *
     * - delimited string literals are not checked for matching end delimiter
     *   (not possible to do with js regexp)
     *
     * - content of token string is colored as a string (i.e. no keyword coloring inside a token string)
     *   also, content of token string is not validated to contain only valid D tokens
     *
     * - special token sequence rule is not strictly following D grammar (anything following #line
     *   up to the end of line is matched as special token sequence)
     */

    function(hljs) {
        /**
           * Language keywords
           *
           * @type {Object}
           */
        var D_KEYWORDS = {
            keyword:
            'abstract alias align asm assert auto body break byte case cast catch class ' +
            'const continue debug default delete deprecated do else enum export extern final ' +
            'finally for foreach foreach_reverse|10 goto if immutable import in inout int ' +
            'interface invariant is lazy macro mixin module new nothrow out override package ' +
            'pragma private protected public pure ref return scope shared static struct ' +
            'super switch synchronized template this throw try typedef typeid typeof union ' +
            'unittest version void volatile while with __FILE__ __LINE__ __gshared|10 ' +
            '__thread __traits __DATE__ __EOF__ __TIME__ __TIMESTAMP__ __VENDOR__ __VERSION__',
            built_in:
            'bool cdouble cent cfloat char creal dchar delegate double dstring float function ' +
            'idouble ifloat ireal long real short string ubyte ucent uint ulong ushort wchar ' +
            'wstring',
            literal:
            'false null true'
        };

        /**
           * Number literal regexps
           *
           * @type {String}
           */
        var decimal_integer_re = '(0|[1-9][\\d_]*)',
        decimal_integer_nosus_re = '(0|[1-9][\\d_]*|\\d[\\d_]*|[\\d_]+?\\d)',
        binary_integer_re = '0[bB][01_]+',
        hexadecimal_digits_re = '([\\da-fA-F][\\da-fA-F_]*|_[\\da-fA-F][\\da-fA-F_]*)',
        hexadecimal_integer_re = '0[xX]' + hexadecimal_digits_re,
        decimal_exponent_re = '([eE][+-]?' + decimal_integer_nosus_re + ')',
        decimal_float_re = '(' + decimal_integer_nosus_re + '(\\.\\d*|' + decimal_exponent_re + ')|' +
        '\\d+\\.' + decimal_integer_nosus_re + decimal_integer_nosus_re + '|' +
        '\\.' + decimal_integer_re + decimal_exponent_re + '?' +
        ')',
        hexadecimal_float_re = '(0[xX](' +
        hexadecimal_digits_re + '\\.' + hexadecimal_digits_re + '|' +
        '\\.?' + hexadecimal_digits_re +
        ')[pP][+-]?' + decimal_integer_nosus_re + ')',
        integer_re = '(' +
        decimal_integer_re + '|' +
        binary_integer_re + '|' +
        hexadecimal_integer_re +
        ')',
        float_re = '(' +
        hexadecimal_float_re + '|' +
        decimal_float_re +
        ')';

        /**
           * Escape sequence supported in D string and character literals
           *
           * @type {String}
           */
        var escape_sequence_re = '\\\\(' +
        '[\'"\\?\\\\abfnrtv]|' + // common escapes
        'u[\\dA-Fa-f]{4}|' + // four hex digit unicode codepoint
        '[0-7]{1,3}|' + // one to three octal digit ascii char code
        'x[\\dA-Fa-f]{2}|' + // two hex digit ascii char code
        'U[\\dA-Fa-f]{8}' + // eight hex digit unicode codepoint
        ')|' +
        '&[a-zA-Z\\d]{2,};'; // named character entity

        /**
           * D integer number literals
           *
           * @type {Object}
           */
        var D_INTEGER_MODE = {
            className: 'number',
            begin: '\\b' + integer_re + '(L|u|U|Lu|LU|uL|UL)?',
            relevance: 0
        };

        /**
           * [D_FLOAT_MODE description]
           * @type {Object}
           */
        var D_FLOAT_MODE = {
            className: 'number',
            begin: '\\b(' +
            float_re + '([fF]|L|i|[fF]i|Li)?|' +
            integer_re + '(i|[fF]i|Li)' +
            ')',
            relevance: 0
        };

        /**
           * D character literal
           *
           * @type {Object}
           */
        var D_CHARACTER_MODE = {
            className: 'string',
            begin: '\'(' + escape_sequence_re + '|.)',
            end: '\'',
            illegal: '.'
        };

        /**
           * D string escape sequence
           *
           * @type {Object}
           */
        var D_ESCAPE_SEQUENCE = {
            begin: escape_sequence_re,
            relevance: 0
        };

        /**
           * D double quoted string literal
           *
           * @type {Object}
           */
        var D_STRING_MODE = {
            className: 'string',
            begin: '"',
            contains: [D_ESCAPE_SEQUENCE],
            end: '"[cwd]?'
        };

        /**
           * D wysiwyg and delimited string literals
           *
           * @type {Object}
           */
        var D_WYSIWYG_DELIMITED_STRING_MODE = {
            className: 'string',
            begin: '[rq]"',
            end: '"[cwd]?',
            relevance: 5
        };

        /**
           * D alternate wysiwyg string literal
           *
           * @type {Object}
           */
        var D_ALTERNATE_WYSIWYG_STRING_MODE = {
            className: 'string',
            begin: '`',
            end: '`[cwd]?'
        };

        /**
           * D hexadecimal string literal
           *
           * @type {Object}
           */
        var D_HEX_STRING_MODE = {
            className: 'string',
            begin: 'x"[\\da-fA-F\\s\\n\\r]*"[cwd]?',
            relevance: 10
        };

        /**
           * D delimited string literal
           *
           * @type {Object}
           */
        var D_TOKEN_STRING_MODE = {
            className: 'string',
            begin: 'q"\\{',
            end: '\\}"'
        };

        /**
           * Hashbang support
           *
           * @type {Object}
           */
        var D_HASHBANG_MODE = {
            className: 'shebang',
            begin: '^#!',
            end: '$',
            relevance: 5
        };

        /**
           * D special token sequence
           *
           * @type {Object}
           */
        var D_SPECIAL_TOKEN_SEQUENCE_MODE = {
            className: 'preprocessor',
            begin: '#(line)',
            end: '$',
            relevance: 5
        };

        /**
           * D attributes
           *
           * @type {Object}
           */
        var D_ATTRIBUTE_MODE = {
            className: 'keyword',
            begin: '@[a-zA-Z_][a-zA-Z_\\d]*'
        };

        /**
           * D nesting comment
           *
           * @type {Object}
           */
        var D_NESTING_COMMENT_MODE = hljs.COMMENT(
        '\\/\\+',
        '\\+\\/',
        {
            contains: ['self'],
            relevance: 10
        });

        return {
            lexemes: hljs.UNDERSCORE_IDENT_RE,
            keywords: D_KEYWORDS,
            contains: [
            hljs.C_LINE_COMMENT_MODE,
            hljs.C_BLOCK_COMMENT_MODE,
            D_NESTING_COMMENT_MODE,
            D_HEX_STRING_MODE,
            D_STRING_MODE,
            D_WYSIWYG_DELIMITED_STRING_MODE,
            D_ALTERNATE_WYSIWYG_STRING_MODE,
            D_TOKEN_STRING_MODE,
            D_FLOAT_MODE,
            D_INTEGER_MODE,
            D_CHARACTER_MODE,
            D_HASHBANG_MODE,
            D_SPECIAL_TOKEN_SEQUENCE_MODE,
            D_ATTRIBUTE_MODE
            ]
        };
    };
}, {}
],
66: [function(require, module, exports) {
    module.exports = function (hljs) {
        var SUBST = {
            className: 'subst',
            begin: '\\$\\{',
            end: '}',
            keywords: 'true false null this is new super'
        };

        var STRING = {
            className: 'string',
            variants: [
            {
                begin: 'r\'\'\'',
                end: '\'\'\''
            },
            {
                begin: 'r"""',
                end: '"""'
            },
            {
                begin: 'r\'',
                end: '\'',
                illegal: '\\n'
            },
            {
                begin: 'r"',
                end: '"',
                illegal: '\\n'
            },
            {
                begin: '\'\'\'',
                end: '\'\'\'',
                contains: [hljs.BACKSLASH_ESCAPE, SUBST]
            },
            {
                begin: '"""',
                end: '"""',
                contains: [hljs.BACKSLASH_ESCAPE, SUBST]
            },
            {
                begin: '\'',
                end: '\'',
                illegal: '\\n',
                contains: [hljs.BACKSLASH_ESCAPE, SUBST]
            },
            {
                begin: '"',
                end: '"',
                illegal: '\\n',
                contains: [hljs.BACKSLASH_ESCAPE, SUBST]
            }
            ]
        };
        SUBST.contains = [
        hljs.C_NUMBER_MODE, STRING
        ];

        var KEYWORDS = {
            keyword: 'assert break case catch class const continue default do else enum extends false final finally for if ' +
            'in is new null rethrow return super switch this throw true try var void while with',
            literal: 'abstract as dynamic export external factory get implements import library operator part set static typedef',
            built_in:
            // dart:core
            'print Comparable DateTime Duration Function Iterable Iterator List Map Match Null Object Pattern RegExp Set ' +
            'Stopwatch String StringBuffer StringSink Symbol Type Uri bool double int num ' +
            // dart:html
            'document window querySelector querySelectorAll Element ElementList'
        };

        return {
            keywords: KEYWORDS,
            contains: [
            STRING,
            hljs.COMMENT(
            '/\\*\\*',
            '\\*/',
            {
                subLanguage: 'markdown'
            }),
            hljs.COMMENT(
            '///',
            '$',
            {
                subLanguage: 'markdown'
            }),
            hljs.C_LINE_COMMENT_MODE,
            hljs.C_BLOCK_COMMENT_MODE,
            {
                className: 'class',
                beginKeywords: 'class interface',
                end: '{',
                excludeEnd: true,
                contains: [
                {
                    beginKeywords: 'extends implements'
                },
                hljs.UNDERSCORE_TITLE_MODE
                ]
            },
            hljs.C_NUMBER_MODE,
            {
                className: 'annotation',
                begin: '@[A-Za-z]+'
            },
            {
                begin: '=>' // No markup, just a relevance booster
            }
            ]
        }
    };
}, {}
],
67: [function(require, module, exports) {
    module.exports = function(hljs) {
        var KEYWORDS =
        'exports register file shl array record property for mod while set ally label uses raise not ' +
        'stored class safecall var interface or private static exit index inherited to else stdcall ' +
        'override shr asm far resourcestring finalization packed virtual out and protected library do ' +
        'xorwrite goto near function end div overload object unit begin string on inline repeat until ' +
        'destructor write message program with read initialization except default nil if case cdecl in ' +
        'downto threadvar of try pascal const external constructor type public then implementation ' +
        'finally published procedure';
        var COMMENT_MODES = [
        hljs.C_LINE_COMMENT_MODE,
        hljs.COMMENT(
        /\{/,
        /\}/,
        {
            relevance: 0
        }),
        hljs.COMMENT(
        /\(\*/,
        /\*\)/,
        {
            relevance: 10
        })
        ];
        var STRING = {
            className: 'string',
            begin: /'/,
            end: /'/,
            contains: [{
                begin: /''/
            }
            ]
        };
        var CHAR_STRING = {
            className: 'string',
            begin: /(#\d+)+/
        };
        var CLASS = {
            begin: hljs.IDENT_RE + '\\s*=\\s*class\\s*\\(',
            returnBegin: true,
            contains: [
            hljs.TITLE_MODE
            ]
        };
        var FUNCTION = {
            className: 'function',
            beginKeywords: 'function constructor destructor procedure',
            end: /[:;]/,
            keywords: 'function constructor|10 destructor|10 procedure|10',
            contains: [
            hljs.TITLE_MODE,
            {
                className: 'params',
                begin: /\(/,
                end: /\)/,
                keywords: KEYWORDS,
                contains: [STRING, CHAR_STRING]
            }
            ].concat(COMMENT_MODES)
        };
        return {
            case_insensitive: true,
            keywords: KEYWORDS,
            illegal: /"|\$[G-Zg-z]|\/\*|<\/|\|/,
            contains: [
            STRING, CHAR_STRING,
            hljs.NUMBER_MODE,
            CLASS,
            FUNCTION
            ].concat(COMMENT_MODES)
        };
    };
}, {}
],
68: [function(require, module, exports) {
    module.exports = function(hljs) {
        return {
            aliases: ['patch'],
            contains: [
            {
                className: 'chunk',
                relevance: 10,
                variants: [
                {
                    begin: /^@@ +\-\d+,\d+ +\+\d+,\d+ +@@$/
                },
                {
                    begin: /^\*\*\* +\d+,\d+ +\*\*\*\*$/
                },
                {
                    begin: /^\-\-\- +\d+,\d+ +\-\-\-\-$/
                }
                ]
            },
            {
                className: 'header',
                variants: [
                {
                    begin: /Index: /,
                    end: /$/
                },
                {
                    begin: /=====/,
                    end: /=====$/
                },
                {
                    begin: /^\-\-\-/,
                    end: /$/
                },
                {
                    begin: /^\*{3} /,
                    end: /$/
                },
                {
                    begin: /^\+\+\+/,
                    end: /$/
                },
                {
                    begin: /\*{5}/,
                    end: /\*{5}$/
                }
                ]
            },
            {
                className: 'addition',
                begin: '^\\+',
                end: '$'
            },
            {
                className: 'deletion',
                begin: '^\\-',
                end: '$'
            },
            {
                className: 'change',
                begin: '^\\!',
                end: '$'
            }
            ]
        };
    };
}, {}
],
69: [function(require, module, exports) {
    module.exports = function(hljs) {
        var FILTER = {
            className: 'filter',
            begin: /\|[A-Za-z]+:?/,
            keywords:
            'truncatewords removetags linebreaksbr yesno get_digit timesince random striptags ' +
            'filesizeformat escape linebreaks length_is ljust rjust cut urlize fix_ampersands ' +
            'title floatformat capfirst pprint divisibleby add make_list unordered_list urlencode ' +
            'timeuntil urlizetrunc wordcount stringformat linenumbers slice date dictsort ' +
            'dictsortreversed default_if_none pluralize lower join center default ' +
            'truncatewords_html upper length phone2numeric wordwrap time addslashes slugify first ' +
            'escapejs force_escape iriencode last safe safeseq truncatechars localize unlocalize ' +
            'localtime utc timezone',
            contains: [
            {
                className: 'argument',
                begin: /"/,
                end: /"/
            },
            {
                className: 'argument',
                begin: /'/,
                end: /'/
            }
            ]
        };

        return {
            aliases: ['jinja'],
            case_insensitive: true,
            subLanguage: 'xml',
            contains: [
            hljs.COMMENT(/\{%\s*comment\s*%}/, /\{%\s*endcomment\s*%}/),
            hljs.COMMENT(/\{#/, /#}/),
            {
                className: 'template_tag',
                begin: /\{%/,
                end: /%}/,
                keywords:
                'comment endcomment load templatetag ifchanged endifchanged if endif firstof for ' +
                'endfor in ifnotequal endifnotequal widthratio extends include spaceless ' +
                'endspaceless regroup by as ifequal endifequal ssi now with cycle url filter ' +
                'endfilter debug block endblock else autoescape endautoescape csrf_token empty elif ' +
                'endwith static trans blocktrans endblocktrans get_static_prefix get_media_prefix ' +
                'plural get_current_language language get_available_languages ' +
                'get_current_language_bidi get_language_info get_language_info_list localize ' +
                'endlocalize localtime endlocaltime timezone endtimezone get_current_timezone ' +
                'verbatim',
                contains: [FILTER]
            },
            {
                className: 'variable',
                begin: /\{\{/,
                end: /}}/,
                contains: [FILTER]
            }
            ]
        };
    };
}, {}
],
70: [function(require, module, exports) {
    module.exports = function(hljs) {
        return {
            aliases: ['bind', 'zone'],
            keywords: {
                keyword:
                'IN A AAAA AFSDB APL CAA CDNSKEY CDS CERT CNAME DHCID DLV DNAME DNSKEY DS HIP IPSECKEY KEY KX ' +
                'LOC MX NAPTR NS NSEC NSEC3 NSEC3PARAM PTR RRSIG RP SIG SOA SRV SSHFP TA TKEY TLSA TSIG TXT'
            },
            contains: [
            hljs.COMMENT(';', '$'),
            {
                className: 'operator',
                beginKeywords: '$TTL $GENERATE $INCLUDE $ORIGIN'
            },
            // IPv6
            {
                className: 'number',
                begin: '((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:)))'
            },
            // IPv4
            {
                className: 'number',
                begin: '((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])'
            }
            ]
        };
    };
}, {}
],
71: [function(require, module, exports) {
    module.exports = function(hljs) {
        return {
            aliases: ['docker'],
            case_insensitive: true,
            keywords: {
                built_ins: 'from maintainer cmd expose add copy entrypoint volume user workdir onbuild run env'
            },
            contains: [
            hljs.HASH_COMMENT_MODE,
            {
                keywords : {
                    built_in: 'run cmd entrypoint volume add copy workdir onbuild'
                },
                begin: /^ *(onbuild +)?(run|cmd|entrypoint|volume|add|copy|workdir) +/,
                starts: {
                    end: /[^\\]\n/,
                    subLanguage: 'bash'
                }
            },
            {
                keywords: {
                    built_in: 'from maintainer expose env user onbuild'
                },
                begin: /^ *(onbuild +)?(from|maintainer|expose|env|user|onbuild) +/,
                end: /[^\\]\n/,
                contains: [
                hljs.APOS_STRING_MODE,
                hljs.QUOTE_STRING_MODE,
                hljs.NUMBER_MODE,
                hljs.HASH_COMMENT_MODE
                ]
            }
            ]
        }
    };
}, {}
],
72: [function(require, module, exports) {
    module.exports = function(hljs) {
        var COMMENT = hljs.COMMENT(
        /@?rem\b/, /$/,
        {
            relevance: 10
        });
        var LABEL = {
            className: 'label',
            begin: '^\\s*[A-Za-z._?][A-Za-z0-9_$#@~.?]*(:|\\s+label)',
            relevance: 0
        };
        return {
            aliases: ['bat', 'cmd'],
            case_insensitive: true,
            keywords: {
                flow: 'if else goto for in do call exit not exist errorlevel defined',
                operator: 'equ neq lss leq gtr geq',
                keyword: 'shift cd dir echo setlocal endlocal set pause copy',
                stream: 'prn nul lpt3 lpt2 lpt1 con com4 com3 com2 com1 aux',
                winutils: 'ping net ipconfig taskkill xcopy ren del',
                built_in: 'append assoc at attrib break cacls cd chcp chdir chkdsk chkntfs cls cmd color ' +
                'comp compact convert date dir diskcomp diskcopy doskey erase fs ' +
                'find findstr format ftype graftabl help keyb label md mkdir mode more move path ' +
                'pause print popd pushd promt rd recover rem rename replace restore rmdir shift' +
                'sort start subst time title tree type ver verify vol'
            },
            contains: [
            {
                className: 'envvar',
                begin: /%%[^ ]|%[^ ]+?%|![^ ]+?!/
            },
            {
                className: 'function',
                begin: LABEL.begin,
                end: 'goto:eof',
                contains: [
                hljs.inherit(hljs.TITLE_MODE, {
                    begin: '([_a-zA-Z]\\w*\\.)*([_a-zA-Z]\\w*:)?[_a-zA-Z]\\w*'
                }),
                COMMENT
                ]
            },
            {
                className: 'number',
                begin: '\\b\\d+',
                relevance: 0
            },
            COMMENT
            ]
        };
    };
}, {}
],
73: [function(require, module, exports) {
    module.exports = function(hljs) {
        var EXPRESSION_KEYWORDS = 'if eq ne lt lte gt gte select default math sep';
        return {
            aliases: ['dst'],
            case_insensitive: true,
            subLanguage: 'xml',
            contains: [
            {
                className: 'expression',
                begin: '{',
                end: '}',
                relevance: 0,
                contains: [
                {
                    className: 'begin-block',
                    begin: '\#[a-zA-Z\-\ \.]+',
                    keywords: EXPRESSION_KEYWORDS
                },
                {
                    className: 'string',
                    begin: '"',
                    end: '"'
                },
                {
                    className: 'end-block',
                    begin: '\\\/[a-zA-Z\-\ \.]+',
                    keywords: EXPRESSION_KEYWORDS
                },
                {
                    className: 'variable',
                    begin: '[a-zA-Z\-\.]+',
                    keywords: EXPRESSION_KEYWORDS,
                    relevance: 0
                }
                ]
            }
            ]
        };
    };
}, {}
],
74: [function(require, module, exports) {
    module.exports = function(hljs) {
        var ELIXIR_IDENT_RE = '[a-zA-Z_][a-zA-Z0-9_]*(\\!|\\?)?';
        var ELIXIR_METHOD_RE = '[a-zA-Z_]\\w*[!?=]?|[-+~]\\@|<<|>>|=~|===?|<=>|[<>]=?|\\*\\*|[-/+%^&*~`|]|\\[\\]=?';
        var ELIXIR_KEYWORDS =
        'and false then defined module in return redo retry end for true self when ' +
        'next until do begin unless nil break not case cond alias while ensure or ' +
        'include use alias fn quote';
        var SUBST = {
            className: 'subst',
            begin: '#\\{',
            end: '}',
            lexemes: ELIXIR_IDENT_RE,
            keywords: ELIXIR_KEYWORDS
        };
        var STRING = {
            className: 'string',
            contains: [hljs.BACKSLASH_ESCAPE, SUBST],
            variants: [
            {
                begin: /'/,
                end: /'/
            },
            {
                begin: /"/,
                end: /"/
            }
            ]
        };
        var FUNCTION = {
            className: 'function',
            beginKeywords: 'def defp defmacro',
            end: /\B\b/,
            // the mode is ended by the title
            contains: [
            hljs.inherit(hljs.TITLE_MODE, {
                begin: ELIXIR_IDENT_RE,
                endsParent: true
            })
            ]
        };
        var CLASS = hljs.inherit(FUNCTION, {
            className: 'class',
            beginKeywords: 'defmodule defrecord',
            end: /\bdo\b|$|;/
        });
        var ELIXIR_DEFAULT_CONTAINS = [
        STRING,
        hljs.HASH_COMMENT_MODE,
        CLASS,
        FUNCTION,
        {
            className: 'constant',
            begin: '(\\b[A-Z_]\\w*(.)?)+',
            relevance: 0
        },
        {
            className: 'symbol',
            begin: ':',
            contains: [STRING, {
                begin: ELIXIR_METHOD_RE
            }
            ],
            relevance: 0
        },
        {
            className: 'symbol',
            begin: ELIXIR_IDENT_RE + ':',
            relevance: 0
        },
        {
            className: 'number',
            begin: '(\\b0[0-7_]+)|(\\b0x[0-9a-fA-F_]+)|(\\b[1-9][0-9_]*(\\.[0-9_]+)?)|[0_]\\b',
            relevance: 0
        },
        {
            className: 'variable',
            begin: '(\\$\\W)|((\\$|\\@\\@?)(\\w+))'
        },
        {
            begin: '->'
        },
        {
            // regexp container
            begin: '(' + hljs.RE_STARTERS_RE + ')\\s*',
            contains: [
            hljs.HASH_COMMENT_MODE,
            {
                className: 'regexp',
                illegal: '\\n',
                contains: [hljs.BACKSLASH_ESCAPE, SUBST],
                variants: [
                {
                    begin: '/',
                    end: '/[a-z]*'
                },
                {
                    begin: '%r\\[',
                    end: '\\][a-z]*'
                }
                ]
            }
            ],
            relevance: 0
        }
        ];
        SUBST.contains = ELIXIR_DEFAULT_CONTAINS;

        return {
            lexemes: ELIXIR_IDENT_RE,
            keywords: ELIXIR_KEYWORDS,
            contains: ELIXIR_DEFAULT_CONTAINS
        };
    };
}, {}
],
75: [function(require, module, exports) {
    module.exports = function(hljs) {
        var COMMENT_MODES = [
        hljs.COMMENT('--', '$'),
        hljs.COMMENT(
        '{-',
        '-}',
        {
            contains: ['self']
        })
        ];

        var CONSTRUCTOR = {
            className: 'type',
            begin: '\\b[A-Z][\\w\']*',
            // TODO: other constructors (build-in, infix).
            relevance: 0
        };

        var LIST = {
            className: 'container',
            begin: '\\(',
            end: '\\)',
            illegal: '"',
            contains: [
            {
                className: 'type',
                begin: '\\b[A-Z][\\w]*(\\((\\.\\.|,|\\w+)\\))?'
            }
            ].concat(COMMENT_MODES)
        };

        var RECORD = {
            className: 'container',
            begin: '{',
            end: '}',
            contains: LIST.contains
        };

        return {
            keywords:
            'let in if then else case of where module import exposing ' +
            'type alias as infix infixl infixr port',
            contains: [
            // Top-level constructions.

            {
                className: 'module',
                begin: '\\bmodule\\b',
                end: 'where',
                keywords: 'module where',
                contains: [LIST].concat(COMMENT_MODES),
                illegal: '\\W\\.|;'
            },
            {
                className: 'import',
                begin: '\\bimport\\b',
                end: '$',
                keywords: 'import|0 as exposing',
                contains: [LIST].concat(COMMENT_MODES),
                illegal: '\\W\\.|;'
            },
            {
                className: 'typedef',
                begin: '\\btype\\b',
                end: '$',
                keywords: 'type alias',
                contains: [CONSTRUCTOR, LIST, RECORD].concat(COMMENT_MODES)
            },
            {
                className: 'infix',
                beginKeywords: 'infix infixl infixr',
                end: '$',
                contains: [hljs.C_NUMBER_MODE].concat(COMMENT_MODES)
            },
            {
                className: 'foreign',
                begin: '\\bport\\b',
                end: '$',
                keywords: 'port',
                contains: COMMENT_MODES
            },
            // Literals and names.

            // TODO: characters.
            hljs.QUOTE_STRING_MODE,
            hljs.C_NUMBER_MODE,
            CONSTRUCTOR,
            hljs.inherit(hljs.TITLE_MODE, {
                begin: '^[_a-z][\\w\']*'
            }),
            {
                begin: '->|<-'
            }
            // No markup, relevance booster
            ].concat(COMMENT_MODES)
        };
    };
}, {}
],
76: [function(require, module, exports) {
    module.exports = function(hljs) {
        return {
            subLanguage: 'xml',
            contains: [
            hljs.COMMENT('<%#', '%>'),
            {
                begin: '<%[%=-]?',
                end: '[%-]?%>',
                subLanguage: 'ruby',
                excludeBegin: true,
                excludeEnd: true
            }
            ]
        };
    };
}, {}
],
77: [function(require, module, exports) {
    module.exports = function(hljs) {
        return {
            keywords: {
                special_functions:
                'spawn spawn_link self',
                reserved:
                'after and andalso|10 band begin bnot bor bsl bsr bxor case catch cond div end fun if ' +
                'let not of or orelse|10 query receive rem try when xor'
            },
            contains: [
            {
                className: 'prompt',
                begin: '^[0-9]+> ',
                relevance: 10
            },
            hljs.COMMENT('%', '$'),
            {
                className: 'number',
                begin: '\\b(\\d+#[a-fA-F0-9]+|\\d+(\\.\\d+)?([eE][-+]?\\d+)?)',
                relevance: 0
            },
            hljs.APOS_STRING_MODE,
            hljs.QUOTE_STRING_MODE,
            {
                className: 'constant',
                begin: '\\?(::)?([A-Z]\\w*(::)?)+'
            },
            {
                className: 'arrow',
                begin: '->'
            },
            {
                className: 'ok',
                begin: 'ok'
            },
            {
                className: 'exclamation_mark',
                begin: '!'
            },
            {
                className: 'function_or_atom',
                begin: '(\\b[a-z\'][a-zA-Z0-9_\']*:[a-z\'][a-zA-Z0-9_\']*)|(\\b[a-z\'][a-zA-Z0-9_\']*)',
                relevance: 0
            },
            {
                className: 'variable',
                begin: '[A-Z][a-zA-Z0-9_\']*',
                relevance: 0
            }
            ]
        };
    };
}, {}
],
78: [function(require, module, exports) {
    module.exports = function(hljs) {
        var BASIC_ATOM_RE = '[a-z\'][a-zA-Z0-9_\']*';
        var FUNCTION_NAME_RE = '(' + BASIC_ATOM_RE + ':' + BASIC_ATOM_RE + '|' + BASIC_ATOM_RE + ')';
        var ERLANG_RESERVED = {
            keyword:
            'after and andalso|10 band begin bnot bor bsl bzr bxor case catch cond div end fun if ' +
            'let not of orelse|10 query receive rem try when xor',
            literal:
            'false true'
        };

        var COMMENT = hljs.COMMENT('%', '$');
        var NUMBER = {
            className: 'number',
            begin: '\\b(\\d+#[a-fA-F0-9]+|\\d+(\\.\\d+)?([eE][-+]?\\d+)?)',
            relevance: 0
        };
        var NAMED_FUN = {
            begin: 'fun\\s+' + BASIC_ATOM_RE + '/\\d+'
        };
        var FUNCTION_CALL = {
            begin: FUNCTION_NAME_RE + '\\(',
            end: '\\)',
            returnBegin: true,
            relevance: 0,
            contains: [
            {
                className: 'function_name',
                begin: FUNCTION_NAME_RE,
                relevance: 0
            },
            {
                begin: '\\(',
                end: '\\)',
                endsWithParent: true,
                returnEnd: true,
                relevance: 0
                // "contains" defined later
            }
            ]
        };
        var TUPLE = {
            className: 'tuple',
            begin: '{',
            end: '}',
            relevance: 0
            // "contains" defined later
        };
        var VAR1 = {
            className: 'variable',
            begin: '\\b_([A-Z][A-Za-z0-9_]*)?',
            relevance: 0
        };
        var VAR2 = {
            className: 'variable',
            begin: '[A-Z][a-zA-Z0-9_]*',
            relevance: 0
        };
        var RECORD_ACCESS = {
            begin: '#' + hljs.UNDERSCORE_IDENT_RE,
            relevance: 0,
            returnBegin: true,
            contains: [
            {
                className: 'record_name',
                begin: '#' + hljs.UNDERSCORE_IDENT_RE,
                relevance: 0
            },
            {
                begin: '{',
                end: '}',
                relevance: 0
                // "contains" defined later
            }
            ]
        };

        var BLOCK_STATEMENTS = {
            beginKeywords: 'fun receive if try case',
            end: 'end',
            keywords: ERLANG_RESERVED
        };
        BLOCK_STATEMENTS.contains = [
        COMMENT,
        NAMED_FUN,
        hljs.inherit(hljs.APOS_STRING_MODE, {
            className: ''
        }),
        BLOCK_STATEMENTS,
        FUNCTION_CALL,
        hljs.QUOTE_STRING_MODE,
        NUMBER,
        TUPLE,
        VAR1, VAR2,
        RECORD_ACCESS
        ];

        var BASIC_MODES = [
        COMMENT,
        NAMED_FUN,
        BLOCK_STATEMENTS,
        FUNCTION_CALL,
        hljs.QUOTE_STRING_MODE,
        NUMBER,
        TUPLE,
        VAR1, VAR2,
        RECORD_ACCESS
        ];
        FUNCTION_CALL.contains[1].contains = BASIC_MODES;
        TUPLE.contains = BASIC_MODES;
        RECORD_ACCESS.contains[1].contains = BASIC_MODES;

        var PARAMS = {
            className: 'params',
            begin: '\\(',
            end: '\\)',
            contains: BASIC_MODES
        };
        return {
            aliases: ['erl'],
            keywords: ERLANG_RESERVED,
            illegal: '(</|\\*=|\\+=|-=|/\\*|\\*/|\\(\\*|\\*\\))',
            contains: [
            {
                className: 'function',
                begin: '^' + BASIC_ATOM_RE + '\\s*\\(',
                end: '->',
                returnBegin: true,
                illegal: '\\(|#|//|/\\*|\\\\|:|;',
                contains: [
                PARAMS,
                hljs.inherit(hljs.TITLE_MODE, {
                    begin: BASIC_ATOM_RE
                })
                ],
                starts: {
                    end: ';|\\.',
                    keywords: ERLANG_RESERVED,
                    contains: BASIC_MODES
                }
            },
            COMMENT,
            {
                className: 'pp',
                begin: '^-',
                end: '\\.',
                relevance: 0,
                excludeEnd: true,
                returnBegin: true,
                lexemes: '-' + hljs.IDENT_RE,
                keywords:
                '-module -record -undef -export -ifdef -ifndef -author -copyright -doc -vsn ' +
                '-import -include -include_lib -compile -define -else -endif -file -behaviour ' +
                '-behavior -spec',
                contains: [PARAMS]
            },
            NUMBER,
            hljs.QUOTE_STRING_MODE,
            RECORD_ACCESS,
            VAR1, VAR2,
            TUPLE,
            {
                begin: /\.$/
            }
            // relevance booster
            ]
        };
    };
}, {}
],
79: [function(require, module, exports) {
    module.exports = function(hljs) {
        return {
            contains: [
            {
                begin: /[^\u2401\u0001]+/,
                end: /[\u2401\u0001]/,
                excludeEnd: true,
                returnBegin: true,
                returnEnd: false,
                contains: [
                {
                    begin: /([^\u2401\u0001=]+)/,
                    end: /=([^\u2401\u0001=]+)/,
                    returnEnd: true,
                    returnBegin: false,
                    className: 'attribute'
                },
                {
                    begin: /=/,
                    end: /([\u2401\u0001])/,
                    excludeEnd: true,
                    excludeBegin: true,
                    className: 'string'
                }
                ]
            }
            ],
            case_insensitive: true
        };
    };
}, {}
],
80: [function(require, module, exports) {
    module.exports = function(hljs) {
        var PARAMS = {
            className: 'params',
            begin: '\\(',
            end: '\\)'
        };

        var F_KEYWORDS = {
            constant: '.False. .True.',
            type: 'integer real character complex logical dimension allocatable|10 parameter ' +
            'external implicit|10 none double precision assign intent optional pointer ' +
            'target in out common equivalence data',
            keyword: 'kind do while private call intrinsic where elsewhere ' +
            'type endtype endmodule endselect endinterface end enddo endif if forall endforall only contains default return stop then ' +
            'public subroutine|10 function program .and. .or. .not. .le. .eq. .ge. .gt. .lt. ' +
            'goto save else use module select case ' +
            'access blank direct exist file fmt form formatted iostat name named nextrec number opened rec recl sequential status unformatted unit ' +
            'continue format pause cycle exit ' +
            'c_null_char c_alert c_backspace c_form_feed flush wait decimal round iomsg ' +
            'synchronous nopass non_overridable pass protected volatile abstract extends import ' +
            'non_intrinsic value deferred generic final enumerator class associate bind enum ' +
            'c_int c_short c_long c_long_long c_signed_char c_size_t c_int8_t c_int16_t c_int32_t c_int64_t c_int_least8_t c_int_least16_t ' +
            'c_int_least32_t c_int_least64_t c_int_fast8_t c_int_fast16_t c_int_fast32_t c_int_fast64_t c_intmax_t C_intptr_t c_float c_double ' +
            'c_long_double c_float_complex c_double_complex c_long_double_complex c_bool c_char c_null_ptr c_null_funptr ' +
            'c_new_line c_carriage_return c_horizontal_tab c_vertical_tab iso_c_binding c_loc c_funloc c_associated  c_f_pointer ' +
            'c_ptr c_funptr iso_fortran_env character_storage_size error_unit file_storage_size input_unit iostat_end iostat_eor ' +
            'numeric_storage_size output_unit c_f_procpointer ieee_arithmetic ieee_support_underflow_control ' +
            'ieee_get_underflow_mode ieee_set_underflow_mode newunit contiguous recursive ' +
            'pad position action delim readwrite eor advance nml interface procedure namelist include sequence elemental pure',
            built_in: 'alog alog10 amax0 amax1 amin0 amin1 amod cabs ccos cexp clog csin csqrt dabs dacos dasin datan datan2 dcos dcosh ddim dexp dint ' +
            'dlog dlog10 dmax1 dmin1 dmod dnint dsign dsin dsinh dsqrt dtan dtanh float iabs idim idint idnint ifix isign max0 max1 min0 min1 sngl ' +
            'algama cdabs cdcos cdexp cdlog cdsin cdsqrt cqabs cqcos cqexp cqlog cqsin cqsqrt dcmplx dconjg derf derfc dfloat dgamma dimag dlgama ' +
            'iqint qabs qacos qasin qatan qatan2 qcmplx qconjg qcos qcosh qdim qerf qerfc qexp qgamma qimag qlgama qlog qlog10 qmax1 qmin1 qmod ' +
            'qnint qsign qsin qsinh qsqrt qtan qtanh abs acos aimag aint anint asin atan atan2 char cmplx conjg cos cosh exp ichar index int log ' +
            'log10 max min nint sign sin sinh sqrt tan tanh print write dim lge lgt lle llt mod nullify allocate deallocate ' +
            'adjustl adjustr all allocated any associated bit_size btest ceiling count cshift date_and_time digits dot_product ' +
            'eoshift epsilon exponent floor fraction huge iand ibclr ibits ibset ieor ior ishft ishftc lbound len_trim matmul ' +
            'maxexponent maxloc maxval merge minexponent minloc minval modulo mvbits nearest pack present product ' +
            'radix random_number random_seed range repeat reshape rrspacing scale scan selected_int_kind selected_real_kind ' +
            'set_exponent shape size spacing spread sum system_clock tiny transpose trim ubound unpack verify achar iachar transfer ' +
            'dble entry dprod cpu_time command_argument_count get_command get_command_argument get_environment_variable is_iostat_end ' +
            'ieee_arithmetic ieee_support_underflow_control ieee_get_underflow_mode ieee_set_underflow_mode ' +
            'is_iostat_eor move_alloc new_line selected_char_kind same_type_as extends_type_of' +
            'acosh asinh atanh bessel_j0 bessel_j1 bessel_jn bessel_y0 bessel_y1 bessel_yn erf erfc erfc_scaled gamma log_gamma hypot norm2 ' +
            'atomic_define atomic_ref execute_command_line leadz trailz storage_size merge_bits ' +
            'bge bgt ble blt dshiftl dshiftr findloc iall iany iparity image_index lcobound ucobound maskl maskr ' +
            'num_images parity popcnt poppar shifta shiftl shiftr this_image'
        };
        return {
            case_insensitive: true,
            aliases: ['f90', 'f95'],
            keywords: F_KEYWORDS,
            contains: [
            hljs.inherit(hljs.APOS_STRING_MODE, {
                className: 'string',
                relevance: 0
            }),
            hljs.inherit(hljs.QUOTE_STRING_MODE, {
                className: 'string',
                relevance: 0
            }),
            {
                className: 'function',
                beginKeywords: 'subroutine function program',
                illegal: '[${=\\n]',
                contains: [hljs.UNDERSCORE_TITLE_MODE, PARAMS]
            },
            hljs.COMMENT('!', '$', {
                relevance: 0
            }),
            {
                className: 'number',
                begin: '(?=\\b|\\+|\\-|\\.)(?=\\.\\d|\\d)(?:\\d+)?(?:\\.?\\d*)(?:[de][+-]?\\d+)?\\b\\.?',
                relevance: 0
            }
            ]
        };
    };
}, {}
],
81: [function(require, module, exports) {
    module.exports = function(hljs) {
        var TYPEPARAM = {
            begin: '<',
            end: '>',
            contains: [
            hljs.inherit(hljs.TITLE_MODE, {
                begin: /'[a-zA-Z0-9_]+/
            })
            ]
        };

        return {
            aliases: ['fs'],
            keywords:
            'abstract and as assert base begin class default delegate do done ' +
            'downcast downto elif else end exception extern false finally for ' +
            'fun function global if in inherit inline interface internal lazy let ' +
            'match member module mutable namespace new null of open or ' +
            'override private public rec return sig static struct then to ' +
            'true try type upcast use val void when while with yield',
            contains: [
            {
                // monad builder keywords (matches before non-bang kws)
                className: 'keyword',
                begin: /\b(yield|return|let|do)!/
            },
            {
                className: 'string',
                begin: '@"',
                end: '"',
                contains: [{
                    begin: '""'
                }
                ]
            },
            {
                className: 'string',
                begin: '"""',
                end: '"""'
            },
            hljs.COMMENT('\\(\\*', '\\*\\)'),
            {
                className: 'class',
                beginKeywords: 'type',
                end: '\\(|=|$',
                excludeEnd: true,
                contains: [
                hljs.UNDERSCORE_TITLE_MODE,
                TYPEPARAM
                ]
            },
            {
                className: 'annotation',
                begin: '\\[<',
                end: '>\\]',
                relevance: 10
            },
            {
                className: 'attribute',
                begin: '\\B(\'[A-Za-z])\\b',
                contains: [hljs.BACKSLASH_ESCAPE]
            },
            hljs.C_LINE_COMMENT_MODE,
            hljs.inherit(hljs.QUOTE_STRING_MODE, {
                illegal: null
            }),
            hljs.C_NUMBER_MODE
            ]
        };
    };
}, {}
],
82: [function(require, module, exports) {
    module.exports = function (hljs) {
        var KEYWORDS =
        'abort acronym acronyms alias all and assign binary card diag display else1 eps eq equation equations file files ' +
        'for1 free ge gt if inf integer le loop lt maximizing minimizing model models na ne negative no not option ' +
        'options or ord parameter parameters positive prod putpage puttl repeat sameas scalar scalars semicont semiint ' +
        'set1 sets smax smin solve sos1 sos2 sum system table then until using variable variables while1 xor yes';

        return {
            aliases: ['gms'],
            case_insensitive: true,
            keywords: KEYWORDS,
            contains: [
            {
                className: 'section',
                beginKeywords: 'sets parameters variables equations',
                end: ';',
                contains: [
                {
                    begin: '/',
                    end: '/',
                    contains: [hljs.NUMBER_MODE]
                }
                ]
            },
            {
                className: 'string',
                begin: '\\*{3}',
                end: '\\*{3}'
            },
            hljs.NUMBER_MODE,
            {
                className: 'number',
                begin: '\\$[a-zA-Z0-9]+'
            }
            ]
        };
    };
}, {}
],
83: [function(require, module, exports) {
    module.exports = function(hljs) {
        var GCODE_IDENT_RE = '[A-Z_][A-Z0-9_.]*';
        var GCODE_CLOSE_RE = '\\%';
        var GCODE_KEYWORDS = {
            literal:
            '',
            built_in:
            '',
            keyword:
            'IF DO WHILE ENDWHILE CALL ENDIF SUB ENDSUB GOTO REPEAT ENDREPEAT ' +
            'EQ LT GT NE GE LE OR XOR'
        };
        var GCODE_START = {
            className: 'preprocessor',
            begin: '([O])([0-9]+)'
        };
        var GCODE_CODE = [
        hljs.C_LINE_COMMENT_MODE,
        hljs.C_BLOCK_COMMENT_MODE,
        hljs.COMMENT(/\(/, /\)/),
        hljs.inherit(hljs.C_NUMBER_MODE, {
            begin: '([-+]?([0-9]*\\.?[0-9]+\\.?))|' + hljs.C_NUMBER_RE
        }),
        hljs.inherit(hljs.APOS_STRING_MODE, {
            illegal: null
        }),
        hljs.inherit(hljs.QUOTE_STRING_MODE, {
            illegal: null
        }),
        {
            className: 'keyword',
            begin: '([G])([0-9]+\\.?[0-9]?)'
        },
        {
            className: 'title',
            begin: '([M])([0-9]+\\.?[0-9]?)'
        },
        {
            className: 'title',
            begin: '(VC|VS|#)',
            end: '(\\d+)'
        },
        {
            className: 'title',
            begin: '(VZOFX|VZOFY|VZOFZ)'
        },
        {
            className: 'built_in',
            begin: '(ATAN|ABS|ACOS|ASIN|SIN|COS|EXP|FIX|FUP|ROUND|LN|TAN)(\\[)',
            end: '([-+]?([0-9]*\\.?[0-9]+\\.?))(\\])'
        },
        {
            className: 'label',
            variants: [
            {
                begin: 'N',
                end: '\\d+',
                illegal: '\\W'
            }
            ]
        }
        ];

        return {
            aliases: ['nc'],
            // Some implementations (CNC controls) of G-code are interoperable with uppercase and lowercase letters seamlessly.
            // However, most prefer all uppercase and uppercase is customary.
            case_insensitive: true,
            lexemes: GCODE_IDENT_RE,
            keywords: GCODE_KEYWORDS,
            contains: [
            {
                className: 'preprocessor',
                begin: GCODE_CLOSE_RE
            },
            GCODE_START
            ].concat(GCODE_CODE)
        };
    };
}, {}
],
84: [function(require, module, exports) {
    module.exports = function (hljs) {
        return {
            aliases: ['feature'],
            keywords: 'Feature Background Ability Business\ Need Scenario Scenarios Scenario\ Outline Scenario\ Template Examples Given And Then But When',
            contains: [
            {
                className: 'keyword',
                begin: '\\*'
            },
            hljs.COMMENT('@[^@\r\n\t ]+', '$'),
            {
                begin: '\\|',
                end: '\\|\\w*$',
                contains: [
                {
                    className: 'string',
                    begin: '[^|]+'
                }
                ]
            },
            {
                className: 'variable',
                begin: '<',
                end: '>'
            },
            hljs.HASH_COMMENT_MODE,
            {
                className: 'string',
                begin: '"""',
                end: '"""'
            },
            hljs.QUOTE_STRING_MODE
            ]
        };
    };
}, {}
],
85: [function(require, module, exports) {
    module.exports = function(hljs) {
        return {
            keywords: {
                keyword:
                'atomic_uint attribute bool break bvec2 bvec3 bvec4 case centroid coherent const continue default ' +
                'discard dmat2 dmat2x2 dmat2x3 dmat2x4 dmat3 dmat3x2 dmat3x3 dmat3x4 dmat4 dmat4x2 dmat4x3 ' +
                'dmat4x4 do double dvec2 dvec3 dvec4 else flat float for highp if iimage1D iimage1DArray ' +
                'iimage2D iimage2DArray iimage2DMS iimage2DMSArray iimage2DRect iimage3D iimageBuffer iimageCube ' +
                'iimageCubeArray image1D image1DArray image2D image2DArray image2DMS image2DMSArray image2DRect ' +
                'image3D imageBuffer imageCube imageCubeArray in inout int invariant isampler1D isampler1DArray ' +
                'isampler2D isampler2DArray isampler2DMS isampler2DMSArray isampler2DRect isampler3D isamplerBuffer ' +
                'isamplerCube isamplerCubeArray ivec2 ivec3 ivec4 layout lowp mat2 mat2x2 mat2x3 mat2x4 mat3 mat3x2 ' +
                'mat3x3 mat3x4 mat4 mat4x2 mat4x3 mat4x4 mediump noperspective out patch precision readonly restrict ' +
                'return sample sampler1D sampler1DArray sampler1DArrayShadow sampler1DShadow sampler2D sampler2DArray ' +
                'sampler2DArrayShadow sampler2DMS sampler2DMSArray sampler2DRect sampler2DRectShadow sampler2DShadow ' +
                'sampler3D samplerBuffer samplerCube samplerCubeArray samplerCubeArrayShadow samplerCubeShadow smooth ' +
                'struct subroutine switch uimage1D uimage1DArray uimage2D uimage2DArray uimage2DMS uimage2DMSArray ' +
                'uimage2DRect uimage3D uimageBuffer uimageCube uimageCubeArray uint uniform usampler1D usampler1DArray ' +
                'usampler2D usampler2DArray usampler2DMS usampler2DMSArray usampler2DRect usampler3D usamplerBuffer ' +
                'usamplerCube usamplerCubeArray uvec2 uvec3 uvec4 varying vec2 vec3 vec4 void volatile while writeonly',
                built_in:
                'gl_BackColor gl_BackLightModelProduct gl_BackLightProduct gl_BackMaterial ' +
                'gl_BackSecondaryColor gl_ClipDistance gl_ClipPlane gl_ClipVertex gl_Color ' +
                'gl_DepthRange gl_EyePlaneQ gl_EyePlaneR gl_EyePlaneS gl_EyePlaneT gl_Fog gl_FogCoord ' +
                'gl_FogFragCoord gl_FragColor gl_FragCoord gl_FragData gl_FragDepth gl_FrontColor ' +
                'gl_FrontFacing gl_FrontLightModelProduct gl_FrontLightProduct gl_FrontMaterial ' +
                'gl_FrontSecondaryColor gl_InstanceID gl_InvocationID gl_Layer gl_LightModel ' +
                'gl_LightSource gl_MaxAtomicCounterBindings gl_MaxAtomicCounterBufferSize ' +
                'gl_MaxClipDistances gl_MaxClipPlanes gl_MaxCombinedAtomicCounterBuffers ' +
                'gl_MaxCombinedAtomicCounters gl_MaxCombinedImageUniforms gl_MaxCombinedImageUnitsAndFragmentOutputs ' +
                'gl_MaxCombinedTextureImageUnits gl_MaxDrawBuffers gl_MaxFragmentAtomicCounterBuffers ' +
                'gl_MaxFragmentAtomicCounters gl_MaxFragmentImageUniforms gl_MaxFragmentInputComponents ' +
                'gl_MaxFragmentUniformComponents gl_MaxFragmentUniformVectors gl_MaxGeometryAtomicCounterBuffers ' +
                'gl_MaxGeometryAtomicCounters gl_MaxGeometryImageUniforms gl_MaxGeometryInputComponents ' +
                'gl_MaxGeometryOutputComponents gl_MaxGeometryOutputVertices gl_MaxGeometryTextureImageUnits ' +
                'gl_MaxGeometryTotalOutputComponents gl_MaxGeometryUniformComponents gl_MaxGeometryVaryingComponents ' +
                'gl_MaxImageSamples gl_MaxImageUnits gl_MaxLights gl_MaxPatchVertices gl_MaxProgramTexelOffset ' +
                'gl_MaxTessControlAtomicCounterBuffers gl_MaxTessControlAtomicCounters gl_MaxTessControlImageUniforms ' +
                'gl_MaxTessControlInputComponents gl_MaxTessControlOutputComponents gl_MaxTessControlTextureImageUnits ' +
                'gl_MaxTessControlTotalOutputComponents gl_MaxTessControlUniformComponents ' +
                'gl_MaxTessEvaluationAtomicCounterBuffers gl_MaxTessEvaluationAtomicCounters ' +
                'gl_MaxTessEvaluationImageUniforms gl_MaxTessEvaluationInputComponents gl_MaxTessEvaluationOutputComponents ' +
                'gl_MaxTessEvaluationTextureImageUnits gl_MaxTessEvaluationUniformComponents ' +
                'gl_MaxTessGenLevel gl_MaxTessPatchComponents gl_MaxTextureCoords gl_MaxTextureImageUnits ' +
                'gl_MaxTextureUnits gl_MaxVaryingComponents gl_MaxVaryingFloats gl_MaxVaryingVectors ' +
                'gl_MaxVertexAtomicCounterBuffers gl_MaxVertexAtomicCounters gl_MaxVertexAttribs ' +
                'gl_MaxVertexImageUniforms gl_MaxVertexOutputComponents gl_MaxVertexTextureImageUnits ' +
                'gl_MaxVertexUniformComponents gl_MaxVertexUniformVectors gl_MaxViewports gl_MinProgramTexelOffset' +
                'gl_ModelViewMatrix gl_ModelViewMatrixInverse gl_ModelViewMatrixInverseTranspose ' +
                'gl_ModelViewMatrixTranspose gl_ModelViewProjectionMatrix gl_ModelViewProjectionMatrixInverse ' +
                'gl_ModelViewProjectionMatrixInverseTranspose gl_ModelViewProjectionMatrixTranspose ' +
                'gl_MultiTexCoord0 gl_MultiTexCoord1 gl_MultiTexCoord2 gl_MultiTexCoord3 gl_MultiTexCoord4 ' +
                'gl_MultiTexCoord5 gl_MultiTexCoord6 gl_MultiTexCoord7 gl_Normal gl_NormalMatrix ' +
                'gl_NormalScale gl_ObjectPlaneQ gl_ObjectPlaneR gl_ObjectPlaneS gl_ObjectPlaneT gl_PatchVerticesIn ' +
                'gl_PerVertex gl_Point gl_PointCoord gl_PointSize gl_Position gl_PrimitiveID gl_PrimitiveIDIn ' +
                'gl_ProjectionMatrix gl_ProjectionMatrixInverse gl_ProjectionMatrixInverseTranspose ' +
                'gl_ProjectionMatrixTranspose gl_SampleID gl_SampleMask gl_SampleMaskIn gl_SamplePosition ' +
                'gl_SecondaryColor gl_TessCoord gl_TessLevelInner gl_TessLevelOuter gl_TexCoord gl_TextureEnvColor ' +
                'gl_TextureMatrixInverseTranspose gl_TextureMatrixTranspose gl_Vertex gl_VertexID ' +
                'gl_ViewportIndex gl_in gl_out EmitStreamVertex EmitVertex EndPrimitive EndStreamPrimitive ' +
                'abs acos acosh all any asin asinh atan atanh atomicCounter atomicCounterDecrement ' +
                'atomicCounterIncrement barrier bitCount bitfieldExtract bitfieldInsert bitfieldReverse ' +
                'ceil clamp cos cosh cross dFdx dFdy degrees determinant distance dot equal exp exp2 faceforward ' +
                'findLSB findMSB floatBitsToInt floatBitsToUint floor fma fract frexp ftransform fwidth greaterThan ' +
                'greaterThanEqual imageAtomicAdd imageAtomicAnd imageAtomicCompSwap imageAtomicExchange ' +
                'imageAtomicMax imageAtomicMin imageAtomicOr imageAtomicXor imageLoad imageStore imulExtended ' +
                'intBitsToFloat interpolateAtCentroid interpolateAtOffset interpolateAtSample inverse inversesqrt ' +
                'isinf isnan ldexp length lessThan lessThanEqual log log2 matrixCompMult max memoryBarrier ' +
                'min mix mod modf noise1 noise2 noise3 noise4 normalize not notEqual outerProduct packDouble2x32 ' +
                'packHalf2x16 packSnorm2x16 packSnorm4x8 packUnorm2x16 packUnorm4x8 pow radians reflect refract ' +
                'round roundEven shadow1D shadow1DLod shadow1DProj shadow1DProjLod shadow2D shadow2DLod shadow2DProj ' +
                'shadow2DProjLod sign sin sinh smoothstep sqrt step tan tanh texelFetch texelFetchOffset texture ' +
                'texture1D texture1DLod texture1DProj texture1DProjLod texture2D texture2DLod texture2DProj ' +
                'texture2DProjLod texture3D texture3DLod texture3DProj texture3DProjLod textureCube textureCubeLod ' +
                'textureGather textureGatherOffset textureGatherOffsets textureGrad textureGradOffset textureLod ' +
                'textureLodOffset textureOffset textureProj textureProjGrad textureProjGradOffset textureProjLod ' +
                'textureProjLodOffset textureProjOffset textureQueryLod textureSize transpose trunc uaddCarry ' +
                'uintBitsToFloat umulExtended unpackDouble2x32 unpackHalf2x16 unpackSnorm2x16 unpackSnorm4x8 ' +
                'unpackUnorm2x16 unpackUnorm4x8 usubBorrow gl_TextureMatrix gl_TextureMatrixInverse',
                literal: 'true false'
            },
            illegal: '"',
            contains: [
            hljs.C_LINE_COMMENT_MODE,
            hljs.C_BLOCK_COMMENT_MODE,
            hljs.C_NUMBER_MODE,
            {
                className: 'preprocessor',
                begin: '#',
                end: '$'
            }
            ]
        };
    };
}, {}
],
86: [function(require, module, exports) {
    module.exports = function(hljs) {
        var GO_KEYWORDS = {
            keyword:
            'break default func interface select case map struct chan else goto package switch ' +
            'const fallthrough if range type continue for import return var go defer',
            constant:
            'true false iota nil',
            typename:
            'bool byte complex64 complex128 float32 float64 int8 int16 int32 int64 string uint8 ' +
            'uint16 uint32 uint64 int uint uintptr rune',
            built_in:
            'append cap close complex copy imag len make new panic print println real recover delete'
        };
        return {
            aliases: ["golang"],
            keywords: GO_KEYWORDS,
            illegal: '</',
            contains: [
            hljs.C_LINE_COMMENT_MODE,
            hljs.C_BLOCK_COMMENT_MODE,
            hljs.QUOTE_STRING_MODE,
            {
                className: 'string',
                begin: '\'',
                end: '[^\\\\]\''
            },
            {
                className: 'string',
                begin: '`',
                end: '`'
            },
            {
                className: 'number',
                begin: hljs.C_NUMBER_RE + '[dflsi]?',
                relevance: 0
            },
            hljs.C_NUMBER_MODE
            ]
        };
    };
}, {}
],
87: [function(require, module, exports) {
    module.exports = function(hljs) {
        return {
            keywords: {
                keyword:
                'println readln print import module function local return let var ' +
                'while for foreach times in case when match with break continue ' +
                'augment augmentation each find filter reduce ' +
                'if then else otherwise try catch finally raise throw orIfNull',
                typename:
                'DynamicObject|10 DynamicVariable struct Observable map set vector list array',
                literal:
                'true false null'
            },
            contains: [
            hljs.HASH_COMMENT_MODE,
            hljs.QUOTE_STRING_MODE,
            hljs.C_NUMBER_MODE,
            {
                className: 'annotation',
                begin: '@[A-Za-z]+'
            }
            ]
        }
    };
}, {}
],
88: [function(require, module, exports) {
    module.exports = function(hljs) {
        return {
            case_insensitive: true,
            keywords: {
                keyword:
                'task project allprojects subprojects artifacts buildscript configurations ' +
                'dependencies repositories sourceSets description delete from into include ' +
                'exclude source classpath destinationDir includes options sourceCompatibility ' +
                'targetCompatibility group flatDir doLast doFirst flatten todir fromdir ant ' +
                'def abstract break case catch continue default do else extends final finally ' +
                'for if implements instanceof native new private protected public return static ' +
                'switch synchronized throw throws transient try volatile while strictfp package ' +
                'import false null super this true antlrtask checkstyle codenarc copy boolean ' +
                'byte char class double float int interface long short void compile runTime ' +
                'file fileTree abs any append asList asWritable call collect compareTo count ' +
                'div dump each eachByte eachFile eachLine every find findAll flatten getAt ' +
                'getErr getIn getOut getText grep immutable inject inspect intersect invokeMethods ' +
                'isCase join leftShift minus multiply newInputStream newOutputStream newPrintWriter ' +
                'newReader newWriter next plus pop power previous print println push putAt read ' +
                'readBytes readLines reverse reverseEach round size sort splitEachLine step subMap ' +
                'times toInteger toList tokenize upto waitForOrKill withPrintWriter withReader ' +
                'withStream withWriter withWriterAppend write writeLine'
            },
            contains: [
            hljs.C_LINE_COMMENT_MODE,
            hljs.C_BLOCK_COMMENT_MODE,
            hljs.APOS_STRING_MODE,
            hljs.QUOTE_STRING_MODE,
            hljs.NUMBER_MODE,
            hljs.REGEXP_MODE
            ]
        }
    };
}, {}
],
89: [function(require, module, exports) {
    module.exports = function(hljs) {
        return {
            keywords: {
                typename: 'byte short char int long boolean float double void',
                literal : 'true false null',
                keyword:
                // groovy specific keywords
                'def as in assert trait ' +
                // common keywords with Java
                'super this abstract static volatile transient public private protected synchronized final ' +
                'class interface enum if else for while switch case break default continue ' +
                'throw throws try catch finally implements extends new import package return instanceof'
            },

            contains: [
            hljs.COMMENT(
            '/\\*\\*',
            '\\*/',
            {
                relevance : 0,
                contains : [{
                    className : 'doctag',
                    begin : '@[A-Za-z]+'
                }
                ]
            }),
            hljs.C_LINE_COMMENT_MODE,
            hljs.C_BLOCK_COMMENT_MODE,
            {
                className: 'string',
                begin: '"""',
                end: '"""'
            },
            {
                className: 'string',
                begin: "'''",
                end: "'''"
            },
            {
                className: 'string',
                begin: "\\$/",
                end: "/\\$",
                relevance: 10
            },
            hljs.APOS_STRING_MODE,
            {
                className: 'regexp',
                begin: /~?\/[^\/\n]+\//,
                contains: [
                hljs.BACKSLASH_ESCAPE
                ]
            },
            hljs.QUOTE_STRING_MODE,
            {
                className: 'shebang',
                begin: "^#!/usr/bin/env",
                end: '$',
                illegal: '\n'
            },
            hljs.BINARY_NUMBER_MODE,
            {
                className: 'class',
                beginKeywords: 'class interface trait enum',
                end: '{',
                illegal: ':',
                contains: [
                {
                    beginKeywords: 'extends implements'
                },
                hljs.UNDERSCORE_TITLE_MODE,
                ]
            },
            hljs.C_NUMBER_MODE,
            {
                className: 'annotation', begin: '@[A-Za-z]+'
            },
            {
                // highlight map keys and named parameters as strings
                className: 'string', begin: /[^\?]{0}[A-Za-z0-9_$]+ *:/
            },
            {
                // catch middle element of the ternary operator
                // to avoid highlight it as a label, named parameter, or map key
                begin: /\?/, end: /\:/
            },
            {
                // highlight labeled statements
                className: 'label', begin: '^\\s*[A-Za-z0-9_$]+:',
                relevance: 0
            },
            ],
            illegal: /#/
        }
    };
}, {}
],
90: [function(require, module, exports) {
    module.exports = // TODO support filter tags like :javascript, support inline HTML
    function(hljs) {
        return {
            case_insensitive: true,
            contains: [
            {
                className: 'doctype',
                begin: '^!!!( (5|1\\.1|Strict|Frameset|Basic|Mobile|RDFa|XML\\b.*))?$',
                relevance: 10
            },
            // FIXME these comments should be allowed to span indented lines
            hljs.COMMENT(
            '^\\s*(!=#|=#|-#|/).*$',
            false,
            {
                relevance: 0
            }),
            {
                begin: '^\\s*(-|=|!=)(?!#)',
                starts: {
                    end: '\\n',
                    subLanguage: 'ruby'
                }
            },
            {
                className: 'tag',
                begin: '^\\s*%',
                contains: [
                {
                    className: 'title',
                    begin: '\\w+'
                },
                {
                    className: 'value',
                    begin: '[#\\.][\\w-]+'
                },
                {
                    begin: '{\\s*',
                    end: '\\s*}',
                    excludeEnd: true,
                    contains: [
                    {
                        //className: 'attribute',
                        begin: ':\\w+\\s*=>',
                        end: ',\\s+',
                        returnBegin: true,
                        endsWithParent: true,
                        contains: [
                        {
                            className: 'symbol',
                            begin: ':\\w+'
                        },
                        hljs.APOS_STRING_MODE,
                        hljs.QUOTE_STRING_MODE,
                        {
                            begin: '\\w+',
                            relevance: 0
                        }
                        ]
                    }
                    ]
                },
                {
                    begin: '\\(\\s*',
                    end: '\\s*\\)',
                    excludeEnd: true,
                    contains: [
                    {
                        //className: 'attribute',
                        begin: '\\w+\\s*=',
                        end: '\\s+',
                        returnBegin: true,
                        endsWithParent: true,
                        contains: [
                        {
                            className: 'attribute',
                            begin: '\\w+',
                            relevance: 0
                        },
                        hljs.APOS_STRING_MODE,
                        hljs.QUOTE_STRING_MODE,
                        {
                            begin: '\\w+',
                            relevance: 0
                        }
                        ]
                    }
                    ]
                }
                ]
            },
            {
                className: 'bullet',
                begin: '^\\s*[=~]\\s*',
                relevance: 0
            },
            {
                begin: '#{',
                starts: {
                    end: '}',
                    subLanguage: 'ruby'
                }
            }
            ]
        };
    };
}, {}
],
91: [function(require, module, exports) {
    module.exports = function(hljs) {
        var EXPRESSION_KEYWORDS = 'each in with if else unless bindattr action collection debugger log outlet template unbound view yield';
        return {
            aliases: ['hbs', 'html.hbs', 'html.handlebars'],
            case_insensitive: true,
            subLanguage: 'xml',
            contains: [
            {
                className: 'expression',
                begin: '{{',
                end: '}}',
                contains: [
                {
                    className: 'begin-block',
                    begin: '\#[a-zA-Z\-\ \.]+',
                    keywords: EXPRESSION_KEYWORDS
                },
                {
                    className: 'string',
                    begin: '"',
                    end: '"'
                },
                {
                    className: 'end-block',
                    begin: '\\\/[a-zA-Z\-\ \.]+',
                    keywords: EXPRESSION_KEYWORDS
                },
                {
                    className: 'variable',
                    begin: '[a-zA-Z\-\.]+',
                    keywords: EXPRESSION_KEYWORDS
                }
                ]
            }
            ]
        };
    };
}, {}
],
92: [function(require, module, exports) {
    module.exports = function(hljs) {
        var COMMENT_MODES = [
        hljs.COMMENT('--', '$'),
        hljs.COMMENT(
        '{-',
        '-}',
        {
            contains: ['self']
        })
        ];

        var PRAGMA = {
            className: 'pragma',
            begin: '{-#',
            end: '#-}'
        };

        var PREPROCESSOR = {
            className: 'preprocessor',
            begin: '^#',
            end: '$'
        };

        var CONSTRUCTOR = {
            className: 'type',
            begin: '\\b[A-Z][\\w\']*',
            // TODO: other constructors (build-in, infix).
            relevance: 0
        };

        var LIST = {
            className: 'container',
            begin: '\\(',
            end: '\\)',
            illegal: '"',
            contains: [
            PRAGMA,
            PREPROCESSOR,
            {
                className: 'type',
                begin: '\\b[A-Z][\\w]*(\\((\\.\\.|,|\\w+)\\))?'
            },
            hljs.inherit(hljs.TITLE_MODE, {
                begin: '[_a-z][\\w\']*'
            })
            ].concat(COMMENT_MODES)
        };

        var RECORD = {
            className: 'container',
            begin: '{',
            end: '}',
            contains: LIST.contains
        };

        return {
            aliases: ['hs'],
            keywords:
            'let in if then else case of where do module import hiding ' +
            'qualified type data newtype deriving class instance as default ' +
            'infix infixl infixr foreign export ccall stdcall cplusplus ' +
            'jvm dotnet safe unsafe family forall mdo proc rec',
            contains: [
            // Top-level constructions.

            {
                className: 'module',
                begin: '\\bmodule\\b',
                end: 'where',
                keywords: 'module where',
                contains: [LIST].concat(COMMENT_MODES),
                illegal: '\\W\\.|;'
            },
            {
                className: 'import',
                begin: '\\bimport\\b',
                end: '$',
                keywords: 'import|0 qualified as hiding',
                contains: [LIST].concat(COMMENT_MODES),
                illegal: '\\W\\.|;'
            },
            {
                className: 'class',
                begin: '^(\\s*)?(class|instance)\\b',
                end: 'where',
                keywords: 'class family instance where',
                contains: [CONSTRUCTOR, LIST].concat(COMMENT_MODES)
            },
            {
                className: 'typedef',
                begin: '\\b(data|(new)?type)\\b',
                end: '$',
                keywords: 'data family type newtype deriving',
                contains: [PRAGMA, CONSTRUCTOR, LIST, RECORD].concat(COMMENT_MODES)
            },
            {
                className: 'default',
                beginKeywords: 'default',
                end: '$',
                contains: [CONSTRUCTOR, LIST].concat(COMMENT_MODES)
            },
            {
                className: 'infix',
                beginKeywords: 'infix infixl infixr',
                end: '$',
                contains: [hljs.C_NUMBER_MODE].concat(COMMENT_MODES)
            },
            {
                className: 'foreign',
                begin: '\\bforeign\\b',
                end: '$',
                keywords: 'foreign import export ccall stdcall cplusplus jvm ' +
                'dotnet safe unsafe',
                contains: [CONSTRUCTOR, hljs.QUOTE_STRING_MODE].concat(COMMENT_MODES)
            },
            {
                className: 'shebang',
                begin: '#!\\/usr\\/bin\\/env\ runhaskell',
                end: '$'
            },
            // "Whitespaces".

            PRAGMA,
            PREPROCESSOR,
            // Literals and names.

            // TODO: characters.
            hljs.QUOTE_STRING_MODE,
            hljs.C_NUMBER_MODE,
            CONSTRUCTOR,
            hljs.inherit(hljs.TITLE_MODE, {
                begin: '^[_a-z][\\w\']*'
            }),
            {
                begin: '->|<-'
            }
            // No markup, relevance booster
            ].concat(COMMENT_MODES)
        };
    };
}, {}
],
93: [function(require, module, exports) {
    module.exports = function(hljs) {
        var IDENT_RE = '[a-zA-Z_$][a-zA-Z0-9_$]*';
        var IDENT_FUNC_RETURN_TYPE_RE = '([*]|[a-zA-Z_$][a-zA-Z0-9_$]*)';

        return {
            aliases: ['hx'],
            keywords: {
                keyword: 'break callback case cast catch class continue default do dynamic else enum extends extern ' +
                'for function here if implements import in inline interface never new override package private ' +
                'public return static super switch this throw trace try typedef untyped using var while',
                literal: 'true false null'
            },
            contains: [
            hljs.APOS_STRING_MODE,
            hljs.QUOTE_STRING_MODE,
            hljs.C_LINE_COMMENT_MODE,
            hljs.C_BLOCK_COMMENT_MODE,
            hljs.C_NUMBER_MODE,
            {
                className: 'class',
                beginKeywords: 'class interface',
                end: '{',
                excludeEnd: true,
                contains: [
                {
                    beginKeywords: 'extends implements'
                },
                hljs.TITLE_MODE
                ]
            },
            {
                className: 'preprocessor',
                begin: '#',
                end: '$',
                keywords: 'if else elseif end error'
            },
            {
                className: 'function',
                beginKeywords: 'function',
                end: '[{;]',
                excludeEnd: true,
                illegal: '\\S',
                contains: [
                hljs.TITLE_MODE,
                {
                    className: 'params',
                    begin: '\\(',
                    end: '\\)',
                    contains: [
                    hljs.APOS_STRING_MODE,
                    hljs.QUOTE_STRING_MODE,
                    hljs.C_LINE_COMMENT_MODE,
                    hljs.C_BLOCK_COMMENT_MODE
                    ]
                },
                {
                    className: 'type',
                    begin: ':',
                    end: IDENT_FUNC_RETURN_TYPE_RE,
                    relevance: 10
                }
                ]
            }
            ]
        };
    };
}, {}
],
94: [function(require, module, exports) {
    module.exports = function(hljs) {
        return {
            aliases: ['https'],
            illegal: '\\S',
            contains: [
            {
                className: 'status',
                begin: '^HTTP/[0-9\\.]+',
                end: '$',
                contains: [{
                    className: 'number',
                    begin: '\\b\\d{3}\\b'
                }
                ]
            },
            {
                className: 'request',
                begin: '^[A-Z]+ (.*?) HTTP/[0-9\\.]+$',
                returnBegin: true,
                end: '$',
                contains: [
                {
                    className: 'string',
                    begin: ' ',
                    end: ' ',
                    excludeBegin: true,
                    excludeEnd: true
                }
                ]
            },
            {
                className: 'attribute',
                begin: '^\\w',
                end: ': ',
                excludeEnd: true,
                illegal: '\\n|\\s|=',
                starts: {
                    className: 'string',
                    end: '$'
                }
            },
            {
                begin: '\\n\\n',
                starts: {
                    subLanguage: [],
                    endsWithParent: true
                }
            }
            ]
        };
    };
}, {}
],
95: [function(require, module, exports) {
    module.exports = function(hljs) {
        var START_BRACKET = '\\[';
        var END_BRACKET = '\\]';
        return {
            aliases: ['i7'],
            case_insensitive: true,
            keywords: {
                // Some keywords more or less unique to I7, for relevance.
                keyword:
                // kind:
                'thing room person man woman animal container ' +
                'supporter backdrop door ' +
                // characteristic:
                'scenery open closed locked inside gender ' +
                // verb:
                'is are say understand ' +
                // misc keyword:
                'kind of rule'
            },
            contains: [
            {
                className: 'string',
                begin: '"',
                end: '"',
                relevance: 0,
                contains: [
                {
                    className: 'subst',
                    begin: START_BRACKET,
                    end: END_BRACKET
                }
                ]
            },
            {
                className: 'title',
                begin: /^(Volume|Book|Part|Chapter|Section|Table)\b/,
                end: '$'
            },
            {
                // Rule definition
                // This is here for relevance.
                begin: /^(Check|Carry out|Report|Instead of|To|Rule|When|Before|After)\b/,
                end: ':',
                contains: [
                {
                    //Rule name
                    begin: '\\b\\(This',
                    end: '\\)'
                }
                ]
            },
            {
                className: 'comment',
                begin: START_BRACKET,
                end: END_BRACKET,
                contains: ['self']
            }
            ]
        };
    };
}, {}
],
96: [function(require, module, exports) {
    module.exports = function(hljs) {
        var STRING = {
            className: "string",
            contains: [hljs.BACKSLASH_ESCAPE],
            variants: [
            {
                begin: "'''",
                end: "'''",
                relevance: 10
            }, {
                begin: '"""',
                end: '"""',
                relevance: 10
            }, {
                begin: '"',
                end: '"'
            }, {
                begin: "'",
                end: "'"
            }
            ]
        };
        return {
            aliases: ['toml'],
            case_insensitive: true,
            illegal: /\S/,
            contains: [
            hljs.COMMENT(';', '$'),
            hljs.HASH_COMMENT_MODE,
            {
                className: 'title',
                begin: /^\s*\[+/,
                end: /\]+/
            },
            {
                className: 'setting',
                begin: /^[a-z0-9\[\]_-]+\s*=\s*/,
                end: '$',
                contains: [
                {
                    className: 'value',
                    endsWithParent: true,
                    keywords: 'on off true false yes no',
                    contains: [
                    {
                        className: 'variable',
                        variants: [
                        {
                            begin: /\$[\w\d"][\w\d_]*/
                        },
                        {
                            begin: /\$\{(.*?)}/
                        }
                        ]
                    },
                    STRING,
                    {
                        className: 'number',
                        begin: /([\+\-]+)?[\d]+_[\d_]+/
                    },
                    hljs.NUMBER_MODE
                    ],
                    relevance: 0
                }
                ]
            }
            ]
        };
    };
}, {}
],
97: [function(require, module, exports) {
    module.exports = function(hljs) {
        var PARAMS = {
            className: 'params',
            begin: '\\(',
            end: '\\)'
        };

        var F_KEYWORDS = {
            constant: '.False. .True.',
            type: 'integer real character complex logical dimension allocatable|10 parameter ' +
            'external implicit|10 none double precision assign intent optional pointer ' +
            'target in out common equivalence data',
            keyword: 'kind do while private call intrinsic where elsewhere ' +
            'type endtype endmodule endselect endinterface end enddo endif if forall endforall only contains default return stop then ' +
            'public subroutine|10 function program .and. .or. .not. .le. .eq. .ge. .gt. .lt. ' +
            'goto save else use module select case ' +
            'access blank direct exist file fmt form formatted iostat name named nextrec number opened rec recl sequential status unformatted unit ' +
            'continue format pause cycle exit ' +
            'c_null_char c_alert c_backspace c_form_feed flush wait decimal round iomsg ' +
            'synchronous nopass non_overridable pass protected volatile abstract extends import ' +
            'non_intrinsic value deferred generic final enumerator class associate bind enum ' +
            'c_int c_short c_long c_long_long c_signed_char c_size_t c_int8_t c_int16_t c_int32_t c_int64_t c_int_least8_t c_int_least16_t ' +
            'c_int_least32_t c_int_least64_t c_int_fast8_t c_int_fast16_t c_int_fast32_t c_int_fast64_t c_intmax_t C_intptr_t c_float c_double ' +
            'c_long_double c_float_complex c_double_complex c_long_double_complex c_bool c_char c_null_ptr c_null_funptr ' +
            'c_new_line c_carriage_return c_horizontal_tab c_vertical_tab iso_c_binding c_loc c_funloc c_associated  c_f_pointer ' +
            'c_ptr c_funptr iso_fortran_env character_storage_size error_unit file_storage_size input_unit iostat_end iostat_eor ' +
            'numeric_storage_size output_unit c_f_procpointer ieee_arithmetic ieee_support_underflow_control ' +
            'ieee_get_underflow_mode ieee_set_underflow_mode newunit contiguous recursive ' +
            'pad position action delim readwrite eor advance nml interface procedure namelist include sequence elemental pure ' +
            // IRPF90 special keywords
            'begin_provider &begin_provider end_provider begin_shell end_shell begin_template end_template subst assert touch ' +
            'soft_touch provide no_dep free irp_if irp_else irp_endif irp_write irp_read',
            built_in: 'alog alog10 amax0 amax1 amin0 amin1 amod cabs ccos cexp clog csin csqrt dabs dacos dasin datan datan2 dcos dcosh ddim dexp dint ' +
            'dlog dlog10 dmax1 dmin1 dmod dnint dsign dsin dsinh dsqrt dtan dtanh float iabs idim idint idnint ifix isign max0 max1 min0 min1 sngl ' +
            'algama cdabs cdcos cdexp cdlog cdsin cdsqrt cqabs cqcos cqexp cqlog cqsin cqsqrt dcmplx dconjg derf derfc dfloat dgamma dimag dlgama ' +
            'iqint qabs qacos qasin qatan qatan2 qcmplx qconjg qcos qcosh qdim qerf qerfc qexp qgamma qimag qlgama qlog qlog10 qmax1 qmin1 qmod ' +
            'qnint qsign qsin qsinh qsqrt qtan qtanh abs acos aimag aint anint asin atan atan2 char cmplx conjg cos cosh exp ichar index int log ' +
            'log10 max min nint sign sin sinh sqrt tan tanh print write dim lge lgt lle llt mod nullify allocate deallocate ' +
            'adjustl adjustr all allocated any associated bit_size btest ceiling count cshift date_and_time digits dot_product ' +
            'eoshift epsilon exponent floor fraction huge iand ibclr ibits ibset ieor ior ishft ishftc lbound len_trim matmul ' +
            'maxexponent maxloc maxval merge minexponent minloc minval modulo mvbits nearest pack present product ' +
            'radix random_number random_seed range repeat reshape rrspacing scale scan selected_int_kind selected_real_kind ' +
            'set_exponent shape size spacing spread sum system_clock tiny transpose trim ubound unpack verify achar iachar transfer ' +
            'dble entry dprod cpu_time command_argument_count get_command get_command_argument get_environment_variable is_iostat_end ' +
            'ieee_arithmetic ieee_support_underflow_control ieee_get_underflow_mode ieee_set_underflow_mode ' +
            'is_iostat_eor move_alloc new_line selected_char_kind same_type_as extends_type_of' +
            'acosh asinh atanh bessel_j0 bessel_j1 bessel_jn bessel_y0 bessel_y1 bessel_yn erf erfc erfc_scaled gamma log_gamma hypot norm2 ' +
            'atomic_define atomic_ref execute_command_line leadz trailz storage_size merge_bits ' +
            'bge bgt ble blt dshiftl dshiftr findloc iall iany iparity image_index lcobound ucobound maskl maskr ' +
            'num_images parity popcnt poppar shifta shiftl shiftr this_image ' +
            // IRPF90 special built_ins
            'IRP_ALIGN irp_here'
        };
        return {
            case_insensitive: true,
            keywords: F_KEYWORDS,
            contains: [
            hljs.inherit(hljs.APOS_STRING_MODE, {
                className: 'string',
                relevance: 0
            }),
            hljs.inherit(hljs.QUOTE_STRING_MODE, {
                className: 'string',
                relevance: 0
            }),
            {
                className: 'function',
                beginKeywords: 'subroutine function program',
                illegal: '[${=\\n]',
                contains: [hljs.UNDERSCORE_TITLE_MODE, PARAMS]
            },
            hljs.COMMENT('!', '$', {
                relevance: 0
            }),
            hljs.COMMENT('begin_doc', 'end_doc', {
                relevance: 10
            }),
            {
                className: 'number',
                begin: '(?=\\b|\\+|\\-|\\.)(?=\\.\\d|\\d)(?:\\d+)?(?:\\.?\\d*)(?:[de][+-]?\\d+)?\\b\\.?',
                relevance: 0
            }
            ]
        };
    };
}, {}
],
98: [function(require, module, exports) {
    module.exports = function(hljs) {
        var GENERIC_IDENT_RE = hljs.UNDERSCORE_IDENT_RE + '(<' + hljs.UNDERSCORE_IDENT_RE + '>)?';
        var KEYWORDS =
        'false synchronized int abstract float private char boolean static null if const ' +
        'for true while long strictfp finally protected import native final void ' +
        'enum else break transient catch instanceof byte super volatile case assert short ' +
        'package default double public try this switch continue throws protected public private';

        // https://docs.oracle.com/javase/7/docs/technotes/guides/language/underscores-literals.html
        var JAVA_NUMBER_RE = '\\b' +
        '(' +
        '0[bB]([01]+[01_]+[01]+|[01]+)' + // 0b...
        '|' +
        '0[xX]([a-fA-F0-9]+[a-fA-F0-9_]+[a-fA-F0-9]+|[a-fA-F0-9]+)' + // 0x...
        '|' +
        '(' +
        '([\\d]+[\\d_]+[\\d]+|[\\d]+)(\\.([\\d]+[\\d_]+[\\d]+|[\\d]+))?' +
        '|' +
        '\\.([\\d]+[\\d_]+[\\d]+|[\\d]+)' +
        ')' +
        '([eE][-+]?\\d+)?' + // octal, decimal, float
        ')' +
        '[lLfF]?';
        var JAVA_NUMBER_MODE = {
            className: 'number',
            begin: JAVA_NUMBER_RE,
            relevance: 0
        };

        return {
            aliases: ['jsp'],
            keywords: KEYWORDS,
            illegal: /<\/|#/,
            contains: [
            hljs.COMMENT(
            '/\\*\\*',
            '\\*/',
            {
                relevance : 0,
                contains : [{
                    className : 'doctag',
                    begin : '@[A-Za-z]+'
                }
                ]
            }),
            hljs.C_LINE_COMMENT_MODE,
            hljs.C_BLOCK_COMMENT_MODE,
            hljs.APOS_STRING_MODE,
            hljs.QUOTE_STRING_MODE,
            {
                className: 'class',
                beginKeywords: 'class interface',
                end: /[{;=]/,
                excludeEnd: true,
                keywords: 'class interface',
                illegal: /[:"\[\]]/,
                contains: [
                {
                    beginKeywords: 'extends implements'
                },
                hljs.UNDERSCORE_TITLE_MODE
                ]
            },
            {
                // Expression keywords prevent 'keyword Name(...)' from being
                // recognized as a function definition
                beginKeywords: 'new throw return else',
                relevance: 0
            },
            {
                className: 'function',
                begin: '(' + GENERIC_IDENT_RE + '\\s+)+' + hljs.UNDERSCORE_IDENT_RE + '\\s*\\(',
                returnBegin: true,
                end: /[{;=]/,
                excludeEnd: true,
                keywords: KEYWORDS,
                contains: [
                {
                    begin: hljs.UNDERSCORE_IDENT_RE + '\\s*\\(',
                    returnBegin: true,
                    relevance: 0,
                    contains: [hljs.UNDERSCORE_TITLE_MODE]
                },
                {
                    className: 'params',
                    begin: /\(/,
                    end: /\)/,
                    keywords: KEYWORDS,
                    relevance: 0,
                    contains: [
                    hljs.APOS_STRING_MODE,
                    hljs.QUOTE_STRING_MODE,
                    hljs.C_NUMBER_MODE,
                    hljs.C_BLOCK_COMMENT_MODE
                    ]
                },
                hljs.C_LINE_COMMENT_MODE,
                hljs.C_BLOCK_COMMENT_MODE
                ]
            },
            JAVA_NUMBER_MODE,
            {
                className: 'annotation',
                begin: '@[A-Za-z]+'
            }
            ]
        };
    };
}, {}
],
99: [function(require, module, exports) {
    module.exports = function(hljs) {
        return {
            aliases: ['js'],
            keywords: {
                keyword:
                'in of if for while finally var new function do return void else break catch ' +
                'instanceof with throw case default try this switch continue typeof delete ' +
                'let yield const export super debugger as async await',
                literal:
                'true false null undefined NaN Infinity',
                built_in:
                'eval isFinite isNaN parseFloat parseInt decodeURI decodeURIComponent ' +
                'encodeURI encodeURIComponent escape unescape Object Function Boolean Error ' +
                'EvalError InternalError RangeError ReferenceError StopIteration SyntaxError ' +
                'TypeError URIError Number Math Date String RegExp Array Float32Array ' +
                'Float64Array Int16Array Int32Array Int8Array Uint16Array Uint32Array ' +
                'Uint8Array Uint8ClampedArray ArrayBuffer DataView JSON Intl arguments require ' +
                'module console window document Symbol Set Map WeakSet WeakMap Proxy Reflect ' +
                'Promise'
            },
            contains: [
            {
                className: 'pi',
                relevance: 10,
                begin: /^\s*['"]use (strict|asm)['"]/
            },
            hljs.APOS_STRING_MODE,
            hljs.QUOTE_STRING_MODE,
            {
                // template string
                className: 'string',
                begin: '`',
                end: '`',
                contains: [
                hljs.BACKSLASH_ESCAPE,
                {
                    className: 'subst',
                    begin: '\\$\\{',
                    end: '\\}'
                }
                ]
            },
            hljs.C_LINE_COMMENT_MODE,
            hljs.C_BLOCK_COMMENT_MODE,
            {
                className: 'number',
                variants: [
                {
                    begin: '\\b(0[bB][01]+)'
                },
                {
                    begin: '\\b(0[oO][0-7]+)'
                },
                {
                    begin: hljs.C_NUMBER_RE
                }
                ],
                relevance: 0
            },
            {
                // "value" container
                begin: '(' + hljs.RE_STARTERS_RE + '|\\b(case|return|throw)\\b)\\s*',
                keywords: 'return throw case',
                contains: [
                hljs.C_LINE_COMMENT_MODE,
                hljs.C_BLOCK_COMMENT_MODE,
                hljs.REGEXP_MODE,
                {
                    // E4X / JSX
                    begin: /</,
                    end: />\s*[);\]]/,
                    relevance: 0,
                    subLanguage: 'xml'
                }
                ],
                relevance: 0
            },
            {
                className: 'function',
                beginKeywords: 'function',
                end: /\{/,
                excludeEnd: true,
                contains: [
                hljs.inherit(hljs.TITLE_MODE, {
                    begin: /[A-Za-z$_][0-9A-Za-z$_]*/
                }),
                {
                    className: 'params',
                    begin: /\(/,
                    end: /\)/,
                    excludeBegin: true,
                    excludeEnd: true,
                    contains: [
                    hljs.C_LINE_COMMENT_MODE,
                    hljs.C_BLOCK_COMMENT_MODE
                    ]
                }
                ],
                illegal: /\[|%/
            },
            {
                begin: /\$[(.]/ // relevance booster for a pattern common to JS libs: `$(something)` and `$.something`
            },
            {
                begin: '\\.' + hljs.IDENT_RE,
                relevance: 0 // hack: prevents detection of keywords after dots
            },
            // ECMAScript 6 modules import
            {
                beginKeywords: 'import',
                end: '[;$]',
                keywords: 'import from as',
                contains: [
                hljs.APOS_STRING_MODE,
                hljs.QUOTE_STRING_MODE
                ]
            },
            {
                // ES6 class
                className: 'class',
                beginKeywords: 'class',
                end: /[{;=]/,
                excludeEnd: true,
                illegal: /[:"\[\]]/,
                contains: [
                {
                    beginKeywords: 'extends'
                },
                hljs.UNDERSCORE_TITLE_MODE
                ]
            }
            ],
            illegal: /#/
        };
    };
}, {}
],
100: [function(require, module, exports) {
    module.exports = function(hljs) {
        var LITERALS = {
            literal: 'true false null'
        };
        var TYPES = [
        hljs.QUOTE_STRING_MODE,
        hljs.C_NUMBER_MODE
        ];
        var VALUE_CONTAINER = {
            className: 'value',
            end: ',',
            endsWithParent: true,
            excludeEnd: true,
            contains: TYPES,
            keywords: LITERALS
        };
        var OBJECT = {
            begin: '{',
            end: '}',
            contains: [
            {
                className: 'attribute',
                begin: '\\s*"',
                end: '"\\s*:\\s*',
                excludeBegin: true,
                excludeEnd: true,
                contains: [hljs.BACKSLASH_ESCAPE],
                illegal: '\\n',
                starts: VALUE_CONTAINER
            }
            ],
            illegal: '\\S'
        };
        var ARRAY = {
            begin: '\\[',
            end: '\\]',
            contains: [hljs.inherit(VALUE_CONTAINER, {
                className: null
            })],
            // inherit is also a workaround for a bug that makes shared modes with endsWithParent compile only the ending of one of the parents
            illegal: '\\S'
        };
        TYPES.splice(TYPES.length, 0, OBJECT, ARRAY);
        return {
            contains: TYPES,
            keywords: LITERALS,
            illegal: '\\S'
        };
    };
}, {}
],
101: [function(require, module, exports) {
    module.exports = function(hljs) {
        // Since there are numerous special names in Julia, it is too much trouble
        // to maintain them by hand. Hence these names (i.e. keywords, literals and
        // built-ins) are automatically generated from Julia (v0.3.0) itself through
        // following scripts for each.

        var KEYWORDS = {
            // # keyword generator
            // println("\"in\",")
            // for kw in Base.REPLCompletions.complete_keyword("")
            //     println("\"$kw\",")
            // end
            keyword:
            'in abstract baremodule begin bitstype break catch ccall const continue do else elseif end export ' +
            'finally for function global if immutable import importall let local macro module quote return try type ' +
            'typealias using while',

            // # literal generator
            // println("\"true\",\n\"false\"")
            // for name in Base.REPLCompletions.completions("", 0)[1]
            //     try
            //         s = symbol(name)
            //         v = eval(s)
            //         if !isa(v, Function) &&
            //            !isa(v, DataType) &&
            //            !issubtype(typeof(v), Tuple) &&
            //            !isa(v, UnionType) &&
            //            !isa(v, Module) &&
            //            !isa(v, TypeConstructor) &&
            //            !isa(v, Colon)
            //             println("\"$name\",")
            //         end
            //     end
            // end
            literal:
            'true false ANY ARGS CPU_CORES C_NULL DL_LOAD_PATH DevNull ENDIAN_BOM ENV I|0 Inf Inf16 Inf32 ' +
            'InsertionSort JULIA_HOME LOAD_PATH MS_ASYNC MS_INVALIDATE MS_SYNC MergeSort NaN NaN16 NaN32 OS_NAME QuickSort ' +
            'RTLD_DEEPBIND RTLD_FIRST RTLD_GLOBAL RTLD_LAZY RTLD_LOCAL RTLD_NODELETE RTLD_NOLOAD RTLD_NOW RoundDown ' +
            'RoundFromZero RoundNearest RoundToZero RoundUp STDERR STDIN STDOUT VERSION WORD_SIZE catalan cglobal e|0 eu|0 ' +
            'eulergamma golden im nothing pi γ π φ',

            // # built_in generator:
            // for name in Base.REPLCompletions.completions("", 0)[1]
            //     try
            //         v = eval(symbol(name))
            //         if isa(v, DataType)
            //             println("\"$name\",")
            //         end
            //     end
            // end
            built_in:
            'ASCIIString AbstractArray AbstractRNG AbstractSparseArray Any ArgumentError Array Associative Base64Pipe ' +
            'Bidiagonal BigFloat BigInt BitArray BitMatrix BitVector Bool BoundsError Box CFILE Cchar Cdouble Cfloat Char ' +
            'CharString Cint Clong Clonglong ClusterManager Cmd Coff_t Colon Complex Complex128 Complex32 Complex64 ' +
            'Condition Cptrdiff_t Cshort Csize_t Cssize_t Cuchar Cuint Culong Culonglong Cushort Cwchar_t DArray DataType ' +
            'DenseArray Diagonal Dict DimensionMismatch DirectIndexString Display DivideError DomainError EOFError ' +
            'EachLine Enumerate ErrorException Exception Expr Factorization FileMonitor FileOffset Filter Float16 Float32 ' +
            'Float64 FloatRange FloatingPoint Function GetfieldNode GotoNode Hermitian IO IOBuffer IOStream IPv4 IPv6 ' +
            'InexactError Int Int128 Int16 Int32 Int64 Int8 IntSet Integer InterruptException IntrinsicFunction KeyError ' +
            'LabelNode LambdaStaticData LineNumberNode LoadError LocalProcess MIME MathConst MemoryError MersenneTwister ' +
            'Method MethodError MethodTable Module NTuple NewvarNode Nothing Number ObjectIdDict OrdinalRange ' +
            'OverflowError ParseError PollingFileWatcher ProcessExitedException ProcessGroup Ptr QuoteNode Range Range1 ' +
            'Ranges Rational RawFD Real Regex RegexMatch RemoteRef RepString RevString RopeString RoundingMode Set ' +
            'SharedArray Signed SparseMatrixCSC StackOverflowError Stat StatStruct StepRange String SubArray SubString ' +
            'SymTridiagonal Symbol SymbolNode Symmetric SystemError Task TextDisplay Timer TmStruct TopNode Triangular ' +
            'Tridiagonal Type TypeConstructor TypeError TypeName TypeVar UTF16String UTF32String UTF8String UdpSocket ' +
            'Uint Uint128 Uint16 Uint32 Uint64 Uint8 UndefRefError UndefVarError UniformScaling UnionType UnitRange ' +
            'Unsigned Vararg VersionNumber WString WeakKeyDict WeakRef Woodbury Zip'
        };

        // ref: http://julia.readthedocs.org/en/latest/manual/variables/#allowed-variable-names
        var VARIABLE_NAME_RE = "[A-Za-z_\\u00A1-\\uFFFF][A-Za-z_0-9\\u00A1-\\uFFFF]*";

        // placeholder for recursive self-reference
        var DEFAULT = {
            lexemes: VARIABLE_NAME_RE,
            keywords: KEYWORDS
        };

        var TYPE_ANNOTATION = {
            className: "type-annotation",
            begin: /::/
        };

        var SUBTYPE = {
            className: "subtype",
            begin: /<:/
        };

        // ref: http://julia.readthedocs.org/en/latest/manual/integers-and-floating-point-numbers/
        var NUMBER = {
            className: "number",
            // supported numeric literals:
            //  * binary literal (e.g. 0x10)
            //  * octal literal (e.g. 0o76543210)
            //  * hexadecimal literal (e.g. 0xfedcba876543210)
            //  * hexadecimal floating point literal (e.g. 0x1p0, 0x1.2p2)
            //  * decimal literal (e.g. 9876543210, 100_000_000)
            //  * floating pointe literal (e.g. 1.2, 1.2f, .2, 1., 1.2e10, 1.2e-10)
            begin: /(\b0x[\d_]*(\.[\d_]*)?|0x\.\d[\d_]*)p[-+]?\d+|\b0[box][a-fA-F0-9][a-fA-F0-9_]*|(\b\d[\d_]*(\.[\d_]*)?|\.\d[\d_]*)([eEfF][-+]?\d+)?/,
            relevance: 0
        };

        var CHAR = {
            className: "char",
            begin: /'(.|\\[xXuU][a-zA-Z0-9]+)'/
        };

        var INTERPOLATION = {
            className: 'subst',
            begin: /\$\(/,
            end: /\)/,
            keywords: KEYWORDS
        };

        var INTERPOLATED_VARIABLE = {
            className: 'variable',
            begin: "\\$" + VARIABLE_NAME_RE
        };

        // TODO: neatly escape normal code in string literal
        var STRING = {
            className: "string",
            contains: [hljs.BACKSLASH_ESCAPE, INTERPOLATION, INTERPOLATED_VARIABLE],
            variants: [
            {
                begin: /\w*"/,
                end: /"\w*/
            },
            {
                begin: /\w*"""/,
                end: /"""\w*/
            }
            ]
        };

        var COMMAND = {
            className: "string",
            contains: [hljs.BACKSLASH_ESCAPE, INTERPOLATION, INTERPOLATED_VARIABLE],
            begin: '`',
            end: '`'
        };

        var MACROCALL = {
            className: "macrocall",
            begin: "@" + VARIABLE_NAME_RE
        };

        var COMMENT = {
            className: "comment",
            variants: [
            {
                begin: "#=",
                end: "=#",
                relevance: 10
            },
            {
                begin: '#',
                end: '$'
            }
            ]
        };

        DEFAULT.contains = [
        NUMBER,
        CHAR,
        TYPE_ANNOTATION,
        SUBTYPE,
        STRING,
        COMMAND,
        MACROCALL,
        COMMENT,
        hljs.HASH_COMMENT_MODE
        ];
        INTERPOLATION.contains = DEFAULT.contains;

        return DEFAULT;
    };
}, {}
],
102: [function(require, module, exports) {
    module.exports = function (hljs) {
        var KEYWORDS = 'val var get set class trait object public open private protected ' +
        'final enum if else do while for when break continue throw try catch finally ' +
        'import package is as in return fun override default companion reified inline volatile transient native';

        return {
            keywords: {
                typename: 'Byte Short Char Int Long Boolean Float Double Void Unit Nothing',
                literal: 'true false null',
                keyword: KEYWORDS
            },
            contains : [
            hljs.COMMENT(
            '/\\*\\*',
            '\\*/',
            {
                relevance : 0,
                contains : [{
                    className : 'doctag',
                    begin : '@[A-Za-z]+'
                }
                ]
            }),
            hljs.C_LINE_COMMENT_MODE,
            hljs.C_BLOCK_COMMENT_MODE,
            {
                className: 'type',
                begin: /</,
                end: />/,
                returnBegin: true,
                excludeEnd: false,
                relevance: 0
            },
            {
                className: 'function',
                beginKeywords: 'fun',
                end: '[(]|$',
                returnBegin: true,
                excludeEnd: true,
                keywords: KEYWORDS,
                illegal: /fun\s+(<.*>)?[^\s\(]+(\s+[^\s\(]+)\s*=/,
                relevance: 5,
                contains: [
                {
                    begin: hljs.UNDERSCORE_IDENT_RE + '\\s*\\(',
                    returnBegin: true,
                    relevance: 0,
                    contains: [hljs.UNDERSCORE_TITLE_MODE]
                },
                {
                    className: 'type',
                    begin: /</,
                    end: />/,
                    keywords: 'reified',
                    relevance: 0
                },
                {
                    className: 'params',
                    begin: /\(/,
                    end: /\)/,
                    keywords: KEYWORDS,
                    relevance: 0,
                    illegal: /\([^\(,\s:]+,/,
                    contains: [
                    {
                        className: 'typename',
                        begin: /:\s*/,
                        end: /\s*[=\)]/,
                        excludeBegin: true,
                        returnEnd: true,
                        relevance: 0
                    }
                    ]
                },
                hljs.C_LINE_COMMENT_MODE,
                hljs.C_BLOCK_COMMENT_MODE
                ]
            },
            {
                className: 'class',
                beginKeywords: 'class trait',
                end: /[:\{(]|$/,
                excludeEnd: true,
                illegal: 'extends implements',
                contains: [
                hljs.UNDERSCORE_TITLE_MODE,
                {
                    className: 'type',
                    begin: /</,
                    end: />/,
                    excludeBegin: true,
                    excludeEnd: true,
                    relevance: 0
                },
                {
                    className: 'typename',
                    begin: /[,:]\s*/,
                    end: /[<\(,]|$/,
                    excludeBegin: true,
                    returnEnd: true
                }
                ]
            },
            {
                className: 'variable',
                beginKeywords: 'var val',
                end: /\s*[=:$]/,
                excludeEnd: true
            },
            hljs.QUOTE_STRING_MODE,
            {
                className: 'shebang',
                begin: "^#!/usr/bin/env",
                end: '$',
                illegal: '\n'
            },
            hljs.C_NUMBER_MODE
            ]
        };
    };
}, {}
],
103: [function(require, module, exports) {
    module.exports = function(hljs) {
        var LASSO_IDENT_RE = '[a-zA-Z_][a-zA-Z0-9_.]*';
        var LASSO_ANGLE_RE = '<\\?(lasso(script)?|=)';
        var LASSO_CLOSE_RE = '\\]|\\?>';
        var LASSO_KEYWORDS = {
            literal:
            'true false none minimal full all void ' +
            'bw nbw ew new cn ncn lt lte gt gte eq neq rx nrx ft',
            built_in:
            'array date decimal duration integer map pair string tag xml null ' +
            'boolean bytes keyword list locale queue set stack staticarray ' +
            'local var variable global data self inherited currentcapture givenblock',
            keyword:
            'error_code error_msg error_pop error_push error_reset cache ' +
            'database_names database_schemanames database_tablenames define_tag ' +
            'define_type email_batch encode_set html_comment handle handle_error ' +
            'header if inline iterate ljax_target link link_currentaction ' +
            'link_currentgroup link_currentrecord link_detail link_firstgroup ' +
            'link_firstrecord link_lastgroup link_lastrecord link_nextgroup ' +
            'link_nextrecord link_prevgroup link_prevrecord log loop ' +
            'namespace_using output_none portal private protect records referer ' +
            'referrer repeating resultset rows search_args search_arguments ' +
            'select sort_args sort_arguments thread_atomic value_list while ' +
            'abort case else if_empty if_false if_null if_true loop_abort ' +
            'loop_continue loop_count params params_up return return_value ' +
            'run_children soap_definetag soap_lastrequest soap_lastresponse ' +
            'tag_name ascending average by define descending do equals ' +
            'frozen group handle_failure import in into join let match max ' +
            'min on order parent protected provide public require returnhome ' +
            'skip split_thread sum take thread to trait type where with ' +
            'yield yieldhome'
        };
        var HTML_COMMENT = hljs.COMMENT(
        '<!--',
        '-->',
        {
            relevance: 0
        });
        var LASSO_NOPROCESS = {
            className: 'preprocessor',
            begin: '\\[noprocess\\]',
            starts: {
                className: 'markup',
                end: '\\[/noprocess\\]',
                returnEnd: true,
                contains: [HTML_COMMENT]
            }
        };
        var LASSO_START = {
            className: 'preprocessor',
            begin: '\\[/noprocess|' + LASSO_ANGLE_RE
        };
        var LASSO_DATAMEMBER = {
            className: 'variable',
            begin: '\'' + LASSO_IDENT_RE + '\''
        };
        var LASSO_CODE = [
        hljs.COMMENT(
        '/\\*\\*!',
        '\\*/'
        ),
        hljs.C_LINE_COMMENT_MODE,
        hljs.C_BLOCK_COMMENT_MODE,
        hljs.inherit(hljs.C_NUMBER_MODE, {
            begin: hljs.C_NUMBER_RE + '|(infinity|nan)\\b'
        }),
        hljs.inherit(hljs.APOS_STRING_MODE, {
            illegal: null
        }),
        hljs.inherit(hljs.QUOTE_STRING_MODE, {
            illegal: null
        }),
        {
            className: 'string',
            begin: '`',
            end: '`'
        },
        {
            className: 'variable',
            variants: [
            {
                begin: '[#$]' + LASSO_IDENT_RE
            },
            {
                begin: '#',
                end: '\\d+',
                illegal: '\\W'
            }
            ]
        },
        {
            className: 'tag',
            begin: '::\\s*',
            end: LASSO_IDENT_RE,
            illegal: '\\W'
        },
        {
            className: 'attribute',
            variants: [
            {
                begin: '-(?!infinity)' + hljs.UNDERSCORE_IDENT_RE,
                relevance: 0
            },
            {
                begin: '(\\.\\.\\.)'
            }
            ]
        },
        {
            className: 'subst',
            variants: [
            {
                begin: '->\\s*',
                contains: [LASSO_DATAMEMBER]
            },
            {
                begin: '->|\\\\|&&?|\\|\\||!(?!=|>)|(and|or|not)\\b',
                relevance: 0
            }
            ]
        },
        {
            className: 'built_in',
            begin: '\\.\\.?\\s*',
            relevance: 0,
            contains: [LASSO_DATAMEMBER]
        },
        {
            className: 'class',
            beginKeywords: 'define',
            returnEnd: true,
            end: '\\(|=>',
            contains: [
            hljs.inherit(hljs.TITLE_MODE, {
                begin: hljs.UNDERSCORE_IDENT_RE + '(=(?!>))?'
            })
            ]
        }
        ];
        return {
            aliases: ['ls', 'lassoscript'],
            case_insensitive: true,
            lexemes: LASSO_IDENT_RE + '|&[lg]t;',
            keywords: LASSO_KEYWORDS,
            contains: [
            {
                className: 'preprocessor',
                begin: LASSO_CLOSE_RE,
                relevance: 0,
                starts: {
                    className: 'markup',
                    end: '\\[|' + LASSO_ANGLE_RE,
                    returnEnd: true,
                    relevance: 0,
                    contains: [HTML_COMMENT]
                }
            },
            LASSO_NOPROCESS,
            LASSO_START,
            {
                className: 'preprocessor',
                begin: '\\[no_square_brackets',
                starts: {
                    end: '\\[/no_square_brackets\\]',
                    // not implemented in the language
                    lexemes: LASSO_IDENT_RE + '|&[lg]t;',
                    keywords: LASSO_KEYWORDS,
                    contains: [
                    {
                        className: 'preprocessor',
                        begin: LASSO_CLOSE_RE,
                        relevance: 0,
                        starts: {
                            className: 'markup',
                            end: '\\[noprocess\\]|' + LASSO_ANGLE_RE,
                            returnEnd: true,
                            contains: [HTML_COMMENT]
                        }
                    },
                    LASSO_NOPROCESS,
                    LASSO_START
                    ].concat(LASSO_CODE)
                }
            },
            {
                className: 'preprocessor',
                begin: '\\[',
                relevance: 0
            },
            {
                className: 'shebang',
                begin: '^#!.+lasso9\\b',
                relevance: 10
            }
            ].concat(LASSO_CODE)
        };
    };
}, {}
],
104: [function(require, module, exports) {
    module.exports = function(hljs) {
        var IDENT_RE = '[\\w-]+'; // yes, Less identifiers may begin with a digit
        var INTERP_IDENT_RE = '(' + IDENT_RE + '|@{' + IDENT_RE + '})';

        /* Generic Modes */

        var RULES = [], VALUE = []; // forward def. for recursive modes

        var STRING_MODE = function(c) {
            return {
                // Less strings are not multiline (also include '~' for more consistent coloring of "escaped" strings)
                className: 'string',
                begin: '~?' + c + '.*?' + c
            };
        };

        var IDENT_MODE = function(name, begin, relevance) {
            return {
                className: name,
                begin: begin,
                relevance: relevance
            };
        };

        var FUNCT_MODE = function(name, ident, obj) {
            return hljs.inherit({
                className: name,
                begin: ident + '\\(',
                end: '\\(',
                returnBegin: true,
                excludeEnd: true,
                relevance: 0
            }, obj);
        };

        var PARENS_MODE = {
            // used only to properly balance nested parens inside mixin call, def. arg list
            begin: '\\(',
            end: '\\)',
            contains: VALUE,
            relevance: 0
        };

        // generic Less highlighter (used almost everywhere except selectors):
        VALUE.push(
        hljs.C_LINE_COMMENT_MODE,
        hljs.C_BLOCK_COMMENT_MODE,
        STRING_MODE("'"),
        STRING_MODE('"'),
        hljs.CSS_NUMBER_MODE, // fixme: it does not include dot for numbers like .5em :(
        IDENT_MODE('hexcolor', '#[0-9A-Fa-f]+\\b'),
        FUNCT_MODE('function', '(url|data-uri)', {
            starts: {
                className: 'string',
                end: '[\\)\\n]',
                excludeEnd: true
            }
        }),
        FUNCT_MODE('function', IDENT_RE),
        PARENS_MODE,
        IDENT_MODE('variable', '@@?' + IDENT_RE, 10),
        IDENT_MODE('variable', '@{' + IDENT_RE + '}'),
        IDENT_MODE('built_in', '~?`[^`]*?`'), // inline javascript (or whatever host language) *multiline* string
        {
            // @media features (it’s here to not duplicate things in AT_RULE_MODE with extra PARENS_MODE overriding):
            className: 'attribute',
            begin: IDENT_RE + '\\s*:',
            end: ':',
            returnBegin: true,
            excludeEnd: true
        });

        var VALUE_WITH_RULESETS = VALUE.concat({
            begin: '{',
            end: '}',
            contains: RULES
        });

        var MIXIN_GUARD_MODE = {
            beginKeywords: 'when',
            endsWithParent: true,
            contains: [{
                beginKeywords: 'and not'
            }
            ].concat(VALUE) // using this form to override VALUE’s 'function' match
        };

        /* Rule-Level Modes */

        var RULE_MODE = {
            className: 'attribute',
            begin: INTERP_IDENT_RE,
            end: ':',
            excludeEnd: true,
            contains: [hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE],
            illegal: /\S/,
            starts: {
                end: '[;}]',
                returnEnd: true,
                contains: VALUE,
                illegal: '[<=$]'
            }
        };

        var AT_RULE_MODE = {
            className: 'at_rule',
            // highlight only at-rule keyword
            begin: '@(import|media|charset|font-face|(-[a-z]+-)?keyframes|supports|document|namespace|page|viewport|host)\\b',
            starts: {
                end: '[;{}]',
                returnEnd: true,
                contains: VALUE,
                relevance: 0
            }
        };

        // variable definitions and calls
        var VAR_RULE_MODE = {
            className: 'variable',
            variants: [
            // using more strict pattern for higher relevance to increase chances of Less detection.
            // this is *the only* Less specific statement used in most of the sources, so...
            // (we’ll still often loose to the css-parser unless there's '//' comment,
            // simply because 1 variable just can't beat 99 properties :)
            {
                begin: '@' + IDENT_RE + '\\s*:',
                relevance: 15
            },
            {
                begin: '@' + IDENT_RE
            }
            ],
            starts: {
                end: '[;}]',
                returnEnd: true,
                contains: VALUE_WITH_RULESETS
            }
        };

        var SELECTOR_MODE = {
            // first parse unambiguous selectors (i.e. those not starting with tag)
            // then fall into the scary lookahead-discriminator variant.
            // this mode also handles mixin definitions and calls
            variants: [{
                begin: '[\\.#:&\\[]',
                end: '[;{}]' // mixin calls end with ';'
            }, {
                begin: INTERP_IDENT_RE + '[^;]*{',
                end: '{'
            }
            ],
            returnBegin: true,
            returnEnd: true,
            illegal: '[<=\'$"]',
            contains: [
            hljs.C_LINE_COMMENT_MODE,
            hljs.C_BLOCK_COMMENT_MODE,
            MIXIN_GUARD_MODE,
            IDENT_MODE('keyword', 'all\\b'),
            IDENT_MODE('variable', '@{' + IDENT_RE + '}'), // otherwise it’s identified as tag
            IDENT_MODE('tag', INTERP_IDENT_RE + '%?', 0), // '%' for more consistent coloring of @keyframes "tags"
            IDENT_MODE('id', '#' + INTERP_IDENT_RE),
            IDENT_MODE('class', '\\.' + INTERP_IDENT_RE, 0),
            IDENT_MODE('keyword', '&', 0),
            FUNCT_MODE('pseudo', ':not'),
            FUNCT_MODE('keyword', ':extend'),
            IDENT_MODE('pseudo', '::?' + INTERP_IDENT_RE),
            {
                className: 'attr_selector',
                begin: '\\[',
                end: '\\]'
            },
            {
                begin: '\\(',
                end: '\\)',
                contains: VALUE_WITH_RULESETS
            }, // argument list of parametric mixins
            {
                begin: '!important'
            }
            // eat !important after mixin call or it will be colored as tag
            ]
        };

        RULES.push(
        hljs.C_LINE_COMMENT_MODE,
        hljs.C_BLOCK_COMMENT_MODE,
        AT_RULE_MODE,
        VAR_RULE_MODE,
        SELECTOR_MODE,
        RULE_MODE
        );

        return {
            case_insensitive: true,
            illegal: '[=>\'/<($"]',
            contains: RULES
        };
    };
}, {}
],
105: [function(require, module, exports) {
    module.exports = function(hljs) {
        var LISP_IDENT_RE = '[a-zA-Z_\\-\\+\\*\\/\\<\\=\\>\\&\\#][a-zA-Z0-9_\\-\\+\\*\\/\\<\\=\\>\\&\\#!]*';
        var MEC_RE = '\\|[^]*?\\|';
        var LISP_SIMPLE_NUMBER_RE = '(\\-|\\+)?\\d+(\\.\\d+|\\/\\d+)?((d|e|f|l|s|D|E|F|L|S)(\\+|\\-)?\\d+)?';
        var SHEBANG = {
            className: 'shebang',
            begin: '^#!',
            end: '$'
        };
        var LITERAL = {
            className: 'literal',
            begin: '\\b(t{1}|nil)\\b'
        };
        var NUMBER = {
            className: 'number',
            variants: [
            {
                begin: LISP_SIMPLE_NUMBER_RE,
                relevance: 0
            },
            {
                begin: '#(b|B)[0-1]+(/[0-1]+)?'
            },
            {
                begin: '#(o|O)[0-7]+(/[0-7]+)?'
            },
            {
                begin: '#(x|X)[0-9a-fA-F]+(/[0-9a-fA-F]+)?'
            },
            {
                begin: '#(c|C)\\(' + LISP_SIMPLE_NUMBER_RE + ' +' + LISP_SIMPLE_NUMBER_RE,
                end: '\\)'
            }
            ]
        };
        var STRING = hljs.inherit(hljs.QUOTE_STRING_MODE, {
            illegal: null
        });
        var COMMENT = hljs.COMMENT(
        ';', '$',
        {
            relevance: 0
        });
        var VARIABLE = {
            className: 'variable',
            begin: '\\*',
            end: '\\*'
        };
        var KEYWORD = {
            className: 'keyword',
            begin: '[:&]' + LISP_IDENT_RE
        };
        var IDENT = {
            begin: LISP_IDENT_RE,
            relevance: 0
        };
        var MEC = {
            begin: MEC_RE
        };
        var QUOTED_LIST = {
            begin: '\\(',
            end: '\\)',
            contains: ['self', LITERAL, STRING, NUMBER, IDENT]
        };
        var QUOTED = {
            className: 'quoted',
            contains: [NUMBER, STRING, VARIABLE, KEYWORD, QUOTED_LIST, IDENT],
            variants: [
            {
                begin: '[\'`]\\(',
                end: '\\)'
            },
            {
                begin: '\\(quote ',
                end: '\\)',
                keywords: 'quote'
            },
            {
                begin: '\'' + MEC_RE
            }
            ]
        };
        var QUOTED_ATOM = {
            className: 'quoted',
            variants: [
            {
                begin: '\'' + LISP_IDENT_RE
            },
            {
                begin: '#\'' + LISP_IDENT_RE + '(::' + LISP_IDENT_RE + ')*'
            }
            ]
        };
        var LIST = {
            className: 'list',
            begin: '\\(\\s*',
            end: '\\)'
        };
        var BODY = {
            endsWithParent: true,
            relevance: 0
        };
        LIST.contains = [
        {
            className: 'keyword',
            variants: [
            {
                begin: LISP_IDENT_RE
            },
            {
                begin: MEC_RE
            }
            ]
        },
        BODY
        ];
        BODY.contains = [QUOTED, QUOTED_ATOM, LIST, LITERAL, NUMBER, STRING, COMMENT, VARIABLE, KEYWORD, MEC, IDENT];

        return {
            illegal: /\S/,
            contains: [
            NUMBER,
            SHEBANG,
            LITERAL,
            STRING,
            COMMENT,
            QUOTED,
            QUOTED_ATOM,
            LIST,
            IDENT
            ]
        };
    };
}, {}
],
106: [function(require, module, exports) {
    module.exports = function(hljs) {
        var VARIABLE = {
            className: 'variable',
            begin: '\\b[gtps][A-Z]+[A-Za-z0-9_\\-]*\\b|\\$_[A-Z]+',
            relevance: 0
        };
        var COMMENT_MODES = [
        hljs.C_BLOCK_COMMENT_MODE,
        hljs.HASH_COMMENT_MODE,
        hljs.COMMENT('--', '$'),
        hljs.COMMENT('[^:]//', '$')
        ];
        var TITLE1 = hljs.inherit(hljs.TITLE_MODE, {
            variants: [
            {
                begin: '\\b_*rig[A-Z]+[A-Za-z0-9_\\-]*'
            },
            {
                begin: '\\b_[a-z0-9\\-]+'
            }
            ]
        });
        var TITLE2 = hljs.inherit(hljs.TITLE_MODE, {
            begin: '\\b([A-Za-z0-9_\\-]+)\\b'
        });
        return {
            case_insensitive: false,
            keywords: {
                keyword:
                '$_COOKIE $_FILES $_GET $_GET_BINARY $_GET_RAW $_POST $_POST_BINARY $_POST_RAW $_SESSION $_SERVER ' +
                'codepoint codepoints segment segments codeunit codeunits sentence sentences trueWord trueWords paragraph ' +
                'after byte bytes english the until http forever descending using line real8 with seventh ' +
                'for stdout finally element word words fourth before black ninth sixth characters chars stderr ' +
                'uInt1 uInt1s uInt2 uInt2s stdin string lines relative rel any fifth items from middle mid ' +
                'at else of catch then third it file milliseconds seconds second secs sec int1 int1s int4 ' +
                'int4s internet int2 int2s normal text item last long detailed effective uInt4 uInt4s repeat ' +
                'end repeat URL in try into switch to words https token binfile each tenth as ticks tick ' +
                'system real4 by dateItems without char character ascending eighth whole dateTime numeric short ' +
                'first ftp integer abbreviated abbr abbrev private case while if',
                constant:
                'SIX TEN FORMFEED NINE ZERO NONE SPACE FOUR FALSE COLON CRLF PI COMMA ENDOFFILE EOF EIGHT FIVE ' +
                'QUOTE EMPTY ONE TRUE RETURN CR LINEFEED RIGHT BACKSLASH NULL SEVEN TAB THREE TWO ' +
                'six ten formfeed nine zero none space four false colon crlf pi comma endoffile eof eight five ' +
                'quote empty one true return cr linefeed right backslash null seven tab three two ' +
                'RIVERSION RISTATE FILE_READ_MODE FILE_WRITE_MODE FILE_WRITE_MODE DIR_WRITE_MODE FILE_READ_UMASK ' +
                'FILE_WRITE_UMASK DIR_READ_UMASK DIR_WRITE_UMASK',
                operator:
                'div mod wrap and or bitAnd bitNot bitOr bitXor among not in a an within ' +
                'contains ends with begins the keys of keys',
                built_in:
                'put abs acos aliasReference annuity arrayDecode arrayEncode asin atan atan2 average avg avgDev base64Decode ' +
                'base64Encode baseConvert binaryDecode binaryEncode byteOffset byteToNum cachedURL cachedURLs charToNum ' +
                'cipherNames codepointOffset codepointProperty codepointToNum codeunitOffset commandNames compound compress ' +
                'constantNames cos date dateFormat decompress directories ' +
                'diskSpace DNSServers exp exp1 exp2 exp10 extents files flushEvents folders format functionNames geometricMean global ' +
                'globals hasMemory harmonicMean hostAddress hostAddressToName hostName hostNameToAddress isNumber ISOToMac itemOffset ' +
                'keys len length libURLErrorData libUrlFormData libURLftpCommand libURLLastHTTPHeaders libURLLastRHHeaders ' +
                'libUrlMultipartFormAddPart libUrlMultipartFormData libURLVersion lineOffset ln ln1 localNames log log2 log10 ' +
                'longFilePath lower macToISO matchChunk matchText matrixMultiply max md5Digest median merge millisec ' +
                'millisecs millisecond milliseconds min monthNames nativeCharToNum normalizeText num number numToByte numToChar ' +
                'numToCodepoint numToNativeChar offset open openfiles openProcesses openProcessIDs openSockets ' +
                'paragraphOffset paramCount param params peerAddress pendingMessages platform popStdDev populationStandardDeviation ' +
                'populationVariance popVariance processID random randomBytes replaceText result revCreateXMLTree revCreateXMLTreeFromFile ' +
                'revCurrentRecord revCurrentRecordIsFirst revCurrentRecordIsLast revDatabaseColumnCount revDatabaseColumnIsNull ' +
                'revDatabaseColumnLengths revDatabaseColumnNames revDatabaseColumnNamed revDatabaseColumnNumbered ' +
                'revDatabaseColumnTypes revDatabaseConnectResult revDatabaseCursors revDatabaseID revDatabaseTableNames ' +
                'revDatabaseType revDataFromQuery revdb_closeCursor revdb_columnbynumber revdb_columncount revdb_columnisnull ' +
                'revdb_columnlengths revdb_columnnames revdb_columntypes revdb_commit revdb_connect revdb_connections ' +
                'revdb_connectionerr revdb_currentrecord revdb_cursorconnection revdb_cursorerr revdb_cursors revdb_dbtype ' +
                'revdb_disconnect revdb_execute revdb_iseof revdb_isbof revdb_movefirst revdb_movelast revdb_movenext ' +
                'revdb_moveprev revdb_query revdb_querylist revdb_recordcount revdb_rollback revdb_tablenames ' +
                'revGetDatabaseDriverPath revNumberOfRecords revOpenDatabase revOpenDatabases revQueryDatabase ' +
                'revQueryDatabaseBlob revQueryResult revQueryIsAtStart revQueryIsAtEnd revUnixFromMacPath revXMLAttribute ' +
                'revXMLAttributes revXMLAttributeValues revXMLChildContents revXMLChildNames revXMLCreateTreeFromFileWithNamespaces ' +
                'revXMLCreateTreeWithNamespaces revXMLDataFromXPathQuery revXMLEvaluateXPath revXMLFirstChild revXMLMatchingNode ' +
                'revXMLNextSibling revXMLNodeContents revXMLNumberOfChildren revXMLParent revXMLPreviousSibling ' +
                'revXMLRootNode revXMLRPC_CreateRequest revXMLRPC_Documents revXMLRPC_Error ' +
                'revXMLRPC_GetHost revXMLRPC_GetMethod revXMLRPC_GetParam revXMLText revXMLRPC_Execute ' +
                'revXMLRPC_GetParamCount revXMLRPC_GetParamNode revXMLRPC_GetParamType revXMLRPC_GetPath revXMLRPC_GetPort ' +
                'revXMLRPC_GetProtocol revXMLRPC_GetRequest revXMLRPC_GetResponse revXMLRPC_GetSocket revXMLTree ' +
                'revXMLTrees revXMLValidateDTD revZipDescribeItem revZipEnumerateItems revZipOpenArchives round sampVariance ' +
                'sec secs seconds sentenceOffset sha1Digest shell shortFilePath sin specialFolderPath sqrt standardDeviation statRound ' +
                'stdDev sum sysError systemVersion tan tempName textDecode textEncode tick ticks time to tokenOffset toLower toUpper ' +
                'transpose truewordOffset trunc uniDecode uniEncode upper URLDecode URLEncode URLStatus uuid value variableNames ' +
                'variance version waitDepth weekdayNames wordOffset xsltApplyStylesheet xsltApplyStylesheetFromFile xsltLoadStylesheet ' +
                'xsltLoadStylesheetFromFile add breakpoint cancel clear local variable file word line folder directory URL close socket process ' +
                'combine constant convert create new alias folder directory decrypt delete variable word line folder ' +
                'directory URL dispatch divide do encrypt filter get include intersect kill libURLDownloadToFile ' +
                'libURLFollowHttpRedirects libURLftpUpload libURLftpUploadFile libURLresetAll libUrlSetAuthCallback ' +
                'libURLSetCustomHTTPHeaders libUrlSetExpect100 libURLSetFTPListCommand libURLSetFTPMode libURLSetFTPStopTime ' +
                'libURLSetStatusCallback load multiply socket prepare process post seek rel relative read from process rename ' +
                'replace require resetAll resolve revAddXMLNode revAppendXML revCloseCursor revCloseDatabase revCommitDatabase ' +
                'revCopyFile revCopyFolder revCopyXMLNode revDeleteFolder revDeleteXMLNode revDeleteAllXMLTrees ' +
                'revDeleteXMLTree revExecuteSQL revGoURL revInsertXMLNode revMoveFolder revMoveToFirstRecord revMoveToLastRecord ' +
                'revMoveToNextRecord revMoveToPreviousRecord revMoveToRecord revMoveXMLNode revPutIntoXMLNode revRollBackDatabase ' +
                'revSetDatabaseDriverPath revSetXMLAttribute revXMLRPC_AddParam revXMLRPC_DeleteAllDocuments revXMLAddDTD ' +
                'revXMLRPC_Free revXMLRPC_FreeAll revXMLRPC_DeleteDocument revXMLRPC_DeleteParam revXMLRPC_SetHost ' +
                'revXMLRPC_SetMethod revXMLRPC_SetPort revXMLRPC_SetProtocol revXMLRPC_SetSocket revZipAddItemWithData ' +
                'revZipAddItemWithFile revZipAddUncompressedItemWithData revZipAddUncompressedItemWithFile revZipCancel ' +
                'revZipCloseArchive revZipDeleteItem revZipExtractItemToFile revZipExtractItemToVariable revZipSetProgressCallback ' +
                'revZipRenameItem revZipReplaceItemWithData revZipReplaceItemWithFile revZipOpenArchive send set sort split start stop ' +
                'subtract union unload wait write'
            },
            contains: [
            VARIABLE,
            {
                className: 'keyword',
                begin: '\\bend\\sif\\b'
            },
            {
                className: 'function',
                beginKeywords: 'function',
                end: '$',
                contains: [
                VARIABLE,
                TITLE2,
                hljs.APOS_STRING_MODE,
                hljs.QUOTE_STRING_MODE,
                hljs.BINARY_NUMBER_MODE,
                hljs.C_NUMBER_MODE,
                TITLE1
                ]
            },
            {
                className: 'function',
                begin: '\\bend\\s+',
                end: '$',
                keywords: 'end',
                contains: [
                TITLE2,
                TITLE1
                ]
            },
            {
                className: 'command',
                beginKeywords: 'command on',
                end: '$',
                contains: [
                VARIABLE,
                TITLE2,
                hljs.APOS_STRING_MODE,
                hljs.QUOTE_STRING_MODE,
                hljs.BINARY_NUMBER_MODE,
                hljs.C_NUMBER_MODE,
                TITLE1
                ]
            },
            {
                className: 'preprocessor',
                variants: [
                {
                    begin: '<\\?(rev|lc|livecode)',
                    relevance: 10
                },
                {
                    begin: '<\\?'
                },
                {
                    begin: '\\?>'
                }
                ]
            },
            hljs.APOS_STRING_MODE,
            hljs.QUOTE_STRING_MODE,
            hljs.BINARY_NUMBER_MODE,
            hljs.C_NUMBER_MODE,
            TITLE1
            ].concat(COMMENT_MODES),
            illegal: ';$|^\\[|^='
        };
    };
}, {}
],
107: [function(require, module, exports) {
    module.exports = function(hljs) {
        var KEYWORDS = {
            keyword:
            // JS keywords
            'in if for while finally new do return else break catch instanceof throw try this ' +
            'switch continue typeof delete debugger case default function var with ' +
            // LiveScript keywords
            'then unless until loop of by when and or is isnt not it that otherwise from to til fallthrough super ' +
            'case default function var void const let enum export import native ' +
            '__hasProp __extends __slice __bind __indexOf',
            literal:
            // JS literals
            'true false null undefined ' +
            // LiveScript literals
            'yes no on off it that void',
            built_in:
            'npm require console print module global window document'
        };
        var JS_IDENT_RE = '[A-Za-z$_](?:\-[0-9A-Za-z$_]|[0-9A-Za-z$_])*';
        var TITLE = hljs.inherit(hljs.TITLE_MODE, {
            begin: JS_IDENT_RE
        });
        var SUBST = {
            className: 'subst',
            begin: /#\{/,
            end: /}/,
            keywords: KEYWORDS
        };
        var SUBST_SIMPLE = {
            className: 'subst',
            begin: /#[A-Za-z$_]/,
            end: /(?:\-[0-9A-Za-z$_]|[0-9A-Za-z$_])*/,
            keywords: KEYWORDS
        };
        var EXPRESSIONS = [
        hljs.BINARY_NUMBER_MODE,
        {
            className: 'number',
            begin: '(\\b0[xX][a-fA-F0-9_]+)|(\\b\\d(\\d|_\\d)*(\\.(\\d(\\d|_\\d)*)?)?(_*[eE]([-+]\\d(_\\d|\\d)*)?)?[_a-z]*)',
            relevance: 0,
            starts: {
                end: '(\\s*/)?',
                relevance: 0
            }
            // a number tries to eat the following slash to prevent treating it as a regexp
        },
        {
            className: 'string',
            variants: [
            {
                begin: /'''/,
                end: /'''/,
                contains: [hljs.BACKSLASH_ESCAPE]
            },
            {
                begin: /'/,
                end: /'/,
                contains: [hljs.BACKSLASH_ESCAPE]
            },
            {
                begin: /"""/,
                end: /"""/,
                contains: [hljs.BACKSLASH_ESCAPE, SUBST, SUBST_SIMPLE]
            },
            {
                begin: /"/,
                end: /"/,
                contains: [hljs.BACKSLASH_ESCAPE, SUBST, SUBST_SIMPLE]
            },
            {
                begin: /\\/,
                end: /(\s|$)/,
                excludeEnd: true
            }
            ]
        },
        {
            className: 'pi',
            variants: [
            {
                begin: '//',
                end: '//[gim]*',
                contains: [SUBST, hljs.HASH_COMMENT_MODE]
            },
            {
                // regex can't start with space to parse x / 2 / 3 as two divisions
                // regex can't start with *, and it supports an "illegal" in the main mode
                begin: /\/(?![ *])(\\\/|.)*?\/[gim]*(?=\W|$)/
            }
            ]
        },
        {
            className: 'property',
            begin: '@' + JS_IDENT_RE
        },
        {
            begin: '``',
            end: '``',
            excludeBegin: true,
            excludeEnd: true,
            subLanguage: 'javascript'
        }
        ];
        SUBST.contains = EXPRESSIONS;

        var PARAMS = {
            className: 'params',
            begin: '\\(',
            returnBegin: true,
            /* We need another contained nameless mode to not have every nested
                pair of parens to be called "params" */
            contains: [
            {
                begin: /\(/,
                end: /\)/,
                keywords: KEYWORDS,
                contains: ['self'].concat(EXPRESSIONS)
            }
            ]
        };

        return {
            aliases: ['ls'],
            keywords: KEYWORDS,
            illegal: /\/\*/,
            contains: EXPRESSIONS.concat([
            hljs.COMMENT('\\/\\*', '\\*\\/'),
            hljs.HASH_COMMENT_MODE,
            {
                className: 'function',
                contains: [TITLE, PARAMS],
                returnBegin: true,
                variants: [
                {
                    begin: '(' + JS_IDENT_RE + '\\s*(?:=|:=)\\s*)?(\\(.*\\))?\\s*\\B\\->\\*?',
                    end: '\\->\\*?'
                },
                {
                    begin: '(' + JS_IDENT_RE + '\\s*(?:=|:=)\\s*)?!?(\\(.*\\))?\\s*\\B[-~]{1,2}>\\*?',
                    end: '[-~]{1,2}>\\*?'
                },
                {
                    begin: '(' + JS_IDENT_RE + '\\s*(?:=|:=)\\s*)?(\\(.*\\))?\\s*\\B!?[-~]{1,2}>\\*?',
                    end: '!?[-~]{1,2}>\\*?'
                }
                ]
            },
            {
                className: 'class',
                beginKeywords: 'class',
                end: '$',
                illegal: /[:="\[\]]/,
                contains: [
                {
                    beginKeywords: 'extends',
                    endsWithParent: true,
                    illegal: /[:="\[\]]/,
                    contains: [TITLE]
                },
                TITLE
                ]
            },
            {
                className: 'attribute',
                begin: JS_IDENT_RE + ':',
                end: ':',
                returnBegin: true,
                returnEnd: true,
                relevance: 0
            }
            ])
        };
    };
}, {}
],
108: [function(require, module, exports) {
    module.exports = function(hljs) {
        var OPENING_LONG_BRACKET = '\\[=*\\[';
        var CLOSING_LONG_BRACKET = '\\]=*\\]';
        var LONG_BRACKETS = {
            begin: OPENING_LONG_BRACKET,
            end: CLOSING_LONG_BRACKET,
            contains: ['self']
        };
        var COMMENTS = [
        hljs.COMMENT('--(?!' + OPENING_LONG_BRACKET + ')', '$'),
        hljs.COMMENT(
        '--' + OPENING_LONG_BRACKET,
        CLOSING_LONG_BRACKET,
        {
            contains: [LONG_BRACKETS],
            relevance: 10
        })
        ];
        return {
            lexemes: hljs.UNDERSCORE_IDENT_RE,
            keywords: {
                keyword:
                'and break do else elseif end false for if in local nil not or repeat return then ' +
                'true until while',
                built_in:
                '_G _VERSION assert collectgarbage dofile error getfenv getmetatable ipairs load ' +
                'loadfile loadstring module next pairs pcall print rawequal rawget rawset require ' +
                'select setfenv setmetatable tonumber tostring type unpack xpcall coroutine debug ' +
                'io math os package string table'
            },
            contains: COMMENTS.concat([
            {
                className: 'function',
                beginKeywords: 'function',
                end: '\\)',
                contains: [
                hljs.inherit(hljs.TITLE_MODE, {
                    begin: '([_a-zA-Z]\\w*\\.)*([_a-zA-Z]\\w*:)?[_a-zA-Z]\\w*'
                }),
                {
                    className: 'params',
                    begin: '\\(',
                    endsWithParent: true,
                    contains: COMMENTS
                }
                ].concat(COMMENTS)
            },
            hljs.C_NUMBER_MODE,
            hljs.APOS_STRING_MODE,
            hljs.QUOTE_STRING_MODE,
            {
                className: 'string',
                begin: OPENING_LONG_BRACKET,
                end: CLOSING_LONG_BRACKET,
                contains: [LONG_BRACKETS],
                relevance: 5
            }
            ])
        };
    };
}, {}
],
109: [function(require, module, exports) {
    module.exports = function(hljs) {
        var VARIABLE = {
            className: 'variable',
            begin: /\$\(/,
            end: /\)/,
            contains: [hljs.BACKSLASH_ESCAPE]
        };
        return {
            aliases: ['mk', 'mak'],
            contains: [
            hljs.HASH_COMMENT_MODE,
            {
                begin: /^\w+\s*\W*=/,
                returnBegin: true,
                relevance: 0,
                starts: {
                    className: 'constant',
                    end: /\s*\W*=/,
                    excludeEnd: true,
                    starts: {
                        end: /$/,
                        relevance: 0,
                        contains: [
                        VARIABLE
                        ]
                    }
                }
            },
            {
                className: 'title',
                begin: /^[\w]+:\s*$/
            },
            {
                className: 'phony',
                begin: /^\.PHONY:/,
                end: /$/,
                keywords: '.PHONY',
                lexemes: /[\.\w]+/
            },
            {
                begin: /^\t+/,
                end: /$/,
                relevance: 0,
                contains: [
                hljs.QUOTE_STRING_MODE,
                VARIABLE
                ]
            }
            ]
        };
    };
}, {}
],
110: [function(require, module, exports) {
    module.exports = function(hljs) {
        return {
            aliases: ['md', 'mkdown', 'mkd'],
            contains: [
            // highlight headers
            {
                className: 'header',
                variants: [
                {
                    begin: '^#{1,6}',
                    end: '$'
                },
                {
                    begin: '^.+?\\n[=-]{2,}$'
                }
                ]
            },
            // inline html
            {
                begin: '<',
                end: '>',
                subLanguage: 'xml',
                relevance: 0
            },
            // lists (indicators only)
            {
                className: 'bullet',
                begin: '^([*+-]|(\\d+\\.))\\s+'
            },
            // strong segments
            {
                className: 'strong',
                begin: '[*_]{2}.+?[*_]{2}'
            },
            // emphasis segments
            {
                className: 'emphasis',
                variants: [
                {
                    begin: '\\*.+?\\*'
                },
                {
                    begin: '_.+?_'
                    ,
                    relevance: 0
                }
                ]
            },
            // blockquotes
            {
                className: 'blockquote',
                begin: '^>\\s+',
                end: '$'
            },
            // code snippets
            {
                className: 'code',
                variants: [
                {
                    begin: '`.+?`'
                },
                {
                    begin: '^( {4}|\t)',
                    end: '$'
                    ,
                    relevance: 0
                }
                ]
            },
            // horizontal rules
            {
                className: 'horizontal_rule',
                begin: '^[-\\*]{3,}',
                end: '$'
            },
            // using links - title and link
            {
                begin: '\\[.+?\\][\\(\\[].*?[\\)\\]]',
                returnBegin: true,
                contains: [
                {
                    className: 'link_label',
                    begin: '\\[',
                    end: '\\]',
                    excludeBegin: true,
                    returnEnd: true,
                    relevance: 0
                },
                {
                    className: 'link_url',
                    begin: '\\]\\(',
                    end: '\\)',
                    excludeBegin: true,
                    excludeEnd: true
                },
                {
                    className: 'link_reference',
                    begin: '\\]\\[',
                    end: '\\]',
                    excludeBegin: true,
                    excludeEnd: true
                }
                ],
                relevance: 10
            },
            {
                begin: '^\\[\.+\\]:',
                returnBegin: true,
                contains: [
                {
                    className: 'link_reference',
                    begin: '\\[',
                    end: '\\]:',
                    excludeBegin: true,
                    excludeEnd: true,
                    starts: {
                        className: 'link_url',
                        end: '$'
                    }
                }
                ]
            }
            ]
        };
    };
}, {}
],
111: [function(require, module, exports) {
    module.exports = function(hljs) {
        return {
            aliases: ['mma'],
            lexemes: '(\\$|\\b)' + hljs.IDENT_RE + '\\b',
            keywords: 'AbelianGroup Abort AbortKernels AbortProtect Above Abs Absolute AbsoluteCorrelation AbsoluteCorrelationFunction AbsoluteCurrentValue AbsoluteDashing AbsoluteFileName AbsoluteOptions AbsolutePointSize AbsoluteThickness AbsoluteTime AbsoluteTiming AccountingForm Accumulate Accuracy AccuracyGoal ActionDelay ActionMenu ActionMenuBox ActionMenuBoxOptions Active ActiveItem ActiveStyle AcyclicGraphQ AddOnHelpPath AddTo AdjacencyGraph AdjacencyList AdjacencyMatrix AdjustmentBox AdjustmentBoxOptions AdjustTimeSeriesForecast AffineTransform After AiryAi AiryAiPrime AiryAiZero AiryBi AiryBiPrime AiryBiZero AlgebraicIntegerQ AlgebraicNumber AlgebraicNumberDenominator AlgebraicNumberNorm AlgebraicNumberPolynomial AlgebraicNumberTrace AlgebraicRules AlgebraicRulesData Algebraics AlgebraicUnitQ Alignment AlignmentMarker AlignmentPoint All AllowedDimensions AllowGroupClose AllowInlineCells AllowKernelInitialization AllowReverseGroupClose AllowScriptLevelChange AlphaChannel AlternatingGroup AlternativeHypothesis Alternatives AmbientLight Analytic AnchoredSearch And AndersonDarlingTest AngerJ AngleBracket AngularGauge Animate AnimationCycleOffset AnimationCycleRepetitions AnimationDirection AnimationDisplayTime AnimationRate AnimationRepetitions AnimationRunning Animator AnimatorBox AnimatorBoxOptions AnimatorElements Annotation Annuity AnnuityDue Antialiasing Antisymmetric Apart ApartSquareFree Appearance AppearanceElements AppellF1 Append AppendTo Apply ArcCos ArcCosh ArcCot ArcCoth ArcCsc ArcCsch ArcSec ArcSech ArcSin ArcSinDistribution ArcSinh ArcTan ArcTanh Arg ArgMax ArgMin ArgumentCountQ ARIMAProcess ArithmeticGeometricMean ARMAProcess ARProcess Array ArrayComponents ArrayDepth ArrayFlatten ArrayPad ArrayPlot ArrayQ ArrayReshape ArrayRules Arrays Arrow Arrow3DBox ArrowBox Arrowheads AspectRatio AspectRatioFixed Assert Assuming Assumptions AstronomicalData Asynchronous AsynchronousTaskObject AsynchronousTasks AtomQ Attributes AugmentedSymmetricPolynomial AutoAction AutoDelete AutoEvaluateEvents AutoGeneratedPackage AutoIndent AutoIndentSpacings AutoItalicWords AutoloadPath AutoMatch Automatic AutomaticImageSize AutoMultiplicationSymbol AutoNumberFormatting AutoOpenNotebooks AutoOpenPalettes AutorunSequencing AutoScaling AutoScroll AutoSpacing AutoStyleOptions AutoStyleWords Axes AxesEdge AxesLabel AxesOrigin AxesStyle Axis ' +
            'BabyMonsterGroupB Back Background BackgroundTasksSettings Backslash Backsubstitution Backward Band BandpassFilter BandstopFilter BarabasiAlbertGraphDistribution BarChart BarChart3D BarLegend BarlowProschanImportance BarnesG BarOrigin BarSpacing BartlettHannWindow BartlettWindow BaseForm Baseline BaselinePosition BaseStyle BatesDistribution BattleLemarieWavelet Because BeckmannDistribution Beep Before Begin BeginDialogPacket BeginFrontEndInteractionPacket BeginPackage BellB BellY Below BenfordDistribution BeniniDistribution BenktanderGibratDistribution BenktanderWeibullDistribution BernoulliB BernoulliDistribution BernoulliGraphDistribution BernoulliProcess BernsteinBasis BesselFilterModel BesselI BesselJ BesselJZero BesselK BesselY BesselYZero Beta BetaBinomialDistribution BetaDistribution BetaNegativeBinomialDistribution BetaPrimeDistribution BetaRegularized BetweennessCentrality BezierCurve BezierCurve3DBox BezierCurve3DBoxOptions BezierCurveBox BezierCurveBoxOptions BezierFunction BilateralFilter Binarize BinaryFormat BinaryImageQ BinaryRead BinaryReadList BinaryWrite BinCounts BinLists Binomial BinomialDistribution BinomialProcess BinormalDistribution BiorthogonalSplineWavelet BipartiteGraphQ BirnbaumImportance BirnbaumSaundersDistribution BitAnd BitClear BitGet BitLength BitNot BitOr BitSet BitShiftLeft BitShiftRight BitXor Black BlackmanHarrisWindow BlackmanNuttallWindow BlackmanWindow Blank BlankForm BlankNullSequence BlankSequence Blend Block BlockRandom BlomqvistBeta BlomqvistBetaTest Blue Blur BodePlot BohmanWindow Bold Bookmarks Boole BooleanConsecutiveFunction BooleanConvert BooleanCountingFunction BooleanFunction BooleanGraph BooleanMaxterms BooleanMinimize BooleanMinterms Booleans BooleanTable BooleanVariables BorderDimensions BorelTannerDistribution Bottom BottomHatTransform BoundaryStyle Bounds Box BoxBaselineShift BoxData BoxDimensions Boxed Boxes BoxForm BoxFormFormatTypes BoxFrame BoxID BoxMargins BoxMatrix BoxRatios BoxRotation BoxRotationPoint BoxStyle BoxWhiskerChart Bra BracketingBar BraKet BrayCurtisDistance BreadthFirstScan Break Brown BrownForsytheTest BrownianBridgeProcess BrowserCategory BSplineBasis BSplineCurve BSplineCurve3DBox BSplineCurveBox BSplineCurveBoxOptions BSplineFunction BSplineSurface BSplineSurface3DBox BubbleChart BubbleChart3D BubbleScale BubbleSizes BulletGauge BusinessDayQ ButterflyGraph ButterworthFilterModel Button ButtonBar ButtonBox ButtonBoxOptions ButtonCell ButtonContents ButtonData ButtonEvaluator ButtonExpandable ButtonFrame ButtonFunction ButtonMargins ButtonMinHeight ButtonNote ButtonNotebook ButtonSource ButtonStyle ButtonStyleMenuListing Byte ByteCount ByteOrdering ' +
            'C CachedValue CacheGraphics CalendarData CalendarType CallPacket CanberraDistance Cancel CancelButton CandlestickChart Cap CapForm CapitalDifferentialD CardinalBSplineBasis CarmichaelLambda Cases Cashflow Casoratian Catalan CatalanNumber Catch CauchyDistribution CauchyWindow CayleyGraph CDF CDFDeploy CDFInformation CDFWavelet Ceiling Cell CellAutoOverwrite CellBaseline CellBoundingBox CellBracketOptions CellChangeTimes CellContents CellContext CellDingbat CellDynamicExpression CellEditDuplicate CellElementsBoundingBox CellElementSpacings CellEpilog CellEvaluationDuplicate CellEvaluationFunction CellEventActions CellFrame CellFrameColor CellFrameLabelMargins CellFrameLabels CellFrameMargins CellGroup CellGroupData CellGrouping CellGroupingRules CellHorizontalScrolling CellID CellLabel CellLabelAutoDelete CellLabelMargins CellLabelPositioning CellMargins CellObject CellOpen CellPrint CellProlog Cells CellSize CellStyle CellTags CellularAutomaton CensoredDistribution Censoring Center CenterDot CentralMoment CentralMomentGeneratingFunction CForm ChampernowneNumber ChanVeseBinarize Character CharacterEncoding CharacterEncodingsPath CharacteristicFunction CharacteristicPolynomial CharacterRange Characters ChartBaseStyle ChartElementData ChartElementDataFunction ChartElementFunction ChartElements ChartLabels ChartLayout ChartLegends ChartStyle Chebyshev1FilterModel Chebyshev2FilterModel ChebyshevDistance ChebyshevT ChebyshevU Check CheckAbort CheckAll Checkbox CheckboxBar CheckboxBox CheckboxBoxOptions ChemicalData ChessboardDistance ChiDistribution ChineseRemainder ChiSquareDistribution ChoiceButtons ChoiceDialog CholeskyDecomposition Chop Circle CircleBox CircleDot CircleMinus CirclePlus CircleTimes CirculantGraph CityData Clear ClearAll ClearAttributes ClearSystemCache ClebschGordan ClickPane Clip ClipboardNotebook ClipFill ClippingStyle ClipPlanes ClipRange Clock ClockGauge ClockwiseContourIntegral Close Closed CloseKernels ClosenessCentrality Closing ClosingAutoSave ClosingEvent ClusteringComponents CMYKColor Coarse Coefficient CoefficientArrays CoefficientDomain CoefficientList CoefficientRules CoifletWavelet Collect Colon ColonForm ColorCombine ColorConvert ColorData ColorDataFunction ColorFunction ColorFunctionScaling Colorize ColorNegate ColorOutput ColorProfileData ColorQuantize ColorReplace ColorRules ColorSelectorSettings ColorSeparate ColorSetter ColorSetterBox ColorSetterBoxOptions ColorSlider ColorSpace Column ColumnAlignments ColumnBackgrounds ColumnForm ColumnLines ColumnsEqual ColumnSpacings ColumnWidths CommonDefaultFormatTypes Commonest CommonestFilter CommonUnits CommunityBoundaryStyle CommunityGraphPlot CommunityLabels CommunityRegionStyle CompatibleUnitQ CompilationOptions CompilationTarget Compile Compiled CompiledFunction Complement CompleteGraph CompleteGraphQ CompleteKaryTree CompletionsListPacket Complex Complexes ComplexExpand ComplexInfinity ComplexityFunction ComponentMeasurements ' +
            'ComponentwiseContextMenu Compose ComposeList ComposeSeries Composition CompoundExpression CompoundPoissonDistribution CompoundPoissonProcess CompoundRenewalProcess Compress CompressedData Condition ConditionalExpression Conditioned Cone ConeBox ConfidenceLevel ConfidenceRange ConfidenceTransform ConfigurationPath Congruent Conjugate ConjugateTranspose Conjunction Connect ConnectedComponents ConnectedGraphQ ConnesWindow ConoverTest ConsoleMessage ConsoleMessagePacket ConsolePrint Constant ConstantArray Constants ConstrainedMax ConstrainedMin ContentPadding ContentsBoundingBox ContentSelectable ContentSize Context ContextMenu Contexts ContextToFilename ContextToFileName Continuation Continue ContinuedFraction ContinuedFractionK ContinuousAction ContinuousMarkovProcess ContinuousTimeModelQ ContinuousWaveletData ContinuousWaveletTransform ContourDetect ContourGraphics ContourIntegral ContourLabels ContourLines ContourPlot ContourPlot3D Contours ContourShading ContourSmoothing ContourStyle ContraharmonicMean Control ControlActive ControlAlignment ControllabilityGramian ControllabilityMatrix ControllableDecomposition ControllableModelQ ControllerDuration ControllerInformation ControllerInformationData ControllerLinking ControllerManipulate ControllerMethod ControllerPath ControllerState ControlPlacement ControlsRendering ControlType Convergents ConversionOptions ConversionRules ConvertToBitmapPacket ConvertToPostScript ConvertToPostScriptPacket Convolve ConwayGroupCo1 ConwayGroupCo2 ConwayGroupCo3 CoordinateChartData CoordinatesToolOptions CoordinateTransform CoordinateTransformData CoprimeQ Coproduct CopulaDistribution Copyable CopyDirectory CopyFile CopyTag CopyToClipboard CornerFilter CornerNeighbors Correlation CorrelationDistance CorrelationFunction CorrelationTest Cos Cosh CoshIntegral CosineDistance CosineWindow CosIntegral Cot Coth Count CounterAssignments CounterBox CounterBoxOptions CounterClockwiseContourIntegral CounterEvaluator CounterFunction CounterIncrements CounterStyle CounterStyleMenuListing CountRoots CountryData Covariance CovarianceEstimatorFunction CovarianceFunction CoxianDistribution CoxIngersollRossProcess CoxModel CoxModelFit CramerVonMisesTest CreateArchive CreateDialog CreateDirectory CreateDocument CreateIntermediateDirectories CreatePalette CreatePalettePacket CreateScheduledTask CreateTemporary CreateWindow CriticalityFailureImportance CriticalitySuccessImportance CriticalSection Cross CrossingDetect CrossMatrix Csc Csch CubeRoot Cubics Cuboid CuboidBox Cumulant CumulantGeneratingFunction Cup CupCap Curl CurlyDoubleQuote CurlyQuote CurrentImage CurrentlySpeakingPacket CurrentValue CurvatureFlowFilter CurveClosed Cyan CycleGraph CycleIndexPolynomial Cycles CyclicGroup Cyclotomic Cylinder CylinderBox CylindricalDecomposition ' +
            'D DagumDistribution DamerauLevenshteinDistance DampingFactor Darker Dashed Dashing DataCompression DataDistribution DataRange DataReversed Date DateDelimiters DateDifference DateFunction DateList DateListLogPlot DateListPlot DatePattern DatePlus DateRange DateString DateTicksFormat DaubechiesWavelet DavisDistribution DawsonF DayCount DayCountConvention DayMatchQ DayName DayPlus DayRange DayRound DeBruijnGraph Debug DebugTag Decimal DeclareKnownSymbols DeclarePackage Decompose Decrement DedekindEta Default DefaultAxesStyle DefaultBaseStyle DefaultBoxStyle DefaultButton DefaultColor DefaultControlPlacement DefaultDuplicateCellStyle DefaultDuration DefaultElement DefaultFaceGridsStyle DefaultFieldHintStyle DefaultFont DefaultFontProperties DefaultFormatType DefaultFormatTypeForStyle DefaultFrameStyle DefaultFrameTicksStyle DefaultGridLinesStyle DefaultInlineFormatType DefaultInputFormatType DefaultLabelStyle DefaultMenuStyle DefaultNaturalLanguage DefaultNewCellStyle DefaultNewInlineCellStyle DefaultNotebook DefaultOptions DefaultOutputFormatType DefaultStyle DefaultStyleDefinitions DefaultTextFormatType DefaultTextInlineFormatType DefaultTicksStyle DefaultTooltipStyle DefaultValues Defer DefineExternal DefineInputStreamMethod DefineOutputStreamMethod Definition Degree DegreeCentrality DegreeGraphDistribution DegreeLexicographic DegreeReverseLexicographic Deinitialization Del Deletable Delete DeleteBorderComponents DeleteCases DeleteContents DeleteDirectory DeleteDuplicates DeleteFile DeleteSmallComponents DeleteWithContents DeletionWarning Delimiter DelimiterFlashTime DelimiterMatching Delimiters Denominator DensityGraphics DensityHistogram DensityPlot DependentVariables Deploy Deployed Depth DepthFirstScan Derivative DerivativeFilter DescriptorStateSpace DesignMatrix Det DGaussianWavelet DiacriticalPositioning Diagonal DiagonalMatrix Dialog DialogIndent DialogInput DialogLevel DialogNotebook DialogProlog DialogReturn DialogSymbols Diamond DiamondMatrix DiceDissimilarity DictionaryLookup DifferenceDelta DifferenceOrder DifferenceRoot DifferenceRootReduce Differences DifferentialD DifferentialRoot DifferentialRootReduce DifferentiatorFilter DigitBlock DigitBlockMinimum DigitCharacter DigitCount DigitQ DihedralGroup Dilation Dimensions DiracComb DiracDelta DirectedEdge DirectedEdges DirectedGraph DirectedGraphQ DirectedInfinity Direction Directive Directory DirectoryName DirectoryQ DirectoryStack DirichletCharacter DirichletConvolve DirichletDistribution DirichletL DirichletTransform DirichletWindow DisableConsolePrintPacket DiscreteChirpZTransform DiscreteConvolve DiscreteDelta DiscreteHadamardTransform DiscreteIndicator DiscreteLQEstimatorGains DiscreteLQRegulatorGains DiscreteLyapunovSolve DiscreteMarkovProcess DiscretePlot DiscretePlot3D DiscreteRatio DiscreteRiccatiSolve DiscreteShift DiscreteTimeModelQ DiscreteUniformDistribution DiscreteVariables DiscreteWaveletData DiscreteWaveletPacketTransform ' +
            'DiscreteWaveletTransform Discriminant Disjunction Disk DiskBox DiskMatrix Dispatch DispersionEstimatorFunction Display DisplayAllSteps DisplayEndPacket DisplayFlushImagePacket DisplayForm DisplayFunction DisplayPacket DisplayRules DisplaySetSizePacket DisplayString DisplayTemporary DisplayWith DisplayWithRef DisplayWithVariable DistanceFunction DistanceTransform Distribute Distributed DistributedContexts DistributeDefinitions DistributionChart DistributionDomain DistributionFitTest DistributionParameterAssumptions DistributionParameterQ Dithering Div Divergence Divide DivideBy Dividers Divisible Divisors DivisorSigma DivisorSum DMSList DMSString Do DockedCells DocumentNotebook DominantColors DOSTextFormat Dot DotDashed DotEqual Dotted DoubleBracketingBar DoubleContourIntegral DoubleDownArrow DoubleLeftArrow DoubleLeftRightArrow DoubleLeftTee DoubleLongLeftArrow DoubleLongLeftRightArrow DoubleLongRightArrow DoubleRightArrow DoubleRightTee DoubleUpArrow DoubleUpDownArrow DoubleVerticalBar DoublyInfinite Down DownArrow DownArrowBar DownArrowUpArrow DownLeftRightVector DownLeftTeeVector DownLeftVector DownLeftVectorBar DownRightTeeVector DownRightVector DownRightVectorBar Downsample DownTee DownTeeArrow DownValues DragAndDrop DrawEdges DrawFrontFaces DrawHighlighted Drop DSolve Dt DualLinearProgramming DualSystemsModel DumpGet DumpSave DuplicateFreeQ Dynamic DynamicBox DynamicBoxOptions DynamicEvaluationTimeout DynamicLocation DynamicModule DynamicModuleBox DynamicModuleBoxOptions DynamicModuleParent DynamicModuleValues DynamicName DynamicNamespace DynamicReference DynamicSetting DynamicUpdating DynamicWrapper DynamicWrapperBox DynamicWrapperBoxOptions ' +
            'E EccentricityCentrality EdgeAdd EdgeBetweennessCentrality EdgeCapacity EdgeCapForm EdgeColor EdgeConnectivity EdgeCost EdgeCount EdgeCoverQ EdgeDashing EdgeDelete EdgeDetect EdgeForm EdgeIndex EdgeJoinForm EdgeLabeling EdgeLabels EdgeLabelStyle EdgeList EdgeOpacity EdgeQ EdgeRenderingFunction EdgeRules EdgeShapeFunction EdgeStyle EdgeThickness EdgeWeight Editable EditButtonSettings EditCellTagsSettings EditDistance EffectiveInterest Eigensystem Eigenvalues EigenvectorCentrality Eigenvectors Element ElementData Eliminate EliminationOrder EllipticE EllipticExp EllipticExpPrime EllipticF EllipticFilterModel EllipticK EllipticLog EllipticNomeQ EllipticPi EllipticReducedHalfPeriods EllipticTheta EllipticThetaPrime EmitSound EmphasizeSyntaxErrors EmpiricalDistribution Empty EmptyGraphQ EnableConsolePrintPacket Enabled Encode End EndAdd EndDialogPacket EndFrontEndInteractionPacket EndOfFile EndOfLine EndOfString EndPackage EngineeringForm Enter EnterExpressionPacket EnterTextPacket Entropy EntropyFilter Environment Epilog Equal EqualColumns EqualRows EqualTilde EquatedTo Equilibrium EquirippleFilterKernel Equivalent Erf Erfc Erfi ErlangB ErlangC ErlangDistribution Erosion ErrorBox ErrorBoxOptions ErrorNorm ErrorPacket ErrorsDialogSettings EstimatedDistribution EstimatedProcess EstimatorGains EstimatorRegulator EuclideanDistance EulerE EulerGamma EulerianGraphQ EulerPhi Evaluatable Evaluate Evaluated EvaluatePacket EvaluationCell EvaluationCompletionAction EvaluationElements EvaluationMode EvaluationMonitor EvaluationNotebook EvaluationObject EvaluationOrder Evaluator EvaluatorNames EvenQ EventData EventEvaluator EventHandler EventHandlerTag EventLabels ExactBlackmanWindow ExactNumberQ ExactRootIsolation ExampleData Except ExcludedForms ExcludePods Exclusions ExclusionsStyle Exists Exit ExitDialog Exp Expand ExpandAll ExpandDenominator ExpandFileName ExpandNumerator Expectation ExpectationE ExpectedValue ExpGammaDistribution ExpIntegralE ExpIntegralEi Exponent ExponentFunction ExponentialDistribution ExponentialFamily ExponentialGeneratingFunction ExponentialMovingAverage ExponentialPowerDistribution ExponentPosition ExponentStep Export ExportAutoReplacements ExportPacket ExportString Expression ExpressionCell ExpressionPacket ExpToTrig ExtendedGCD Extension ExtentElementFunction ExtentMarkers ExtentSize ExternalCall ExternalDataCharacterEncoding Extract ExtractArchive ExtremeValueDistribution ' +
            'FaceForm FaceGrids FaceGridsStyle Factor FactorComplete Factorial Factorial2 FactorialMoment FactorialMomentGeneratingFunction FactorialPower FactorInteger FactorList FactorSquareFree FactorSquareFreeList FactorTerms FactorTermsList Fail FailureDistribution False FARIMAProcess FEDisableConsolePrintPacket FeedbackSector FeedbackSectorStyle FeedbackType FEEnableConsolePrintPacket Fibonacci FieldHint FieldHintStyle FieldMasked FieldSize File FileBaseName FileByteCount FileDate FileExistsQ FileExtension FileFormat FileHash FileInformation FileName FileNameDepth FileNameDialogSettings FileNameDrop FileNameJoin FileNames FileNameSetter FileNameSplit FileNameTake FilePrint FileType FilledCurve FilledCurveBox Filling FillingStyle FillingTransform FilterRules FinancialBond FinancialData FinancialDerivative FinancialIndicator Find FindArgMax FindArgMin FindClique FindClusters FindCurvePath FindDistributionParameters FindDivisions FindEdgeCover FindEdgeCut FindEulerianCycle FindFaces FindFile FindFit FindGeneratingFunction FindGeoLocation FindGeometricTransform FindGraphCommunities FindGraphIsomorphism FindGraphPartition FindHamiltonianCycle FindIndependentEdgeSet FindIndependentVertexSet FindInstance FindIntegerNullVector FindKClan FindKClique FindKClub FindKPlex FindLibrary FindLinearRecurrence FindList FindMaximum FindMaximumFlow FindMaxValue FindMinimum FindMinimumCostFlow FindMinimumCut FindMinValue FindPermutation FindPostmanTour FindProcessParameters FindRoot FindSequenceFunction FindSettings FindShortestPath FindShortestTour FindThreshold FindVertexCover FindVertexCut Fine FinishDynamic FiniteAbelianGroupCount FiniteGroupCount FiniteGroupData First FirstPassageTimeDistribution FischerGroupFi22 FischerGroupFi23 FischerGroupFi24Prime FisherHypergeometricDistribution FisherRatioTest FisherZDistribution Fit FitAll FittedModel FixedPoint FixedPointList FlashSelection Flat Flatten FlattenAt FlatTopWindow FlipView Floor FlushPrintOutputPacket Fold FoldList Font FontColor FontFamily FontForm FontName FontOpacity FontPostScriptName FontProperties FontReencoding FontSize FontSlant FontSubstitutions FontTracking FontVariations FontWeight For ForAll Format FormatRules FormatType FormatTypeAutoConvert FormatValues FormBox FormBoxOptions FortranForm Forward ForwardBackward Fourier FourierCoefficient FourierCosCoefficient FourierCosSeries FourierCosTransform FourierDCT FourierDCTFilter FourierDCTMatrix FourierDST FourierDSTMatrix FourierMatrix FourierParameters FourierSequenceTransform FourierSeries FourierSinCoefficient FourierSinSeries FourierSinTransform FourierTransform FourierTrigSeries FractionalBrownianMotionProcess FractionalPart FractionBox FractionBoxOptions FractionLine Frame FrameBox FrameBoxOptions Framed FrameInset FrameLabel Frameless FrameMargins FrameStyle FrameTicks FrameTicksStyle FRatioDistribution FrechetDistribution FreeQ FrequencySamplingFilterKernel FresnelC FresnelS Friday FrobeniusNumber FrobeniusSolve ' +
            'FromCharacterCode FromCoefficientRules FromContinuedFraction FromDate FromDigits FromDMS Front FrontEndDynamicExpression FrontEndEventActions FrontEndExecute FrontEndObject FrontEndResource FrontEndResourceString FrontEndStackSize FrontEndToken FrontEndTokenExecute FrontEndValueCache FrontEndVersion FrontFaceColor FrontFaceOpacity Full FullAxes FullDefinition FullForm FullGraphics FullOptions FullSimplify Function FunctionExpand FunctionInterpolation FunctionSpace FussellVeselyImportance ' +
            'GaborFilter GaborMatrix GaborWavelet GainMargins GainPhaseMargins Gamma GammaDistribution GammaRegularized GapPenalty Gather GatherBy GaugeFaceElementFunction GaugeFaceStyle GaugeFrameElementFunction GaugeFrameSize GaugeFrameStyle GaugeLabels GaugeMarkers GaugeStyle GaussianFilter GaussianIntegers GaussianMatrix GaussianWindow GCD GegenbauerC General GeneralizedLinearModelFit GenerateConditions GeneratedCell GeneratedParameters GeneratingFunction Generic GenericCylindricalDecomposition GenomeData GenomeLookup GeodesicClosing GeodesicDilation GeodesicErosion GeodesicOpening GeoDestination GeodesyData GeoDirection GeoDistance GeoGridPosition GeometricBrownianMotionProcess GeometricDistribution GeometricMean GeometricMeanFilter GeometricTransformation GeometricTransformation3DBox GeometricTransformation3DBoxOptions GeometricTransformationBox GeometricTransformationBoxOptions GeoPosition GeoPositionENU GeoPositionXYZ GeoProjectionData GestureHandler GestureHandlerTag Get GetBoundingBoxSizePacket GetContext GetEnvironment GetFileName GetFrontEndOptionsDataPacket GetLinebreakInformationPacket GetMenusPacket GetPageBreakInformationPacket Glaisher GlobalClusteringCoefficient GlobalPreferences GlobalSession Glow GoldenRatio GompertzMakehamDistribution GoodmanKruskalGamma GoodmanKruskalGammaTest Goto Grad Gradient GradientFilter GradientOrientationFilter Graph GraphAssortativity GraphCenter GraphComplement GraphData GraphDensity GraphDiameter GraphDifference GraphDisjointUnion ' +
            'GraphDistance GraphDistanceMatrix GraphElementData GraphEmbedding GraphHighlight GraphHighlightStyle GraphHub Graphics Graphics3D Graphics3DBox Graphics3DBoxOptions GraphicsArray GraphicsBaseline GraphicsBox GraphicsBoxOptions GraphicsColor GraphicsColumn GraphicsComplex GraphicsComplex3DBox GraphicsComplex3DBoxOptions GraphicsComplexBox GraphicsComplexBoxOptions GraphicsContents GraphicsData GraphicsGrid GraphicsGridBox GraphicsGroup GraphicsGroup3DBox GraphicsGroup3DBoxOptions GraphicsGroupBox GraphicsGroupBoxOptions GraphicsGrouping GraphicsHighlightColor GraphicsRow GraphicsSpacing GraphicsStyle GraphIntersection GraphLayout GraphLinkEfficiency GraphPeriphery GraphPlot GraphPlot3D GraphPower GraphPropertyDistribution GraphQ GraphRadius GraphReciprocity GraphRoot GraphStyle GraphUnion Gray GrayLevel GreatCircleDistance Greater GreaterEqual GreaterEqualLess GreaterFullEqual GreaterGreater GreaterLess GreaterSlantEqual GreaterTilde Green Grid GridBaseline GridBox GridBoxAlignment GridBoxBackground GridBoxDividers GridBoxFrame GridBoxItemSize GridBoxItemStyle GridBoxOptions GridBoxSpacings GridCreationSettings GridDefaultElement GridElementStyleOptions GridFrame GridFrameMargins GridGraph GridLines GridLinesStyle GroebnerBasis GroupActionBase GroupCentralizer GroupElementFromWord GroupElementPosition GroupElementQ GroupElements GroupElementToWord GroupGenerators GroupMultiplicationTable GroupOrbits GroupOrder GroupPageBreakWithin GroupSetwiseStabilizer GroupStabilizer GroupStabilizerChain Gudermannian GumbelDistribution ' +
            'HaarWavelet HadamardMatrix HalfNormalDistribution HamiltonianGraphQ HammingDistance HammingWindow HankelH1 HankelH2 HankelMatrix HannPoissonWindow HannWindow HaradaNortonGroupHN HararyGraph HarmonicMean HarmonicMeanFilter HarmonicNumber Hash HashTable Haversine HazardFunction Head HeadCompose Heads HeavisideLambda HeavisidePi HeavisideTheta HeldGroupHe HeldPart HelpBrowserLookup HelpBrowserNotebook HelpBrowserSettings HermiteDecomposition HermiteH HermitianMatrixQ HessenbergDecomposition Hessian HexadecimalCharacter Hexahedron HexahedronBox HexahedronBoxOptions HiddenSurface HighlightGraph HighlightImage HighpassFilter HigmanSimsGroupHS HilbertFilter HilbertMatrix Histogram Histogram3D HistogramDistribution HistogramList HistogramTransform HistogramTransformInterpolation HitMissTransform HITSCentrality HodgeDual HoeffdingD HoeffdingDTest Hold HoldAll HoldAllComplete HoldComplete HoldFirst HoldForm HoldPattern HoldRest HolidayCalendar HomeDirectory HomePage Horizontal HorizontalForm HorizontalGauge HorizontalScrollPosition HornerForm HotellingTSquareDistribution HoytDistribution HTMLSave Hue HumpDownHump HumpEqual HurwitzLerchPhi HurwitzZeta HyperbolicDistribution HypercubeGraph HyperexponentialDistribution Hyperfactorial Hypergeometric0F1 Hypergeometric0F1Regularized Hypergeometric1F1 Hypergeometric1F1Regularized Hypergeometric2F1 Hypergeometric2F1Regularized HypergeometricDistribution HypergeometricPFQ HypergeometricPFQRegularized HypergeometricU Hyperlink HyperlinkCreationSettings Hyphenation HyphenationOptions HypoexponentialDistribution HypothesisTestData ' +
            'I Identity IdentityMatrix If IgnoreCase Im Image Image3D Image3DSlices ImageAccumulate ImageAdd ImageAdjust ImageAlign ImageApply ImageAspectRatio ImageAssemble ImageCache ImageCacheValid ImageCapture ImageChannels ImageClip ImageColorSpace ImageCompose ImageConvolve ImageCooccurrence ImageCorners ImageCorrelate ImageCorrespondingPoints ImageCrop ImageData ImageDataPacket ImageDeconvolve ImageDemosaic ImageDifference ImageDimensions ImageDistance ImageEffect ImageFeatureTrack ImageFileApply ImageFileFilter ImageFileScan ImageFilter ImageForestingComponents ImageForwardTransformation ImageHistogram ImageKeypoints ImageLevels ImageLines ImageMargins ImageMarkers ImageMeasurements ImageMultiply ImageOffset ImagePad ImagePadding ImagePartition ImagePeriodogram ImagePerspectiveTransformation ImageQ ImageRangeCache ImageReflect ImageRegion ImageResize ImageResolution ImageRotate ImageRotated ImageScaled ImageScan ImageSize ImageSizeAction ImageSizeCache ImageSizeMultipliers ImageSizeRaw ImageSubtract ImageTake ImageTransformation ImageTrim ImageType ImageValue ImageValuePositions Implies Import ImportAutoReplacements ImportString ImprovementImportance In IncidenceGraph IncidenceList IncidenceMatrix IncludeConstantBasis IncludeFileExtension IncludePods IncludeSingularTerm Increment Indent IndentingNewlineSpacings IndentMaxFraction IndependenceTest IndependentEdgeSetQ IndependentUnit IndependentVertexSetQ Indeterminate IndexCreationOptions Indexed IndexGraph IndexTag Inequality InexactNumberQ InexactNumbers Infinity Infix Information Inherited InheritScope Initialization InitializationCell InitializationCellEvaluation InitializationCellWarning InlineCounterAssignments InlineCounterIncrements InlineRules Inner Inpaint Input InputAliases InputAssumptions InputAutoReplacements InputField InputFieldBox InputFieldBoxOptions InputForm InputGrouping InputNamePacket InputNotebook InputPacket InputSettings InputStream InputString InputStringPacket InputToBoxFormPacket Insert InsertionPointObject InsertResults Inset Inset3DBox Inset3DBoxOptions InsetBox InsetBoxOptions Install InstallService InString Integer IntegerDigits IntegerExponent IntegerLength IntegerPart IntegerPartitions IntegerQ Integers IntegerString Integral Integrate Interactive InteractiveTradingChart Interlaced Interleaving InternallyBalancedDecomposition InterpolatingFunction InterpolatingPolynomial Interpolation InterpolationOrder InterpolationPoints InterpolationPrecision Interpretation InterpretationBox InterpretationBoxOptions InterpretationFunction ' +
            'InterpretTemplate InterquartileRange Interrupt InterruptSettings Intersection Interval IntervalIntersection IntervalMemberQ IntervalUnion Inverse InverseBetaRegularized InverseCDF InverseChiSquareDistribution InverseContinuousWaveletTransform InverseDistanceTransform InverseEllipticNomeQ InverseErf InverseErfc InverseFourier InverseFourierCosTransform InverseFourierSequenceTransform InverseFourierSinTransform InverseFourierTransform InverseFunction InverseFunctions InverseGammaDistribution InverseGammaRegularized InverseGaussianDistribution InverseGudermannian InverseHaversine InverseJacobiCD InverseJacobiCN InverseJacobiCS InverseJacobiDC InverseJacobiDN InverseJacobiDS InverseJacobiNC InverseJacobiND InverseJacobiNS InverseJacobiSC InverseJacobiSD InverseJacobiSN InverseLaplaceTransform InversePermutation InverseRadon InverseSeries InverseSurvivalFunction InverseWaveletTransform InverseWeierstrassP InverseZTransform Invisible InvisibleApplication InvisibleTimes IrreduciblePolynomialQ IsolatingInterval IsomorphicGraphQ IsotopeData Italic Item ItemBox ItemBoxOptions ItemSize ItemStyle ItoProcess ' +
            'JaccardDissimilarity JacobiAmplitude Jacobian JacobiCD JacobiCN JacobiCS JacobiDC JacobiDN JacobiDS JacobiNC JacobiND JacobiNS JacobiP JacobiSC JacobiSD JacobiSN JacobiSymbol JacobiZeta JankoGroupJ1 JankoGroupJ2 JankoGroupJ3 JankoGroupJ4 JarqueBeraALMTest JohnsonDistribution Join Joined JoinedCurve JoinedCurveBox JoinForm JordanDecomposition JordanModelDecomposition ' +
            'K KagiChart KaiserBesselWindow KaiserWindow KalmanEstimator KalmanFilter KarhunenLoeveDecomposition KaryTree KatzCentrality KCoreComponents KDistribution KelvinBei KelvinBer KelvinKei KelvinKer KendallTau KendallTauTest KernelExecute KernelMixtureDistribution KernelObject Kernels Ket Khinchin KirchhoffGraph KirchhoffMatrix KleinInvariantJ KnightTourGraph KnotData KnownUnitQ KolmogorovSmirnovTest KroneckerDelta KroneckerModelDecomposition KroneckerProduct KroneckerSymbol KuiperTest KumaraswamyDistribution Kurtosis KuwaharaFilter ' +
            'Label Labeled LabeledSlider LabelingFunction LabelStyle LaguerreL LambdaComponents LambertW LanczosWindow LandauDistribution Language LanguageCategory LaplaceDistribution LaplaceTransform Laplacian LaplacianFilter LaplacianGaussianFilter Large Larger Last Latitude LatitudeLongitude LatticeData LatticeReduce Launch LaunchKernels LayeredGraphPlot LayerSizeFunction LayoutInformation LCM LeafCount LeapYearQ LeastSquares LeastSquaresFilterKernel Left LeftArrow LeftArrowBar LeftArrowRightArrow LeftDownTeeVector LeftDownVector LeftDownVectorBar LeftRightArrow LeftRightVector LeftTee LeftTeeArrow LeftTeeVector LeftTriangle LeftTriangleBar LeftTriangleEqual LeftUpDownVector LeftUpTeeVector LeftUpVector LeftUpVectorBar LeftVector LeftVectorBar LegendAppearance Legended LegendFunction LegendLabel LegendLayout LegendMargins LegendMarkers LegendMarkerSize LegendreP LegendreQ LegendreType Length LengthWhile LerchPhi Less LessEqual LessEqualGreater LessFullEqual LessGreater LessLess LessSlantEqual LessTilde LetterCharacter LetterQ Level LeveneTest LeviCivitaTensor LevyDistribution Lexicographic LibraryFunction LibraryFunctionError LibraryFunctionInformation LibraryFunctionLoad LibraryFunctionUnload LibraryLoad LibraryUnload LicenseID LiftingFilterData LiftingWaveletTransform LightBlue LightBrown LightCyan Lighter LightGray LightGreen Lighting LightingAngle LightMagenta LightOrange LightPink LightPurple LightRed LightSources LightYellow Likelihood Limit LimitsPositioning LimitsPositioningTokens LindleyDistribution Line Line3DBox LinearFilter LinearFractionalTransform LinearModelFit LinearOffsetFunction LinearProgramming LinearRecurrence LinearSolve LinearSolveFunction LineBox LineBreak LinebreakAdjustments LineBreakChart LineBreakWithin LineColor LineForm LineGraph LineIndent LineIndentMaxFraction LineIntegralConvolutionPlot LineIntegralConvolutionScale LineLegend LineOpacity LineSpacing LineWrapParts LinkActivate LinkClose LinkConnect LinkConnectedQ LinkCreate LinkError LinkFlush LinkFunction LinkHost LinkInterrupt LinkLaunch LinkMode LinkObject LinkOpen LinkOptions LinkPatterns LinkProtocol LinkRead LinkReadHeld LinkReadyQ Links LinkWrite LinkWriteHeld LiouvilleLambda List Listable ListAnimate ListContourPlot ListContourPlot3D ListConvolve ListCorrelate ListCurvePathPlot ListDeconvolve ListDensityPlot Listen ListFourierSequenceTransform ListInterpolation ListLineIntegralConvolutionPlot ListLinePlot ListLogLinearPlot ListLogLogPlot ListLogPlot ListPicker ListPickerBox ListPickerBoxBackground ListPickerBoxOptions ListPlay ListPlot ListPlot3D ListPointPlot3D ListPolarPlot ListQ ListStreamDensityPlot ListStreamPlot ListSurfacePlot3D ListVectorDensityPlot ListVectorPlot ListVectorPlot3D ListZTransform Literal LiteralSearch LocalClusteringCoefficient LocalizeVariables LocationEquivalenceTest LocationTest Locator LocatorAutoCreate LocatorBox LocatorBoxOptions LocatorCentering LocatorPane LocatorPaneBox LocatorPaneBoxOptions ' +
            'LocatorRegion Locked Log Log10 Log2 LogBarnesG LogGamma LogGammaDistribution LogicalExpand LogIntegral LogisticDistribution LogitModelFit LogLikelihood LogLinearPlot LogLogisticDistribution LogLogPlot LogMultinormalDistribution LogNormalDistribution LogPlot LogRankTest LogSeriesDistribution LongEqual Longest LongestAscendingSequence LongestCommonSequence LongestCommonSequencePositions LongestCommonSubsequence LongestCommonSubsequencePositions LongestMatch LongForm Longitude LongLeftArrow LongLeftRightArrow LongRightArrow Loopback LoopFreeGraphQ LowerCaseQ LowerLeftArrow LowerRightArrow LowerTriangularize LowpassFilter LQEstimatorGains LQGRegulator LQOutputRegulatorGains LQRegulatorGains LUBackSubstitution LucasL LuccioSamiComponents LUDecomposition LyapunovSolve LyonsGroupLy ' +
            'MachineID MachineName MachineNumberQ MachinePrecision MacintoshSystemPageSetup Magenta Magnification Magnify MainSolve MaintainDynamicCaches Majority MakeBoxes MakeExpression MakeRules MangoldtLambda ManhattanDistance Manipulate Manipulator MannWhitneyTest MantissaExponent Manual Map MapAll MapAt MapIndexed MAProcess MapThread MarcumQ MardiaCombinedTest MardiaKurtosisTest MardiaSkewnessTest MarginalDistribution MarkovProcessProperties Masking MatchingDissimilarity MatchLocalNameQ MatchLocalNames MatchQ Material MathematicaNotation MathieuC MathieuCharacteristicA MathieuCharacteristicB MathieuCharacteristicExponent MathieuCPrime MathieuGroupM11 MathieuGroupM12 MathieuGroupM22 MathieuGroupM23 MathieuGroupM24 MathieuS MathieuSPrime MathMLForm MathMLText Matrices MatrixExp MatrixForm MatrixFunction MatrixLog MatrixPlot MatrixPower MatrixQ MatrixRank Max MaxBend MaxDetect MaxExtraBandwidths MaxExtraConditions MaxFeatures MaxFilter Maximize MaxIterations MaxMemoryUsed MaxMixtureKernels MaxPlotPoints MaxPoints MaxRecursion MaxStableDistribution MaxStepFraction MaxSteps MaxStepSize MaxValue MaxwellDistribution McLaughlinGroupMcL Mean MeanClusteringCoefficient MeanDegreeConnectivity MeanDeviation MeanFilter MeanGraphDistance MeanNeighborDegree MeanShift MeanShiftFilter Median MedianDeviation MedianFilter Medium MeijerG MeixnerDistribution MemberQ MemoryConstrained MemoryInUse Menu MenuAppearance MenuCommandKey MenuEvaluator MenuItem MenuPacket MenuSortingValue MenuStyle MenuView MergeDifferences Mesh MeshFunctions MeshRange MeshShading MeshStyle Message MessageDialog MessageList MessageName MessageOptions MessagePacket Messages MessagesNotebook MetaCharacters MetaInformation Method MethodOptions MexicanHatWavelet MeyerWavelet Min MinDetect MinFilter MinimalPolynomial MinimalStateSpaceModel Minimize Minors MinRecursion MinSize MinStableDistribution Minus MinusPlus MinValue Missing MissingDataMethod MittagLefflerE MixedRadix MixedRadixQuantity MixtureDistribution Mod Modal Mode Modular ModularLambda Module Modulus MoebiusMu Moment Momentary MomentConvert MomentEvaluate MomentGeneratingFunction Monday Monitor MonomialList MonomialOrder MonsterGroupM MorletWavelet MorphologicalBinarize MorphologicalBranchPoints MorphologicalComponents MorphologicalEulerNumber MorphologicalGraph MorphologicalPerimeter MorphologicalTransform Most MouseAnnotation MouseAppearance MouseAppearanceTag MouseButtons Mouseover MousePointerNote MousePosition MovingAverage MovingMedian MoyalDistribution MultiedgeStyle MultilaunchWarning MultiLetterItalics MultiLetterStyle MultilineFunction Multinomial MultinomialDistribution MultinormalDistribution MultiplicativeOrder Multiplicity Multiselection MultivariateHypergeometricDistribution MultivariatePoissonDistribution MultivariateTDistribution ' +
            'N NakagamiDistribution NameQ Names NamespaceBox Nand NArgMax NArgMin NBernoulliB NCache NDSolve NDSolveValue Nearest NearestFunction NeedCurrentFrontEndPackagePacket NeedCurrentFrontEndSymbolsPacket NeedlemanWunschSimilarity Needs Negative NegativeBinomialDistribution NegativeMultinomialDistribution NeighborhoodGraph Nest NestedGreaterGreater NestedLessLess NestedScriptRules NestList NestWhile NestWhileList NevilleThetaC NevilleThetaD NevilleThetaN NevilleThetaS NewPrimitiveStyle NExpectation Next NextPrime NHoldAll NHoldFirst NHoldRest NicholsGridLines NicholsPlot NIntegrate NMaximize NMaxValue NMinimize NMinValue NominalVariables NonAssociative NoncentralBetaDistribution NoncentralChiSquareDistribution NoncentralFRatioDistribution NoncentralStudentTDistribution NonCommutativeMultiply NonConstants None NonlinearModelFit NonlocalMeansFilter NonNegative NonPositive Nor NorlundB Norm Normal NormalDistribution NormalGrouping Normalize NormalizedSquaredEuclideanDistance NormalsFunction NormFunction Not NotCongruent NotCupCap NotDoubleVerticalBar Notebook NotebookApply NotebookAutoSave NotebookClose NotebookConvertSettings NotebookCreate NotebookCreateReturnObject NotebookDefault NotebookDelete NotebookDirectory NotebookDynamicExpression NotebookEvaluate NotebookEventActions NotebookFileName NotebookFind NotebookFindReturnObject NotebookGet NotebookGetLayoutInformationPacket NotebookGetMisspellingsPacket NotebookInformation NotebookInterfaceObject NotebookLocate NotebookObject NotebookOpen NotebookOpenReturnObject NotebookPath NotebookPrint NotebookPut NotebookPutReturnObject NotebookRead NotebookResetGeneratedCells Notebooks NotebookSave NotebookSaveAs NotebookSelection NotebookSetupLayoutInformationPacket NotebooksMenu NotebookWrite NotElement NotEqualTilde NotExists NotGreater NotGreaterEqual NotGreaterFullEqual NotGreaterGreater NotGreaterLess NotGreaterSlantEqual NotGreaterTilde NotHumpDownHump NotHumpEqual NotLeftTriangle NotLeftTriangleBar NotLeftTriangleEqual NotLess NotLessEqual NotLessFullEqual NotLessGreater NotLessLess NotLessSlantEqual NotLessTilde NotNestedGreaterGreater NotNestedLessLess NotPrecedes NotPrecedesEqual NotPrecedesSlantEqual NotPrecedesTilde NotReverseElement NotRightTriangle NotRightTriangleBar NotRightTriangleEqual NotSquareSubset NotSquareSubsetEqual NotSquareSuperset NotSquareSupersetEqual NotSubset NotSubsetEqual NotSucceeds NotSucceedsEqual NotSucceedsSlantEqual NotSucceedsTilde NotSuperset NotSupersetEqual NotTilde NotTildeEqual NotTildeFullEqual NotTildeTilde NotVerticalBar NProbability NProduct NProductFactors NRoots NSolve NSum NSumTerms Null NullRecords NullSpace NullWords Number NumberFieldClassNumber NumberFieldDiscriminant NumberFieldFundamentalUnits NumberFieldIntegralBasis NumberFieldNormRepresentatives NumberFieldRegulator NumberFieldRootsOfUnity NumberFieldSignature NumberForm NumberFormat NumberMarks NumberMultiplier NumberPadding NumberPoint NumberQ NumberSeparator ' +
            'NumberSigns NumberString Numerator NumericFunction NumericQ NuttallWindow NValues NyquistGridLines NyquistPlot ' +
            'O ObservabilityGramian ObservabilityMatrix ObservableDecomposition ObservableModelQ OddQ Off Offset OLEData On ONanGroupON OneIdentity Opacity Open OpenAppend Opener OpenerBox OpenerBoxOptions OpenerView OpenFunctionInspectorPacket Opening OpenRead OpenSpecialOptions OpenTemporary OpenWrite Operate OperatingSystem OptimumFlowData Optional OptionInspectorSettings OptionQ Options OptionsPacket OptionsPattern OptionValue OptionValueBox OptionValueBoxOptions Or Orange Order OrderDistribution OrderedQ Ordering Orderless OrnsteinUhlenbeckProcess Orthogonalize Out Outer OutputAutoOverwrite OutputControllabilityMatrix OutputControllableModelQ OutputForm OutputFormData OutputGrouping OutputMathEditExpression OutputNamePacket OutputResponse OutputSizeLimit OutputStream Over OverBar OverDot Overflow OverHat Overlaps Overlay OverlayBox OverlayBoxOptions Overscript OverscriptBox OverscriptBoxOptions OverTilde OverVector OwenT OwnValues ' +
            'PackingMethod PaddedForm Padding PadeApproximant PadLeft PadRight PageBreakAbove PageBreakBelow PageBreakWithin PageFooterLines PageFooters PageHeaderLines PageHeaders PageHeight PageRankCentrality PageWidth PairedBarChart PairedHistogram PairedSmoothHistogram PairedTTest PairedZTest PaletteNotebook PalettePath Pane PaneBox PaneBoxOptions Panel PanelBox PanelBoxOptions Paneled PaneSelector PaneSelectorBox PaneSelectorBoxOptions PaperWidth ParabolicCylinderD ParagraphIndent ParagraphSpacing ParallelArray ParallelCombine ParallelDo ParallelEvaluate Parallelization Parallelize ParallelMap ParallelNeeds ParallelProduct ParallelSubmit ParallelSum ParallelTable ParallelTry Parameter ParameterEstimator ParameterMixtureDistribution ParameterVariables ParametricFunction ParametricNDSolve ParametricNDSolveValue ParametricPlot ParametricPlot3D ParentConnect ParentDirectory ParentForm Parenthesize ParentList ParetoDistribution Part PartialCorrelationFunction PartialD ParticleData Partition PartitionsP PartitionsQ ParzenWindow PascalDistribution PassEventsDown PassEventsUp Paste PasteBoxFormInlineCells PasteButton Path PathGraph PathGraphQ Pattern PatternSequence PatternTest PauliMatrix PaulWavelet Pause PausedTime PDF PearsonChiSquareTest PearsonCorrelationTest PearsonDistribution PerformanceGoal PeriodicInterpolation Periodogram PeriodogramArray PermutationCycles PermutationCyclesQ PermutationGroup PermutationLength PermutationList PermutationListQ PermutationMax PermutationMin PermutationOrder PermutationPower PermutationProduct PermutationReplace Permutations PermutationSupport Permute PeronaMalikFilter Perpendicular PERTDistribution PetersenGraph PhaseMargins Pi Pick PIDData PIDDerivativeFilter PIDFeedforward PIDTune Piecewise PiecewiseExpand PieChart PieChart3D PillaiTrace PillaiTraceTest Pink Pivoting PixelConstrained PixelValue PixelValuePositions Placed Placeholder PlaceholderReplace Plain PlanarGraphQ Play PlayRange Plot Plot3D Plot3Matrix PlotDivision PlotJoined PlotLabel PlotLayout PlotLegends PlotMarkers PlotPoints PlotRange PlotRangeClipping PlotRangePadding PlotRegion PlotStyle Plus PlusMinus Pochhammer PodStates PodWidth Point Point3DBox PointBox PointFigureChart PointForm PointLegend PointSize PoissonConsulDistribution PoissonDistribution PoissonProcess PoissonWindow PolarAxes PolarAxesOrigin PolarGridLines PolarPlot PolarTicks PoleZeroMarkers PolyaAeppliDistribution PolyGamma Polygon Polygon3DBox Polygon3DBoxOptions PolygonBox PolygonBoxOptions PolygonHoleScale PolygonIntersections PolygonScale PolyhedronData PolyLog PolynomialExtendedGCD PolynomialForm PolynomialGCD PolynomialLCM PolynomialMod PolynomialQ PolynomialQuotient PolynomialQuotientRemainder PolynomialReduce PolynomialRemainder Polynomials PopupMenu PopupMenuBox PopupMenuBoxOptions PopupView PopupWindow Position Positive PositiveDefiniteMatrixQ PossibleZeroQ Postfix PostScript Power PowerDistribution PowerExpand PowerMod PowerModList ' +
            'PowerSpectralDensity PowersRepresentations PowerSymmetricPolynomial Precedence PrecedenceForm Precedes PrecedesEqual PrecedesSlantEqual PrecedesTilde Precision PrecisionGoal PreDecrement PredictionRoot PreemptProtect PreferencesPath Prefix PreIncrement Prepend PrependTo PreserveImageOptions Previous PriceGraphDistribution PrimaryPlaceholder Prime PrimeNu PrimeOmega PrimePi PrimePowerQ PrimeQ Primes PrimeZetaP PrimitiveRoot PrincipalComponents PrincipalValue Print PrintAction PrintForm PrintingCopies PrintingOptions PrintingPageRange PrintingStartingPageNumber PrintingStyleEnvironment PrintPrecision PrintTemporary Prism PrismBox PrismBoxOptions PrivateCellOptions PrivateEvaluationOptions PrivateFontOptions PrivateFrontEndOptions PrivateNotebookOptions PrivatePaths Probability ProbabilityDistribution ProbabilityPlot ProbabilityPr ProbabilityScalePlot ProbitModelFit ProcessEstimator ProcessParameterAssumptions ProcessParameterQ ProcessStateDomain ProcessTimeDomain Product ProductDistribution ProductLog ProgressIndicator ProgressIndicatorBox ProgressIndicatorBoxOptions Projection Prolog PromptForm Properties Property PropertyList PropertyValue Proportion Proportional Protect Protected ProteinData Pruning PseudoInverse Purple Put PutAppend Pyramid PyramidBox PyramidBoxOptions ' +
            'QBinomial QFactorial QGamma QHypergeometricPFQ QPochhammer QPolyGamma QRDecomposition QuadraticIrrationalQ Quantile QuantilePlot Quantity QuantityForm QuantityMagnitude QuantityQ QuantityUnit Quartics QuartileDeviation Quartiles QuartileSkewness QueueingNetworkProcess QueueingProcess QueueProperties Quiet Quit Quotient QuotientRemainder ' +
            'RadialityCentrality RadicalBox RadicalBoxOptions RadioButton RadioButtonBar RadioButtonBox RadioButtonBoxOptions Radon RamanujanTau RamanujanTauL RamanujanTauTheta RamanujanTauZ Random RandomChoice RandomComplex RandomFunction RandomGraph RandomImage RandomInteger RandomPermutation RandomPrime RandomReal RandomSample RandomSeed RandomVariate RandomWalkProcess Range RangeFilter RangeSpecification RankedMax RankedMin Raster Raster3D Raster3DBox Raster3DBoxOptions RasterArray RasterBox RasterBoxOptions Rasterize RasterSize Rational RationalFunctions Rationalize Rationals Ratios Raw RawArray RawBoxes RawData RawMedium RayleighDistribution Re Read ReadList ReadProtected Real RealBlockDiagonalForm RealDigits RealExponent Reals Reap Record RecordLists RecordSeparators Rectangle RectangleBox RectangleBoxOptions RectangleChart RectangleChart3D RecurrenceFilter RecurrenceTable RecurringDigitsForm Red Reduce RefBox ReferenceLineStyle ReferenceMarkers ReferenceMarkerStyle Refine ReflectionMatrix ReflectionTransform Refresh RefreshRate RegionBinarize RegionFunction RegionPlot RegionPlot3D RegularExpression Regularization Reinstall Release ReleaseHold ReliabilityDistribution ReliefImage ReliefPlot Remove RemoveAlphaChannel RemoveAsynchronousTask Removed RemoveInputStreamMethod RemoveOutputStreamMethod RemoveProperty RemoveScheduledTask RenameDirectory RenameFile RenderAll RenderingOptions RenewalProcess RenkoChart Repeated RepeatedNull RepeatedString Replace ReplaceAll ReplaceHeldPart ReplaceImageValue ReplaceList ReplacePart ReplacePixelValue ReplaceRepeated Resampling Rescale RescalingTransform ResetDirectory ResetMenusPacket ResetScheduledTask Residue Resolve Rest Resultant ResumePacket Return ReturnExpressionPacket ReturnInputFormPacket ReturnPacket ReturnTextPacket Reverse ReverseBiorthogonalSplineWavelet ReverseElement ReverseEquilibrium ReverseGraph ReverseUpEquilibrium RevolutionAxis RevolutionPlot3D RGBColor RiccatiSolve RiceDistribution RidgeFilter RiemannR RiemannSiegelTheta RiemannSiegelZ Riffle Right RightArrow RightArrowBar RightArrowLeftArrow RightCosetRepresentative RightDownTeeVector RightDownVector RightDownVectorBar RightTee RightTeeArrow RightTeeVector RightTriangle RightTriangleBar RightTriangleEqual RightUpDownVector RightUpTeeVector RightUpVector RightUpVectorBar RightVector RightVectorBar RiskAchievementImportance RiskReductionImportance RogersTanimotoDissimilarity Root RootApproximant RootIntervals RootLocusPlot RootMeanSquare RootOfUnityQ RootReduce Roots RootSum Rotate RotateLabel RotateLeft RotateRight RotationAction RotationBox RotationBoxOptions RotationMatrix RotationTransform Round RoundImplies RoundingRadius Row RowAlignments RowBackgrounds RowBox RowHeights RowLines RowMinHeight RowReduce RowsEqual RowSpacings RSolve RudvalisGroupRu Rule RuleCondition RuleDelayed RuleForm RulerUnits Run RunScheduledTask RunThrough RuntimeAttributes RuntimeOptions RussellRaoDissimilarity ' +
            'SameQ SameTest SampleDepth SampledSoundFunction SampledSoundList SampleRate SamplingPeriod SARIMAProcess SARMAProcess SatisfiabilityCount SatisfiabilityInstances SatisfiableQ Saturday Save Saveable SaveAutoDelete SaveDefinitions SawtoothWave Scale Scaled ScaleDivisions ScaledMousePosition ScaleOrigin ScalePadding ScaleRanges ScaleRangeStyle ScalingFunctions ScalingMatrix ScalingTransform Scan ScheduledTaskActiveQ ScheduledTaskData ScheduledTaskObject ScheduledTasks SchurDecomposition ScientificForm ScreenRectangle ScreenStyleEnvironment ScriptBaselineShifts ScriptLevel ScriptMinSize ScriptRules ScriptSizeMultipliers Scrollbars ScrollingOptions ScrollPosition Sec Sech SechDistribution SectionGrouping SectorChart SectorChart3D SectorOrigin SectorSpacing SeedRandom Select Selectable SelectComponents SelectedCells SelectedNotebook Selection SelectionAnimate SelectionCell SelectionCellCreateCell SelectionCellDefaultStyle SelectionCellParentStyle SelectionCreateCell SelectionDebuggerTag SelectionDuplicateCell SelectionEvaluate SelectionEvaluateCreateCell SelectionMove SelectionPlaceholder SelectionSetStyle SelectWithContents SelfLoops SelfLoopStyle SemialgebraicComponentInstances SendMail Sequence SequenceAlignment SequenceForm SequenceHold SequenceLimit Series SeriesCoefficient SeriesData SessionTime Set SetAccuracy SetAlphaChannel SetAttributes Setbacks SetBoxFormNamesPacket SetDelayed SetDirectory SetEnvironment SetEvaluationNotebook SetFileDate SetFileLoadingContext SetNotebookStatusLine SetOptions SetOptionsPacket SetPrecision SetProperty SetSelectedNotebook SetSharedFunction SetSharedVariable SetSpeechParametersPacket SetStreamPosition SetSystemOptions Setter SetterBar SetterBox SetterBoxOptions Setting SetValue Shading Shallow ShannonWavelet ShapiroWilkTest Share Sharpen ShearingMatrix ShearingTransform ShenCastanMatrix Short ShortDownArrow Shortest ShortestMatch ShortestPathFunction ShortLeftArrow ShortRightArrow ShortUpArrow Show ShowAutoStyles ShowCellBracket ShowCellLabel ShowCellTags ShowClosedCellArea ShowContents ShowControls ShowCursorTracker ShowGroupOpenCloseIcon ShowGroupOpener ShowInvisibleCharacters ShowPageBreaks ShowPredictiveInterface ShowSelection ShowShortBoxForm ShowSpecialCharacters ShowStringCharacters ShowSyntaxStyles ShrinkingDelay ShrinkWrapBoundingBox SiegelTheta SiegelTukeyTest Sign Signature SignedRankTest SignificanceLevel SignPadding SignTest SimilarityRules SimpleGraph SimpleGraphQ Simplify Sin Sinc SinghMaddalaDistribution SingleEvaluation SingleLetterItalics SingleLetterStyle SingularValueDecomposition SingularValueList SingularValuePlot SingularValues Sinh SinhIntegral SinIntegral SixJSymbol Skeleton SkeletonTransform SkellamDistribution Skewness SkewNormalDistribution Skip SliceDistribution Slider Slider2D Slider2DBox Slider2DBoxOptions SliderBox SliderBoxOptions SlideView Slot SlotSequence Small SmallCircle Smaller SmithDelayCompensator SmithWatermanSimilarity ' +
            'SmoothDensityHistogram SmoothHistogram SmoothHistogram3D SmoothKernelDistribution SocialMediaData Socket SokalSneathDissimilarity Solve SolveAlways SolveDelayed Sort SortBy Sound SoundAndGraphics SoundNote SoundVolume Sow Space SpaceForm Spacer Spacings Span SpanAdjustments SpanCharacterRounding SpanFromAbove SpanFromBoth SpanFromLeft SpanLineThickness SpanMaxSize SpanMinSize SpanningCharacters SpanSymmetric SparseArray SpatialGraphDistribution Speak SpeakTextPacket SpearmanRankTest SpearmanRho Spectrogram SpectrogramArray Specularity SpellingCorrection SpellingDictionaries SpellingDictionariesPath SpellingOptions SpellingSuggestionsPacket Sphere SphereBox SphericalBesselJ SphericalBesselY SphericalHankelH1 SphericalHankelH2 SphericalHarmonicY SphericalPlot3D SphericalRegion SpheroidalEigenvalue SpheroidalJoiningFactor SpheroidalPS SpheroidalPSPrime SpheroidalQS SpheroidalQSPrime SpheroidalRadialFactor SpheroidalS1 SpheroidalS1Prime SpheroidalS2 SpheroidalS2Prime Splice SplicedDistribution SplineClosed SplineDegree SplineKnots SplineWeights Split SplitBy SpokenString Sqrt SqrtBox SqrtBoxOptions Square SquaredEuclideanDistance SquareFreeQ SquareIntersection SquaresR SquareSubset SquareSubsetEqual SquareSuperset SquareSupersetEqual SquareUnion SquareWave StabilityMargins StabilityMarginsStyle StableDistribution Stack StackBegin StackComplete StackInhibit StandardDeviation StandardDeviationFilter StandardForm Standardize StandbyDistribution Star StarGraph StartAsynchronousTask StartingStepSize StartOfLine StartOfString StartScheduledTask StartupSound StateDimensions StateFeedbackGains StateOutputEstimator StateResponse StateSpaceModel StateSpaceRealization StateSpaceTransform StationaryDistribution StationaryWaveletPacketTransform StationaryWaveletTransform StatusArea StatusCentrality StepMonitor StieltjesGamma StirlingS1 StirlingS2 StopAsynchronousTask StopScheduledTask StrataVariables StratonovichProcess StreamColorFunction StreamColorFunctionScaling StreamDensityPlot StreamPlot StreamPoints StreamPosition Streams StreamScale StreamStyle String StringBreak StringByteCount StringCases StringCount StringDrop StringExpression StringForm StringFormat StringFreeQ StringInsert StringJoin StringLength StringMatchQ StringPosition StringQ StringReplace StringReplaceList StringReplacePart StringReverse StringRotateLeft StringRotateRight StringSkeleton StringSplit StringTake StringToStream StringTrim StripBoxes StripOnInput StripWrapperBoxes StrokeForm StructuralImportance StructuredArray StructuredSelection StruveH StruveL Stub StudentTDistribution Style StyleBox StyleBoxAutoDelete StyleBoxOptions StyleData StyleDefinitions StyleForm StyleKeyMapping StyleMenuListing StyleNameDialogSettings StyleNames StylePrint StyleSheetPath Subfactorial Subgraph SubMinus SubPlus SubresultantPolynomialRemainders ' +
            'SubresultantPolynomials Subresultants Subscript SubscriptBox SubscriptBoxOptions Subscripted Subset SubsetEqual Subsets SubStar Subsuperscript SubsuperscriptBox SubsuperscriptBoxOptions Subtract SubtractFrom SubValues Succeeds SucceedsEqual SucceedsSlantEqual SucceedsTilde SuchThat Sum SumConvergence Sunday SuperDagger SuperMinus SuperPlus Superscript SuperscriptBox SuperscriptBoxOptions Superset SupersetEqual SuperStar Surd SurdForm SurfaceColor SurfaceGraphics SurvivalDistribution SurvivalFunction SurvivalModel SurvivalModelFit SuspendPacket SuzukiDistribution SuzukiGroupSuz SwatchLegend Switch Symbol SymbolName SymletWavelet Symmetric SymmetricGroup SymmetricMatrixQ SymmetricPolynomial SymmetricReduction Symmetrize SymmetrizedArray SymmetrizedArrayRules SymmetrizedDependentComponents SymmetrizedIndependentComponents SymmetrizedReplacePart SynchronousInitialization SynchronousUpdating Syntax SyntaxForm SyntaxInformation SyntaxLength SyntaxPacket SyntaxQ SystemDialogInput SystemException SystemHelpPath SystemInformation SystemInformationData SystemOpen SystemOptions SystemsModelDelay SystemsModelDelayApproximate SystemsModelDelete SystemsModelDimensions SystemsModelExtract SystemsModelFeedbackConnect SystemsModelLabels SystemsModelOrder SystemsModelParallelConnect SystemsModelSeriesConnect SystemsModelStateFeedbackConnect SystemStub ' +
            'Tab TabFilling Table TableAlignments TableDepth TableDirections TableForm TableHeadings TableSpacing TableView TableViewBox TabSpacings TabView TabViewBox TabViewBoxOptions TagBox TagBoxNote TagBoxOptions TaggingRules TagSet TagSetDelayed TagStyle TagUnset Take TakeWhile Tally Tan Tanh TargetFunctions TargetUnits TautologyQ TelegraphProcess TemplateBox TemplateBoxOptions TemplateSlotSequence TemporalData Temporary TemporaryVariable TensorContract TensorDimensions TensorExpand TensorProduct TensorQ TensorRank TensorReduce TensorSymmetry TensorTranspose TensorWedge Tetrahedron TetrahedronBox TetrahedronBoxOptions TeXForm TeXSave Text Text3DBox Text3DBoxOptions TextAlignment TextBand TextBoundingBox TextBox TextCell TextClipboardType TextData TextForm TextJustification TextLine TextPacket TextParagraph TextRecognize TextRendering TextStyle Texture TextureCoordinateFunction TextureCoordinateScaling Therefore ThermometerGauge Thick Thickness Thin Thinning ThisLink ThompsonGroupTh Thread ThreeJSymbol Threshold Through Throw Thumbnail Thursday Ticks TicksStyle Tilde TildeEqual TildeFullEqual TildeTilde TimeConstrained TimeConstraint Times TimesBy TimeSeriesForecast TimeSeriesInvertibility TimeUsed TimeValue TimeZone Timing Tiny TitleGrouping TitsGroupT ToBoxes ToCharacterCode ToColor ToContinuousTimeModel ToDate ToDiscreteTimeModel ToeplitzMatrix ToExpression ToFileName Together Toggle ToggleFalse Toggler TogglerBar TogglerBox TogglerBoxOptions ToHeldExpression ToInvertibleTimeSeries TokenWords Tolerance ToLowerCase ToNumberField TooBig Tooltip TooltipBox TooltipBoxOptions TooltipDelay TooltipStyle Top TopHatTransform TopologicalSort ToRadicals ToRules ToString Total TotalHeight TotalVariationFilter TotalWidth TouchscreenAutoZoom TouchscreenControlPlacement ToUpperCase Tr Trace TraceAbove TraceAction TraceBackward TraceDepth TraceDialog TraceForward TraceInternal TraceLevel TraceOff TraceOn TraceOriginal TracePrint TraceScan TrackedSymbols TradingChart TraditionalForm TraditionalFunctionNotation TraditionalNotation TraditionalOrder TransferFunctionCancel TransferFunctionExpand TransferFunctionFactor TransferFunctionModel TransferFunctionPoles TransferFunctionTransform TransferFunctionZeros TransformationFunction TransformationFunctions TransformationMatrix TransformedDistribution TransformedField Translate TranslationTransform TransparentColor Transpose TreeForm TreeGraph TreeGraphQ TreePlot TrendStyle TriangleWave TriangularDistribution Trig TrigExpand TrigFactor TrigFactorList Trigger TrigReduce TrigToExp TrimmedMean True TrueQ TruncatedDistribution TsallisQExponentialDistribution TsallisQGaussianDistribution TTest Tube TubeBezierCurveBox TubeBezierCurveBoxOptions TubeBox TubeBSplineCurveBox TubeBSplineCurveBoxOptions Tuesday TukeyLambdaDistribution TukeyWindow Tuples TuranGraph TuringMachine ' +
            'Transparent ' +
            'UnateQ Uncompress Undefined UnderBar Underflow Underlined Underoverscript UnderoverscriptBox UnderoverscriptBoxOptions Underscript UnderscriptBox UnderscriptBoxOptions UndirectedEdge UndirectedGraph UndirectedGraphQ UndocumentedTestFEParserPacket UndocumentedTestGetSelectionPacket Unequal Unevaluated UniformDistribution UniformGraphDistribution UniformSumDistribution Uninstall Union UnionPlus Unique UnitBox UnitConvert UnitDimensions Unitize UnitRootTest UnitSimplify UnitStep UnitTriangle UnitVector Unprotect UnsameQ UnsavedVariables Unset UnsetShared UntrackedVariables Up UpArrow UpArrowBar UpArrowDownArrow Update UpdateDynamicObjects UpdateDynamicObjectsSynchronous UpdateInterval UpDownArrow UpEquilibrium UpperCaseQ UpperLeftArrow UpperRightArrow UpperTriangularize Upsample UpSet UpSetDelayed UpTee UpTeeArrow UpValues URL URLFetch URLFetchAsynchronous URLSave URLSaveAsynchronous UseGraphicsRange Using UsingFrontEnd ' +
            'V2Get ValidationLength Value ValueBox ValueBoxOptions ValueForm ValueQ ValuesData Variables Variance VarianceEquivalenceTest VarianceEstimatorFunction VarianceGammaDistribution VarianceTest VectorAngle VectorColorFunction VectorColorFunctionScaling VectorDensityPlot VectorGlyphData VectorPlot VectorPlot3D VectorPoints VectorQ Vectors VectorScale VectorStyle Vee Verbatim Verbose VerboseConvertToPostScriptPacket VerifyConvergence VerifySolutions VerifyTestAssumptions Version VersionNumber VertexAdd VertexCapacity VertexColors VertexComponent VertexConnectivity VertexCoordinateRules VertexCoordinates VertexCorrelationSimilarity VertexCosineSimilarity VertexCount VertexCoverQ VertexDataCoordinates VertexDegree VertexDelete VertexDiceSimilarity VertexEccentricity VertexInComponent VertexInDegree VertexIndex VertexJaccardSimilarity VertexLabeling VertexLabels VertexLabelStyle VertexList VertexNormals VertexOutComponent VertexOutDegree VertexQ VertexRenderingFunction VertexReplace VertexShape VertexShapeFunction VertexSize VertexStyle VertexTextureCoordinates VertexWeight Vertical VerticalBar VerticalForm VerticalGauge VerticalSeparator VerticalSlider VerticalTilde ViewAngle ViewCenter ViewMatrix ViewPoint ViewPointSelectorSettings ViewPort ViewRange ViewVector ViewVertical VirtualGroupData Visible VisibleCell VoigtDistribution VonMisesDistribution ' +
            'WaitAll WaitAsynchronousTask WaitNext WaitUntil WakebyDistribution WalleniusHypergeometricDistribution WaringYuleDistribution WatershedComponents WatsonUSquareTest WattsStrogatzGraphDistribution WaveletBestBasis WaveletFilterCoefficients WaveletImagePlot WaveletListPlot WaveletMapIndexed WaveletMatrixPlot WaveletPhi WaveletPsi WaveletScale WaveletScalogram WaveletThreshold WeaklyConnectedComponents WeaklyConnectedGraphQ WeakStationarity WeatherData WeberE Wedge Wednesday WeibullDistribution WeierstrassHalfPeriods WeierstrassInvariants WeierstrassP WeierstrassPPrime WeierstrassSigma WeierstrassZeta WeightedAdjacencyGraph WeightedAdjacencyMatrix WeightedData WeightedGraphQ Weights WelchWindow WheelGraph WhenEvent Which While White Whitespace WhitespaceCharacter WhittakerM WhittakerW WienerFilter WienerProcess WignerD WignerSemicircleDistribution WilksW WilksWTest WindowClickSelect WindowElements WindowFloating WindowFrame WindowFrameElements WindowMargins WindowMovable WindowOpacity WindowSelected WindowSize WindowStatusArea WindowTitle WindowToolbars WindowWidth With WolframAlpha WolframAlphaDate WolframAlphaQuantity WolframAlphaResult Word WordBoundary WordCharacter WordData WordSearch WordSeparators WorkingPrecision Write WriteString Wronskian ' +
            'XMLElement XMLObject Xnor Xor ' +
            'Yellow YuleDissimilarity ' +
            'ZernikeR ZeroSymmetric ZeroTest ZeroWidthTimes Zeta ZetaZero ZipfDistribution ZTest ZTransform ' +
            '$Aborted $ActivationGroupID $ActivationKey $ActivationUserRegistered $AddOnsDirectory $AssertFunction $Assumptions $AsynchronousTask $BaseDirectory $BatchInput $BatchOutput $BoxForms $ByteOrdering $Canceled $CharacterEncoding $CharacterEncodings $CommandLine $CompilationTarget $ConditionHold $ConfiguredKernels $Context $ContextPath $ControlActiveSetting $CreationDate $CurrentLink $DateStringFormat $DefaultFont $DefaultFrontEnd $DefaultImagingDevice $DefaultPath $Display $DisplayFunction $DistributedContexts $DynamicEvaluation $Echo $Epilog $ExportFormats $Failed $FinancialDataSource $FormatType $FrontEnd $FrontEndSession $GeoLocation $HistoryLength $HomeDirectory $HTTPCookies $IgnoreEOF $ImagingDevices $ImportFormats $InitialDirectory $Input $InputFileName $InputStreamMethods $Inspector $InstallationDate $InstallationDirectory $InterfaceEnvironment $IterationLimit $KernelCount $KernelID $Language $LaunchDirectory $LibraryPath $LicenseExpirationDate $LicenseID $LicenseProcesses $LicenseServer $LicenseSubprocesses $LicenseType $Line $Linked $LinkSupported $LoadedFiles $MachineAddresses $MachineDomain $MachineDomains $MachineEpsilon $MachineID $MachineName $MachinePrecision $MachineType $MaxExtraPrecision $MaxLicenseProcesses $MaxLicenseSubprocesses $MaxMachineNumber $MaxNumber $MaxPiecewiseCases $MaxPrecision $MaxRootDegree $MessageGroups $MessageList $MessagePrePrint $Messages $MinMachineNumber $MinNumber $MinorReleaseNumber $MinPrecision $ModuleNumber $NetworkLicense $NewMessage $NewSymbol $Notebooks $NumberMarks $Off $OperatingSystem $Output $OutputForms $OutputSizeLimit $OutputStreamMethods $Packages $ParentLink $ParentProcessID $PasswordFile $PatchLevelID $Path $PathnameSeparator $PerformanceGoal $PipeSupported $Post $Pre $PreferencesDirectory $PrePrint $PreRead $PrintForms $PrintLiteral $ProcessID $ProcessorCount $ProcessorType $ProductInformation $ProgramName $RandomState $RecursionLimit $ReleaseNumber $RootDirectory $ScheduledTask $ScriptCommandLine $SessionID $SetParentLink $SharedFunctions $SharedVariables $SoundDisplay $SoundDisplayFunction $SuppressInputFormHeads $SynchronousEvaluation $SyntaxHandler $System $SystemCharacterEncoding $SystemID $SystemWordLength $TemporaryDirectory $TemporaryPrefix $TextStyle $TimedOut $TimeUnit $TimeZone $TopDirectory $TraceOff $TraceOn $TracePattern $TracePostAction $TracePreAction $Urgent $UserAddOnsDirectory $UserBaseDirectory $UserDocumentsDirectory $UserName $Version $VersionNumber',
            contains: [
            {
                className: "comment",
                begin: /\(\*/,
                end: /\*\)/
            },
            hljs.APOS_STRING_MODE,
            hljs.QUOTE_STRING_MODE,
            hljs.C_NUMBER_MODE,
            {
                className: 'list',
                begin: /\{/,
                end: /\}/,
                illegal: /:/
            }
            ]
        };
    };
}, {}
],
112: [function(require, module, exports) {
    module.exports = function(hljs) {
        var COMMON_CONTAINS = [
        hljs.C_NUMBER_MODE,
        {
            className: 'string',
            begin: '\'',
            end: '\'',
            contains: [hljs.BACKSLASH_ESCAPE, {
                begin: '\'\''
            }
            ]
        }
        ];
        var TRANSPOSE = {
            relevance: 0,
            contains: [
            {
                className: 'operator',
                begin: /'['\.]*/
            }
            ]
        };

        return {
            keywords: {
                keyword:
                'break case catch classdef continue else elseif end enumerated events for function ' +
                'global if methods otherwise parfor persistent properties return spmd switch try while',
                built_in:
                'sin sind sinh asin asind asinh cos cosd cosh acos acosd acosh tan tand tanh atan ' +
                'atand atan2 atanh sec secd sech asec asecd asech csc cscd csch acsc acscd acsch cot ' +
                'cotd coth acot acotd acoth hypot exp expm1 log log1p log10 log2 pow2 realpow reallog ' +
                'realsqrt sqrt nthroot nextpow2 abs angle complex conj imag real unwrap isreal ' +
                'cplxpair fix floor ceil round mod rem sign airy besselj bessely besselh besseli ' +
                'besselk beta betainc betaln ellipj ellipke erf erfc erfcx erfinv expint gamma ' +
                'gammainc gammaln psi legendre cross dot factor isprime primes gcd lcm rat rats perms ' +
                'nchoosek factorial cart2sph cart2pol pol2cart sph2cart hsv2rgb rgb2hsv zeros ones ' +
                'eye repmat rand randn linspace logspace freqspace meshgrid accumarray size length ' +
                'ndims numel disp isempty isequal isequalwithequalnans cat reshape diag blkdiag tril ' +
                'triu fliplr flipud flipdim rot90 find sub2ind ind2sub bsxfun ndgrid permute ipermute ' +
                'shiftdim circshift squeeze isscalar isvector ans eps realmax realmin pi i inf nan ' +
                'isnan isinf isfinite j why compan gallery hadamard hankel hilb invhilb magic pascal ' +
                'rosser toeplitz vander wilkinson'
            },
            illegal: '(//|"|#|/\\*|\\s+/\\w+)',
            contains: [
            {
                className: 'function',
                beginKeywords: 'function',
                end: '$',
                contains: [
                hljs.UNDERSCORE_TITLE_MODE,
                {
                    className: 'params',
                    begin: '\\(',
                    end: '\\)'
                },
                {
                    className: 'params',
                    begin: '\\[',
                    end: '\\]'
                }
                ]
            },
            {
                begin: /[a-zA-Z_][a-zA-Z_0-9]*'['\.]*/,
                returnBegin: true,
                relevance: 0,
                contains: [
                {
                    begin: /[a-zA-Z_][a-zA-Z_0-9]*/,
                    relevance: 0
                },
                TRANSPOSE.contains[0]
                ]
            },
            {
                className: 'matrix',
                begin: '\\[',
                end: '\\]',
                contains: COMMON_CONTAINS,
                relevance: 0,
                starts: TRANSPOSE
            },
            {
                className: 'cell',
                begin: '\\{',
                end: /}/,
                contains: COMMON_CONTAINS,
                relevance: 0,
                starts: TRANSPOSE
            },
            {
                // transpose operators at the end of a function call
                begin: /\)/,
                relevance: 0,
                starts: TRANSPOSE
            },
            hljs.COMMENT('^\\s*\\%\\{\\s*$', '^\\s*\\%\\}\\s*$'),
            hljs.COMMENT('\\%', '$')
            ].concat(COMMON_CONTAINS)
        };
    };
}, {}
],
113: [function(require, module, exports) {
    module.exports = function(hljs) {
        return {
            keywords:
            'int float string vector matrix if else switch case default while do for in break ' +
            'continue global proc return about abs addAttr addAttributeEditorNodeHelp addDynamic ' +
            'addNewShelfTab addPP addPanelCategory addPrefixToName advanceToNextDrivenKey ' +
            'affectedNet affects aimConstraint air alias aliasAttr align alignCtx alignCurve ' +
            'alignSurface allViewFit ambientLight angle angleBetween animCone animCurveEditor ' +
            'animDisplay animView annotate appendStringArray applicationName applyAttrPreset ' +
            'applyTake arcLenDimContext arcLengthDimension arclen arrayMapper art3dPaintCtx ' +
            'artAttrCtx artAttrPaintVertexCtx artAttrSkinPaintCtx artAttrTool artBuildPaintMenu ' +
            'artFluidAttrCtx artPuttyCtx artSelectCtx artSetPaintCtx artUserPaintCtx assignCommand ' +
            'assignInputDevice assignViewportFactories attachCurve attachDeviceAttr attachSurface ' +
            'attrColorSliderGrp attrCompatibility attrControlGrp attrEnumOptionMenu ' +
            'attrEnumOptionMenuGrp attrFieldGrp attrFieldSliderGrp attrNavigationControlGrp ' +
            'attrPresetEditWin attributeExists attributeInfo attributeMenu attributeQuery ' +
            'autoKeyframe autoPlace bakeClip bakeFluidShading bakePartialHistory bakeResults ' +
            'bakeSimulation basename basenameEx batchRender bessel bevel bevelPlus binMembership ' +
            'bindSkin blend2 blendShape blendShapeEditor blendShapePanel blendTwoAttr blindDataType ' +
            'boneLattice boundary boxDollyCtx boxZoomCtx bufferCurve buildBookmarkMenu ' +
            'buildKeyframeMenu button buttonManip CBG cacheFile cacheFileCombine cacheFileMerge ' +
            'cacheFileTrack camera cameraView canCreateManip canvas capitalizeString catch ' +
            'catchQuiet ceil changeSubdivComponentDisplayLevel changeSubdivRegion channelBox ' +
            'character characterMap characterOutlineEditor characterize chdir checkBox checkBoxGrp ' +
            'checkDefaultRenderGlobals choice circle circularFillet clamp clear clearCache clip ' +
            'clipEditor clipEditorCurrentTimeCtx clipSchedule clipSchedulerOutliner clipTrimBefore ' +
            'closeCurve closeSurface cluster cmdFileOutput cmdScrollFieldExecuter ' +
            'cmdScrollFieldReporter cmdShell coarsenSubdivSelectionList collision color ' +
            'colorAtPoint colorEditor colorIndex colorIndexSliderGrp colorSliderButtonGrp ' +
            'colorSliderGrp columnLayout commandEcho commandLine commandPort compactHairSystem ' +
            'componentEditor compositingInterop computePolysetVolume condition cone confirmDialog ' +
            'connectAttr connectControl connectDynamic connectJoint connectionInfo constrain ' +
            'constrainValue constructionHistory container containsMultibyte contextInfo control ' +
            'convertFromOldLayers convertIffToPsd convertLightmap convertSolidTx convertTessellation ' +
            'convertUnit copyArray copyFlexor copyKey copySkinWeights cos cpButton cpCache ' +
            'cpClothSet cpCollision cpConstraint cpConvClothToMesh cpForces cpGetSolverAttr cpPanel ' +
            'cpProperty cpRigidCollisionFilter cpSeam cpSetEdit cpSetSolverAttr cpSolver ' +
            'cpSolverTypes cpTool cpUpdateClothUVs createDisplayLayer createDrawCtx createEditor ' +
            'createLayeredPsdFile createMotionField createNewShelf createNode createRenderLayer ' +
            'createSubdivRegion cross crossProduct ctxAbort ctxCompletion ctxEditMode ctxTraverse ' +
            'currentCtx currentTime currentTimeCtx currentUnit curve curveAddPtCtx ' +
            'curveCVCtx curveEPCtx curveEditorCtx curveIntersect curveMoveEPCtx curveOnSurface ' +
            'curveSketchCtx cutKey cycleCheck cylinder dagPose date defaultLightListCheckBox ' +
            'defaultNavigation defineDataServer defineVirtualDevice deformer deg_to_rad delete ' +
            'deleteAttr deleteShadingGroupsAndMaterials deleteShelfTab deleteUI deleteUnusedBrushes ' +
            'delrandstr detachCurve detachDeviceAttr detachSurface deviceEditor devicePanel dgInfo ' +
            'dgdirty dgeval dgtimer dimWhen directKeyCtx directionalLight dirmap dirname disable ' +
            'disconnectAttr disconnectJoint diskCache displacementToPoly displayAffected ' +
            'displayColor displayCull displayLevelOfDetail displayPref displayRGBColor ' +
            'displaySmoothness displayStats displayString displaySurface distanceDimContext ' +
            'distanceDimension doBlur dolly dollyCtx dopeSheetEditor dot dotProduct ' +
            'doubleProfileBirailSurface drag dragAttrContext draggerContext dropoffLocator ' +
            'duplicate duplicateCurve duplicateSurface dynCache dynControl dynExport dynExpression ' +
            'dynGlobals dynPaintEditor dynParticleCtx dynPref dynRelEdPanel dynRelEditor ' +
            'dynamicLoad editAttrLimits editDisplayLayerGlobals editDisplayLayerMembers ' +
            'editRenderLayerAdjustment editRenderLayerGlobals editRenderLayerMembers editor ' +
            'editorTemplate effector emit emitter enableDevice encodeString endString endsWith env ' +
            'equivalent equivalentTol erf error eval evalDeferred evalEcho event ' +
            'exactWorldBoundingBox exclusiveLightCheckBox exec executeForEachObject exists exp ' +
            'expression expressionEditorListen extendCurve extendSurface extrude fcheck fclose feof ' +
            'fflush fgetline fgetword file fileBrowserDialog fileDialog fileExtension fileInfo ' +
            'filetest filletCurve filter filterCurve filterExpand filterStudioImport ' +
            'findAllIntersections findAnimCurves findKeyframe findMenuItem findRelatedSkinCluster ' +
            'finder firstParentOf fitBspline flexor floatEq floatField floatFieldGrp floatScrollBar ' +
            'floatSlider floatSlider2 floatSliderButtonGrp floatSliderGrp floor flow fluidCacheInfo ' +
            'fluidEmitter fluidVoxelInfo flushUndo fmod fontDialog fopen formLayout format fprint ' +
            'frameLayout fread freeFormFillet frewind fromNativePath fwrite gamma gauss ' +
            'geometryConstraint getApplicationVersionAsFloat getAttr getClassification ' +
            'getDefaultBrush getFileList getFluidAttr getInputDeviceRange getMayaPanelTypes ' +
            'getModifiers getPanel getParticleAttr getPluginResource getenv getpid glRender ' +
            'glRenderEditor globalStitch gmatch goal gotoBindPose grabColor gradientControl ' +
            'gradientControlNoAttr graphDollyCtx graphSelectContext graphTrackCtx gravity grid ' +
            'gridLayout group groupObjectsByName HfAddAttractorToAS HfAssignAS HfBuildEqualMap ' +
            'HfBuildFurFiles HfBuildFurImages HfCancelAFR HfConnectASToHF HfCreateAttractor ' +
            'HfDeleteAS HfEditAS HfPerformCreateAS HfRemoveAttractorFromAS HfSelectAttached ' +
            'HfSelectAttractors HfUnAssignAS hardenPointCurve hardware hardwareRenderPanel ' +
            'headsUpDisplay headsUpMessage help helpLine hermite hide hilite hitTest hotBox hotkey ' +
            'hotkeyCheck hsv_to_rgb hudButton hudSlider hudSliderButton hwReflectionMap hwRender ' +
            'hwRenderLoad hyperGraph hyperPanel hyperShade hypot iconTextButton iconTextCheckBox ' +
            'iconTextRadioButton iconTextRadioCollection iconTextScrollList iconTextStaticLabel ' +
            'ikHandle ikHandleCtx ikHandleDisplayScale ikSolver ikSplineHandleCtx ikSystem ' +
            'ikSystemInfo ikfkDisplayMethod illustratorCurves image imfPlugins inheritTransform ' +
            'insertJoint insertJointCtx insertKeyCtx insertKnotCurve insertKnotSurface instance ' +
            'instanceable instancer intField intFieldGrp intScrollBar intSlider intSliderGrp ' +
            'interToUI internalVar intersect iprEngine isAnimCurve isConnected isDirty isParentOf ' +
            'isSameObject isTrue isValidObjectName isValidString isValidUiName isolateSelect ' +
            'itemFilter itemFilterAttr itemFilterRender itemFilterType joint jointCluster jointCtx ' +
            'jointDisplayScale jointLattice keyTangent keyframe keyframeOutliner ' +
            'keyframeRegionCurrentTimeCtx keyframeRegionDirectKeyCtx keyframeRegionDollyCtx ' +
            'keyframeRegionInsertKeyCtx keyframeRegionMoveKeyCtx keyframeRegionScaleKeyCtx ' +
            'keyframeRegionSelectKeyCtx keyframeRegionSetKeyCtx keyframeRegionTrackCtx ' +
            'keyframeStats lassoContext lattice latticeDeformKeyCtx launch launchImageEditor ' +
            'layerButton layeredShaderPort layeredTexturePort layout layoutDialog lightList ' +
            'lightListEditor lightListPanel lightlink lineIntersection linearPrecision linstep ' +
            'listAnimatable listAttr listCameras listConnections listDeviceAttachments listHistory ' +
            'listInputDeviceAxes listInputDeviceButtons listInputDevices listMenuAnnotation ' +
            'listNodeTypes listPanelCategories listRelatives listSets listTransforms ' +
            'listUnselected listerEditor loadFluid loadNewShelf loadPlugin ' +
            'loadPluginLanguageResources loadPrefObjects localizedPanelLabel lockNode loft log ' +
            'longNameOf lookThru ls lsThroughFilter lsType lsUI Mayatomr mag makeIdentity makeLive ' +
            'makePaintable makeRoll makeSingleSurface makeTubeOn makebot manipMoveContext ' +
            'manipMoveLimitsCtx manipOptions manipRotateContext manipRotateLimitsCtx ' +
            'manipScaleContext manipScaleLimitsCtx marker match max memory menu menuBarLayout ' +
            'menuEditor menuItem menuItemToShelf menuSet menuSetPref messageLine min minimizeApp ' +
            'mirrorJoint modelCurrentTimeCtx modelEditor modelPanel mouse movIn movOut move ' +
            'moveIKtoFK moveKeyCtx moveVertexAlongDirection multiProfileBirailSurface mute ' +
            'nParticle nameCommand nameField namespace namespaceInfo newPanelItems newton nodeCast ' +
            'nodeIconButton nodeOutliner nodePreset nodeType noise nonLinear normalConstraint ' +
            'normalize nurbsBoolean nurbsCopyUVSet nurbsCube nurbsEditUV nurbsPlane nurbsSelect ' +
            'nurbsSquare nurbsToPoly nurbsToPolygonsPref nurbsToSubdiv nurbsToSubdivPref ' +
            'nurbsUVSet nurbsViewDirectionVector objExists objectCenter objectLayer objectType ' +
            'objectTypeUI obsoleteProc oceanNurbsPreviewPlane offsetCurve offsetCurveOnSurface ' +
            'offsetSurface openGLExtension openMayaPref optionMenu optionMenuGrp optionVar orbit ' +
            'orbitCtx orientConstraint outlinerEditor outlinerPanel overrideModifier ' +
            'paintEffectsDisplay pairBlend palettePort paneLayout panel panelConfiguration ' +
            'panelHistory paramDimContext paramDimension paramLocator parent parentConstraint ' +
            'particle particleExists particleInstancer particleRenderInfo partition pasteKey ' +
            'pathAnimation pause pclose percent performanceOptions pfxstrokes pickWalk picture ' +
            'pixelMove planarSrf plane play playbackOptions playblast plugAttr plugNode pluginInfo ' +
            'pluginResourceUtil pointConstraint pointCurveConstraint pointLight pointMatrixMult ' +
            'pointOnCurve pointOnSurface pointPosition poleVectorConstraint polyAppend ' +
            'polyAppendFacetCtx polyAppendVertex polyAutoProjection polyAverageNormal ' +
            'polyAverageVertex polyBevel polyBlendColor polyBlindData polyBoolOp polyBridgeEdge ' +
            'polyCacheMonitor polyCheck polyChipOff polyClipboard polyCloseBorder polyCollapseEdge ' +
            'polyCollapseFacet polyColorBlindData polyColorDel polyColorPerVertex polyColorSet ' +
            'polyCompare polyCone polyCopyUV polyCrease polyCreaseCtx polyCreateFacet ' +
            'polyCreateFacetCtx polyCube polyCut polyCutCtx polyCylinder polyCylindricalProjection ' +
            'polyDelEdge polyDelFacet polyDelVertex polyDuplicateAndConnect polyDuplicateEdge ' +
            'polyEditUV polyEditUVShell polyEvaluate polyExtrudeEdge polyExtrudeFacet ' +
            'polyExtrudeVertex polyFlipEdge polyFlipUV polyForceUV polyGeoSampler polyHelix ' +
            'polyInfo polyInstallAction polyLayoutUV polyListComponentConversion polyMapCut ' +
            'polyMapDel polyMapSew polyMapSewMove polyMergeEdge polyMergeEdgeCtx polyMergeFacet ' +
            'polyMergeFacetCtx polyMergeUV polyMergeVertex polyMirrorFace polyMoveEdge ' +
            'polyMoveFacet polyMoveFacetUV polyMoveUV polyMoveVertex polyNormal polyNormalPerVertex ' +
            'polyNormalizeUV polyOptUvs polyOptions polyOutput polyPipe polyPlanarProjection ' +
            'polyPlane polyPlatonicSolid polyPoke polyPrimitive polyPrism polyProjection ' +
            'polyPyramid polyQuad polyQueryBlindData polyReduce polySelect polySelectConstraint ' +
            'polySelectConstraintMonitor polySelectCtx polySelectEditCtx polySeparate ' +
            'polySetToFaceNormal polySewEdge polyShortestPathCtx polySmooth polySoftEdge ' +
            'polySphere polySphericalProjection polySplit polySplitCtx polySplitEdge polySplitRing ' +
            'polySplitVertex polyStraightenUVBorder polySubdivideEdge polySubdivideFacet ' +
            'polyToSubdiv polyTorus polyTransfer polyTriangulate polyUVSet polyUnite polyWedgeFace ' +
            'popen popupMenu pose pow preloadRefEd print progressBar progressWindow projFileViewer ' +
            'projectCurve projectTangent projectionContext projectionManip promptDialog propModCtx ' +
            'propMove psdChannelOutliner psdEditTextureFile psdExport psdTextureFile putenv pwd ' +
            'python querySubdiv quit rad_to_deg radial radioButton radioButtonGrp radioCollection ' +
            'radioMenuItemCollection rampColorPort rand randomizeFollicles randstate rangeControl ' +
            'readTake rebuildCurve rebuildSurface recordAttr recordDevice redo reference ' +
            'referenceEdit referenceQuery refineSubdivSelectionList refresh refreshAE ' +
            'registerPluginResource rehash reloadImage removeJoint removeMultiInstance ' +
            'removePanelCategory rename renameAttr renameSelectionList renameUI render ' +
            'renderGlobalsNode renderInfo renderLayerButton renderLayerParent ' +
            'renderLayerPostProcess renderLayerUnparent renderManip renderPartition ' +
            'renderQualityNode renderSettings renderThumbnailUpdate renderWindowEditor ' +
            'renderWindowSelectContext renderer reorder reorderDeformers requires reroot ' +
            'resampleFluid resetAE resetPfxToPolyCamera resetTool resolutionNode retarget ' +
            'reverseCurve reverseSurface revolve rgb_to_hsv rigidBody rigidSolver roll rollCtx ' +
            'rootOf rot rotate rotationInterpolation roundConstantRadius rowColumnLayout rowLayout ' +
            'runTimeCommand runup sampleImage saveAllShelves saveAttrPreset saveFluid saveImage ' +
            'saveInitialState saveMenu savePrefObjects savePrefs saveShelf saveToolSettings scale ' +
            'scaleBrushBrightness scaleComponents scaleConstraint scaleKey scaleKeyCtx sceneEditor ' +
            'sceneUIReplacement scmh scriptCtx scriptEditorInfo scriptJob scriptNode scriptTable ' +
            'scriptToShelf scriptedPanel scriptedPanelType scrollField scrollLayout sculpt ' +
            'searchPathArray seed selLoadSettings select selectContext selectCurveCV selectKey ' +
            'selectKeyCtx selectKeyframeRegionCtx selectMode selectPref selectPriority selectType ' +
            'selectedNodes selectionConnection separator setAttr setAttrEnumResource ' +
            'setAttrMapping setAttrNiceNameResource setConstraintRestPosition ' +
            'setDefaultShadingGroup setDrivenKeyframe setDynamic setEditCtx setEditor setFluidAttr ' +
            'setFocus setInfinity setInputDeviceMapping setKeyCtx setKeyPath setKeyframe ' +
            'setKeyframeBlendshapeTargetWts setMenuMode setNodeNiceNameResource setNodeTypeFlag ' +
            'setParent setParticleAttr setPfxToPolyCamera setPluginResource setProject ' +
            'setStampDensity setStartupMessage setState setToolTo setUITemplate setXformManip sets ' +
            'shadingConnection shadingGeometryRelCtx shadingLightRelCtx shadingNetworkCompare ' +
            'shadingNode shapeCompare shelfButton shelfLayout shelfTabLayout shellField ' +
            'shortNameOf showHelp showHidden showManipCtx showSelectionInTitle ' +
            'showShadingGroupAttrEditor showWindow sign simplify sin singleProfileBirailSurface ' +
            'size sizeBytes skinCluster skinPercent smoothCurve smoothTangentSurface smoothstep ' +
            'snap2to2 snapKey snapMode snapTogetherCtx snapshot soft softMod softModCtx sort sound ' +
            'soundControl source spaceLocator sphere sphrand spotLight spotLightPreviewPort ' +
            'spreadSheetEditor spring sqrt squareSurface srtContext stackTrace startString ' +
            'startsWith stitchAndExplodeShell stitchSurface stitchSurfacePoints strcmp ' +
            'stringArrayCatenate stringArrayContains stringArrayCount stringArrayInsertAtIndex ' +
            'stringArrayIntersector stringArrayRemove stringArrayRemoveAtIndex ' +
            'stringArrayRemoveDuplicates stringArrayRemoveExact stringArrayToString ' +
            'stringToStringArray strip stripPrefixFromName stroke subdAutoProjection ' +
            'subdCleanTopology subdCollapse subdDuplicateAndConnect subdEditUV ' +
            'subdListComponentConversion subdMapCut subdMapSewMove subdMatchTopology subdMirror ' +
            'subdToBlind subdToPoly subdTransferUVsToCache subdiv subdivCrease ' +
            'subdivDisplaySmoothness substitute substituteAllString substituteGeometry substring ' +
            'surface surfaceSampler surfaceShaderList swatchDisplayPort switchTable symbolButton ' +
            'symbolCheckBox sysFile system tabLayout tan tangentConstraint texLatticeDeformContext ' +
            'texManipContext texMoveContext texMoveUVShellContext texRotateContext texScaleContext ' +
            'texSelectContext texSelectShortestPathCtx texSmudgeUVContext texWinToolCtx text ' +
            'textCurves textField textFieldButtonGrp textFieldGrp textManip textScrollList ' +
            'textToShelf textureDisplacePlane textureHairColor texturePlacementContext ' +
            'textureWindow threadCount threePointArcCtx timeControl timePort timerX toNativePath ' +
            'toggle toggleAxis toggleWindowVisibility tokenize tokenizeList tolerance tolower ' +
            'toolButton toolCollection toolDropped toolHasOptions toolPropertyWindow torus toupper ' +
            'trace track trackCtx transferAttributes transformCompare transformLimits translator ' +
            'trim trunc truncateFluidCache truncateHairCache tumble tumbleCtx turbulence ' +
            'twoPointArcCtx uiRes uiTemplate unassignInputDevice undo undoInfo ungroup uniform unit ' +
            'unloadPlugin untangleUV untitledFileName untrim upAxis updateAE userCtx uvLink ' +
            'uvSnapshot validateShelfName vectorize view2dToolCtx viewCamera viewClipPlane ' +
            'viewFit viewHeadOn viewLookAt viewManip viewPlace viewSet visor volumeAxis vortex ' +
            'waitCursor warning webBrowser webBrowserPrefs whatIs window windowPref wire ' +
            'wireContext workspace wrinkle wrinkleContext writeTake xbmLangPathList xform',
            illegal: '</',
            contains: [
            hljs.C_NUMBER_MODE,
            hljs.APOS_STRING_MODE,
            hljs.QUOTE_STRING_MODE,
            {
                className: 'string',
                begin: '`',
                end: '`',
                contains: [hljs.BACKSLASH_ESCAPE]
            },
            {
                className: 'variable',
                variants: [
                {
                    begin: '\\$\\d'
                },
                {
                    begin: '[\\$\\%\\@](\\^\\w\\b|#\\w+|[^\\s\\w{]|{\\w+}|\\w+)'
                },
                {
                    begin: '\\*(\\^\\w\\b|#\\w+|[^\\s\\w{]|{\\w+}|\\w+)',
                    relevance: 0
                }
                ]
            },
            hljs.C_LINE_COMMENT_MODE,
            hljs.C_BLOCK_COMMENT_MODE
            ]
        };
    };
}, {}
],
114: [function(require, module, exports) {
    module.exports = function(hljs) {
        var KEYWORDS = {
            keyword:
            'module use_module import_module include_module end_module initialise ' +
            'mutable initialize finalize finalise interface implementation pred ' +
            'mode func type inst solver any_pred any_func is semidet det nondet ' +
            'multi erroneous failure cc_nondet cc_multi typeclass instance where ' +
            'pragma promise external trace atomic or_else require_complete_switch ' +
            'require_det require_semidet require_multi require_nondet ' +
            'require_cc_multi require_cc_nondet require_erroneous require_failure',
            pragma:
            'inline no_inline type_spec source_file fact_table obsolete memo ' +
            'loop_check minimal_model terminates does_not_terminate ' +
            'check_termination promise_equivalent_clauses',
            preprocessor:
            'foreign_proc foreign_decl foreign_code foreign_type ' +
            'foreign_import_module foreign_export_enum foreign_export ' +
            'foreign_enum may_call_mercury will_not_call_mercury thread_safe ' +
            'not_thread_safe maybe_thread_safe promise_pure promise_semipure ' +
            'tabled_for_io local untrailed trailed attach_to_io_state ' +
            'can_pass_as_mercury_type stable will_not_throw_exception ' +
            'may_modify_trail will_not_modify_trail may_duplicate ' +
            'may_not_duplicate affects_liveness does_not_affect_liveness ' +
            'doesnt_affect_liveness no_sharing unknown_sharing sharing',
            built_in:
            'some all not if then else true fail false try catch catch_any ' +
            'semidet_true semidet_false semidet_fail impure_true impure semipure'
        };

        var TODO = {
            className: 'label',
            begin: 'XXX',
            end: '$',
            endsWithParent: true,
            relevance: 0
        };
        var COMMENT = hljs.inherit(hljs.C_LINE_COMMENT_MODE, {
            begin: '%'
        });
        var CCOMMENT = hljs.inherit(hljs.C_BLOCK_COMMENT_MODE, {
            relevance: 0
        });
        COMMENT.contains.push(TODO);
        CCOMMENT.contains.push(TODO);

        var NUMCODE = {
            className: 'number',
            begin: "0'.\\|0[box][0-9a-fA-F]*"
        };

        var ATOM = hljs.inherit(hljs.APOS_STRING_MODE, {
            relevance: 0
        });
        var STRING = hljs.inherit(hljs.QUOTE_STRING_MODE, {
            relevance: 0
        });
        var STRING_FMT = {
            className: 'constant',
            begin: '\\\\[abfnrtv]\\|\\\\x[0-9a-fA-F]*\\\\\\|%[-+# *.0-9]*[dioxXucsfeEgGp]',
            relevance: 0
        };
        STRING.contains.push(STRING_FMT);

        var IMPLICATION = {
            className: 'built_in',
            variants: [
            {
                begin: '<=>'
            },
            {
                begin: '<=',
                relevance: 0
            },
            {
                begin: '=>',
                relevance: 0
            },
            {
                begin: '/\\\\'
            },
            {
                begin: '\\\\/'
            }
            ]
        };

        var HEAD_BODY_CONJUNCTION = {
            className: 'built_in',
            variants: [
            {
                begin: ':-\\|-->'
            },
            {
                begin: '=',
                relevance: 0
            }
            ]
        };

        return {
            aliases: ['m', 'moo'],
            keywords: KEYWORDS,
            contains: [
            IMPLICATION,
            HEAD_BODY_CONJUNCTION,
            COMMENT,
            CCOMMENT,
            NUMCODE,
            hljs.NUMBER_MODE,
            ATOM,
            STRING,
            {
                begin: /:-/
            }
            // relevance booster
            ]
        };
    };
}, {}
],
115: [function(require, module, exports) {
    module.exports = function(hljs) {
        return {
            keywords:
            'environ vocabularies notations constructors definitions ' +
            'registrations theorems schemes requirements begin end definition ' +
            'registration cluster existence pred func defpred deffunc theorem ' +
            'proof let take assume then thus hence ex for st holds consider ' +
            'reconsider such that and in provided of as from be being by means ' +
            'equals implies iff redefine define now not or attr is mode ' +
            'suppose per cases set thesis contradiction scheme reserve struct ' +
            'correctness compatibility coherence symmetry assymetry ' +
            'reflexivity irreflexivity connectedness uniqueness commutativity ' +
            'idempotence involutiveness projectivity',
            contains: [
            hljs.COMMENT('::', '$')
            ]
        };
    };
}, {}
],
116: [function(require, module, exports) {
    module.exports = function(hljs) {
        return {
            subLanguage: 'xml',
            contains: [
            {
                className: 'preprocessor',
                begin: '^__(END|DATA)__$'
            },
            // mojolicious line
            {
                begin: "^\\s*%{1,2}={0,2}",
                end: '$',
                subLanguage: 'perl'
            },
            // mojolicious block
            {
                begin: "<%{1,2}={0,2}",
                end: "={0,1}%>",
                subLanguage: 'perl',
                excludeBegin: true,
                excludeEnd: true
            }
            ]
        };
    };
}, {}
],
117: [function(require, module, exports) {
    module.exports = function(hljs) {
        var NUMBER = {
            className: 'number',
            relevance: 0,
            variants: [
            {
                begin: '[$][a-fA-F0-9]+'
            },
            hljs.NUMBER_MODE
            ]
        };

        return {
            case_insensitive: true,
            keywords: {
                keyword: 'public private property continue exit extern new try catch ' +
                'eachin not abstract final select case default const local global field ' +
                'end if then else elseif endif while wend repeat until forever for to step next return module inline throw',

                built_in: 'DebugLog DebugStop Error Print ACos ACosr ASin ASinr ATan ATan2 ATan2r ATanr Abs Abs Ceil ' +
                'Clamp Clamp Cos Cosr Exp Floor Log Max Max Min Min Pow Sgn Sgn Sin Sinr Sqrt Tan Tanr Seed PI HALFPI TWOPI',

                literal: 'true false null and or shl shr mod'
            },
            contains: [
            hljs.COMMENT('#rem', '#end'),
            hljs.COMMENT(
            "'",
            '$',
            {
                relevance: 0
            }),
            {
                className: 'function',
                beginKeywords: 'function method',
                end: '[(=:]|$',
                illegal: /\n/,
                contains: [
                hljs.UNDERSCORE_TITLE_MODE
                ]
            },
            {
                className: 'class',
                beginKeywords: 'class interface',
                end: '$',
                contains: [
                {
                    beginKeywords: 'extends implements'
                },
                hljs.UNDERSCORE_TITLE_MODE
                ]
            },
            {
                className: 'variable',
                begin: '\\b(self|super)\\b'
            },
            {
                className: 'preprocessor',
                beginKeywords: 'import',
                end: '$'
            },
            {
                className: 'preprocessor',
                begin: '\\s*#',
                end: '$',
                keywords: 'if else elseif endif end then'
            },
            {
                className: 'pi',
                begin: '^\\s*strict\\b'
            },
            {
                beginKeywords: 'alias',
                end: '=',
                contains: [hljs.UNDERSCORE_TITLE_MODE]
            },
            hljs.QUOTE_STRING_MODE,
            NUMBER
            ]
        }
    };
}, {}
],
118: [function(require, module, exports) {
    module.exports = function(hljs) {
        var VAR = {
            className: 'variable',
            variants: [
            {
                begin: /\$\d+/
            },
            {
                begin: /\$\{/,
                end: /}/
            },
            {
                begin: '[\\$\\@]' + hljs.UNDERSCORE_IDENT_RE
            }
            ]
        };
        var DEFAULT = {
            endsWithParent: true,
            lexemes: '[a-z/_]+',
            keywords: {
                built_in:
                'on off yes no true false none blocked debug info notice warn error crit ' +
                'select break last permanent redirect kqueue rtsig epoll poll /dev/poll'
            },
            relevance: 0,
            illegal: '=>',
            contains: [
            hljs.HASH_COMMENT_MODE,
            {
                className: 'string',
                contains: [hljs.BACKSLASH_ESCAPE, VAR],
                variants: [
                {
                    begin: /"/,
                    end: /"/
                },
                {
                    begin: /'/,
                    end: /'/
                }
                ]
            },
            {
                className: 'url',
                begin: '([a-z]+):/',
                end: '\\s',
                endsWithParent: true,
                excludeEnd: true,
                contains: [VAR]
            },
            {
                className: 'regexp',
                contains: [hljs.BACKSLASH_ESCAPE, VAR],
                variants: [
                {
                    begin: "\\s\\^",
                    end: "\\s|{|;",
                    returnEnd: true
                },
                // regexp locations (~, ~*)
                {
                    begin: "~\\*?\\s+",
                    end: "\\s|{|;",
                    returnEnd: true
                },
                // *.example.com
                {
                    begin: "\\*(\\.[a-z\\-]+)+"
                },
                // sub.example.*
                {
                    begin: "([a-z\\-]+\\.)+\\*"
                }
                ]
            },
            // IP
            {
                className: 'number',
                begin: '\\b\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}(:\\d{1,5})?\\b'
            },
            // units
            {
                className: 'number',
                begin: '\\b\\d+[kKmMgGdshdwy]*\\b',
                relevance: 0
            },
            VAR
            ]
        };

        return {
            aliases: ['nginxconf'],
            contains: [
            hljs.HASH_COMMENT_MODE,
            {
                begin: hljs.UNDERSCORE_IDENT_RE + '\\s',
                end: ';|{',
                returnBegin: true,
                contains: [
                {
                    className: 'title',
                    begin: hljs.UNDERSCORE_IDENT_RE,
                    starts: DEFAULT
                }
                ],
                relevance: 0
            }
            ],
            illegal: '[^\\s\\}]'
        };
    };
}, {}
],
119: [function(require, module, exports) {
    module.exports = function(hljs) {
        return {
            aliases: ['nim'],
            keywords: {
                keyword: 'addr and as asm bind block break|0 case|0 cast const|0 continue|0 converter discard distinct|10 div do elif else|0 end|0 enum|0 except export finally for from generic if|0 import|0 in include|0 interface is isnot|10 iterator|10 let|0 macro method|10 mixin mod nil not notin|10 object|0 of or out proc|10 ptr raise ref|10 return shl shr static template try|0 tuple type|0 using|0 var|0 when while|0 with without xor yield',
                literal: 'shared guarded stdin stdout stderr result|10 true false'
            },
            contains: [ {
                className: 'decorator',
                // Actually pragma
                begin: /{\./,
                end: /\.}/,
                relevance: 10
            }, {
                className: 'string',
                begin: /[a-zA-Z]\w*"/,
                end: /"/,
                contains: [{
                    begin: /""/
                }
                ]
            }, {
                className: 'string',
                begin: /([a-zA-Z]\w*)?"""/,
                end: /"""/
            },
            hljs.QUOTE_STRING_MODE,
            {
                className: 'type',
                begin: /\b[A-Z]\w+\b/,
                relevance: 0
            }, {
                className: 'type',
                begin: /\b(int|int8|int16|int32|int64|uint|uint8|uint16|uint32|uint64|float|float32|float64|bool|char|string|cstring|pointer|expr|stmt|void|auto|any|range|array|openarray|varargs|seq|set|clong|culong|cchar|cschar|cshort|cint|csize|clonglong|cfloat|cdouble|clongdouble|cuchar|cushort|cuint|culonglong|cstringarray|semistatic)\b/
            }, {
                className: 'number',
                begin: /\b(0[xX][0-9a-fA-F][_0-9a-fA-F]*)('?[iIuU](8|16|32|64))?/,
                relevance: 0
            }, {
                className: 'number',
                begin: /\b(0o[0-7][_0-7]*)('?[iIuUfF](8|16|32|64))?/,
                relevance: 0
            }, {
                className: 'number',
                begin: /\b(0(b|B)[01][_01]*)('?[iIuUfF](8|16|32|64))?/,
                relevance: 0
            }, {
                className: 'number',
                begin: /\b(\d[_\d]*)('?[iIuUfF](8|16|32|64))?/,
                relevance: 0
            },
            hljs.HASH_COMMENT_MODE
            ]
        }
    };
}, {}
],
120: [function(require, module, exports) {
    module.exports = function(hljs) {
        var NIX_KEYWORDS = {
            keyword: 'rec with let in inherit assert if else then',
            constant: 'true false or and null',
            built_in:
            'import abort baseNameOf dirOf isNull builtins map removeAttrs throw toString derivation'
        };
        var ANTIQUOTE = {
            className: 'subst',
            begin: /\$\{/,
            end: /}/,
            keywords: NIX_KEYWORDS
        };
        var ATTRS = {
            className: 'variable',
            // TODO: we have to figure out a way how to exclude \s*=
            begin: /[a-zA-Z0-9-_]+(\s*=)/,
            relevance: 0
        };
        var SINGLE_QUOTE = {
            className: 'string',
            begin: "''",
            end: "''",
            contains: [
            ANTIQUOTE
            ]
        };
        var DOUBLE_QUOTE = {
            className: 'string',
            begin: '"',
            end: '"',
            contains: [
            ANTIQUOTE
            ]
        };
        var EXPRESSIONS = [
        hljs.NUMBER_MODE,
        hljs.HASH_COMMENT_MODE,
        hljs.C_BLOCK_COMMENT_MODE,
        SINGLE_QUOTE,
        DOUBLE_QUOTE,
        ATTRS
        ];
        ANTIQUOTE.contains = EXPRESSIONS;
        return {
            aliases: ["nixos"],
            keywords: NIX_KEYWORDS,
            contains: EXPRESSIONS
        };
    };
}, {}
],
121: [function(require, module, exports) {
    module.exports = function(hljs) {
        var CONSTANTS = {
            className: 'symbol',
            begin: '\\$(ADMINTOOLS|APPDATA|CDBURN_AREA|CMDLINE|COMMONFILES32|COMMONFILES64|COMMONFILES|COOKIES|DESKTOP|DOCUMENTS|EXEDIR|EXEFILE|EXEPATH|FAVORITES|FONTS|HISTORY|HWNDPARENT|INSTDIR|INTERNET_CACHE|LANGUAGE|LOCALAPPDATA|MUSIC|NETHOOD|OUTDIR|PICTURES|PLUGINSDIR|PRINTHOOD|PROFILE|PROGRAMFILES32|PROGRAMFILES64|PROGRAMFILES|QUICKLAUNCH|RECENT|RESOURCES_LOCALIZED|RESOURCES|SENDTO|SMPROGRAMS|SMSTARTUP|STARTMENU|SYSDIR|TEMP|TEMPLATES|VIDEOS|WINDIR)'
        };

        var DEFINES = {
            // ${defines}
            className: 'constant',
            begin: '\\$+{[a-zA-Z0-9_]+}'
        };

        var VARIABLES = {
            // $variables
            className: 'variable',
            begin: '\\$+[a-zA-Z0-9_]+',
            illegal: '\\(\\){}'
        };

        var LANGUAGES = {
            // $(language_strings)
            className: 'constant',
            begin: '\\$+\\([a-zA-Z0-9_]+\\)'
        };

        var PARAMETERS = {
            // command parameters
            className: 'params',
            begin: '(ARCHIVE|FILE_ATTRIBUTE_ARCHIVE|FILE_ATTRIBUTE_NORMAL|FILE_ATTRIBUTE_OFFLINE|FILE_ATTRIBUTE_READONLY|FILE_ATTRIBUTE_SYSTEM|FILE_ATTRIBUTE_TEMPORARY|HKCR|HKCU|HKDD|HKEY_CLASSES_ROOT|HKEY_CURRENT_CONFIG|HKEY_CURRENT_USER|HKEY_DYN_DATA|HKEY_LOCAL_MACHINE|HKEY_PERFORMANCE_DATA|HKEY_USERS|HKLM|HKPD|HKU|IDABORT|IDCANCEL|IDIGNORE|IDNO|IDOK|IDRETRY|IDYES|MB_ABORTRETRYIGNORE|MB_DEFBUTTON1|MB_DEFBUTTON2|MB_DEFBUTTON3|MB_DEFBUTTON4|MB_ICONEXCLAMATION|MB_ICONINFORMATION|MB_ICONQUESTION|MB_ICONSTOP|MB_OK|MB_OKCANCEL|MB_RETRYCANCEL|MB_RIGHT|MB_RTLREADING|MB_SETFOREGROUND|MB_TOPMOST|MB_USERICON|MB_YESNO|NORMAL|OFFLINE|READONLY|SHCTX|SHELL_CONTEXT|SYSTEM|TEMPORARY)'
        };

        var COMPILER = {
            // !compiler_flags
            className: 'constant',
            begin: '\\!(addincludedir|addplugindir|appendfile|cd|define|delfile|echo|else|endif|error|execute|finalize|getdllversionsystem|ifdef|ifmacrodef|ifmacrondef|ifndef|if|include|insertmacro|macroend|macro|makensis|packhdr|searchparse|searchreplace|tempfile|undef|verbose|warning)'
        };

        return {
            case_insensitive: false,
            keywords: {
                keyword:
                'Abort AddBrandingImage AddSize AllowRootDirInstall AllowSkipFiles AutoCloseWindow BGFont BGGradient BrandingText BringToFront Call CallInstDLL Caption ChangeUI CheckBitmap ClearErrors CompletedText ComponentText CopyFiles CRCCheck CreateDirectory CreateFont CreateShortCut Delete DeleteINISec DeleteINIStr DeleteRegKey DeleteRegValue DetailPrint DetailsButtonText DirText DirVar DirVerify EnableWindow EnumRegKey EnumRegValue Exch Exec ExecShell ExecWait ExpandEnvStrings File FileBufSize FileClose FileErrorText FileOpen FileRead FileReadByte FileReadUTF16LE FileReadWord FileSeek FileWrite FileWriteByte FileWriteUTF16LE FileWriteWord FindClose FindFirst FindNext FindWindow FlushINI FunctionEnd GetCurInstType GetCurrentAddress GetDlgItem GetDLLVersion GetDLLVersionLocal GetErrorLevel GetFileTime GetFileTimeLocal GetFullPathName GetFunctionAddress GetInstDirError GetLabelAddress GetTempFileName Goto HideWindow Icon IfAbort IfErrors IfFileExists IfRebootFlag IfSilent InitPluginsDir InstallButtonText InstallColors InstallDir InstallDirRegKey InstProgressFlags InstType InstTypeGetText InstTypeSetText IntCmp IntCmpU IntFmt IntOp IsWindow LangString LicenseBkColor LicenseData LicenseForceSelection LicenseLangString LicenseText LoadLanguageFile LockWindow LogSet LogText ManifestDPIAware ManifestSupportedOS MessageBox MiscButtonText Name Nop OutFile Page PageCallbacks PageExEnd Pop Push Quit ReadEnvStr ReadINIStr ReadRegDWORD ReadRegStr Reboot RegDLL Rename RequestExecutionLevel ReserveFile Return RMDir SearchPath SectionEnd SectionGetFlags SectionGetInstTypes SectionGetSize SectionGetText SectionGroupEnd SectionIn SectionSetFlags SectionSetInstTypes SectionSetSize SectionSetText SendMessage SetAutoClose SetBrandingImage SetCompress SetCompressor SetCompressorDictSize SetCtlColors SetCurInstType SetDatablockOptimize SetDateSave SetDetailsPrint SetDetailsView SetErrorLevel SetErrors SetFileAttributes SetFont SetOutPath SetOverwrite SetPluginUnload SetRebootFlag SetRegView SetShellVarContext SetSilent ShowInstDetails ShowUninstDetails ShowWindow SilentInstall SilentUnInstall Sleep SpaceTexts StrCmp StrCmpS StrCpy StrLen SubCaption SubSectionEnd Unicode UninstallButtonText UninstallCaption UninstallIcon UninstallSubCaption UninstallText UninstPage UnRegDLL Var VIAddVersionKey VIFileVersion VIProductVersion WindowIcon WriteINIStr WriteRegBin WriteRegDWORD WriteRegExpandStr WriteRegStr WriteUninstaller XPStyle',
                literal:
                'admin all auto both colored current false force hide highest lastused leave listonly none normal notset off on open print show silent silentlog smooth textonly true user '
            },
            contains: [
            hljs.HASH_COMMENT_MODE,
            hljs.C_BLOCK_COMMENT_MODE,
            {
                className: 'string',
                begin: '"',
                end: '"',
                illegal: '\\n',
                contains: [
                {
                    // $\n, $\r, $\t, $$
                    className: 'symbol',
                    begin: '\\$(\\\\(n|r|t)|\\$)'
                },
                CONSTANTS,
                DEFINES,
                VARIABLES,
                LANGUAGES
                ]
            },
            hljs.COMMENT(
            ';',
            '$',
            {
                relevance: 0
            }),
            {
                className: 'function',
                beginKeywords: 'Function PageEx Section SectionGroup SubSection',
                end: '$'
            },
            COMPILER,
            DEFINES,
            VARIABLES,
            LANGUAGES,
            PARAMETERS,
            hljs.NUMBER_MODE,
            {
                // plug::ins
                className: 'literal',
                begin: hljs.IDENT_RE + '::' + hljs.IDENT_RE
            }
            ]
        };
    };
}, {}
],
122: [function(require, module, exports) {
    module.exports = function(hljs) {
        var API_CLASS = {
            className: 'built_in',
            begin: '(AV|CA|CF|CG|CI|MK|MP|NS|UI)\\w+',
        };
        var OBJC_KEYWORDS = {
            keyword:
            'int float while char export sizeof typedef const struct for union ' +
            'unsigned long volatile static bool mutable if do return goto void ' +
            'enum else break extern asm case short default double register explicit ' +
            'signed typename this switch continue wchar_t inline readonly assign ' +
            'readwrite self @synchronized id typeof ' +
            'nonatomic super unichar IBOutlet IBAction strong weak copy ' +
            'in out inout bycopy byref oneway __strong __weak __block __autoreleasing ' +
            '@private @protected @public @try @property @end @throw @catch @finally ' +
            '@autoreleasepool @synthesize @dynamic @selector @optional @required',
            literal:
            'false true FALSE TRUE nil YES NO NULL',
            built_in:
            'BOOL dispatch_once_t dispatch_queue_t dispatch_sync dispatch_async dispatch_once'
        };
        var LEXEMES = /[a-zA-Z@][a-zA-Z0-9_]*/;
        var CLASS_KEYWORDS = '@interface @class @protocol @implementation';
        return {
            aliases: ['mm', 'objc', 'obj-c'],
            keywords: OBJC_KEYWORDS,
            lexemes: LEXEMES,
            illegal: '</',
            contains: [
            API_CLASS,
            hljs.C_LINE_COMMENT_MODE,
            hljs.C_BLOCK_COMMENT_MODE,
            hljs.C_NUMBER_MODE,
            hljs.QUOTE_STRING_MODE,
            {
                className: 'string',
                variants: [
                {
                    begin: '@"',
                    end: '"',
                    illegal: '\\n',
                    contains: [hljs.BACKSLASH_ESCAPE]
                },
                {
                    begin: '\'',
                    end: '[^\\\\]\'',
                    illegal: '[^\\\\][^\']'
                }
                ]
            },
            {
                className: 'preprocessor',
                begin: '#',
                end: '$',
                contains: [
                {
                    className: 'title',
                    variants: [
                    {
                        begin: '\"',
                        end: '\"'
                    },
                    {
                        begin: '<',
                        end: '>'
                    }
                    ]
                }
                ]
            },
            {
                className: 'class',
                begin: '(' + CLASS_KEYWORDS.split(' ').join('|') + ')\\b',
                end: '({|$)',
                excludeEnd: true,
                keywords: CLASS_KEYWORDS,
                lexemes: LEXEMES,
                contains: [
                hljs.UNDERSCORE_TITLE_MODE
                ]
            },
            {
                className: 'variable',
                begin: '\\.' + hljs.UNDERSCORE_IDENT_RE,
                relevance: 0
            }
            ]
        };
    };
}, {}
],
123: [function(require, module, exports) {
    module.exports = function(hljs) {
        /* missing support for heredoc-like string (OCaml 4.0.2+) */
        return {
            aliases: ['ml'],
            keywords: {
                keyword:
                'and as assert asr begin class constraint do done downto else end ' +
                'exception external for fun function functor if in include ' +
                'inherit! inherit initializer land lazy let lor lsl lsr lxor match method!|10 method ' +
                'mod module mutable new object of open! open or private rec sig struct ' +
                'then to try type val! val virtual when while with ' +
                /* camlp4 */
                'parser value',
                built_in:
                /* built-in types */
                'array bool bytes char exn|5 float int int32 int64 list lazy_t|5 nativeint|5 string unit ' +
                /* (some) types in Pervasives */
                'in_channel out_channel ref',
                literal:
                'true false'
            },
            illegal: /\/\/|>>/,
            lexemes: '[a-z_]\\w*!?',
            contains: [
            {
                className: 'literal',
                begin: '\\[(\\|\\|)?\\]|\\(\\)',
                relevance: 0
            },
            hljs.COMMENT(
            '\\(\\*',
            '\\*\\)',
            {
                contains: ['self']
            }),
            {
                /* type variable */
                className: 'symbol',
                begin: '\'[A-Za-z_](?!\')[\\w\']*'
                /* the grammar is ambiguous on how 'a'b should be interpreted but not the compiler */
            },
            {
                /* polymorphic variant */
                className: 'tag',
                begin: '`[A-Z][\\w\']*'
            },
            {
                /* module or constructor */
                className: 'type',
                begin: '\\b[A-Z][\\w\']*',
                relevance: 0
            },
            {
                /* don't color identifiers, but safely catch all identifiers with '*/
                begin: '[a-z_]\\w*\'[\\w\']*'
            },
            hljs.inherit(hljs.APOS_STRING_MODE, {
                className: 'char',
                relevance: 0
            }),
            hljs.inherit(hljs.QUOTE_STRING_MODE, {
                illegal: null
            }),
            {
                className: 'number',
                begin:
                '\\b(0[xX][a-fA-F0-9_]+[Lln]?|' +
                '0[oO][0-7_]+[Lln]?|' +
                '0[bB][01_]+[Lln]?|' +
                '[0-9][0-9_]*([Lln]|(\\.[0-9_]*)?([eE][-+]?[0-9_]+)?)?)',
                relevance: 0
            },
            {
                begin: /[-=]>/ // relevance booster
            }
            ]
        }
    };
}, {}
],
124: [function(require, module, exports) {
    module.exports = function(hljs) {
        var SPECIAL_VARS = {
            className: 'keyword',
            begin: '\\$(f[asn]|t|vp[rtd]|children)'
        },
        LITERALS = {
            className: 'literal',
            begin: 'false|true|PI|undef'
        },
        NUMBERS = {
            className: 'number',
            begin: '\\b\\d+(\\.\\d+)?(e-?\\d+)?',
            //adds 1e5, 1e-10
            relevance: 0
        },
        STRING = hljs.inherit(hljs.QUOTE_STRING_MODE, {
            illegal: null
        }),
        PREPRO = {
            className: 'preprocessor',
            keywords: 'include use',
            begin: 'include|use <',
            end: '>'
        },
        PARAMS = {
            className: 'params',
            begin: '\\(',
            end: '\\)',
            contains: ['self', NUMBERS, STRING, SPECIAL_VARS, LITERALS]
        },
        MODIFIERS = {
            className: 'built_in',
            begin: '[*!#%]',
            relevance: 0
        },
        FUNCTIONS = {
            className: 'function',
            beginKeywords: 'module function',
            end: '\\=|\\{',
            contains: [PARAMS, hljs.UNDERSCORE_TITLE_MODE]
        };

        return {
            aliases: ['scad'],
            keywords: {
                keyword: 'function module include use for intersection_for if else \\%',
                literal: 'false true PI undef',
                built_in: 'circle square polygon text sphere cube cylinder polyhedron translate rotate scale resize mirror multmatrix color offset hull minkowski union difference intersection abs sign sin cos tan acos asin atan atan2 floor round ceil ln log pow sqrt exp rands min max concat lookup str chr search version version_num norm cross parent_module echo import import_dxf dxf_linear_extrude linear_extrude rotate_extrude surface projection render children dxf_cross dxf_dim let assign'
            },
            contains: [
            hljs.C_LINE_COMMENT_MODE,
            hljs.C_BLOCK_COMMENT_MODE,
            NUMBERS,
            PREPRO,
            STRING,
            SPECIAL_VARS,
            MODIFIERS,
            FUNCTIONS
            ]
        }
    };
}, {}
],
125: [function(require, module, exports) {
    module.exports = function(hljs) {
        var OXYGENE_KEYWORDS = 'abstract add and array as asc aspect assembly async begin break block by case class concat const copy constructor continue ' +
        'create default delegate desc distinct div do downto dynamic each else empty end ensure enum equals event except exit extension external false ' +
        'final finalize finalizer finally flags for forward from function future global group has if implementation implements implies in index inherited ' +
        'inline interface into invariants is iterator join locked locking loop matching method mod module namespace nested new nil not notify nullable of ' +
        'old on operator or order out override parallel params partial pinned private procedure property protected public queryable raise read readonly ' +
        'record reintroduce remove repeat require result reverse sealed select self sequence set shl shr skip static step soft take then to true try tuple ' +
        'type union unit unsafe until uses using var virtual raises volatile where while with write xor yield await mapped deprecated stdcall cdecl pascal ' +
        'register safecall overload library platform reference packed strict published autoreleasepool selector strong weak unretained';
        var CURLY_COMMENT = hljs.COMMENT(
        '{',
        '}',
        {
            relevance: 0
        });
        var PAREN_COMMENT = hljs.COMMENT(
        '\\(\\*',
        '\\*\\)',
        {
            relevance: 10
        });
        var STRING = {
            className: 'string',
            begin: '\'',
            end: '\'',
            contains: [{
                begin: '\'\''
            }
            ]
        };
        var CHAR_STRING = {
            className: 'string',
            begin: '(#\\d+)+'
        };
        var FUNCTION = {
            className: 'function',
            beginKeywords: 'function constructor destructor procedure method',
            end: '[:;]',
            keywords: 'function constructor|10 destructor|10 procedure|10 method|10',
            contains: [
            hljs.TITLE_MODE,
            {
                className: 'params',
                begin: '\\(',
                end: '\\)',
                keywords: OXYGENE_KEYWORDS,
                contains: [STRING, CHAR_STRING]
            },
            CURLY_COMMENT, PAREN_COMMENT
            ]
        };
        return {
            case_insensitive: true,
            keywords: OXYGENE_KEYWORDS,
            illegal: '("|\\$[G-Zg-z]|\\/\\*|</|=>|->)',
            contains: [
            CURLY_COMMENT, PAREN_COMMENT, hljs.C_LINE_COMMENT_MODE,
            STRING, CHAR_STRING,
            hljs.NUMBER_MODE,
            FUNCTION,
            {
                className: 'class',
                begin: '=\\bclass\\b',
                end: 'end;',
                keywords: OXYGENE_KEYWORDS,
                contains: [
                STRING, CHAR_STRING,
                CURLY_COMMENT, PAREN_COMMENT, hljs.C_LINE_COMMENT_MODE,
                FUNCTION
                ]
            }
            ]
        };
    };
}, {}
],
126: [function(require, module, exports) {
    module.exports = function(hljs) {
        var CURLY_SUBCOMMENT = hljs.COMMENT(
        '{',
        '}',
        {
            contains: ['self']
        });
        return {
            subLanguage: 'xml',
            relevance: 0,
            contains: [
            hljs.COMMENT('^#', '$'),
            hljs.COMMENT(
            '\\^rem{',
            '}',
            {
                relevance: 10,
                contains: [
                CURLY_SUBCOMMENT
                ]
            }),
            {
                className: 'preprocessor',
                begin: '^@(?:BASE|USE|CLASS|OPTIONS)$',
                relevance: 10
            },
            {
                className: 'title',
                begin: '@[\\w\\-]+\\[[\\w^;\\-]*\\](?:\\[[\\w^;\\-]*\\])?(?:.*)$'
            },
            {
                className: 'variable',
                begin: '\\$\\{?[\\w\\-\\.\\:]+\\}?'
            },
            {
                className: 'keyword',
                begin: '\\^[\\w\\-\\.\\:]+'
            },
            {
                className: 'number',
                begin: '\\^#[0-9a-fA-F]+'
            },
            hljs.C_NUMBER_MODE
            ]
        };
    };
}, {}
],
127: [function(require, module, exports) {
    module.exports = function(hljs) {
        var PERL_KEYWORDS = 'getpwent getservent quotemeta msgrcv scalar kill dbmclose undef lc ' +
        'ma syswrite tr send umask sysopen shmwrite vec qx utime local oct semctl localtime ' +
        'readpipe do return format read sprintf dbmopen pop getpgrp not getpwnam rewinddir qq' +
        'fileno qw endprotoent wait sethostent bless s|0 opendir continue each sleep endgrent ' +
        'shutdown dump chomp connect getsockname die socketpair close flock exists index shmget' +
        'sub for endpwent redo lstat msgctl setpgrp abs exit select print ref gethostbyaddr ' +
        'unshift fcntl syscall goto getnetbyaddr join gmtime symlink semget splice x|0 ' +
        'getpeername recv log setsockopt cos last reverse gethostbyname getgrnam study formline ' +
        'endhostent times chop length gethostent getnetent pack getprotoent getservbyname rand ' +
        'mkdir pos chmod y|0 substr endnetent printf next open msgsnd readdir use unlink ' +
        'getsockopt getpriority rindex wantarray hex system getservbyport endservent int chr ' +
        'untie rmdir prototype tell listen fork shmread ucfirst setprotoent else sysseek link ' +
        'getgrgid shmctl waitpid unpack getnetbyname reset chdir grep split require caller ' +
        'lcfirst until warn while values shift telldir getpwuid my getprotobynumber delete and ' +
        'sort uc defined srand accept package seekdir getprotobyname semop our rename seek if q|0 ' +
        'chroot sysread setpwent no crypt getc chown sqrt write setnetent setpriority foreach ' +
        'tie sin msgget map stat getlogin unless elsif truncate exec keys glob tied closedir' +
        'ioctl socket readlink eval xor readline binmode setservent eof ord bind alarm pipe ' +
        'atan2 getgrent exp time push setgrent gt lt or ne m|0 break given say state when';
        var SUBST = {
            className: 'subst',
            begin: '[$@]\\{',
            end: '\\}',
            keywords: PERL_KEYWORDS
        };
        var METHOD = {
            begin: '->{',
            end: '}'
            // contains defined later
        };
        var VAR = {
            className: 'variable',
            variants: [
            {
                begin: /\$\d/
            },
            {
                begin: /[\$%@](\^\w\b|#\w+(::\w+)*|{\w+}|\w+(::\w*)*)/
            },
            {
                begin: /[\$%@][^\s\w{]/,
                relevance: 0
            }
            ]
        };
        var STRING_CONTAINS = [hljs.BACKSLASH_ESCAPE, SUBST, VAR];
        var PERL_DEFAULT_CONTAINS = [
        VAR,
        hljs.HASH_COMMENT_MODE,
        hljs.COMMENT(
        '^\\=\\w',
        '\\=cut',
        {
            endsWithParent: true
        }),
        METHOD,
        {
            className: 'string',
            contains: STRING_CONTAINS,
            variants: [
            {
                begin: 'q[qwxr]?\\s*\\(',
                end: '\\)',
                relevance: 5
            },
            {
                begin: 'q[qwxr]?\\s*\\[',
                end: '\\]',
                relevance: 5
            },
            {
                begin: 'q[qwxr]?\\s*\\{',
                end: '\\}',
                relevance: 5
            },
            {
                begin: 'q[qwxr]?\\s*\\|',
                end: '\\|',
                relevance: 5
            },
            {
                begin: 'q[qwxr]?\\s*\\<',
                end: '\\>',
                relevance: 5
            },
            {
                begin: 'qw\\s+q',
                end: 'q',
                relevance: 5
            },
            {
                begin: '\'',
                end: '\'',
                contains: [hljs.BACKSLASH_ESCAPE]
            },
            {
                begin: '"',
                end: '"'
            },
            {
                begin: '`',
                end: '`',
                contains: [hljs.BACKSLASH_ESCAPE]
            },
            {
                begin: '{\\w+}',
                contains: [],
                relevance: 0
            },
            {
                begin: '\-?\\w+\\s*\\=\\>',
                contains: [],
                relevance: 0
            }
            ]
        },
        {
            className: 'number',
            begin: '(\\b0[0-7_]+)|(\\b0x[0-9a-fA-F_]+)|(\\b[1-9][0-9_]*(\\.[0-9_]+)?)|[0_]\\b',
            relevance: 0
        },
        {
            // regexp container
            begin: '(\\/\\/|' + hljs.RE_STARTERS_RE + '|\\b(split|return|print|reverse|grep)\\b)\\s*',
            keywords: 'split return print reverse grep',
            relevance: 0,
            contains: [
            hljs.HASH_COMMENT_MODE,
            {
                className: 'regexp',
                begin: '(s|tr|y)/(\\\\.|[^/])*/(\\\\.|[^/])*/[a-z]*',
                relevance: 10
            },
            {
                className: 'regexp',
                begin: '(m|qr)?/',
                end: '/[a-z]*',
                contains: [hljs.BACKSLASH_ESCAPE],
                relevance: 0 // allows empty "//" which is a common comment delimiter in other languages
            }
            ]
        },
        {
            className: 'sub',
            beginKeywords: 'sub',
            end: '(\\s*\\(.*?\\))?[;{]',
            relevance: 5
        },
        {
            className: 'operator',
            begin: '-\\w\\b',
            relevance: 0
        },
        {
            begin: "^__DATA__$",
            end: "^__END__$",
            subLanguage: 'mojolicious',
            contains: [
            {
                begin: "^@@.*",
                end: "$",
                className: "comment"
            }
            ]
        }
        ];
        SUBST.contains = PERL_DEFAULT_CONTAINS;
        METHOD.contains = PERL_DEFAULT_CONTAINS;

        return {
            aliases: ['pl'],
            keywords: PERL_KEYWORDS,
            contains: PERL_DEFAULT_CONTAINS
        };
    };
}, {}
],
128: [function(require, module, exports) {
    module.exports = function(hljs) {
        var MACRO = {
            className: 'variable',
            begin: /\$[\w\d#@][\w\d_]*/
        };
        var TABLE = {
            className: 'variable',
            begin: /</,
            end: />/
        };
        var QUOTE_STRING = {
            className: 'string',
            begin: /"/,
            end: /"/
        };

        return {
            aliases: ['pf.conf'],
            lexemes: /[a-z0-9_<>-]+/,
            keywords: {
                built_in: /* block match pass are "actions" in pf.conf(5), the rest are
                                 * lexically similar top-level commands.
                                 */
                'block match pass load anchor|5 antispoof|10 set table',
                keyword:
                'in out log quick on rdomain inet inet6 proto from port os to route' +
                'allow-opts divert-packet divert-reply divert-to flags group icmp-type' +
                'icmp6-type label once probability recieved-on rtable prio queue' +
                'tos tag tagged user keep fragment for os drop' +
                'af-to|10 binat-to|10 nat-to|10 rdr-to|10 bitmask least-stats random round-robin' +
                'source-hash static-port' +
                'dup-to reply-to route-to' +
                'parent bandwidth default min max qlimit' +
                'block-policy debug fingerprints hostid limit loginterface optimization' +
                'reassemble ruleset-optimization basic none profile skip state-defaults' +
                'state-policy timeout' +
                'const counters persist' +
                'no modulate synproxy state|5 floating if-bound no-sync pflow|10 sloppy' +
                'source-track global rule max-src-nodes max-src-states max-src-conn' +
                'max-src-conn-rate overload flush' +
                'scrub|5 max-mss min-ttl no-df|10 random-id',
                literal:
                'all any no-route self urpf-failed egress|5 unknown'
            },
            contains: [
            hljs.HASH_COMMENT_MODE,
            hljs.NUMBER_MODE,
            hljs.QUOTE_STRING_MODE,
            MACRO,
            TABLE
            ]
        };
    };
}, {}
],
129: [function(require, module, exports) {
    module.exports = function(hljs) {
        var VARIABLE = {
            className: 'variable',
            begin: '\\$+[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*'
        };
        var PREPROCESSOR = {
            className: 'preprocessor',
            begin: /<\?(php)?|\?>/
        };
        var STRING = {
            className: 'string',
            contains: [hljs.BACKSLASH_ESCAPE, PREPROCESSOR],
            variants: [
            {
                begin: 'b"',
                end: '"'
            },
            {
                begin: 'b\'',
                end: '\''
            },
            hljs.inherit(hljs.APOS_STRING_MODE, {
                illegal: null
            }),
            hljs.inherit(hljs.QUOTE_STRING_MODE, {
                illegal: null
            })
            ]
        };
        var NUMBER = {
            variants: [hljs.BINARY_NUMBER_MODE, hljs.C_NUMBER_MODE]
        };
        return {
            aliases: ['php3', 'php4', 'php5', 'php6'],
            case_insensitive: true,
            keywords:
            'and include_once list abstract global private echo interface as static endswitch ' +
            'array null if endwhile or const for endforeach self var while isset public ' +
            'protected exit foreach throw elseif include __FILE__ empty require_once do xor ' +
            'return parent clone use __CLASS__ __LINE__ else break print eval new ' +
            'catch __METHOD__ case exception default die require __FUNCTION__ ' +
            'enddeclare final try switch continue endfor endif declare unset true false ' +
            'trait goto instanceof insteadof __DIR__ __NAMESPACE__ ' +
            'yield finally',
            contains: [
            hljs.C_LINE_COMMENT_MODE,
            hljs.HASH_COMMENT_MODE,
            hljs.COMMENT(
            '/\\*',
            '\\*/',
            {
                contains: [
                {
                    className: 'doctag',
                    begin: '@[A-Za-z]+'
                },
                PREPROCESSOR
                ]
            }),
            hljs.COMMENT(
            '__halt_compiler.+?;',
            false,
            {
                endsWithParent: true,
                keywords: '__halt_compiler',
                lexemes: hljs.UNDERSCORE_IDENT_RE
            }),
            {
                className: 'string',
                begin: /<<<['"]?\w+['"]?$/,
                end: /^\w+;?$/,
                contains: [
                hljs.BACKSLASH_ESCAPE,
                {
                    className: 'subst',
                    variants: [
                    {
                        begin: /\$\w+/
                    },
                    {
                        begin: /\{\$/,
                        end: /\}/
                    }
                    ]
                }
                ]
            },
            PREPROCESSOR,
            VARIABLE,
            {
                // swallow composed identifiers to avoid parsing them as keywords
                begin: /(::|->)+[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*/
            },
            {
                className: 'function',
                beginKeywords: 'function',
                end: /[;{]/,
                excludeEnd: true,
                illegal: '\\$|\\[|%',
                contains: [
                hljs.UNDERSCORE_TITLE_MODE,
                {
                    className: 'params',
                    begin: '\\(',
                    end: '\\)',
                    contains: [
                    'self',
                    VARIABLE,
                    hljs.C_BLOCK_COMMENT_MODE,
                    STRING,
                    NUMBER
                    ]
                }
                ]
            },
            {
                className: 'class',
                beginKeywords: 'class interface',
                end: '{',
                excludeEnd: true,
                illegal: /[:\(\$"]/,
                contains: [
                {
                    beginKeywords: 'extends implements'
                },
                hljs.UNDERSCORE_TITLE_MODE
                ]
            },
            {
                beginKeywords: 'namespace',
                end: ';',
                illegal: /[\.']/,
                contains: [hljs.UNDERSCORE_TITLE_MODE]
            },
            {
                beginKeywords: 'use',
                end: ';',
                contains: [hljs.UNDERSCORE_TITLE_MODE]
            },
            {
                begin: '=>' // No markup, just a relevance booster
            },
            STRING,
            NUMBER
            ]
        };
    };
}, {}
],
130: [function(require, module, exports) {
    module.exports = function(hljs) {
        var backtickEscape = {
            begin: '`[\\s\\S]',
            relevance: 0
        };
        var VAR = {
            className: 'variable',
            variants: [
            {
                begin: /\$[\w\d][\w\d_:]*/
            }
            ]
        };
        var QUOTE_STRING = {
            className: 'string',
            begin: /"/,
            end: /"/,
            contains: [
            backtickEscape,
            VAR,
            {
                className: 'variable',
                begin: /\$[A-z]/,
                end: /[^A-z]/
            }
            ]
        };
        var APOS_STRING = {
            className: 'string',
            begin: /'/,
            end: /'/
        };

        return {
            aliases: ['ps'],
            lexemes: /-?[A-z\.\-]+/,
            case_insensitive: true,
            keywords: {
                keyword: 'if else foreach return function do while until elseif begin for trap data dynamicparam end break throw param continue finally in switch exit filter try process catch',
                literal: '$null $true $false',
                built_in: 'Add-Content Add-History Add-Member Add-PSSnapin Clear-Content Clear-Item Clear-Item Property Clear-Variable Compare-Object ConvertFrom-SecureString Convert-Path ConvertTo-Html ConvertTo-SecureString Copy-Item Copy-ItemProperty Export-Alias Export-Clixml Export-Console Export-Csv ForEach-Object Format-Custom Format-List Format-Table Format-Wide Get-Acl Get-Alias Get-AuthenticodeSignature Get-ChildItem Get-Command Get-Content Get-Credential Get-Culture Get-Date Get-EventLog Get-ExecutionPolicy Get-Help Get-History Get-Host Get-Item Get-ItemProperty Get-Location Get-Member Get-PfxCertificate Get-Process Get-PSDrive Get-PSProvider Get-PSSnapin Get-Service Get-TraceSource Get-UICulture Get-Unique Get-Variable Get-WmiObject Group-Object Import-Alias Import-Clixml Import-Csv Invoke-Expression Invoke-History Invoke-Item Join-Path Measure-Command Measure-Object Move-Item Move-ItemProperty New-Alias New-Item New-ItemProperty New-Object New-PSDrive New-Service New-TimeSpan New-Variable Out-Default Out-File Out-Host Out-Null Out-Printer Out-String Pop-Location Push-Location Read-Host Remove-Item Remove-ItemProperty Remove-PSDrive Remove-PSSnapin Remove-Variable Rename-Item Rename-ItemProperty Resolve-Path Restart-Service Resume-Service Select-Object Select-String Set-Acl Set-Alias Set-AuthenticodeSignature Set-Content Set-Date Set-ExecutionPolicy Set-Item Set-ItemProperty Set-Location Set-PSDebug Set-Service Set-TraceSource Set-Variable Sort-Object Split-Path Start-Service Start-Sleep Start-Transcript Stop-Process Stop-Service Stop-Transcript Suspend-Service Tee-Object Test-Path Trace-Command Update-FormatData Update-TypeData Where-Object Write-Debug Write-Error Write-Host Write-Output Write-Progress Write-Verbose Write-Warning',
                operator: '-ne -eq -lt -gt -ge -le -not -like -notlike -match -notmatch -contains -notcontains -in -notin -replace'
            },
            contains: [
            hljs.HASH_COMMENT_MODE,
            hljs.NUMBER_MODE,
            QUOTE_STRING,
            APOS_STRING,
            VAR
            ]
        };
    };
}, {}
],
131: [function(require, module, exports) {
    module.exports = function(hljs) {
        return {
            keywords: {
                keyword: 'BufferedReader PVector PFont PImage PGraphics HashMap boolean byte char color ' +
                'double float int long String Array FloatDict FloatList IntDict IntList JSONArray JSONObject ' +
                'Object StringDict StringList Table TableRow XML ' +
                // Java keywords
                'false synchronized int abstract float private char boolean static null if const ' +
                'for true while long throw strictfp finally protected import native final return void ' +
                'enum else break transient new catch instanceof byte super volatile case assert short ' +
                'package default double public try this switch continue throws protected public private',
                constant: 'P2D P3D HALF_PI PI QUARTER_PI TAU TWO_PI',
                variable: 'displayHeight displayWidth mouseY mouseX mousePressed pmouseX pmouseY key ' +
                'keyCode pixels focused frameCount frameRate height width',
                title: 'setup draw',
                built_in: 'size createGraphics beginDraw createShape loadShape PShape arc ellipse line point ' +
                'quad rect triangle bezier bezierDetail bezierPoint bezierTangent curve curveDetail curvePoint ' +
                'curveTangent curveTightness shape shapeMode beginContour beginShape bezierVertex curveVertex ' +
                'endContour endShape quadraticVertex vertex ellipseMode noSmooth rectMode smooth strokeCap ' +
                'strokeJoin strokeWeight mouseClicked mouseDragged mouseMoved mousePressed mouseReleased ' +
                'mouseWheel keyPressed keyPressedkeyReleased keyTyped print println save saveFrame day hour ' +
                'millis minute month second year background clear colorMode fill noFill noStroke stroke alpha ' +
                'blue brightness color green hue lerpColor red saturation modelX modelY modelZ screenX screenY ' +
                'screenZ ambient emissive shininess specular add createImage beginCamera camera endCamera frustum ' +
                'ortho perspective printCamera printProjection cursor frameRate noCursor exit loop noLoop popStyle ' +
                'pushStyle redraw binary boolean byte char float hex int str unbinary unhex join match matchAll nf ' +
                'nfc nfp nfs split splitTokens trim append arrayCopy concat expand reverse shorten sort splice subset ' +
                'box sphere sphereDetail createInput createReader loadBytes loadJSONArray loadJSONObject loadStrings ' +
                'loadTable loadXML open parseXML saveTable selectFolder selectInput beginRaw beginRecord createOutput ' +
                'createWriter endRaw endRecord PrintWritersaveBytes saveJSONArray saveJSONObject saveStream saveStrings ' +
                'saveXML selectOutput popMatrix printMatrix pushMatrix resetMatrix rotate rotateX rotateY rotateZ scale ' +
                'shearX shearY translate ambientLight directionalLight lightFalloff lights lightSpecular noLights normal ' +
                'pointLight spotLight image imageMode loadImage noTint requestImage tint texture textureMode textureWrap ' +
                'blend copy filter get loadPixels set updatePixels blendMode loadShader PShaderresetShader shader createFont ' +
                'loadFont text textFont textAlign textLeading textMode textSize textWidth textAscent textDescent abs ceil ' +
                'constrain dist exp floor lerp log mag map max min norm pow round sq sqrt acos asin atan atan2 cos degrees ' +
                'radians sin tan noise noiseDetail noiseSeed random randomGaussian randomSeed'
            },
            contains: [
            hljs.C_LINE_COMMENT_MODE,
            hljs.C_BLOCK_COMMENT_MODE,
            hljs.APOS_STRING_MODE,
            hljs.QUOTE_STRING_MODE,
            hljs.C_NUMBER_MODE
            ]
        };
    };
}, {}
],
132: [function(require, module, exports) {
    module.exports = function(hljs) {
        return {
            contains: [
            hljs.C_NUMBER_MODE,
            {
                className: 'built_in',
                begin: '{',
                end: '}$',
                excludeBegin: true,
                excludeEnd: true,
                contains: [hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE],
                relevance: 0
            },
            {
                className: 'filename',
                begin: '[a-zA-Z_][\\da-zA-Z_]+\\.[\\da-zA-Z_]{1,3}',
                end: ':',
                excludeEnd: true
            },
            {
                className: 'header',
                begin: '(ncalls|tottime|cumtime)',
                end: '$',
                keywords: 'ncalls tottime|10 cumtime|10 filename',
                relevance: 10
            },
            {
                className: 'summary',
                begin: 'function calls',
                end: '$',
                contains: [hljs.C_NUMBER_MODE],
                relevance: 10
            },
            hljs.APOS_STRING_MODE,
            hljs.QUOTE_STRING_MODE,
            {
                className: 'function',
                begin: '\\(',
                end: '\\)$',
                contains: [
                hljs.UNDERSCORE_TITLE_MODE
                ],
                relevance: 0
            }
            ]
        };
    };
}, {}
],
133: [function(require, module, exports) {
    module.exports = function(hljs) {

        var ATOM = {

            className: 'atom',
            begin: /[a-z][A-Za-z0-9_]*/,
            relevance: 0
        };

        var VAR = {

            className: 'name',
            variants: [
            {
                begin: /[A-Z][a-zA-Z0-9_]*/
            },
            {
                begin: /_[A-Za-z0-9_]*/
            },
            ],
            relevance: 0
        };

        var PARENTED = {

            begin: /\(/,
            end: /\)/,
            relevance: 0
        };

        var LIST = {

            begin: /\[/,
            end: /\]/
        };

        var LINE_COMMENT = {

            className: 'comment',
            begin: /%/, end: /$/,
            contains: [hljs.PHRASAL_WORDS_MODE]
        };

        var BACKTICK_STRING = {

            className: 'string',
            begin: /`/,
            end: /`/,
            contains: [hljs.BACKSLASH_ESCAPE]
        };

        var CHAR_CODE = {

            className: 'string',
            // 0'a etc.
            begin: /0\'(\\\'|.)/
        };

        var SPACE_CODE = {

            className: 'string',
            begin: /0\'\\s/ // 0'\s
        };

        var PRED_OP = {
            // relevance booster
            begin: /:-/
        };

        var inner = [
        ATOM,
        VAR,
        PARENTED,
        PRED_OP,
        LIST,
        LINE_COMMENT,
        hljs.C_BLOCK_COMMENT_MODE,
        hljs.QUOTE_STRING_MODE,
        hljs.APOS_STRING_MODE,
        BACKTICK_STRING,
        CHAR_CODE,
        SPACE_CODE,
        hljs.C_NUMBER_MODE
        ];

        PARENTED.contains = inner;
        LIST.contains = inner;

        return {
            contains: inner.concat([
            {
                begin: /\.$/
            }
            // relevance booster
            ])
        };
    };
}, {}
],
134: [function(require, module, exports) {
    module.exports = function(hljs) {
        return {
            keywords: {
                keyword: 'package import option optional required repeated group',
                built_in: 'double float int32 int64 uint32 uint64 sint32 sint64 ' +
                'fixed32 fixed64 sfixed32 sfixed64 bool string bytes',
                literal: 'true false'
            },
            contains: [
            hljs.QUOTE_STRING_MODE,
            hljs.NUMBER_MODE,
            hljs.C_LINE_COMMENT_MODE,
            {
                className: 'class',
                beginKeywords: 'message enum service',
                end: /\{/,
                illegal: /\n/,
                contains: [
                hljs.inherit(hljs.TITLE_MODE, {
                    starts: {
                        endsWithParent: true,
                        excludeEnd: true
                    }
                    // hack: eating everything after the first title
                })
                ]
            },
            {
                className: 'function',
                beginKeywords: 'rpc',
                end: /;/,
                excludeEnd: true,
                keywords: 'rpc returns'
            },
            {
                className: 'constant',
                begin: /^\s*[A-Z_]+/,
                end: /\s*=/,
                excludeEnd: true
            }
            ]
        };
    };
}, {}
],
135: [function(require, module, exports) {
    module.exports = function(hljs) {

        var PUPPET_KEYWORDS = {
            keyword:
            /* language keywords */
            'and case default else elsif false if in import enherits node or true undef unless main settings $string ',
            literal:
            /* metaparameters */
            'alias audit before loglevel noop require subscribe tag ' +
            /* normal attributes */
            'owner ensure group mode name|0 changes context force incl lens load_path onlyif provider returns root show_diff type_check ' +
            'en_address ip_address realname command environment hour monute month monthday special target weekday ' +
            'creates cwd ogoutput refresh refreshonly tries try_sleep umask backup checksum content ctime force ignore ' +
            'links mtime purge recurse recurselimit replace selinux_ignore_defaults selrange selrole seltype seluser source ' +
            'souirce_permissions sourceselect validate_cmd validate_replacement allowdupe attribute_membership auth_membership forcelocal gid ' +
            'ia_load_module members system host_aliases ip allowed_trunk_vlans description device_url duplex encapsulation etherchannel ' +
            'native_vlan speed principals allow_root auth_class auth_type authenticate_user k_of_n mechanisms rule session_owner shared options ' +
            'device fstype enable hasrestart directory present absent link atboot blockdevice device dump pass remounts poller_tag use ' +
            'message withpath adminfile allow_virtual allowcdrom category configfiles flavor install_options instance package_settings platform ' +
            'responsefile status uninstall_options vendor unless_system_user unless_uid binary control flags hasstatus manifest pattern restart running ' +
            'start stop allowdupe auths expiry gid groups home iterations key_membership keys managehome membership password password_max_age ' +
            'password_min_age profile_membership profiles project purge_ssh_keys role_membership roles salt shell uid baseurl cost descr enabled ' +
            'enablegroups exclude failovermethod gpgcheck gpgkey http_caching include includepkgs keepalive metadata_expire metalink mirrorlist ' +
            'priority protect proxy proxy_password proxy_username repo_gpgcheck s3_enabled skip_if_unavailable sslcacert sslclientcert sslclientkey ' +
            'sslverify mounted',
            built_in:
            /* core facts */
            'architecture augeasversion blockdevices boardmanufacturer boardproductname boardserialnumber cfkey dhcp_servers ' +
            'domain ec2_ ec2_userdata facterversion filesystems ldom fqdn gid hardwareisa hardwaremodel hostname id|0 interfaces ' +
            'ipaddress ipaddress_ ipaddress6 ipaddress6_ iphostnumber is_virtual kernel kernelmajversion kernelrelease kernelversion ' +
            'kernelrelease kernelversion lsbdistcodename lsbdistdescription lsbdistid lsbdistrelease lsbmajdistrelease lsbminordistrelease ' +
            'lsbrelease macaddress macaddress_ macosx_buildversion macosx_productname macosx_productversion macosx_productverson_major ' +
            'macosx_productversion_minor manufacturer memoryfree memorysize netmask metmask_ network_ operatingsystem operatingsystemmajrelease ' +
            'operatingsystemrelease osfamily partitions path physicalprocessorcount processor processorcount productname ps puppetversion ' +
            'rubysitedir rubyversion selinux selinux_config_mode selinux_config_policy selinux_current_mode selinux_current_mode selinux_enforced ' +
            'selinux_policyversion serialnumber sp_ sshdsakey sshecdsakey sshrsakey swapencrypted swapfree swapsize timezone type uniqueid uptime ' +
            'uptime_days uptime_hours uptime_seconds uuid virtual vlans xendomains zfs_version zonenae zones zpool_version'
        };

        var COMMENT = hljs.COMMENT('#', '$');

        var IDENT_RE = '([A-Za-z_]|::)(\\w|::)*';

        var TITLE = hljs.inherit(hljs.TITLE_MODE, {
            begin: IDENT_RE
        });

        var VARIABLE = {
            className: 'variable',
            begin: '\\$' + IDENT_RE
        };

        var STRING = {
            className: 'string',
            contains: [hljs.BACKSLASH_ESCAPE, VARIABLE],
            variants: [
            {
                begin: /'/,
                end: /'/
            },
            {
                begin: /"/,
                end: /"/
            }
            ]
        };

        return {
            aliases: ['pp'],
            contains: [
            COMMENT,
            VARIABLE,
            STRING,
            {
                beginKeywords: 'class',
                end: '\\{|;',
                illegal: /=/,
                contains: [TITLE, COMMENT]
            },
            {
                beginKeywords: 'define',
                end: /\{/,
                contains: [
                {
                    className: 'title',
                    begin: hljs.IDENT_RE,
                    endsParent: true
                }
                ]
            },
            {
                begin: hljs.IDENT_RE + '\\s+\\{',
                returnBegin: true,
                end: /\S/,
                contains: [
                {
                    className: 'name',
                    begin: hljs.IDENT_RE
                },
                {
                    begin: /\{/,
                    end: /\}/,
                    keywords: PUPPET_KEYWORDS,
                    relevance: 0,
                    contains: [
                    STRING,
                    COMMENT,
                    {
                        begin: '[a-zA-Z_]+\\s*=>'
                    },
                    {
                        className: 'number',
                        begin: '(\\b0[0-7_]+)|(\\b0x[0-9a-fA-F_]+)|(\\b[1-9][0-9_]*(\\.[0-9_]+)?)|[0_]\\b',
                        relevance: 0
                    },
                    VARIABLE
                    ]
                }
                ],
                relevance: 0
            }
            ]
        }
    };
}, {}
],
136: [function(require, module, exports) {
    module.exports = function(hljs) {
        var PROMPT = {
            className: 'prompt',
            begin: /^(>>>|\.\.\.) /
        };
        var STRING = {
            className: 'string',
            contains: [hljs.BACKSLASH_ESCAPE],
            variants: [
            {
                begin: /(u|b)?r?'''/,
                end: /'''/,
                contains: [PROMPT],
                relevance: 10
            },
            {
                begin: /(u|b)?r?"""/,
                end: /"""/,
                contains: [PROMPT],
                relevance: 10
            },
            {
                begin: /(u|r|ur)'/,
                end: /'/,
                relevance: 10
            },
            {
                begin: /(u|r|ur)"/,
                end: /"/,
                relevance: 10
            },
            {
                begin: /(b|br)'/,
                end: /'/
            },
            {
                begin: /(b|br)"/,
                end: /"/
            },
            hljs.APOS_STRING_MODE,
            hljs.QUOTE_STRING_MODE
            ]
        };
        var NUMBER = {
            className: 'number',
            relevance: 0,
            variants: [
            {
                begin: hljs.BINARY_NUMBER_RE + '[lLjJ]?'
            },
            {
                begin: '\\b(0o[0-7]+)[lLjJ]?'
            },
            {
                begin: hljs.C_NUMBER_RE + '[lLjJ]?'
            }
            ]
        };
        var PARAMS = {
            className: 'params',
            begin: /\(/,
            end: /\)/,
            contains: ['self', PROMPT, NUMBER, STRING]
        };
        return {
            aliases: ['py', 'gyp'],
            keywords: {
                keyword:
                'and elif is global as in if from raise for except finally print import pass return ' +
                'exec else break not with class assert yield try while continue del or def lambda ' +
                'async await nonlocal|10 None True False',
                built_in:
                'Ellipsis NotImplemented'
            },
            illegal: /(<\/|->|\?)/,
            contains: [
            PROMPT,
            NUMBER,
            STRING,
            hljs.HASH_COMMENT_MODE,
            {
                variants: [
                {
                    className: 'function',
                    beginKeywords: 'def',
                    relevance: 10
                },
                {
                    className: 'class',
                    beginKeywords: 'class'
                }
                ],
                end: /:/,
                illegal: /[${=;\n,]/,
                contains: [hljs.UNDERSCORE_TITLE_MODE, PARAMS]
            },
            {
                className: 'decorator',
                begin: /^[\t ]*@/,
                end: /$/
            },
            {
                begin: /\b(print|exec)\(/ // don’t highlight keywords-turned-functions in Python 3
            }
            ]
        };
    };
}, {}
],
137: [function(require, module, exports) {
    module.exports = function(hljs) {
        var Q_KEYWORDS = {
            keyword:
            'do while select delete by update from',
            constant:
            '0b 1b',
            built_in:
            'neg not null string reciprocal floor ceiling signum mod xbar xlog and or each scan over prior mmu lsq inv md5 ltime gtime count first var dev med cov cor all any rand sums prds mins maxs fills deltas ratios avgs differ prev next rank reverse iasc idesc asc desc msum mcount mavg mdev xrank mmin mmax xprev rotate distinct group where flip type key til get value attr cut set upsert raze union inter except cross sv vs sublist enlist read0 read1 hopen hclose hdel hsym hcount peach system ltrim rtrim trim lower upper ssr view tables views cols xcols keys xkey xcol xasc xdesc fkeys meta lj aj aj0 ij pj asof uj ww wj wj1 fby xgroup ungroup ej save load rsave rload show csv parse eval min max avg wavg wsum sin cos tan sum',
            typename:
            '`float `double int `timestamp `timespan `datetime `time `boolean `symbol `char `byte `short `long `real `month `date `minute `second `guid'
        };
        return {
            aliases: ['k', 'kdb'],
            keywords: Q_KEYWORDS,
            lexemes: /\b(`?)[A-Za-z0-9_]+\b/,
            contains: [
            hljs.C_LINE_COMMENT_MODE,
            hljs.QUOTE_STRING_MODE,
            hljs.C_NUMBER_MODE
            ]
        };
    };
}, {}
],
138: [function(require, module, exports) {
    module.exports = function(hljs) {
        var IDENT_RE = '([a-zA-Z]|\\.[a-zA-Z.])[a-zA-Z0-9._]*';

        return {
            contains: [
            hljs.HASH_COMMENT_MODE,
            {
                begin: IDENT_RE,
                lexemes: IDENT_RE,
                keywords: {
                    keyword:
                    'function if in break next repeat else for return switch while try tryCatch ' +
                    'stop warning require library attach detach source setMethod setGeneric ' +
                    'setGroupGeneric setClass ...',
                    literal:
                    'NULL NA TRUE FALSE T F Inf NaN NA_integer_|10 NA_real_|10 NA_character_|10 ' +
                    'NA_complex_|10'
                },
                relevance: 0
            },
            {
                // hex value
                className: 'number',
                begin: "0[xX][0-9a-fA-F]+[Li]?\\b",
                relevance: 0
            },
            {
                // explicit integer
                className: 'number',
                begin: "\\d+(?:[eE][+\\-]?\\d*)?L\\b",
                relevance: 0
            },
            {
                // number with trailing decimal
                className: 'number',
                begin: "\\d+\\.(?!\\d)(?:i\\b)?",
                relevance: 0
            },
            {
                // number
                className: 'number',
                begin: "\\d+(?:\\.\\d*)?(?:[eE][+\\-]?\\d*)?i?\\b",
                relevance: 0
            },
            {
                // number with leading decimal
                className: 'number',
                begin: "\\.\\d+(?:[eE][+\\-]?\\d*)?i?\\b",
                relevance: 0
            },
            {
                // escaped identifier
                begin: '`',
                end: '`',
                relevance: 0
            },
            {
                className: 'string',
                contains: [hljs.BACKSLASH_ESCAPE],
                variants: [
                {
                    begin: '"',
                    end: '"'
                },
                {
                    begin: "'",
                    end: "'"
                }
                ]
            }
            ]
        };
    };
}, {}
],
139: [function(require, module, exports) {
    module.exports = function(hljs) {
        return {
            keywords:
            'ArchiveRecord AreaLightSource Atmosphere Attribute AttributeBegin AttributeEnd Basis ' +
            'Begin Blobby Bound Clipping ClippingPlane Color ColorSamples ConcatTransform Cone ' +
            'CoordinateSystem CoordSysTransform CropWindow Curves Cylinder DepthOfField Detail ' +
            'DetailRange Disk Displacement Display End ErrorHandler Exposure Exterior Format ' +
            'FrameAspectRatio FrameBegin FrameEnd GeneralPolygon GeometricApproximation Geometry ' +
            'Hider Hyperboloid Identity Illuminate Imager Interior LightSource ' +
            'MakeCubeFaceEnvironment MakeLatLongEnvironment MakeShadow MakeTexture Matte ' +
            'MotionBegin MotionEnd NuPatch ObjectBegin ObjectEnd ObjectInstance Opacity Option ' +
            'Orientation Paraboloid Patch PatchMesh Perspective PixelFilter PixelSamples ' +
            'PixelVariance Points PointsGeneralPolygons PointsPolygons Polygon Procedural Projection ' +
            'Quantize ReadArchive RelativeDetail ReverseOrientation Rotate Scale ScreenWindow ' +
            'ShadingInterpolation ShadingRate Shutter Sides Skew SolidBegin SolidEnd Sphere ' +
            'SubdivisionMesh Surface TextureCoordinates Torus Transform TransformBegin TransformEnd ' +
            'TransformPoints Translate TrimCurve WorldBegin WorldEnd',
            illegal: '</',
            contains: [
            hljs.HASH_COMMENT_MODE,
            hljs.C_NUMBER_MODE,
            hljs.APOS_STRING_MODE,
            hljs.QUOTE_STRING_MODE
            ]
        };
    };
}, {}
],
140: [function(require, module, exports) {
    module.exports = function(hljs) {
        var IDENTIFIER = '[a-zA-Z-_][^\n{\r\n]+\\{';

        return {
            aliases: ['graph', 'instances'],
            case_insensitive: true,
            keywords: 'import',
            contains: [
            // Facet sections
            {
                className: 'facet',
                begin: '^facet ' + IDENTIFIER,
                end: '}',
                keywords: 'facet installer exports children extends',
                contains: [
                hljs.HASH_COMMENT_MODE
                ]
            },
            // Instance sections
            {
                className: 'instance-of',
                begin: '^instance of ' + IDENTIFIER,
                end: '}',
                keywords: 'name count channels instance-data instance-state instance of',
                contains: [
                // Instance overridden properties
                {
                    className: 'keyword',
                    begin: '[a-zA-Z-_]+( |\t)*:'
                },
                hljs.HASH_COMMENT_MODE
                ]
            },
            // Component sections
            {
                className: 'component',
                begin: '^' + IDENTIFIER,
                end: '}',
                lexemes: '\\(?[a-zA-Z]+\\)?',
                keywords: 'installer exports children extends imports facets alias (optional)',
                contains: [
                // Imported component variables
                {
                    className: 'string',
                    begin: '\\.[a-zA-Z-_]+',
                    end: '\\s|,|;',
                    excludeEnd: true
                },
                hljs.HASH_COMMENT_MODE
                ]
            },
            // Comments
            hljs.HASH_COMMENT_MODE
            ]
        };
    };
}, {}
],
141: [function(require, module, exports) {
    module.exports = function(hljs) {
        return {
            keywords: {
                keyword:
                'float color point normal vector matrix while for if do return else break extern continue',
                built_in:
                'abs acos ambient area asin atan atmosphere attribute calculatenormal ceil cellnoise ' +
                'clamp comp concat cos degrees depth Deriv diffuse distance Du Dv environment exp ' +
                'faceforward filterstep floor format fresnel incident length lightsource log match ' +
                'max min mod noise normalize ntransform opposite option phong pnoise pow printf ' +
                'ptlined radians random reflect refract renderinfo round setcomp setxcomp setycomp ' +
                'setzcomp shadow sign sin smoothstep specular specularbrdf spline sqrt step tan ' +
                'texture textureinfo trace transform vtransform xcomp ycomp zcomp'
            },
            illegal: '</',
            contains: [
            hljs.C_LINE_COMMENT_MODE,
            hljs.C_BLOCK_COMMENT_MODE,
            hljs.QUOTE_STRING_MODE,
            hljs.APOS_STRING_MODE,
            hljs.C_NUMBER_MODE,
            {
                className: 'preprocessor',
                begin: '#',
                end: '$'
            },
            {
                className: 'shader',
                beginKeywords: 'surface displacement light volume imager',
                end: '\\('
            },
            {
                className: 'shading',
                beginKeywords: 'illuminate illuminance gather',
                end: '\\('
            }
            ]
        };
    };
}, {}
],
142: [function(require, module, exports) {
    module.exports = function(hljs) {
        var RUBY_METHOD_RE = '[a-zA-Z_]\\w*[!?=]?|[-+~]\\@|<<|>>|=~|===?|<=>|[<>]=?|\\*\\*|[-/+%^&*~`|]|\\[\\]=?';
        var RUBY_KEYWORDS =
        'and false then defined module in return redo if BEGIN retry end for true self when ' +
        'next until do begin unless END rescue nil else break undef not super class case ' +
        'require yield alias while ensure elsif or include attr_reader attr_writer attr_accessor';
        var YARDOCTAG = {
            className: 'doctag',
            begin: '@[A-Za-z]+'
        };
        var IRB_OBJECT = {
            className: 'value',
            begin: '#<',
            end: '>'
        };
        var COMMENT_MODES = [
        hljs.COMMENT(
        '#',
        '$',
        {
            contains: [YARDOCTAG]
        }),
        hljs.COMMENT(
        '^\\=begin',
        '^\\=end',
        {
            contains: [YARDOCTAG],
            relevance: 10
        }),
        hljs.COMMENT('^__END__', '\\n$')
        ];
        var SUBST = {
            className: 'subst',
            begin: '#\\{',
            end: '}',
            keywords: RUBY_KEYWORDS
        };
        var STRING = {
            className: 'string',
            contains: [hljs.BACKSLASH_ESCAPE, SUBST],
            variants: [
            {
                begin: /'/,
                end: /'/
            },
            {
                begin: /"/,
                end: /"/
            },
            {
                begin: /`/,
                end: /`/
            },
            {
                begin: '%[qQwWx]?\\(',
                end: '\\)'
            },
            {
                begin: '%[qQwWx]?\\[',
                end: '\\]'
            },
            {
                begin: '%[qQwWx]?{',
                end: '}'
            },
            {
                begin: '%[qQwWx]?<',
                end: '>'
            },
            {
                begin: '%[qQwWx]?/',
                end: '/'
            },
            {
                begin: '%[qQwWx]?%',
                end: '%'
            },
            {
                begin: '%[qQwWx]?-',
                end: '-'
            },
            {
                begin: '%[qQwWx]?\\|',
                end: '\\|'
            },
            {
                // \B in the beginning suppresses recognition of ?-sequences where ?
                // is the last character of a preceding identifier, as in: `func?4`
                begin: /\B\?(\\\d{1,3}|\\x[A-Fa-f0-9]{1,2}|\\u[A-Fa-f0-9]{4}|\\?\S)\b/
            }
            ]
        };
        var PARAMS = {
            className: 'params',
            begin: '\\(',
            end: '\\)',
            keywords: RUBY_KEYWORDS
        };

        var RUBY_DEFAULT_CONTAINS = [
        STRING,
        IRB_OBJECT,
        {
            className: 'class',
            beginKeywords: 'class module',
            end: '$|;',
            illegal: /=/,
            contains: [
            hljs.inherit(hljs.TITLE_MODE, {
                begin: '[A-Za-z_]\\w*(::\\w+)*(\\?|\\!)?'
            }),
            {
                className: 'inheritance',
                begin: '<\\s*',
                contains: [{
                    className: 'parent',
                    begin: '(' + hljs.IDENT_RE + '::)?' + hljs.IDENT_RE
                }
                ]
            }
            ].concat(COMMENT_MODES)
        },
        {
            className: 'function',
            beginKeywords: 'def',
            end: '$|;',
            contains: [
            hljs.inherit(hljs.TITLE_MODE, {
                begin: RUBY_METHOD_RE
            }),
            PARAMS
            ].concat(COMMENT_MODES)
        },
        {
            className: 'constant',
            begin: '(::)?(\\b[A-Z]\\w*(::)?)+',
            relevance: 0
        },
        {
            className: 'symbol',
            begin: hljs.UNDERSCORE_IDENT_RE + '(\\!|\\?)?:',
            relevance: 0
        },
        {
            className: 'symbol',
            begin: ':',
            contains: [STRING, {
                begin: RUBY_METHOD_RE
            }
            ],
            relevance: 0
        },
        {
            className: 'number',
            begin: '(\\b0[0-7_]+)|(\\b0x[0-9a-fA-F_]+)|(\\b[1-9][0-9_]*(\\.[0-9_]+)?)|[0_]\\b',
            relevance: 0
        },
        {
            className: 'variable',
            begin: '(\\$\\W)|((\\$|\\@\\@?)(\\w+))'
        },
        {
            // regexp container
            begin: '(' + hljs.RE_STARTERS_RE + ')\\s*',
            contains: [
            IRB_OBJECT,
            {
                className: 'regexp',
                contains: [hljs.BACKSLASH_ESCAPE, SUBST],
                illegal: /\n/,
                variants: [
                {
                    begin: '/',
                    end: '/[a-z]*'
                },
                {
                    begin: '%r{',
                    end: '}[a-z]*'
                },
                {
                    begin: '%r\\(',
                    end: '\\)[a-z]*'
                },
                {
                    begin: '%r!',
                    end: '![a-z]*'
                },
                {
                    begin: '%r\\[',
                    end: '\\][a-z]*'
                }
                ]
            }
            ].concat(COMMENT_MODES),
            relevance: 0
        }
        ].concat(COMMENT_MODES);

        SUBST.contains = RUBY_DEFAULT_CONTAINS;
        PARAMS.contains = RUBY_DEFAULT_CONTAINS;

        var SIMPLE_PROMPT = "[>?]>";
        var DEFAULT_PROMPT = "[\\w#]+\\(\\w+\\):\\d+:\\d+>";
        var RVM_PROMPT = "(\\w+-)?\\d+\\.\\d+\\.\\d(p\\d+)?[^>]+>";

        var IRB_DEFAULT = [
        {
            begin: /^\s*=>/,
            className: 'status',
            starts: {
                end: '$',
                contains: RUBY_DEFAULT_CONTAINS
            }
        },
        {
            className: 'prompt',
            begin: '^(' + SIMPLE_PROMPT + "|" + DEFAULT_PROMPT + '|' + RVM_PROMPT + ')',
            starts: {
                end: '$',
                contains: RUBY_DEFAULT_CONTAINS
            }
        }
        ];

        return {
            aliases: ['rb', 'gemspec', 'podspec', 'thor', 'irb'],
            keywords: RUBY_KEYWORDS,
            contains: COMMENT_MODES.concat(IRB_DEFAULT).concat(RUBY_DEFAULT_CONTAINS)
        };
    };
}, {}
],
143: [function(require, module, exports) {
    module.exports = function(hljs) {
        return {
            keywords: {
                keyword: 'BILL_PERIOD BILL_START BILL_STOP RS_EFFECTIVE_START RS_EFFECTIVE_STOP RS_JURIS_CODE RS_OPCO_CODE ' +
                'INTDADDATTRIBUTE|5 INTDADDVMSG|5 INTDBLOCKOP|5 INTDBLOCKOPNA|5 INTDCLOSE|5 INTDCOUNT|5 ' +
                'INTDCOUNTSTATUSCODE|5 INTDCREATEMASK|5 INTDCREATEDAYMASK|5 INTDCREATEFACTORMASK|5 ' +
                'INTDCREATEHANDLE|5 INTDCREATEOVERRIDEDAYMASK|5 INTDCREATEOVERRIDEMASK|5 ' +
                'INTDCREATESTATUSCODEMASK|5 INTDCREATETOUPERIOD|5 INTDDELETE|5 INTDDIPTEST|5 INTDEXPORT|5 ' +
                'INTDGETERRORCODE|5 INTDGETERRORMESSAGE|5 INTDISEQUAL|5 INTDJOIN|5 INTDLOAD|5 INTDLOADACTUALCUT|5 ' +
                'INTDLOADDATES|5 INTDLOADHIST|5 INTDLOADLIST|5 INTDLOADLISTDATES|5 INTDLOADLISTENERGY|5 ' +
                'INTDLOADLISTHIST|5 INTDLOADRELATEDCHANNEL|5 INTDLOADSP|5 INTDLOADSTAGING|5 INTDLOADUOM|5 ' +
                'INTDLOADUOMDATES|5 INTDLOADUOMHIST|5 INTDLOADVERSION|5 INTDOPEN|5 INTDREADFIRST|5 INTDREADNEXT|5 ' +
                'INTDRECCOUNT|5 INTDRELEASE|5 INTDREPLACE|5 INTDROLLAVG|5 INTDROLLPEAK|5 INTDSCALAROP|5 INTDSCALE|5 ' +
                'INTDSETATTRIBUTE|5 INTDSETDSTPARTICIPANT|5 INTDSETSTRING|5 INTDSETVALUE|5 INTDSETVALUESTATUS|5 ' +
                'INTDSHIFTSTARTTIME|5 INTDSMOOTH|5 INTDSORT|5 INTDSPIKETEST|5 INTDSUBSET|5 INTDTOU|5 ' +
                'INTDTOURELEASE|5 INTDTOUVALUE|5 INTDUPDATESTATS|5 INTDVALUE|5 STDEV INTDDELETEEX|5 ' +
                'INTDLOADEXACTUAL|5 INTDLOADEXCUT|5 INTDLOADEXDATES|5 INTDLOADEX|5 INTDLOADEXRELATEDCHANNEL|5 ' +
                'INTDSAVEEX|5 MVLOAD|5 MVLOADACCT|5 MVLOADACCTDATES|5 MVLOADACCTHIST|5 MVLOADDATES|5 MVLOADHIST|5 ' +
                'MVLOADLIST|5 MVLOADLISTDATES|5 MVLOADLISTHIST|5 IF FOR NEXT DONE SELECT END CALL ABORT CLEAR CHANNEL FACTOR LIST NUMBER ' +
                'OVERRIDE SET WEEK DISTRIBUTIONNODE ELSE WHEN THEN OTHERWISE IENUM CSV INCLUDE LEAVE RIDER SAVE DELETE ' +
                'NOVALUE SECTION WARN SAVE_UPDATE DETERMINANT LABEL REPORT REVENUE EACH ' +
                'IN FROM TOTAL CHARGE BLOCK AND OR CSV_FILE RATE_CODE AUXILIARY_DEMAND ' +
                'UIDACCOUNT RS BILL_PERIOD_SELECT HOURS_PER_MONTH INTD_ERROR_STOP SEASON_SCHEDULE_NAME ' +
                'ACCOUNTFACTOR ARRAYUPPERBOUND CALLSTOREDPROC GETADOCONNECTION GETCONNECT GETDATASOURCE ' +
                'GETQUALIFIER GETUSERID HASVALUE LISTCOUNT LISTOP LISTUPDATE LISTVALUE PRORATEFACTOR RSPRORATE ' +
                'SETBINPATH SETDBMONITOR WQ_OPEN BILLINGHOURS DATE DATEFROMFLOAT DATETIMEFROMSTRING ' +
                'DATETIMETOSTRING DATETOFLOAT DAY DAYDIFF DAYNAME DBDATETIME HOUR MINUTE MONTH MONTHDIFF ' +
                'MONTHHOURS MONTHNAME ROUNDDATE SAMEWEEKDAYLASTYEAR SECOND WEEKDAY WEEKDIFF YEAR YEARDAY ' +
                'YEARSTR COMPSUM HISTCOUNT HISTMAX HISTMIN HISTMINNZ HISTVALUE MAXNRANGE MAXRANGE MINRANGE ' +
                'COMPIKVA COMPKVA COMPKVARFROMKQKW COMPLF IDATTR FLAG LF2KW LF2KWH MAXKW POWERFACTOR ' +
                'READING2USAGE AVGSEASON MAXSEASON MONTHLYMERGE SEASONVALUE SUMSEASON ACCTREADDATES ' +
                'ACCTTABLELOAD CONFIGADD CONFIGGET CREATEOBJECT CREATEREPORT EMAILCLIENT EXPBLKMDMUSAGE ' +
                'EXPMDMUSAGE EXPORT_USAGE FACTORINEFFECT GETUSERSPECIFIEDSTOP INEFFECT ISHOLIDAY RUNRATE ' +
                'SAVE_PROFILE SETREPORTTITLE USEREXIT WATFORRUNRATE TO TABLE ACOS ASIN ATAN ATAN2 BITAND CEIL ' +
                'COS COSECANT COSH COTANGENT DIVQUOT DIVREM EXP FABS FLOOR FMOD FREPM FREXPN LOG LOG10 MAX MAXN ' +
                'MIN MINNZ MODF POW ROUND ROUND2VALUE ROUNDINT SECANT SIN SINH SQROOT TAN TANH FLOAT2STRING ' +
                'FLOAT2STRINGNC INSTR LEFT LEN LTRIM MID RIGHT RTRIM STRING STRINGNC TOLOWER TOUPPER TRIM ' +
                'NUMDAYS READ_DATE STAGING',
                built_in: 'IDENTIFIER OPTIONS XML_ELEMENT XML_OP XML_ELEMENT_OF DOMDOCCREATE DOMDOCLOADFILE DOMDOCLOADXML ' +
                'DOMDOCSAVEFILE DOMDOCGETROOT DOMDOCADDPI DOMNODEGETNAME DOMNODEGETTYPE DOMNODEGETVALUE DOMNODEGETCHILDCT ' +
                'DOMNODEGETFIRSTCHILD DOMNODEGETSIBLING DOMNODECREATECHILDELEMENT DOMNODESETATTRIBUTE ' +
                'DOMNODEGETCHILDELEMENTCT DOMNODEGETFIRSTCHILDELEMENT DOMNODEGETSIBLINGELEMENT DOMNODEGETATTRIBUTECT ' +
                'DOMNODEGETATTRIBUTEI DOMNODEGETATTRIBUTEBYNAME DOMNODEGETBYNAME'
            },
            contains: [
            hljs.C_LINE_COMMENT_MODE,
            hljs.C_BLOCK_COMMENT_MODE,
            hljs.APOS_STRING_MODE,
            hljs.QUOTE_STRING_MODE,
            hljs.C_NUMBER_MODE,
            {
                className: 'array',
                variants: [
                {
                    begin: '#\\s+[a-zA-Z\\ \\.]*',
                    relevance: 0
                }, // looks like #-comment
                {
                    begin: '#[a-zA-Z\\ \\.]+'
                }
                ]
            }
            ]
        };
    };
}, {}
],
144: [function(require, module, exports) {
    module.exports = function(hljs) {
        var NUM_SUFFIX = '([uif](8|16|32|64|size))\?';
        var BLOCK_COMMENT = hljs.inherit(hljs.C_BLOCK_COMMENT_MODE);
        BLOCK_COMMENT.contains.push('self');
        return {
            aliases: ['rs'],
            keywords: {
                keyword:
                'alignof as be box break const continue crate do else enum extern ' +
                'false fn for if impl in let loop match mod mut offsetof once priv ' +
                'proc pub pure ref return self Self sizeof static struct super trait true ' +
                'type typeof unsafe unsized use virtual while where yield ' +
                'int i8 i16 i32 i64 ' +
                'uint u8 u32 u64 ' +
                'float f32 f64 ' +
                'str char bool',
                built_in:
                // prelude
                'Copy Send Sized Sync Drop Fn FnMut FnOnce drop Box ToOwned Clone ' +
                'PartialEq PartialOrd Eq Ord AsRef AsMut Into From Default Iterator ' +
                'Extend IntoIterator DoubleEndedIterator ExactSizeIterator Option ' +
                'Some None Result Ok Err SliceConcatExt String ToString Vec ' +
                // macros
                'assert! assert_eq! bitflags! bytes! cfg! col! concat! concat_idents! ' +
                'debug_assert! debug_assert_eq! env! panic! file! format! format_args! ' +
                'include_bin! include_str! line! local_data_key! module_path! ' +
                'option_env! print! println! select! stringify! try! unimplemented! ' +
                'unreachable! vec! write! writeln!'
            },
            lexemes: hljs.IDENT_RE + '!?',
            illegal: '</',
            contains: [
            hljs.C_LINE_COMMENT_MODE,
            BLOCK_COMMENT,
            hljs.inherit(hljs.QUOTE_STRING_MODE, {
                illegal: null
            }),
            {
                className: 'string',
                variants: [
                {
                    begin: /r(#*)".*?"\1(?!#)/
                },
                {
                    begin: /'\\?(x\w{2}|u\w{4}|U\w{8}|.)'/
                },
                {
                    begin: /'[a-zA-Z_][a-zA-Z0-9_]*/
                }
                ]
            },
            {
                className: 'number',
                variants: [
                {
                    begin: '\\b0b([01_]+)' + NUM_SUFFIX
                },
                {
                    begin: '\\b0o([0-7_]+)' + NUM_SUFFIX
                },
                {
                    begin: '\\b0x([A-Fa-f0-9_]+)' + NUM_SUFFIX
                },
                {
                    begin: '\\b(\\d[\\d_]*(\\.[0-9_]+)?([eE][+-]?[0-9_]+)?)' +
                    NUM_SUFFIX
                }
                ],
                relevance: 0
            },
            {
                className: 'function',
                beginKeywords: 'fn',
                end: '(\\(|<)',
                excludeEnd: true,
                contains: [hljs.UNDERSCORE_TITLE_MODE]
            },
            {
                className: 'preprocessor',
                begin: '#\\!?\\[',
                end: '\\]'
            },
            {
                beginKeywords: 'type',
                end: '(=|<)',
                contains: [hljs.UNDERSCORE_TITLE_MODE],
                illegal: '\\S'
            },
            {
                beginKeywords: 'trait enum',
                end: '{',
                contains: [
                hljs.inherit(hljs.UNDERSCORE_TITLE_MODE, {
                    endsParent: true
                })
                ],
                illegal: '[\\w\\d]'
            },
            {
                begin: hljs.IDENT_RE + '::'
            },
            {
                begin: '->'
            }
            ]
        };
    };
}, {}
],
145: [function(require, module, exports) {
    module.exports = function(hljs) {

        var ANNOTATION = {
            className: 'annotation',
            begin: '@[A-Za-z]+'
        };

        var STRING = {
            className: 'string',
            begin: 'u?r?"""',
            end: '"""',
            relevance: 10
        };

        var SYMBOL = {
            className: 'symbol',
            begin: '\'\\w[\\w\\d_]*(?!\')'
        };

        var TYPE = {
            className: 'type',
            begin: '\\b[A-Z][A-Za-z0-9_]*',
            relevance: 0
        };

        var NAME = {
            className: 'title',
            begin: /[^0-9\n\t "'(),.`{}\[\]:;][^\n\t "'(),.`{}\[\]:;]+|[^0-9\n\t "'(),.`{}\[\]:;=]/,
            relevance: 0
        };

        var CLASS = {
            className: 'class',
            beginKeywords: 'class object trait type',
            end: /[:={\[(\n;]/,
            contains: [{
                className: 'keyword',
                beginKeywords: 'extends with',
                relevance: 10
            }, NAME]
        };

        var METHOD = {
            className: 'function',
            beginKeywords: 'def val',
            end: /[:={\[(\n;]/,
            contains: [NAME]
        };

        return {
            keywords: {
                literal: 'true false null',
                keyword: 'type yield lazy override def with val var sealed abstract private trait object if forSome for while throw finally protected extends import final return else break new catch super class case package default try this match continue throws implicit'
            },
            contains: [
            hljs.C_LINE_COMMENT_MODE,
            hljs.C_BLOCK_COMMENT_MODE,
            STRING,
            hljs.QUOTE_STRING_MODE,
            SYMBOL,
            TYPE,
            METHOD,
            CLASS,
            hljs.C_NUMBER_MODE,
            ANNOTATION
            ]
        };
    };
}, {}
],
146: [function(require, module, exports) {
    module.exports = function(hljs) {
        var SCHEME_IDENT_RE = '[^\\(\\)\\[\\]\\{\\}",\'`;#|\\\\\\s]+';
        var SCHEME_SIMPLE_NUMBER_RE = '(\\-|\\+)?\\d+([./]\\d+)?';
        var SCHEME_COMPLEX_NUMBER_RE = SCHEME_SIMPLE_NUMBER_RE + '[+\\-]' + SCHEME_SIMPLE_NUMBER_RE + 'i';
        var BUILTINS = {
            built_in:
            'case-lambda call/cc class define-class exit-handler field import ' +
            'inherit init-field interface let*-values let-values let/ec mixin ' +
            'opt-lambda override protect provide public rename require ' +
            'require-for-syntax syntax syntax-case syntax-error unit/sig unless ' +
            'when with-syntax and begin call-with-current-continuation ' +
            'call-with-input-file call-with-output-file case cond define ' +
            'define-syntax delay do dynamic-wind else for-each if lambda let let* ' +
            'let-syntax letrec letrec-syntax map or syntax-rules \' * + , ,@ - ... / ' +
            '; < <= = => > >= ` abs acos angle append apply asin assoc assq assv atan ' +
            'boolean? caar cadr call-with-input-file call-with-output-file ' +
            'call-with-values car cdddar cddddr cdr ceiling char->integer ' +
            'char-alphabetic? char-ci<=? char-ci<? char-ci=? char-ci>=? char-ci>? ' +
            'char-downcase char-lower-case? char-numeric? char-ready? char-upcase ' +
            'char-upper-case? char-whitespace? char<=? char<? char=? char>=? char>? ' +
            'char? close-input-port close-output-port complex? cons cos ' +
            'current-input-port current-output-port denominator display eof-object? ' +
            'eq? equal? eqv? eval even? exact->inexact exact? exp expt floor ' +
            'force gcd imag-part inexact->exact inexact? input-port? integer->char ' +
            'integer? interaction-environment lcm length list list->string ' +
            'list->vector list-ref list-tail list? load log magnitude make-polar ' +
            'make-rectangular make-string make-vector max member memq memv min ' +
            'modulo negative? newline not null-environment null? number->string ' +
            'number? numerator odd? open-input-file open-output-file output-port? ' +
            'pair? peek-char port? positive? procedure? quasiquote quote quotient ' +
            'rational? rationalize read read-char real-part real? remainder reverse ' +
            'round scheme-report-environment set! set-car! set-cdr! sin sqrt string ' +
            'string->list string->number string->symbol string-append string-ci<=? ' +
            'string-ci<? string-ci=? string-ci>=? string-ci>? string-copy ' +
            'string-fill! string-length string-ref string-set! string<=? string<? ' +
            'string=? string>=? string>? string? substring symbol->string symbol? ' +
            'tan transcript-off transcript-on truncate values vector ' +
            'vector->list vector-fill! vector-length vector-ref vector-set! ' +
            'with-input-from-file with-output-to-file write write-char zero?'
        };

        var SHEBANG = {
            className: 'shebang',
            begin: '^#!',
            end: '$'
        };

        var LITERAL = {
            className: 'literal',
            begin: '(#t|#f|#\\\\' + SCHEME_IDENT_RE + '|#\\\\.)'
        };

        var NUMBER = {
            className: 'number',
            variants: [
            {
                begin: SCHEME_SIMPLE_NUMBER_RE,
                relevance: 0
            },
            {
                begin: SCHEME_COMPLEX_NUMBER_RE,
                relevance: 0
            },
            {
                begin: '#b[0-1]+(/[0-1]+)?'
            },
            {
                begin: '#o[0-7]+(/[0-7]+)?'
            },
            {
                begin: '#x[0-9a-f]+(/[0-9a-f]+)?'
            }
            ]
        };

        var STRING = hljs.QUOTE_STRING_MODE;

        var REGULAR_EXPRESSION = {
            className: 'regexp',
            begin: '#[pr]x"',
            end: '[^\\\\]"'
        };

        var COMMENT_MODES = [
        hljs.COMMENT(
        ';',
        '$',
        {
            relevance: 0
        }),
        hljs.COMMENT('#\\|', '\\|#')
        ];

        var IDENT = {
            begin: SCHEME_IDENT_RE,
            relevance: 0
        };

        var QUOTED_IDENT = {
            className: 'variable',
            begin: '\'' + SCHEME_IDENT_RE
        };

        var BODY = {
            endsWithParent: true,
            relevance: 0
        };

        var LIST = {
            className: 'list',
            variants: [
            {
                begin: '\\(',
                end: '\\)'
            },
            {
                begin: '\\[',
                end: '\\]'
            }
            ],
            contains: [
            {
                className: 'keyword',
                begin: SCHEME_IDENT_RE,
                lexemes: SCHEME_IDENT_RE,
                keywords: BUILTINS
            },
            BODY
            ]
        };

        BODY.contains = [LITERAL, NUMBER, STRING, IDENT, QUOTED_IDENT, LIST].concat(COMMENT_MODES);

        return {
            illegal: /\S/,
            contains: [SHEBANG, NUMBER, STRING, QUOTED_IDENT, LIST].concat(COMMENT_MODES)
        };
    };
}, {}
],
147: [function(require, module, exports) {
    module.exports = function(hljs) {

        var COMMON_CONTAINS = [
        hljs.C_NUMBER_MODE,
        {
            className: 'string',
            begin: '\'|\"',
            end: '\'|\"',
            contains: [hljs.BACKSLASH_ESCAPE, {
                begin: '\'\''
            }
            ]
        }
        ];

        return {
            aliases: ['sci'],
            keywords: {
                keyword: 'abort break case clear catch continue do elseif else endfunction end for function' +
                'global if pause return resume select try then while' +
                '%f %F %t %T %pi %eps %inf %nan %e %i %z %s',
                built_in: // Scilab has more than 2000 functions. Just list the most commons
                'abs and acos asin atan ceil cd chdir clearglobal cosh cos cumprod deff disp error' +
                'exec execstr exists exp eye gettext floor fprintf fread fsolve imag isdef isempty' +
                'isinfisnan isvector lasterror length load linspace list listfiles log10 log2 log' +
                'max min msprintf mclose mopen ones or pathconvert poly printf prod pwd rand real' +
                'round sinh sin size gsort sprintf sqrt strcat strcmps tring sum system tanh tan' +
                'type typename warning zeros matrix'
            },
            illegal: '("|#|/\\*|\\s+/\\w+)',
            contains: [
            {
                className: 'function',
                beginKeywords: 'function endfunction',
                end: '$',
                keywords: 'function endfunction|10',
                contains: [
                hljs.UNDERSCORE_TITLE_MODE,
                {
                    className: 'params',
                    begin: '\\(',
                    end: '\\)'
                }
                ]
            },
            {
                className: 'transposed_variable',
                begin: '[a-zA-Z_][a-zA-Z_0-9]*(\'+[\\.\']*|[\\.\']+)',
                end: '',
                relevance: 0
            },
            {
                className: 'matrix',
                begin: '\\[',
                end: '\\]\'*[\\.\']*',
                relevance: 0,
                contains: COMMON_CONTAINS
            },
            hljs.COMMENT('//', '$')
            ].concat(COMMON_CONTAINS)
        };
    };
}, {}
],
148: [function(require, module, exports) {
    module.exports = function(hljs) {
        var IDENT_RE = '[a-zA-Z-][a-zA-Z0-9_-]*';
        var VARIABLE = {
            className: 'variable',
            begin: '(\\$' + IDENT_RE + ')\\b'
        };
        var FUNCTION = {
            className: 'function',
            begin: IDENT_RE + '\\(',
            returnBegin: true,
            excludeEnd: true,
            end: '\\('
        };
        var HEXCOLOR = {
            className: 'hexcolor',
            begin: '#[0-9A-Fa-f]+'
        };
        var DEF_INTERNALS = {
            className: 'attribute',
            begin: '[A-Z\\_\\.\\-]+',
            end: ':',
            excludeEnd: true,
            illegal: '[^\\s]',
            starts: {
                className: 'value',
                endsWithParent: true,
                excludeEnd: true,
                contains: [
                FUNCTION,
                HEXCOLOR,
                hljs.CSS_NUMBER_MODE,
                hljs.QUOTE_STRING_MODE,
                hljs.APOS_STRING_MODE,
                hljs.C_BLOCK_COMMENT_MODE,
                {
                    className: 'important',
                    begin: '!important'
                }
                ]
            }
        };
        return {
            case_insensitive: true,
            illegal: '[=/|\']',
            contains: [
            hljs.C_LINE_COMMENT_MODE,
            hljs.C_BLOCK_COMMENT_MODE,
            FUNCTION,
            {
                className: 'id',
                begin: '\\#[A-Za-z0-9_-]+',
                relevance: 0
            },
            {
                className: 'class',
                begin: '\\.[A-Za-z0-9_-]+',
                relevance: 0
            },
            {
                className: 'attr_selector',
                begin: '\\[',
                end: '\\]',
                illegal: '$'
            },
            {
                className: 'tag',
                // begin: IDENT_RE, end: '[,|\\s]'
                begin: '\\b(a|abbr|acronym|address|area|article|aside|audio|b|base|big|blockquote|body|br|button|canvas|caption|cite|code|col|colgroup|command|datalist|dd|del|details|dfn|div|dl|dt|em|embed|fieldset|figcaption|figure|footer|form|frame|frameset|(h[1-6])|head|header|hgroup|hr|html|i|iframe|img|input|ins|kbd|keygen|label|legend|li|link|map|mark|meta|meter|nav|noframes|noscript|object|ol|optgroup|option|output|p|param|pre|progress|q|rp|rt|ruby|samp|script|section|select|small|span|strike|strong|style|sub|sup|table|tbody|td|textarea|tfoot|th|thead|time|title|tr|tt|ul|var|video)\\b',
                relevance: 0
            },
            {
                className: 'pseudo',
                begin: ':(visited|valid|root|right|required|read-write|read-only|out-range|optional|only-of-type|only-child|nth-of-type|nth-last-of-type|nth-last-child|nth-child|not|link|left|last-of-type|last-child|lang|invalid|indeterminate|in-range|hover|focus|first-of-type|first-line|first-letter|first-child|first|enabled|empty|disabled|default|checked|before|after|active)'
            },
            {
                className: 'pseudo',
                begin: '::(after|before|choices|first-letter|first-line|repeat-index|repeat-item|selection|value)'
            },
            VARIABLE,
            {
                className: 'attribute',
                begin: '\\b(z-index|word-wrap|word-spacing|word-break|width|widows|white-space|visibility|vertical-align|unicode-bidi|transition-timing-function|transition-property|transition-duration|transition-delay|transition|transform-style|transform-origin|transform|top|text-underline-position|text-transform|text-shadow|text-rendering|text-overflow|text-indent|text-decoration-style|text-decoration-line|text-decoration-color|text-decoration|text-align-last|text-align|tab-size|table-layout|right|resize|quotes|position|pointer-events|perspective-origin|perspective|page-break-inside|page-break-before|page-break-after|padding-top|padding-right|padding-left|padding-bottom|padding|overflow-y|overflow-x|overflow-wrap|overflow|outline-width|outline-style|outline-offset|outline-color|outline|orphans|order|opacity|object-position|object-fit|normal|none|nav-up|nav-right|nav-left|nav-index|nav-down|min-width|min-height|max-width|max-height|mask|marks|margin-top|margin-right|margin-left|margin-bottom|margin|list-style-type|list-style-position|list-style-image|list-style|line-height|letter-spacing|left|justify-content|initial|inherit|ime-mode|image-orientation|image-resolution|image-rendering|icon|hyphens|height|font-weight|font-variant-ligatures|font-variant|font-style|font-stretch|font-size-adjust|font-size|font-language-override|font-kerning|font-feature-settings|font-family|font|float|flex-wrap|flex-shrink|flex-grow|flex-flow|flex-direction|flex-basis|flex|filter|empty-cells|display|direction|cursor|counter-reset|counter-increment|content|column-width|column-span|column-rule-width|column-rule-style|column-rule-color|column-rule|column-gap|column-fill|column-count|columns|color|clip-path|clip|clear|caption-side|break-inside|break-before|break-after|box-sizing|box-shadow|box-decoration-break|bottom|border-width|border-top-width|border-top-style|border-top-right-radius|border-top-left-radius|border-top-color|border-top|border-style|border-spacing|border-right-width|border-right-style|border-right-color|border-right|border-radius|border-left-width|border-left-style|border-left-color|border-left|border-image-width|border-image-source|border-image-slice|border-image-repeat|border-image-outset|border-image|border-color|border-collapse|border-bottom-width|border-bottom-style|border-bottom-right-radius|border-bottom-left-radius|border-bottom-color|border-bottom|border|background-size|background-repeat|background-position|background-origin|background-image|background-color|background-clip|background-attachment|background-blend-mode|background|backface-visibility|auto|animation-timing-function|animation-play-state|animation-name|animation-iteration-count|animation-fill-mode|animation-duration|animation-direction|animation-delay|animation|align-self|align-items|align-content)\\b',
                illegal: '[^\\s]'
            },
            {
                className: 'value',
                begin: '\\b(whitespace|wait|w-resize|visible|vertical-text|vertical-ideographic|uppercase|upper-roman|upper-alpha|underline|transparent|top|thin|thick|text|text-top|text-bottom|tb-rl|table-header-group|table-footer-group|sw-resize|super|strict|static|square|solid|small-caps|separate|se-resize|scroll|s-resize|rtl|row-resize|ridge|right|repeat|repeat-y|repeat-x|relative|progress|pointer|overline|outside|outset|oblique|nowrap|not-allowed|normal|none|nw-resize|no-repeat|no-drop|newspaper|ne-resize|n-resize|move|middle|medium|ltr|lr-tb|lowercase|lower-roman|lower-alpha|loose|list-item|line|line-through|line-edge|lighter|left|keep-all|justify|italic|inter-word|inter-ideograph|inside|inset|inline|inline-block|inherit|inactive|ideograph-space|ideograph-parenthesis|ideograph-numeric|ideograph-alpha|horizontal|hidden|help|hand|groove|fixed|ellipsis|e-resize|double|dotted|distribute|distribute-space|distribute-letter|distribute-all-lines|disc|disabled|default|decimal|dashed|crosshair|collapse|col-resize|circle|char|center|capitalize|break-word|break-all|bottom|both|bolder|bold|block|bidi-override|below|baseline|auto|always|all-scroll|absolute|table|table-cell)\\b'
            },
            {
                className: 'value',
                begin: ':',
                end: ';',
                contains: [
                FUNCTION,
                VARIABLE,
                HEXCOLOR,
                hljs.CSS_NUMBER_MODE,
                hljs.QUOTE_STRING_MODE,
                hljs.APOS_STRING_MODE,
                {
                    className: 'important',
                    begin: '!important'
                }
                ]
            },
            {
                className: 'at_rule',
                begin: '@',
                end: '[{;]',
                keywords: 'mixin include extend for if else each while charset import debug media page content font-face namespace warn',
                contains: [
                FUNCTION,
                VARIABLE,
                hljs.QUOTE_STRING_MODE,
                hljs.APOS_STRING_MODE,
                HEXCOLOR,
                hljs.CSS_NUMBER_MODE,
                {
                    className: 'preprocessor',
                    begin: '\\s[A-Za-z0-9_.-]+',
                    relevance: 0
                }
                ]
            }
            ]
        };
    };
}, {}
],
149: [function(require, module, exports) {
    module.exports = function(hljs) {
        var smali_instr_low_prio = ['add', 'and', 'cmp', 'cmpg', 'cmpl', 'const', 'div', 'double', 'float', 'goto', 'if', 'int', 'long', 'move', 'mul', 'neg', 'new', 'nop', 'not', 'or', 'rem', 'return', 'shl', 'shr', 'sput', 'sub', 'throw', 'ushr', 'xor'];
        var smali_instr_high_prio = ['aget', 'aput', 'array', 'check', 'execute', 'fill', 'filled', 'goto/16', 'goto/32', 'iget', 'instance', 'invoke', 'iput', 'monitor', 'packed', 'sget', 'sparse'];
        var smali_keywords = ['transient', 'constructor', 'abstract', 'final', 'synthetic', 'public', 'private', 'protected', 'static', 'bridge', 'system'];
        return {
            aliases: ['smali'],
            contains: [
            {
                className: 'string',
                begin: '"',
                end: '"',
                relevance: 0
            },
            hljs.COMMENT(
            '#',
            '$',
            {
                relevance: 0
            }),
            {
                className: 'keyword',
                begin: '\\s*\\.end\\s[a-zA-Z0-9]*',
                relevance: 1
            },
            {
                className: 'keyword',
                begin: '^[ ]*\\.[a-zA-Z]*',
                relevance: 0
            },
            {
                className: 'keyword',
                begin: '\\s:[a-zA-Z_0-9]*',
                relevance: 0
            },
            {
                className: 'keyword',
                begin: '\\s(' + smali_keywords.join('|') + ')',
                relevance: 1
            },
            {
                className: 'keyword',
                begin: '\\[',
                relevance: 0
            },
            {
                className: 'instruction',
                begin: '\\s(' + smali_instr_low_prio.join('|') + ')\\s',
                relevance: 1
            },
            {
                className: 'instruction',
                begin: '\\s(' + smali_instr_low_prio.join('|') + ')((\\-|/)[a-zA-Z0-9]+)+\\s',
                relevance: 10
            },
            {
                className: 'instruction',
                begin: '\\s(' + smali_instr_high_prio.join('|') + ')((\\-|/)[a-zA-Z0-9]+)*\\s',
                relevance: 10
            },
            {
                className: 'class',
                begin: 'L[^\(;:\n]*;',
                relevance: 0
            },
            {
                className: 'function',
                begin: '( |->)[^(\n ;"]*\\(',
                relevance: 0
            },
            {
                className: 'function',
                begin: '\\)',
                relevance: 0
            },
            {
                className: 'variable',
                begin: '[vp][0-9]+',
                relevance: 0
            }
            ]
        };
    };
}, {}
],
150: [function(require, module, exports) {
    module.exports = function(hljs) {
        var VAR_IDENT_RE = '[a-z][a-zA-Z0-9_]*';
        var CHAR = {
            className: 'char',
            begin: '\\$.{1}'
        };
        var SYMBOL = {
            className: 'symbol',
            begin: '#' + hljs.UNDERSCORE_IDENT_RE
        };
        return {
            aliases: ['st'],
            keywords: 'self super nil true false thisContext',
            // only 6
            contains: [
            hljs.COMMENT('"', '"'),
            hljs.APOS_STRING_MODE,
            {
                className: 'class',
                begin: '\\b[A-Z][A-Za-z0-9_]*',
                relevance: 0
            },
            {
                className: 'method',
                begin: VAR_IDENT_RE + ':',
                relevance: 0
            },
            hljs.C_NUMBER_MODE,
            SYMBOL,
            CHAR,
            {
                className: 'localvars',
                // This looks more complicated than needed to avoid combinatorial
                // explosion under V8. It effectively means `| var1 var2 ... |` with
                // whitespace adjacent to `|` being optional.
                begin: '\\|[ ]*' + VAR_IDENT_RE + '([ ]+' + VAR_IDENT_RE + ')*[ ]*\\|',
                returnBegin: true,
                end: /\|/,
                illegal: /\S/,
                contains: [{
                    begin: '(\\|[ ]*)?' + VAR_IDENT_RE
                }
                ]
            },
            {
                className: 'array',
                begin: '\\#\\(',
                end: '\\)',
                contains: [
                hljs.APOS_STRING_MODE,
                CHAR,
                hljs.C_NUMBER_MODE,
                SYMBOL
                ]
            }
            ]
        };
    };
}, {}
],
151: [function(require, module, exports) {
    module.exports = function(hljs) {
        return {
            aliases: ['ml'],
            keywords: {
                keyword:
                /* according to Definition of Standard ML 97  */
                'abstype and andalso as case datatype do else end eqtype ' +
                'exception fn fun functor handle if in include infix infixr ' +
                'let local nonfix of op open orelse raise rec sharing sig ' +
                'signature struct structure then type val with withtype where while',
                built_in:
                /* built-in types according to basis library */
                'array bool char exn int list option order real ref string substring vector unit word',
                literal:
                'true false NONE SOME LESS EQUAL GREATER nil'
            },
            illegal: /\/\/|>>/,
            lexemes: '[a-z_]\\w*!?',
            contains: [
            {
                className: 'literal',
                begin: '\\[(\\|\\|)?\\]|\\(\\)'
            },
            hljs.COMMENT(
            '\\(\\*',
            '\\*\\)',
            {
                contains: ['self']
            }),
            {
                /* type variable */
                className: 'symbol',
                begin: '\'[A-Za-z_](?!\')[\\w\']*'
                /* the grammar is ambiguous on how 'a'b should be interpreted but not the compiler */
            },
            {
                /* polymorphic variant */
                className: 'tag',
                begin: '`[A-Z][\\w\']*'
            },
            {
                /* module or constructor */
                className: 'type',
                begin: '\\b[A-Z][\\w\']*',
                relevance: 0
            },
            {
                /* don't color identifiers, but safely catch all identifiers with '*/
                begin: '[a-z_]\\w*\'[\\w\']*'
            },
            hljs.inherit(hljs.APOS_STRING_MODE, {
                className: 'char',
                relevance: 0
            }),
            hljs.inherit(hljs.QUOTE_STRING_MODE, {
                illegal: null
            }),
            {
                className: 'number',
                begin:
                '\\b(0[xX][a-fA-F0-9_]+[Lln]?|' +
                '0[oO][0-7_]+[Lln]?|' +
                '0[bB][01_]+[Lln]?|' +
                '[0-9][0-9_]*([Lln]|(\\.[0-9_]*)?([eE][-+]?[0-9_]+)?)?)',
                relevance: 0
            },
            {
                begin: /[-=]>/ // relevance booster
            }
            ]
        };
    };
}, {}
],
152: [function(require, module, exports) {
    module.exports = function(hljs) {
        var COMMENT_MODE = hljs.COMMENT('--', '$');
        return {
            case_insensitive: true,
            illegal: /[<>{}*]/,
            contains: [
            {
                className: 'operator',
                beginKeywords:
                'begin end start commit rollback savepoint lock alter create drop rename call ' +
                'delete do handler insert load replace select truncate update set show pragma grant ' +
                'merge describe use explain help declare prepare execute deallocate release ' +
                'unlock purge reset change stop analyze cache flush optimize repair kill ' +
                'install uninstall checksum restore check backup revoke',
                end: /;/,
                endsWithParent: true,
                keywords: {
                    keyword:
                    'abort abs absolute acc acce accep accept access accessed accessible account acos action activate add ' +
                    'addtime admin administer advanced advise aes_decrypt aes_encrypt after agent aggregate ali alia alias ' +
                    'allocate allow alter always analyze ancillary and any anydata anydataset anyschema anytype apply ' +
                    'archive archived archivelog are as asc ascii asin assembly assertion associate asynchronous at atan ' +
                    'atn2 attr attri attrib attribu attribut attribute attributes audit authenticated authentication authid ' +
                    'authors auto autoallocate autodblink autoextend automatic availability avg backup badfile basicfile ' +
                    'before begin beginning benchmark between bfile bfile_base big bigfile bin binary_double binary_float ' +
                    'binlog bit_and bit_count bit_length bit_or bit_xor bitmap blob_base block blocksize body both bound ' +
                    'buffer_cache buffer_pool build bulk by byte byteordermark bytes c cache caching call calling cancel ' +
                    'capacity cascade cascaded case cast catalog category ceil ceiling chain change changed char_base ' +
                    'char_length character_length characters characterset charindex charset charsetform charsetid check ' +
                    'checksum checksum_agg child choose chr chunk class cleanup clear client clob clob_base clone close ' +
                    'cluster_id cluster_probability cluster_set clustering coalesce coercibility col collate collation ' +
                    'collect colu colum column column_value columns columns_updated comment commit compact compatibility ' +
                    'compiled complete composite_limit compound compress compute concat concat_ws concurrent confirm conn ' +
                    'connec connect connect_by_iscycle connect_by_isleaf connect_by_root connect_time connection ' +
                    'consider consistent constant constraint constraints constructor container content contents context ' +
                    'contributors controlfile conv convert convert_tz corr corr_k corr_s corresponding corruption cos cost ' +
                    'count count_big counted covar_pop covar_samp cpu_per_call cpu_per_session crc32 create creation ' +
                    'critical cross cube cume_dist curdate current current_date current_time current_timestamp current_user ' +
                    'cursor curtime customdatum cycle d data database databases datafile datafiles datalength date_add ' +
                    'date_cache date_format date_sub dateadd datediff datefromparts datename datepart datetime2fromparts ' +
                    'day day_to_second dayname dayofmonth dayofweek dayofyear days db_role_change dbtimezone ddl deallocate ' +
                    'declare decode decompose decrement decrypt deduplicate def defa defau defaul default defaults ' +
                    'deferred defi defin define degrees delayed delegate delete delete_all delimited demand dense_rank ' +
                    'depth dequeue des_decrypt des_encrypt des_key_file desc descr descri describ describe descriptor ' +
                    'deterministic diagnostics difference dimension direct_load directory disable disable_all ' +
                    'disallow disassociate discardfile disconnect diskgroup distinct distinctrow distribute distributed div ' +
                    'do document domain dotnet double downgrade drop dumpfile duplicate duration e each edition editionable ' +
                    'editions element ellipsis else elsif elt empty enable enable_all enclosed encode encoding encrypt ' +
                    'end end-exec endian enforced engine engines enqueue enterprise entityescaping eomonth error errors ' +
                    'escaped evalname evaluate event eventdata events except exception exceptions exchange exclude excluding ' +
                    'execu execut execute exempt exists exit exp expire explain export export_set extended extent external ' +
                    'external_1 external_2 externally extract f failed failed_login_attempts failover failure far fast ' +
                    'feature_set feature_value fetch field fields file file_name_convert filesystem_like_logging final ' +
                    'finish first first_value fixed flash_cache flashback floor flush following follows for forall force ' +
                    'form forma format found found_rows freelist freelists freepools fresh from from_base64 from_days ' +
                    'ftp full function g general generated get get_format get_lock getdate getutcdate global global_name ' +
                    'globally go goto grant grants greatest group group_concat group_id grouping grouping_id groups ' +
                    'gtid_subtract guarantee guard handler hash hashkeys having hea head headi headin heading heap help hex ' +
                    'hierarchy high high_priority hosts hour http i id ident_current ident_incr ident_seed identified ' +
                    'identity idle_time if ifnull ignore iif ilike ilm immediate import in include including increment ' +
                    'index indexes indexing indextype indicator indices inet6_aton inet6_ntoa inet_aton inet_ntoa infile ' +
                    'initial initialized initially initrans inmemory inner innodb input insert install instance instantiable ' +
                    'instr interface interleaved intersect into invalidate invisible is is_free_lock is_ipv4 is_ipv4_compat ' +
                    'is_not is_not_null is_used_lock isdate isnull isolation iterate java join json json_exists ' +
                    'k keep keep_duplicates key keys kill l language large last last_day last_insert_id last_value lax lcase ' +
                    'lead leading least leaves left len lenght length less level levels library like like2 like4 likec limit ' +
                    'lines link list listagg little ln load load_file lob lobs local localtime localtimestamp locate ' +
                    'locator lock locked log log10 log2 logfile logfiles logging logical logical_reads_per_call ' +
                    'logoff logon logs long loop low low_priority lower lpad lrtrim ltrim m main make_set makedate maketime ' +
                    'managed management manual map mapping mask master master_pos_wait match matched materialized max ' +
                    'maxextents maximize maxinstances maxlen maxlogfiles maxloghistory maxlogmembers maxsize maxtrans ' +
                    'md5 measures median medium member memcompress memory merge microsecond mid migration min minextents ' +
                    'minimum mining minus minute minvalue missing mod mode model modification modify module monitoring month ' +
                    'months mount move movement multiset mutex n name name_const names nan national native natural nav nchar ' +
                    'nclob nested never new newline next nextval no no_write_to_binlog noarchivelog noaudit nobadfile ' +
                    'nocheck nocompress nocopy nocycle nodelay nodiscardfile noentityescaping noguarantee nokeep nologfile ' +
                    'nomapping nomaxvalue nominimize nominvalue nomonitoring none noneditionable nonschema noorder ' +
                    'nopr nopro noprom nopromp noprompt norely noresetlogs noreverse normal norowdependencies noschemacheck ' +
                    'noswitch not nothing notice notrim novalidate now nowait nth_value nullif nulls num numb numbe ' +
                    'nvarchar nvarchar2 object ocicoll ocidate ocidatetime ociduration ociinterval ociloblocator ocinumber ' +
                    'ociref ocirefcursor ocirowid ocistring ocitype oct octet_length of off offline offset oid oidindex old ' +
                    'on online only opaque open operations operator optimal optimize option optionally or oracle oracle_date ' +
                    'oradata ord ordaudio orddicom orddoc order ordimage ordinality ordvideo organization orlany orlvary ' +
                    'out outer outfile outline output over overflow overriding p package pad parallel parallel_enable ' +
                    'parameters parent parse partial partition partitions pascal passing password password_grace_time ' +
                    'password_lock_time password_reuse_max password_reuse_time password_verify_function patch path patindex ' +
                    'pctincrease pctthreshold pctused pctversion percent percent_rank percentile_cont percentile_disc ' +
                    'performance period period_add period_diff permanent physical pi pipe pipelined pivot pluggable plugin ' +
                    'policy position post_transaction pow power pragma prebuilt precedes preceding precision prediction ' +
                    'prediction_cost prediction_details prediction_probability prediction_set prepare present preserve ' +
                    'prior priority private private_sga privileges procedural procedure procedure_analyze processlist ' +
                    'profiles project prompt protection public publishingservername purge quarter query quick quiesce quota ' +
                    'quotename radians raise rand range rank raw read reads readsize rebuild record records ' +
                    'recover recovery recursive recycle redo reduced ref reference referenced references referencing refresh ' +
                    'regexp_like register regr_avgx regr_avgy regr_count regr_intercept regr_r2 regr_slope regr_sxx regr_sxy ' +
                    'reject rekey relational relative relaylog release release_lock relies_on relocate rely rem remainder rename ' +
                    'repair repeat replace replicate replication required reset resetlogs resize resource respect restore ' +
                    'restricted result result_cache resumable resume retention return returning returns reuse reverse revoke ' +
                    'right rlike role roles rollback rolling rollup round row row_count rowdependencies rowid rownum rows ' +
                    'rtrim rules safe salt sample save savepoint sb1 sb2 sb4 scan schema schemacheck scn scope scroll ' +
                    'sdo_georaster sdo_topo_geometry search sec_to_time second section securefile security seed segment select ' +
                    'self sequence sequential serializable server servererror session session_user sessions_per_user set ' +
                    'sets settings sha sha1 sha2 share shared shared_pool short show shrink shutdown si_averagecolor ' +
                    'si_colorhistogram si_featurelist si_positionalcolor si_stillimage si_texture siblings sid sign sin ' +
                    'size size_t sizes skip slave sleep smalldatetimefromparts smallfile snapshot some soname sort soundex ' +
                    'source space sparse spfile split sql sql_big_result sql_buffer_result sql_cache sql_calc_found_rows ' +
                    'sql_small_result sql_variant_property sqlcode sqldata sqlerror sqlname sqlstate sqrt square standalone ' +
                    'standby start starting startup statement static statistics stats_binomial_test stats_crosstab ' +
                    'stats_ks_test stats_mode stats_mw_test stats_one_way_anova stats_t_test_ stats_t_test_indep ' +
                    'stats_t_test_one stats_t_test_paired stats_wsr_test status std stddev stddev_pop stddev_samp stdev ' +
                    'stop storage store stored str str_to_date straight_join strcmp strict string struct stuff style subdate ' +
                    'subpartition subpartitions substitutable substr substring subtime subtring_index subtype success sum ' +
                    'suspend switch switchoffset switchover sync synchronous synonym sys sys_xmlagg sysasm sysaux sysdate ' +
                    'sysdatetimeoffset sysdba sysoper system system_user sysutcdatetime t table tables tablespace tan tdo ' +
                    'template temporary terminated tertiary_weights test than then thread through tier ties time time_format ' +
                    'time_zone timediff timefromparts timeout timestamp timestampadd timestampdiff timezone_abbr ' +
                    'timezone_minute timezone_region to to_base64 to_date to_days to_seconds todatetimeoffset trace tracking ' +
                    'transaction transactional translate translation treat trigger trigger_nestlevel triggers trim truncate ' +
                    'try_cast try_convert try_parse type ub1 ub2 ub4 ucase unarchived unbounded uncompress ' +
                    'under undo unhex unicode uniform uninstall union unique unix_timestamp unknown unlimited unlock unpivot ' +
                    'unrecoverable unsafe unsigned until untrusted unusable unused update updated upgrade upped upper upsert ' +
                    'url urowid usable usage use use_stored_outlines user user_data user_resources users using utc_date ' +
                    'utc_timestamp uuid uuid_short validate validate_password_strength validation valist value values var ' +
                    'var_samp varcharc vari varia variab variabl variable variables variance varp varraw varrawc varray ' +
                    'verify version versions view virtual visible void wait wallet warning warnings week weekday weekofyear ' +
                    'wellformed when whene whenev wheneve whenever where while whitespace with within without work wrapped ' +
                    'xdb xml xmlagg xmlattributes xmlcast xmlcolattval xmlelement xmlexists xmlforest xmlindex xmlnamespaces ' +
                    'xmlpi xmlquery xmlroot xmlschema xmlserialize xmltable xmltype xor year year_to_month years yearweek',
                    literal:
                    'true false null',
                    built_in:
                    'array bigint binary bit blob boolean char character date dec decimal float int int8 integer interval number ' +
                    'numeric real record serial serial8 smallint text varchar varying void'
                },
                contains: [
                {
                    className: 'string',
                    begin: '\'',
                    end: '\'',
                    contains: [hljs.BACKSLASH_ESCAPE, {
                        begin: '\'\''
                    }
                    ]
                },
                {
                    className: 'string',
                    begin: '"',
                    end: '"',
                    contains: [hljs.BACKSLASH_ESCAPE, {
                        begin: '""'
                    }
                    ]
                },
                {
                    className: 'string',
                    begin: '`',
                    end: '`',
                    contains: [hljs.BACKSLASH_ESCAPE]
                },
                hljs.C_NUMBER_MODE,
                hljs.C_BLOCK_COMMENT_MODE,
                COMMENT_MODE
                ]
            },
            hljs.C_BLOCK_COMMENT_MODE,
            COMMENT_MODE
            ]
        };
    };
}, {}
],
153: [function(require, module, exports) {
    module.exports = function(hljs) {
        return {
            aliases: ['do', 'ado'],
            case_insensitive: true,
            keywords: 'if else in foreach for forv forva forval forvalu forvalue forvalues by bys bysort xi quietly qui capture about ac ac_7 acprplot acprplot_7 adjust ado adopath adoupdate alpha ameans an ano anov anova anova_estat anova_terms anovadef aorder ap app appe appen append arch arch_dr arch_estat arch_p archlm areg areg_p args arima arima_dr arima_estat arima_p as asmprobit asmprobit_estat asmprobit_lf asmprobit_mfx__dlg asmprobit_p ass asse asser assert avplot avplot_7 avplots avplots_7 bcskew0 bgodfrey binreg bip0_lf biplot bipp_lf bipr_lf bipr_p biprobit bitest bitesti bitowt blogit bmemsize boot bootsamp bootstrap bootstrap_8 boxco_l boxco_p boxcox boxcox_6 boxcox_p bprobit br break brier bro brow brows browse brr brrstat bs bs_7 bsampl_w bsample bsample_7 bsqreg bstat bstat_7 bstat_8 bstrap bstrap_7 ca ca_estat ca_p cabiplot camat canon canon_8 canon_8_p canon_estat canon_p cap caprojection capt captu captur capture cat cc cchart cchart_7 cci cd censobs_table centile cf char chdir checkdlgfiles checkestimationsample checkhlpfiles checksum chelp ci cii cl class classutil clear cli clis clist clo clog clog_lf clog_p clogi clogi_sw clogit clogit_lf clogit_p clogitp clogl_sw cloglog clonevar clslistarray cluster cluster_measures cluster_stop cluster_tree cluster_tree_8 clustermat cmdlog cnr cnre cnreg cnreg_p cnreg_sw cnsreg codebook collaps4 collapse colormult_nb colormult_nw compare compress conf confi confir confirm conren cons const constr constra constrai constrain constraint continue contract copy copyright copysource cor corc corr corr2data corr_anti corr_kmo corr_smc corre correl correla correlat correlate corrgram cou coun count cox cox_p cox_sw coxbase coxhaz coxvar cprplot cprplot_7 crc cret cretu cretur creturn cross cs cscript cscript_log csi ct ct_is ctset ctst_5 ctst_st cttost cumsp cumsp_7 cumul cusum cusum_7 cutil d datasig datasign datasigna datasignat datasignatu datasignatur datasignature datetof db dbeta de dec deco decod decode deff des desc descr descri describ describe destring dfbeta dfgls dfuller di di_g dir dirstats dis discard disp disp_res disp_s displ displa display distinct do doe doed doedi doedit dotplot dotplot_7 dprobit drawnorm drop ds ds_util dstdize duplicates durbina dwstat dydx e ed edi edit egen eivreg emdef en enc enco encod encode eq erase ereg ereg_lf ereg_p ereg_sw ereghet ereghet_glf ereghet_glf_sh ereghet_gp ereghet_ilf ereghet_ilf_sh ereghet_ip eret eretu eretur ereturn err erro error est est_cfexist est_cfname est_clickable est_expand est_hold est_table est_unhold est_unholdok estat estat_default estat_summ estat_vce_only esti estimates etodow etof etomdy ex exi exit expand expandcl fac fact facto factor factor_estat factor_p factor_pca_rotated factor_rotate factormat fcast fcast_compute fcast_graph fdades fdadesc fdadescr fdadescri fdadescrib fdadescribe fdasav fdasave fdause fh_st file open file read file close file filefilter fillin find_hlp_file findfile findit findit_7 fit fl fli flis flist for5_0 form forma format fpredict frac_154 frac_adj frac_chk frac_cox frac_ddp frac_dis frac_dv frac_in frac_mun frac_pp frac_pq frac_pv frac_wgt frac_xo fracgen fracplot fracplot_7 fracpoly fracpred fron_ex fron_hn fron_p fron_tn fron_tn2 frontier ftodate ftoe ftomdy ftowdate g gamhet_glf gamhet_gp gamhet_ilf gamhet_ip gamma gamma_d2 gamma_p gamma_sw gammahet gdi_hexagon gdi_spokes ge gen gene gener genera generat generate genrank genstd genvmean gettoken gl gladder gladder_7 glim_l01 glim_l02 glim_l03 glim_l04 glim_l05 glim_l06 glim_l07 glim_l08 glim_l09 glim_l10 glim_l11 glim_l12 glim_lf glim_mu glim_nw1 glim_nw2 glim_nw3 glim_p glim_v1 glim_v2 glim_v3 glim_v4 glim_v5 glim_v6 glim_v7 glm glm_6 glm_p glm_sw glmpred glo glob globa global glogit glogit_8 glogit_p gmeans gnbre_lf gnbreg gnbreg_5 gnbreg_p gomp_lf gompe_sw gomper_p gompertz gompertzhet gomphet_glf gomphet_glf_sh gomphet_gp gomphet_ilf gomphet_ilf_sh gomphet_ip gphdot gphpen gphprint gprefs gprobi_p gprobit gprobit_8 gr gr7 gr_copy gr_current gr_db gr_describe gr_dir gr_draw gr_draw_replay gr_drop gr_edit gr_editviewopts gr_example gr_example2 gr_export gr_print gr_qscheme gr_query gr_read gr_rename gr_replay gr_save gr_set gr_setscheme gr_table gr_undo gr_use graph graph7 grebar greigen greigen_7 greigen_8 grmeanby grmeanby_7 gs_fileinfo gs_filetype gs_graphinfo gs_stat gsort gwood h hadimvo hareg hausman haver he heck_d2 heckma_p heckman heckp_lf heckpr_p heckprob hel help hereg hetpr_lf hetpr_p hetprob hettest hexdump hilite hist hist_7 histogram hlogit hlu hmeans hotel hotelling hprobit hreg hsearch icd9 icd9_ff icd9p iis impute imtest inbase include inf infi infil infile infix inp inpu input ins insheet insp inspe inspec inspect integ inten intreg intreg_7 intreg_p intrg2_ll intrg_ll intrg_ll2 ipolate iqreg ir irf irf_create irfm iri is_svy is_svysum isid istdize ivprob_1_lf ivprob_lf ivprobit ivprobit_p ivreg ivreg_footnote ivtob_1_lf ivtob_lf ivtobit ivtobit_p jackknife jacknife jknife jknife_6 jknife_8 jkstat joinby kalarma1 kap kap_3 kapmeier kappa kapwgt kdensity kdensity_7 keep ksm ksmirnov ktau kwallis l la lab labe label labelbook ladder levels levelsof leverage lfit lfit_p li lincom line linktest lis list lloghet_glf lloghet_glf_sh lloghet_gp lloghet_ilf lloghet_ilf_sh lloghet_ip llogi_sw llogis_p llogist llogistic llogistichet lnorm_lf lnorm_sw lnorma_p lnormal lnormalhet lnormhet_glf lnormhet_glf_sh lnormhet_gp lnormhet_ilf lnormhet_ilf_sh lnormhet_ip lnskew0 loadingplot loc loca local log logi logis_lf logistic logistic_p logit logit_estat logit_p loglogs logrank loneway lookfor lookup lowess lowess_7 lpredict lrecomp lroc lroc_7 lrtest ls lsens lsens_7 lsens_x lstat ltable ltable_7 ltriang lv lvr2plot lvr2plot_7 m ma mac macr macro makecns man manova manova_estat manova_p manovatest mantel mark markin markout marksample mat mat_capp mat_order mat_put_rr mat_rapp mata mata_clear mata_describe mata_drop mata_matdescribe mata_matsave mata_matuse mata_memory mata_mlib mata_mosave mata_rename mata_which matalabel matcproc matlist matname matr matri matrix matrix_input__dlg matstrik mcc mcci md0_ md1_ md1debug_ md2_ md2debug_ mds mds_estat mds_p mdsconfig mdslong mdsmat mdsshepard mdytoe mdytof me_derd mean means median memory memsize meqparse mer merg merge mfp mfx mhelp mhodds minbound mixed_ll mixed_ll_reparm mkassert mkdir mkmat mkspline ml ml_5 ml_adjs ml_bhhhs ml_c_d ml_check ml_clear ml_cnt ml_debug ml_defd ml_e0 ml_e0_bfgs ml_e0_cycle ml_e0_dfp ml_e0i ml_e1 ml_e1_bfgs ml_e1_bhhh ml_e1_cycle ml_e1_dfp ml_e2 ml_e2_cycle ml_ebfg0 ml_ebfr0 ml_ebfr1 ml_ebh0q ml_ebhh0 ml_ebhr0 ml_ebr0i ml_ecr0i ml_edfp0 ml_edfr0 ml_edfr1 ml_edr0i ml_eds ml_eer0i ml_egr0i ml_elf ml_elf_bfgs ml_elf_bhhh ml_elf_cycle ml_elf_dfp ml_elfi ml_elfs ml_enr0i ml_enrr0 ml_erdu0 ml_erdu0_bfgs ml_erdu0_bhhh ml_erdu0_bhhhq ml_erdu0_cycle ml_erdu0_dfp ml_erdu0_nrbfgs ml_exde ml_footnote ml_geqnr ml_grad0 ml_graph ml_hbhhh ml_hd0 ml_hold ml_init ml_inv ml_log ml_max ml_mlout ml_mlout_8 ml_model ml_nb0 ml_opt ml_p ml_plot ml_query ml_rdgrd ml_repor ml_s_e ml_score ml_searc ml_technique ml_unhold mleval mlf_ mlmatbysum mlmatsum mlog mlogi mlogit mlogit_footnote mlogit_p mlopts mlsum mlvecsum mnl0_ mor more mov move mprobit mprobit_lf mprobit_p mrdu0_ mrdu1_ mvdecode mvencode mvreg mvreg_estat n nbreg nbreg_al nbreg_lf nbreg_p nbreg_sw nestreg net newey newey_7 newey_p news nl nl_7 nl_9 nl_9_p nl_p nl_p_7 nlcom nlcom_p nlexp2 nlexp2_7 nlexp2a nlexp2a_7 nlexp3 nlexp3_7 nlgom3 nlgom3_7 nlgom4 nlgom4_7 nlinit nllog3 nllog3_7 nllog4 nllog4_7 nlog_rd nlogit nlogit_p nlogitgen nlogittree nlpred no nobreak noi nois noisi noisil noisily note notes notes_dlg nptrend numlabel numlist odbc old_ver olo olog ologi ologi_sw ologit ologit_p ologitp on one onew onewa oneway op_colnm op_comp op_diff op_inv op_str opr opro oprob oprob_sw oprobi oprobi_p oprobit oprobitp opts_exclusive order orthog orthpoly ou out outf outfi outfil outfile outs outsh outshe outshee outsheet ovtest pac pac_7 palette parse parse_dissim pause pca pca_8 pca_display pca_estat pca_p pca_rotate pcamat pchart pchart_7 pchi pchi_7 pcorr pctile pentium pergram pergram_7 permute permute_8 personal peto_st pkcollapse pkcross pkequiv pkexamine pkexamine_7 pkshape pksumm pksumm_7 pl plo plot plugin pnorm pnorm_7 poisgof poiss_lf poiss_sw poisso_p poisson poisson_estat post postclose postfile postutil pperron pr prais prais_e prais_e2 prais_p predict predictnl preserve print pro prob probi probit probit_estat probit_p proc_time procoverlay procrustes procrustes_estat procrustes_p profiler prog progr progra program prop proportion prtest prtesti pwcorr pwd q\\s qby qbys qchi qchi_7 qladder qladder_7 qnorm qnorm_7 qqplot qqplot_7 qreg qreg_c qreg_p qreg_sw qu quadchk quantile quantile_7 que quer query range ranksum ratio rchart rchart_7 rcof recast reclink recode reg reg3 reg3_p regdw regr regre regre_p2 regres regres_p regress regress_estat regriv_p remap ren rena renam rename renpfix repeat replace report reshape restore ret retu retur return rm rmdir robvar roccomp roccomp_7 roccomp_8 rocf_lf rocfit rocfit_8 rocgold rocplot rocplot_7 roctab roctab_7 rolling rologit rologit_p rot rota rotat rotate rotatemat rreg rreg_p ru run runtest rvfplot rvfplot_7 rvpplot rvpplot_7 sa safesum sample sampsi sav save savedresults saveold sc sca scal scala scalar scatter scm_mine sco scob_lf scob_p scobi_sw scobit scor score scoreplot scoreplot_help scree screeplot screeplot_help sdtest sdtesti se search separate seperate serrbar serrbar_7 serset set set_defaults sfrancia sh she shel shell shewhart shewhart_7 signestimationsample signrank signtest simul simul_7 simulate simulate_8 sktest sleep slogit slogit_d2 slogit_p smooth snapspan so sor sort spearman spikeplot spikeplot_7 spikeplt spline_x split sqreg sqreg_p sret sretu sretur sreturn ssc st st_ct st_hc st_hcd st_hcd_sh st_is st_issys st_note st_promo st_set st_show st_smpl st_subid stack statsby statsby_8 stbase stci stci_7 stcox stcox_estat stcox_fr stcox_fr_ll stcox_p stcox_sw stcoxkm stcoxkm_7 stcstat stcurv stcurve stcurve_7 stdes stem stepwise stereg stfill stgen stir stjoin stmc stmh stphplot stphplot_7 stphtest stphtest_7 stptime strate strate_7 streg streg_sw streset sts sts_7 stset stsplit stsum sttocc sttoct stvary stweib su suest suest_8 sum summ summa summar summari summariz summarize sunflower sureg survcurv survsum svar svar_p svmat svy svy_disp svy_dreg svy_est svy_est_7 svy_estat svy_get svy_gnbreg_p svy_head svy_header svy_heckman_p svy_heckprob_p svy_intreg_p svy_ivreg_p svy_logistic_p svy_logit_p svy_mlogit_p svy_nbreg_p svy_ologit_p svy_oprobit_p svy_poisson_p svy_probit_p svy_regress_p svy_sub svy_sub_7 svy_x svy_x_7 svy_x_p svydes svydes_8 svygen svygnbreg svyheckman svyheckprob svyintreg svyintreg_7 svyintrg svyivreg svylc svylog_p svylogit svymarkout svymarkout_8 svymean svymlog svymlogit svynbreg svyolog svyologit svyoprob svyoprobit svyopts svypois svypois_7 svypoisson svyprobit svyprobt svyprop svyprop_7 svyratio svyreg svyreg_p svyregress svyset svyset_7 svyset_8 svytab svytab_7 svytest svytotal sw sw_8 swcnreg swcox swereg swilk swlogis swlogit swologit swoprbt swpois swprobit swqreg swtobit swweib symmetry symmi symplot symplot_7 syntax sysdescribe sysdir sysuse szroeter ta tab tab1 tab2 tab_or tabd tabdi tabdis tabdisp tabi table tabodds tabodds_7 tabstat tabu tabul tabula tabulat tabulate te tempfile tempname tempvar tes test testnl testparm teststd tetrachoric time_it timer tis tob tobi tobit tobit_p tobit_sw token tokeni tokeniz tokenize tostring total translate translator transmap treat_ll treatr_p treatreg trim trnb_cons trnb_mean trpoiss_d2 trunc_ll truncr_p truncreg tsappend tset tsfill tsline tsline_ex tsreport tsrevar tsrline tsset tssmooth tsunab ttest ttesti tut_chk tut_wait tutorial tw tware_st two twoway twoway__fpfit_serset twoway__function_gen twoway__histogram_gen twoway__ipoint_serset twoway__ipoints_serset twoway__kdensity_gen twoway__lfit_serset twoway__normgen_gen twoway__pci_serset twoway__qfit_serset twoway__scatteri_serset twoway__sunflower_gen twoway_ksm_serset ty typ type typeof u unab unabbrev unabcmd update us use uselabel var var_mkcompanion var_p varbasic varfcast vargranger varirf varirf_add varirf_cgraph varirf_create varirf_ctable varirf_describe varirf_dir varirf_drop varirf_erase varirf_graph varirf_ograph varirf_rename varirf_set varirf_table varlist varlmar varnorm varsoc varstable varstable_w varstable_w2 varwle vce vec vec_fevd vec_mkphi vec_p vec_p_w vecirf_create veclmar veclmar_w vecnorm vecnorm_w vecrank vecstable verinst vers versi versio version view viewsource vif vwls wdatetof webdescribe webseek webuse weib1_lf weib2_lf weib_lf weib_lf0 weibhet_glf weibhet_glf_sh weibhet_glfa weibhet_glfa_sh weibhet_gp weibhet_ilf weibhet_ilf_sh weibhet_ilfa weibhet_ilfa_sh weibhet_ip weibu_sw weibul_p weibull weibull_c weibull_s weibullhet wh whelp whi which whil while wilc_st wilcoxon win wind windo window winexec wntestb wntestb_7 wntestq xchart xchart_7 xcorr xcorr_7 xi xi_6 xmlsav xmlsave xmluse xpose xsh xshe xshel xshell xt_iis xt_tis xtab_p xtabond xtbin_p xtclog xtcloglog xtcloglog_8 xtcloglog_d2 xtcloglog_pa_p xtcloglog_re_p xtcnt_p xtcorr xtdata xtdes xtfront_p xtfrontier xtgee xtgee_elink xtgee_estat xtgee_makeivar xtgee_p xtgee_plink xtgls xtgls_p xthaus xthausman xtht_p xthtaylor xtile xtint_p xtintreg xtintreg_8 xtintreg_d2 xtintreg_p xtivp_1 xtivp_2 xtivreg xtline xtline_ex xtlogit xtlogit_8 xtlogit_d2 xtlogit_fe_p xtlogit_pa_p xtlogit_re_p xtmixed xtmixed_estat xtmixed_p xtnb_fe xtnb_lf xtnbreg xtnbreg_pa_p xtnbreg_refe_p xtpcse xtpcse_p xtpois xtpoisson xtpoisson_d2 xtpoisson_pa_p xtpoisson_refe_p xtpred xtprobit xtprobit_8 xtprobit_d2 xtprobit_re_p xtps_fe xtps_lf xtps_ren xtps_ren_8 xtrar_p xtrc xtrc_p xtrchh xtrefe_p xtreg xtreg_be xtreg_fe xtreg_ml xtreg_pa_p xtreg_re xtregar xtrere_p xtset xtsf_ll xtsf_llti xtsum xttab xttest0 xttobit xttobit_8 xttobit_p xttrans yx yxview__barlike_draw yxview_area_draw yxview_bar_draw yxview_dot_draw yxview_dropline_draw yxview_function_draw yxview_iarrow_draw yxview_ilabels_draw yxview_normal_draw yxview_pcarrow_draw yxview_pcbarrow_draw yxview_pccapsym_draw yxview_pcscatter_draw yxview_pcspike_draw yxview_rarea_draw yxview_rbar_draw yxview_rbarm_draw yxview_rcap_draw yxview_rcapsym_draw yxview_rconnected_draw yxview_rline_draw yxview_rscatter_draw yxview_rspike_draw yxview_spike_draw yxview_sunflower_draw zap_s zinb zinb_llf zinb_plf zip zip_llf zip_p zip_plf zt_ct_5 zt_hc_5 zt_hcd_5 zt_is_5 zt_iss_5 zt_sho_5 zt_smp_5 ztbase_5 ztcox_5 ztdes_5 ztereg_5 ztfill_5 ztgen_5 ztir_5 ztjoin_5 ztnb ztnb_p ztp ztp_p zts_5 ztset_5 ztspli_5 ztsum_5 zttoct_5 ztvary_5 ztweib_5',
            contains: [
            {
                className: 'label',
                variants: [
                {
                    begin: "\\$\\{?[a-zA-Z0-9_]+\\}?"
                },
                {
                    begin: "`[a-zA-Z0-9_]+'"
                }

                ]
            },
            {
                className: 'string',
                variants: [
                {
                    begin: '`"[^\r\n]*?"\''
                },
                {
                    begin: '"[^\r\n"]*"'
                }
                ]
            },
            {
                className: 'literal',
                variants: [
                {
                    begin: '\\b(abs|acos|asin|atan|atan2|atanh|ceil|cloglog|comb|cos|digamma|exp|floor|invcloglog|invlogit|ln|lnfact|lnfactorial|lngamma|log|log10|max|min|mod|reldif|round|sign|sin|sqrt|sum|tan|tanh|trigamma|trunc|betaden|Binomial|binorm|binormal|chi2|chi2tail|dgammapda|dgammapdada|dgammapdadx|dgammapdx|dgammapdxdx|F|Fden|Ftail|gammaden|gammap|ibeta|invbinomial|invchi2|invchi2tail|invF|invFtail|invgammap|invibeta|invnchi2|invnFtail|invnibeta|invnorm|invnormal|invttail|nbetaden|nchi2|nFden|nFtail|nibeta|norm|normal|normalden|normd|npnchi2|tden|ttail|uniform|abbrev|char|index|indexnot|length|lower|ltrim|match|plural|proper|real|regexm|regexr|regexs|reverse|rtrim|string|strlen|strlower|strltrim|strmatch|strofreal|strpos|strproper|strreverse|strrtrim|strtrim|strupper|subinstr|subinword|substr|trim|upper|word|wordcount|_caller|autocode|byteorder|chop|clip|cond|e|epsdouble|epsfloat|group|inlist|inrange|irecode|matrix|maxbyte|maxdouble|maxfloat|maxint|maxlong|mi|minbyte|mindouble|minfloat|minint|minlong|missing|r|recode|replay|return|s|scalar|d|date|day|dow|doy|halfyear|mdy|month|quarter|week|year|d|daily|dofd|dofh|dofm|dofq|dofw|dofy|h|halfyearly|hofd|m|mofd|monthly|q|qofd|quarterly|tin|twithin|w|weekly|wofd|y|yearly|yh|ym|yofd|yq|yw|cholesky|colnumb|colsof|corr|det|diag|diag0cnt|el|get|hadamard|I|inv|invsym|issym|issymmetric|J|matmissing|matuniform|mreldif|nullmat|rownumb|rowsof|sweep|syminv|trace|vec|vecdiag)(?=\\(|$)'
                }
                ]
            },
            hljs.COMMENT('^[ \t]*\\*.*$', false),
            hljs.C_LINE_COMMENT_MODE,
            hljs.C_BLOCK_COMMENT_MODE
            ]
        };
    };
}, {}
],
154: [function(require, module, exports) {
    module.exports = function(hljs) {
        var STEP21_IDENT_RE = '[A-Z_][A-Z0-9_.]*';
        var STEP21_CLOSE_RE = 'END-ISO-10303-21;';
        var STEP21_KEYWORDS = {
            literal: '',
            built_in: '',
            keyword:
            'HEADER ENDSEC DATA'
        };
        var STEP21_START = {
            className: 'preprocessor',
            begin: 'ISO-10303-21;',
            relevance: 10
        };
        var STEP21_CODE = [
        hljs.C_LINE_COMMENT_MODE,
        hljs.C_BLOCK_COMMENT_MODE,
        hljs.COMMENT('/\\*\\*!', '\\*/'),
        hljs.C_NUMBER_MODE,
        hljs.inherit(hljs.APOS_STRING_MODE, {
            illegal: null
        }),
        hljs.inherit(hljs.QUOTE_STRING_MODE, {
            illegal: null
        }),
        {
            className: 'string',
            begin: "'",
            end: "'"
        },
        {
            className: 'label',
            variants: [
            {
                begin: '#',
                end: '\\d+',
                illegal: '\\W'
            }
            ]
        }
        ];

        return {
            aliases: ['p21', 'step', 'stp'],
            case_insensitive: true,
            // STEP 21 is case insensitive in theory, in practice all non-comments are capitalized.
            lexemes: STEP21_IDENT_RE,
            keywords: STEP21_KEYWORDS,
            contains: [
            {
                className: 'preprocessor',
                begin: STEP21_CLOSE_RE,
                relevance: 10
            },
            STEP21_START
            ].concat(STEP21_CODE)
        };
    };
}, {}
],
155: [function(require, module, exports) {
    module.exports = function(hljs) {

        var VARIABLE = {
            className: 'variable',
            begin: '\\$' + hljs.IDENT_RE
        };

        var HEX_COLOR = {
            className: 'hexcolor',
            begin: '#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})',
            relevance: 10
        };

        var AT_KEYWORDS = [
        'charset',
        'css',
        'debug',
        'extend',
        'font-face',
        'for',
        'import',
        'include',
        'media',
        'mixin',
        'page',
        'warn',
        'while'
        ];

        var PSEUDO_SELECTORS = [
        'after',
        'before',
        'first-letter',
        'first-line',
        'active',
        'first-child',
        'focus',
        'hover',
        'lang',
        'link',
        'visited'
        ];

        var TAGS = [
        'a',
        'abbr',
        'address',
        'article',
        'aside',
        'audio',
        'b',
        'blockquote',
        'body',
        'button',
        'canvas',
        'caption',
        'cite',
        'code',
        'dd',
        'del',
        'details',
        'dfn',
        'div',
        'dl',
        'dt',
        'em',
        'fieldset',
        'figcaption',
        'figure',
        'footer',
        'form',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'header',
        'hgroup',
        'html',
        'i',
        'iframe',
        'img',
        'input',
        'ins',
        'kbd',
        'label',
        'legend',
        'li',
        'mark',
        'menu',
        'nav',
        'object',
        'ol',
        'p',
        'q',
        'quote',
        'samp',
        'section',
        'span',
        'strong',
        'summary',
        'sup',
        'table',
        'tbody',
        'td',
        'textarea',
        'tfoot',
        'th',
        'thead',
        'time',
        'tr',
        'ul',
        'var',
        'video'
        ];

        var TAG_END = '[\\.\\s\\n\\[\\:,]';

        var ATTRIBUTES = [
        'align-content',
        'align-items',
        'align-self',
        'animation',
        'animation-delay',
        'animation-direction',
        'animation-duration',
        'animation-fill-mode',
        'animation-iteration-count',
        'animation-name',
        'animation-play-state',
        'animation-timing-function',
        'auto',
        'backface-visibility',
        'background',
        'background-attachment',
        'background-clip',
        'background-color',
        'background-image',
        'background-origin',
        'background-position',
        'background-repeat',
        'background-size',
        'border',
        'border-bottom',
        'border-bottom-color',
        'border-bottom-left-radius',
        'border-bottom-right-radius',
        'border-bottom-style',
        'border-bottom-width',
        'border-collapse',
        'border-color',
        'border-image',
        'border-image-outset',
        'border-image-repeat',
        'border-image-slice',
        'border-image-source',
        'border-image-width',
        'border-left',
        'border-left-color',
        'border-left-style',
        'border-left-width',
        'border-radius',
        'border-right',
        'border-right-color',
        'border-right-style',
        'border-right-width',
        'border-spacing',
        'border-style',
        'border-top',
        'border-top-color',
        'border-top-left-radius',
        'border-top-right-radius',
        'border-top-style',
        'border-top-width',
        'border-width',
        'bottom',
        'box-decoration-break',
        'box-shadow',
        'box-sizing',
        'break-after',
        'break-before',
        'break-inside',
        'caption-side',
        'clear',
        'clip',
        'clip-path',
        'color',
        'column-count',
        'column-fill',
        'column-gap',
        'column-rule',
        'column-rule-color',
        'column-rule-style',
        'column-rule-width',
        'column-span',
        'column-width',
        'columns',
        'content',
        'counter-increment',
        'counter-reset',
        'cursor',
        'direction',
        'display',
        'empty-cells',
        'filter',
        'flex',
        'flex-basis',
        'flex-direction',
        'flex-flow',
        'flex-grow',
        'flex-shrink',
        'flex-wrap',
        'float',
        'font',
        'font-family',
        'font-feature-settings',
        'font-kerning',
        'font-language-override',
        'font-size',
        'font-size-adjust',
        'font-stretch',
        'font-style',
        'font-variant',
        'font-variant-ligatures',
        'font-weight',
        'height',
        'hyphens',
        'icon',
        'image-orientation',
        'image-rendering',
        'image-resolution',
        'ime-mode',
        'inherit',
        'initial',
        'justify-content',
        'left',
        'letter-spacing',
        'line-height',
        'list-style',
        'list-style-image',
        'list-style-position',
        'list-style-type',
        'margin',
        'margin-bottom',
        'margin-left',
        'margin-right',
        'margin-top',
        'marks',
        'mask',
        'max-height',
        'max-width',
        'min-height',
        'min-width',
        'nav-down',
        'nav-index',
        'nav-left',
        'nav-right',
        'nav-up',
        'none',
        'normal',
        'object-fit',
        'object-position',
        'opacity',
        'order',
        'orphans',
        'outline',
        'outline-color',
        'outline-offset',
        'outline-style',
        'outline-width',
        'overflow',
        'overflow-wrap',
        'overflow-x',
        'overflow-y',
        'padding',
        'padding-bottom',
        'padding-left',
        'padding-right',
        'padding-top',
        'page-break-after',
        'page-break-before',
        'page-break-inside',
        'perspective',
        'perspective-origin',
        'pointer-events',
        'position',
        'quotes',
        'resize',
        'right',
        'tab-size',
        'table-layout',
        'text-align',
        'text-align-last',
        'text-decoration',
        'text-decoration-color',
        'text-decoration-line',
        'text-decoration-style',
        'text-indent',
        'text-overflow',
        'text-rendering',
        'text-shadow',
        'text-transform',
        'text-underline-position',
        'top',
        'transform',
        'transform-origin',
        'transform-style',
        'transition',
        'transition-delay',
        'transition-duration',
        'transition-property',
        'transition-timing-function',
        'unicode-bidi',
        'vertical-align',
        'visibility',
        'white-space',
        'widows',
        'width',
        'word-break',
        'word-spacing',
        'word-wrap',
        'z-index'
        ];

        // illegals
        var ILLEGAL = [
        '\\{',
        '\\}',
        '\\?',
        '(\\bReturn\\b)', // monkey
        '(\\bEnd\\b)', // monkey
        '(\\bend\\b)', // vbscript
        ';', // sql
        '#\\s', // markdown
        '\\*\\s', // markdown
        '===\\s', // markdown
        '\\|',
        '%', // prolog
        ];

        return {
            aliases: ['styl'],
            case_insensitive : false,
            illegal : '(' + ILLEGAL.join('|') + ')',
            keywords : 'if else for in',
            contains : [
            // strings
            hljs.QUOTE_STRING_MODE,
            hljs.APOS_STRING_MODE,
            // comments
            hljs.C_LINE_COMMENT_MODE,
            hljs.C_BLOCK_COMMENT_MODE,
            // hex colors
            HEX_COLOR,
            // class tag
            {
                begin: '\\.[a-zA-Z][a-zA-Z0-9_-]*' + TAG_END,
                returnBegin: true,
                contains: [
                {
                    className: 'class',
                    begin: '\\.[a-zA-Z][a-zA-Z0-9_-]*'
                }
                ]
            },
            // id tag
            {
                begin: '\\#[a-zA-Z][a-zA-Z0-9_-]*' + TAG_END,
                returnBegin: true,
                contains: [
                {
                    className: 'id',
                    begin: '\\#[a-zA-Z][a-zA-Z0-9_-]*'
                }
                ]
            },
            // tags
            {
                begin: '\\b(' + TAGS.join('|') + ')' + TAG_END,
                returnBegin: true,
                contains: [
                {
                    className: 'tag',
                    begin: '\\b[a-zA-Z][a-zA-Z0-9_-]*'
                }
                ]
            },
            // psuedo selectors
            {
                className: 'pseudo',
                begin: '&?:?:\\b(' + PSEUDO_SELECTORS.join('|') + ')' + TAG_END
            },
            // @ keywords
            {
                className: 'at_rule',
                begin: '\@(' + AT_KEYWORDS.join('|') + ')\\b'
            },
            // variables
            VARIABLE,
            // dimension
            hljs.CSS_NUMBER_MODE,
            // number
            hljs.NUMBER_MODE,
            // functions
            //  - only from beginning of line + whitespace
            {
                className: 'function',
                begin: '\\b[a-zA-Z][a-zA-Z0-9_\-]*\\(.*\\)',
                illegal: '[\\n]',
                returnBegin: true,
                contains: [
                {
                    className: 'title',
                    begin: '\\b[a-zA-Z][a-zA-Z0-9_\-]*'
                },
                {
                    className: 'params',
                    begin: /\(/,
                    end: /\)/,
                    contains: [
                    HEX_COLOR,
                    VARIABLE,
                    hljs.APOS_STRING_MODE,
                    hljs.CSS_NUMBER_MODE,
                    hljs.NUMBER_MODE,
                    hljs.QUOTE_STRING_MODE
                    ]
                }
                ]
            },
            // attributes
            //  - only from beginning of line + whitespace
            //  - must have whitespace after it
            {
                className: 'attribute',
                begin: '\\b(' + ATTRIBUTES.reverse().join('|') + ')\\b'
            }
            ]
        };
    };
}, {}
],
156: [function(require, module, exports) {
    module.exports = function(hljs) {
        var SWIFT_KEYWORDS = {
            keyword: 'class deinit enum extension func init let protocol static ' +
            'struct subscript typealias var break case continue default do ' +
            'else fallthrough if in for return switch where while as dynamicType ' +
            'is new super self Self Type __COLUMN__ __FILE__ __FUNCTION__ ' +
            '__LINE__ associativity didSet get infix inout left mutating none ' +
            'nonmutating operator override postfix precedence prefix right set ' +
            'unowned unowned safe unsafe weak willSet',
            literal: 'true false nil',
            built_in: 'abs advance alignof alignofValue assert bridgeFromObjectiveC ' +
            'bridgeFromObjectiveCUnconditional bridgeToObjectiveC ' +
            'bridgeToObjectiveCUnconditional c contains count countElements ' +
            'countLeadingZeros debugPrint debugPrintln distance dropFirst dropLast dump ' +
            'encodeBitsAsWords enumerate equal filter find getBridgedObjectiveCType ' +
            'getVaList indices insertionSort isBridgedToObjectiveC ' +
            'isBridgedVerbatimToObjectiveC isUniquelyReferenced join ' +
            'lexicographicalCompare map max maxElement min minElement numericCast ' +
            'partition posix print println quickSort reduce reflect reinterpretCast ' +
            'reverse roundUpToAlignment sizeof sizeofValue sort split startsWith strideof ' +
            'strideofValue swap swift toString transcode underestimateCount ' +
            'unsafeReflect withExtendedLifetime withObjectAtPlusZero withUnsafePointer ' +
            'withUnsafePointerToObject withUnsafePointers withVaList'
        };

        var TYPE = {
            className: 'type',
            begin: '\\b[A-Z][\\w\']*',
            relevance: 0
        };
        var BLOCK_COMMENT = hljs.COMMENT(
        '/\\*',
        '\\*/',
        {
            contains: ['self']
        });
        var SUBST = {
            className: 'subst',
            begin: /\\\(/,
            end: '\\)',
            keywords: SWIFT_KEYWORDS,
            contains: [] // assigned later
        };
        var NUMBERS = {
            className: 'number',
            begin: '\\b([\\d_]+(\\.[\\deE_]+)?|0x[a-fA-F0-9_]+(\\.[a-fA-F0-9p_]+)?|0b[01_]+|0o[0-7_]+)\\b',
            relevance: 0
        };
        var QUOTE_STRING_MODE = hljs.inherit(hljs.QUOTE_STRING_MODE, {
            contains: [SUBST, hljs.BACKSLASH_ESCAPE]
        });
        SUBST.contains = [NUMBERS];

        return {
            keywords: SWIFT_KEYWORDS,
            contains: [
            QUOTE_STRING_MODE,
            hljs.C_LINE_COMMENT_MODE,
            BLOCK_COMMENT,
            TYPE,
            NUMBERS,
            {
                className: 'func',
                beginKeywords: 'func',
                end: '{',
                excludeEnd: true,
                contains: [
                hljs.inherit(hljs.TITLE_MODE, {
                    begin: /[A-Za-z$_][0-9A-Za-z$_]*/,
                    illegal: /\(/
                }),
                {
                    className: 'generics',
                    begin: /</,
                    end: />/,
                    illegal: />/
                },
                {
                    className: 'params',
                    begin: /\(/,
                    end: /\)/,
                    endsParent: true,
                    keywords: SWIFT_KEYWORDS,
                    contains: [
                    'self',
                    NUMBERS,
                    QUOTE_STRING_MODE,
                    hljs.C_BLOCK_COMMENT_MODE,
                    {
                        begin: ':'
                    }
                    // relevance booster
                    ],
                    illegal: /["']/
                }
                ],
                illegal: /\[|%/
            },
            {
                className: 'class',
                beginKeywords: 'struct protocol class extension enum',
                keywords: SWIFT_KEYWORDS,
                end: '\\{',
                excludeEnd: true,
                contains: [
                hljs.inherit(hljs.TITLE_MODE, {
                    begin: /[A-Za-z$_][0-9A-Za-z$_]*/
                })
                ]
            },
            {
                className: 'preprocessor',
                // @attributes
                begin: '(@assignment|@class_protocol|@exported|@final|@lazy|@noreturn|' +
                '@NSCopying|@NSManaged|@objc|@optional|@required|@auto_closure|' +
                '@noreturn|@IBAction|@IBDesignable|@IBInspectable|@IBOutlet|' +
                '@infix|@prefix|@postfix)'
            },
            {
                beginKeywords: 'import',
                end: /$/,
                contains: [hljs.C_LINE_COMMENT_MODE, BLOCK_COMMENT]
            }
            ]
        };
    };
}, {}
],
157: [function(require, module, exports) {
    module.exports = function(hljs) {
        return {
            aliases: ['tk'],
            keywords: 'after append apply array auto_execok auto_import auto_load auto_mkindex ' +
            'auto_mkindex_old auto_qualify auto_reset bgerror binary break catch cd chan clock ' +
            'close concat continue dde dict encoding eof error eval exec exit expr fblocked ' +
            'fconfigure fcopy file fileevent filename flush for foreach format gets glob global ' +
            'history http if incr info interp join lappend|10 lassign|10 lindex|10 linsert|10 list ' +
            'llength|10 load lrange|10 lrepeat|10 lreplace|10 lreverse|10 lsearch|10 lset|10 lsort|10 ' +
            'mathfunc mathop memory msgcat namespace open package parray pid pkg::create pkg_mkIndex ' +
            'platform platform::shell proc puts pwd read refchan regexp registry regsub|10 rename ' +
            'return safe scan seek set socket source split string subst switch tcl_endOfWord ' +
            'tcl_findLibrary tcl_startOfNextWord tcl_startOfPreviousWord tcl_wordBreakAfter ' +
            'tcl_wordBreakBefore tcltest tclvars tell time tm trace unknown unload unset update ' +
            'uplevel upvar variable vwait while',
            contains: [
            hljs.COMMENT(';[ \\t]*#', '$'),
            hljs.COMMENT('^[ \\t]*#', '$'),
            {
                beginKeywords: 'proc',
                end: '[\\{]',
                excludeEnd: true,
                contains: [
                {
                    className: 'symbol',
                    begin: '[ \\t\\n\\r]+(::)?[a-zA-Z_]((::)?[a-zA-Z0-9_])*',
                    end: '[ \\t\\n\\r]',
                    endsWithParent: true,
                    excludeEnd: true
                }
                ]
            },
            {
                className: 'variable',
                excludeEnd: true,
                variants: [
                {
                    begin: '\\$(\\{)?(::)?[a-zA-Z_]((::)?[a-zA-Z0-9_])*\\(([a-zA-Z0-9_])*\\)',
                    end: '[^a-zA-Z0-9_\\}\\$]'
                },
                {
                    begin: '\\$(\\{)?(::)?[a-zA-Z_]((::)?[a-zA-Z0-9_])*',
                    end: '(\\))?[^a-zA-Z0-9_\\}\\$]'
                }
                ]
            },
            {
                className: 'string',
                contains: [hljs.BACKSLASH_ESCAPE],
                variants: [
                hljs.inherit(hljs.APOS_STRING_MODE, {
                    illegal: null
                }),
                hljs.inherit(hljs.QUOTE_STRING_MODE, {
                    illegal: null
                })
                ]
            },
            {
                className: 'number',
                variants: [hljs.BINARY_NUMBER_MODE, hljs.C_NUMBER_MODE]
            }
            ]
        }
    };
}, {}
],
158: [function(require, module, exports) {
    module.exports = function(hljs) {
        var COMMAND1 = {
            className: 'command',
            begin: '\\\\[a-zA-Zа-яА-я]+[\\*]?'
        };
        var COMMAND2 = {
            className: 'command',
            begin: '\\\\[^a-zA-Zа-яА-я0-9]'
        };
        var SPECIAL = {
            className: 'special',
            begin: '[{}\\[\\]\\&#~]',
            relevance: 0
        };

        return {
            contains: [
            {
                // parameter
                begin: '\\\\[a-zA-Zа-яА-я]+[\\*]? *= *-?\\d*\\.?\\d+(pt|pc|mm|cm|in|dd|cc|ex|em)?',
                returnBegin: true,
                contains: [
                COMMAND1, COMMAND2,
                {
                    className: 'number',
                    begin: ' *=',
                    end: '-?\\d*\\.?\\d+(pt|pc|mm|cm|in|dd|cc|ex|em)?',
                    excludeBegin: true
                }
                ],
                relevance: 10
            },
            COMMAND1, COMMAND2,
            SPECIAL,
            {
                className: 'formula',
                begin: '\\$\\$',
                end: '\\$\\$',
                contains: [COMMAND1, COMMAND2, SPECIAL],
                relevance: 0
            },
            {
                className: 'formula',
                begin: '\\$',
                end: '\\$',
                contains: [COMMAND1, COMMAND2, SPECIAL],
                relevance: 0
            },
            hljs.COMMENT(
            '%',
            '$',
            {
                relevance: 0
            })
            ]
        };
    };
}, {}
],
159: [function(require, module, exports) {
    module.exports = function(hljs) {
        var BUILT_IN_TYPES = 'bool byte i16 i32 i64 double string binary';
        return {
            keywords: {
                keyword:
                'namespace const typedef struct enum service exception void oneway set list map required optional',
                built_in:
                BUILT_IN_TYPES,
                literal:
                'true false'
            },
            contains: [
            hljs.QUOTE_STRING_MODE,
            hljs.NUMBER_MODE,
            hljs.C_LINE_COMMENT_MODE,
            hljs.C_BLOCK_COMMENT_MODE,
            {
                className: 'class',
                beginKeywords: 'struct enum service exception',
                end: /\{/,
                illegal: /\n/,
                contains: [
                hljs.inherit(hljs.TITLE_MODE, {
                    starts: {
                        endsWithParent: true,
                        excludeEnd: true
                    }
                    // hack: eating everything after the first title
                })
                ]
            },
            {
                begin: '\\b(set|list|map)\\s*<',
                end: '>',
                keywords: BUILT_IN_TYPES,
                contains: ['self']
            }
            ]
        };
    };
}, {}
],
160: [function(require, module, exports) {
    module.exports = function(hljs) {
        var TPID = {
            className: 'number',
            begin: '[1-9][0-9]*',
            /* no leading zeros */
            relevance: 0
        };
        var TPLABEL = {
            className: 'comment',
            begin: ':[^\\]]+'
        };
        var TPDATA = {
            className: 'built_in',
            begin: '(AR|P|PAYLOAD|PR|R|SR|RSR|LBL|VR|UALM|MESSAGE|UTOOL|UFRAME|TIMER|\
            TIMER_OVERFLOW|JOINT_MAX_SPEED|RESUME_PROG|DIAG_REC)\\[',
            end: '\\]',
            contains: [
            'self',
            TPID,
            TPLABEL
            ]
        };
        var TPIO = {
            className: 'built_in',
            begin: '(AI|AO|DI|DO|F|RI|RO|UI|UO|GI|GO|SI|SO)\\[',
            end: '\\]',
            contains: [
            'self',
            TPID,
            hljs.QUOTE_STRING_MODE, /* for pos section at bottom */
            TPLABEL
            ]
        };

        return {
            keywords: {
                keyword:
                'ABORT ACC ADJUST AND AP_LD BREAK CALL CNT COL CONDITION CONFIG DA DB ' +
                'DIV DETECT ELSE END ENDFOR ERR_NUM ERROR_PROG FINE FOR GP GUARD INC ' +
                'IF JMP LINEAR_MAX_SPEED LOCK MOD MONITOR OFFSET Offset OR OVERRIDE ' +
                'PAUSE PREG PTH RT_LD RUN SELECT SKIP Skip TA TB TO TOOL_OFFSET ' +
                'Tool_Offset UF UT UFRAME_NUM UTOOL_NUM UNLOCK WAIT X Y Z W P R STRLEN ' +
                'SUBSTR FINDSTR VOFFSET',
                constant:
                'ON OFF max_speed LPOS JPOS ENABLE DISABLE START STOP RESET'
            },
            contains: [
            TPDATA,
            TPIO,
            {
                className: 'keyword',
                begin: '/(PROG|ATTR|MN|POS|END)\\b'
            },
            {
                /* this is for cases like ,CALL */
                className: 'keyword',
                begin: '(CALL|RUN|POINT_LOGIC|LBL)\\b'
            },
            {
                /* this is for cases like CNT100 where the default lexemes do not
                         * separate the keyword and the number */
                className: 'keyword',
                begin: '\\b(ACC|CNT|Skip|Offset|PSPD|RT_LD|AP_LD|Tool_Offset)'
            },
            {
                /* to catch numbers that do not have a word boundary on the left */
                className: 'number',
                begin: '\\d+(sec|msec|mm/sec|cm/min|inch/min|deg/sec|mm|in|cm)?\\b',
                relevance: 0
            },
            hljs.COMMENT('//', '[;$]'),
            hljs.COMMENT('!', '[;$]'),
            hljs.COMMENT('--eg:', '$'),
            hljs.QUOTE_STRING_MODE,
            {
                className: 'string',
                begin: '\'',
                end: '\''
            },
            hljs.C_NUMBER_MODE,
            {
                className: 'variable',
                begin: '\\$[A-Za-z0-9_]+'
            }
            ]
        };
    };
}, {}
],
161: [function(require, module, exports) {
    module.exports = function(hljs) {
        var PARAMS = {
            className: 'params',
            begin: '\\(',
            end: '\\)'
        };

        var FUNCTION_NAMES = 'attribute block constant cycle date dump include ' +
        'max min parent random range source template_from_string';

        var FUNCTIONS = {
            className: 'function',
            beginKeywords: FUNCTION_NAMES,
            relevance: 0,
            contains: [
            PARAMS
            ]
        };

        var FILTER = {
            className: 'filter',
            begin: /\|[A-Za-z_]+:?/,
            keywords:
            'abs batch capitalize convert_encoding date date_modify default ' +
            'escape first format join json_encode keys last length lower ' +
            'merge nl2br number_format raw replace reverse round slice sort split ' +
            'striptags title trim upper url_encode',
            contains: [
            FUNCTIONS
            ]
        };

        var TAGS = 'autoescape block do embed extends filter flush for ' +
        'if import include macro sandbox set spaceless use verbatim';

        TAGS = TAGS + ' ' + TAGS.split(' ').map(function(t) {
            return 'end' + t
        }).join(' ');

        return {
            aliases: ['craftcms'],
            case_insensitive: true,
            subLanguage: 'xml',
            contains: [
            hljs.COMMENT(/\{#/, /#}/),
            {
                className: 'template_tag',
                begin: /\{%/,
                end: /%}/,
                keywords: TAGS,
                contains: [FILTER, FUNCTIONS]
            },
            {
                className: 'variable',
                begin: /\{\{/,
                end: /}}/,
                contains: [FILTER, FUNCTIONS]
            }
            ]
        };
    };
}, {}
],
162: [function(require, module, exports) {
    module.exports = function(hljs) {
        var KEYWORDS = {
            keyword:
            'in if for while finally var new function|0 do return void else break catch ' +
            'instanceof with throw case default try this switch continue typeof delete ' +
            'let yield const class public private get set super ' +
            'static implements enum export import declare type protected',
            literal:
            'true false null undefined NaN Infinity',
            built_in:
            'eval isFinite isNaN parseFloat parseInt decodeURI decodeURIComponent ' +
            'encodeURI encodeURIComponent escape unescape Object Function Boolean Error ' +
            'EvalError InternalError RangeError ReferenceError StopIteration SyntaxError ' +
            'TypeError URIError Number Math Date String RegExp Array Float32Array ' +
            'Float64Array Int16Array Int32Array Int8Array Uint16Array Uint32Array ' +
            'Uint8Array Uint8ClampedArray ArrayBuffer DataView JSON Intl arguments require ' +
            'module console window document any number boolean string void'
        };

        return {
            aliases: ['ts'],
            keywords: KEYWORDS,
            contains: [
            {
                className: 'pi',
                begin: /^\s*['"]use strict['"]/,
                relevance: 0
            },
            hljs.APOS_STRING_MODE,
            hljs.QUOTE_STRING_MODE,
            hljs.C_LINE_COMMENT_MODE,
            hljs.C_BLOCK_COMMENT_MODE,
            {
                className: 'number',
                variants: [
                {
                    begin: '\\b(0[bB][01]+)'
                },
                {
                    begin: '\\b(0[oO][0-7]+)'
                },
                {
                    begin: hljs.C_NUMBER_RE
                }
                ],
                relevance: 0
            },
            {
                // "value" container
                begin: '(' + hljs.RE_STARTERS_RE + '|\\b(case|return|throw)\\b)\\s*',
                keywords: 'return throw case',
                contains: [
                hljs.C_LINE_COMMENT_MODE,
                hljs.C_BLOCK_COMMENT_MODE,
                hljs.REGEXP_MODE
                ],
                relevance: 0
            },
            {
                className: 'function',
                begin: 'function',
                end: /[\{;]/,
                excludeEnd: true,
                keywords: KEYWORDS,
                contains: [
                'self',
                hljs.inherit(hljs.TITLE_MODE, {
                    begin: /[A-Za-z$_][0-9A-Za-z$_]*/
                }),
                {
                    className: 'params',
                    begin: /\(/,
                    end: /\)/,
                    excludeBegin: true,
                    excludeEnd: true,
                    keywords: KEYWORDS,
                    contains: [
                    hljs.C_LINE_COMMENT_MODE,
                    hljs.C_BLOCK_COMMENT_MODE
                    ],
                    illegal: /["'\(]/
                }
                ],
                illegal: /\[|%/,
                relevance: 0 // () => {} is more typical in TypeScript
            },
            {
                className: 'constructor',
                beginKeywords: 'constructor',
                end: /\{/,
                excludeEnd: true,
                relevance: 10
            },
            {
                className: 'module',
                beginKeywords: 'module',
                end: /\{/,
                excludeEnd: true
            },
            {
                className: 'interface',
                beginKeywords: 'interface',
                end: /\{/,
                excludeEnd: true,
                keywords: 'interface extends'
            },
            {
                begin: /\$[(.]/ // relevance booster for a pattern common to JS libs: `$(something)` and `$.something`
            },
            {
                begin: '\\.' + hljs.IDENT_RE,
                relevance: 0 // hack: prevents detection of keywords after dots
            }
            ]
        };
    };
}, {}
],
163: [function(require, module, exports) {
    module.exports = function(hljs) {
        return {
            keywords: {
                keyword:
                // Value types
                'char uchar unichar int uint long ulong short ushort int8 int16 int32 int64 uint8 ' +
                'uint16 uint32 uint64 float double bool struct enum string void ' +
                // Reference types
                'weak unowned owned ' +
                // Modifiers
                'async signal static abstract interface override ' +
                // Control Structures
                'while do for foreach else switch case break default return try catch ' +
                // Visibility
                'public private protected internal ' +
                // Other
                'using new this get set const stdout stdin stderr var',
                built_in:
                'DBus GLib CCode Gee Object',
                literal:
                'false true null'
            },
            contains: [
            {
                className: 'class',
                beginKeywords: 'class interface delegate namespace',
                end: '{',
                excludeEnd: true,
                illegal: '[^,:\\n\\s\\.]',
                contains: [
                hljs.UNDERSCORE_TITLE_MODE
                ]
            },
            hljs.C_LINE_COMMENT_MODE,
            hljs.C_BLOCK_COMMENT_MODE,
            {
                className: 'string',
                begin: '"""',
                end: '"""',
                relevance: 5
            },
            hljs.APOS_STRING_MODE,
            hljs.QUOTE_STRING_MODE,
            hljs.C_NUMBER_MODE,
            {
                className: 'preprocessor',
                begin: '^#',
                end: '$',
                relevance: 2
            },
            {
                className: 'constant',
                begin: ' [A-Z_]+ ',
                relevance: 0
            }
            ]
        };
    };
}, {}
],
164: [function(require, module, exports) {
    module.exports = function(hljs) {
        return {
            aliases: ['vb'],
            case_insensitive: true,
            keywords: {
                keyword:
                'addhandler addressof alias and andalso aggregate ansi as assembly auto binary by byref byval ' + /* a-b */
                'call case catch class compare const continue custom declare default delegate dim distinct do ' + /* c-d */
                'each equals else elseif end enum erase error event exit explicit finally for friend from function ' + /* e-f */
                'get global goto group handles if implements imports in inherits interface into is isfalse isnot istrue ' + /* g-i */
                'join key let lib like loop me mid mod module mustinherit mustoverride mybase myclass ' + /* j-m */
                'namespace narrowing new next not notinheritable notoverridable ' + /* n */
                'of off on operator option optional or order orelse overloads overridable overrides ' + /* o */
                'paramarray partial preserve private property protected public ' + /* p */
                'raiseevent readonly redim rem removehandler resume return ' + /* r */
                'select set shadows shared skip static step stop structure strict sub synclock ' + /* s */
                'take text then throw to try unicode until using when where while widening with withevents writeonly xor',
                /* t-x */
                built_in:
                'boolean byte cbool cbyte cchar cdate cdec cdbl char cint clng cobj csbyte cshort csng cstr ctype ' + /* b-c */
                'date decimal directcast double gettype getxmlnamespace iif integer long object ' + /* d-o */
                'sbyte short single string trycast typeof uinteger ulong ushort',
                /* s-u */
                literal:
                'true false nothing'
            },
            illegal: '//|{|}|endif|gosub|variant|wend',
            /* reserved deprecated keywords */
            contains: [
            hljs.inherit(hljs.QUOTE_STRING_MODE, {
                contains: [{
                    begin: '""'
                }
                ]
            }),
            hljs.COMMENT(
            '\'',
            '$',
            {
                returnBegin: true,
                contains: [
                {
                    className: 'xmlDocTag',
                    begin: '\'\'\'|<!--|-->',
                    contains: [hljs.PHRASAL_WORDS_MODE]
                },
                {
                    className: 'xmlDocTag',
                    begin: '</?',
                    end: '>',
                    contains: [hljs.PHRASAL_WORDS_MODE]
                }
                ]
            }),
            hljs.C_NUMBER_MODE,
            {
                className: 'preprocessor',
                begin: '#',
                end: '$',
                keywords: 'if else elseif end region externalsource'
            }
            ]
        };
    };
}, {}
],
165: [function(require, module, exports) {
    module.exports = function(hljs) {
        return {
            subLanguage: 'xml',
            contains: [
            {
                begin: '<%',
                end: '%>',
                subLanguage: 'vbscript'
            }
            ]
        };
    };
}, {}
],
166: [function(require, module, exports) {
    module.exports = function(hljs) {
        return {
            aliases: ['vbs'],
            case_insensitive: true,
            keywords: {
                keyword:
                'call class const dim do loop erase execute executeglobal exit for each next function ' +
                'if then else on error option explicit new private property let get public randomize ' +
                'redim rem select case set stop sub while wend with end to elseif is or xor and not ' +
                'class_initialize class_terminate default preserve in me byval byref step resume goto',
                built_in:
                'lcase month vartype instrrev ubound setlocale getobject rgb getref string ' +
                'weekdayname rnd dateadd monthname now day minute isarray cbool round formatcurrency ' +
                'conversions csng timevalue second year space abs clng timeserial fixs len asc ' +
                'isempty maths dateserial atn timer isobject filter weekday datevalue ccur isdate ' +
                'instr datediff formatdatetime replace isnull right sgn array snumeric log cdbl hex ' +
                'chr lbound msgbox ucase getlocale cos cdate cbyte rtrim join hour oct typename trim ' +
                'strcomp int createobject loadpicture tan formatnumber mid scriptenginebuildversion ' +
                'scriptengine split scriptengineminorversion cint sin datepart ltrim sqr ' +
                'scriptenginemajorversion time derived eval date formatpercent exp inputbox left ascw ' +
                'chrw regexp server response request cstr err',
                literal:
                'true false null nothing empty'
            },
            illegal: '//',
            contains: [
            hljs.inherit(hljs.QUOTE_STRING_MODE, {
                contains: [{
                    begin: '""'
                }
                ]
            }),
            hljs.COMMENT(
            /'/,
            /$/,
            {
                relevance: 0
            }),
            hljs.C_NUMBER_MODE
            ]
        };
    };
}, {}
],
167: [function(require, module, exports) {
    module.exports = function(hljs) {
        return {
            aliases: ['v'],
            case_insensitive: true,
            keywords: {
                keyword:
                'always and assign begin buf bufif0 bufif1 case casex casez cmos deassign ' +
                'default defparam disable edge else end endcase endfunction endmodule ' +
                'endprimitive endspecify endtable endtask event for force forever fork ' +
                'function if ifnone initial inout input join macromodule module nand ' +
                'negedge nmos nor not notif0 notif1 or output parameter pmos posedge ' +
                'primitive pulldown pullup rcmos release repeat rnmos rpmos rtran ' +
                'rtranif0 rtranif1 specify specparam table task timescale tran ' +
                'tranif0 tranif1 wait while xnor xor',
                typename:
                'highz0 highz1 integer large medium pull0 pull1 real realtime reg ' +
                'scalared signed small strong0 strong1 supply0 supply0 supply1 supply1 ' +
                'time tri tri0 tri1 triand trior trireg vectored wand weak0 weak1 wire wor'
            },
            contains: [
            hljs.C_BLOCK_COMMENT_MODE,
            hljs.C_LINE_COMMENT_MODE,
            hljs.QUOTE_STRING_MODE,
            {
                className: 'number',
                begin: '\\b(\\d+\'(b|h|o|d|B|H|O|D))?[0-9xzXZ]+',
                contains: [hljs.BACKSLASH_ESCAPE],
                relevance: 0
            },
            /* ports in instances */
            {
                className: 'typename',
                begin: '\\.\\w+',
                relevance: 0
            },
            /* parameters to instances */
            {
                className: 'value',
                begin: '#\\((?!parameter).+\\)'
            },
            /* operators */
            {
                className: 'keyword',
                begin: '\\+|-|\\*|/|%|<|>|=|#|`|\\!|&|\\||@|:|\\^|~|\\{|\\}',
                relevance: 0
            }
            ]
        }; // return
    };
}, {}
],
168: [function(require, module, exports) {
    module.exports = function(hljs) {
        // Regular expression for VHDL numeric literals.

        // Decimal literal:
        var INTEGER_RE = '\\d(_|\\d)*';
        var EXPONENT_RE = '[eE][-+]?' + INTEGER_RE;
        var DECIMAL_LITERAL_RE = INTEGER_RE + '(\\.' + INTEGER_RE + ')?' + '(' + EXPONENT_RE + ')?';
        // Based literal:
        var BASED_INTEGER_RE = '\\w+';
        var BASED_LITERAL_RE = INTEGER_RE + '#' + BASED_INTEGER_RE + '(\\.' + BASED_INTEGER_RE + ')?' + '#' + '(' + EXPONENT_RE + ')?';

        var NUMBER_RE = '\\b(' + BASED_LITERAL_RE + '|' + DECIMAL_LITERAL_RE + ')';

        return {
            case_insensitive: true,
            keywords: {
                keyword:
                'abs access after alias all and architecture array assert attribute begin block ' +
                'body buffer bus case component configuration constant context cover disconnect ' +
                'downto default else elsif end entity exit fairness file for force function generate ' +
                'generic group guarded if impure in inertial inout is label library linkage literal ' +
                'loop map mod nand new next nor not null of on open or others out package port ' +
                'postponed procedure process property protected pure range record register reject ' +
                'release rem report restrict restrict_guarantee return rol ror select sequence ' +
                'severity shared signal sla sll sra srl strong subtype then to transport type ' +
                'unaffected units until use variable vmode vprop vunit wait when while with xnor xor',
                typename:
                'boolean bit character severity_level integer time delay_length natural positive ' +
                'string bit_vector file_open_kind file_open_status std_ulogic std_ulogic_vector ' +
                'std_logic std_logic_vector unsigned signed boolean_vector integer_vector ' +
                'real_vector time_vector'
            },
            illegal: '{',
            contains: [
            hljs.C_BLOCK_COMMENT_MODE, // VHDL-2008 block commenting.
            hljs.COMMENT('--', '$'),
            hljs.QUOTE_STRING_MODE,
            {
                className: 'number',
                begin: NUMBER_RE,
                relevance: 0
            },
            {
                className: 'literal',
                begin: '\'(U|X|0|1|Z|W|L|H|-)\'',
                contains: [hljs.BACKSLASH_ESCAPE]
            },
            {
                className: 'attribute',
                begin: '\'[A-Za-z](_?[A-Za-z0-9])*',
                contains: [hljs.BACKSLASH_ESCAPE]
            }
            ]
        };
    };
}, {}
],
169: [function(require, module, exports) {
    module.exports = function(hljs) {
        return {
            lexemes: /[!#@\w]+/,
            keywords: {
                keyword: //ex command
                // express version except: ! & * < = > !! # @ @@
                'N|0 P|0 X|0 a|0 ab abc abo al am an|0 ar arga argd arge argdo argg argl argu as au aug aun b|0 bN ba bad bd be bel bf bl bm bn bo bp br brea breaka breakd breakl bro bufdo buffers bun bw c|0 cN cNf ca cabc caddb cad caddf cal cat cb cc ccl cd ce cex cf cfir cgetb cgete cg changes chd che checkt cl cla clo cm cmapc cme cn cnew cnf cno cnorea cnoreme co col colo com comc comp con conf cope ' +
                'cp cpf cq cr cs cst cu cuna cunme cw d|0 delm deb debugg delc delf dif diffg diffo diffp diffpu diffs diffthis dig di dl dell dj dli do doautoa dp dr ds dsp e|0 ea ec echoe echoh echom echon el elsei em en endfo endf endt endw ene ex exe exi exu f|0 files filet fin fina fini fir fix fo foldc foldd folddoc foldo for fu g|0 go gr grepa gu gv ha h|0 helpf helpg helpt hi hid his i|0 ia iabc if ij il im imapc ' +
                'ime ino inorea inoreme int is isp iu iuna iunme j|0 ju k|0 keepa kee keepj lN lNf l|0 lad laddb laddf la lan lat lb lc lch lcl lcs le lefta let lex lf lfir lgetb lgete lg lgr lgrepa lh ll lla lli lmak lm lmapc lne lnew lnf ln loadk lo loc lockv lol lope lp lpf lr ls lt lu lua luad luaf lv lvimgrepa lw m|0 ma mak map mapc marks mat me menut mes mk mks mksp mkv mkvie mod mz mzf nbc nb nbs n|0 new nm nmapc nme nn nnoreme noa no noh norea noreme norm nu nun nunme ol o|0 om omapc ome on ono onoreme opt ou ounme ow p|0 ' +
                'profd prof pro promptr pc ped pe perld po popu pp pre prev ps pt ptN ptf ptj ptl ptn ptp ptr pts pu pw py3 python3 py3d py3f py pyd pyf q|0 quita qa r|0 rec red redi redr redraws reg res ret retu rew ri rightb rub rubyd rubyf rund ru rv s|0 sN san sa sal sav sb sbN sba sbf sbl sbm sbn sbp sbr scrip scripte scs se setf setg setl sf sfir sh sim sig sil sl sla sm smap smapc sme sn sni sno snor snoreme sor ' +
                'so spelld spe spelli spellr spellu spellw sp spr sre st sta startg startr star stopi stj sts sun sunm sunme sus sv sw sy synti sync t|0 tN tabN tabc tabdo tabe tabf tabfir tabl tabm tabnew ' +
                'tabn tabo tabp tabr tabs tab ta tags tc tcld tclf te tf th tj tl tm tn to tp tr try ts tu u|0 undoj undol una unh unl unlo unm unme uns up v|0 ve verb vert vim vimgrepa vi viu vie vm vmapc vme vne vn vnoreme vs vu vunme windo w|0 wN wa wh wi winc winp wn wp wq wqa ws wu wv x|0 xa xmapc xm xme xn xnoreme xu xunme y|0 z|0 ~ ' +
                // full version
                'Next Print append abbreviate abclear aboveleft all amenu anoremenu args argadd argdelete argedit argglobal arglocal argument ascii autocmd augroup aunmenu buffer bNext ball badd bdelete behave belowright bfirst blast bmodified bnext botright bprevious brewind break breakadd breakdel breaklist browse bunload ' +
                'bwipeout change cNext cNfile cabbrev cabclear caddbuffer caddexpr caddfile call catch cbuffer cclose center cexpr cfile cfirst cgetbuffer cgetexpr cgetfile chdir checkpath checktime clist clast close cmap cmapclear cmenu cnext cnewer cnfile cnoremap cnoreabbrev cnoremenu copy colder colorscheme command comclear compiler continue confirm copen cprevious cpfile cquit crewind cscope cstag cunmap ' +
                'cunabbrev cunmenu cwindow delete delmarks debug debuggreedy delcommand delfunction diffupdate diffget diffoff diffpatch diffput diffsplit digraphs display deletel djump dlist doautocmd doautoall deletep drop dsearch dsplit edit earlier echo echoerr echohl echomsg else elseif emenu endif endfor ' +
                'endfunction endtry endwhile enew execute exit exusage file filetype find finally finish first fixdel fold foldclose folddoopen folddoclosed foldopen function global goto grep grepadd gui gvim hardcopy help helpfind helpgrep helptags highlight hide history insert iabbrev iabclear ijump ilist imap ' +
                'imapclear imenu inoremap inoreabbrev inoremenu intro isearch isplit iunmap iunabbrev iunmenu join jumps keepalt keepmarks keepjumps lNext lNfile list laddexpr laddbuffer laddfile last language later lbuffer lcd lchdir lclose lcscope left leftabove lexpr lfile lfirst lgetbuffer lgetexpr lgetfile lgrep lgrepadd lhelpgrep llast llist lmake lmap lmapclear lnext lnewer lnfile lnoremap loadkeymap loadview ' +
                'lockmarks lockvar lolder lopen lprevious lpfile lrewind ltag lunmap luado luafile lvimgrep lvimgrepadd lwindow move mark make mapclear match menu menutranslate messages mkexrc mksession mkspell mkvimrc mkview mode mzscheme mzfile nbclose nbkey nbsart next nmap nmapclear nmenu nnoremap ' +
                'nnoremenu noautocmd noremap nohlsearch noreabbrev noremenu normal number nunmap nunmenu oldfiles open omap omapclear omenu only onoremap onoremenu options ounmap ounmenu ownsyntax print profdel profile promptfind promptrepl pclose pedit perl perldo pop popup ppop preserve previous psearch ptag ptNext ' +
                'ptfirst ptjump ptlast ptnext ptprevious ptrewind ptselect put pwd py3do py3file python pydo pyfile quit quitall qall read recover redo redir redraw redrawstatus registers resize retab return rewind right rightbelow ruby rubydo rubyfile rundo runtime rviminfo substitute sNext sandbox sargument sall saveas sbuffer sbNext sball sbfirst sblast sbmodified sbnext sbprevious sbrewind scriptnames scriptencoding ' +
                'scscope set setfiletype setglobal setlocal sfind sfirst shell simalt sign silent sleep slast smagic smapclear smenu snext sniff snomagic snoremap snoremenu sort source spelldump spellgood spellinfo spellrepall spellundo spellwrong split sprevious srewind stop stag startgreplace startreplace ' +
                'startinsert stopinsert stjump stselect sunhide sunmap sunmenu suspend sview swapname syntax syntime syncbind tNext tabNext tabclose tabedit tabfind tabfirst tablast tabmove tabnext tabonly tabprevious tabrewind tag tcl tcldo tclfile tearoff tfirst throw tjump tlast tmenu tnext topleft tprevious ' + 'trewind tselect tunmenu undo undojoin undolist unabbreviate unhide unlet unlockvar unmap unmenu unsilent update vglobal version verbose vertical vimgrep vimgrepadd visual viusage view vmap vmapclear vmenu vnew ' +
                'vnoremap vnoremenu vsplit vunmap vunmenu write wNext wall while winsize wincmd winpos wnext wprevious wqall wsverb wundo wviminfo xit xall xmapclear xmap xmenu xnoremap xnoremenu xunmap xunmenu yank',
                built_in: //built in func
                'abs acos add and append argc argidx argv asin atan atan2 browse browsedir bufexists buflisted bufloaded bufname bufnr bufwinnr byte2line byteidx call ceil changenr char2nr cindent clearmatches col complete complete_add complete_check confirm copy cos cosh count cscope_connection cursor ' +
                'deepcopy delete did_filetype diff_filler diff_hlID empty escape eval eventhandler executable exists exp expand extend feedkeys filereadable filewritable filter finddir findfile float2nr floor fmod fnameescape fnamemodify foldclosed foldclosedend foldlevel foldtext foldtextresult foreground function ' +
                'garbagecollect get getbufline getbufvar getchar getcharmod getcmdline getcmdpos getcmdtype getcwd getfontname getfperm getfsize getftime getftype getline getloclist getmatches getpid getpos getqflist getreg getregtype gettabvar gettabwinvar getwinposx getwinposy getwinvar glob globpath has has_key ' +
                'haslocaldir hasmapto histadd histdel histget histnr hlexists hlID hostname iconv indent index input inputdialog inputlist inputrestore inputsave inputsecret insert invert isdirectory islocked items join keys len libcall libcallnr line line2byte lispindent localtime log log10 luaeval map maparg mapcheck ' +
                'match matchadd matcharg matchdelete matchend matchlist matchstr max min mkdir mode mzeval nextnonblank nr2char or pathshorten pow prevnonblank printf pumvisible py3eval pyeval range readfile reltime reltimestr remote_expr remote_foreground remote_peek remote_read remote_send remove rename repeat ' +
                'resolve reverse round screenattr screenchar screencol screenrow search searchdecl searchpair searchpairpos searchpos server2client serverlist setbufvar setcmdpos setline setloclist setmatches setpos setqflist setreg settabvar settabwinvar setwinvar sha256 shellescape shiftwidth simplify sin ' +
                'sinh sort soundfold spellbadword spellsuggest split sqrt str2float str2nr strchars strdisplaywidth strftime stridx string strlen strpart strridx strtrans strwidth submatch substitute synconcealed synID synIDattr ' +
                'synIDtrans synstack system tabpagebuflist tabpagenr tabpagewinnr tagfiles taglist tan tanh tempname tolower toupper tr trunc type undofile undotree values virtcol visualmode wildmenumode winbufnr wincol winheight winline winnr winrestcmd winrestview winsaveview winwidth writefile xor'
            },
            illegal: /[{:]/,
            contains: [
            hljs.NUMBER_MODE,
            hljs.APOS_STRING_MODE,
            {
                className: 'string',
                // quote with escape, comment as quote
                begin: /"((\\")|[^"\n])*("|\n)/
            },
            {
                className: 'variable',
                begin: /[bwtglsav]:[\w\d_]*/
            },
            {
                className: 'function',
                beginKeywords: 'function function!',
                end: '$',
                relevance: 0,
                contains: [
                hljs.TITLE_MODE,
                {
                    className: 'params',
                    begin: '\\(',
                    end: '\\)'
                }
                ]
            }
            ]
        };
    };
}, {}
],
170: [function(require, module, exports) {
    module.exports = function(hljs) {
        return {
            case_insensitive: true,
            lexemes: '\\.?' + hljs.IDENT_RE,
            keywords: {
                keyword:
                'lock rep repe repz repne repnz xaquire xrelease bnd nobnd ' +
                'aaa aad aam aas adc add and arpl bb0_reset bb1_reset bound bsf bsr bswap bt btc btr bts call cbw cdq cdqe clc cld cli clts cmc cmp cmpsb cmpsd cmpsq cmpsw cmpxchg cmpxchg486 cmpxchg8b cmpxchg16b cpuid cpu_read cpu_write cqo cwd cwde daa das dec div dmint emms enter equ f2xm1 fabs fadd faddp fbld fbstp fchs fclex fcmovb fcmovbe fcmove fcmovnb fcmovnbe fcmovne fcmovnu fcmovu fcom fcomi fcomip fcomp fcompp fcos fdecstp fdisi fdiv fdivp fdivr fdivrp femms feni ffree ffreep fiadd ficom ficomp fidiv fidivr fild fimul fincstp finit fist fistp fisttp fisub fisubr fld fld1 fldcw fldenv fldl2e fldl2t fldlg2 fldln2 fldpi fldz fmul fmulp fnclex fndisi fneni fninit fnop fnsave fnstcw fnstenv fnstsw fpatan fprem fprem1 fptan frndint frstor fsave fscale fsetpm fsin fsincos fsqrt fst fstcw fstenv fstp fstsw fsub fsubp fsubr fsubrp ftst fucom fucomi fucomip fucomp fucompp fxam fxch fxtract fyl2x fyl2xp1 hlt ibts icebp idiv imul in inc incbin insb insd insw int int01 int1 int03 int3 into invd invpcid invlpg invlpga iret iretd iretq iretw jcxz jecxz jrcxz jmp jmpe lahf lar lds lea leave les lfence lfs lgdt lgs lidt lldt lmsw loadall loadall286 lodsb lodsd lodsq lodsw loop loope loopne loopnz loopz lsl lss ltr mfence monitor mov movd movq movsb movsd movsq movsw movsx movsxd movzx mul mwait neg nop not or out outsb outsd outsw packssdw packsswb packuswb paddb paddd paddsb paddsiw paddsw paddusb paddusw paddw pand pandn pause paveb pavgusb pcmpeqb pcmpeqd pcmpeqw pcmpgtb pcmpgtd pcmpgtw pdistib pf2id pfacc pfadd pfcmpeq pfcmpge pfcmpgt pfmax pfmin pfmul pfrcp pfrcpit1 pfrcpit2 pfrsqit1 pfrsqrt pfsub pfsubr pi2fd pmachriw pmaddwd pmagw pmulhriw pmulhrwa pmulhrwc pmulhw pmullw pmvgezb pmvlzb pmvnzb pmvzb pop popa popad popaw popf popfd popfq popfw por prefetch prefetchw pslld psllq psllw psrad psraw psrld psrlq psrlw psubb psubd psubsb psubsiw psubsw psubusb psubusw psubw punpckhbw punpckhdq punpckhwd punpcklbw punpckldq punpcklwd push pusha pushad pushaw pushf pushfd pushfq pushfw pxor rcl rcr rdshr rdmsr rdpmc rdtsc rdtscp ret retf retn rol ror rdm rsdc rsldt rsm rsts sahf sal salc sar sbb scasb scasd scasq scasw sfence sgdt shl shld shr shrd sidt sldt skinit smi smint smintold smsw stc std sti stosb stosd stosq stosw str sub svdc svldt svts swapgs syscall sysenter sysexit sysret test ud0 ud1 ud2b ud2 ud2a umov verr verw fwait wbinvd wrshr wrmsr xadd xbts xchg xlatb xlat xor cmove cmovz cmovne cmovnz cmova cmovnbe cmovae cmovnb cmovb cmovnae cmovbe cmovna cmovg cmovnle cmovge cmovnl cmovl cmovnge cmovle cmovng cmovc cmovnc cmovo cmovno cmovs cmovns cmovp cmovpe cmovnp cmovpo je jz jne jnz ja jnbe jae jnb jb jnae jbe jna jg jnle jge jnl jl jnge jle jng jc jnc jo jno js jns jpo jnp jpe jp sete setz setne setnz seta setnbe setae setnb setnc setb setnae setcset setbe setna setg setnle setge setnl setl setnge setle setng sets setns seto setno setpe setp setpo setnp addps addss andnps andps cmpeqps cmpeqss cmpleps cmpless cmpltps cmpltss cmpneqps cmpneqss cmpnleps cmpnless cmpnltps cmpnltss cmpordps cmpordss cmpunordps cmpunordss cmpps cmpss comiss cvtpi2ps cvtps2pi cvtsi2ss cvtss2si cvttps2pi cvttss2si divps divss ldmxcsr maxps maxss minps minss movaps movhps movlhps movlps movhlps movmskps movntps movss movups mulps mulss orps rcpps rcpss rsqrtps rsqrtss shufps sqrtps sqrtss stmxcsr subps subss ucomiss unpckhps unpcklps xorps fxrstor fxrstor64 fxsave fxsave64 xgetbv xsetbv xsave xsave64 xsaveopt xsaveopt64 xrstor xrstor64 prefetchnta prefetcht0 prefetcht1 prefetcht2 maskmovq movntq pavgb pavgw pextrw pinsrw pmaxsw pmaxub pminsw pminub pmovmskb pmulhuw psadbw pshufw pf2iw pfnacc pfpnacc pi2fw pswapd maskmovdqu clflush movntdq movnti movntpd movdqa movdqu movdq2q movq2dq paddq pmuludq pshufd pshufhw pshuflw pslldq psrldq psubq punpckhqdq punpcklqdq addpd addsd andnpd andpd cmpeqpd cmpeqsd cmplepd cmplesd cmpltpd cmpltsd cmpneqpd cmpneqsd cmpnlepd cmpnlesd cmpnltpd cmpnltsd cmpordpd cmpordsd cmpunordpd cmpunordsd cmppd comisd cvtdq2pd cvtdq2ps cvtpd2dq cvtpd2pi cvtpd2ps cvtpi2pd cvtps2dq cvtps2pd cvtsd2si cvtsd2ss cvtsi2sd cvtss2sd cvttpd2pi cvttpd2dq cvttps2dq cvttsd2si divpd divsd maxpd maxsd minpd minsd movapd movhpd movlpd movmskpd movupd mulpd mulsd orpd shufpd sqrtpd sqrtsd subpd subsd ucomisd unpckhpd unpcklpd xorpd addsubpd addsubps haddpd haddps hsubpd hsubps lddqu movddup movshdup movsldup clgi stgi vmcall vmclear vmfunc vmlaunch vmload vmmcall vmptrld vmptrst vmread vmresume vmrun vmsave vmwrite vmxoff vmxon invept invvpid pabsb pabsw pabsd palignr phaddw phaddd phaddsw phsubw phsubd phsubsw pmaddubsw pmulhrsw pshufb psignb psignw psignd extrq insertq movntsd movntss lzcnt blendpd blendps blendvpd blendvps dppd dpps extractps insertps movntdqa mpsadbw packusdw pblendvb pblendw pcmpeqq pextrb pextrd pextrq phminposuw pinsrb pinsrd pinsrq pmaxsb pmaxsd pmaxud pmaxuw pminsb pminsd pminud pminuw pmovsxbw pmovsxbd pmovsxbq pmovsxwd pmovsxwq pmovsxdq pmovzxbw pmovzxbd pmovzxbq pmovzxwd pmovzxwq pmovzxdq pmuldq pmulld ptest roundpd roundps roundsd roundss crc32 pcmpestri pcmpestrm pcmpistri pcmpistrm pcmpgtq popcnt getsec pfrcpv pfrsqrtv movbe aesenc aesenclast aesdec aesdeclast aesimc aeskeygenassist vaesenc vaesenclast vaesdec vaesdeclast vaesimc vaeskeygenassist vaddpd vaddps vaddsd vaddss vaddsubpd vaddsubps vandpd vandps vandnpd vandnps vblendpd vblendps vblendvpd vblendvps vbroadcastss vbroadcastsd vbroadcastf128 vcmpeq_ospd vcmpeqpd vcmplt_ospd vcmpltpd vcmple_ospd vcmplepd vcmpunord_qpd vcmpunordpd vcmpneq_uqpd vcmpneqpd vcmpnlt_uspd vcmpnltpd vcmpnle_uspd vcmpnlepd vcmpord_qpd vcmpordpd vcmpeq_uqpd vcmpnge_uspd vcmpngepd vcmpngt_uspd vcmpngtpd vcmpfalse_oqpd vcmpfalsepd vcmpneq_oqpd vcmpge_ospd vcmpgepd vcmpgt_ospd vcmpgtpd vcmptrue_uqpd vcmptruepd vcmplt_oqpd vcmple_oqpd vcmpunord_spd vcmpneq_uspd vcmpnlt_uqpd vcmpnle_uqpd vcmpord_spd vcmpeq_uspd vcmpnge_uqpd vcmpngt_uqpd vcmpfalse_ospd vcmpneq_ospd vcmpge_oqpd vcmpgt_oqpd vcmptrue_uspd vcmppd vcmpeq_osps vcmpeqps vcmplt_osps vcmpltps vcmple_osps vcmpleps vcmpunord_qps vcmpunordps vcmpneq_uqps vcmpneqps vcmpnlt_usps vcmpnltps vcmpnle_usps vcmpnleps vcmpord_qps vcmpordps vcmpeq_uqps vcmpnge_usps vcmpngeps vcmpngt_usps vcmpngtps vcmpfalse_oqps vcmpfalseps vcmpneq_oqps vcmpge_osps vcmpgeps vcmpgt_osps vcmpgtps vcmptrue_uqps vcmptrueps vcmplt_oqps vcmple_oqps vcmpunord_sps vcmpneq_usps vcmpnlt_uqps vcmpnle_uqps vcmpord_sps vcmpeq_usps vcmpnge_uqps vcmpngt_uqps vcmpfalse_osps vcmpneq_osps vcmpge_oqps vcmpgt_oqps vcmptrue_usps vcmpps vcmpeq_ossd vcmpeqsd vcmplt_ossd vcmpltsd vcmple_ossd vcmplesd vcmpunord_qsd vcmpunordsd vcmpneq_uqsd vcmpneqsd vcmpnlt_ussd vcmpnltsd vcmpnle_ussd vcmpnlesd vcmpord_qsd vcmpordsd vcmpeq_uqsd vcmpnge_ussd vcmpngesd vcmpngt_ussd vcmpngtsd vcmpfalse_oqsd vcmpfalsesd vcmpneq_oqsd vcmpge_ossd vcmpgesd vcmpgt_ossd vcmpgtsd vcmptrue_uqsd vcmptruesd vcmplt_oqsd vcmple_oqsd vcmpunord_ssd vcmpneq_ussd vcmpnlt_uqsd vcmpnle_uqsd vcmpord_ssd vcmpeq_ussd vcmpnge_uqsd vcmpngt_uqsd vcmpfalse_ossd vcmpneq_ossd vcmpge_oqsd vcmpgt_oqsd vcmptrue_ussd vcmpsd vcmpeq_osss vcmpeqss vcmplt_osss vcmpltss vcmple_osss vcmpless vcmpunord_qss vcmpunordss vcmpneq_uqss vcmpneqss vcmpnlt_usss vcmpnltss vcmpnle_usss vcmpnless vcmpord_qss vcmpordss vcmpeq_uqss vcmpnge_usss vcmpngess vcmpngt_usss vcmpngtss vcmpfalse_oqss vcmpfalsess vcmpneq_oqss vcmpge_osss vcmpgess vcmpgt_osss vcmpgtss vcmptrue_uqss vcmptruess vcmplt_oqss vcmple_oqss vcmpunord_sss vcmpneq_usss vcmpnlt_uqss vcmpnle_uqss vcmpord_sss vcmpeq_usss vcmpnge_uqss vcmpngt_uqss vcmpfalse_osss vcmpneq_osss vcmpge_oqss vcmpgt_oqss vcmptrue_usss vcmpss vcomisd vcomiss vcvtdq2pd vcvtdq2ps vcvtpd2dq vcvtpd2ps vcvtps2dq vcvtps2pd vcvtsd2si vcvtsd2ss vcvtsi2sd vcvtsi2ss vcvtss2sd vcvtss2si vcvttpd2dq vcvttps2dq vcvttsd2si vcvttss2si vdivpd vdivps vdivsd vdivss vdppd vdpps vextractf128 vextractps vhaddpd vhaddps vhsubpd vhsubps vinsertf128 vinsertps vlddqu vldqqu vldmxcsr vmaskmovdqu vmaskmovps vmaskmovpd vmaxpd vmaxps vmaxsd vmaxss vminpd vminps vminsd vminss vmovapd vmovaps vmovd vmovq vmovddup vmovdqa vmovqqa vmovdqu vmovqqu vmovhlps vmovhpd vmovhps vmovlhps vmovlpd vmovlps vmovmskpd vmovmskps vmovntdq vmovntqq vmovntdqa vmovntpd vmovntps vmovsd vmovshdup vmovsldup vmovss vmovupd vmovups vmpsadbw vmulpd vmulps vmulsd vmulss vorpd vorps vpabsb vpabsw vpabsd vpacksswb vpackssdw vpackuswb vpackusdw vpaddb vpaddw vpaddd vpaddq vpaddsb vpaddsw vpaddusb vpaddusw vpalignr vpand vpandn vpavgb vpavgw vpblendvb vpblendw vpcmpestri vpcmpestrm vpcmpistri vpcmpistrm vpcmpeqb vpcmpeqw vpcmpeqd vpcmpeqq vpcmpgtb vpcmpgtw vpcmpgtd vpcmpgtq vpermilpd vpermilps vperm2f128 vpextrb vpextrw vpextrd vpextrq vphaddw vphaddd vphaddsw vphminposuw vphsubw vphsubd vphsubsw vpinsrb vpinsrw vpinsrd vpinsrq vpmaddwd vpmaddubsw vpmaxsb vpmaxsw vpmaxsd vpmaxub vpmaxuw vpmaxud vpminsb vpminsw vpminsd vpminub vpminuw vpminud vpmovmskb vpmovsxbw vpmovsxbd vpmovsxbq vpmovsxwd vpmovsxwq vpmovsxdq vpmovzxbw vpmovzxbd vpmovzxbq vpmovzxwd vpmovzxwq vpmovzxdq vpmulhuw vpmulhrsw vpmulhw vpmullw vpmulld vpmuludq vpmuldq vpor vpsadbw vpshufb vpshufd vpshufhw vpshuflw vpsignb vpsignw vpsignd vpslldq vpsrldq vpsllw vpslld vpsllq vpsraw vpsrad vpsrlw vpsrld vpsrlq vptest vpsubb vpsubw vpsubd vpsubq vpsubsb vpsubsw vpsubusb vpsubusw vpunpckhbw vpunpckhwd vpunpckhdq vpunpckhqdq vpunpcklbw vpunpcklwd vpunpckldq vpunpcklqdq vpxor vrcpps vrcpss vrsqrtps vrsqrtss vroundpd vroundps vroundsd vroundss vshufpd vshufps vsqrtpd vsqrtps vsqrtsd vsqrtss vstmxcsr vsubpd vsubps vsubsd vsubss vtestps vtestpd vucomisd vucomiss vunpckhpd vunpckhps vunpcklpd vunpcklps vxorpd vxorps vzeroall vzeroupper pclmullqlqdq pclmulhqlqdq pclmullqhqdq pclmulhqhqdq pclmulqdq vpclmullqlqdq vpclmulhqlqdq vpclmullqhqdq vpclmulhqhqdq vpclmulqdq vfmadd132ps vfmadd132pd vfmadd312ps vfmadd312pd vfmadd213ps vfmadd213pd vfmadd123ps vfmadd123pd vfmadd231ps vfmadd231pd vfmadd321ps vfmadd321pd vfmaddsub132ps vfmaddsub132pd vfmaddsub312ps vfmaddsub312pd vfmaddsub213ps vfmaddsub213pd vfmaddsub123ps vfmaddsub123pd vfmaddsub231ps vfmaddsub231pd vfmaddsub321ps vfmaddsub321pd vfmsub132ps vfmsub132pd vfmsub312ps vfmsub312pd vfmsub213ps vfmsub213pd vfmsub123ps vfmsub123pd vfmsub231ps vfmsub231pd vfmsub321ps vfmsub321pd vfmsubadd132ps vfmsubadd132pd vfmsubadd312ps vfmsubadd312pd vfmsubadd213ps vfmsubadd213pd vfmsubadd123ps vfmsubadd123pd vfmsubadd231ps vfmsubadd231pd vfmsubadd321ps vfmsubadd321pd vfnmadd132ps vfnmadd132pd vfnmadd312ps vfnmadd312pd vfnmadd213ps vfnmadd213pd vfnmadd123ps vfnmadd123pd vfnmadd231ps vfnmadd231pd vfnmadd321ps vfnmadd321pd vfnmsub132ps vfnmsub132pd vfnmsub312ps vfnmsub312pd vfnmsub213ps vfnmsub213pd vfnmsub123ps vfnmsub123pd vfnmsub231ps vfnmsub231pd vfnmsub321ps vfnmsub321pd vfmadd132ss vfmadd132sd vfmadd312ss vfmadd312sd vfmadd213ss vfmadd213sd vfmadd123ss vfmadd123sd vfmadd231ss vfmadd231sd vfmadd321ss vfmadd321sd vfmsub132ss vfmsub132sd vfmsub312ss vfmsub312sd vfmsub213ss vfmsub213sd vfmsub123ss vfmsub123sd vfmsub231ss vfmsub231sd vfmsub321ss vfmsub321sd vfnmadd132ss vfnmadd132sd vfnmadd312ss vfnmadd312sd vfnmadd213ss vfnmadd213sd vfnmadd123ss vfnmadd123sd vfnmadd231ss vfnmadd231sd vfnmadd321ss vfnmadd321sd vfnmsub132ss vfnmsub132sd vfnmsub312ss vfnmsub312sd vfnmsub213ss vfnmsub213sd vfnmsub123ss vfnmsub123sd vfnmsub231ss vfnmsub231sd vfnmsub321ss vfnmsub321sd rdfsbase rdgsbase rdrand wrfsbase wrgsbase vcvtph2ps vcvtps2ph adcx adox rdseed clac stac xstore xcryptecb xcryptcbc xcryptctr xcryptcfb xcryptofb montmul xsha1 xsha256 llwpcb slwpcb lwpval lwpins vfmaddpd vfmaddps vfmaddsd vfmaddss vfmaddsubpd vfmaddsubps vfmsubaddpd vfmsubaddps vfmsubpd vfmsubps vfmsubsd vfmsubss vfnmaddpd vfnmaddps vfnmaddsd vfnmaddss vfnmsubpd vfnmsubps vfnmsubsd vfnmsubss vfrczpd vfrczps vfrczsd vfrczss vpcmov vpcomb vpcomd vpcomq vpcomub vpcomud vpcomuq vpcomuw vpcomw vphaddbd vphaddbq vphaddbw vphadddq vphaddubd vphaddubq vphaddubw vphaddudq vphadduwd vphadduwq vphaddwd vphaddwq vphsubbw vphsubdq vphsubwd vpmacsdd vpmacsdqh vpmacsdql vpmacssdd vpmacssdqh vpmacssdql vpmacsswd vpmacssww vpmacswd vpmacsww vpmadcsswd vpmadcswd vpperm vprotb vprotd vprotq vprotw vpshab vpshad vpshaq vpshaw vpshlb vpshld vpshlq vpshlw vbroadcasti128 vpblendd vpbroadcastb vpbroadcastw vpbroadcastd vpbroadcastq vpermd vpermpd vpermps vpermq vperm2i128 vextracti128 vinserti128 vpmaskmovd vpmaskmovq vpsllvd vpsllvq vpsravd vpsrlvd vpsrlvq vgatherdpd vgatherqpd vgatherdps vgatherqps vpgatherdd vpgatherqd vpgatherdq vpgatherqq xabort xbegin xend xtest andn bextr blci blcic blsi blsic blcfill blsfill blcmsk blsmsk blsr blcs bzhi mulx pdep pext rorx sarx shlx shrx tzcnt tzmsk t1mskc valignd valignq vblendmpd vblendmps vbroadcastf32x4 vbroadcastf64x4 vbroadcasti32x4 vbroadcasti64x4 vcompresspd vcompressps vcvtpd2udq vcvtps2udq vcvtsd2usi vcvtss2usi vcvttpd2udq vcvttps2udq vcvttsd2usi vcvttss2usi vcvtudq2pd vcvtudq2ps vcvtusi2sd vcvtusi2ss vexpandpd vexpandps vextractf32x4 vextractf64x4 vextracti32x4 vextracti64x4 vfixupimmpd vfixupimmps vfixupimmsd vfixupimmss vgetexppd vgetexpps vgetexpsd vgetexpss vgetmantpd vgetmantps vgetmantsd vgetmantss vinsertf32x4 vinsertf64x4 vinserti32x4 vinserti64x4 vmovdqa32 vmovdqa64 vmovdqu32 vmovdqu64 vpabsq vpandd vpandnd vpandnq vpandq vpblendmd vpblendmq vpcmpltd vpcmpled vpcmpneqd vpcmpnltd vpcmpnled vpcmpd vpcmpltq vpcmpleq vpcmpneqq vpcmpnltq vpcmpnleq vpcmpq vpcmpequd vpcmpltud vpcmpleud vpcmpnequd vpcmpnltud vpcmpnleud vpcmpud vpcmpequq vpcmpltuq vpcmpleuq vpcmpnequq vpcmpnltuq vpcmpnleuq vpcmpuq vpcompressd vpcompressq vpermi2d vpermi2pd vpermi2ps vpermi2q vpermt2d vpermt2pd vpermt2ps vpermt2q vpexpandd vpexpandq vpmaxsq vpmaxuq vpminsq vpminuq vpmovdb vpmovdw vpmovqb vpmovqd vpmovqw vpmovsdb vpmovsdw vpmovsqb vpmovsqd vpmovsqw vpmovusdb vpmovusdw vpmovusqb vpmovusqd vpmovusqw vpord vporq vprold vprolq vprolvd vprolvq vprord vprorq vprorvd vprorvq vpscatterdd vpscatterdq vpscatterqd vpscatterqq vpsraq vpsravq vpternlogd vpternlogq vptestmd vptestmq vptestnmd vptestnmq vpxord vpxorq vrcp14pd vrcp14ps vrcp14sd vrcp14ss vrndscalepd vrndscaleps vrndscalesd vrndscaless vrsqrt14pd vrsqrt14ps vrsqrt14sd vrsqrt14ss vscalefpd vscalefps vscalefsd vscalefss vscatterdpd vscatterdps vscatterqpd vscatterqps vshuff32x4 vshuff64x2 vshufi32x4 vshufi64x2 kandnw kandw kmovw knotw kortestw korw kshiftlw kshiftrw kunpckbw kxnorw kxorw vpbroadcastmb2q vpbroadcastmw2d vpconflictd vpconflictq vplzcntd vplzcntq vexp2pd vexp2ps vrcp28pd vrcp28ps vrcp28sd vrcp28ss vrsqrt28pd vrsqrt28ps vrsqrt28sd vrsqrt28ss vgatherpf0dpd vgatherpf0dps vgatherpf0qpd vgatherpf0qps vgatherpf1dpd vgatherpf1dps vgatherpf1qpd vgatherpf1qps vscatterpf0dpd vscatterpf0dps vscatterpf0qpd vscatterpf0qps vscatterpf1dpd vscatterpf1dps vscatterpf1qpd vscatterpf1qps prefetchwt1 bndmk bndcl bndcu bndcn bndmov bndldx bndstx sha1rnds4 sha1nexte sha1msg1 sha1msg2 sha256rnds2 sha256msg1 sha256msg2 hint_nop0 hint_nop1 hint_nop2 hint_nop3 hint_nop4 hint_nop5 hint_nop6 hint_nop7 hint_nop8 hint_nop9 hint_nop10 hint_nop11 hint_nop12 hint_nop13 hint_nop14 hint_nop15 hint_nop16 hint_nop17 hint_nop18 hint_nop19 hint_nop20 hint_nop21 hint_nop22 hint_nop23 hint_nop24 hint_nop25 hint_nop26 hint_nop27 hint_nop28 hint_nop29 hint_nop30 hint_nop31 hint_nop32 hint_nop33 hint_nop34 hint_nop35 hint_nop36 hint_nop37 hint_nop38 hint_nop39 hint_nop40 hint_nop41 hint_nop42 hint_nop43 hint_nop44 hint_nop45 hint_nop46 hint_nop47 hint_nop48 hint_nop49 hint_nop50 hint_nop51 hint_nop52 hint_nop53 hint_nop54 hint_nop55 hint_nop56 hint_nop57 hint_nop58 hint_nop59 hint_nop60 hint_nop61 hint_nop62 hint_nop63',
                literal:
                // Instruction pointer
                'ip eip rip ' +
                // 8-bit registers
                'al ah bl bh cl ch dl dh sil dil bpl spl r8b r9b r10b r11b r12b r13b r14b r15b ' +
                // 16-bit registers
                'ax bx cx dx si di bp sp r8w r9w r10w r11w r12w r13w r14w r15w ' +
                // 32-bit registers
                'eax ebx ecx edx esi edi ebp esp eip r8d r9d r10d r11d r12d r13d r14d r15d ' +
                // 64-bit registers
                'rax rbx rcx rdx rsi rdi rbp rsp r8 r9 r10 r11 r12 r13 r14 r15 ' +
                // Segment registers
                'cs ds es fs gs ss ' +
                // Floating point stack registers
                'st st0 st1 st2 st3 st4 st5 st6 st7 ' +
                // MMX Registers
                'mm0 mm1 mm2 mm3 mm4 mm5 mm6 mm7 ' +
                // SSE registers
                'xmm0  xmm1  xmm2  xmm3  xmm4  xmm5  xmm6  xmm7  xmm8  xmm9 xmm10  xmm11 xmm12 xmm13 xmm14 xmm15 ' +
                'xmm16 xmm17 xmm18 xmm19 xmm20 xmm21 xmm22 xmm23 xmm24 xmm25 xmm26 xmm27 xmm28 xmm29 xmm30 xmm31 ' +
                // AVX registers
                'ymm0  ymm1  ymm2  ymm3  ymm4  ymm5  ymm6  ymm7  ymm8  ymm9 ymm10  ymm11 ymm12 ymm13 ymm14 ymm15 ' +
                'ymm16 ymm17 ymm18 ymm19 ymm20 ymm21 ymm22 ymm23 ymm24 ymm25 ymm26 ymm27 ymm28 ymm29 ymm30 ymm31 ' +
                // AVX-512F registers
                'zmm0  zmm1  zmm2  zmm3  zmm4  zmm5  zmm6  zmm7  zmm8  zmm9 zmm10  zmm11 zmm12 zmm13 zmm14 zmm15 ' +
                'zmm16 zmm17 zmm18 zmm19 zmm20 zmm21 zmm22 zmm23 zmm24 zmm25 zmm26 zmm27 zmm28 zmm29 zmm30 zmm31 ' +
                // AVX-512F mask registers
                'k0 k1 k2 k3 k4 k5 k6 k7 ' +
                // Bound (MPX) register
                'bnd0 bnd1 bnd2 bnd3 ' +
                // Special register
                'cr0 cr1 cr2 cr3 cr4 cr8 dr0 dr1 dr2 dr3 dr8 tr3 tr4 tr5 tr6 tr7 ' +
                // NASM altreg package
                'r0 r1 r2 r3 r4 r5 r6 r7 r0b r1b r2b r3b r4b r5b r6b r7b ' +
                'r0w r1w r2w r3w r4w r5w r6w r7w r0d r1d r2d r3d r4d r5d r6d r7d ' +
                'r0h r1h r2h r3h ' +
                'r0l r1l r2l r3l r4l r5l r6l r7l r8l r9l r10l r11l r12l r13l r14l r15l',

                pseudo:
                'db dw dd dq dt ddq do dy dz ' +
                'resb resw resd resq rest resdq reso resy resz ' +
                'incbin equ times',

                preprocessor:
                '%define %xdefine %+ %undef %defstr %deftok %assign %strcat %strlen %substr %rotate %elif %else %endif ' +
                '%ifmacro %ifctx %ifidn %ifidni %ifid %ifnum %ifstr %iftoken %ifempty %ifenv %error %warning %fatal %rep ' +
                '%endrep %include %push %pop %repl %pathsearch %depend %use %arg %stacksize %local %line %comment %endcomment ' +
                '.nolist ' +
                'byte word dword qword nosplit rel abs seg wrt strict near far a32 ptr ' +
                '__FILE__ __LINE__ __SECT__  __BITS__ __OUTPUT_FORMAT__ __DATE__ __TIME__ __DATE_NUM__ __TIME_NUM__ ' +
                '__UTC_DATE__ __UTC_TIME__ __UTC_DATE_NUM__ __UTC_TIME_NUM__  __PASS__ struc endstruc istruc at iend ' +
                'align alignb sectalign daz nodaz up down zero default option assume public ',

                built_in:
                'bits use16 use32 use64 default section segment absolute extern global common cpu float ' +
                '__utf16__ __utf16le__ __utf16be__ __utf32__ __utf32le__ __utf32be__ ' +
                '__float8__ __float16__ __float32__ __float64__ __float80m__ __float80e__ __float128l__ __float128h__ ' +
                '__Infinity__ __QNaN__ __SNaN__ Inf NaN QNaN SNaN float8 float16 float32 float64 float80m float80e ' +
                'float128l float128h __FLOAT_DAZ__ __FLOAT_ROUND__ __FLOAT__'
            },
            contains: [
            hljs.COMMENT(
            ';',
            '$',
            {
                relevance: 0
            }),
            {
                className: 'number',
                variants: [
                // Float number and x87 BCD
                {
                    begin: '\\b(?:([0-9][0-9_]*)?\\.[0-9_]*(?:[eE][+-]?[0-9_]+)?|' +
                    '(0[Xx])?[0-9][0-9_]*\\.?[0-9_]*(?:[pP](?:[+-]?[0-9_]+)?)?)\\b',
                    relevance: 0
                },
                // Hex number in $
                {
                    begin: '\\$[0-9][0-9A-Fa-f]*',
                    relevance: 0
                },
                // Number in H,D,T,Q,O,B,Y suffix
                {
                    begin: '\\b(?:[0-9A-Fa-f][0-9A-Fa-f_]*[Hh]|[0-9][0-9_]*[DdTt]?|[0-7][0-7_]*[QqOo]|[0-1][0-1_]*[BbYy])\\b'
                },
                // Number in X,D,T,Q,O,B,Y prefix
                {
                    begin: '\\b(?:0[Xx][0-9A-Fa-f_]+|0[DdTt][0-9_]+|0[QqOo][0-7_]+|0[BbYy][0-1_]+)\\b'
                }
                ]
            },
            // Double quote string
            hljs.QUOTE_STRING_MODE,
            {
                className: 'string',
                variants: [
                // Single-quoted string
                {
                    begin: '\'',
                    end: '[^\\\\]\''
                },
                // Backquoted string
                {
                    begin: '`',
                    end: '[^\\\\]`'
                },
                // Section name
                {
                    begin: '\\.[A-Za-z0-9]+'
                }
                ],
                relevance: 0
            },
            {
                className: 'label',
                variants: [
                // Global label and local label
                {
                    begin: '^\\s*[A-Za-z._?][A-Za-z0-9_$#@~.?]*(:|\\s+label)'
                },
                // Macro-local label
                {
                    begin: '^\\s*%%[A-Za-z0-9_$#@~.?]*:'
                }
                ],
                relevance: 0
            },
            // Macro parameter
            {
                className: 'argument',
                begin: '%[0-9]+',
                relevance: 0
            },
            // Macro parameter
            {
                className: 'built_in',
                begin: '%!\S+',
                relevance: 0
            }
            ]
        };
    };
}, {}
],
171: [function(require, module, exports) {
    module.exports = function(hljs) {
        var BUILTIN_MODULES =
        'ObjectLoader Animate MovieCredits Slides Filters Shading Materials LensFlare Mapping VLCAudioVideo ' +
        'StereoDecoder PointCloud NetworkAccess RemoteControl RegExp ChromaKey Snowfall NodeJS Speech Charts';

        var XL_KEYWORDS = {
            keyword: 'if then else do while until for loop import with is as where when by data constant',
            literal: 'true false nil',
            type: 'integer real text name boolean symbol infix prefix postfix block tree',
            built_in: 'in mod rem and or xor not abs sign floor ceil sqrt sin cos tan asin acos atan exp expm1 log log2 log10 log1p pi at',
            module: BUILTIN_MODULES,
            id:
            'text_length text_range text_find text_replace contains page slide basic_slide title_slide title subtitle ' +
            'fade_in fade_out fade_at clear_color color line_color line_width texture_wrap texture_transform texture ' +
            'scale_?x scale_?y scale_?z? translate_?x translate_?y translate_?z? rotate_?x rotate_?y rotate_?z? rectangle ' +
            'circle ellipse sphere path line_to move_to quad_to curve_to theme background contents locally time mouse_?x ' +
            'mouse_?y mouse_buttons'
        };

        var XL_CONSTANT = {
            className: 'constant',
            begin: '[A-Z][A-Z_0-9]+',
            relevance: 0
        };
        var XL_VARIABLE = {
            className: 'variable',
            begin: '([A-Z][a-z_0-9]+)+',
            relevance: 0
        };
        var XL_ID = {
            className: 'id',
            begin: '[a-z][a-z_0-9]+',
            relevance: 0
        };

        var DOUBLE_QUOTE_TEXT = {
            className: 'string',
            begin: '"',
            end: '"',
            illegal: '\\n'
        };
        var SINGLE_QUOTE_TEXT = {
            className: 'string',
            begin: '\'',
            end: '\'',
            illegal: '\\n'
        };
        var LONG_TEXT = {
            className: 'string',
            begin: '<<',
            end: '>>'
        };
        var BASED_NUMBER = {
            className: 'number',
            begin: '[0-9]+#[0-9A-Z_]+(\\.[0-9-A-Z_]+)?#?([Ee][+-]?[0-9]+)?',
            relevance: 10
        };
        var IMPORT = {
            className: 'import',
            beginKeywords: 'import',
            end: '$',
            keywords: {
                keyword: 'import',
                module: BUILTIN_MODULES
            },
            relevance: 0,
            contains: [DOUBLE_QUOTE_TEXT]
        };
        var FUNCTION_DEFINITION = {
            className: 'function',
            begin: '[a-z].*->'
        };
        return {
            aliases: ['tao'],
            lexemes: /[a-zA-Z][a-zA-Z0-9_?]*/,
            keywords: XL_KEYWORDS,
            contains: [
            hljs.C_LINE_COMMENT_MODE,
            hljs.C_BLOCK_COMMENT_MODE,
            DOUBLE_QUOTE_TEXT,
            SINGLE_QUOTE_TEXT,
            LONG_TEXT,
            FUNCTION_DEFINITION,
            IMPORT,
            XL_CONSTANT,
            XL_VARIABLE,
            XL_ID,
            BASED_NUMBER,
            hljs.NUMBER_MODE
            ]
        };
    };
}, {}
],
172: [function(require, module, exports) {
    module.exports = function(hljs) {
        var XML_IDENT_RE = '[A-Za-z0-9\\._:-]+';
        var PHP = {
            begin: /<\?(php)?(?!\w)/,
            end: /\?>/,
            subLanguage: 'php'
        };
        var TAG_INTERNALS = {
            endsWithParent: true,
            illegal: /</,
            relevance: 0,
            contains: [
            PHP,
            {
                className: 'attribute',
                begin: XML_IDENT_RE,
                relevance: 0
            },
            {
                begin: '=',
                relevance: 0,
                contains: [
                {
                    className: 'value',
                    contains: [PHP],
                    variants: [
                    {
                        begin: /"/,
                        end: /"/
                    },
                    {
                        begin: /'/,
                        end: /'/
                    },
                    {
                        begin: /[^\s\/>]+/
                    }
                    ]
                }
                ]
            }
            ]
        };
        return {
            aliases: ['html', 'xhtml', 'rss', 'atom', 'xsl', 'plist'],
            case_insensitive: true,
            contains: [
            {
                className: 'doctype',
                begin: '<!DOCTYPE',
                end: '>',
                relevance: 10,
                contains: [{
                    begin: '\\[',
                    end: '\\]'
                }
                ]
            },
            hljs.COMMENT(
            '<!--',
            '-->',
            {
                relevance: 10
            }),
            {
                className: 'cdata',
                begin: '<\\!\\[CDATA\\[',
                end: '\\]\\]>',
                relevance: 10
            },
            {
                className: 'tag',
                /*
                        The lookahead pattern (?=...) ensures that 'begin' only matches
                        '<style' as a single word, followed by a whitespace or an
                        ending braket. The '$' is needed for the lexeme to be recognized
                        by hljs.subMode() that tests lexemes outside the stream.
                        */
                begin: '<style(?=\\s|>|$)',
                end: '>',
                keywords: {
                    title: 'style'
                },
                contains: [TAG_INTERNALS],
                starts: {
                    end: '</style>',
                    returnEnd: true,
                    subLanguage: 'css'
                }
            },
            {
                className: 'tag',
                // See the comment in the <style tag about the lookahead pattern
                begin: '<script(?=\\s|>|$)',
                end: '>',
                keywords: {
                    title: 'script'
                },
                contains: [TAG_INTERNALS],
                starts: {
                    end: '\<\/script\>',
                    returnEnd: true,
                    subLanguage: ['actionscript', 'javascript', 'handlebars']
                }
            },
            PHP,
            {
                className: 'pi',
                begin: /<\?\w+/,
                end: /\?>/,
                relevance: 10
            },
            {
                className: 'tag',
                begin: '</?',
                end: '/?>',
                contains: [
                {
                    className: 'title',
                    begin: /[^ \/><\n\t]+/,
                    relevance: 0
                },
                TAG_INTERNALS
                ]
            }
            ]
        };
    };
}, {}
],
173: [function(require, module, exports) {
    module.exports = function(hljs) {
        var KEYWORDS = 'for let if while then else return where group by xquery encoding version' +
        'module namespace boundary-space preserve strip default collation base-uri ordering' +
        'copy-namespaces order declare import schema namespace function option in allowing empty' +
        'at tumbling window sliding window start when only end when previous next stable ascending' +
        'descending empty greatest least some every satisfies switch case typeswitch try catch and' +
        'or to union intersect instance of treat as castable cast map array delete insert into' +
        'replace value rename copy modify update';
        var LITERAL = 'false true xs:string xs:integer element item xs:date xs:datetime xs:float xs:double xs:decimal QName xs:anyURI xs:long xs:int xs:short xs:byte attribute';
        var VAR = {
            className: 'variable',
            begin: /\$[a-zA-Z0-9\-]+/,
            relevance: 5
        };

        var NUMBER = {
            className: 'number',
            begin: '(\\b0[0-7_]+)|(\\b0x[0-9a-fA-F_]+)|(\\b[1-9][0-9_]*(\\.[0-9_]+)?)|[0_]\\b',
            relevance: 0
        };

        var STRING = {
            className: 'string',
            variants: [
            {
                begin: /"/,
                end: /"/,
                contains: [{
                    begin: /""/,
                    relevance: 0
                }
                ]
            },
            {
                begin: /'/,
                end: /'/,
                contains: [{
                    begin: /''/,
                    relevance: 0
                }
                ]
            }
            ]
        };

        var ANNOTATION = {
            className: 'decorator',
            begin: '%\\w+'
        };

        var COMMENT = {
            className: 'comment',
            begin: '\\(:',
            end: ':\\)',
            relevance: 10,
            contains: [
            {
                className: 'doc',
                begin: '@\\w+'
            }
            ]
        };

        var METHOD = {
            begin: '{',
            end: '}'
        };

        var CONTAINS = [
        VAR,
        STRING,
        NUMBER,
        COMMENT,
        ANNOTATION,
        METHOD
        ];
        METHOD.contains = CONTAINS;


        return {
            aliases: ['xpath', 'xq'],
            case_insensitive: false,
            lexemes: /[a-zA-Z\$][a-zA-Z0-9_:\-]*/,
            illegal: /(proc)|(abstract)|(extends)|(until)|(#)/,
            keywords: {
                keyword: KEYWORDS,
                literal: LITERAL
            },
            contains: CONTAINS
        };
    };
}, {}
],
174: [function(require, module, exports) {
    module.exports = function(hljs) {
        var STRING = {
            className: 'string',
            contains: [hljs.BACKSLASH_ESCAPE],
            variants: [
            {
                begin: 'b"',
                end: '"'
            },
            {
                begin: 'b\'',
                end: '\''
            },
            hljs.inherit(hljs.APOS_STRING_MODE, {
                illegal: null
            }),
            hljs.inherit(hljs.QUOTE_STRING_MODE, {
                illegal: null
            })
            ]
        };
        var NUMBER = {
            variants: [hljs.BINARY_NUMBER_MODE, hljs.C_NUMBER_MODE]
        };
        return {
            aliases: ['zep'],
            case_insensitive: true,
            keywords:
            'and include_once list abstract global private echo interface as static endswitch ' +
            'array null if endwhile or const for endforeach self var let while isset public ' +
            'protected exit foreach throw elseif include __FILE__ empty require_once do xor ' +
            'return parent clone use __CLASS__ __LINE__ else break print eval new ' +
            'catch __METHOD__ case exception default die require __FUNCTION__ ' +
            'enddeclare final try switch continue endfor endif declare unset true false ' +
            'trait goto instanceof insteadof __DIR__ __NAMESPACE__ ' +
            'yield finally int uint long ulong char uchar double float bool boolean string' +
            'likely unlikely',
            contains: [
            hljs.C_LINE_COMMENT_MODE,
            hljs.HASH_COMMENT_MODE,
            hljs.COMMENT(
            '/\\*',
            '\\*/',
            {
                contains: [
                {
                    className: 'doctag',
                    begin: '@[A-Za-z]+'
                }
                ]
            }),
            hljs.COMMENT(
            '__halt_compiler.+?;',
            false,
            {
                endsWithParent: true,
                keywords: '__halt_compiler',
                lexemes: hljs.UNDERSCORE_IDENT_RE
            }),
            {
                className: 'string',
                begin: '<<<[\'"]?\\w+[\'"]?$',
                end: '^\\w+;',
                contains: [hljs.BACKSLASH_ESCAPE]
            },
            {
                // swallow composed identifiers to avoid parsing them as keywords
                begin: /(::|->)+[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*/
            },
            {
                className: 'function',
                beginKeywords: 'function',
                end: /[;{]/,
                excludeEnd: true,
                illegal: '\\$|\\[|%',
                contains: [
                hljs.UNDERSCORE_TITLE_MODE,
                {
                    className: 'params',
                    begin: '\\(',
                    end: '\\)',
                    contains: [
                    'self',
                    hljs.C_BLOCK_COMMENT_MODE,
                    STRING,
                    NUMBER
                    ]
                }
                ]
            },
            {
                className: 'class',
                beginKeywords: 'class interface',
                end: '{',
                excludeEnd: true,
                illegal: /[:\(\$"]/,
                contains: [
                {
                    beginKeywords: 'extends implements'
                },
                hljs.UNDERSCORE_TITLE_MODE
                ]
            },
            {
                beginKeywords: 'namespace',
                end: ';',
                illegal: /[\.']/,
                contains: [hljs.UNDERSCORE_TITLE_MODE]
            },
            {
                beginKeywords: 'use',
                end: ';',
                contains: [hljs.UNDERSCORE_TITLE_MODE]
            },
            {
                begin: '=>' // No markup, just a relevance booster
            },
            STRING,
            NUMBER
            ]
        };
    };
}, {}
]
}, {}, [1]);


