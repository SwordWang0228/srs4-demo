!function(t){var e={};function n(i){if(e[i])return e[i].exports;var o=e[i]={i:i,l:!1,exports:{}};return t[i].call(o.exports,o,o.exports,n),o.l=!0,o.exports}n.m=t,n.c=e,n.d=function(t,e,i){n.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:i})},n.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},n.t=function(t,e){if(1&e&&(t=n(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var i=Object.create(null);if(n.r(i),Object.defineProperty(i,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var o in t)n.d(i,o,function(e){return t[e]}.bind(null,o));return i},n.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return n.d(e,"a",e),e},n.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},n.p="",n(n.s=6)}([function(t,e,n){"use strict";var i=n(4),o=n(2),s=n(5);var r=Object(s.a)(o.default,i.b,i.c,!1,null,null,"06fa8b62",!1,i.a,void 0);(function(t){this.options.style||(this.options.style={}),Vue.prototype.__merge_style&&Vue.prototype.__$appStyle__&&Vue.prototype.__merge_style(Vue.prototype.__$appStyle__,this.options.style)}).call(r),e.default=r.exports},function(t,e){t.exports={"@VERSION":2}},function(t,e,n){"use strict";var i=n(3),o=n.n(i);e.default=o.a},function(t,e,n){"use strict";(function(t){Object.defineProperty(e,"__esModule",{value:!0}),e.default=void 0;var n={data:function(){return{src:"",context:null,laliu:"rtmp://srs4.duoxing.org/live/livestream",tuiliu:"rtmp://srs4.duoxing.org/live/livestream"}},onReady:function(t){var e=this;this.videoContext=uni.createVideoContext("myVideo"),this.$nextTick((function(){try{e.context=uni.createLivePusherContext("livePusher",e),e.context.switchCamera(),e.context.startPreview()}catch(t){uni.showToast({title:t})}}))},methods:{videoErrorCallback:function(t){uni.showModal({content:t.target.errMsg,showCancel:!1})},statechange:function(e){t("log","statechange:"+JSON.stringify(e)," at pages/index/index.nvue:72")},netstatus:function(t){},error:function(e){t("log","error:"+JSON.stringify(e)," at pages/index/index.nvue:80")},start:function(){this.context.url=this.tuiliu,this.context.start({success:function(e){uni.showToast({title:"livePusher.start:"+JSON.stringify(e)}),t("log","livePusher.start:"+JSON.stringify(e)," at pages/index/index.nvue:93")}})},close:function(){this.context.close({success:function(e){uni.showToast({title:"livePusher.close:"+JSON.stringify(e)}),t("log","livePusher.close:"+JSON.stringify(e)," at pages/index/index.nvue:103")}})},snapshot:function(){this.context.snapshot({success:function(e){t("log",JSON.stringify(e)," at pages/index/index.nvue:110")}})},resume:function(){this.context.resume({success:function(e){t("log","livePusher.resume:"+JSON.stringify(e)," at pages/index/index.nvue:120"),uni.showToast({title:"livePusher.resume:"+JSON.stringify(e)})}})},pause:function(){this.context.pause({success:function(e){t("log","livePusher.pause:"+JSON.stringify(e)," at pages/index/index.nvue:130"),uni.showToast({title:"livePusher.pause:"+JSON.stringify(e)})}})},stop:function(){this.context.stop({success:function(e){t("log",JSON.stringify(e)," at pages/index/index.nvue:140"),uni.showToast({title:"livePusher.stop:"+JSON.stringify(e)})}})},switchCamera:function(){this.context.switchCamera({success:function(e){t("log","livePusher.switchCamera:"+JSON.stringify(e)," at pages/index/index.nvue:150"),uni.showToast({title:"livePusher.switchCamera:"+JSON.stringify(e)})}})},startPreview:function(){this.context.startPreview({success:function(e){t("log","livePusher.startPreview:"+JSON.stringify(e)," at pages/index/index.nvue:160"),uni.showToast({title:"livePusher.startPreview:"+JSON.stringify(e)})}})},stopPreview:function(){this.context.stopPreview({success:function(e){t("log","livePusher.stopPreview:"+JSON.stringify(e)," at pages/index/index.nvue:170"),uni.showToast({title:"livePusher.stopPreview:"+JSON.stringify(e)})}})},btn_la:function(){this.videoContext.stop(),this.videoContext.src=this.laliu,this.videoContext.play()}}};e.default=n}).call(this,n(9).default)},function(t,e,n){"use strict";n.d(e,"b",(function(){return i})),n.d(e,"c",(function(){return o})),n.d(e,"a",(function(){}));var i=function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("scroll-view",{staticStyle:{flexDirection:"column"},attrs:{scrollY:!0,showScrollbar:!0,enableBackToTop:!0,bubble:"true"}},[n("view",{staticClass:["content"]},[n("view",{staticClass:["uni-padding-wrap","uni-common-mt"]},[n("label",[n("u-text",[t._v("\u63a8\u6d41\uff1a")])]),n("u-input",{attrs:{type:t.text,placeholder:"\u8bf7\u8f93\u5165\u63a8\u6d41\u5730\u5740",value:t.tuiliu}}),n("button",{staticClass:["btn"],on:{click:t.start}},[t._v("\u5f00\u59cb\u63a8\u6d41")]),n("live-pusher",{ref:"livePusher",staticClass:["livePusher"],attrs:{id:"livePusher",url:"rtmp://srs4.duoxing.org/live/livestream",mode:"SD",muted:!0,enableCamera:!0,autoFocus:!0,beauty:1,whiteness:"2",aspect:"9:16"},on:{statechange:t.statechange,netstatus:t.netstatus,error:t.error}}),n("view",{staticClass:["uni-flex","uni-row"]},[n("button",{staticClass:["btn"],on:{click:t.pause}},[t._v("\u6682\u505c\u63a8\u6d41")]),n("button",{staticClass:["btn"],on:{click:t.resume}},[t._v("\u6062\u590d\u63a8\u6d41")]),n("button",{staticClass:["btn"],on:{click:t.stop}},[t._v("\u505c\u6b62\u63a8\u6d41")])],1),n("label",{staticStyle:{marginTop:"20"}},[n("u-text",[t._v("\u62c9\u6d41\uff1a")])]),n("u-input",{attrs:{type:t.text,placeholder:"\u8bf7\u8f93\u5165\u62c9\u6d41\u5730\u5740",value:t.laliu}}),n("button",{staticClass:["btn"],on:{click:t.btn_la}},[t._v("\u5f00\u59cb\u62c9\u6d41")]),n("view",[n("u-video",{attrs:{id:"myVideo",src:"rtmp://srs4.duoxing.org/live/livestream",controls:!0},on:{error:t.videoErrorCallback}})],1),n("button",{staticClass:["btn"],on:{click:t.startPreview}},[t._v("\u5f00\u542f\u6444\u50cf\u5934\u9884\u89c8")]),n("button",{staticClass:["btn"],on:{click:t.stopPreview}},[t._v("\u5173\u95ed\u6444\u50cf\u5934\u9884\u89c8")]),n("button",{staticClass:["btn"],on:{click:t.switchCamera}},[t._v("\u5207\u6362\u6444\u50cf\u5934")])],1)])])},o=[]},function(t,e,n){"use strict";function i(t,e,n,i,o,s,r,u,a,c){var l,f="function"==typeof t?t.options:t;if(a){f.components||(f.components={});var p=Object.prototype.hasOwnProperty;for(var v in a)p.call(a,v)&&!p.call(f.components,v)&&(f.components[v]=a[v])}if(c&&((c.beforeCreate||(c.beforeCreate=[])).unshift((function(){this[c.__module]=this})),(f.mixins||(f.mixins=[])).push(c)),e&&(f.render=e,f.staticRenderFns=n,f._compiled=!0),i&&(f.functional=!0),s&&(f._scopeId="data-v-"+s),r?(l=function(t){(t=t||this.$vnode&&this.$vnode.ssrContext||this.parent&&this.parent.$vnode&&this.parent.$vnode.ssrContext)||"undefined"==typeof __VUE_SSR_CONTEXT__||(t=__VUE_SSR_CONTEXT__),o&&o.call(this,t),t&&t._registeredComponents&&t._registeredComponents.add(r)},f._ssrRegister=l):o&&(l=u?function(){o.call(this,this.$root.$options.shadowRoot)}:o),l)if(f.functional){f._injectStyles=l;var d=f.render;f.render=function(t,e){return l.call(e),d(t,e)}}else{var h=f.beforeCreate;f.beforeCreate=h?[].concat(h,l):[l]}return{exports:t,options:f}}n.d(e,"a",(function(){return i}))},function(t,e,n){"use strict";n.r(e);n(7);var i=n(0);"undefined"==typeof Promise||Promise.prototype.finally||(Promise.prototype.finally=function(t){var e=this.constructor;return this.then((function(n){return e.resolve(t()).then((function(){return n}))}),(function(n){return e.resolve(t()).then((function(){throw n}))}))}),i.default.mpType="page",i.default.route="pages/index/index",i.default.el="#root",new Vue(i.default)},function(t,e,n){Vue.prototype.__$appStyle__={},Vue.prototype.__merge_style&&Vue.prototype.__merge_style(n(8).default,Vue.prototype.__$appStyle__)},function(t,e,n){"use strict";n.r(e);var i=n(1),o=n.n(i);for(var s in i)"default"!==s&&function(t){n.d(e,t,(function(){return i[t]}))}(s);e.default=o.a},function(t,e,n){"use strict";function i(t){var e=Object.prototype.toString.call(t);return e.substring(8,e.length-1)}function o(){return"string"==typeof __channelId__&&__channelId__}function s(t,e){switch(i(e)){case"Function":return"function() { [native code] }";default:return e}}Object.defineProperty(e,"__esModule",{value:!0}),e.log=function(t){for(var e=arguments.length,n=new Array(e>1?e-1:0),i=1;i<e;i++)n[i-1]=arguments[i];console[t].apply(console,n)},e.default=function(){for(var t=arguments.length,e=new Array(t),n=0;n<t;n++)e[n]=arguments[n];var r=e.shift();if(o())return e.push(e.pop().replace("at ","uni-app:///")),console[r].apply(console,e);var u=e.map((function(t){var e=Object.prototype.toString.call(t).toLowerCase();if("[object object]"===e||"[object array]"===e)try{t="---BEGIN:JSON---"+JSON.stringify(t,s)+"---END:JSON---"}catch(n){t=e}else if(null===t)t="---NULL---";else if(void 0===t)t="---UNDEFINED---";else{var n=i(t).toUpperCase();t="NUMBER"===n||"BOOLEAN"===n?"---BEGIN:"+n+"---"+t+"---END:"+n+"---":String(t)}return t})),a="";if(u.length>1){var c=u.pop();a=u.join("---COMMA---"),0===c.indexOf(" at ")?a+=c:a+="---COMMA---"+c}else a=u[0];console[r](a)}}]);