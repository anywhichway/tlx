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


	var VAR = 0, TEXT = 1, OPEN = 2, CLOSE = 3, ATTR = 4,
		ATTR_KEY = 5, ATTR_KEY_W = 6,
		ATTR_VALUE_W = 7, ATTR_VALUE = 8,
		ATTR_VALUE_SQ = 9, ATTR_VALUE_DQ = 10,
		ATTR_EQ = 11, ATTR_BREAK = 12,
		COMMENT = 13,
		tlx;
	
	
	
	function hyperx(h, opts={}) {
		const concat = opts.concat || function (a, b) {
			return String(a) + String(b);
		};
		//if (opts.attrToProp !== false) {
		//  h = attrToProp(h)
		//}

		return function (strings,...values) {
			if(!strings) {
				throw new TypeError("tlx must be called with an HTML Element or used to interploate a string literal.");
			}
			if(tlx.render && strings instanceof HTMLElement) {
				// this ,makes everything depended on outtere scope, bad!!!
				const vnode = Function("return tlx`"+strings.outerHTML.replace(/\${/g,"\\${")+"`")(),
				node = document.createElement(vnode.nodeName);
				if(this && this!==window) {
					vnode.attributes.state = (tlx.options.reactive && tlx.activate ? tlx.activate(this) : this);
				}
				strings.parentElement.replaceChild(node,strings);
				vnode.node = node;
				tlx.render(vnode);
				return;
			}
			var state = TEXT, reg = "",
				arglen = arguments.length,
				parts = [];
			function quot (state) {
				return state === ATTR_VALUE_SQ || state === ATTR_VALUE_DQ;
			}
			var hasOwn = Object.prototype.hasOwnProperty;
			function has (obj, key) { return hasOwn.call(obj, key); }

			var closeRE = RegExp("^(" + [
				"area", "base", "basefont", "bgsound", "br", "col", "command", "embed",
				"frame", "hr", "img", "input", "isindex", "keygen", "link", "meta", "param",
				"source", "track", "wbr", "!--",
				// SVG TAGS
				"animate", "animateTransform", "circle", "cursor", "desc", "ellipse",
				"feBlend", "feColorMatrix", "feComposite",
				"feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap",
				"feDistantLight", "feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR",
				"feGaussianBlur", "feImage", "feMergeNode", "feMorphology",
				"feOffset", "fePointLight", "feSpecularLighting", "feSpotLight", "feTile",
				"feTurbulence", "font-face-format", "font-face-name", "font-face-uri",
				"glyph", "glyphRef", "hkern", "image", "line", "missing-glyph", "mpath",
				"path", "polygon", "polyline", "rect", "set", "stop", "tref", "use", "view",
				"vkern"
				].join("|") + ")(?:[\.#][a-zA-Z0-9\u007F-\uFFFF_:-]+)*$");
			function selfClosing (tag) { return closeRE.test(tag); }
			function strfn(x) {
				if (typeof x === "function") {
					return x;
				} else if (typeof x === "string") {
					return x;
				} else if (x && typeof x === "object") {
					return x;
				} else {
					return concat("", x);
				}
			}
			function parse(str) {
				var res = [];
				if (state === ATTR_VALUE_W) {
					state = ATTR;
				}
				for (var i = 0; i < str.length; i++) {
					var c = str.charAt(i);
					if (state === TEXT && c === "<") {
						if (reg.length) {
							res.push([TEXT, reg]);
						}
						reg = "";
						state = OPEN;
					} else if (c === ">" && !quot(state) && state !== COMMENT) {
						if (state === OPEN) {
							res.push([OPEN,reg]);
						}
						else if (state === ATTR_KEY) {
							res.push([ATTR_KEY,reg]);
						}
						else if (state === ATTR_VALUE && reg.length) {
							res.push([ATTR_VALUE,reg]);
						}
						res.push([CLOSE]);
						reg = "";
						state = TEXT;
					} else if (state === COMMENT && /-$/.test(reg) && c === "-") {
						if (opts.comments) {
							res.push([ATTR_VALUE,reg.substr(0, reg.length - 1)],[CLOSE]);
						}
						reg = "";
						state = TEXT;
					} else if (state === OPEN && /^!--$/.test(reg)) {
						if (opts.comments) {
							res.push([OPEN, reg],[ATTR_KEY,"comment"],[ATTR_EQ]);
						}
						reg = c;
						state = COMMENT;
					} else if (state === TEXT || state === COMMENT) {
						reg += c;
					} else if (state === OPEN && /\s/.test(c)) {
						res.push([OPEN, reg]);
						reg = "";
						state = ATTR;
					} else if (state === OPEN) {
						reg += c;
					} else if (state === ATTR && /[^\s"'=/]/.test(c)) {
						state = ATTR_KEY;
						reg = c;
					} else if (state === ATTR && /\s/.test(c)) {
						if (reg.length) {
							res.push([ATTR_KEY,reg]);
						}
						res.push([ATTR_BREAK]);
					} else if (state === ATTR_KEY && /\s/.test(c)) {
						res.push([ATTR_KEY,reg]);
						reg = "";
						state = ATTR_KEY_W;
					} else if (state === ATTR_KEY && c === "=") {
						res.push([ATTR_KEY,reg],[ATTR_EQ]);
						reg = "";
						state = ATTR_VALUE_W;
					} else if (state === ATTR_KEY) {
						reg += c;
					} else if ((state === ATTR_KEY_W || state === ATTR) && c === "=") {
						res.push([ATTR_EQ]);
						state = ATTR_VALUE_W;
					} else if ((state === ATTR_KEY_W || state === ATTR) && !/\s/.test(c)) {
						res.push([ATTR_BREAK]);
						if (/[\w-]/.test(c)) {
							reg += c;
							state = ATTR_KEY;
						} else {
							state = ATTR;
						}
					} else if (state === ATTR_VALUE_W && c === '"') {
						state = ATTR_VALUE_DQ;
					} else if (state === ATTR_VALUE_W && c === "'") {
						state = ATTR_VALUE_SQ;
					} else if (state === ATTR_VALUE_DQ && c === '"') {
						res.push([ATTR_VALUE,reg],[ATTR_BREAK]);
						reg = "";
						state = ATTR;
					} else if (state === ATTR_VALUE_SQ && c === "'") {
						res.push([ATTR_VALUE,reg],[ATTR_BREAK]);
						reg = "";
						state = ATTR;
					} else if (state === ATTR_VALUE_W && !/\s/.test(c)) {
						state = ATTR_VALUE;
						i--;
					} else if (state === ATTR_VALUE && /\s/.test(c)) {
						res.push([ATTR_VALUE,reg],[ATTR_BREAK]);
						reg = "";
						state = ATTR;
					} else if (state === ATTR_VALUE || state === ATTR_VALUE_SQ || state === ATTR_VALUE_DQ) {
						reg += c;
					}
				}
				if (state === TEXT && reg.length) {
					res.push([TEXT,reg]);
					reg = "";
				} else if (state === ATTR_VALUE && reg.length) {
					res.push([ATTR_VALUE,reg]);
					reg = "";
				} else if (state === ATTR_VALUE_DQ && reg.length) {
					res.push([ATTR_VALUE,reg]);
					reg = "";
				} else if (state === ATTR_VALUE_SQ && reg.length) {
					res.push([ATTR_VALUE,reg]);
					reg = "";
				} else if (state === ATTR_KEY) {
					res.push([ATTR_KEY,reg]);
					reg = "";
				}
				return res;
			}
			for (let i = 0; i < strings.length; i++) {
				if (i < arglen - 1) {
					let arg = arguments[i+1],
						p = parse(strings[i]),
						xstate = state;
					if (xstate === ATTR_VALUE_DQ) {
						xstate = ATTR_VALUE;
					} else if (xstate === ATTR_VALUE_SQ) {
						xstate = ATTR_VALUE;
					} else if (xstate === ATTR_VALUE_W) {
						xstate = ATTR_VALUE;
					} else if (xstate === ATTR) {
						xstate = ATTR_KEY;
					}
					p.push([ VAR, xstate, arg ]);
					parts.push.apply(parts, p);
				} else {
					parts.push.apply(parts, parse(strings[i]));
				}
			}

			var tree = [null,{},[]],
				stack = [[tree,-1]];
			for (let i = 0; i < parts.length; i++) {
				let cur = stack[stack.length-1][0],
					p = parts[i], s = p[0];
				if (s === OPEN && /^\//.test(p[1])) {
					var ix = stack[stack.length-1][1];
					if (stack.length > 1) {
						stack.pop();
						stack[stack.length-1][0][2][ix] = h(
								cur[0], cur[1], cur[2].length ? cur[2] : undefined
						);
					}
				} else if (s === OPEN) {
					let c = [p[1],{},[]];
					cur[2].push(c);
					stack.push([c,cur[2].length-1]);
				} else if (s === ATTR_KEY || (s === VAR && p[1] === ATTR_KEY)) {
					let key = "",
						copyKey;
					for (; i < parts.length; i++) {
						if (parts[i][0] === ATTR_KEY) {
							key = concat(key, parts[i][1]);
						} else if (parts[i][0] === VAR && parts[i][1] === ATTR_KEY) {
							if (typeof parts[i][2] === "object" && !key) {
								for (copyKey in parts[i][2]) {
									if (parts[i][2].hasOwnProperty(copyKey) && !cur[1][copyKey]) {
										cur[1][copyKey] = parts[i][2][copyKey];
									}
								}
							} else {
								key = concat(key, parts[i][2]);
							}
						} else {
							break;
						}
					}
					if (parts[i][0] === ATTR_EQ) {
						i++;
					}
					let j = i;
					for (; i < parts.length; i++) {
						if (parts[i][0] === ATTR_VALUE || parts[i][0] === ATTR_KEY) {
							if (!cur[1][key]) {
								cur[1][key] = strfn(parts[i][1]);
							} else {
								parts[i][1]==="" ||(cur[1][key] = concat(cur[1][key], parts[i][1])); // AnyWhichWay added parts[i][1]===""
							}
						} else if (parts[i][0] === VAR
								&& (parts[i][1] === ATTR_VALUE || parts[i][1] === ATTR_KEY)) {
							if (!cur[1][key]) {
								cur[1][key] = strfn(parts[i][2]);
							} else {
								parts[i][2]==="" || (cur[1][key] = concat(cur[1][key], parts[i][2])); // AnyWhichWay added parts[i][1]===""
							}
						} else {
							if (key.length && !cur[1][key] && i === j
									&& (parts[i][0] === CLOSE || parts[i][0] === ATTR_BREAK)) {
								// https://html.spec.whatwg.org/multipage/infrastructure.html#boolean-attributes
								// empty string is falsy, not well behaved value in browser
								cur[1][key] = key.toLowerCase();
							}
							if (parts[i][0] === CLOSE) {
								i--;
							}
							break;
						}
					}
				} else if (s === ATTR_KEY) {
					cur[1][p[1]] = true;
				} else if (s === VAR && p[1] === ATTR_KEY) {
					cur[1][p[2]] = true;
				} else if (s === CLOSE) {
					if (selfClosing(cur[0]) && stack.length) {
						let ix = stack[stack.length-1][1];
						stack.pop();
						stack[stack.length-1][0][2][ix] = h(
								cur[0], cur[1], cur[2].length ? cur[2] : undefined
						);
					}
				} else if (s === VAR && p[1] === TEXT) {
					if (p[2] === undefined || p[2] === null) {
						p[2] = "";
					} else if (!p[2]) {
						p[2] = concat("", p[2]);
					}
					if (Array.isArray(p[2][0])) {
						cur[2].push.apply(cur[2], p[2]);
					} else {
						cur[2].push(p[2]);
					}
				} else if (s === TEXT) {
					cur[2].push(p[1]);
				} else if (s === ATTR_EQ || s === ATTR_BREAK) {
					// no-op
				} else {
					throw new Error("unhandled: " + s);
				}
			}

			if (tree[2].length > 1 && /^\s*$/.test(tree[2][0])) {
				tree[2].shift();
			}

			if (tree[2].length > 2 || (tree[2].length === 2 && /\S/.test(tree[2][1]))) {
				throw new Error("multiple root elements must be wrapped in an enclosing tag");
			}

			if (Array.isArray(tree[2][0]) && typeof tree[2][0][0] === "string" && Array.isArray(tree[2][0][2])) {
				tree[2][0] = h(tree[2][0][0], tree[2][0][1], tree[2][0][2]);
			}
			return tree[2][0];
		}
	}
	
	class VNode {
		constructor(config) {
			Object.assign(this,config);
		}
	}
	class VText extends VNode {
		constructor(config) {
			super(config);
		}
	}

	const hCompress = (h) => {
			if(!h || h.compressed) {
				return h;
			}
			h.compressed = true;
			const children = [];
			if(h.children) {
				for(let child of h.children) {
					if(typeof(child)==="string") {
						let text = child.replace(/[ \r\n\t]+/g," ");
						if(/\S/.test(text)) {
							if(text[0]===" " && text[1]===" ") {
								text = text.trimLeft() + " ";
							}
							if(text[text.length-1]===" " && text[text.length-2]===" ") {
								text = text.trimRight() + " ";
							}
							children.push(new VText({text,parent:h}));
						}
					} else if(Array.isArray(child)) {
						for(let item of child) {
							item.parent = h;
							children.push(hCompress(item));
						}
					} else if(child) {
						child.parent = h;
						children.push(hCompress(child));
					}
				}
				h.children = children;
			}
			return h;
		},
		h = (nodeName, attributes, ...args) => {
			// patch for Preact and React
			if(attributes) {
				for(let name in attributes) {
					if(name.indexOf("on")===0) {
						let f = attributes[name];
						if(typeof(f)==="string") { // convert on handler strings into functions
							try {
								f = Function("return " + f)();
								if(typeof(f)==="function") {
									attributes[name] = f;
								}
							} catch(e) { true; }
						}
						if(typeof(f)==="function" && typeof(React)!=="undefined") {
							delete attributes[name];
							name = `on${name[2].toUpperCase()}${name.substring(3)}`; // convert to mixed case
							attributes[name] = f;
						}
					}
				}
			}

			if(typeof(React)!=="undefined") {
				return React.createElement(nodeName,attributes,...args);
			}
			if(typeof(preact)!=="undefined") {
				return preact.h(nodeName,attributes, ...args);
			}
			let children = args.length ? [].concat(...args).filter(item => item!=null) : [];
			return new VNode({nodeName,attributes,children});
		};
	tlx = hyperx(h);
	tlx.fromJSON = (value) => {
		if(typeof(value)==="string") {
			try { value = JSON.parse(value.replace(/&quot;/g,'"'));	} catch(e) { true; }
		}
		return value;
	};
	tlx.getAttribute = (element,name) => {
		const desc = Object.getOwnPropertyDescriptor(element,name);
		return (desc ? desc.value : tlx.fromJSON(element.getAttribute(name)));
	};
	tlx.getAttributes = (element) => {
		const attributes = {};
		for(let attribute of [].slice.call(element.attributes)) {
			attributes[attribute.name] = element[attribute.name] || tlx.fromJSON(attribute.value);
		}
		return attributes;
	};
	tlx.h = h;
	tlx.hCompress = hCompress;
	tlx.options = {};
	tlx.setAttribute = (element,name,value) => {
		value = tlx.fromJSON(value);
		let type = typeof(value);
		if(name==="options" && type==="string") {
			value = value.split(",");
			type = typeof(value);
		}
		if(value && type==="object") {
			element[name] = value;
		} else if(type==="function") {
			//if(name.indexOf("on")===0) element.addEventListener(name.substring(2).toLowerCase(name),value)
			//else element[name] = value;
			element[name] = value;
		} else if(!(element instanceof HTMLSelectElement) || name!=="value") {
			element.setAttribute(name,value);
		}
		if(element.type==="checkbox" && name==="value" && value) {
			requestAnimationFrame(() => element.checked = true);
		} else if(element.type==="select-one" && name==="value") {
			for(let option of [].slice.call(element.options)) {
				value!=tlx.fromJSON(option.value) || requestAnimationFrame(() => option.selected = true);
			}
		} else if(element.type==="select-multiple" && name==="value" && Array.isArray(value)) {
			for(let option of [].slice.call(element.options)) {
				!value.includes(tlx.fromJSON(option.value)) || requestAnimationFrame(() => option.selected = true);
			}
		} 
	}
	tlx.VNode = VNode;
	tlx.VText = VText;
		
	if(typeof(module)!=="undefined") {
		module.exports = tlx;
	}
	if(typeof(window)!=="undefined") {
		window.tlx = tlx;
	}
}).call(this);