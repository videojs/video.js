(function() {var e = void 0, g = !0, h = null, j = !1;
function l(a) {
  return function() {
    return this[a]
  }
}
function q(a) {
  return function() {
    return a
  }
}
var r, t = this;
t.Wc = g;
function u(a, b) {
  var c = a.split("."), d = t;
  !(c[0] in d) && d.execScript && d.execScript("var " + c[0]);
  for(var f;c.length && (f = c.shift());) {
    !c.length && b !== e ? d[f] = b : d = d[f] ? d[f] : d[f] = {}
  }
}
function v(a, b) {
  function c() {
  }
  c.prototype = b.prototype;
  a.i = b.prototype;
  a.prototype = new c;
  a.prototype.constructor = a
}
;document.createElement("video");
document.createElement("audio");
var w = vjs = function(a, b, c) {
  if("string" === typeof a) {
    0 === a.indexOf("#") && (a = a.slice(1));
    if(vjs.$[a]) {
      return vjs.$[a]
    }
    a = vjs.g(a)
  }
  if(!a || !a.nodeName) {
    throw new TypeError("The element or ID supplied is not valid. (videojs)");
  }
  return a.a || new vjs.D(a, b, c)
};
vjs.options = {techOrder:["html5", "flash"], html5:{}, flash:{od:"http://vjs.zencdn.net/c/video-js.swf"}, width:300, height:150, defaultVolume:0, children:{mediaLoader:{}, posterImage:{}, textTrackDisplay:{}, loadingSpinner:{}, bigPlayButton:{}, controlBar:{}}};
vjs.$ = {};
vjs.e = function(a, b) {
  var c = document.createElement(a || "div"), d;
  for(d in b) {
    b.hasOwnProperty(d) && (c[d] = b[d])
  }
  return c
};
vjs.S = function(a) {
  return a.charAt(0).toUpperCase() + a.slice(1)
};
vjs.Da = function(a, b) {
  if(a) {
    for(var c in a) {
      a.hasOwnProperty(c) && b.call(this, c, a[c])
    }
  }
};
vjs.w = function(a, b) {
  if(!b) {
    return a
  }
  for(var c in b) {
    b.hasOwnProperty(c) && (a[c] = b[c])
  }
  return a
};
vjs.bind = function(a, b, c) {
  function d() {
    return b.apply(a, arguments)
  }
  b.t || (b.t = vjs.t++);
  d.t = c ? c + "_" + b.t : b.t;
  return d
};
vjs.X = {};
vjs.t = 1;
vjs.expando = "vdata" + (new Date).getTime();
vjs.getData = function(a) {
  var b = a[vjs.expando];
  b || (b = a[vjs.expando] = vjs.t++, vjs.X[b] = {});
  return vjs.X[b]
};
vjs.Vb = function(a) {
  a = a[vjs.expando];
  return!(!a || vjs.Ya(vjs.X[a]))
};
vjs.Gb = function(a) {
  var b = a[vjs.expando];
  if(b) {
    delete vjs.X[b];
    try {
      delete a[vjs.expando]
    }catch(c) {
      a.removeAttribute ? a.removeAttribute(vjs.expando) : a[vjs.expando] = h
    }
  }
};
vjs.Ya = function(a) {
  for(var b in a) {
    if(a[b] !== h) {
      return j
    }
  }
  return g
};
vjs.q = function(a, b) {
  -1 == (" " + a.className + " ").indexOf(" " + b + " ") && (a.className = "" === a.className ? b : a.className + " " + b)
};
vjs.B = function(a, b) {
  if(-1 != a.className.indexOf(b)) {
    var c = a.className.split(" ");
    c.splice(c.indexOf(b), 1);
    a.className = c.join(" ")
  }
};
vjs.mc = document.createElement("video");
vjs.Qa = navigator.userAgent;
vjs.kc = !!navigator.userAgent.match(/iPad/i);
vjs.jc = !!navigator.userAgent.match(/iPhone/i);
vjs.lc = !!navigator.userAgent.match(/iPod/i);
vjs.ic = vjs.kc || vjs.jc || vjs.lc;
var aa = vjs, x;
var y = navigator.userAgent.match(/OS (\d+)_/i);
x = y && y[1] ? y[1] : e;
aa.Xc = x;
vjs.gc = !!navigator.userAgent.match(/Android.*AppleWebKit/i);
var ba = vjs, z = navigator.userAgent.match(/Android (\d+)\./i);
ba.fc = z && z[1] ? z[1] : h;
vjs.hc = function() {
  return!!vjs.Qa.match("Firefox")
};
vjs.Y = function(a) {
  var b = {};
  if(a && a.attributes && 0 < a.attributes.length) {
    for(var c = a.attributes, d, f, m = c.length - 1;0 <= m;m--) {
      d = c[m].name;
      f = c[m].value;
      if("boolean" === typeof a[d] || -1 !== ",autoplay,controls,loop,muted,default,".indexOf("," + d + ",")) {
        f = f !== h ? g : j
      }
      b[d] = f
    }
  }
  return b
};
vjs.wb = function(a, b) {
  var c = "";
  document.defaultView && document.defaultView.getComputedStyle ? c = document.defaultView.getComputedStyle(a, "").getPropertyValue(b) : a.currentStyle && (b = b.replace(/\-(\w)/g, function(a, b) {
    return b.toUpperCase()
  }), c = a.currentStyle[b]);
  return c
};
vjs.Fa = function(a, b) {
  b.firstChild ? b.insertBefore(a, b.firstChild) : b.appendChild(a)
};
vjs.Hb = {};
vjs.g = function(a) {
  0 === a.indexOf("#") && (a = a.slice(1));
  return document.getElementById(a)
};
vjs.s = function(a, b) {
  b = b || a;
  var c = Math.floor(a % 60), d = Math.floor(a / 60 % 60), f = Math.floor(a / 3600), m = Math.floor(b / 60 % 60), k = Math.floor(b / 3600), f = 0 < f || 0 < k ? f + ":" : "";
  return f + (((f || 10 <= m) && 10 > d ? "0" + d : d) + ":") + (10 > c ? "0" + c : c)
};
vjs.qc = function() {
  document.body.focus();
  document.onselectstart = q(j)
};
vjs.Sc = function() {
  document.onselectstart = q(g)
};
vjs.trim = function(a) {
  return a.toString().replace(/^\s+/, "").replace(/\s+$/, "")
};
vjs.round = function(a, b) {
  b || (b = 0);
  return Math.round(a * Math.pow(10, b)) / Math.pow(10, b)
};
vjs.sb = function(a) {
  return{length:1, start:q(0), end:function() {
    return a
  }}
};
vjs.get = function(a, b, c) {
  var d = 0 === a.indexOf("file:") || 0 === window.location.href.indexOf("file:") && -1 === a.indexOf("http");
  "undefined" === typeof XMLHttpRequest && (window.XMLHttpRequest = function() {
    try {
      return new window.ActiveXObject("Msxml2.XMLHTTP.6.0")
    }catch(a) {
    }
    try {
      return new window.ActiveXObject("Msxml2.XMLHTTP.3.0")
    }catch(b) {
    }
    try {
      return new window.ActiveXObject("Msxml2.XMLHTTP")
    }catch(c) {
    }
    throw Error("This browser does not support XMLHttpRequest.");
  });
  var f = new XMLHttpRequest;
  try {
    f.open("GET", a)
  }catch(m) {
    c(m)
  }
  f.onreadystatechange = function() {
    4 === f.readyState && (200 === f.status || d && 0 === f.status ? b(f.responseText) : c && c())
  };
  try {
    f.send()
  }catch(k) {
    c && c(k)
  }
};
vjs.Nc = function(a) {
  var b = window.localStorage || j;
  if(b) {
    try {
      b.volume = a
    }catch(c) {
      22 == c.code || 1014 == c.code ? vjs.log("LocalStorage Full (VideoJS)", c) : vjs.log("LocalStorage Error (VideoJS)", c)
    }
  }
};
vjs.Xa = function(a) {
  a.match(/^https?:\/\//) || (a = vjs.e("div", {innerHTML:'<a href="' + a + '">x</a>'}).firstChild.href);
  return a
};
vjs.log = function() {
  vjs.log.history = vjs.log.history || [];
  vjs.log.history.push(arguments);
  window.console && window.console.log(Array.prototype.slice.call(arguments))
};
vjs.wc = "getBoundingClientRect" in document.documentElement ? function(a) {
  var b;
  try {
    b = a.getBoundingClientRect()
  }catch(c) {
  }
  if(!b) {
    return 0
  }
  a = document.body;
  return b.left + (window.pageXOffset || a.scrollLeft) - (document.documentElement.clientLeft || a.clientLeft || 0)
} : function(a) {
  for(var b = a.offsetLeft;a = a.offsetParent;) {
    b += a.offsetLeft
  }
  return b
};
vjs.f = function(a, b, c) {
  var d = vjs.getData(a);
  d.u || (d.u = {});
  d.u[b] || (d.u[b] = []);
  c.t || (c.t = vjs.t++);
  d.u[b].push(c);
  d.T || (d.disabled = j, d.T = function(b) {
    if(!d.disabled) {
      b = vjs.Qb(b);
      var c = d.u[b.type];
      if(c) {
        for(var k = [], p = 0, n = c.length;p < n;p++) {
          k[p] = c[p]
        }
        c = 0;
        for(p = k.length;c < p;c++) {
          k[c].call(a, b)
        }
      }
    }
  });
  1 == d.u[b].length && (document.addEventListener ? a.addEventListener(b, d.T, j) : document.attachEvent && a.attachEvent("on" + b, d.T))
};
vjs.n = function(a, b, c) {
  if(vjs.Vb(a)) {
    var d = vjs.getData(a);
    if(d.u) {
      if(b) {
        var f = d.u[b];
        if(f) {
          if(c) {
            if(c.t) {
              for(d = 0;d < f.length;d++) {
                f[d].t === c.t && f.splice(d--, 1)
              }
            }
          }else {
            d.u[b] = []
          }
          vjs.Mb(a, b)
        }
      }else {
        for(f in d.u) {
          b = f, d.u[b] = [], vjs.Mb(a, b)
        }
      }
    }
  }
};
vjs.Mb = function(a, b) {
  var c = vjs.getData(a);
  0 === c.u[b].length && (delete c.u[b], document.removeEventListener ? a.removeEventListener(b, c.T, j) : document.detachEvent && a.detachEvent("on" + b, c.T));
  vjs.Ya(c.u) && (delete c.u, delete c.T, delete c.disabled);
  vjs.Ya(c) && vjs.Gb(a)
};
vjs.Qb = function(a) {
  function b() {
    return g
  }
  function c() {
    return j
  }
  if(!a || !a.xb) {
    var d = a || window.event, f;
    for(f in d) {
      a[f] = d[f]
    }
    a.target || (a.target = a.srcElement || document);
    a.relatedTarget = a.fromElement === a.target ? a.toElement : a.fromElement;
    a.preventDefault = function() {
      a.returnValue = j;
      a.Wb = b
    };
    a.Wb = c;
    a.stopPropagation = function() {
      a.cancelBubble = g;
      a.xb = b
    };
    a.xb = c;
    a.stopImmediatePropagation = function() {
      a.zc = b;
      a.stopPropagation()
    };
    a.zc = c;
    a.clientX != h && (d = document.documentElement, f = document.body, a.pageX = a.clientX + (d && d.scrollLeft || f && f.scrollLeft || 0) - (d && d.clientLeft || f && f.clientLeft || 0), a.pageY = a.clientY + (d && d.scrollTop || f && f.scrollTop || 0) - (d && d.clientTop || f && f.clientTop || 0));
    a.which = a.charCode || a.keyCode;
    a.button != h && (a.button = a.button & 1 ? 0 : a.button & 4 ? 1 : a.button & 2 ? 2 : 0)
  }
  return a
};
vjs.h = function(a, b) {
  var c = vjs.Vb(a) ? vjs.getData(a) : {}, d = a.parentNode || a.ownerDocument;
  "string" === typeof b && (b = {type:b, target:a});
  b = vjs.Qb(b);
  c.T && c.T.call(a, b);
  if(d && !b.xb()) {
    vjs.h(d, b)
  }else {
    if(!d && !b.Wb() && (c = vjs.getData(b.target), b.target[b.type])) {
      c.disabled = g;
      if("function" === typeof b.target[b.type]) {
        b.target[b.type]()
      }
      c.disabled = j
    }
  }
};
vjs.G = function(a, b, c) {
  vjs.f(a, b, function() {
    vjs.n(a, b, arguments.callee);
    c.apply(this, arguments)
  })
};
vjs.d = function(a, b, c) {
  this.a = a;
  b = this.options = vjs.w(this.options || {}, b);
  this.U = b.id || (b.g && b.g.id ? b.g.id : a.id + "_component_" + vjs.t++);
  this.Dc = b.name || h;
  this.b = b.g ? b.g : this.e();
  this.I = [];
  this.Va = {};
  this.L = {};
  if((a = this.options) && a.children) {
    var d = this;
    vjs.Da(a.children, function(a, b) {
      b !== j && !b.Bc && (d[a] = d.K(a, b))
    })
  }
  this.N(c)
};
r = vjs.d.prototype;
r.p = function() {
  if(this.I) {
    for(var a = this.I.length - 1;0 <= a;a--) {
      this.I[a].p()
    }
  }
  this.L = this.Va = this.I = h;
  this.n();
  this.b.parentNode && this.b.parentNode.removeChild(this.b);
  vjs.Gb(this.b);
  this.b = h
};
r.e = function(a, b) {
  return vjs.e(a, b)
};
r.g = l("b");
r.id = l("U");
r.name = l("Dc");
r.children = l("I");
r.K = function(a, b) {
  var c, d, f;
  "string" === typeof a ? (d = a, b = b || {}, c = b.cd || vjs.S(d), b.name = d, c = new window.videojs[c](this.a || this, b)) : c = a;
  d = c.name();
  f = c.id();
  this.I.push(c);
  f && (this.Va[f] = c);
  d && (this.L[d] = c);
  this.b.appendChild(c.g());
  return c
};
r.removeChild = function(a) {
  "string" === typeof a && (a = this.L[a]);
  if(a && this.I) {
    for(var b = j, c = this.I.length - 1;0 <= c;c--) {
      if(this.I[c] === a) {
        b = g;
        this.I.splice(c, 1);
        break
      }
    }
    b && (this.Va[a.id] = h, this.L[a.name] = h, (b = a.g()) && b.parentNode === this.b && this.b.removeChild(a.g()))
  }
};
r.C = q("");
r.f = function(a, b) {
  vjs.f(this.b, a, vjs.bind(this, b));
  return this
};
r.n = function(a, b) {
  vjs.n(this.b, a, b);
  return this
};
r.G = function(a, b) {
  vjs.G(this.b, a, vjs.bind(this, b));
  return this
};
r.h = function(a, b) {
  vjs.h(this.b, a, b);
  return this
};
r.N = function(a) {
  a && (this.na ? a.call(this) : (this.fb === e && (this.fb = []), this.fb.push(a)));
  return this
};
function A(a) {
  a.na = g;
  var b = a.fb;
  if(b && 0 < b.length) {
    for(var c = 0, d = b.length;c < d;c++) {
      b[c].call(a)
    }
    a.fb = [];
    a.h("ready")
  }
}
r.q = function(a) {
  vjs.q(this.b, a);
  return this
};
r.B = function(a) {
  vjs.B(this.b, a);
  return this
};
r.show = function() {
  this.b.style.display = "block";
  return this
};
r.A = function() {
  this.b.style.display = "none";
  return this
};
r.Wa = function() {
  this.B("vjs-fade-out");
  this.q("vjs-fade-in");
  return this
};
r.ub = function() {
  this.B("vjs-fade-in");
  this.q("vjs-fade-out");
  return this
};
r.Xb = function() {
  var a = this.b.style;
  a.display = "block";
  a.opacity = 1;
  a.Uc = "visible";
  return this
};
function B(a) {
  a = a.b.style;
  a.display = "";
  a.opacity = "";
  a.Uc = ""
}
r.width = function(a, b) {
  return C(this, "width", a, b)
};
r.height = function(a, b) {
  return C(this, "height", a, b)
};
r.tc = function(a, b) {
  return this.width(a, g).height(b)
};
function C(a, b, c, d) {
  if(c !== e) {
    return a.b.style[b] = -1 !== ("" + c).indexOf("%") || -1 !== ("" + c).indexOf("px") ? c : c + "px", d || a.h("resize"), a
  }
  if(!a.b) {
    return 0
  }
  c = a.b.style[b];
  d = c.indexOf("px");
  return-1 !== d ? parseInt(c.slice(0, d), 10) : parseInt(a.b["offset" + vjs.S(b)], 10)
}
;vjs.D = function(a, b, c) {
  this.O = a;
  var d = {};
  vjs.w(d, vjs.options);
  vjs.w(d, ca(a));
  vjs.w(d, b);
  this.r = {};
  vjs.d.call(this, this, d, c);
  this.f("ended", this.Fc);
  this.f("play", this.Eb);
  this.f("pause", this.Db);
  this.f("progress", this.Gc);
  this.f("durationchange", this.Ec);
  this.f("error", this.Bb);
  vjs.$[this.U] = this
};
v(vjs.D, vjs.d);
r = vjs.D.prototype;
r.p = function() {
  vjs.$[this.U] = h;
  this.O && this.O.a && (this.O.a = h);
  this.b && this.b.a && (this.b.a = h);
  clearInterval(this.eb);
  this.l && this.l.p();
  vjs.D.i.p.call(this)
};
function ca(a) {
  var b = {sources:[], tracks:[]};
  vjs.w(b, vjs.Y(a));
  if(a.hasChildNodes()) {
    for(var c, d = a.childNodes, f = 0, m = d.length;f < m;f++) {
      a = d[f], c = a.nodeName.toLowerCase(), "source" === c ? b.sources.push(vjs.Y(a)) : "track" === c && b.tracks.push(vjs.Y(a))
    }
  }
  return b
}
r.e = function() {
  var a = this.b = vjs.D.i.e.call(this, "div"), b = this.O;
  b.removeAttribute("controls");
  b.removeAttribute("poster");
  b.removeAttribute("width");
  b.removeAttribute("height");
  if(b.hasChildNodes()) {
    for(var c = b.childNodes.length, d = 0, f = b.childNodes;d < c;d++) {
      ("source" == f[0].nodeName.toLowerCase() || "track" == f[0].nodeName.toLowerCase()) && b.removeChild(f[0])
    }
  }
  b.id = b.id || "vjs_video_" + vjs.t++;
  a.id = b.id;
  a.className = b.className;
  b.id += "_html5_api";
  b.className = "vjs-tech";
  b.a = a.a = this;
  this.q("vjs-paused");
  this.width(this.options.width, g);
  this.height(this.options.height, g);
  b.parentNode && b.parentNode.insertBefore(a, b);
  vjs.Fa(b, a);
  return a
};
function D(a, b, c) {
  a.l ? E(a) : "Html5" !== b && a.O && (a.b.removeChild(a.O), a.O = h);
  a.aa = b;
  a.na = j;
  var d = vjs.w({source:c, Hc:a.b}, a.options[b.toLowerCase()]);
  c && (c.src == a.r.src && 0 < a.r.currentTime && (d.startTime = a.r.currentTime), a.r.src = c.src);
  a.l = new window.videojs[b](a, d);
  a.l.N(function() {
    A(this.a);
    if(!this.M.Zb) {
      var a = this.a;
      a.zb = g;
      a.eb = setInterval(vjs.bind(a, function() {
        this.r.ob < this.buffered().end(0) ? this.h("progress") : 1 == F(this) && (clearInterval(this.eb), this.h("progress"))
      }), 500);
      a.l.G("progress", function() {
        this.M.Zb = g;
        var a = this.a;
        a.zb = j;
        clearInterval(a.eb)
      })
    }
    this.M.dc || (a = this.a, a.Ab = g, a.f("play", a.ec), a.f("pause", a.hb), a.l.G("timeupdate", function() {
      this.M.dc = g;
      G(this.a)
    }))
  })
}
function E(a) {
  a.l.p();
  a.zb && (a.zb = j, clearInterval(a.eb));
  a.Ab && G(a);
  a.l = j
}
function G(a) {
  a.Ab = j;
  a.hb();
  a.n("play", a.ec);
  a.n("pause", a.hb)
}
r.ec = function() {
  this.Ob && this.hb();
  this.Ob = setInterval(vjs.bind(this, function() {
    this.h("timeupdate")
  }), 250)
};
r.hb = function() {
  clearInterval(this.Ob)
};
r.Fc = function() {
  this.options.loop && (this.currentTime(0), this.play())
};
r.Eb = function() {
  vjs.B(this.b, "vjs-paused");
  vjs.q(this.b, "vjs-playing")
};
r.Db = function() {
  vjs.B(this.b, "vjs-playing");
  vjs.q(this.b, "vjs-paused")
};
r.Gc = function() {
  1 == F(this) && this.h("loadedalldata")
};
r.Ec = function() {
  this.duration(H(this, "duration"))
};
r.Bb = function(a) {
  vjs.log("Video Error", a)
};
function I(a, b, c) {
  if(a.l.na) {
    try {
      a.l[b](c)
    }catch(d) {
      vjs.log(d)
    }
  }else {
    a.l.N(function() {
      this[b](c)
    })
  }
}
function H(a, b) {
  if(a.l.na) {
    try {
      return a.l[b]()
    }catch(c) {
      if(a.l[b] === e) {
        vjs.log("Video.js: " + b + " method not defined for " + a.aa + " playback technology.", c)
      }else {
        if("TypeError" == c.name) {
          throw vjs.log("Video.js: " + b + " unavailable on " + a.aa + " playback technology element.", c), a.l.na = j, c;
        }
        vjs.log(c)
      }
    }
  }
}
r.play = function() {
  I(this, "play");
  return this
};
r.pause = function() {
  I(this, "pause");
  return this
};
r.paused = function() {
  return H(this, "paused") === j ? j : g
};
r.currentTime = function(a) {
  return a !== e ? (this.r.ld = a, I(this, "setCurrentTime", a), this.Ab && this.h("timeupdate"), this) : this.r.currentTime = H(this, "currentTime") || 0
};
r.duration = function(a) {
  return a !== e ? (this.r.duration = parseFloat(a), this) : this.r.duration
};
r.buffered = function() {
  var a = H(this, "buffered"), b = this.r.ob = this.r.ob || 0;
  a && (0 < a.length && a.end(0) !== b) && (b = a.end(0), this.r.ob = b);
  return vjs.sb(b)
};
function F(a) {
  return a.duration() ? a.buffered().end(0) / a.duration() : 0
}
r.volume = function(a) {
  if(a !== e) {
    return a = Math.max(0, Math.min(1, parseFloat(a))), this.r.volume = a, I(this, "setVolume", a), vjs.Nc(a), this
  }
  a = parseFloat(H(this, "volume"));
  return isNaN(a) ? 1 : a
};
r.muted = function(a) {
  return a !== e ? (I(this, "setMuted", a), this) : H(this, "muted") || j
};
r.ib = function() {
  return H(this, "supportsFullScreen") || j
};
r.gb = function() {
  var a = vjs.Hb.gb;
  this.Z = g;
  a ? (vjs.f(document, a.ma, vjs.bind(this, function() {
    this.Z = document[a.Z];
    this.Z === j && vjs.n(document, a.ma, arguments.callee);
    this.h("fullscreenchange")
  })), this.l.M.Sb === j && this.options.flash.iFrameMode !== g && (this.pause(), E(this), vjs.f(document, a.ma, vjs.bind(this, function() {
    vjs.n(document, a.ma, arguments.callee);
    D(this, this.aa, {src:this.r.src})
  }))), this.b[a.Jc]()) : this.l.ib() ? (this.h("fullscreenchange"), I(this, "enterFullScreen")) : (this.h("fullscreenchange"), this.yc = g, this.uc = document.documentElement.style.overflow, vjs.f(document, "keydown", vjs.bind(this, this.Rb)), document.documentElement.style.overflow = "hidden", vjs.q(document.body, "vjs-full-window"), vjs.q(this.b, "vjs-fullscreen"), this.h("enterFullWindow"));
  return this
};
function J(a) {
  var b = vjs.Hb.gb;
  a.Z = j;
  b ? (a.l.M.Sb === j && a.options.flash.iFrameMode !== g && (a.pause(), E(a), vjs.f(document, b.ma, vjs.bind(a, function() {
    vjs.n(document, b.ma, arguments.callee);
    D(this, this.aa, {src:this.r.src})
  }))), document[b.rc]()) : (a.l.ib() ? I(a, "exitFullScreen") : K(a), a.h("fullscreenchange"))
}
r.Rb = function(a) {
  27 === a.keyCode && (this.Z === g ? J(this) : K(this))
};
function K(a) {
  a.yc = j;
  vjs.n(document, "keydown", a.Rb);
  document.documentElement.style.overflow = a.uc;
  vjs.B(document.body, "vjs-full-window");
  vjs.B(a.b, "vjs-fullscreen");
  a.h("exitFullWindow")
}
r.src = function(a) {
  if(a instanceof Array) {
    var b;
    a: {
      b = a;
      for(var c = 0, d = this.options.techOrder;c < d.length;c++) {
        var f = vjs.S(d[c]), m = window.videojs[f];
        if(m.isSupported()) {
          for(var k = 0, p = b;k < p.length;k++) {
            var n = p[k];
            if(m.canPlaySource(n)) {
              b = {source:n, l:f};
              break a
            }
          }
        }
      }
      b = j
    }
    b ? (a = b.source, b = b.l, b == this.aa ? this.src(a) : D(this, b, a)) : vjs.log("No compatible source and media technology were found.")
  }else {
    a instanceof Object ? window.videojs[this.aa].canPlaySource(a) ? this.src(a.src) : this.src([a]) : (this.r.src = a, this.na ? (I(this, "src", a), "auto" == this.options.preload && this.load(), this.options.autoplay && this.play()) : this.N(function() {
      this.src(a)
    }))
  }
  return this
};
r.load = function() {
  I(this, "load");
  return this
};
r.currentSrc = function() {
  return H(this, "currentSrc") || this.r.src || ""
};
r.Ia = function(a) {
  return a !== e ? (I(this, "setPreload", a), this.options.preload = a, this) : H(this, "preload")
};
r.autoplay = function(a) {
  return a !== e ? (I(this, "setAutoplay", a), this.options.autoplay = a, this) : H(this, "autoplay")
};
r.loop = function(a) {
  return a !== e ? (I(this, "setLoop", a), this.options.loop = a, this) : H(this, "loop")
};
r.controls = function() {
  return this.options.controls
};
r.poster = function() {
  return H(this, "poster")
};
r.error = function() {
  return H(this, "error")
};
var L, M, N, O;
if(document.ad !== e) {
  L = "requestFullscreen", M = "exitFullscreen", N = "fullscreenchange", O = "fullScreen"
}else {
  for(var P = ["moz", "webkit"], Q = P.length - 1;0 <= Q;Q--) {
    var R = P[Q];
    if(("moz" != R || document.mozFullScreenEnabled) && document[R + "CancelFullScreen"] !== e) {
      L = R + "RequestFullScreen", M = R + "CancelFullScreen", N = R + "fullscreenchange", O = "webkit" == R ? R + "IsFullScreen" : R + "FullScreen"
    }
  }
}
L && (vjs.Hb.gb = {Jc:L, rc:M, ma:N, Z:O});
vjs.Ib = function(a, b, c) {
  vjs.d.call(this, a, b, c);
  if(!a.options.sources || 0 === a.options.sources.length) {
    b = 0;
    for(c = a.options.techOrder;b < c.length;b++) {
      var d = vjs.S(c[b]), f = window.videojs[d];
      if(f && f.isSupported()) {
        D(a, d);
        break
      }
    }
  }else {
    a.src(a.options.sources)
  }
};
v(vjs.Ib, vjs.d);
vjs.P = function(a, b, c) {
  vjs.d.call(this, a, b, c)
};
v(vjs.P, vjs.d);
vjs.P.prototype.o = function() {
  this.a.options.controls && (this.a.paused() ? this.a.play() : this.a.pause())
};
vjs.media = {};
vjs.media.jb = "play pause paused currentTime setCurrentTime duration buffered volume setVolume muted setMuted width height supportsFullScreen enterFullScreen src load currentSrc preload setPreload autoplay setAutoplay loop setLoop error networkState readyState seeking initialTime startOffsetTime played seekable ended videoTracks audioTracks videoWidth videoHeight textTracks defaultPlaybackRate playbackRate mediaGroup controller controls defaultMuted".split(" ");
function da() {
  var a = vjs.media.jb[i];
  return function() {
    throw Error('The "' + a + "\" method is not available on the playback technology's API");
  }
}
for(var i = vjs.media.jb.length - 1;0 <= i;i--) {
  vjs.P.prototype[vjs.media.jb[i]] = da()
}
;vjs.k = function(a, b, c) {
  vjs.P.call(this, a, b, c);
  (b = b.source) && this.b.currentSrc == b.src ? a.h("loadstart") : b && (this.b.src = b.src);
  a.N(function() {
    this.options.autoplay && this.paused() && (this.O.poster = h, this.play())
  });
  this.f("click", this.o);
  for(a = vjs.k.ea.length - 1;0 <= a;a--) {
    vjs.f(this.b, vjs.k.ea[a], vjs.bind(this.a, this.Pb))
  }
  A(this)
};
v(vjs.k, vjs.P);
r = vjs.k.prototype;
r.p = function() {
  for(var a = vjs.k.ea.length - 1;0 <= a;a--) {
    vjs.n(this.b, vjs.k.ea[a], vjs.bind(this.a, this.Pb))
  }
  vjs.k.i.p.call(this)
};
r.e = function() {
  var a = this.a, b = a.O;
  if(!b || this.M.Cc === j) {
    b && a.g().removeChild(b), b = vjs.createElement("video", {id:b.id || a.id + "_html5_api", className:b.className || "vjs-tech"}), vjs.Fa(b, a.g)
  }
  for(var c = ["autoplay", "preload", "loop", "muted"], d = c.length - 1;0 <= d;d--) {
    var f = c[d];
    a.options[f] !== h && (b[f] = a.options[f])
  }
  return b
};
r.Pb = function(a) {
  this.h(a);
  a.stopPropagation()
};
r.play = function() {
  this.b.play()
};
r.pause = function() {
  this.b.pause()
};
r.paused = function() {
  return this.b.paused
};
r.currentTime = function() {
  return this.b.currentTime
};
r.Mc = function(a) {
  try {
    this.b.currentTime = a
  }catch(b) {
    vjs.log(b, "Video is not ready. (Video.js)")
  }
};
r.duration = function() {
  return this.b.duration || 0
};
r.buffered = function() {
  return this.b.buffered
};
r.volume = function() {
  return this.b.volume
};
r.Rc = function(a) {
  this.b.volume = a
};
r.muted = function() {
  return this.b.muted
};
r.Pc = function(a) {
  this.b.muted = a
};
r.width = function() {
  return this.b.offsetWidth
};
r.height = function() {
  return this.b.offsetHeight
};
r.ib = function() {
  return"function" == typeof this.b.webkitEnterFullScreen && !navigator.userAgent.match("Chrome") && !navigator.userAgent.match("Mac OS X 10.5") ? g : j
};
r.src = function(a) {
  this.b.src = a
};
r.load = function() {
  this.b.load()
};
r.currentSrc = function() {
  return this.b.currentSrc
};
r.Ia = function() {
  return this.b.Ia
};
r.Qc = function(a) {
  this.b.Ia = a
};
r.autoplay = function() {
  return this.b.autoplay
};
r.Lc = function(a) {
  this.b.autoplay = a
};
r.loop = function() {
  return this.b.loop
};
r.Oc = function(a) {
  this.b.loop = a
};
r.error = function() {
  return this.b.error
};
r.controls = function() {
  return this.a.options.controls
};
vjs.k.isSupported = function() {
  return!!document.createElement("video").canPlayType
};
vjs.k.pb = function(a) {
  return!!document.createElement("video").canPlayType(a.type)
};
vjs.k.ea = "loadstart suspend abort error emptied stalled loadedmetadata loadeddata canplay canplaythrough playing waiting seeking seeked ended durationchange timeupdate progress play pause ratechange volumechange".split(" ");
vjs.k.prototype.M = {fd:vjs.mc.webkitEnterFullScreen ? !vjs.Qa.match("Chrome") && !vjs.Qa.match("Mac OS X 10.5") ? g : j : j, Cc:!vjs.ic};
vjs.gc && 3 > vjs.fc && (document.createElement("video").constructor.prototype.canPlayType = function(a) {
  return a && -1 != a.toLowerCase().indexOf("video/mp4") ? "maybe" : ""
});
vjs.j = function(a, b, c) {
  vjs.P.call(this, a, b, c);
  c = b.source;
  var d = b.Hc, f = this.b = vjs.e("div", {id:a.id() + "_temp_flash"}), m = a.id() + "_flash_api";
  a = a.options;
  var k = vjs.w({readyFunction:"videojs.Flash.onReady", eventProxyFunction:"videojs.Flash.onEvent", errorEventProxyFunction:"videojs.Flash.onError", autoplay:a.autoplay, preload:a.Ia, loop:a.loop, muted:a.muted}, b.flashVars), p = vjs.w({wmode:"opaque", bgcolor:"#000000"}, b.params), n = vjs.w({id:m, name:m, "class":"vjs-tech"}, b.attributes);
  c && (k.src = encodeURIComponent(vjs.Xa(c.src)));
  vjs.Fa(f, d);
  b.startTime && this.N(function() {
    this.load();
    this.play();
    this.currentTime(b.startTime)
  });
  if(b.jd === g && !vjs.hc) {
    var s = vjs.e("iframe", {id:m + "_iframe", name:m + "_iframe", className:"vjs-tech", scrolling:"no", marginWidth:0, marginHeight:0, frameBorder:0});
    k.readyFunction = "ready";
    k.eventProxyFunction = "events";
    k.errorEventProxyFunction = "errors";
    vjs.f(s, "load", vjs.bind(this, function() {
      var a, c = s.contentWindow;
      a = s.contentDocument ? s.contentDocument : s.contentWindow.document;
      a.write(vjs.j.Tb(b.swf, k, p, n));
      c.a = this.a;
      c.N = vjs.bind(this.a, function(b) {
        b = a.getElementById(b);
        var c = this.l;
        c.g = b;
        vjs.f(b, "click", c.bind(c.o));
        vjs.j.qb(c)
      });
      c.ed = vjs.bind(this.a, function(a, b) {
        this && "flash" === this.aa && this.h(b)
      });
      c.dd = vjs.bind(this.a, function(a, b) {
        vjs.log("Flash Error", b)
      })
    }));
    f.parentNode.replaceChild(s, f)
  }else {
    vjs.j.vc(b.swf, f, k, p, n)
  }
};
v(vjs.j, vjs.P);
r = vjs.j.prototype;
r.p = function() {
  vjs.j.i.p.call(this)
};
r.play = function() {
  this.b.vjs_play()
};
r.pause = function() {
  this.b.vjs_pause()
};
r.src = function(a) {
  a = vjs.Xa(a);
  this.b.vjs_src(a);
  if(this.a.autoplay()) {
    var b = this;
    setTimeout(function() {
      b.play()
    }, 0)
  }
};
r.load = function() {
  this.b.vjs_load()
};
r.poster = function() {
  this.b.vjs_getProperty("poster")
};
r.buffered = function() {
  return vjs.sb(this.b.vjs_getProperty("buffered"))
};
r.ib = q(j);
var S = vjs.j.prototype, T = "preload currentTime defaultPlaybackRate playbackRate autoplay loop mediaGroup controller controls volume muted defaultMuted".split(" "), U = "error currentSrc networkState readyState seeking initialTime duration startOffsetTime paused played seekable ended videoTracks audioTracks videoWidth videoHeight textTracks".split(" ");
function ea() {
  var a = T[i], b = a.charAt(0).toUpperCase() + a.slice(1);
  S["set" + b] = function(b) {
    return this.b.vjs_setProperty(a, b)
  }
}
function V(a) {
  S[a] = function() {
    return this.b.vjs_getProperty(a)
  }
}
for(i = 0;i < T.length;i++) {
  V(T[i]), ea()
}
for(i = 0;i < U.length;i++) {
  V(U[i])
}
vjs.j.isSupported = function() {
  return 10 <= vjs.j.version()[0]
};
vjs.j.pb = function(a) {
  if(a.type in vjs.j.prototype.M.xc) {
    return"maybe"
  }
};
vjs.j.prototype.M = {xc:{"video/flv":"FLV", "video/x-flv":"FLV", "video/mp4":"MP4", "video/m4v":"MP4"}, Zb:j, dc:j, Sb:j, md:!vjs.Qa.match("Firefox")};
vjs.j.onReady = function(a) {
  a = vjs.g(a);
  var b = a.a || a.parentNode.a, c = b.l;
  a.a = b;
  c.b = a;
  c.f("click", c.o);
  vjs.j.qb(c)
};
vjs.j.qb = function(a) {
  a.g().vjs_getProperty ? A(a) : setTimeout(function() {
    vjs.j.qb(a)
  }, 50)
};
vjs.j.onEvent = function(a, b) {
  vjs.g(a).a.h(b)
};
vjs.j.onError = function(a, b) {
  vjs.g(a).a.h("error");
  vjs.log("Flash Error", b, a)
};
vjs.j.version = function() {
  var a = "0,0,0";
  try {
    a = (new window.ActiveXObject("ShockwaveFlash.ShockwaveFlash")).GetVariable("$version").replace(/\D+/g, ",").match(/^,?(.+),?$/)[1]
  }catch(b) {
    try {
      navigator.mimeTypes["application/x-shockwave-flash"].enabledPlugin && (a = (navigator.plugins["Shockwave Flash 2.0"] || navigator.plugins["Shockwave Flash"]).description.replace(/\D+/g, ",").match(/^,?(.+),?$/)[1])
    }catch(c) {
    }
  }
  return a.split(",")
};
vjs.j.vc = function(a, b, c, d, f) {
  a = vjs.j.Tb(a, c, d, f);
  a = vjs.e("div", {innerHTML:a}).childNodes[0];
  c = b.parentNode;
  b.parentNode.replaceChild(a, b);
  var m = c.childNodes[0];
  setTimeout(function() {
    m.style.display = "block"
  }, 1E3)
};
vjs.j.Tb = function(a, b, c, d) {
  var f = "", m = "", k = "";
  b && vjs.Da(b, function(a, b) {
    f += a + "=" + b + "&amp;"
  });
  c = vjs.w({movie:a, flashvars:f, allowScriptAccess:"always", allowNetworking:"all"}, c);
  vjs.Da(c, function(a, b) {
    m += '<param name="' + a + '" value="' + b + '" />'
  });
  d = vjs.w({data:a, width:"100%", height:"100%"}, d);
  vjs.Da(d, function(a, b) {
    k += a + '="' + b + '" '
  });
  return'<object type="application/x-shockwave-flash"' + k + ">" + m + "</object>"
};
vjs.da = function(a, b) {
  vjs.d.call(this, a, b)
};
v(vjs.da, vjs.d);
vjs.da.prototype.C = function() {
  return"vjs-control " + vjs.da.i.C.call(this)
};
vjs.V = function(a, b) {
  vjs.d.call(this, a, b);
  a.G("play", vjs.bind(this, function() {
    this.Wa();
    this.a.f("mouseover", vjs.bind(this, this.Wa));
    this.a.f("mouseout", vjs.bind(this, this.ub))
  }))
};
v(vjs.V, vjs.d);
r = vjs.V.prototype;
r.options = {Bc:"play", children:{playToggle:{}, fullscreenToggle:{}, currentTimeDisplay:{}, timeDivider:{}, durationDisplay:{}, remainingTimeDisplay:{}, progressControl:{}, volumeControl:{}, muteToggle:{}}};
r.e = function() {
  return vjs.e("div", {className:"vjs-control-bar"})
};
r.Wa = function() {
  vjs.V.i.Wa.call(this);
  this.a.h("controlsvisible")
};
r.ub = function() {
  vjs.V.i.ub.call(this);
  this.a.h("controlshidden")
};
r.Xb = function() {
  this.b.style.opacity = "1"
};
vjs.m = function(a, b) {
  vjs.da.call(this, a, b);
  this.f("click", this.o);
  this.f("focus", this.ab);
  this.f("blur", this.$a)
};
v(vjs.m, vjs.da);
r = vjs.m.prototype;
r.e = function(a, b) {
  b = vjs.w({className:this.C(), innerHTML:'<div><span class="vjs-control-text">' + (this.W || "Need Text") + "</span></div>", Kc:"button", tabIndex:0}, b);
  return vjs.m.i.e.call(this, a, b)
};
r.o = function() {
};
r.ab = function() {
  vjs.f(document, "keyup", vjs.bind(this, this.Ha))
};
r.Ha = function(a) {
  if(32 == a.which || 13 == a.which) {
    a.preventDefault(), this.o()
  }
};
r.$a = function() {
  vjs.n(document, "keyup", vjs.bind(this, this.Ha))
};
vjs.ja = function(a, b) {
  vjs.m.call(this, a, b)
};
v(vjs.ja, vjs.m);
vjs.ja.prototype.W = "Play";
vjs.ja.prototype.C = function() {
  return"vjs-play-button " + vjs.ja.i.C.call(this)
};
vjs.ja.prototype.o = function() {
  this.a.play()
};
vjs.ia = function(a, b) {
  vjs.m.call(this, a, b)
};
v(vjs.ia, vjs.m);
vjs.ia.prototype.W = "Play";
vjs.ia.prototype.C = function() {
  return"vjs-pause-button " + vjs.ia.i.C.call(this)
};
vjs.ia.prototype.o = function() {
  this.a.pause()
};
vjs.Ma = function(a, b) {
  vjs.m.call(this, a, b);
  a.f("play", vjs.bind(this, this.Eb));
  a.f("pause", vjs.bind(this, this.Db))
};
v(vjs.Ma, vjs.m);
r = vjs.Ma.prototype;
r.W = "Play";
r.C = function() {
  return"vjs-play-control " + vjs.Ma.i.C.call(this)
};
r.o = function() {
  this.a.paused() ? this.a.play() : this.a.pause()
};
r.Eb = function() {
  vjs.B(this.b, "vjs-paused");
  vjs.q(this.b, "vjs-playing")
};
r.Db = function() {
  vjs.B(this.b, "vjs-playing");
  vjs.q(this.b, "vjs-paused")
};
vjs.fa = function(a, b) {
  vjs.m.call(this, a, b)
};
v(vjs.fa, vjs.m);
vjs.fa.prototype.W = "Fullscreen";
vjs.fa.prototype.C = function() {
  return"vjs-fullscreen-control " + vjs.fa.i.C.call(this)
};
vjs.fa.prototype.o = function() {
  this.a.Z ? J(this.a) : this.a.gb()
};
vjs.ca = function(a, b) {
  vjs.m.call(this, a, b);
  a.f("play", vjs.bind(this, this.A));
  a.f("ended", vjs.bind(this, this.show))
};
v(vjs.ca, vjs.m);
vjs.ca.prototype.e = function() {
  return vjs.ca.i.e.call(this, "div", {className:"vjs-big-play-button", innerHTML:"<span></span>"})
};
vjs.ca.prototype.o = function() {
  this.a.currentTime() && this.a.currentTime(0);
  this.a.play()
};
vjs.wa = function(a, b) {
  vjs.d.call(this, a, b);
  a.f("canplay", vjs.bind(this, this.A));
  a.f("canplaythrough", vjs.bind(this, this.A));
  a.f("playing", vjs.bind(this, this.A));
  a.f("seeked", vjs.bind(this, this.A));
  a.f("seeking", vjs.bind(this, this.show));
  a.f("seeked", vjs.bind(this, this.A));
  a.f("error", vjs.bind(this, this.show));
  a.f("waiting", vjs.bind(this, this.show))
};
v(vjs.wa, vjs.d);
vjs.wa.prototype.e = function() {
  var a, b;
  "string" == typeof this.a.g().style.WebkitBorderRadius || "string" == typeof this.a.g().style.MozBorderRadius || "string" == typeof this.a.g().style.Yc || "string" == typeof this.a.g().style.$c ? (a = "vjs-loading-spinner", b = '<div class="ball1"></div><div class="ball2"></div><div class="ball3"></div><div class="ball4"></div><div class="ball5"></div><div class="ball6"></div><div class="ball7"></div><div class="ball8"></div>') : (a = "vjs-loading-spinner-fallback", b = "");
  return vjs.wa.i.e.call(this, "div", {className:a, innerHTML:b})
};
vjs.ta = function(a, b) {
  vjs.d.call(this, a, b);
  a.f("timeupdate", vjs.bind(this, this.Ka))
};
v(vjs.ta, vjs.d);
vjs.ta.prototype.e = function() {
  var a = vjs.ta.i.e.call(this, "div", {className:"vjs-current-time vjs-time-controls vjs-control"});
  this.content = vjs.e("div", {className:"vjs-current-time-display", innerHTML:"0:00"});
  a.appendChild(vjs.e("div").appendChild(this.content));
  return a
};
vjs.ta.prototype.Ka = function() {
  var a = this.a.$b ? this.a.r.currentTime : this.a.currentTime();
  this.content.innerHTML = vjs.s(a, this.a.duration())
};
vjs.ua = function(a, b) {
  vjs.d.call(this, a, b);
  a.f("timeupdate", vjs.bind(this, this.Ka))
};
v(vjs.ua, vjs.d);
vjs.ua.prototype.e = function() {
  var a = vjs.ua.i.e.call(this, "div", {className:"vjs-duration vjs-time-controls vjs-control"});
  this.content = vjs.e("div", {className:"vjs-duration-display", innerHTML:"0:00"});
  a.appendChild(vjs.e("div").appendChild(this.content));
  return a
};
vjs.ua.prototype.Ka = function() {
  this.a.duration() && (this.content.innerHTML = vjs.s(this.a.duration()))
};
vjs.Pa = function(a, b) {
  vjs.d.call(this, a, b)
};
v(vjs.Pa, vjs.d);
vjs.Pa.prototype.e = function() {
  return vjs.Pa.i.e.call(this, "div", {className:"vjs-time-divider", innerHTML:"<div><span>/</span></div>"})
};
vjs.Aa = function(a, b) {
  vjs.d.call(this, a, b);
  a.f("timeupdate", vjs.bind(this, this.Ka))
};
v(vjs.Aa, vjs.d);
vjs.Aa.prototype.e = function() {
  var a = vjs.Aa.i.e.call(this, "div", {className:"vjs-remaining-time vjs-time-controls vjs-control"});
  this.content = vjs.e("div", {className:"vjs-remaining-time-display", innerHTML:"-0:00"});
  a.appendChild(vjs.e("div").appendChild(this.content));
  return a
};
vjs.Aa.prototype.Ka = function() {
  this.a.duration() && (this.content.innerHTML = "-" + vjs.s(this.a.duration() - this.a.currentTime()))
};
vjs.Q = function(a, b) {
  vjs.d.call(this, a, b);
  this.pc = this.L[this.options.barName];
  this.handle = this.L[this.options.handleName];
  a.f(this.Yb, vjs.bind(this, this.update));
  this.f("mousedown", this.Cb);
  this.f("focus", this.ab);
  this.f("blur", this.$a);
  this.a.f("controlsvisible", vjs.bind(this, this.update));
  a.N(vjs.bind(this, this.update))
};
v(vjs.Q, vjs.d);
r = vjs.Q.prototype;
r.e = function(a, b) {
  b = vjs.w({Kc:"slider", "aria-valuenow":0, "aria-valuemin":0, "aria-valuemax":100, tabIndex:0}, b);
  return vjs.Q.i.e.call(this, a, b)
};
r.Cb = function(a) {
  a.preventDefault();
  vjs.qc();
  vjs.f(document, "mousemove", vjs.bind(this, this.bb));
  vjs.f(document, "mouseup", vjs.bind(this, this.cb));
  this.bb(a)
};
r.cb = function() {
  vjs.Sc();
  vjs.n(document, "mousemove", this.bb, j);
  vjs.n(document, "mouseup", this.cb, j);
  this.update()
};
r.update = function() {
  var a, b = this.Ub(), c = this.handle, d = this.pc;
  isNaN(b) && (b = 0);
  a = b;
  if(c) {
    a = this.b.offsetWidth;
    var f = c.g().offsetWidth;
    a = f ? f / a : 0;
    b *= 1 - a;
    a = b + a / 2;
    c.g().style.left = vjs.round(100 * b, 2) + "%"
  }
  d.g().style.width = vjs.round(100 * a, 2) + "%"
};
function W(a, b) {
  var c = a.b, d = vjs.wc(c), c = c.offsetWidth, f = a.handle;
  f && (f = f.g().offsetWidth, d += f / 2, c -= f);
  return Math.max(0, Math.min(1, (b.pageX - d) / c))
}
r.ab = function() {
  vjs.f(document, "keyup", vjs.bind(this, this.Ha))
};
r.Ha = function(a) {
  37 == a.which ? (a.preventDefault(), this.bc()) : 39 == a.which && (a.preventDefault(), this.cc())
};
r.$a = function() {
  vjs.n(document, "keyup", vjs.bind(this, this.Ha))
};
vjs.za = function(a, b) {
  vjs.d.call(this, a, b)
};
v(vjs.za, vjs.d);
vjs.za.prototype.options = {children:{seekBar:{}}};
vjs.za.prototype.e = function() {
  return vjs.za.i.e.call(this, "div", {className:"vjs-progress-control vjs-control"})
};
vjs.ka = function(a, b) {
  vjs.Q.call(this, a, b)
};
v(vjs.ka, vjs.Q);
r = vjs.ka.prototype;
r.options = {children:{loadProgressBar:{}, playProgressBar:{}, seekHandle:{}}, barName:"playProgressBar", handleName:"seekHandle"};
r.Yb = "timeupdate";
r.e = function() {
  return vjs.ka.i.e.call(this, "div", {className:"vjs-progress-holder"})
};
r.Ub = function() {
  return this.a.currentTime() / this.a.duration()
};
r.Cb = function(a) {
  vjs.ka.i.Cb.call(this, a);
  this.a.$b = g;
  this.Tc = !this.a.paused();
  this.a.pause()
};
r.bb = function(a) {
  a = W(this, a) * this.a.duration();
  a == this.a.duration() && (a -= 0.1);
  this.a.currentTime(a)
};
r.cb = function(a) {
  vjs.ka.i.cb.call(this, a);
  this.a.$b = j;
  this.Tc && this.a.play()
};
r.cc = function() {
  this.a.currentTime(this.a.currentTime() + 1)
};
r.bc = function() {
  this.a.currentTime(this.a.currentTime() - 1)
};
vjs.va = function(a, b) {
  vjs.d.call(this, a, b);
  a.f("progress", vjs.bind(this, this.update))
};
v(vjs.va, vjs.d);
vjs.va.prototype.e = function() {
  return vjs.va.i.e.call(this, "div", {className:"vjs-load-progress", innerHTML:'<span class="vjs-control-text">Loaded: 0%</span>'})
};
vjs.va.prototype.update = function() {
  this.b.style && (this.b.style.width = vjs.round(100 * F(this.a), 2) + "%")
};
vjs.La = function(a, b) {
  vjs.d.call(this, a, b)
};
v(vjs.La, vjs.d);
vjs.La.prototype.e = function() {
  return vjs.La.i.e.call(this, "div", {className:"vjs-play-progress", innerHTML:'<span class="vjs-control-text">Progress: 0%</span>'})
};
vjs.Na = function(a, b) {
  vjs.d.call(this, a, b)
};
v(vjs.Na, vjs.d);
vjs.Na.prototype.e = function() {
  return vjs.Na.i.e.call(this, "div", {className:"vjs-seek-handle", innerHTML:'<span class="vjs-control-text">00:00</span>'})
};
vjs.Ca = function(a, b) {
  vjs.d.call(this, a, b)
};
v(vjs.Ca, vjs.d);
vjs.Ca.prototype.options = {children:{volumeBar:{}}};
vjs.Ca.prototype.e = function() {
  return vjs.Ca.i.e.call(this, "div", {className:"vjs-volume-control vjs-control"})
};
vjs.Ra = function(a, b) {
  vjs.Q.call(this, a, b)
};
v(vjs.Ra, vjs.Q);
r = vjs.Ra.prototype;
r.options = {children:{volumeLevel:{}, volumeHandle:{}}, barName:"volumeLevel", handleName:"volumeHandle"};
r.Yb = "volumechange";
r.e = function() {
  return vjs.Ra.i.e.call(this, "div", {className:"vjs-volume-bar"})
};
r.bb = function(a) {
  this.a.volume(W(this, a))
};
r.Ub = function() {
  return this.a.volume()
};
r.cc = function() {
  this.a.volume(this.a.volume() + 0.1)
};
r.bc = function() {
  this.a.volume(this.a.volume() - 0.1)
};
vjs.Ta = function(a, b) {
  vjs.d.call(this, a, b)
};
v(vjs.Ta, vjs.d);
vjs.Ta.prototype.e = function() {
  return vjs.Ta.i.e.call(this, "div", {className:"vjs-volume-level", innerHTML:'<span class="vjs-control-text"></span>'})
};
vjs.Sa = function(a, b) {
  vjs.d.call(this, a, b)
};
v(vjs.Sa, vjs.d);
vjs.Sa.prototype.e = function() {
  return vjs.Sa.i.e.call(this, "div", {className:"vjs-volume-handle", innerHTML:'<span class="vjs-control-text"></span>'})
};
vjs.ha = function(a, b) {
  vjs.m.call(this, a, b);
  a.f("volumechange", vjs.bind(this, this.update))
};
v(vjs.ha, vjs.m);
vjs.ha.prototype.e = function() {
  return vjs.ha.i.e.call(this, "div", {className:"vjs-mute-control vjs-control", innerHTML:'<div><span class="vjs-control-text">Mute</span></div>'})
};
vjs.ha.prototype.o = function() {
  this.a.muted(this.a.muted() ? j : g)
};
vjs.ha.prototype.update = function() {
  var a = this.a.volume(), b = 3;
  0 === a || this.a.muted() ? b = 0 : 0.33 > a ? b = 1 : 0.67 > a && (b = 2);
  for(a = 0;4 > a;a++) {
    vjs.B(this.b, "vjs-vol-" + a)
  }
  vjs.q(this.b, "vjs-vol-" + b)
};
vjs.ya = function(a, b) {
  vjs.m.call(this, a, b);
  this.a.options.poster || this.A();
  a.f("play", vjs.bind(this, this.A))
};
v(vjs.ya, vjs.m);
vjs.ya.prototype.e = function() {
  var a = vjs.e("img", {className:"vjs-poster", tabIndex:-1});
  this.a.options.poster && (a.src = this.a.options.poster);
  return a
};
vjs.ya.prototype.o = function() {
  this.a.play()
};
vjs.ga = function(a, b) {
  vjs.d.call(this, a, b)
};
v(vjs.ga, vjs.d);
function fa(a, b) {
  a.K(b);
  b.f("click", vjs.bind(a, function() {
    B(this)
  }))
}
vjs.ga.prototype.e = function() {
  return vjs.ga.i.e.call(this, "ul", {className:"vjs-menu"})
};
vjs.H = function(a, b) {
  vjs.m.call(this, a, b);
  b.selected && this.q("vjs-selected")
};
v(vjs.H, vjs.m);
vjs.H.prototype.e = function(a, b) {
  return vjs.H.i.e.call(this, "li", vjs.w({className:"vjs-menu-item", innerHTML:this.options.label}, b))
};
vjs.H.prototype.o = function() {
  this.selected(g)
};
vjs.H.prototype.selected = function(a) {
  a ? this.q("vjs-selected") : this.B("vjs-selected")
};
function X(a) {
  a.Ja = a.Ja || [];
  return a.Ja
}
function ga(a, b, c) {
  for(var d = a.Ja, f = 0, m = d.length, k, p;f < m;f++) {
    k = d[f], k.id() === b ? (k.show(), p = k) : c && (k.F() == c && 0 < k.mode()) && k.disable()
  }
  (b = p ? p.F() : c ? c : j) && a.h(b + "trackchange")
}
vjs.z = function(a, b) {
  vjs.d.call(this, a, b);
  this.U = b.id || "vjs_" + b.kind + "_" + b.language + "_" + vjs.t++;
  this.ac = b.src;
  this.sc = b["default"] || b.dflt;
  this.pd = b.title;
  this.kd = b.srclang;
  this.Ac = b.label;
  this.la = [];
  this.Jb = [];
  this.pa = this.qa = 0
};
v(vjs.z, vjs.d);
r = vjs.z.prototype;
r.F = l("v");
r.src = l("ac");
r.tb = l("sc");
r.label = l("Ac");
r.readyState = l("qa");
r.mode = l("pa");
r.e = function() {
  return vjs.z.i.e.call(this, "div", {className:"vjs-" + this.v + " vjs-text-track"})
};
r.show = function() {
  ha(this);
  this.pa = 2;
  vjs.z.i.show.call(this)
};
r.A = function() {
  ha(this);
  this.pa = 1;
  vjs.z.i.A.call(this)
};
r.disable = function() {
  2 == this.pa && this.A();
  this.a.n("timeupdate", vjs.bind(this, this.update, this.U));
  this.a.n("ended", vjs.bind(this, this.reset, this.U));
  this.reset();
  this.a.L.textTrackDisplay.removeChild(this);
  this.pa = 0
};
function ha(a) {
  0 === a.qa && a.load();
  0 === a.pa && (a.a.f("timeupdate", vjs.bind(a, a.update, a.U)), a.a.f("ended", vjs.bind(a, a.reset, a.U)), ("captions" === a.v || "subtitles" === a.v) && a.a.L.textTrackDisplay.K(a))
}
r.load = function() {
  0 === this.qa && (this.qa = 1, vjs.get(this.ac, vjs.bind(this, this.Ic), vjs.bind(this, this.Bb)))
};
r.Bb = function(a) {
  this.error = a;
  this.qa = 3;
  this.h("error")
};
r.Ic = function(a) {
  var b, c;
  a = a.split("\n");
  for(var d = "", f = 1, m = a.length;f < m;f++) {
    if(d = vjs.trim(a[f])) {
      -1 == d.indexOf("--\x3e") ? (b = d, d = vjs.trim(a[++f])) : b = this.la.length;
      b = {id:b, index:this.la.length};
      c = d.split(" --\x3e ");
      b.startTime = ia(c[0]);
      b.Ea = ia(c[1]);
      for(c = [];a[++f] && (d = vjs.trim(a[f]));) {
        c.push(d)
      }
      b.text = c.join("<br/>");
      this.la.push(b)
    }
  }
  this.qa = 2;
  this.h("loaded")
};
function ia(a) {
  var b = a.split(":");
  a = 0;
  var c, d, f;
  3 == b.length ? (c = b[0], d = b[1], b = b[2]) : (c = 0, d = b[0], b = b[1]);
  b = b.split(/\s+/);
  b = b.splice(0, 1)[0];
  b = b.split(/\.|,/);
  f = parseFloat(b[1]);
  b = b[0];
  a += 3600 * parseFloat(c);
  a += 60 * parseFloat(d);
  a += parseFloat(b);
  f && (a += f / 1E3);
  return a
}
r.update = function() {
  if(0 < this.la.length) {
    var a = this.a.currentTime();
    if(this.Fb === e || a < this.Fb || this.Za <= a) {
      var b = this.la, c = this.a.duration(), d = 0, f = j, m = [], k, p, n, s;
      a >= this.Za || this.Za === e ? s = this.vb !== e ? this.vb : 0 : (f = g, s = this.yb !== e ? this.yb : b.length - 1);
      for(;;) {
        n = b[s];
        if(n.Ea <= a) {
          d = Math.max(d, n.Ea), n.Ua && (n.Ua = j)
        }else {
          if(a < n.startTime) {
            if(c = Math.min(c, n.startTime), n.Ua && (n.Ua = j), !f) {
              break
            }
          }else {
            f ? (m.splice(0, 0, n), p === e && (p = s), k = s) : (m.push(n), k === e && (k = s), p = s), c = Math.min(c, n.Ea), d = Math.max(d, n.startTime), n.Ua = g
          }
        }
        if(f) {
          if(0 === s) {
            break
          }else {
            s--
          }
        }else {
          if(s === b.length - 1) {
            break
          }else {
            s++
          }
        }
      }
      this.Jb = m;
      this.Za = c;
      this.Fb = d;
      this.vb = k;
      this.yb = p;
      a = this.Jb;
      b = "";
      c = 0;
      for(d = a.length;c < d;c++) {
        b += '<span class="vjs-tt-cue">' + a[c].text + "</span>"
      }
      this.b.innerHTML = b;
      this.h("cuechange")
    }
  }
};
r.reset = function() {
  this.Za = 0;
  this.Fb = this.a.duration();
  this.yb = this.vb = 0
};
vjs.kb = function(a, b) {
  vjs.z.call(this, a, b)
};
v(vjs.kb, vjs.z);
vjs.kb.prototype.v = "captions";
vjs.nb = function(a, b) {
  vjs.z.call(this, a, b)
};
v(vjs.nb, vjs.z);
vjs.nb.prototype.v = "subtitles";
vjs.mb = function(a, b) {
  vjs.z.call(this, a, b)
};
v(vjs.mb, vjs.z);
vjs.mb.prototype.v = "chapters";
vjs.Oa = function(a, b, c) {
  vjs.d.call(this, a, b, c);
  if(a.options.tracks && 0 < a.options.tracks.length) {
    b = this.a;
    a = a.options.tracks;
    var d;
    for(c = 0;c < a.length;c++) {
      d = a[c];
      var f = b, m = d.kind, k = d.label, p = d.language, n = d;
      d = f.Ja = f.Ja || [];
      n = n || {};
      n.kind = m;
      n.label = k;
      n.language = p;
      m = vjs.S(m || "subtitles");
      f = new window.videojs[m + "Track"](f, n);
      d.push(f)
    }
  }
};
v(vjs.Oa, vjs.d);
vjs.Oa.prototype.e = function() {
  return vjs.Oa.i.e.call(this, "div", {className:"vjs-text-track-display"})
};
vjs.R = function(a, b) {
  var c = this.ba = b.track;
  b.label = c.label();
  b.selected = c.tb();
  vjs.H.call(this, a, b);
  this.a.f(c.F() + "trackchange", vjs.bind(this, this.update))
};
v(vjs.R, vjs.H);
vjs.R.prototype.o = function() {
  vjs.R.i.o.call(this);
  ga(this.a, this.ba.id(), this.ba.F())
};
vjs.R.prototype.update = function() {
  2 == this.ba.mode() ? this.selected(g) : this.selected(j)
};
vjs.xa = function(a, b) {
  b.track = {F:function() {
    return b.kind
  }, a:a, label:q("Off"), tb:q(j), mode:q(j)};
  vjs.R.call(this, a, b)
};
v(vjs.xa, vjs.R);
vjs.xa.prototype.o = function() {
  vjs.xa.i.o.call(this);
  ga(this.a, this.ba.id(), this.ba.F())
};
vjs.xa.prototype.update = function() {
  for(var a = X(this.a), b = 0, c = a.length, d, f = g;b < c;b++) {
    d = a[b], d.F() == this.ba.F() && 2 == d.mode() && (f = j)
  }
  f ? this.selected(g) : this.selected(j)
};
vjs.J = function(a, b) {
  vjs.m.call(this, a, b);
  this.oa = this.rb();
  0 === this.Ga.length && this.A()
};
v(vjs.J, vjs.m);
r = vjs.J.prototype;
r.rb = function() {
  var a = new vjs.ga(this.a);
  a.g().appendChild(vjs.e("li", {className:"vjs-menu-title", innerHTML:vjs.S(this.v)}));
  fa(a, new vjs.xa(this.a, {kind:this.v}));
  this.Ga = this.Nb();
  for(var b = 0;b < this.Ga.length;b++) {
    fa(a, this.Ga[b])
  }
  this.K(a);
  return a
};
r.Nb = function() {
  for(var a = [], b, c = 0;c < X(this.a).length;c++) {
    b = X(this.a)[c], b.F() === this.v && a.push(new vjs.R(this.a, {track:b}))
  }
  return a
};
r.C = function() {
  return this.className + " vjs-menu-button " + vjs.J.i.C.call(this)
};
r.ab = function() {
  this.oa.Xb();
  vjs.G(this.oa.b.childNodes[this.oa.b.childNodes.length - 1], "blur", vjs.bind(this, function() {
    B(this.oa)
  }))
};
r.$a = function() {
};
r.o = function() {
  this.G("mouseout", vjs.bind(this, function() {
    B(this.oa);
    this.b.blur()
  }))
};
vjs.ra = function(a, b) {
  vjs.J.call(this, a, b)
};
v(vjs.ra, vjs.J);
vjs.ra.prototype.v = "captions";
vjs.ra.prototype.W = "Captions";
vjs.ra.prototype.className = "vjs-captions-button";
vjs.Ba = function(a, b) {
  vjs.J.call(this, a, b)
};
v(vjs.Ba, vjs.J);
vjs.Ba.prototype.v = "subtitles";
vjs.Ba.prototype.W = "Subtitles";
vjs.Ba.prototype.className = "vjs-subtitles-button";
vjs.lb = function(a, b) {
  vjs.J.call(this, a, b)
};
v(vjs.lb, vjs.J);
r = vjs.lb.prototype;
r.v = "chapters";
r.W = "Chapters";
r.className = "vjs-chapters-button";
r.Nb = function() {
  for(var a = [], b, c = 0;c < X(this.a).length;c++) {
    b = X(this.a)[c], b.F() === this.v && a.push(new vjs.R(this.a, {track:b}))
  }
  return a
};
r.rb = function() {
  for(var a = X(this.a), b = 0, c = a.length, d, f, m = this.Ga = [];b < c;b++) {
    if(d = a[b], d.F() == this.v && d.tb()) {
      if(2 > d.readyState()) {
        this.bd = d;
        d.f("loaded", vjs.bind(this, this.rb));
        return
      }
      f = d;
      break
    }
  }
  a = this.oa = new vjs.ga(this.a);
  a.b.appendChild(vjs.e("li", {className:"vjs-menu-title", innerHTML:vjs.S(this.v)}));
  if(f) {
    d = f.la;
    for(var k, b = 0, c = d.length;b < c;b++) {
      k = d[b], k = new vjs.sa(this.a, {track:f, cue:k}), m.push(k), a.K(k)
    }
  }
  this.K(a);
  0 < this.Ga.length && this.show();
  return a
};
vjs.sa = function(a, b) {
  var c = this.ba = b.track, d = this.cue = b.cue, f = a.currentTime();
  b.label = d.text;
  b.selected = d.startTime <= f && f < d.Ea;
  vjs.H.call(this, a, b);
  c.f("cuechange", vjs.bind(this, this.update))
};
v(vjs.sa, vjs.H);
vjs.sa.prototype.o = function() {
  vjs.sa.i.o.call(this);
  this.a.currentTime(this.cue.startTime);
  this.update(this.cue.startTime)
};
vjs.sa.prototype.update = function() {
  var a = this.cue, b = this.a.currentTime();
  a.startTime <= b && b < a.Ea ? this.selected(g) : this.selected(j)
};
vjs.w(vjs.V.prototype.options.children, {subtitlesButton:{}, captionsButton:{}, chaptersButton:{}});
vjs.Kb = function() {
  var a, b, c = document.getElementsByTagName("video");
  if(c && 0 < c.length) {
    for(var d = 0, f = c.length;d < f;d++) {
      if((b = c[d]) && b.getAttribute) {
        b.a === e && (a = b.getAttribute("data-setup"), a !== h && (a = vjs.JSON.parse(a || "{}"), w(b, a)))
      }else {
        vjs.Lb();
        break
      }
    }
  }else {
    vjs.Vc || vjs.Lb()
  }
};
vjs.Lb = function() {
  setTimeout(vjs.Kb, 1)
};
vjs.G(window, "load", function() {
  vjs.Vc = g
});
vjs.Kb();
if(JSON && "function" === JSON.parse) {
  vjs.JSON = JSON
}else {
  vjs.JSON = {};
  var Y = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
  vjs.JSON.parse = function(a, b) {
    function c(a, d) {
      var k, p, n = a[d];
      if(n && "object" === typeof n) {
        for(k in n) {
          Object.prototype.hasOwnProperty.call(n, k) && (p = c(n, k), p !== e ? n[k] = p : delete n[k])
        }
      }
      return b.call(a, d, n)
    }
    var d;
    a = String(a);
    Y.lastIndex = 0;
    Y.test(a) && (a = a.replace(Y, function(a) {
      return"\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4)
    }));
    if(/^[\],:{}\s]*$/.test(a.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, "@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]").replace(/(?:^|:|,)(?:\s*\[)+/g, ""))) {
      return d = eval("(" + a + ")"), "function" === typeof b ? c({"":d}, "") : d
    }
    throw new SyntaxError("JSON.parse");
  }
}
;u("videojs", vjs);
u("_V_", vjs);
u("videojs.options", vjs.options);
u("videojs.cache", vjs.X);
u("videojs.Component", vjs.d);
vjs.d.prototype.dispose = vjs.d.prototype.p;
vjs.d.prototype.createEl = vjs.d.prototype.e;
vjs.d.prototype.getEl = vjs.d.prototype.hd;
vjs.d.prototype.addChild = vjs.d.prototype.K;
vjs.d.prototype.getChildren = vjs.d.prototype.gd;
vjs.d.prototype.on = vjs.d.prototype.f;
vjs.d.prototype.off = vjs.d.prototype.n;
vjs.d.prototype.one = vjs.d.prototype.G;
vjs.d.prototype.trigger = vjs.d.prototype.h;
vjs.d.prototype.show = vjs.d.prototype.show;
vjs.d.prototype.hide = vjs.d.prototype.A;
vjs.d.prototype.width = vjs.d.prototype.width;
vjs.d.prototype.height = vjs.d.prototype.height;
vjs.d.prototype.dimensions = vjs.d.prototype.tc;
u("videojs.Player", vjs.D);
u("videojs.MediaLoader", vjs.Ib);
u("videojs.PosterImage", vjs.ya);
u("videojs.LoadingSpinner", vjs.wa);
u("videojs.BigPlayButton", vjs.ca);
u("videojs.ControlBar", vjs.V);
u("videojs.TextTrackDisplay", vjs.Oa);
u("videojs.Control", vjs.da);
u("videojs.ControlBar", vjs.V);
u("videojs.Button", vjs.m);
u("videojs.PlayButton", vjs.ja);
u("videojs.PauseButton", vjs.ia);
u("videojs.PlayToggle", vjs.Ma);
u("videojs.FullscreenToggle", vjs.fa);
u("videojs.BigPlayButton", vjs.ca);
u("videojs.LoadingSpinner", vjs.wa);
u("videojs.CurrentTimeDisplay", vjs.ta);
u("videojs.DurationDisplay", vjs.ua);
u("videojs.TimeDivider", vjs.Pa);
u("videojs.RemainingTimeDisplay", vjs.Aa);
u("videojs.Slider", vjs.Q);
u("videojs.ProgressControl", vjs.za);
u("videojs.SeekBar", vjs.ka);
u("videojs.LoadProgressBar", vjs.va);
u("videojs.PlayProgressBar", vjs.La);
u("videojs.SeekHandle", vjs.Na);
u("videojs.VolumeControl", vjs.Ca);
u("videojs.VolumeBar", vjs.Ra);
u("videojs.VolumeLevel", vjs.Ta);
u("videojs.VolumeHandle", vjs.Sa);
u("videojs.MuteToggle", vjs.ha);
u("videojs.PosterImage", vjs.ya);
u("videojs.Menu", vjs.ga);
u("videojs.MenuItem", vjs.H);
u("videojs.SubtitlesButton", vjs.Ba);
u("videojs.CaptionsButton", vjs.ra);
u("videojs.ChaptersButton", vjs.lb);
u("videojs.MediaTechController", vjs.P);
u("videojs.Html5", vjs.k);
vjs.k.Events = vjs.k.ea;
vjs.k.isSupported = vjs.k.isSupported;
vjs.k.canPlaySource = vjs.k.pb;
vjs.k.prototype.setCurrentTime = vjs.k.prototype.Mc;
vjs.k.prototype.setVolume = vjs.k.prototype.Rc;
vjs.k.prototype.setMuted = vjs.k.prototype.Pc;
vjs.k.prototype.setPreload = vjs.k.prototype.Qc;
vjs.k.prototype.setAutoplay = vjs.k.prototype.Lc;
vjs.k.prototype.setLoop = vjs.k.prototype.Oc;
u("videojs.Flash", vjs.j);
vjs.j.Events = vjs.j.ea;
vjs.j.isSupported = vjs.j.isSupported;
vjs.j.canPlaySource = vjs.j.pb;
vjs.j.onReady = vjs.j.onReady;
u("videojs.TextTrack", vjs.z);
vjs.z.prototype.label = vjs.z.prototype.label;
u("videojs.CaptionsTrack", vjs.kb);
u("videojs.SubtitlesTrack", vjs.nb);
u("videojs.ChaptersTrack", vjs.mb);
module("Component");
test("should create an element", function() {
  var a = new vjs.d({}, {});
  ok(a.g().nodeName)
});
test("should add a child component", function() {
  var a = new vjs.d({}), b = a.K("component");
  ok(1 === a.children().length);
  ok(a.children()[0] === b);
  ok(a.g().childNodes[0] === b.g());
  ok(a.L.component === b);
  var c = ok, d = b.id();
  c(a.Va[d] === b)
});
test("should init child coponents from options", function() {
  var a = new vjs.d({}, {children:{component:g}});
  ok(1 === a.children().length);
  ok(1 === a.g().childNodes.length)
});
test("should dispose of component and children", function() {
  var a = new vjs.d({}), b = a.K("Component");
  ok(1 === a.children().length);
  a.f("click", q(g));
  var c = vjs.getData(a.g()), d = a.g()[vjs.expando];
  a.p();
  ok(!a.children(), "component children were deleted");
  ok(!a.g(), "component element was deleted");
  ok(!b.children(), "child children were deleted");
  ok(!b.g(), "child element was deleted");
  ok(!vjs.X[d], "listener cache nulled");
  ok(vjs.Ya(c), "original listener cache object was emptied")
});
test("should add and remove event listeners to element", function() {
  function a() {
    ok(g, "fired event once");
    ok(this === b, "listener has the component as context")
  }
  var b = new vjs.d({}, {});
  expect(2);
  b.f("test-event", a);
  b.h("test-event");
  b.n("test-event", a);
  b.h("test-event")
});
test("should trigger a listener once using one()", function() {
  var a = new vjs.d({}, {});
  expect(1);
  a.G("test-event", function() {
    ok(g, "fired event once")
  });
  a.h("test-event");
  a.h("test-event")
});
test("should trigger a listener when ready", function() {
  expect(2);
  var a = new vjs.d({}, {}, function() {
    ok(g, "options listener fired")
  });
  A(a);
  a.N(function() {
    ok(g, "ready method listener fired")
  });
  A(a)
});
test("should add and remove a CSS class", function() {
  var a = new vjs.d({}, {});
  a.q("test-class");
  ok(-1 !== a.g().className.indexOf("test-class"));
  a.B("test-class");
  ok(-1 === a.g().className.indexOf("test-class"))
});
test("should show and hide an element", function() {
  var a = new vjs.d({}, {});
  a.A();
  ok("none" === a.g().style.display);
  a.show();
  ok("block" === a.g().style.display)
});
test("should change the width and height of a component", function() {
  var a = document.createElement("div"), b = new vjs.d({}, {}), c = b.g();
  document.getElementById("qunit-fixture").appendChild(a);
  a.appendChild(c);
  a.style.width = "1000px";
  a.style.height = "1000px";
  b.width("50%");
  b.height("123px");
  ok(500 === b.width(), "percent values working");
  ok(vjs.wb(c, "width") === b.width() + "px", "matches computed style");
  ok(123 === b.height(), "px values working");
  b.width(321);
  ok(321 === b.width(), "integer values working")
});
module("Lib");
test("should create an element", function() {
  var a = vjs.e(), b = vjs.e("span", {"data-test":"asdf", innerHTML:"fdsa"});
  ok("DIV" === a.nodeName);
  ok("SPAN" === b.nodeName);
  ok("asdf" === b["data-test"]);
  ok("fdsa" === b.innerHTML)
});
test("should make a string start with an uppercase letter", function() {
  var a = vjs.S("bar");
  ok("Bar" === a)
});
test("should loop through each property on an object", function() {
  var a = {nc:1, oc:2, c:3};
  vjs.Da(a, function(b, c) {
    a[b] = c + 3
  });
  deepEqual(a, {nc:4, oc:5, c:6})
});
test("should add context to a function", function() {
  var a = {test:"obj"};
  vjs.bind(a, function() {
    ok(this === a)
  })()
});
test("should add and remove a class name on an element", function() {
  var a = document.createElement("div");
  vjs.q(a, "test-class");
  ok("test-class" === a.className, "class added");
  vjs.q(a, "test-class");
  ok("test-class" === a.className, "same class not duplicated");
  vjs.q(a, "test-class2");
  ok("test-class test-class2" === a.className, "added second class");
  vjs.B(a, "test-class");
  ok("test-class2" === a.className, "removed first class")
});
test("should get and remove data from an element", function() {
  var a = document.createElement("div"), b = vjs.getData(a), c = a[vjs.expando];
  ok("object" === typeof b, "data object created");
  var d = {Zc:"fdsa"};
  b.test = d;
  ok(vjs.getData(a).test === d, "data added");
  vjs.Gb(a);
  ok(!vjs.X[c], "cached item nulled");
  ok(a[vjs.expando] === h || a[vjs.expando] === e, "element data id removed")
});
test("should read tag attributes from elements, including HTML5 in all browsers", function() {
  var a = document.createElement("div"), b;
  b = '<video id="vid1" controls autoplay loop muted preload="none" src="http://google.com" poster="http://www2.videojs.com/img/video-js-html5-video-player.png" data-test="asdf" data-empty-string=""></video><video id="vid2"><source id="source" src="http://google.com" type="video/mp4" media="fdsa" title="test" >';
  b += '<track id="track" default src="http://google.com" kind="captions" srclang="en" label="testlabel" title="test" >';
  a.innerHTML += b;
  document.getElementById("qunit-fixture").appendChild(a);
  a = vjs.Y(document.getElementById("vid2"));
  b = vjs.Y(document.getElementById("source"));
  var c = vjs.Y(document.getElementById("track"));
  deepEqual(vjs.Y(document.getElementById("vid1")), {autoplay:g, controls:g, "data-test":"asdf", "data-empty-string":"", id:"vid1", loop:g, muted:g, poster:"http://www2.videojs.com/img/video-js-html5-video-player.png", preload:"none", src:"http://google.com"});
  deepEqual(a, {id:"vid2"});
  deepEqual(b, {title:"test", media:"fdsa", type:"video/mp4", src:"http://google.com", id:"source"});
  deepEqual(c, {"default":g, id:"track", kind:"captions", label:"testlabel", src:"http://google.com", srclang:"en", title:"test"})
});
test("should get the right style values for an element", function() {
  var a = document.createElement("div"), b = document.createElement("div"), c = document.getElementById("qunit-fixture");
  b.appendChild(a);
  c.appendChild(b);
  b.style.width = "1000px";
  b.style.height = "1000px";
  a.style.height = "100%";
  a.style.width = "123px";
  ok("1000px" === vjs.wb(a, "height"));
  ok("123px" === vjs.wb(a, "width"))
});
test("should insert an element first in another", function() {
  var a = document.createElement("div"), b = document.createElement("div"), c = document.createElement("div");
  vjs.Fa(a, c);
  ok(c.firstChild === a, "inserts first into empty parent");
  vjs.Fa(b, c);
  ok(c.firstChild === b, "inserts first into parent with child")
});
test("should return the element with the ID", function() {
  var a = document.createElement("div"), b = document.createElement("div"), c = document.getElementById("qunit-fixture");
  c.appendChild(a);
  c.appendChild(b);
  a.id = "test_id1";
  b.id = "test_id2";
  ok(vjs.g("test_id1") === a, "found element for ID");
  ok(vjs.g("#test_id2") === b, "found element for CSS ID")
});
test("should trim whitespace from a string", function() {
  ok("asdf asdf asdf" === vjs.trim(" asdf asdf asdf   \t\n\r"))
});
test("should round a number", function() {
  ok(1 === vjs.round(1.01));
  ok(2 === vjs.round(1.5));
  ok(1.55 === vjs.round(1.55, 2));
  ok(10.55 === vjs.round(10.551, 2))
});
test("should format time as a string", function() {
  ok("0:01" === vjs.s(1));
  ok("0:10" === vjs.s(10));
  ok("1:00" === vjs.s(60));
  ok("10:00" === vjs.s(600));
  ok("1:00:00" === vjs.s(3600));
  ok("10:00:00" === vjs.s(36E3));
  ok("100:00:00" === vjs.s(36E4));
  ok("0:01" === vjs.s(1, 1));
  ok("0:01" === vjs.s(1, 10));
  ok("0:01" === vjs.s(1, 60));
  ok("00:01" === vjs.s(1, 600));
  ok("0:00:01" === vjs.s(1, 3600));
  ok("0:00:01" === vjs.s(1, 36E3));
  ok("0:00:01" === vjs.s(1, 36E4))
});
test("should create a fake timerange", function() {
  var a = vjs.sb(10);
  ok(0 === a.start());
  ok(10 === a.end())
});
test("should get an absolute URL", function() {
  ok("http://asdf.com" === vjs.Xa("http://asdf.com"));
  ok("https://asdf.com/index.html" === vjs.Xa("https://asdf.com/index.html"))
});
module("Events");
test("should add and remove an event listener to an element", function() {
  function a() {
    ok(g, "Click Triggered")
  }
  expect(1);
  var b = document.createElement("div");
  vjs.f(b, "click", a);
  vjs.h(b, "click");
  vjs.n(b, "click", a);
  vjs.h(b, "click")
});
test("should remove all listeners of a type", function() {
  var a = document.createElement("div"), b = 0;
  vjs.f(a, "click", function() {
    b++
  });
  vjs.f(a, "click", function() {
    b++
  });
  vjs.h(a, "click");
  ok(2 === b, "both click listeners fired");
  vjs.n(a, "click");
  vjs.h(a, "click");
  ok(2 === b, "no click listeners fired")
});
test("should remove all listeners from an element", function() {
  expect(2);
  var a = document.createElement("div");
  vjs.f(a, "fake1", function() {
    ok(g, "Fake1 Triggered")
  });
  vjs.f(a, "fake2", function() {
    ok(g, "Fake2 Triggered")
  });
  vjs.h(a, "fake1");
  vjs.h(a, "fake2");
  vjs.n(a);
  vjs.h(a, "fake1");
  vjs.h(a, "fake2")
});
test("should listen only once", function() {
  expect(1);
  var a = document.createElement("div");
  vjs.G(a, "click", function() {
    ok(g, "Click Triggered")
  });
  vjs.h(a, "click");
  vjs.h(a, "click")
});
module("Player");
function Z() {
  var a = document.createElement("video");
  a.id = "example_1";
  a.className = "video-js vjs-default-skin";
  return a
}
function $(a) {
  var b = Z();
  document.getElementById("qunit-fixture").appendChild(b);
  return player = new vjs.D(b, a)
}
test("should create player instance that inherits from component and dispose it", function() {
  var a = $();
  ok("DIV" === a.g().nodeName);
  ok(a.f, "component function exists");
  a.p();
  ok(a.g() === h, "element disposed")
});
test("should accept options from multiple sources and override in correct order", function() {
  vjs.options.attr = 1;
  var a = Z(), a = new vjs.D(a);
  ok(1 === a.options.attr, "global option was set");
  a.p();
  a = Z();
  a.setAttribute("attr", "asdf");
  a = new vjs.D(a);
  ok("asdf" === a.options.attr, "Tag options overrode global options");
  a.p();
  a = Z();
  a.setAttribute("attr", "asdf");
  a = new vjs.D(a, {attr:"fdsa"});
  ok("fdsa" === a.options.attr, "Init options overrode tag and global options");
  a.p()
});
test("should get tag, source, and track settings", function() {
  var a = document.getElementById("qunit-fixture"), b;
  b = '<video id="example_1" class="video-js" autoplay preload="metadata"><source src="http://google.com" type="video/mp4"><source src="http://google.com" type="video/webm">';
  b += '<track src="http://google.com" kind="captions" default>';
  b += "</video>";
  a.innerHTML += b;
  a = document.getElementById("example_1");
  b = new vjs.D(a);
  ok(b.options.autoplay === g);
  ok("metadata" === b.options.preload);
  ok("example_1" === b.options.id);
  ok(2 === b.options.sources.length);
  ok("http://google.com" === b.options.sources[0].src);
  ok("video/mp4" === b.options.sources[0].type);
  ok("video/webm" === b.options.sources[1].type);
  ok(1 === b.options.tracks.length);
  ok("captions" === b.options.tracks[0].kind);
  ok(b.options.tracks[0]["default"] === g);
  ok(-1 !== b.g().className.indexOf("video-js"), "transferred class from tag to player div");
  ok("example_1" === b.g().id, "transferred id from tag to player div");
  ok(a.a === b, "player referenceable on original tag");
  ok(vjs.$[b.id()] === b, "player referenceable from global list");
  ok(a.id !== b.id, "tag ID no longer is the same as player ID");
  ok(a.className !== b.g().className, "tag classname updated");
  b.p();
  ok(a.a === h, "tag player ref killed");
  ok(!vjs.$.example_1, "global player ref killed");
  ok(b.g() === h, "player el killed")
});
test("should set the width and height of the player", function() {
  var a = $({width:123, height:"100%"});
  ok(123 === a.width());
  ok("123px" === a.g().style.width);
  var b = document.getElementById("qunit-fixture"), c = document.createElement("div");
  b.appendChild(c);
  c.appendChild(a.g());
  c.style.height = "1000px";
  ok(1E3 === a.height());
  a.p()
});
test("should accept options from multiple sources and override in correct order", function() {
  var a = Z(), b = document.createElement("div"), c = document.getElementById("qunit-fixture");
  b.appendChild(a);
  c.appendChild(b);
  var c = new vjs.D(a), d = c.g();
  ok(d.parentNode === b, "player placed at same level as tag");
  ok(a.parentNode !== b, "tag removed from original place");
  c.p()
});
test("should load a media controller", function() {
  var a = $({Ia:"none", nd:[{src:"http://google.com", type:"video/mp4"}, {src:"http://google.com", type:"video/webm"}]});
  ok(-1 !== a.g().children[0].className.indexOf("vjs-tech"), "media controller loaded");
  a.p()
});
module("Setup");
module("Core");
test("should create a video tag and have access children in old IE", function() {
  document.getElementById("qunit-fixture").innerHTML += "<video id='test_vid_id'><source type='video/mp4'></video>";
  vid = document.getElementById("test_vid_id");
  ok(1 === vid.childNodes.length);
  ok("video/mp4" === vid.childNodes[0].getAttribute("type"))
});
test("should return a video player instance", function() {
  document.getElementById("qunit-fixture").innerHTML += "<video id='test_vid_id'></video><video id='test_vid_id2'></video>";
  var a = w("test_vid_id");
  ok(a, "created player from tag");
  ok("test_vid_id" === a.id());
  ok(w.$.test_vid_id === a, "added player to global reference");
  var b = w("test_vid_id");
  ok(a === b, "did not create a second player from same tag");
  a = w(document.getElementById("test_vid_id2"));
  ok("test_vid_id2" === a.id(), "created player from element")
});
})();//@ sourceMappingURL=video.test.compiled.js.map
