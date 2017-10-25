(function() {
	
	/* Copyright 2017, AnyWhichWay, Simon Y. Blackwell, MIT License
	 * Portions of code Copyright (c) 2015, James Halliday BSD Clause 2
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
	SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
	
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

	  return function (strings,...values) {
		if(strings instanceof HTMLElement) {
			strings.model = (typeof(window)!=="undefined" && this!==window ? this : {});
			for(let node of [].slice.call(strings.children)) {
				if(node.innerHTML.indexOf("${")>=0) {
					tlx.render(Function("return tlx`"+node.innerHTML.replace(/\${/g,"\\${")+"`")(),null,node);
				}
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
	            else cur[1][key] = concat(cur[1][key], parts[i][1])
	          } else if (parts[i][0] === VAR
	          && (parts[i][1] === ATTR_VALUE || parts[i][1] === ATTR_KEY)) {
	            if (!cur[1][key]) cur[1][key] = strfn(parts[i][2])
	            else cur[1][key] = concat(cur[1][key], parts[i][2])
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
	    if (typeof x === 'function') return x
	    else if (typeof x === 'string') return x
	    else if (x && typeof x === 'object') return x
	    else return concat('', x)
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
			for(let name in attributes) {
				if(name.indexOf("on")===0) {
					let f = attributes[name];
					if(typeof(f)==="string") { // convert on handler strings into functions
						f = f.substring(0,f.lastIndexOf("("));
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
			if(typeof(React)!=="undefined") return React.createElement(nodeName,attributes,...args);
			if(typeof(preact)!=="undefined") return preact.h(nodeName,attributes, ...args);
			let children = args.length ? [].concat(...args) : null;
		    return new VNode({nodeName,attributes,children});
		},
		resolve = function(template,node) { // walk up the DOM tree for model data, n=node,m=model,p=property,e=extras
const code = // left align, 2 char indent, single char variables to reduce size since templates not minimized
`let model=n.model;
while(!model && n && (n.parentElement||n.ownerElement)) { n = n.parentElement||n.ownerElement; model = !n || n.model; }
if(!model) return;
 do{
  try {
   with(e){with(model){return $.parser__template__;}}
  }catch(err){
   if(err instanceof ReferenceError){
    const p=err.message.split(" ")[0];
     let prnt=n.parentElement||n.ownerElement,v;
      while(prnt){
       let m = prnt.model;
       if(m && typeof(m)==="object" && p in m){v=m[p];break;}
       prnt=prnt.parentElement;
	  }
      if(typeof(v)==="undefined") return; 
	  else e[p]=v;
   }else throw(err);
  }
 }while(true)`.replace(/__template__/g,"`"+template+"`");
			//NODE = ((node instanceof HTMLElement || node instanceof Text || node instanceof Attr) ? node : null);
			const extrs = {};
			/*if(NODE && node.attributes) {
				const attributes = [].slice.call(node.attributes);
				for(let attribute of attributes) extrs[attribute.name] = (typeof(attribute.feteData)!=="undefined" ? attribute.feteData : attribute.value);
			}*/
			let value = new Function("n","$","e",code).call(this,node,tlx.$,extrs);
			//NODE = null;
			return value;
		},
		tlx = hyperx(h);
		let NODE;
		tlx.activate = (object) => {
			if(!object || typeof(object)!=="object" || object.tlxDependents) return object;
			const dependents = {},
				proxy = new Proxy(object,{
					get: (target,property) => {
						if(property==="tlxDependents") return dependents;
						const value = target[property],
							type = typeof(value);
						if(NODE && type!=="function" && type!=="undefined") {
							dependents[property] || (dependents[property] = new Set());
							dependents[property].add(NODE);
						}
						return value;
					},
					set: (target,property,value) => {
						target[property] = value;
						if(dependents[property]) {
							for(let dependent of dependents[property]) {
								if(!dependent.ownerElement && !dependent.parentElement) {
									dependents[property].delete(dependent);
								} else {
									if(!dependent.vnode) {
										if(node.indexOf("${")>=0) {
											tlx.render(tlx.h(dependent),null,dependent);
										}
									} else {
										tlx.render(dependent.vnode,null,dependent);
									}
								}
							}
						}
						return true;
					}
				});
			for(let key in object) object[key] = tlx.activate(object[key]);
			return proxy;
		}
		tlx.$ = {
			parser(strings,...values) {
				if(values.length===1 && strings.filter(item => item.length>0).length===0) return values[0];
				let result = "";
				for(let i=0;i<strings.length;i++) result += (strings[i] + (i<values.length ? (values[i] && typeof(values[i])==="object" ? JSON.stringify(values[i]) : values[i]) : ""));
				return result;
			}
		},
		tlx.h = h;
		tlx.render = (vnode,target,node) => {
		    if(node) {
		    	for(let attribute of [].slice.call(node.attributes)) {
		    		delete node[attribute.name];
		    		node.removeAttribute(attribute.name);
		    	}
		    	while(node.lastChild) node.removeChild(node.lastChild);
		    } else {
		    	node = document.createElement(vnode.nodeName);
		    }
		    NODE = node;
		    if(typeof(vnode)!=="object") return document.createTextNode(vnode+"");
		    node.vnode = vnode;
		    const attributes = vnode.attributes || {};
		    for(let name in attributes) {
		    	const value = attributes[name],
	    			type = typeof(value);
		    	if(type==="string" && value.indexOf("${")>=0) {
		    		setTimeout(() => {
		    			const resolved = resolve(value,node),
		    				type = typeof(resolved);
		    			if(resolved && type==="object") node[name] = value;
			    		else if(type==="function") {
				    		node.addEventListener(name.substring(2).toLowerCase(),value);
				    	} else node.setAttribute(name, resolved);
		    		});
		    	} else {
			    	if(value && type==="object") node[name] = value;
			    	else if(type==="function") {
			    		node.addEventListener(name.substring(2).toLowerCase(),value);
			    	} else node.setAttribute(name, value);
		    	}
		    }
		    (vnode.children || []).forEach(child => {
		    	const childnode = tlx.render(child);
		    	node.appendChild(childnode);
		    	if(childnode instanceof Text && childnode.textContent.indexOf("${")>=0) {
		    		// should probably lift this out and make render a two phase that first does elements, then walks tree for text and attributes
		    		setTimeout(() => {
			    		const value = resolve(childnode.textContent.trim(),node);
			    		childnode.textContent = (!value || typeof(value)!=="object" ? value : JSON.stringify(value));
		    		});
			    }
		    });
		    if(target) target.appendChild(node);
		    NODE = null;
		    return node;
		}


	if(typeof(module)!=="undefined") module.exports = tlx;
	if(typeof(window)!=="undefined") window.tlx = tlx;
}).call(this);