(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function() {
	const tlx = require("./src/tlx-core.js");
	require("./src/tlx-render.js");
	require("./src/tlx-directives.js");
	require("./src/tlx-reactive.js");
})();
},{"./src/tlx-core.js":2,"./src/tlx-directives.js":3,"./src/tlx-reactive.js":4,"./src/tlx-render.js":5}],2:[function(require,module,exports){
(function() {
	
	/* Copyright 2017, AnyWhichWay, Simon Y. Blackwell, MIT License
	 
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
	
	Portions of hyperx code Copyright (c) 2015, James Halliday BSD Clause 2
	All rights reserved.

	Redistribution and use in source and binary forms, with or without modification,
	are permitted provided that the following conditions are met:

	Redistributions of source code must retain the above copyright notice, this list
	of conditions and the following disclaimer.

	Redistributions in binary form must reproduce the above copyright notice, this
	list of conditions and the following disclaimer in the documentation and/or
	other materials provided with the distribution.

	THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
	ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
	WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
	DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
	ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
	(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
	LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
	ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
	SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	
	*/
	
	//var attrToProp = require('hyperscript-attribute-to-property')


	var VAR = 0, TEXT = 1, OPEN = 2, CLOSE = 3, ATTR = 4
	var ATTR_KEY = 5, ATTR_KEY_W = 6
	var ATTR_VALUE_W = 7, ATTR_VALUE = 8
	var ATTR_VALUE_SQ = 9, ATTR_VALUE_DQ = 10
	var ATTR_EQ = 11, ATTR_BREAK = 12
	var COMMENT = 13

	function hyperx(h, opts) {
	  if (!opts) opts = {}
	  var concat = opts.concat || function (a, b) {
	    return String(a) + String(b)
	  }
	  //if (opts.attrToProp !== false) {
	  //  h = attrToProp(h)
	  //}

	  return function (strings=document.body,...values) {
		if(tlx.render && strings instanceof HTMLElement) {
			let node = strings;
			if(node.innerHTML.indexOf("${")>=0) {
				if(node.childNodes.length>1) {
					const span = document.createElement("span");
					node.parentElement.insertBefore(span,node);
					span.appendChild(node);
					node = span;
				}
				node.state = (typeof(window)!=="undefined" && this!==window ? (this instanceof Node ? this.state : this) : node.state);
				!node.state || !tlx.options || !tlx.options.reactive || !tlx.activate || (node.state = tlx.activate(node.state));
				const vnode = Function("state","with(state) { return tlx.bind(this)`"+node.innerHTML.replace(/\${/g,"\\${")+"`}").call(this,node.state||{});
				//vnode.attributes || (vnode.attributes = {});
				//!node.state || vnode.attributes.state || (vnode.attributes.state = node.state);
				tlx.render(vnode,null,node);
			}
			return;
		}
	    var state = TEXT, reg = ''
	    var arglen = arguments.length
	    var parts = []

	    for (var i = 0; i < strings.length; i++) {
	      if (i < arglen - 1) {
	        var arg = arguments[i+1]
	        var p = parse(strings[i])
	        var xstate = state
	        if (xstate === ATTR_VALUE_DQ) xstate = ATTR_VALUE
	        else if (xstate === ATTR_VALUE_SQ) xstate = ATTR_VALUE
	        else if (xstate === ATTR_VALUE_W) xstate = ATTR_VALUE
	        else if (xstate === ATTR) xstate = ATTR_KEY
	        p.push([ VAR, xstate, arg ])
	        parts.push.apply(parts, p)
	      } else parts.push.apply(parts, parse(strings[i]))
	    }

	    var tree = [null,{},[]]
	    var stack = [[tree,-1]]
	    for (var i = 0; i < parts.length; i++) {
	      var cur = stack[stack.length-1][0]
	      var p = parts[i], s = p[0]
	      if (s === OPEN && /^\//.test(p[1])) {
	        var ix = stack[stack.length-1][1]
	        if (stack.length > 1) {
	          stack.pop()
	          stack[stack.length-1][0][2][ix] = h(
	            cur[0], cur[1], cur[2].length ? cur[2] : undefined
	          )
	        }
	      } else if (s === OPEN) {
	        var c = [p[1],{},[]]
	        cur[2].push(c)
	        stack.push([c,cur[2].length-1])
	      } else if (s === ATTR_KEY || (s === VAR && p[1] === ATTR_KEY)) {
	        var key = ''
	        var copyKey
	        for (; i < parts.length; i++) {
	          if (parts[i][0] === ATTR_KEY) {
	            key = concat(key, parts[i][1])
	          } else if (parts[i][0] === VAR && parts[i][1] === ATTR_KEY) {
	            if (typeof parts[i][2] === 'object' && !key) {
	              for (copyKey in parts[i][2]) {
	                if (parts[i][2].hasOwnProperty(copyKey) && !cur[1][copyKey]) cur[1][copyKey] = parts[i][2][copyKey]
	              }
	            } else key = concat(key, parts[i][2])
	          } else break
	        }
	        if (parts[i][0] === ATTR_EQ) i++
	        var j = i
	        for (; i < parts.length; i++) {
	          if (parts[i][0] === ATTR_VALUE || parts[i][0] === ATTR_KEY) {
	            if (!cur[1][key]) cur[1][key] = strfn(parts[i][1])
	            else parts[i][1]==="" ||(cur[1][key] = concat(cur[1][key], parts[i][1])); // AnyWhichWay added parts[i][1]===""
	          } else if (parts[i][0] === VAR
	          && (parts[i][1] === ATTR_VALUE || parts[i][1] === ATTR_KEY)) {
	            if (!cur[1][key]) cur[1][key] = strfn(parts[i][2])
	            else parts[i][2]==="" || (cur[1][key] = concat(cur[1][key], parts[i][2])); // AnyWhichWay added parts[i][1]===""
	          } else {
	            if (key.length && !cur[1][key] && i === j
	            && (parts[i][0] === CLOSE || parts[i][0] === ATTR_BREAK)) {
	              // https://html.spec.whatwg.org/multipage/infrastructure.html#boolean-attributes
	              // empty string is falsy, not well behaved value in browser
	              cur[1][key] = key.toLowerCase()
	            }
	            if (parts[i][0] === CLOSE) {
	              i--
	            }
	            break
	          }
	        }
	      } else if (s === ATTR_KEY) cur[1][p[1]] = true
	      else if (s === VAR && p[1] === ATTR_KEY) cur[1][p[2]] = true
	      else if (s === CLOSE) {
	        if (selfClosing(cur[0]) && stack.length) {
	          var ix = stack[stack.length-1][1]
	          stack.pop()
	          stack[stack.length-1][0][2][ix] = h(
	            cur[0], cur[1], cur[2].length ? cur[2] : undefined
	          )
	        }
	      } else if (s === VAR && p[1] === TEXT) {
	        if (p[2] === undefined || p[2] === null) p[2] = ''
	        else if (!p[2]) p[2] = concat('', p[2])
	        if (Array.isArray(p[2][0])) cur[2].push.apply(cur[2], p[2])
	        else cur[2].push(p[2])
	      } else if (s === TEXT) cur[2].push(p[1])
	      else if (s === ATTR_EQ || s === ATTR_BREAK) {
	        // no-op
	      } else throw new Error('unhandled: ' + s)
	    }

	    if (tree[2].length > 1 && /^\s*$/.test(tree[2][0])) tree[2].shift()

	    if (tree[2].length > 2 || (tree[2].length === 2 && /\S/.test(tree[2][1]))) throw new Error('multiple root elements must be wrapped in an enclosing tag')

	    if (Array.isArray(tree[2][0]) && typeof tree[2][0][0] === 'string'
	    && Array.isArray(tree[2][0][2])) {
	      tree[2][0] = h(tree[2][0][0], tree[2][0][1], tree[2][0][2])
	    }
	    return tree[2][0]

	    function parse (str) {
	      var res = []
	      if (state === ATTR_VALUE_W) state = ATTR
	      for (var i = 0; i < str.length; i++) {
	        var c = str.charAt(i)
	        if (state === TEXT && c === '<') {
	          if (reg.length) res.push([TEXT, reg])
	          reg = ''
	          state = OPEN
	        } else if (c === '>' && !quot(state) && state !== COMMENT) {
	          if (state === OPEN) res.push([OPEN,reg])
	          else if (state === ATTR_KEY) res.push([ATTR_KEY,reg])
	          else if (state === ATTR_VALUE && reg.length) res.push([ATTR_VALUE,reg])
	          res.push([CLOSE])
	          reg = ''
	          state = TEXT
	        } else if (state === COMMENT && /-$/.test(reg) && c === '-') {
	          if (opts.comments) res.push([ATTR_VALUE,reg.substr(0, reg.length - 1)],[CLOSE])
	          reg = ''
	          state = TEXT
	        } else if (state === OPEN && /^!--$/.test(reg)) {
	          if (opts.comments) res.push([OPEN, reg],[ATTR_KEY,'comment'],[ATTR_EQ])
	          reg = c
	          state = COMMENT
	        } else if (state === TEXT || state === COMMENT) {
	          reg += c
	        } else if (state === OPEN && /\s/.test(c)) {
	          res.push([OPEN, reg])
	          reg = ''
	          state = ATTR
	        } else if (state === OPEN) {
	          reg += c
	        } else if (state === ATTR && /[^\s"'=/]/.test(c)) {
	          state = ATTR_KEY
	          reg = c
	        } else if (state === ATTR && /\s/.test(c)) {
	          if (reg.length) res.push([ATTR_KEY,reg])
	          res.push([ATTR_BREAK])
	        } else if (state === ATTR_KEY && /\s/.test(c)) {
	          res.push([ATTR_KEY,reg])
	          reg = ''
	          state = ATTR_KEY_W
	        } else if (state === ATTR_KEY && c === '=') {
	          res.push([ATTR_KEY,reg],[ATTR_EQ])
	          reg = ''
	          state = ATTR_VALUE_W
	        } else if (state === ATTR_KEY) reg += c
	        else if ((state === ATTR_KEY_W || state === ATTR) && c === '=') {
	          res.push([ATTR_EQ])
	          state = ATTR_VALUE_W
	        } else if ((state === ATTR_KEY_W || state === ATTR) && !/\s/.test(c)) {
	          res.push([ATTR_BREAK])
	          if (/[\w-]/.test(c)) {
	            reg += c
	            state = ATTR_KEY
	          } else state = ATTR
	        } else if (state === ATTR_VALUE_W && c === '"') state = ATTR_VALUE_DQ
	        else if (state === ATTR_VALUE_W && c === "'") state = ATTR_VALUE_SQ
	        else if (state === ATTR_VALUE_DQ && c === '"') {
	          res.push([ATTR_VALUE,reg],[ATTR_BREAK])
	          reg = ''
	          state = ATTR
	        } else if (state === ATTR_VALUE_SQ && c === "'") {
	          res.push([ATTR_VALUE,reg],[ATTR_BREAK])
	          reg = ''
	          state = ATTR
	        } else if (state === ATTR_VALUE_W && !/\s/.test(c)) {
	          state = ATTR_VALUE
	          i--
	        } else if (state === ATTR_VALUE && /\s/.test(c)) {
	          res.push([ATTR_VALUE,reg],[ATTR_BREAK])
	          reg = ''
	          state = ATTR
	        } else if (state === ATTR_VALUE || state === ATTR_VALUE_SQ || state === ATTR_VALUE_DQ) reg += c
	      }
	      if (state === TEXT && reg.length) {
	        res.push([TEXT,reg])
	        reg = ''
	      } else if (state === ATTR_VALUE && reg.length) {
	        res.push([ATTR_VALUE,reg])
	        reg = ''
	      } else if (state === ATTR_VALUE_DQ && reg.length) {
	        res.push([ATTR_VALUE,reg])
	        reg = ''
	      } else if (state === ATTR_VALUE_SQ && reg.length) {
	        res.push([ATTR_VALUE,reg])
	        reg = ''
	      } else if (state === ATTR_KEY) {
	        res.push([ATTR_KEY,reg])
	        reg = ''
	      }
	      return res
	    }
	  }

	  function strfn (x) {
	    if (typeof x === 'function') {
	    	return x
	    }
	    else if (typeof x === 'string') {
	    	return x
	    }
	    else if (x && typeof x === 'object') {
	    	return x
	    }
	    else {
	    	return concat('', x)
	    }
	  }
	}

	function quot (state) {
	  return state === ATTR_VALUE_SQ || state === ATTR_VALUE_DQ
	}

	var hasOwn = Object.prototype.hasOwnProperty
	function has (obj, key) { return hasOwn.call(obj, key) }

	var closeRE = RegExp('^(' + [
	  'area', 'base', 'basefont', 'bgsound', 'br', 'col', 'command', 'embed',
	  'frame', 'hr', 'img', 'input', 'isindex', 'keygen', 'link', 'meta', 'param',
	  'source', 'track', 'wbr', '!--',
	  // SVG TAGS
	  'animate', 'animateTransform', 'circle', 'cursor', 'desc', 'ellipse',
	  'feBlend', 'feColorMatrix', 'feComposite',
	  'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap',
	  'feDistantLight', 'feFlood', 'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR',
	  'feGaussianBlur', 'feImage', 'feMergeNode', 'feMorphology',
	  'feOffset', 'fePointLight', 'feSpecularLighting', 'feSpotLight', 'feTile',
	  'feTurbulence', 'font-face-format', 'font-face-name', 'font-face-uri',
	  'glyph', 'glyphRef', 'hkern', 'image', 'line', 'missing-glyph', 'mpath',
	  'path', 'polygon', 'polyline', 'rect', 'set', 'stop', 'tref', 'use', 'view',
	  'vkern'
	].join('|') + ')(?:[\.#][a-zA-Z0-9\u007F-\uFFFF_:-]+)*$')
	function selfClosing (tag) { return closeRE.test(tag) }
	
	class VNode {
		constructor(config) {
			Object.assign(this,config);
			/*return new Proxy(this,{
				get, set, delete update real DOM nodes;
				
				Mutation observer will update Vdom nodes?
			})*/
		}
	}

	const h = (nodeName, attributes, ...args) => {
			// patch for Preact and React
			if(attributes) {
				for(let name in attributes) {
					if(name.indexOf("on")===0) {
						let f = attributes[name];
						if(typeof(f)==="string") { // convert on handler strings into functions
							try {
								f = Function("return " + f)();
								if(typeof(f)==="function") attributes[name] = f;
							} catch(e) { }
						}
						if(typeof(f)==="function" && typeof(React)!=="undefined") {
							delete attributes[name];
							name = `on${name[2].toUpperCase()}${name.substring(3)}`; // convert to mixed case
							attributes[name] = f;
						}
					}
				}
			}
				
			if(typeof(React)!=="undefined") return React.createElement(nodeName,attributes,...args);
			if(typeof(preact)!=="undefined") return preact.h(nodeName,attributes, ...args);
			let children = args.length ? [].concat(...args) : null;
		    return new VNode({nodeName,attributes,children});
		};
		tlx = hyperx(h);
		tlx.fromJSON = (value) => {
			if(typeof(value)==="string") {
				try { value = JSON.parse(value.replace(/&quot;/g,'"'));	} catch(e) { }
			}
			return value;
		};
		tlx.getAttribute = (element,name) => {
			const desc = Object.getOwnPropertyDescriptor(element,name);
			return (desc ? desc.value : tlx.fromJSON(element.getAttribute(name)));
		};
		tlx.getAttributes = (element) => {
			const attributes = {};
			for(let attribute of [].slice.call(element.attributes)) attributes[attribute.name] = element[attribute.name] || tlx.fromJSON(attribute.value);
			return attributes;
		};
		tlx.h = h;
		tlx.options = {};
		tlx.setAttribute = (element,name,value) => {
			let type = typeof(value);
			if(name==="options" && type==="string" && value.indexOf("${")===-1) {
				value = value.split(",");
				type = typeof(value);
			}
			if(value && type==="object") element[name] = value;
			else if(type==="function") {
				if(name.indexOf("on")===0) element.addEventListener(name.substring(2).toLowerCase(name),value)
				else element[name] = value;
			} else element.setAttribute(name,value);
			if(element.type==="checkbox" && name==="value" && value) element.checked = true;
			else if(element.type==="select-one" && name==="value") {
				for(let option of [].slice.call(element.options)) value!=tlx.fromJSON(option.value) || (option.selected = true);
			} else if(element.type==="select-multiple" && name==="value" && Array.isArray(value)) {
				for(let option of [].slice.call(element.options)) !value.includes(tlx.fromJSON(option.value)) || (option.selected = true);
			} 
		}
		

	if(typeof(module)!=="undefined") module.exports = tlx;
	if(typeof(window)!=="undefined") window.tlx = tlx;
}).call(this);
},{}],3:[function(require,module,exports){
(function(tlx) {
	tlx.directives = {
		VNode: {
			handle(name,value,node) {
				const directive = this[name];
				if(directive && name[1]==="-") {
					node.attributes[name]  = directive(node,value);
				}
			},
			"t-if": (node,value) => {
				if(!value) {
					node.children = null;
				}
				return value;
			}
		},
		HTMLElement: {
			handle(name,value,node) {
				const directive = this[name];
				if(directive && name[1]==="-") {
					const result = directive(node,value);
					if(typeof(result)!=="undefined" && result!==value) {
						if(result && typeof(result)==="object") node[name] = result;
						else node.setAttribute(name,result);
					}
				}
			},
			"t-if": (node,value) => {
				if(!value) {
					while(node.lastChild) node.removeChild(node.lastChild);
				}
				return value;
			},
			"t-foreach": (node,value) => {
				const el = document.createElement(node.tagName),
					template = node.cloneNode(true),
					children = [].slice.call(template.childNodes);
				while(node.lastChild) node.removeChild(node.lastChild);
				if(Array.isArray(value)) {
					for(let i=0;i<value.length;i++) {
						for(let child of children) {
							const clone = child.cloneNode(true);
							el.appendChild(clone);
							tlx.bind({key:i,value:value[i],object:value})(clone);
						}
					}
				} else if(value && typeof(value)==="object") {
					for(let key in value) {
						for(let child of children) {
							const clone = child.cloneNode(true);
							el.appendChild(clone);
							tlx.bind({key,value:value[key],object:value})(clone);
						}
					}
				}
				for(let child of [].slice.call(el.childNodes)) node.appendChild(child);
			},
			"t-for": (node,value) => {
				if(typeof(value)==="string") {
					const el = document.createElement(node.tagName),
						template = node.cloneNode(true),
					children = [].slice.call(template.childNodes);
					while(node.lastChild) node.removeChild(node.lastChild);
					const [key,op,target] = value.split(" ");
					if(op==="of" && target) {
						let array;
						if(target.indexOf("${")>=0) {
							array = resolve(target,node);
						} else {
							try {
								array = JSON.parse(target);
							} catch(e) { }
						}
						for(let i=0;i<array.length;i++) {
							for(let child of children) {
								const clone = child.cloneNode(true);
								el.appendChild(clone);
								const state = {};
								state[key] = array[i];
								tlx.bind(state)(clone);
							}
						}
					} else if(op==="in" && target) {
						let object;
						if(target.indexOf("${")>=0) {
							object = resolve(target,node);
						} else {
							try {
								object = JSON.parse(target);
							} catch(e) { }
						}
						for(let property in object) {
							for(let child of children) {
								const clone = child.cloneNode(true);
								el.appendChild(clone);
								const state = {object};
								state[key] = property;
								tlx.bind(state)(clone);
							}
						}
					}
					for(let child of [].slice.call(el.childNodes)) node.appendChild(child);
				}
			},
			"t-on": (node,value) => {
				node.removeAttribute("t-on");
				for(let event in value) {
					node.addEventListener(event,value[event]);
				}
			}
		}
	}
})(tlx);
},{}],4:[function(require,module,exports){
(function(tlx) {
	
	HTMLElement.prototype.linkState = function(property) {
		const f = function(event) {
			const target = event.target;
			let value;
			if(target.type==="checkbox") value = target.checked;
			else if(target.type==="select-multiple") {
				value = [];
				for(let option of target.options) !option.selected || value.push(tlx.fromJSON(option.value));
			} else value = tlx.fromJSON(target.value);
			const parts = property.split(".");
			let state = this;
			property = parts.pop(); // get final property
			for(let key of parts) { state = state[key] || {}}; // walk tree
			state[property] = value; // set property
		}
		return f.bind(tlx.getState(this)||(this.state={}));
	}
	tlx.activate = (object) => {
		if(!object || typeof(object)!=="object" || object.tlxDependents) return object;
		const dependents = {},
			proxy = new Proxy(object,{
				get: (target,property) => {
					if(property==="tlxDependents") return dependents;
					const value = target[property],
						type = typeof(value);
					if(tlx._NODE && type!=="function" && type!=="undefined") {
						dependents[property] || (dependents[property] = new Set());
						dependents[property].add(tlx._NODE);
					}
					return value;
				},
				set: (target,property,value) => {
					if(target[property]!==value) {
						!value || typeof(value)!=="object" || value.tlxDependents || (value = tlx.activate(value));
						target[property] = value;
						if(dependents[property]) {
							for(let dependent of dependents[property]) {
								if(!dependent.ownerElement && !dependent.parentElement) dependents[property].delete(dependent);
								else {
									if(!dependent.vnode) {
										if(dependent.outerHTML.indexOf("${")>=0) tlx.render(tlx.h(dependent),null,dependent);
									} else tlx.render(dependent.vnode,null,dependent);
								}
							}
						}
					}
					return true;
				}
			});
		for(let key in object) object[key] = tlx.activate(object[key]);
		return proxy;
	};
	tlx.options || (tlx.options={});
	tlx.options.reactive = true;
		
})(tlx);
},{}],5:[function(require,module,exports){
(function(tlx) {
	
	const resolve = function(template,node,nonReactive) { // walk up the DOM tree for state data, n=node,s=state,p=property,e=extras
			const code = // left align, 2 char indent, single char variables to reduce size since templates not minimized
`let state=n.state;
while(!state && n && (n.parentElement||n.ownerElement)) { n = n.parentElement||n.ownerElement; state = !n || n.state; }
if(!state) return;
 do{
  try {
   with(e){with(state){return $.parser__template__;}}
  }catch(err){
   if(err instanceof ReferenceError){
    const p=err.message.split(" ")[0];
     let prnt=n.parentElement||n.ownerElement,v;
      while(prnt){
       let s = prnt.state;
       if(s && typeof(s)==="object" && p in s){v=s[p];break;}
       prnt=prnt.parentElement;
	  }
      if(typeof(v)==="undefined") return; 
	  else e[p]=v;
   }else throw(err);
  }
 }while(true)`.replace(/__template__/g,"`"+template+"`");
			tlx._NODE = (nonReactive ? null : node);
			const extrs = {};
			let value = new Function("n","$","e",code).call(node,node,tlx.$,extrs);
			tlx._NODE = null;
			return value;
	};
	tlx.getState = (node) => { // force resolution of parent states first
		let state;
		if(!node) return;
		if(node.state) return node.state;
		let parent = node.parentElement||node.ownerElement;
		if(parent) state = tlx.getState(parent);
		const statestr = node.getAttribute("state");
		if(statestr && statestr.indexOf("${")>=0) {
			return node.state = resolve(statestr,{state:{}});
		}
		return state;
	}
	tlx.render = (vnode,target,node) => {
		function renderVNode(vnode,node,parent) {
		    if(typeof(vnode)!=="object") {
		    	let text = vnode+"";
				if(/\S/.test(text)) { // don't bother with empty text nodes
			    	text = text.replace(/[ \r\n\t]+/g," ");
					if(text[0]===" " && text[1]===" ") text = text.trimLeft() + " ";
					if(text[text.length-1]===" " && text[text.length-2]===" ") text = text.trimRight() + " ";
					if(text.indexOf("${")>=0) {
						node || (node = document.createTextNode(text));
						templates.set(node,text);
						return node;
					}
					!node || (node.textContent = text);
					node || (node = document.createTextNode(text));
					node.parentNode || !parent || parent.appendChild(node);
					return node;
				}
				return;
		    }
		    if(["template","script"].includes(vnode.nodeName)) return node;
		    node || (node = document.createElement(vnode.nodeName));
		    node.parentNode || !parent || parent.appendChild(node);
		    const attributes = vnode.attributes || {};
		    if(attributes.state && typeof(attributes.state)==="string") {
				const value = tlx.fromJSON(vnode.attributes.state);
				attributes.state===value || (attributes.state = value);
			}
		    if(tlx.directives && tlx.directives.VNode && tlx.directives.VNode.handle) {
		    	for(let name in attributes) {
		    		tlx.directives.VNode.handle(name,tlx.fromJSON(attributes[name]),vnode);
		    	}
		    }
		    for(let name in attributes) {
		    	const value = attributes[name],
	    			type = typeof(value);
		    	if((type==="string" && value.indexOf("${")>=0) || name[1]==="-") {
		    		templates.set(templates.size,{node:node,template:value,name});
		    	} else tlx.setAttribute(node,name,value);
		    }
		    (vnode.children || []).forEach(child => {
		    	if(!child) return; // should not happen
		    	Array.isArray(child) || (child = [child]); // not sure why this needs to happen sometimes, child should never be an array
		    	for(let vnode of child) {
		    		const childnode = renderVNode(vnode,null,node);
			    	if(!childnode) return;
			    	childnode.vnode = vnode;
			    	if(childnode instanceof Text && childnode.textContent.indexOf("${")>=0) {
			    		templates.set(childnode,childnode.textContent.trim());
				    }
				    node.appendChild(childnode);
		    	}
		    });
		    if(tlx.Component && node && node instanceof HTMLElement) {
		    	const cls = tlx.Component.registered(node.tagName);
		    	!cls || cls.create(vnode.attributes||{},node).connectedCallback();
		    }
		    return node;
		}
	    if(node) {
	    	while(node.lastChild) node.removeChild(node.lastChild);
	    }
	    !node || (node.vnode = vnode);
		const templates = new Map();
		node = renderVNode(vnode,node);
		for(let [node,template] of templates) {
			if(typeof(template)==="object") { // it is an attribute
				const name = template.name;
				node = template.node;
				template = template.template;
				const nonreactive = name!=="value" || !tlx.Component || node instanceof tlx.Component;
					resolved = (typeof(template)==="string" ? tlx.fromJSON(resolve(template,node,nonreactive)) : template);
				type = typeof(resolved);
			    !tlx.directives || !tlx.directives.HTMLElement || !tlx.directives.HTMLElement.handle || tlx.directives.HTMLElement.handle(name,resolved,node);
			    tlx.setAttribute(node,name,resolved);
			} else {
				const resolved = resolve(template,node);
				node.textContent = (!resolved || typeof(resolved)!=="object" ? resolved : JSON.stringify(resolved));
			}
		}
	    if(target) target.appendChild(node);
	    return node;
	};
	tlx.resolve = resolve;
	tlx._NODE = null;
	tlx.$ = {
		parser(strings,...values) {
			if(values.length===1 && strings.filter(item => item.length>0).length===0) return values[0];
			let result = "";
			for(let i=0;i<strings.length;i++) result += (strings[i] + (i<values.length ? (values[i] && typeof(values[i])==="object" ? JSON.stringify(values[i]) : values[i]) : ""));
			return result;
		}
	};
})(tlx);
},{}]},{},[1]);
