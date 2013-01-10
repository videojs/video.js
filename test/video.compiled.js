(function() {var e = void 0, g = !0, h = null, k = !1;
function n(a) {
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
t.Sc = g;
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
  a.f = b.prototype;
  a.prototype = new c;
  a.prototype.constructor = a
}
;document.createElement("video");
document.createElement("audio");
var aa = vjs = function(a, b, c) {
  if("string" === typeof a) {
    0 === a.indexOf("#") && (a = a.slice(1));
    if(vjs.Va[a]) {
      return vjs.Va[a]
    }
    a = vjs.j(a)
  }
  if(!a || !a.nodeName) {
    throw new TypeError("The element or ID supplied is not valid. (videojs)");
  }
  return a.a || new vjs.ea(a, b, c)
};
vjs.options = {techOrder:["html5", "flash"], html5:{}, flash:{jd:"http://vjs.zencdn.net/c/video-js.swf"}, width:300, height:150, defaultVolume:0, children:{mediaLoader:{}, posterImage:{}, textTrackDisplay:{}, loadingSpinner:{}, bigPlayButton:{}, controlBar:{}}};
vjs.Va = {};
vjs.d = function(a, b) {
  var c = document.createElement(a || "div"), d;
  for(d in b) {
    b.hasOwnProperty(d) && (c[d] = b[d])
  }
  return c
};
vjs.T = function(a) {
  return a.charAt(0).toUpperCase() + a.slice(1)
};
vjs.Oa = function(a, b) {
  if(a) {
    for(var c in a) {
      a.hasOwnProperty(c) && b.call(this, c, a[c])
    }
  }
};
vjs.s = function(a, b) {
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
  b.p || (b.p = vjs.p++);
  d.p = c ? c + "_" + b.p : b.p;
  return d
};
vjs.ya = {};
vjs.p = 1;
vjs.expando = "vdata" + (new Date).getTime();
vjs.getData = function(a) {
  var b = a[vjs.expando];
  b || (b = a[vjs.expando] = vjs.p++, vjs.ya[b] = {});
  return vjs.ya[b]
};
vjs.Sb = function(a) {
  a = a[vjs.expando];
  return!(!a || vjs.sb(vjs.ya[a]))
};
vjs.Xb = function(a) {
  var b = a[vjs.expando];
  if(b) {
    delete vjs.ya[b];
    try {
      delete a[vjs.expando]
    }catch(c) {
      a.removeAttribute ? a.removeAttribute(vjs.expando) : a[vjs.expando] = h
    }
  }
};
vjs.sb = function(a) {
  for(var b in a) {
    if(a[b] !== h) {
      return k
    }
  }
  return g
};
vjs.u = function(a, b) {
  -1 == (" " + a.className + " ").indexOf(" " + b + " ") && (a.className = "" === a.className ? b : a.className + " " + b)
};
vjs.z = function(a, b) {
  if(-1 != a.className.indexOf(b)) {
    var c = a.className.split(" ");
    c.splice(c.indexOf(b), 1);
    a.className = c.join(" ")
  }
};
vjs.kc = document.createElement("video");
vjs.Ja = navigator.userAgent;
vjs.ic = !!navigator.userAgent.match(/iPad/i);
vjs.hc = !!navigator.userAgent.match(/iPhone/i);
vjs.jc = !!navigator.userAgent.match(/iPod/i);
vjs.gc = vjs.ic || vjs.hc || vjs.jc;
var ba = vjs, w;
var x = navigator.userAgent.match(/OS (\d+)_/i);
w = x && x[1] ? x[1] : e;
ba.Tc = w;
vjs.ec = !!navigator.userAgent.match(/Android.*AppleWebKit/i);
var ca = vjs, y = navigator.userAgent.match(/Android (\d+)\./i);
ca.dc = y && y[1] ? y[1] : h;
vjs.fc = function() {
  return!!vjs.Ja.match("Firefox")
};
vjs.qb = function(a) {
  var b = {};
  if(a && a.attributes && 0 < a.attributes.length) {
    for(var c = a.attributes, d, f, l = c.length - 1;0 <= l;l--) {
      d = c[l].name;
      f = c[l].value;
      if("boolean" === typeof a[d] || -1 !== ",autoplay,controls,loop,muted,default,".indexOf("," + d + ",")) {
        f = f !== h ? g : k
      }
      b[d] = f
    }
  }
  return b
};
vjs.cd = function(a, b) {
  var c = "";
  document.defaultView && document.defaultView.getComputedStyle ? c = document.defaultView.getComputedStyle(a, "").getPropertyValue(b) : a.currentStyle && (b = b.replace(/\-(\w)/g, function(a, b) {
    return b.toUpperCase()
  }), c = a.currentStyle[b]);
  return c
};
vjs.rb = function(a, b) {
  b.firstChild ? b.insertBefore(a, b.firstChild) : b.appendChild(a)
};
vjs.Cb = {};
vjs.j = function(a) {
  0 === a.indexOf("#") && (a = a.slice(1));
  return document.getElementById(a)
};
vjs.pb = function(a, b) {
  b = b || a;
  var c = Math.floor(a % 60), d = Math.floor(a / 60 % 60), f = Math.floor(a / 3600), l = Math.floor(b / 60 % 60), j = Math.floor(b / 3600), f = 0 < f || 0 < j ? f + ":" : "";
  return f + (((f || 10 <= l) && 10 > d ? "0" + d : d) + ":") + (10 > c ? "0" + c : c)
};
vjs.mc = function() {
  document.body.focus();
  document.onselectstart = q(k)
};
vjs.Oc = function() {
  document.onselectstart = q(g)
};
vjs.trim = function(a) {
  return a.toString().replace(/^\s+/, "").replace(/\s+$/, "")
};
vjs.round = function(a, b) {
  b || (b = 0);
  return Math.round(a * Math.pow(10, b)) / Math.pow(10, b)
};
vjs.Jb = function(a) {
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
  }catch(l) {
    c(l)
  }
  f.onreadystatechange = function() {
    4 === f.readyState && (200 === f.status || d && 0 === f.status ? b(f.responseText) : c && c())
  };
  try {
    f.send()
  }catch(j) {
    c && c(j)
  }
};
vjs.Jc = function(a) {
  var b = window.localStorage || k;
  if(b) {
    try {
      b.volume = a
    }catch(c) {
      22 == c.code || 1014 == c.code ? vjs.log("LocalStorage Full (VideoJS)", c) : vjs.log("LocalStorage Error (VideoJS)", c)
    }
  }
};
vjs.Pb = function(a) {
  a.match(/^https?:\/\//) || (a = vjs.d("div", {innerHTML:'<a href="' + a + '">x</a>'}).firstChild.href);
  return a
};
vjs.log = function() {
  vjs.log.history = vjs.log.history || [];
  vjs.log.history.push(arguments);
  window.console && window.console.log(Array.prototype.slice.call(arguments))
};
vjs.sc = "getBoundingClientRect" in document.documentElement ? function(a) {
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
vjs.e = function(a, b, c) {
  var d = vjs.getData(a);
  d.q || (d.q = {});
  d.q[b] || (d.q[b] = []);
  c.p || (c.p = vjs.p++);
  d.q[b].push(c);
  d.N || (d.disabled = k, d.N = function(b) {
    if(!d.disabled) {
      b = vjs.Mb(b);
      var c = d.q[b.type];
      if(c) {
        for(var j = [], p = 0, m = c.length;p < m;p++) {
          j[p] = c[p]
        }
        c = 0;
        for(p = j.length;c < p;c++) {
          j[c].call(a, b)
        }
      }
    }
  });
  1 == d.q[b].length && (document.addEventListener ? a.addEventListener(b, d.N, k) : document.attachEvent && a.attachEvent("on" + b, d.N))
};
vjs.o = function(a, b, c) {
  if(vjs.Sb(a)) {
    var d = vjs.getData(a);
    if(d.q) {
      if(b) {
        var f = d.q[b];
        if(f) {
          if(c) {
            if(c.p) {
              for(d = 0;d < f.length;d++) {
                f[d].p === c.p && f.splice(d--, 1)
              }
            }
          }else {
            d.q[b] = []
          }
          vjs.Hb(a, b)
        }
      }else {
        for(f in d.q) {
          b = f, d.q[b] = [], vjs.Hb(a, b)
        }
      }
    }
  }
};
vjs.Hb = function(a, b) {
  var c = vjs.getData(a);
  0 === c.q[b].length && (delete c.q[b], document.removeEventListener ? a.removeEventListener(b, c.N, k) : document.detachEvent && a.detachEvent("on" + b, c.N));
  vjs.sb(c.q) && (delete c.q, delete c.N, delete c.disabled);
  vjs.sb(c) && vjs.Xb(a)
};
vjs.Mb = function(a) {
  function b() {
    return g
  }
  function c() {
    return k
  }
  if(!a || !a.tb) {
    var d = a || window.event, f;
    for(f in d) {
      a[f] = d[f]
    }
    a.target || (a.target = a.srcElement || document);
    a.relatedTarget = a.fromElement === a.target ? a.toElement : a.fromElement;
    a.preventDefault = function() {
      a.returnValue = k;
      a.Tb = b
    };
    a.Tb = c;
    a.stopPropagation = function() {
      a.cancelBubble = g;
      a.tb = b
    };
    a.tb = c;
    a.stopImmediatePropagation = function() {
      a.vc = b;
      a.stopPropagation()
    };
    a.vc = c;
    a.clientX != h && (d = document.documentElement, f = document.body, a.pageX = a.clientX + (d && d.scrollLeft || f && f.scrollLeft || 0) - (d && d.clientLeft || f && f.clientLeft || 0), a.pageY = a.clientY + (d && d.scrollTop || f && f.scrollTop || 0) - (d && d.clientTop || f && f.clientTop || 0));
    a.which = a.charCode || a.keyCode;
    a.button != h && (a.button = a.button & 1 ? 0 : a.button & 4 ? 1 : a.button & 2 ? 2 : 0)
  }
  return a
};
vjs.i = function(a, b) {
  var c = vjs.Sb(a) ? vjs.getData(a) : {}, d = a.parentNode || a.ownerDocument;
  "string" === typeof b && (b = {type:b, target:a});
  b = vjs.Mb(b);
  c.N && c.N.call(a, b);
  if(d && !b.tb()) {
    vjs.i(d, b)
  }else {
    if(!d && !b.Tb() && (c = vjs.getData(b.target), b.target[b.type])) {
      c.disabled = g;
      if("function" === typeof b.target[b.type]) {
        b.target[b.type]()
      }
      c.disabled = k
    }
  }
};
vjs.H = function(a, b, c) {
  vjs.e(a, b, function() {
    vjs.o(a, b, arguments.callee);
    c.apply(this, arguments)
  })
};
vjs.c = function(a, b, c) {
  this.a = a;
  b = this.options = vjs.s(this.options || {}, b);
  this.O = b.id || (b.j && b.j.id ? b.j.id : a.id + "_component_" + vjs.p++);
  this.zc = b.name || h;
  this.b = b.j ? b.j : this.d();
  this.C = [];
  this.kb = {};
  this.M = {};
  if((a = this.options) && a.children) {
    var d = this;
    vjs.Oa(a.children, function(a, b) {
      b !== k && !b.xc && (d[a] = d.R(a, b))
    })
  }
  this.P(c)
};
r = vjs.c.prototype;
r.D = function() {
  if(this.C) {
    for(var a = this.C.length - 1;0 <= a;a--) {
      this.C[a].D()
    }
  }
  this.M = this.kb = this.C = h;
  this.o();
  this.b.parentNode && this.b.parentNode.removeChild(this.b);
  vjs.Xb(this.b);
  this.b = h
};
r.d = function(a, b) {
  return vjs.d(a, b)
};
r.j = n("b");
r.id = n("O");
r.name = n("zc");
r.children = n("C");
r.R = function(a, b) {
  var c, d, f;
  "string" === typeof a ? (d = a, b = b || {}, c = b.Yc || vjs.T(d), b.name = d, c = new window.videojs[c](this.a || this, b)) : c = a;
  d = c.name();
  f = c.id();
  this.C.push(c);
  f && (this.kb[f] = c);
  d && (this.M[d] = c);
  this.b.appendChild(c.j());
  return c
};
r.removeChild = function(a) {
  "string" === typeof a && (a = this.M[a]);
  if(a && this.C) {
    for(var b = k, c = this.C.length - 1;0 <= c;c--) {
      if(this.C[c] === a) {
        b = g;
        this.C.splice(c, 1);
        break
      }
    }
    b && (this.kb[a.id] = h, this.M[a.name] = h, (b = a.j()) && b.parentNode === this.b && this.b.removeChild(a.j()))
  }
};
r.v = q("");
r.e = function(a, b) {
  vjs.e(this.b, a, vjs.bind(this, b));
  return this
};
r.o = function(a, b) {
  vjs.o(this.b, a, b);
  return this
};
r.H = function(a, b) {
  vjs.H(this.b, a, vjs.bind(this, b));
  return this
};
r.i = function(a, b) {
  vjs.i(this.b, a, b);
  return this
};
r.P = function(a) {
  a && (this.ia ? a.call(this) : (this.Ya === e && (this.Ya = []), this.Ya.push(a)));
  return this
};
function z(a) {
  a.ia = g;
  var b = a.Ya;
  if(b && 0 < b.length) {
    for(var c = 0, d = b.length;c < d;c++) {
      b[c].call(a)
    }
    a.Ya = [];
    a.i("ready")
  }
}
r.u = function(a) {
  vjs.u(this.b, a);
  return this
};
r.z = function(a) {
  vjs.z(this.b, a);
  return this
};
r.show = function() {
  this.b.style.display = "block";
  return this
};
r.w = function() {
  this.b.style.display = "none";
  return this
};
r.Pa = function() {
  this.z("vjs-fade-out");
  this.u("vjs-fade-in");
  return this
};
r.nb = function() {
  this.z("vjs-fade-in");
  this.u("vjs-fade-out");
  return this
};
r.Ub = function() {
  var a = this.b.style;
  a.display = "block";
  a.opacity = 1;
  a.Qc = "visible";
  return this
};
function A(a) {
  a = a.b.style;
  a.display = "";
  a.opacity = "";
  a.Qc = ""
}
r.width = function(a, b) {
  return B(this, "width", a, b)
};
r.height = function(a, b) {
  return B(this, "height", a, b)
};
r.pc = function(a, b) {
  return this.width(a, g).height(b)
};
function B(a, b, c, d) {
  if(c !== e) {
    return a.b.style[b] = -1 !== ("" + c).indexOf("%") || -1 !== ("" + c).indexOf("px") ? c : c + "px", d || a.i("resize"), a
  }
  if(!a.b) {
    return 0
  }
  c = a.b.style[b];
  d = c.indexOf("px");
  return-1 !== d ? parseInt(c.slice(0, d), 10) : parseInt(a.b["offset" + vjs.T(b)], 10)
}
;vjs.ea = function(a, b, c) {
  this.I = a;
  var d = {};
  vjs.s(d, vjs.options);
  vjs.s(d, da(a));
  vjs.s(d, b);
  this.n = {};
  vjs.c.call(this, this, d, c);
  this.e("ended", this.Bc);
  this.e("play", this.Ab);
  this.e("pause", this.zb);
  this.e("progress", this.Cc);
  this.e("durationchange", this.Ac);
  this.e("error", this.xb);
  vjs.Va[this.O] = this
};
v(vjs.ea, vjs.c);
r = vjs.ea.prototype;
r.D = function() {
  vjs.Va[this.O] = h;
  this.I && this.I.a && (this.I.a = h);
  this.b && this.b.a && (this.b.a = h);
  clearInterval(this.Xa);
  this.k && this.k.D();
  vjs.ea.f.D.call(this)
};
function da(a) {
  var b = {sources:[], tracks:[]};
  vjs.s(b, vjs.qb(a));
  if(a.hasChildNodes()) {
    for(var c, d = a.childNodes, f = 0, l = d.length;f < l;f++) {
      a = d[f], c = a.nodeName.toLowerCase(), "source" === c ? b.sources.push(vjs.qb(a)) : "track" === c && b.tracks.push(vjs.qb(a))
    }
  }
  return b
}
r.d = function() {
  var a = this.b = vjs.ea.f.d.call(this, "div"), b = this.I;
  b.removeAttribute("controls");
  b.removeAttribute("poster");
  b.removeAttribute("width");
  b.removeAttribute("height");
  if(b.hasChildNodes()) {
    for(var c = b.childNodes.length, d = 0, f = b.childNodes;d < c;d++) {
      ("source" == f[0].nodeName.toLowerCase() || "track" == f[0].nodeName.toLowerCase()) && b.removeChild(f[0])
    }
  }
  b.id = b.id || "vjs_video_" + vjs.p++;
  a.id = b.id;
  a.className = b.className;
  b.id += "_html5_api";
  b.className = "vjs-tech";
  b.a = a.a = this;
  this.u("vjs-paused");
  this.width(this.options.width, g);
  this.height(this.options.height, g);
  b.parentNode && b.parentNode.insertBefore(a, b);
  vjs.rb(b, a);
  return a
};
function C(a, b, c) {
  a.k ? D(a) : "Html5" !== b && a.I && (a.b.removeChild(a.I), a.I = h);
  a.V = b;
  a.ia = k;
  var d = vjs.s({source:c, Dc:a.b}, a.options[b.toLowerCase()]);
  c && (c.src == a.n.src && 0 < a.n.currentTime && (d.startTime = a.n.currentTime), a.n.src = c.src);
  a.k = new window.videojs[b](a, d);
  a.k.P(function() {
    z(this.a);
    if(!this.G.Wb) {
      var a = this.a;
      a.vb = g;
      a.Xa = setInterval(vjs.bind(a, function() {
        this.n.hb < this.buffered().end(0) ? this.i("progress") : 1 == E(this) && (clearInterval(this.Xa), this.i("progress"))
      }), 500);
      a.k.H("progress", function() {
        this.G.Wb = g;
        var a = this.a;
        a.vb = k;
        clearInterval(a.Xa)
      })
    }
    this.G.bc || (a = this.a, a.wb = g, a.e("play", a.cc), a.e("pause", a.$a), a.k.H("timeupdate", function() {
      this.G.bc = g;
      F(this.a)
    }))
  })
}
function D(a) {
  a.k.D();
  a.vb && (a.vb = k, clearInterval(a.Xa));
  a.wb && F(a);
  a.k = k
}
function F(a) {
  a.wb = k;
  a.$a();
  a.o("play", a.cc);
  a.o("pause", a.$a)
}
r.cc = function() {
  this.Kb && this.$a();
  this.Kb = setInterval(vjs.bind(this, function() {
    this.i("timeupdate")
  }), 250)
};
r.$a = function() {
  clearInterval(this.Kb)
};
r.Bc = function() {
  this.options.loop && (this.currentTime(0), this.play())
};
r.Ab = function() {
  vjs.z(this.b, "vjs-paused");
  vjs.u(this.b, "vjs-playing")
};
r.zb = function() {
  vjs.z(this.b, "vjs-playing");
  vjs.u(this.b, "vjs-paused")
};
r.Cc = function() {
  1 == E(this) && this.i("loadedalldata")
};
r.Ac = function() {
  this.duration(G(this, "duration"))
};
r.xb = function(a) {
  vjs.log("Video Error", a)
};
function H(a, b, c) {
  if(a.k.ia) {
    try {
      a.k[b](c)
    }catch(d) {
      vjs.log(d)
    }
  }else {
    a.k.P(function() {
      this[b](c)
    })
  }
}
function G(a, b) {
  if(a.k.ia) {
    try {
      return a.k[b]()
    }catch(c) {
      if(a.k[b] === e) {
        vjs.log("Video.js: " + b + " method not defined for " + a.V + " playback technology.", c)
      }else {
        if("TypeError" == c.name) {
          throw vjs.log("Video.js: " + b + " unavailable on " + a.V + " playback technology element.", c), a.k.ia = k, c;
        }
        vjs.log(c)
      }
    }
  }
}
r.play = function() {
  H(this, "play");
  return this
};
r.pause = function() {
  H(this, "pause");
  return this
};
r.paused = function() {
  return G(this, "paused") === k ? k : g
};
r.currentTime = function(a) {
  return a !== e ? (this.n.gd = a, H(this, "setCurrentTime", a), this.wb && this.i("timeupdate"), this) : this.n.currentTime = G(this, "currentTime") || 0
};
r.duration = function(a) {
  return a !== e ? (this.n.duration = parseFloat(a), this) : this.n.duration
};
r.buffered = function() {
  var a = G(this, "buffered"), b = this.n.hb = this.n.hb || 0;
  a && (0 < a.length && a.end(0) !== b) && (b = a.end(0), this.n.hb = b);
  return vjs.Jb(b)
};
function E(a) {
  return a.duration() ? a.buffered().end(0) / a.duration() : 0
}
r.volume = function(a) {
  if(a !== e) {
    return a = Math.max(0, Math.min(1, parseFloat(a))), this.n.volume = a, H(this, "setVolume", a), vjs.Jc(a), this
  }
  a = parseFloat(G(this, "volume"));
  return isNaN(a) ? 1 : a
};
r.muted = function(a) {
  return a !== e ? (H(this, "setMuted", a), this) : G(this, "muted") || k
};
r.ab = function() {
  return G(this, "supportsFullScreen") || k
};
r.Za = function() {
  var a = vjs.Cb.Za;
  this.U = g;
  a ? (vjs.e(document, a.ha, vjs.bind(this, function() {
    this.U = document[a.U];
    this.U === k && vjs.o(document, a.ha, arguments.callee);
    this.i("fullscreenchange")
  })), this.k.G.Ob === k && this.options.flash.iFrameMode !== g && (this.pause(), D(this), vjs.e(document, a.ha, vjs.bind(this, function() {
    vjs.o(document, a.ha, arguments.callee);
    C(this, this.V, {src:this.n.src})
  }))), this.b[a.Fc]()) : this.k.ab() ? (this.i("fullscreenchange"), H(this, "enterFullScreen")) : (this.i("fullscreenchange"), this.uc = g, this.qc = document.documentElement.style.overflow, vjs.e(document, "keydown", vjs.bind(this, this.Nb)), document.documentElement.style.overflow = "hidden", vjs.u(document.body, "vjs-full-window"), vjs.u(this.b, "vjs-fullscreen"), this.i("enterFullWindow"));
  return this
};
function I(a) {
  var b = vjs.Cb.Za;
  a.U = k;
  b ? (a.k.G.Ob === k && a.options.flash.iFrameMode !== g && (a.pause(), D(a), vjs.e(document, b.ha, vjs.bind(a, function() {
    vjs.o(document, b.ha, arguments.callee);
    C(this, this.V, {src:this.n.src})
  }))), document[b.nc]()) : (a.k.ab() ? H(a, "exitFullScreen") : J(a), a.i("fullscreenchange"))
}
r.Nb = function(a) {
  27 === a.keyCode && (this.U === g ? I(this) : J(this))
};
function J(a) {
  a.uc = k;
  vjs.o(document, "keydown", a.Nb);
  document.documentElement.style.overflow = a.qc;
  vjs.z(document.body, "vjs-full-window");
  vjs.z(a.b, "vjs-fullscreen");
  a.i("exitFullWindow")
}
r.src = function(a) {
  if(a instanceof Array) {
    var b;
    a: {
      b = a;
      for(var c = 0, d = this.options.techOrder;c < d.length;c++) {
        var f = vjs.T(d[c]), l = window.videojs[f];
        if(l.isSupported()) {
          for(var j = 0, p = b;j < p.length;j++) {
            var m = p[j];
            if(l.canPlaySource(m)) {
              b = {source:m, k:f};
              break a
            }
          }
        }
      }
      b = k
    }
    b ? (a = b.source, b = b.k, b == this.V ? this.src(a) : C(this, b, a)) : vjs.log("No compatible source and media technology were found.")
  }else {
    a instanceof Object ? window.videojs[this.V].canPlaySource(a) ? this.src(a.src) : this.src([a]) : (this.n.src = a, this.ia ? (H(this, "src", a), "auto" == this.options.preload && this.load(), this.options.autoplay && this.play()) : this.P(function() {
      this.src(a)
    }))
  }
  return this
};
r.load = function() {
  H(this, "load");
  return this
};
r.currentSrc = function() {
  return G(this, "currentSrc") || this.n.src || ""
};
r.Wa = function(a) {
  return a !== e ? (H(this, "setPreload", a), this.options.preload = a, this) : G(this, "preload")
};
r.autoplay = function(a) {
  return a !== e ? (H(this, "setAutoplay", a), this.options.autoplay = a, this) : G(this, "autoplay")
};
r.loop = function(a) {
  return a !== e ? (H(this, "setLoop", a), this.options.loop = a, this) : G(this, "loop")
};
r.controls = function() {
  return this.options.controls
};
r.poster = function() {
  return G(this, "poster")
};
r.error = function() {
  return G(this, "error")
};
var K, L, M, N;
if(document.Wc !== e) {
  K = "requestFullscreen", L = "exitFullscreen", M = "fullscreenchange", N = "fullScreen"
}else {
  for(var O = ["moz", "webkit"], P = O.length - 1;0 <= P;P--) {
    var Q = O[P];
    if(("moz" != Q || document.mozFullScreenEnabled) && document[Q + "CancelFullScreen"] !== e) {
      K = Q + "RequestFullScreen", L = Q + "CancelFullScreen", M = Q + "fullscreenchange", N = "webkit" == Q ? Q + "IsFullScreen" : Q + "FullScreen"
    }
  }
}
K && (vjs.Cb.Za = {Fc:K, nc:L, ha:M, U:N});
vjs.Db = function(a, b, c) {
  vjs.c.call(this, a, b, c);
  if(!a.options.sources || 0 === a.options.sources.length) {
    b = 0;
    for(c = a.options.techOrder;b < c.length;b++) {
      var d = vjs.T(c[b]), f = window.videojs[d];
      if(f && f.isSupported()) {
        C(a, d);
        break
      }
    }
  }else {
    a.src(a.options.sources)
  }
};
v(vjs.Db, vjs.c);
vjs.J = function(a, b, c) {
  vjs.c.call(this, a, b, c)
};
v(vjs.J, vjs.c);
vjs.J.prototype.m = function() {
  this.a.options.controls && (this.a.paused() ? this.a.play() : this.a.pause())
};
vjs.media = {};
vjs.media.bb = "play pause paused currentTime setCurrentTime duration buffered volume setVolume muted setMuted width height supportsFullScreen enterFullScreen src load currentSrc preload setPreload autoplay setAutoplay loop setLoop error networkState readyState seeking initialTime startOffsetTime played seekable ended videoTracks audioTracks videoWidth videoHeight textTracks defaultPlaybackRate playbackRate mediaGroup controller controls defaultMuted".split(" ");
function ea() {
  var a = vjs.media.bb[i];
  return function() {
    throw Error('The "' + a + "\" method is not available on the playback technology's API");
  }
}
for(var i = vjs.media.bb.length - 1;0 <= i;i--) {
  vjs.J.prototype[vjs.media.bb[i]] = ea()
}
;vjs.h = function(a, b, c) {
  vjs.J.call(this, a, b, c);
  (b = b.source) && this.b.currentSrc == b.src ? a.i("loadstart") : b && (this.b.src = b.src);
  a.P(function() {
    this.options.autoplay && this.paused() && (this.I.poster = h, this.play())
  });
  this.e("click", this.m);
  for(a = vjs.h.Z.length - 1;0 <= a;a--) {
    vjs.e(this.b, vjs.h.Z[a], vjs.bind(this.a, this.Lb))
  }
  z(this)
};
v(vjs.h, vjs.J);
r = vjs.h.prototype;
r.D = function() {
  for(var a = vjs.h.Z.length - 1;0 <= a;a--) {
    vjs.o(this.b, vjs.h.Z[a], vjs.bind(this.a, this.Lb))
  }
  vjs.h.f.D.call(this)
};
r.d = function() {
  var a = this.a, b = a.I;
  if(!b || this.G.yc === k) {
    b && a.j().removeChild(b), b = vjs.createElement("video", {id:b.id || a.id + "_html5_api", className:b.className || "vjs-tech"}), vjs.rb(b, a.j)
  }
  for(var c = ["autoplay", "preload", "loop", "muted"], d = c.length - 1;0 <= d;d--) {
    var f = c[d];
    a.options[f] !== h && (b[f] = a.options[f])
  }
  return b
};
r.Lb = function(a) {
  this.i(a);
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
r.Ic = function(a) {
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
r.Nc = function(a) {
  this.b.volume = a
};
r.muted = function() {
  return this.b.muted
};
r.Lc = function(a) {
  this.b.muted = a
};
r.width = function() {
  return this.b.offsetWidth
};
r.height = function() {
  return this.b.offsetHeight
};
r.ab = function() {
  return"function" == typeof this.b.webkitEnterFullScreen && !navigator.userAgent.match("Chrome") && !navigator.userAgent.match("Mac OS X 10.5") ? g : k
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
r.Wa = function() {
  return this.b.Wa
};
r.Mc = function(a) {
  this.b.Wa = a
};
r.autoplay = function() {
  return this.b.autoplay
};
r.Hc = function(a) {
  this.b.autoplay = a
};
r.loop = function() {
  return this.b.loop
};
r.Kc = function(a) {
  this.b.loop = a
};
r.error = function() {
  return this.b.error
};
r.controls = function() {
  return this.a.options.controls
};
vjs.h.isSupported = function() {
  return!!document.createElement("video").canPlayType
};
vjs.h.ib = function(a) {
  return!!document.createElement("video").canPlayType(a.type)
};
vjs.h.Z = "loadstart suspend abort error emptied stalled loadedmetadata loadeddata canplay canplaythrough playing waiting seeking seeked ended durationchange timeupdate progress play pause ratechange volumechange".split(" ");
vjs.h.prototype.G = {ad:vjs.kc.webkitEnterFullScreen ? !vjs.Ja.match("Chrome") && !vjs.Ja.match("Mac OS X 10.5") ? g : k : k, yc:!vjs.gc};
vjs.ec && 3 > vjs.dc && (document.createElement("video").constructor.prototype.canPlayType = function(a) {
  return a && -1 != a.toLowerCase().indexOf("video/mp4") ? "maybe" : ""
});
vjs.g = function(a, b, c) {
  vjs.J.call(this, a, b, c);
  c = b.source;
  var d = b.Dc, f = this.b = vjs.d("div", {id:a.id() + "_temp_flash"}), l = a.id() + "_flash_api";
  a = a.options;
  var j = vjs.s({readyFunction:"videojs.Flash.onReady", eventProxyFunction:"videojs.Flash.onEvent", errorEventProxyFunction:"videojs.Flash.onError", autoplay:a.autoplay, preload:a.Wa, loop:a.loop, muted:a.muted}, b.flashVars), p = vjs.s({wmode:"opaque", bgcolor:"#000000"}, b.params), m = vjs.s({id:l, name:l, "class":"vjs-tech"}, b.attributes);
  c && (j.src = encodeURIComponent(vjs.Pb(c.src)));
  vjs.rb(f, d);
  b.startTime && this.P(function() {
    this.load();
    this.play();
    this.currentTime(b.startTime)
  });
  if(b.ed === g && !vjs.fc) {
    var s = vjs.d("iframe", {id:l + "_iframe", name:l + "_iframe", className:"vjs-tech", scrolling:"no", marginWidth:0, marginHeight:0, frameBorder:0});
    j.readyFunction = "ready";
    j.eventProxyFunction = "events";
    j.errorEventProxyFunction = "errors";
    vjs.e(s, "load", vjs.bind(this, function() {
      var a, c = s.contentWindow;
      a = s.contentDocument ? s.contentDocument : s.contentWindow.document;
      a.write(vjs.g.Qb(b.swf, j, p, m));
      c.a = this.a;
      c.P = vjs.bind(this.a, function(b) {
        b = a.getElementById(b);
        var c = this.k;
        c.j = b;
        vjs.e(b, "click", c.bind(c.m));
        vjs.g.jb(c)
      });
      c.$c = vjs.bind(this.a, function(a, b) {
        this && "flash" === this.V && this.i(b)
      });
      c.Zc = vjs.bind(this.a, function(a, b) {
        vjs.log("Flash Error", b)
      })
    }));
    f.parentNode.replaceChild(s, f)
  }else {
    vjs.g.rc(b.swf, f, j, p, m)
  }
};
v(vjs.g, vjs.J);
r = vjs.g.prototype;
r.D = function() {
  vjs.g.f.D.call(this)
};
r.play = function() {
  this.b.vjs_play()
};
r.pause = function() {
  this.b.vjs_pause()
};
r.src = function(a) {
  a = vjs.Pb(a);
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
  return vjs.Jb(this.b.vjs_getProperty("buffered"))
};
r.ab = q(k);
var R = vjs.g.prototype, S = "preload currentTime defaultPlaybackRate playbackRate autoplay loop mediaGroup controller controls volume muted defaultMuted".split(" "), T = "error currentSrc networkState readyState seeking initialTime duration startOffsetTime paused played seekable ended videoTracks audioTracks videoWidth videoHeight textTracks".split(" ");
function fa() {
  var a = S[i], b = a.charAt(0).toUpperCase() + a.slice(1);
  R["set" + b] = function(b) {
    return this.b.vjs_setProperty(a, b)
  }
}
function U(a) {
  R[a] = function() {
    return this.b.vjs_getProperty(a)
  }
}
for(i = 0;i < S.length;i++) {
  U(S[i]), fa()
}
for(i = 0;i < T.length;i++) {
  U(T[i])
}
vjs.g.isSupported = function() {
  return 10 <= vjs.g.version()[0]
};
vjs.g.ib = function(a) {
  if(a.type in vjs.g.prototype.G.tc) {
    return"maybe"
  }
};
vjs.g.prototype.G = {tc:{"video/flv":"FLV", "video/x-flv":"FLV", "video/mp4":"MP4", "video/m4v":"MP4"}, Wb:k, bc:k, Ob:k, hd:!vjs.Ja.match("Firefox")};
vjs.g.onReady = function(a) {
  a = vjs.j(a);
  var b = a.a || a.parentNode.a, c = b.k;
  a.a = b;
  c.b = a;
  c.e("click", c.m);
  vjs.g.jb(c)
};
vjs.g.jb = function(a) {
  a.j().vjs_getProperty ? z(a) : setTimeout(function() {
    vjs.g.jb(a)
  }, 50)
};
vjs.g.onEvent = function(a, b) {
  vjs.j(a).a.i(b)
};
vjs.g.onError = function(a, b) {
  vjs.j(a).a.i("error");
  vjs.log("Flash Error", b, a)
};
vjs.g.version = function() {
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
vjs.g.rc = function(a, b, c, d, f) {
  a = vjs.g.Qb(a, c, d, f);
  a = vjs.d("div", {innerHTML:a}).childNodes[0];
  c = b.parentNode;
  b.parentNode.replaceChild(a, b);
  var l = c.childNodes[0];
  setTimeout(function() {
    l.style.display = "block"
  }, 1E3)
};
vjs.g.Qb = function(a, b, c, d) {
  var f = "", l = "", j = "";
  b && vjs.Oa(b, function(a, b) {
    f += a + "=" + b + "&amp;"
  });
  c = vjs.s({movie:a, flashvars:f, allowScriptAccess:"always", allowNetworking:"all"}, c);
  vjs.Oa(c, function(a, b) {
    l += '<param name="' + a + '" value="' + b + '" />'
  });
  d = vjs.s({data:a, width:"100%", height:"100%"}, d);
  vjs.Oa(d, function(a, b) {
    j += a + '="' + b + '" '
  });
  return'<object type="application/x-shockwave-flash"' + j + ">" + l + "</object>"
};
vjs.Y = function(a, b) {
  vjs.c.call(this, a, b)
};
v(vjs.Y, vjs.c);
vjs.Y.prototype.v = function() {
  return"vjs-control " + vjs.Y.f.v.call(this)
};
vjs.Q = function(a, b) {
  vjs.c.call(this, a, b);
  a.H("play", vjs.bind(this, function() {
    this.Pa();
    this.a.e("mouseover", vjs.bind(this, this.Pa));
    this.a.e("mouseout", vjs.bind(this, this.nb))
  }))
};
v(vjs.Q, vjs.c);
r = vjs.Q.prototype;
r.options = {xc:"play", children:{playToggle:{}, fullscreenToggle:{}, currentTimeDisplay:{}, timeDivider:{}, durationDisplay:{}, remainingTimeDisplay:{}, progressControl:{}, volumeControl:{}, muteToggle:{}}};
r.d = function() {
  return vjs.d("div", {className:"vjs-control-bar"})
};
r.Pa = function() {
  vjs.Q.f.Pa.call(this);
  this.a.i("controlsvisible")
};
r.nb = function() {
  vjs.Q.f.nb.call(this);
  this.a.i("controlshidden")
};
r.Ub = function() {
  this.b.style.opacity = "1"
};
vjs.l = function(a, b) {
  vjs.Y.call(this, a, b);
  this.e("click", this.m);
  this.e("focus", this.Sa);
  this.e("blur", this.Ra)
};
v(vjs.l, vjs.Y);
r = vjs.l.prototype;
r.d = function(a, b) {
  b = vjs.s({className:this.v(), innerHTML:'<div><span class="vjs-control-text">' + (this.S || "Need Text") + "</span></div>", Gc:"button", tabIndex:0}, b);
  return vjs.l.f.d.call(this, a, b)
};
r.m = function() {
};
r.Sa = function() {
  vjs.e(document, "keyup", vjs.bind(this, this.Ba))
};
r.Ba = function(a) {
  if(32 == a.which || 13 == a.which) {
    a.preventDefault(), this.m()
  }
};
r.Ra = function() {
  vjs.o(document, "keyup", vjs.bind(this, this.Ba))
};
vjs.da = function(a, b) {
  vjs.l.call(this, a, b)
};
v(vjs.da, vjs.l);
vjs.da.prototype.S = "Play";
vjs.da.prototype.v = function() {
  return"vjs-play-button " + vjs.da.f.v.call(this)
};
vjs.da.prototype.m = function() {
  this.a.play()
};
vjs.ca = function(a, b) {
  vjs.l.call(this, a, b)
};
v(vjs.ca, vjs.l);
vjs.ca.prototype.S = "Play";
vjs.ca.prototype.v = function() {
  return"vjs-pause-button " + vjs.ca.f.v.call(this)
};
vjs.ca.prototype.m = function() {
  this.a.pause()
};
vjs.Fa = function(a, b) {
  vjs.l.call(this, a, b);
  a.e("play", vjs.bind(this, this.Ab));
  a.e("pause", vjs.bind(this, this.zb))
};
v(vjs.Fa, vjs.l);
r = vjs.Fa.prototype;
r.S = "Play";
r.v = function() {
  return"vjs-play-control " + vjs.Fa.f.v.call(this)
};
r.m = function() {
  this.a.paused() ? this.a.play() : this.a.pause()
};
r.Ab = function() {
  vjs.z(this.b, "vjs-paused");
  vjs.u(this.b, "vjs-playing")
};
r.zb = function() {
  vjs.z(this.b, "vjs-playing");
  vjs.u(this.b, "vjs-paused")
};
vjs.$ = function(a, b) {
  vjs.l.call(this, a, b)
};
v(vjs.$, vjs.l);
vjs.$.prototype.S = "Fullscreen";
vjs.$.prototype.v = function() {
  return"vjs-fullscreen-control " + vjs.$.f.v.call(this)
};
vjs.$.prototype.m = function() {
  this.a.U ? I(this.a) : this.a.Za()
};
vjs.X = function(a, b) {
  vjs.l.call(this, a, b);
  a.e("play", vjs.bind(this, this.w));
  a.e("ended", vjs.bind(this, this.show))
};
v(vjs.X, vjs.l);
vjs.X.prototype.d = function() {
  return vjs.X.f.d.call(this, "div", {className:"vjs-big-play-button", innerHTML:"<span></span>"})
};
vjs.X.prototype.m = function() {
  this.a.currentTime() && this.a.currentTime(0);
  this.a.play()
};
vjs.ra = function(a, b) {
  vjs.c.call(this, a, b);
  a.e("canplay", vjs.bind(this, this.w));
  a.e("canplaythrough", vjs.bind(this, this.w));
  a.e("playing", vjs.bind(this, this.w));
  a.e("seeked", vjs.bind(this, this.w));
  a.e("seeking", vjs.bind(this, this.show));
  a.e("seeked", vjs.bind(this, this.w));
  a.e("error", vjs.bind(this, this.show));
  a.e("waiting", vjs.bind(this, this.show))
};
v(vjs.ra, vjs.c);
vjs.ra.prototype.d = function() {
  var a, b;
  "string" == typeof this.a.j().style.WebkitBorderRadius || "string" == typeof this.a.j().style.MozBorderRadius || "string" == typeof this.a.j().style.Uc || "string" == typeof this.a.j().style.Vc ? (a = "vjs-loading-spinner", b = '<div class="ball1"></div><div class="ball2"></div><div class="ball3"></div><div class="ball4"></div><div class="ball5"></div><div class="ball6"></div><div class="ball7"></div><div class="ball8"></div>') : (a = "vjs-loading-spinner-fallback", b = "");
  return vjs.ra.f.d.call(this, "div", {className:a, innerHTML:b})
};
vjs.oa = function(a, b) {
  vjs.c.call(this, a, b);
  a.e("timeupdate", vjs.bind(this, this.Da))
};
v(vjs.oa, vjs.c);
vjs.oa.prototype.d = function() {
  var a = vjs.oa.f.d.call(this, "div", {className:"vjs-current-time vjs-time-controls vjs-control"});
  this.content = vjs.d("div", {className:"vjs-current-time-display", innerHTML:"0:00"});
  a.appendChild(vjs.d("div").appendChild(this.content));
  return a
};
vjs.oa.prototype.Da = function() {
  var a = this.a.Yb ? this.a.n.currentTime : this.a.currentTime();
  this.content.innerHTML = vjs.pb(a, this.a.duration())
};
vjs.pa = function(a, b) {
  vjs.c.call(this, a, b);
  a.e("timeupdate", vjs.bind(this, this.Da))
};
v(vjs.pa, vjs.c);
vjs.pa.prototype.d = function() {
  var a = vjs.pa.f.d.call(this, "div", {className:"vjs-duration vjs-time-controls vjs-control"});
  this.content = vjs.d("div", {className:"vjs-duration-display", innerHTML:"0:00"});
  a.appendChild(vjs.d("div").appendChild(this.content));
  return a
};
vjs.pa.prototype.Da = function() {
  this.a.duration() && (this.content.innerHTML = vjs.pb(this.a.duration()))
};
vjs.Ia = function(a, b) {
  vjs.c.call(this, a, b)
};
v(vjs.Ia, vjs.c);
vjs.Ia.prototype.d = function() {
  return vjs.Ia.f.d.call(this, "div", {className:"vjs-time-divider", innerHTML:"<div><span>/</span></div>"})
};
vjs.va = function(a, b) {
  vjs.c.call(this, a, b);
  a.e("timeupdate", vjs.bind(this, this.Da))
};
v(vjs.va, vjs.c);
vjs.va.prototype.d = function() {
  var a = vjs.va.f.d.call(this, "div", {className:"vjs-remaining-time vjs-time-controls vjs-control"});
  this.content = vjs.d("div", {className:"vjs-remaining-time-display", innerHTML:"-0:00"});
  a.appendChild(vjs.d("div").appendChild(this.content));
  return a
};
vjs.va.prototype.Da = function() {
  this.a.duration() && (this.content.innerHTML = "-" + vjs.pb(this.a.duration() - this.a.currentTime()))
};
vjs.K = function(a, b) {
  vjs.c.call(this, a, b);
  this.lc = this.M[this.options.barName];
  this.handle = this.M[this.options.handleName];
  a.e(this.Vb, vjs.bind(this, this.update));
  this.e("mousedown", this.yb);
  this.e("focus", this.Sa);
  this.e("blur", this.Ra);
  this.a.e("controlsvisible", vjs.bind(this, this.update));
  a.P(vjs.bind(this, this.update))
};
v(vjs.K, vjs.c);
r = vjs.K.prototype;
r.d = function(a, b) {
  b = vjs.s({Gc:"slider", "aria-valuenow":0, "aria-valuemin":0, "aria-valuemax":100, tabIndex:0}, b);
  return vjs.K.f.d.call(this, a, b)
};
r.yb = function(a) {
  a.preventDefault();
  vjs.mc();
  vjs.e(document, "mousemove", vjs.bind(this, this.Ta));
  vjs.e(document, "mouseup", vjs.bind(this, this.Ua));
  this.Ta(a)
};
r.Ua = function() {
  vjs.Oc();
  vjs.o(document, "mousemove", this.Ta, k);
  vjs.o(document, "mouseup", this.Ua, k);
  this.update()
};
r.update = function() {
  var a, b = this.Rb(), c = this.handle, d = this.lc;
  isNaN(b) && (b = 0);
  a = b;
  if(c) {
    a = this.b.offsetWidth;
    var f = c.j().offsetWidth;
    a = f ? f / a : 0;
    b *= 1 - a;
    a = b + a / 2;
    c.j().style.left = vjs.round(100 * b, 2) + "%"
  }
  d.j().style.width = vjs.round(100 * a, 2) + "%"
};
function V(a, b) {
  var c = a.b, d = vjs.sc(c), c = c.offsetWidth, f = a.handle;
  f && (f = f.j().offsetWidth, d += f / 2, c -= f);
  return Math.max(0, Math.min(1, (b.pageX - d) / c))
}
r.Sa = function() {
  vjs.e(document, "keyup", vjs.bind(this, this.Ba))
};
r.Ba = function(a) {
  37 == a.which ? (a.preventDefault(), this.$b()) : 39 == a.which && (a.preventDefault(), this.ac())
};
r.Ra = function() {
  vjs.o(document, "keyup", vjs.bind(this, this.Ba))
};
vjs.ua = function(a, b) {
  vjs.c.call(this, a, b)
};
v(vjs.ua, vjs.c);
vjs.ua.prototype.options = {children:{seekBar:{}}};
vjs.ua.prototype.d = function() {
  return vjs.ua.f.d.call(this, "div", {className:"vjs-progress-control vjs-control"})
};
vjs.fa = function(a, b) {
  vjs.K.call(this, a, b)
};
v(vjs.fa, vjs.K);
r = vjs.fa.prototype;
r.options = {children:{loadProgressBar:{}, playProgressBar:{}, seekHandle:{}}, barName:"playProgressBar", handleName:"seekHandle"};
r.Vb = "timeupdate";
r.d = function() {
  return vjs.fa.f.d.call(this, "div", {className:"vjs-progress-holder"})
};
r.Rb = function() {
  return this.a.currentTime() / this.a.duration()
};
r.yb = function(a) {
  vjs.fa.f.yb.call(this, a);
  this.a.Yb = g;
  this.Pc = !this.a.paused();
  this.a.pause()
};
r.Ta = function(a) {
  a = V(this, a) * this.a.duration();
  a == this.a.duration() && (a -= 0.1);
  this.a.currentTime(a)
};
r.Ua = function(a) {
  vjs.fa.f.Ua.call(this, a);
  this.a.Yb = k;
  this.Pc && this.a.play()
};
r.ac = function() {
  this.a.currentTime(this.a.currentTime() + 1)
};
r.$b = function() {
  this.a.currentTime(this.a.currentTime() - 1)
};
vjs.qa = function(a, b) {
  vjs.c.call(this, a, b);
  a.e("progress", vjs.bind(this, this.update))
};
v(vjs.qa, vjs.c);
vjs.qa.prototype.d = function() {
  return vjs.qa.f.d.call(this, "div", {className:"vjs-load-progress", innerHTML:'<span class="vjs-control-text">Loaded: 0%</span>'})
};
vjs.qa.prototype.update = function() {
  this.b.style && (this.b.style.width = vjs.round(100 * E(this.a), 2) + "%")
};
vjs.Ea = function(a, b) {
  vjs.c.call(this, a, b)
};
v(vjs.Ea, vjs.c);
vjs.Ea.prototype.d = function() {
  return vjs.Ea.f.d.call(this, "div", {className:"vjs-play-progress", innerHTML:'<span class="vjs-control-text">Progress: 0%</span>'})
};
vjs.Ga = function(a, b) {
  vjs.c.call(this, a, b)
};
v(vjs.Ga, vjs.c);
vjs.Ga.prototype.d = function() {
  return vjs.Ga.f.d.call(this, "div", {className:"vjs-seek-handle", innerHTML:'<span class="vjs-control-text">00:00</span>'})
};
vjs.xa = function(a, b) {
  vjs.c.call(this, a, b)
};
v(vjs.xa, vjs.c);
vjs.xa.prototype.options = {children:{volumeBar:{}}};
vjs.xa.prototype.d = function() {
  return vjs.xa.f.d.call(this, "div", {className:"vjs-volume-control vjs-control"})
};
vjs.Ka = function(a, b) {
  vjs.K.call(this, a, b)
};
v(vjs.Ka, vjs.K);
r = vjs.Ka.prototype;
r.options = {children:{volumeLevel:{}, volumeHandle:{}}, barName:"volumeLevel", handleName:"volumeHandle"};
r.Vb = "volumechange";
r.d = function() {
  return vjs.Ka.f.d.call(this, "div", {className:"vjs-volume-bar"})
};
r.Ta = function(a) {
  this.a.volume(V(this, a))
};
r.Rb = function() {
  return this.a.volume()
};
r.ac = function() {
  this.a.volume(this.a.volume() + 0.1)
};
r.$b = function() {
  this.a.volume(this.a.volume() - 0.1)
};
vjs.Ma = function(a, b) {
  vjs.c.call(this, a, b)
};
v(vjs.Ma, vjs.c);
vjs.Ma.prototype.d = function() {
  return vjs.Ma.f.d.call(this, "div", {className:"vjs-volume-level", innerHTML:'<span class="vjs-control-text"></span>'})
};
vjs.La = function(a, b) {
  vjs.c.call(this, a, b)
};
v(vjs.La, vjs.c);
vjs.La.prototype.d = function() {
  return vjs.La.f.d.call(this, "div", {className:"vjs-volume-handle", innerHTML:'<span class="vjs-control-text"></span>'})
};
vjs.ba = function(a, b) {
  vjs.l.call(this, a, b);
  a.e("volumechange", vjs.bind(this, this.update))
};
v(vjs.ba, vjs.l);
vjs.ba.prototype.d = function() {
  return vjs.ba.f.d.call(this, "div", {className:"vjs-mute-control vjs-control", innerHTML:'<div><span class="vjs-control-text">Mute</span></div>'})
};
vjs.ba.prototype.m = function() {
  this.a.muted(this.a.muted() ? k : g)
};
vjs.ba.prototype.update = function() {
  var a = this.a.volume(), b = 3;
  0 === a || this.a.muted() ? b = 0 : 0.33 > a ? b = 1 : 0.67 > a && (b = 2);
  for(a = 0;4 > a;a++) {
    vjs.z(this.b, "vjs-vol-" + a)
  }
  vjs.u(this.b, "vjs-vol-" + b)
};
vjs.ta = function(a, b) {
  vjs.l.call(this, a, b);
  this.a.options.poster || this.w();
  a.e("play", vjs.bind(this, this.w))
};
v(vjs.ta, vjs.l);
vjs.ta.prototype.d = function() {
  var a = vjs.d("img", {className:"vjs-poster", tabIndex:-1});
  this.a.options.poster && (a.src = this.a.options.poster);
  return a
};
vjs.ta.prototype.m = function() {
  this.a.play()
};
vjs.aa = function(a, b) {
  vjs.c.call(this, a, b)
};
v(vjs.aa, vjs.c);
function W(a, b) {
  a.R(b);
  b.e("click", vjs.bind(a, function() {
    A(this)
  }))
}
vjs.aa.prototype.d = function() {
  return vjs.aa.f.d.call(this, "ul", {className:"vjs-menu"})
};
vjs.B = function(a, b) {
  vjs.l.call(this, a, b);
  b.selected && this.u("vjs-selected")
};
v(vjs.B, vjs.l);
vjs.B.prototype.d = function(a, b) {
  return vjs.B.f.d.call(this, "li", vjs.s({className:"vjs-menu-item", innerHTML:this.options.label}, b))
};
vjs.B.prototype.m = function() {
  this.selected(g)
};
vjs.B.prototype.selected = function(a) {
  a ? this.u("vjs-selected") : this.z("vjs-selected")
};
function X(a) {
  a.Ca = a.Ca || [];
  return a.Ca
}
function Y(a, b, c) {
  for(var d = a.Ca, f = 0, l = d.length, j, p;f < l;f++) {
    j = d[f], j.id() === b ? (j.show(), p = j) : c && (j.A() == c && 0 < j.mode()) && j.disable()
  }
  (b = p ? p.A() : c ? c : k) && a.i(b + "trackchange")
}
vjs.t = function(a, b) {
  vjs.c.call(this, a, b);
  this.O = b.id || "vjs_" + b.kind + "_" + b.language + "_" + vjs.p++;
  this.Zb = b.src;
  this.oc = b["default"] || b.dflt;
  this.kd = b.title;
  this.fd = b.srclang;
  this.wc = b.label;
  this.ga = [];
  this.Eb = [];
  this.ka = this.la = 0
};
v(vjs.t, vjs.c);
r = vjs.t.prototype;
r.A = n("r");
r.src = n("Zb");
r.mb = n("oc");
r.label = n("wc");
r.readyState = n("la");
r.mode = n("ka");
r.d = function() {
  return vjs.t.f.d.call(this, "div", {className:"vjs-" + this.r + " vjs-text-track"})
};
r.show = function() {
  Z(this);
  this.ka = 2;
  vjs.t.f.show.call(this)
};
r.w = function() {
  Z(this);
  this.ka = 1;
  vjs.t.f.w.call(this)
};
r.disable = function() {
  2 == this.ka && this.w();
  this.a.o("timeupdate", vjs.bind(this, this.update, this.O));
  this.a.o("ended", vjs.bind(this, this.reset, this.O));
  this.reset();
  this.a.M.textTrackDisplay.removeChild(this);
  this.ka = 0
};
function Z(a) {
  0 === a.la && a.load();
  0 === a.ka && (a.a.e("timeupdate", vjs.bind(a, a.update, a.O)), a.a.e("ended", vjs.bind(a, a.reset, a.O)), ("captions" === a.r || "subtitles" === a.r) && a.a.M.textTrackDisplay.R(a))
}
r.load = function() {
  0 === this.la && (this.la = 1, vjs.get(this.Zb, vjs.bind(this, this.Ec), vjs.bind(this, this.xb)))
};
r.xb = function(a) {
  this.error = a;
  this.la = 3;
  this.i("error")
};
r.Ec = function(a) {
  var b, c;
  a = a.split("\n");
  for(var d = "", f = 1, l = a.length;f < l;f++) {
    if(d = vjs.trim(a[f])) {
      -1 == d.indexOf("--\x3e") ? (b = d, d = vjs.trim(a[++f])) : b = this.ga.length;
      b = {id:b, index:this.ga.length};
      c = d.split(" --\x3e ");
      b.startTime = ga(c[0]);
      b.za = ga(c[1]);
      for(c = [];a[++f] && (d = vjs.trim(a[f]));) {
        c.push(d)
      }
      b.text = c.join("<br/>");
      this.ga.push(b)
    }
  }
  this.la = 2;
  this.i("loaded")
};
function ga(a) {
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
  if(0 < this.ga.length) {
    var a = this.a.currentTime();
    if(this.Bb === e || a < this.Bb || this.Qa <= a) {
      var b = this.ga, c = this.a.duration(), d = 0, f = k, l = [], j, p, m, s;
      a >= this.Qa || this.Qa === e ? s = this.ob !== e ? this.ob : 0 : (f = g, s = this.ub !== e ? this.ub : b.length - 1);
      for(;;) {
        m = b[s];
        if(m.za <= a) {
          d = Math.max(d, m.za), m.Na && (m.Na = k)
        }else {
          if(a < m.startTime) {
            if(c = Math.min(c, m.startTime), m.Na && (m.Na = k), !f) {
              break
            }
          }else {
            f ? (l.splice(0, 0, m), p === e && (p = s), j = s) : (l.push(m), j === e && (j = s), p = s), c = Math.min(c, m.za), d = Math.max(d, m.startTime), m.Na = g
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
      this.Eb = l;
      this.Qa = c;
      this.Bb = d;
      this.ob = j;
      this.ub = p;
      a = this.Eb;
      b = "";
      c = 0;
      for(d = a.length;c < d;c++) {
        b += '<span class="vjs-tt-cue">' + a[c].text + "</span>"
      }
      this.b.innerHTML = b;
      this.i("cuechange")
    }
  }
};
r.reset = function() {
  this.Qa = 0;
  this.Bb = this.a.duration();
  this.ub = this.ob = 0
};
vjs.cb = function(a, b) {
  vjs.t.call(this, a, b)
};
v(vjs.cb, vjs.t);
vjs.cb.prototype.r = "captions";
vjs.gb = function(a, b) {
  vjs.t.call(this, a, b)
};
v(vjs.gb, vjs.t);
vjs.gb.prototype.r = "subtitles";
vjs.fb = function(a, b) {
  vjs.t.call(this, a, b)
};
v(vjs.fb, vjs.t);
vjs.fb.prototype.r = "chapters";
vjs.Ha = function(a, b, c) {
  vjs.c.call(this, a, b, c);
  if(a.options.tracks && 0 < a.options.tracks.length) {
    b = this.a;
    a = a.options.tracks;
    var d;
    for(c = 0;c < a.length;c++) {
      d = a[c];
      var f = b, l = d.kind, j = d.label, p = d.language, m = d;
      d = f.Ca = f.Ca || [];
      m = m || {};
      m.kind = l;
      m.label = j;
      m.language = p;
      l = vjs.T(l || "subtitles");
      f = new window.videojs[l + "Track"](f, m);
      d.push(f)
    }
  }
};
v(vjs.Ha, vjs.c);
vjs.Ha.prototype.d = function() {
  return vjs.Ha.f.d.call(this, "div", {className:"vjs-text-track-display"})
};
vjs.L = function(a, b) {
  var c = this.W = b.track;
  b.label = c.label();
  b.selected = c.mb();
  vjs.B.call(this, a, b);
  this.a.e(c.A() + "trackchange", vjs.bind(this, this.update))
};
v(vjs.L, vjs.B);
vjs.L.prototype.m = function() {
  vjs.L.f.m.call(this);
  Y(this.a, this.W.id(), this.W.A())
};
vjs.L.prototype.update = function() {
  2 == this.W.mode() ? this.selected(g) : this.selected(k)
};
vjs.sa = function(a, b) {
  b.track = {A:function() {
    return b.kind
  }, a:a, label:q("Off"), mb:q(k), mode:q(k)};
  vjs.L.call(this, a, b)
};
v(vjs.sa, vjs.L);
vjs.sa.prototype.m = function() {
  vjs.sa.f.m.call(this);
  Y(this.a, this.W.id(), this.W.A())
};
vjs.sa.prototype.update = function() {
  for(var a = X(this.a), b = 0, c = a.length, d, f = g;b < c;b++) {
    d = a[b], d.A() == this.W.A() && 2 == d.mode() && (f = k)
  }
  f ? this.selected(g) : this.selected(k)
};
vjs.F = function(a, b) {
  vjs.l.call(this, a, b);
  this.ja = this.lb();
  0 === this.Aa.length && this.w()
};
v(vjs.F, vjs.l);
r = vjs.F.prototype;
r.lb = function() {
  var a = new vjs.aa(this.a);
  a.j().appendChild(vjs.d("li", {className:"vjs-menu-title", innerHTML:vjs.T(this.r)}));
  W(a, new vjs.sa(this.a, {kind:this.r}));
  this.Aa = this.Ib();
  for(var b = 0;b < this.Aa.length;b++) {
    W(a, this.Aa[b])
  }
  this.R(a);
  return a
};
r.Ib = function() {
  for(var a = [], b, c = 0;c < X(this.a).length;c++) {
    b = X(this.a)[c], b.A() === this.r && a.push(new vjs.L(this.a, {track:b}))
  }
  return a
};
r.v = function() {
  return this.className + " vjs-menu-button " + vjs.F.f.v.call(this)
};
r.Sa = function() {
  this.ja.Ub();
  vjs.H(this.ja.b.childNodes[this.ja.b.childNodes.length - 1], "blur", vjs.bind(this, function() {
    A(this.ja)
  }))
};
r.Ra = function() {
};
r.m = function() {
  this.H("mouseout", vjs.bind(this, function() {
    A(this.ja);
    this.b.blur()
  }))
};
vjs.ma = function(a, b) {
  vjs.F.call(this, a, b)
};
v(vjs.ma, vjs.F);
vjs.ma.prototype.r = "captions";
vjs.ma.prototype.S = "Captions";
vjs.ma.prototype.className = "vjs-captions-button";
vjs.wa = function(a, b) {
  vjs.F.call(this, a, b)
};
v(vjs.wa, vjs.F);
vjs.wa.prototype.r = "subtitles";
vjs.wa.prototype.S = "Subtitles";
vjs.wa.prototype.className = "vjs-subtitles-button";
vjs.eb = function(a, b) {
  vjs.F.call(this, a, b)
};
v(vjs.eb, vjs.F);
r = vjs.eb.prototype;
r.r = "chapters";
r.S = "Chapters";
r.className = "vjs-chapters-button";
r.Ib = function() {
  for(var a = [], b, c = 0;c < X(this.a).length;c++) {
    b = X(this.a)[c], b.A() === this.r && a.push(new vjs.L(this.a, {track:b}))
  }
  return a
};
r.lb = function() {
  for(var a = X(this.a), b = 0, c = a.length, d, f, l = this.Aa = [];b < c;b++) {
    if(d = a[b], d.A() == this.r && d.mb()) {
      if(2 > d.readyState()) {
        this.Xc = d;
        d.e("loaded", vjs.bind(this, this.lb));
        return
      }
      f = d;
      break
    }
  }
  a = this.ja = new vjs.aa(this.a);
  a.b.appendChild(vjs.d("li", {className:"vjs-menu-title", innerHTML:vjs.T(this.r)}));
  if(f) {
    d = f.ga;
    for(var j, b = 0, c = d.length;b < c;b++) {
      j = d[b], j = new vjs.na(this.a, {track:f, cue:j}), l.push(j), a.R(j)
    }
  }
  this.R(a);
  0 < this.Aa.length && this.show();
  return a
};
vjs.na = function(a, b) {
  var c = this.W = b.track, d = this.cue = b.cue, f = a.currentTime();
  b.label = d.text;
  b.selected = d.startTime <= f && f < d.za;
  vjs.B.call(this, a, b);
  c.e("cuechange", vjs.bind(this, this.update))
};
v(vjs.na, vjs.B);
vjs.na.prototype.m = function() {
  vjs.na.f.m.call(this);
  this.a.currentTime(this.cue.startTime);
  this.update(this.cue.startTime)
};
vjs.na.prototype.update = function() {
  var a = this.cue, b = this.a.currentTime();
  a.startTime <= b && b < a.za ? this.selected(g) : this.selected(k)
};
vjs.s(vjs.Q.prototype.options.children, {subtitlesButton:{}, captionsButton:{}, chaptersButton:{}});
vjs.Fb = function() {
  var a, b, c = document.getElementsByTagName("video");
  if(c && 0 < c.length) {
    for(var d = 0, f = c.length;d < f;d++) {
      if((b = c[d]) && b.getAttribute) {
        b.a === e && (a = b.getAttribute("data-setup"), a !== h && (a = vjs.JSON.parse(a || "{}"), aa(b, a)))
      }else {
        vjs.Gb();
        break
      }
    }
  }else {
    vjs.Rc || vjs.Gb()
  }
};
vjs.Gb = function() {
  setTimeout(vjs.Fb, 1)
};
vjs.H(window, "load", function() {
  vjs.Rc = g
});
vjs.Fb();
if(JSON && "function" === JSON.parse) {
  vjs.JSON = JSON
}else {
  vjs.JSON = {};
  var $ = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
  vjs.JSON.parse = function(a, b) {
    function c(a, d) {
      var j, p, m = a[d];
      if(m && "object" === typeof m) {
        for(j in m) {
          Object.prototype.hasOwnProperty.call(m, j) && (p = c(m, j), p !== e ? m[j] = p : delete m[j])
        }
      }
      return b.call(a, d, m)
    }
    var d;
    a = String(a);
    $.lastIndex = 0;
    $.test(a) && (a = a.replace($, function(a) {
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
u("videojs.cache", vjs.ya);
u("videojs.Component", vjs.c);
vjs.c.prototype.dispose = vjs.c.prototype.D;
vjs.c.prototype.createEl = vjs.c.prototype.d;
vjs.c.prototype.getEl = vjs.c.prototype.dd;
vjs.c.prototype.addChild = vjs.c.prototype.R;
vjs.c.prototype.getChildren = vjs.c.prototype.bd;
vjs.c.prototype.on = vjs.c.prototype.e;
vjs.c.prototype.off = vjs.c.prototype.o;
vjs.c.prototype.one = vjs.c.prototype.H;
vjs.c.prototype.trigger = vjs.c.prototype.i;
vjs.c.prototype.show = vjs.c.prototype.show;
vjs.c.prototype.hide = vjs.c.prototype.w;
vjs.c.prototype.width = vjs.c.prototype.width;
vjs.c.prototype.height = vjs.c.prototype.height;
vjs.c.prototype.dimensions = vjs.c.prototype.pc;
u("videojs.Player", vjs.ea);
u("videojs.MediaLoader", vjs.Db);
u("videojs.PosterImage", vjs.ta);
u("videojs.LoadingSpinner", vjs.ra);
u("videojs.BigPlayButton", vjs.X);
u("videojs.ControlBar", vjs.Q);
u("videojs.TextTrackDisplay", vjs.Ha);
u("videojs.Control", vjs.Y);
u("videojs.ControlBar", vjs.Q);
u("videojs.Button", vjs.l);
u("videojs.PlayButton", vjs.da);
u("videojs.PauseButton", vjs.ca);
u("videojs.PlayToggle", vjs.Fa);
u("videojs.FullscreenToggle", vjs.$);
u("videojs.BigPlayButton", vjs.X);
u("videojs.LoadingSpinner", vjs.ra);
u("videojs.CurrentTimeDisplay", vjs.oa);
u("videojs.DurationDisplay", vjs.pa);
u("videojs.TimeDivider", vjs.Ia);
u("videojs.RemainingTimeDisplay", vjs.va);
u("videojs.Slider", vjs.K);
u("videojs.ProgressControl", vjs.ua);
u("videojs.SeekBar", vjs.fa);
u("videojs.LoadProgressBar", vjs.qa);
u("videojs.PlayProgressBar", vjs.Ea);
u("videojs.SeekHandle", vjs.Ga);
u("videojs.VolumeControl", vjs.xa);
u("videojs.VolumeBar", vjs.Ka);
u("videojs.VolumeLevel", vjs.Ma);
u("videojs.VolumeHandle", vjs.La);
u("videojs.MuteToggle", vjs.ba);
u("videojs.PosterImage", vjs.ta);
u("videojs.Menu", vjs.aa);
u("videojs.MenuItem", vjs.B);
u("videojs.SubtitlesButton", vjs.wa);
u("videojs.CaptionsButton", vjs.ma);
u("videojs.ChaptersButton", vjs.eb);
u("videojs.MediaTechController", vjs.J);
u("videojs.Html5", vjs.h);
vjs.h.Events = vjs.h.Z;
vjs.h.isSupported = vjs.h.isSupported;
vjs.h.canPlaySource = vjs.h.ib;
vjs.h.prototype.setCurrentTime = vjs.h.prototype.Ic;
vjs.h.prototype.setVolume = vjs.h.prototype.Nc;
vjs.h.prototype.setMuted = vjs.h.prototype.Lc;
vjs.h.prototype.setPreload = vjs.h.prototype.Mc;
vjs.h.prototype.setAutoplay = vjs.h.prototype.Hc;
vjs.h.prototype.setLoop = vjs.h.prototype.Kc;
u("videojs.Flash", vjs.g);
vjs.g.Events = vjs.g.Z;
vjs.g.isSupported = vjs.g.isSupported;
vjs.g.canPlaySource = vjs.g.ib;
vjs.g.onReady = vjs.g.onReady;
u("videojs.TextTrack", vjs.t);
vjs.t.prototype.label = vjs.t.prototype.label;
u("videojs.CaptionsTrack", vjs.cb);
u("videojs.SubtitlesTrack", vjs.gb);
u("videojs.ChaptersTrack", vjs.fb);
})();//@ sourceMappingURL=video.compiled.js.map
