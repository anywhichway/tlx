(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function() {
	const tlx = require("./src/tlx-core.js");
	require("./src/tlx-vtdom.js")(tlx);
	require("./src/tlx-directives.js")(tlx);
	require("./src/tlx-reactive.js")(tlx);
	require("./src/tlx-component.js")(tlx);
	require("./src/tlx-protect.js")(tlx);
})();
},{"./src/tlx-component.js":2,"./src/tlx-core.js":3,"./src/tlx-directives.js":4,"./src/tlx-protect.js":5,"./src/tlx-reactive.js":6,"./src/tlx-vtdom.js":7}],2:[function(require,module,exports){
(function() {
	"use strict"
	/* Copyright 2017,2018, AnyWhichWay, Simon Y. Blackwell, MIT License
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
	const	compile = function(template) {
		const tagname = template.getAttribute("t-tagname"),
			reactive = tlx.truthy(template.getAttribute("t-reactive")),
			clone = document.createElement(tagname);
		clone.innerHTML = template.innerHTML;
		const	styles = clone.querySelectorAll("style")||[],
			scripts = clone.querySelectorAll("script")||[];
		for(let style of [].slice.call(styles)) {
			let spec = style.innerText||"",
				matches = spec.match(/.*\{.+\}/g),
				text = (matches ? matches.reduce((accum,item) => accum += `.${tagname} ${item.trim()} `,"") : "");
			spec = (matches ? matches.reduce((accum,item) => accum = accum.replace(item,""),spec) : spec);
			matches = spec.match(/.*;/g),
			text = (matches ? matches.reduce((accum,item) => accum += `${tagname} * {${item.trim()}} `,text) : text);
			style.innerText = text.trim();
			document.head.appendChild(style);
		}
		const model = [].slice.call(template.attributes).reduce((accum,attribute) => { ["id","t-tagname"].includes(attribute.name) || (accum[attribute.name] = attribute.value); return accum; },{});
		for(let script of [].slice.call(scripts)) {
			const newmodel = Function(`with(this) { ${script.innerText}; }`).call(model);
			!newmodel || (model = newmodel);
			clone.removeChild(script);
		}
		const templatehtml = `<div>${(clone.innerHTML.replace(/&gt;/g,">").replace(/&lt;/g,"<").trim()||"<span></span>")}</div>`;
		return function(attributes) {
			const view = () => tlx.vtdom(templatehtml,model,tagname);
			return (target,parent) => {
				if(!target) {
					target = document.createElement(tagname);
					parent.appendChild(target);
				}
				tlx.mvc({model,view},target,{reactive}); //,options
			}
		}
	},
	customElements = {},
	component = (tagName,ctorOrObject) => {
		const type = typeof(ctorOrObject);
		if(type==="function") {
			customElements[tagName] = ctorOrObject;
		} else if(ctorOrObject && type==="object") {
			customElements[tagName] = function(attributes) {
				const model = ctorOrObject.model(),
					controller = ctorOrObject.controller(),
					scope = {},
					view = () => tlx.vtdom(ctorOrObject.template,scope);
				Object.defineProperty(scope,"attributes",{value:attributes});
				Object.defineProperty(scope,"model",{value:model});
				Object.defineProperty(scope,"controller",{value:controller});
				return target => tlx.mvc({model,view,controller},target,ctorOrObject.options);
			}
		} else {
			throw new TypeError(`Custom element definition must be function or object, not ${ctorOrObject==null ? ctorOrObject : type}`);
		}
		const elements = document.getElementsByTagName(tagName);
		for(const element of elements) {
			customElements[tagName](element.attributes)(element);
		}
	};
	
	if(typeof(module)!=="undefined") module.exports = (tlx) => { 
		tlx.define = tlx.component = component;
		tlx.compile = compile;
		tlx.customElements = customElements;
	}
	if(typeof(window)!=="undefined") {
		tlx.define = tlx.component = component;
		tlx.compile = compile;
		tlx.customElements = customElements;
	}
}).call(this)
},{}],3:[function(require,module,exports){
(function() {
	"use strict"
	/* Copyright 2017,2018, AnyWhichWay, Simon Y. Blackwell, MIT License
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
	const booleanAttribute = ["checked","disabled","hidden","multiple","nowrap","selected","required","open"],
	clone = (data,cloned=new Map()) => { // deep copy data, preserve prototypes, avoid loops
		 if(cloned.has(data)) return cloned.get(data);
		 if(Array.isArray(data)) {
				const result = [];
				for(const item of data) {
					const value = clone(item,cloned);
					if(value!==undefined) result.push(value);
				}
				cloned.set(data,result);
				return result;
			} 
			if(data && typeof(data)==="object") {
				const result = Object.create(Object.getPrototypeOf(data)); //{};
				for(const key in data) {
					const value = clone(data[key],cloned);
					if(value!==undefined) result[key] = value;
				}
				cloned.set(data,result);
				return result;
			}
			return data;
		},
		realize = (vnode,node,parent,options) => { // map the vnode into the DOM
			const type = typeof(vnode);
			let append;
			if(type==="function") {
				vnode(node,parent)
			} else if(vnode && type==="object") {
				if(!node) {
					node = append = document.createElement(vnode.nodeName);
				} else if(node.nodeName.toLowerCase()!==vnode.nodeName) {
					const newnode = document.createElement(vnode.nodeName);
					node.parentNode.replaceChild(newnode,node);
					node = newnode;
				}
				if(node.attributes) {
					const remove = [];
					for(let i=0;i<node.attributes.length;i++) {
						const attribute = node.attributes[i];
						if(!vnode.attributes[attribute.name]) remove.push(attribute.name);
					}
					while(remove.length>0) node.removeAttribute(remove.pop());
				}
				if(options.protect) tlx.protect(node,typeof(options.protect)==="function" ? options.protect : tlx.cleaner);
				setAttributes(node,vnode,options);
				while(node.childNodes.length>vnode.children.length) node.removeChild(node.lastChild);
				vnode.children.forEach((child,i) => {
					if(child) realize(child,node.childNodes[i],node,options);
				});
			} else {
				if(!node) {
					node = append = new Text(vnode);
				} else if(node instanceof Text){
					if(node.data!==vnode) node.data = vnode;
				} else {
					parent = node;
					append = new Text(vnode);
				}
			}
			if(parent && append) parent.appendChild(append);
			return node;
		},
		different = (o1,o2) => { // deep equal test
			const t1 = typeof(o1),
				t2 = typeof(o2);
			if(t1!==t2) return true;
			if(t1!=="object") return o1!==o2;
			return Object.keys(o1).some(key => different(o1[key],o2[key])) || Object.keys(o2).some(key => different(o1[key],o2[key]));
		},
		falsy = value => !value || (typeof(value)==="string" && (value==="false" || value==="0")),
		h = (nodeName,attributes={},children=[]) => { // create vNode, potentially using custom tags
			if(tlx.customElements) {
				const template = document.querySelector(`template[t-tagname=${nodeName}]`);
				if(template) tlx.customElements[nodeName] = tlx.compile(template);
				if(tlx.customElements[nodeName]) {
					const node = new tlx.customElements[nodeName](attributes);
					if(node instanceof Node) return vtdom(node);
					if(typeof(node)==="function") return node;
					if(node.nodeName) {
						node.attributes || (node.attributes={});
						node.children || (node.children=[]);
						return node;
					}
					throw new TypeError(`Custom element constructor for '${nodeName}' must return a Node or a virtual node`);
				}
			}
			return {nodeName,attributes,children}; 
		},
		merge = (target,...sources) => { // deep Object.assign with removal of keys specifically marked undefined
			sources.forEach(source => {
				if(!source || typeof(source)!=="object" || !target) return target = clone(source);
				if(Array.isArray(source)) {
					if(!Array.isArray(target)) return target = clone(source);
					target.length = source.length;
					source.forEach((item,i) => target[i] = merge(target[i],item));
				} else {
					Object.keys(source).forEach(key => source[key]===undefined ? delete target[key] : target[key] = merge(target[key],source[key]));
				}
			});
			return target;
		},
		mvc = function(config,target,options) {
			if(!options) { 
				options = {};
				if(!config && !target) options.reactive = true;
			}
			//if(!config) config={template:document.body.firstElementChild.outerHTML};
			if(!config) config={template:document.body.firstElementChild}
			if(!target) target=document.body.firstElementChild
			let {model={},view,controller=model,template} = config;
			if(!target || !(target instanceof Node)) throw new TypeError("tlx.mvc or tlx.app target must be DOM Node");
			options = Object.assign({},tlx.defaults,options);
			if(options.protect) {
				if(!tlx.escape) throw new Error("tlx options.protect is true, but tlx.escape is null");
				if(typeof(window)!=="undefined") {
					if(typeof(options.protect)==="function") tlx.protect(window,options.protect);
					else tlx.protect(window);
				}
			}
			if(!template && !view) throw new TypeError("tlx.mvc must specify a view or template");
			if(!view && template) {
				if(!tlx.vtdom) throw new Error("tlx-vtdom.js must be loaded to use templates.");
				if(typeof(template)==="object") template["t-template"]=template.cloneNode(true);
				view = (model,controller) => {
					const scope = {};
					Object.defineProperty(scope,"model",{value:model});
					Object.defineProperty(scope,"controller",{value:controller});
					return tlx.vtdom(template,scope);
				}
			}
			const proxy = wire(model,view,controller,target,options);
			while(target.lastChild) target.removeChild(target.lastChild);
			controller.render = proxy.render;
			controller.render.reactive = options.reactive;
			controller.render.partials = options.partials;
			proxy.render(model,true);
			return proxy;
		},
		setAttributes = (element,vnode,options) => {
			for(const aname in vnode.attributes) {
				const value  = vnode.attributes[aname];
				if(aname==="style" && value && typeof(value)==="object") value = Object.keys(value).reduce((accum,key) => accum += `${key}:${value};`);
				if(!booleanAttribute.some(name => name===aname && falsy(value))) {
					const type = typeof(value);
					if(type==="function" || (value && type==="object")) element[aname] = value;
					else {
						if(options.protect && aname==="value") tlx.escape(value);
						element.setAttribute(aname,value);
						if(["checked","selected","value"].includes(aname) && element[aname]!==value) element[aname] = value;
					}
				}
			}
			if(vnode.key && !vnode.attributes.id) element.id = vnode.key;
			return element;
		},
		wire = (model,view,controller,target,options) => {
			let updating;
			const state = {}, //target["t-state"] || (target["t-state"] = {}),
				render = function render(newState=model,force) {
					merge(state,newState);
					if(model!==newState) merge(model,newState);
					if(!options.partials) {
						Object.keys(state).forEach(key => typeof(state[key])==="function" || newState[key]!==undefined || (delete state[key]));
						Object.keys(model).forEach(key => typeof(model[key])==="function" || newState[key]!==undefined || (delete model[key]));
					}
					if(force) {
						if(updating) updating = clearTimeout(updating);
						target = realize(view(state,proxy),target,target.parentNode,options);
					} else if(!updating) {
						updating = setTimeout(() => { 
								target = realize(view(state,proxy),target,target.parentNode,options);
								updating = false; 
							});
					}
				},
				proxy = new Proxy(controller,{
					get(target,property) {
						if(property==="render") return render;
						const value = target[property],
							type = typeof(value);
						if(type==="function") {
							// return a wrapper function so that every time a controller function is called
							// the prior state and new state are compared and the view is re-rendered if changed
							return function(...args) {
								let compare = state;
								const result = value.call(options.partials ? null : model,...args);
								while(typeof(result)==="function") result = result(model,controller);
								if(result && typeof(result.then)==="function") {
									result.then((result) => {
										if(options.partials) compare = result;
										if(different(compare,model)) render(model);  
									});
								} else {
									if(options.partials) merge(model,result);
									if(different(compare,model)) render(model); 
								}
							}
						}
						if(value && type==="object") {
							state[property]!==undefined || (state[property]={});
							model[property]!==undefined || (model[property]={});
							return wire(state[property],model[property],value,options);
						}
						return value;
					}
				});
				target["t-controller"] = controller;
				Object.defineProperty(target,"render",{enumerable:false,configurable:true,writable:true,value:render});
				return proxy;
		};
	
	const tlx = {};
	tlx.app = (model,actions,view,target) => tlx.mvc({model,view,controller:actions},target,{reactive:true,partials:true});
	tlx.clone = clone;
	tlx.defaults = {};
	tlx.different = different;
	tlx.falsy = falsy;
	tlx.h = h;
	tlx.merge = merge;
	tlx.mvc = mvc;
	tlx.truthy = value => !falsy(value);

	if(typeof(module)!=="undefined") module.exports = tlx;
	if(typeof(window)!=="undefined") window.tlx = tlx;
}).call(this);
},{}],4:[function(require,module,exports){
(function() {
	"use strict"
	/* Copyright 2017,2018, AnyWhichWay, Simon Y. Blackwell, MIT License
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
	const directives = {
			"t-if": function(vnode,node,value) {
				return tlx.truthy(value);
			},
			"t-foreach": (vnode,node,items) => {
				vnode.children = [];
				const scope = Object.assign({},items);
				if(Array.isArray(items)) {
					items.forEach((value,index,array) => {
						for(const child of node.childNodes) {
							const vdom = tlx.vtdom(child,Object.assign(scope,{currentValue:value,value,index,array}));
							if(vdom) vnode.children.push(vdom);
						}
					});
				} else {
					Object.keys(items).forEach((key,index,object) => {
						const value = items[key];
						for(const child of node.childNodes) {
							const vdom = tlx.vtdom(child,Object.assign(scope,{currentValue:value,key,value,index,object}));
							if(vdom) vnode.children.push(vdom);
						}
					});
				}
			},
			"t-for": function(vnode,node,spec) {
				const inIndex = spec.indexOf(" in")>=0 ? spec.indexOf(" in") : Infinity,
						ofIndex = spec.indexOf(" of")>=0 ? spec.indexOf(" of") : Infinity,
						i = Math.min(inIndex,ofIndex);
				if(i===Infinity) throw new TypeError(`Malformed t-for spec '${spec}'`);
				vnode.children = [];
				const	type = i===inIndex ? "in" : "of",
						vname = spec.substring(0,i).trim(),
						target = spec.substring(i+3,spec.length).trim();
				let value;
				try {
					value = Function("return " + target).call(null);
					const scope = Object.assign({},value);
					if(type==="of") {
						for(const item of value) {
							for(const child of node.childNodes) {
								const vdom = tlx.vtdom(child,Object.assign(scope,{[vname]:item,value}));
								if(vdom) vnode.children.push(vdom);
							}
						}
					} else {
							for(const item in value) {
								for(const child of node.childNodes) {
									const vdom = tlx.vtdom(child,Object.assign(scope,{[vname]:item,key:item}));
									if(vdom) vnode.children.push(vdom);
								}
							}
					}		
				} catch(e) {
					throw new TypeError(`Malformed t-for spec '${spec}'`);
				}
			},
			"t-on": function(vnode,node,spec) {
				for(const key in spec) {
					vnode.attributes["on"+key] = spec[key];
				}
				return true;
			}
	};
	directives["@"] = directives["t-on"];
	tlx.directive = (key,f) => directives[key] = f;
	if(typeof(module)!=="undefined") module.exports = (tlx) => tlx.directives = directives;
	if(typeof(window)!=="undefined") tlx.directives = directives;
}).call(this)
},{}],5:[function(require,module,exports){
(function() {
	"use strict";
	/* Copyright 2017,2018, AnyWhichWay, Simon Y. Blackwell, MIT License
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
		const cleaner = (data,extensions={},options=cleaner.options) => {
			// include extensions, to exclude standard options pass {coerce:[],accept:[],reject:[],escape:[],eval:false} as third argument
			options = Object.keys(options).reduce((accum,key) => 
					{ 
						if(Array.isArray(options[key])) { // use union of arrays
							accum[key] = (extensions[key]||[]).reduce((accum,item) => { accum.includes(item) || accum.push(item); return accum; },options[key].slice());
						} else if(typeof(extensions[key])==="undefined") {
							accum[key] = options[key];
						} else {
							accum[key] = extensions[key];
						} 
						return accum;
					},
				{});
			// data may be safe if coerced into a proper format
			data = options.coerce.reduce((accum,coercer) => coercer(accum),data);
			//these are always safe
			if(options.accept.some(test => test(data))) return data;
		    //these are always unsafe
			if(options.reject.some(test => test(data))) return;
		    //remove unsafe data from arrays
			if(Array.isArray(data)) {
				data.forEach((item,i) => data[i] = cleaner(data)); 
				return data;
			}
	    //recursively clean data on objects
			if(data && typeof(data)==="object") { 
				for(let key in data) {
					const cleaned = cleaner(data[key]);
					if(typeof(cleaned)==="undefined") {
						delete data[key];
					} else {
						data[key] = cleaned;
					}
				}
				return data;
			}
			if(typeof(data)==="string") {
				data = options.escape.reduce((accum,escaper) => escaper(accum),data); // escape the data
				if(options.eval) {
					try {
						// if data can be converted into something that is legal JavaScript, clean it
						// make sure that options.reject has already removed undesireable self evaluating or blocking functions
						// call with null to block global access
						return cleaner(Function("return " + data).call(null));
					} catch(error) {
						// otherwise, just return it
						return data;
					}
				}
			}
		return data;
	}
	// statically merge extensions into default options
	cleaner.extend = (extensions) => {
		const options = cleaner.options;
		cleaner.options = Object.keys(options).reduce((accum,key) => 
			{ 
				if(Array.isArray(options[key])) { // use union of arrays
					accum[key] = (extensions[key]||[]).reduce((accum,item) => { accum.includes(item) || accum.push(item); return accum; },options[key].slice());
				} else if(typeof(extensions[key])==="undefined") {
					accum[key] = options[key];
				} else {
					accum[key] = extensions[key];
				} 
				return accum;
			},
		{});
	}
	// default options/support for coerce, accept, reject, escape, eval
	cleaner.options = {
		coerce: [],
		accept: [data => !data || ["number","boolean"].includes(typeof(data))],
		reject: [
			// executable data
			data => typeof(data)==="function",
			// possible server execution like <?php
			data => typeof(data)==="string" && data.match(/<\s*\?\s*.*\s*/),
			// direct eval, might block or negatively impact cleaner itself,
			data => typeof(data)==="string" && data.match(/eval|alert|prompt|dialog|void|cleaner\s*\(/),
			// very suspicious,
			data => typeof(data)==="string" && data.match(/url\s*\(/),
			// might inject nastiness into logs,
			data => typeof(data)==="string" && data.match(/console\.\s*.*\s*\(/),
			// contains javascript,
			data => typeof(data)==="string" && data.match(/javascript:/),
			// arrow function
			data => typeof(data)==="string" && data.match(/\(\s*.*\s*\)\s*.*\s*=>/),
			// self eval, might negatively impact cleaner itself
			data => typeof(data)==="string" && data.match(/[Ff]unction\s*.*\s*\(\s*.*\s*\)\s*.*\s*\{\s*.*\s*\}\s*.*\s*\)\s*.*\s*\(\s*.*\s*\)/),	
		],
		escape: [ 
			data => { // handle possible query strings
				if(typeof(data)==="string" && data[0]==="?") { 
					const parts = data.split("&");
					let max = parts.length;
					return parts.reduce((accum,part,i) => { 
							const [key,value] = decodeURIComponent(part).split("="),
								type = typeof(value), // if type undefined, then may not even be URL query string, so clean "key"
								cleaned = (type!=="undefined" ? cleaner(value) : cleaner(key)); 
							if(typeof(cleaned)!=="undefined") {
								// keep only those parts of query string that are clean
								accum += (type!=="undefined" ? `${key}=${cleaned}` : cleaned) + (i<max-1 ? "&" : "");
							} else {
								max--;
							}
							return accum;
						},"?");
				}
				return data;
			},
			data => { // handle escaping html entities
				if(typeof(data)==="string" && data[0]!=="?" && typeof(document)!=="undefined") {
						// on client or a server DOM is operable
			  	 const div = document.createElement('div');
			  	 div.appendChild(document.createTextNode(data));
			  	 return div.innerHTML;
			  	}
				return data;
			}
		],
		eval: true
	}
	const protect = (el,violated=() => "") => {
		// on client or a server pseudo window is available
		if(typeof(window)!=="undefined" && window.prompt && el===window) {
			const _prompt = window.prompt.bind(window);
			window.prompt = function(title) {
				const input = _prompt(title),
					cleaned = cleaner(input);
				if(typeof(cleaned)=="undefined") {
					window.alert("Invalid input: " + input);
				} else {
					return cleaned;
				} 
			}
			return;
		}
		if(el instanceof HTMLInputElement) {
			 el.addEventListener("change",(event) => {
				 const desc = {enumerable:true,configurable:true,writable:false};
				 desc.value = new Proxy(event.target,{
					 get(target,property) {
						 let value = target[property];
						 if(property==="value" && value) {
							 const cleaned =  cleaner(value);
							 if(cleaned===undefined) {
								 value = typeof(violated)==="function" ? violated(value) : "";
							 }
							 else value = cleaned;
						 }
						 return value;
					 }
				 });
				 Object.defineProperty(event,"target",desc);
				 desc.value = new Proxy(event.currentTarget,{
					 get(target,property) {
						 let value = target[property];
						 if(property==="value" && value) {
							 const cleaned =  cleaner(value);
							 if(cleaned===undefined) value = violated(value);
							 else value = cleaned;
						 }
						 return value;
					 }
				 });
				 Object.defineProperty(event,"currentTarget",desc);
			 })
		}
		if(el.children) {
		  for(let child of [].slice.call(el.children)) protect(child,violated);
		}
	  return el;
	}

	if(typeof(module)!=="undefined") module.exports = (tlx) => { tlx.escape = cleaner; tlx.protect = protect; }
	if(typeof(window)!=="undefined") tlx.escape = cleaner; tlx.protect = protect;
}).call(this);
},{}],6:[function(require,module,exports){
(function() {
	"use strict"
	/* Copyright 2017,2018, AnyWhichWay, Simon Y. Blackwell, MIT License
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
	HTMLElement.prototype.linkState = (path, ...elements) => event => {
		const target = event.target;
		if(elements.length===0) elements[0] = document.body;
		for(let element of elements) {
			if(typeof(element)==="string") element = document.querySelector(element);
			if([HTMLInputElement,HTMLTextAreaElement,HTMLSelectElement,HTMLAnchorElement].some(cls => target instanceof cls)) {
				let value;
				if(target.type==="checkbox") value = target.checked;
				else if(target.type==="select-multiple") {
					value = [];
					for(let option of [].slice.call(target.options)) {
						!option.selected || value.push(tlx.options.sanitize ? tlx.escape(option.value) : option.value);
					}
				} else {
					value = (tlx.defaults.protect ? tlx.escape(target.value) : target.value);
				}
				const parts = path.split("."),
					model = {};
				let scope = model;
				const property = parts.pop(); // get final path
				for(let key of parts) { // walk tree
					scope = scope[key] || (scope[key] = {});
				} 
				//if(scope[property]!==value) {
					scope[property] = value; // set path
					if(element.render) element.render(model);
					else tlx.mvc({model:model,controller:element["t-controller"],template:element["t-template"]||element.outerHTML},element);
				//}
			}
		}
	};
	
	if(typeof(module)!=="undefined") module.exports = () => {};
}).call(this)
},{}],7:[function(require,module,exports){
(function() {
	const bind = function(model={},element=(typeof(document)!=="undefined" ? document.body.firstElementChild : null),options) {
		if(typeof(element)==="string") element = document.querySelector(element);
		if(!element) throw new TypeError("null element passed to tlx.bind");
		options = Object.assign({},tlx.defaults,options);
		if(arguments.length<3) { options.reactive = true; options.partials = true; }
		const controller = tlx.mvc({model,template:element.cloneNode(true)},element,options);
		if(options.reactive) return makeProxy(model,controller);
		return model;
	 },
		domParser = new DOMParser(),
		makeProxy = (data,controller) => {
			if(!data || typeof(data)!=="object") return data;
			if(Array.isArray(data)) data.forEach((item,i) => data[i] = makeProxy(item,controller))
			else Object.keys(data).forEach(key => data[key] = makeProxy(data[key],controller))
			return new Proxy(data,{
				set(target,property,value) {
					target[property] = value;
					controller.render();
					return true;
				},
				deleteProperty(target,property) {
					delete target[property];
					controller.render();
				}
			})
		}
		parse = (strings,...values) => {
			if(strings[0]==="" && strings[1]==="" && values.length===1) return values[0]===undefined ? "" : values[0];
			if(values.length===0) return strings[0];
			return strings.reduce((html,string,i) => html += string + (i<strings.length-1 ? (typeof(values[i])==="string" ? values[i] : (values[i]===undefined ? "" : JSON.stringify(values[i]))) : ""),"");
		},
		resolve = (scope,value) => {
			if(value.includes && !value.includes("$")) return value+"";
			const extras = {};
			while(extras) {
				try { 
					return scope ? Function("p","with(this) { with(this.model||{}) { return p`" + value + "`; }}").call(Object.assign(scope,extras),parse) : value
				} catch(e) {
					if(e instanceof ReferenceError) {
						let vname = e.message.split(" ").shift();
						if(vname[0]==="'" && vname[vname.length-1]==="'") vname = vname.substring(1,vname.length-1);
						extras[vname] = "";
					} else {
						return ""; 
					}
				}
			}
		},
		vtdom = (data,scope,classes,skipResolve) => {
			const vnode = (() => {
					let node = data["t-template"] || data;
					const type = typeof(data);
					if(type==="string") {
						const doc = domParser.parseFromString(data,"text/html");
						node = doc.body.childNodes[0];
					} else if(!node || type!=="object" || !(node instanceof Node)) throw new TyperError("Argument to tlx.vtdom must be string or Node");
					
					node["t-template"] || (node["t-template"]=data["t-template"]||node.cloneNode(true));
					
					if(node instanceof Text) {
						return skipResolve ? node.data: resolve(scope,node.data);
					}
					
					const attributes = {"t-template":node["t-template"]},
						keys = Object.keys(node.attributes);
					for(const key of keys) {
						const attr = node.attributes[key],
							value = skipResolve ? attr.value : resolve(scope,attr.value);
						if(value.call) { //typeof(value)==="function", faster to check .call
							const render = scope.controller ? scope.controller.render : scope.render,
								partials = render ? render.partials : false,
								model = partials ? tlx.clone(scope.model||scope) : scope.model||scope,
								f = value.bind(model),
								current = tlx.clone(model),
								update = (partial) => {
									if(partials) tlx.merge(scope.model||scope,partial);
									if(tlx.different(current,scope.model||scope) && render) render();
								};
							Object.defineProperty(model,"update",{enumerable:false,configurable:true,writable:true,value:update});
							attributes[attr.name] = (...args) => { update(f(...args)); };
						} else {
							attributes[attr.name] =  value;
						}
					}
					if(classes) {
						if(attributes.class) attributes.class += " " + classes;
						else attributes.class = classes;
					}
					
					const vnode = tlx.h(node.tagName.toLowerCase(),attributes);
					if(!vnode.call) { //typeof(vnode)!=="function"
						if(node.id) vnode.key = node.id;
						if(!skipResolve) {
							for(const aname in vnode.attributes) {
								if(aname==="t-state" || (tlx.directives && tlx.directives[aname])) {
									let value = vnode.attributes[aname];
									if(!Array.isArray(value) && value && typeof(value)==="object" && scope && typeof(scope)==="object") value = tlx.merge({},scope,value);
									if(aname==="t-state") {
										if(scope.model) tlx.merge(scope.model,value);
										else Object.assign(scope,value);
									} else {
										const next = tlx.directives[aname](vnode,node,value);
										if(!next) return vnode;
									}
								}
							}
						}
						for(const child of node.childNodes) {
							if(child instanceof Text) {
								const value = skipResolve ? child.data : resolve(scope,child.data);
								//vnode.children.push(typeof(value)==="string" ? value : JSON.stringify(value));
								vnode.children.push(value+"");
							} else if(child.nodeName!=="SCRIPT"){
								vnode.children.push(vtdom(child,scope,classes,skipResolve));
							}
						}
					}
					return vnode;
				})();
			return vnode;
		};
	if(typeof(module)!=="undefined") module.exports = (tlx) => { tlx.vtdom = vtdom; tlx.bind = bind; }
	if(typeof(window)!=="undefined") tlx.vtdom = vtdom; tlx.bind = bind;
}).call(this)
},{}]},{},[1]);
