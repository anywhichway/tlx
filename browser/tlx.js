(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function() {
	const tlx = require("./src/tlx-core.js");
	require("./src/tlx-directives.js");
	require("./src/tlx-component.js");
	require("./src/tlx-reactive.js");
	require("./src/tlx-template.js");
})();
},{"./src/tlx-component.js":2,"./src/tlx-core.js":3,"./src/tlx-directives.js":4,"./src/tlx-reactive.js":5,"./src/tlx-template.js":6}],2:[function(require,module,exports){
(function(tlx) {
	"use strict";
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
	*/
	tlx.components = {};
	tlx.mount = function(...tagNames) {
		tagNames.length>0 || (tagNames = Object.keys(this.components));
		for(let tagName of tagNames) {
			const component = this.components[tagName];
			for(let element of [].slice.call(document.getElementsByTagName(tagName)||[])) {
				const attributes = [].slice.call(element.attributes).reduce((accum,attribute) => { accum[attribute.name] = attribute.value; return accum; },{});
				component(attributes,element);
				element.render();
			}
		}
	}
	tlx.register = function(tagName,component) {
		this.components[tagName] = component;
		if(this.promises && this.promises[tagName]) {
			this.promises[tagName](component);
		}
	}
	tlx.get = function(tagName) {
		return this.components[tagName];
	}
	tlx.whenDefined = function(tagName) {
		this.promises || (this.promises = {});
		let resolver;
		const promise = new Promise(resolve => resolver = resolve);
		this.promises[tagName] = resolver;
		!this.components[tagName] || resolver(this.components[tagName]);
		return promise;
	}
	tlx.getTagName = function(component) {
		for(let tagName in this.components) {
			if(this.components[tagName]===component) return tagName;
		}
	}
	tlx.Mixin = {
		initialize(attributes) {
			for(let name in attributes) this.setAttribute(name,(typeof(attributes[name])==="string" ? this.parse(attributes[name]): attributes[name]),true);
			this.id || this.setAttribute("id",`rid${String(Math.random()).substring(2)}`,true);
		},
		toString() { 
			const stringify = (v) => {
					const type = typeof(v);
					if(type==="string") return v;
					if(v && type==="object") {
						if(Array.isArray(v)) v = v.map(item => (item && typeof(item)==="object" && item instanceof HTMLElement ? item.getAttributes() : item));
						else if (v instanceof HTMLelement) v = v.getAttributes();
						return "${" + JSON.stringify(v) + "}";
					}
					return JSON.stringify(v);
				}
			return `<${this.localName}${[].slice.call(this.attributes).reduce((accum,attribute) => accum += (` ${attribute.name}="${stringify(this.getAttribute(attribute.name))}"`),"")}>${this.innerHTML}</${this.localName}>`
		}
	}
	tlx.options || (tlx.options={});
	tlx.options.components = true;
}(tlx));
},{}],3:[function(require,module,exports){
(function() {
	"use strict";
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
	*/
	
	const tlx = {
			components:{},
			enable(options={}) {
				this.options = Object.assign({},this.options,options);
				if(this.options.components || this.options.templates) {
					window.addEventListener("load",() => {
						if(this.options.templates) {
							for(let element of [].slice.call(document.getElementsByTagName("template")||[])) {
								this.compile(element);
							}
						}
						if(this.options.components) this.mount();
						document.head.render();
						document.body.render();
					});
				}
				HTMLElement.prototype.getAttributes = function() {
					return [].slice.call(this.attributes).reduce((accum,attribute) => { accum[attribute.name] = this.getAttribute(attribute.name); return accum;},{});
				}
				HTMLElement.prototype.render = function() {
					for(let attribute of [].slice.call(this.attributes)) attribute.render();
					for(let attribute of [].slice.call(this.attributes)) {
						const directive = (tlx.directives ? tlx.directives[attribute.name] : null);
						if(directive) {
							const template = this.innerHTML || this.textContent,
								name = attribute.name,
								render = (this.render===HTMLElement.prototype.render ? null : this.render);
				  		this.render = function()  {
				  			!render || render.call(this);
				  			const html = directive(this.getAttribute(name),template,this);
				  			if(typeof(html)==="undefined") {
				  				this.innerHTML = "";
				  			} else {
				  				this.innerHTML = html;
					  			for(let child of [].slice.call(this.childNodes)) child instanceof HTMLTemplateElement || child instanceof HTMLScriptElement || child.render();
				  			}
				  			return this.innerHTML;
				  		}
				  	}
					}
					if(this.render===HTMLElement.prototype.render) {
						for(let child of [].slice.call(this.childNodes)) child instanceof HTMLTemplateElement || child instanceof HTMLScriptElement || child.render();
						return this.innerHTML;
					} else {
						return this.render();
					}
				}
				HTMLElement.prototype.resolve = function(template,attributes) {
					const as = this.getAncestorWithState();
					return Function("el","state","attr","with(el) { with(state) { with(attr) { return `" + template + "`}}}")(this,as.state||{},Object.assign({},this.getAttributes(),attributes)); 
				}
				const _HTMLElement_getAttribute = HTMLElement.prototype.getAttribute;
				HTMLElement.prototype.getAttribute = function(name) {
					let value = this[name],
						type = typeof(value);
					if(type==="undefined") value = this.parse(_HTMLElement_getAttribute.call(this,name)); type = typeof(value);
					if(value && type==="object" && value instanceof HTMLElement) return value.getAttributes();
					return value;
				}
				const _HTMLElement_setAttribute = HTMLElement.prototype.setAttribute;
				HTMLElement.prototype.setAttribute = function(name,value,lazy) {
					const equal = (a,b) => {
						const typea = typeof(a),
							typeb = typeof(b);
						return typea === typeb &&
							(a===b ||
							(Array.isArray(a) && Array.isArray(b) && a.length===b.length && a.every((item,i) => b[i]===item)) ||
							(a && b && typea==="object" && Object.keys(a).every(key => equal(a[key],b[key])) && Object.keys(b).every(key => equal(a[key],b[key]))))	
					}
					let type = typeof(value),
						oldvalue = this.getAttribute(name);
					const neq = !equal(oldvalue,value);
					if(neq || lazy) {
						if(value==null) { delete this[name]; this.removeAttribute(name); }
						if(type==="object" || type==="function") this[name] = value;
						else _HTMLElement_setAttribute.call(this,name,value);
						name!=="state" || !this.bind || this.bind(value);
					}
					if(tlx.options.reactive && !lazy && this.render && neq) this.render();
				}
			  Node.prototype.parse = function(value) {
					if(typeof(value)==="string" && value.indexOf("${")===0) return this.parse(Function("return (function() { return arguments[arguments.length-1]; })`" + value + "`")());
					try { return JSON.parse(value)	} catch(error) { return value }
				}
			  Attr.prototype.render = function() {
			  	if(this.value.indexOf("${")>=0 && !Object.getOwnPropertyDescriptor(this,"render")) {
			  		const template = this.value;
			  		this.render = function() { const value = this.parse(template); this.ownerElement.setAttribute(this.name,value,true); return value; }
			  		this.render();
			  	}
			  }
				Text.prototype.render = function() {
					if(this.textContent.indexOf("${")>=0) {
						const template = this.textContent;
						this.render = function() {
							const as = this.getAncestorWithState();
							return this.textContent = Function("el","state","attr","with(el) { with(state) { with(attr) { return `" + template + "` }}}")(this.parentNode,as.state||{},Object.assign({},this.parentNode.getAttributes()));
						}
						return this.render();
					}
					return this.textContent;
				}
				Node.prototype.getAncestorWithState = function() {
					const parentNode = this.parentNode;
					if(parentNode && parentNode instanceof HTMLElement) {
						const state = parentNode.getAttribute("state");
						if(state) return {parentNode,state};
						return parentNode.getAncestorWithState();
					}
					return {}
				}
			}
		}
		
	if(typeof(module)!=="undefined") {
		module.exports = tlx;
	}
	if(typeof(window)!=="undefined") {
		window.tlx = tlx;
	}
}).call(this);
},{}],4:[function(require,module,exports){
(function(tlx) {
	"use strict";
	tlx.directives = {
			"t-if": (value,template,element) => {
				if(value) {
					return element.resolve(template,{value})
				}
			},
			"t-for": (spec,template,element) => {
	  			if(spec.of) {
	  				return spec.of.reduce((accum,value,index,array) => accum += element.resolve(template,{[spec.let||spec.var]:value,value,index,array}),"");
	  			} else {
	  				return Object.keys(spec.in).reduce((accum,key) => accum += element.resolve(template,{[spec.let||spec.var]:spec.in[key],value:spec.in[key],key,object:spec.in}),"");
	  			}
			},
			"t-foreach": (value,template,element) => {
				if(Array.isArray(value)) return tlx.directives["t-for"]({of:value,let:'value'},template,element);
				return tlx.directives["t-for"]({in:value,let:'key'},template,element);
			},
			"t-on": (value,template,element) => {
				for(let key in value) {
					element["on"+key] = value[key];
				}
				return template;
			}
	};
}(tlx));
},{}],5:[function(require,module,exports){
(function(tlx) {
	"use strict";
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
	*/
	tlx.bind = function(object,node,path="") {
		if(node.state===object && object.__boundNodes__) return object;
		for(let key in object) {
			const value = object[key];
			if(value && typeof(value)==="object") object[key] = this.bind(value,node,`${path}${key}.`);
		}
		let proxy = (node.attributes.state ? node.attributes.state.data : null);
		if(!proxy) {
			const nodes = new Map();
			proxy = new Proxy(object,{
				get(target,property) {
					if(property==="__boundNodes__") return nodes;
					let value = target[property];
					if(typeof(property)!=="string") return value;
					if(typeof(value)==="undefined") {
						let {ancestorNode,state} = node.getAncestorWithState();
						while(ancestorNode) {
							value = state[property];
							if(typeof(value)!=="undefined") break;
							let next = ancestorNode.getAncestorWithState();
							ancestorNode = next.ancestorNode;
							state = next.state;
						}
					}
					let activations = nodes.get(node);
					if(!activations) nodes.set(node,activations={});
					activations[path+property] = true;
					return (typeof(value)==="undefined" ? "" : value);
				},
				set(target,property,value) {
					if(property==="toJSON") return target[property].bind(target);
					if(target[property]!==value) {
						target[property]=value;
						if(tlx.options.reactive) {
							nodes.forEach((activations,node) => {
								!activations[path+property] || node.render();
							})
						}
					}
					return true;
				}
			});
			node.setAttribute("state",proxy,true);
		}
		return proxy;
	}
	HTMLElement.prototype.bind = function(object) {
		tlx.bind(object,this);
		return this;
	}
	HTMLElement.prototype.linkState = function(property) {
		const f = function(event) {
			const target = event.target;
			if([HTMLInputElement,HTMLTextAreaElement,HTMLSelectElement,HTMLAnchorElement].some(cls => target instanceof cls)) {
				let value;
				if(target.type==="checkbox") {
					value = target.checked;
				}
				else if(target.type==="select-multiple") {
					value = [];
					for(let option of [].slice.call(target.options)) {
						!option.selected || value.push(tlx.fromJSON(option.value));
					}
				} else {
					value = tlx.fromJSON(target.value);
				}
				const parts = property.split(".");
				let state = this.state;
				property = parts.pop(); // get final property
				for(let key of parts) {
					state = state[key] || {};
				} // walk tree
				state[property] = value; // set property
			}
		};
		return f.bind(tlx.getState(this)||(this.state={}));
	}
	tlx.options || (tlx.options={});
	tlx.options.reactive = true;
}(tlx));
},{}],6:[function(require,module,exports){
(function(tlx) {
	"use strict";
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
	*/
	if(!tlx.options.components) console.warn("tlx-component mut be loaded to use tlx-template");
	tlx.compile = function(template) {
		const tagname = template.getAttribute("t-tagname");
		if(!tagname) return;
		const clone = document.createElement(tagname);
		clone.innerHTML = template.innerHTML;
		const	styles = clone.querySelectorAll("style")||[],
			scripts = clone.querySelectorAll("script")||[];
		for(let style of [].slice.call(styles)) {
			let spec = style.innerText,
				matches = spec.match(/.*\{.+\}/g),
				text = (matches ? matches.reduce((accum,item) => accum += `${tagname} ${item.trim()} `,"") : "");
			spec = (matches ? matches.reduce((accum,item) => accum = accum.replace(item,""),spec) : spec);
			matches = spec.match(/.*;/g),
			text = (matches ? matches.reduce((accum,item) => accum += `${tagname} ${item.trim()} `,text) : text);
			style.innerText = text.trim();
			document.head.appendChild(style);
		}
		const scope = [].slice.call(template.attributes).reduce((accum,attribute) => { ["id","t-tagname"].includes(attribute.name) || (accum[attribute.name] = attribute.value); return accum; },{});
		for(let script of [].slice.call(scripts)) {
			const newscope = Function(`with(this) { ${script.innerText}; }`).call(scope);
			!newscope || (scope = newscope);
			clone.removeChild(script);
		}
		const templatehtml = clone.innerHTML.replace(/&gt;/g,">").replace(/&lt;/g,"<");
		scope.render = function() { 
			return this.innerHTML = this.resolve(templatehtml,this);
		}
		const component = Function("defaults",`return function(attributes={},el=document.createElement("${tagname}")) {
					Object.assign(el,tlx.Mixin);
					el.initialize(Object.assign({},defaults,attributes));
					}`)(scope);
		this.register(tagname,component);
	}
	tlx.options || (tlx.options={});
	tlx.options.templates = true;
}(tlx));
},{}]},{},[1]);
