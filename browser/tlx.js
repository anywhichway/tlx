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
(function() {
	"use strict"
	
	var JSDOM,
		_window;
	if(typeof(window)==="undefined") {
		JSDOM = require("jsdom").JSDOM;
		_window = new JSDOM(``).window;
	} else {
		_window = window;
	}
	var document = _window.document;
	
	//update target DOM node from source DOM node
	//make changes only where necessary
	function updateDOM(source,target,scope,actions,view=target,template=source) {
		Object.defineProperty(target,"view",{enumerable:false,configurable:true,writable:true,value:view});
		Object.assign(scope,{"$source":source,
												"$target":target,
												"$template":template.children.length> 1 ? template.children : template.children[0],
												"$view":view.children.length> 1 ? view.children : view.children[0]});
		// if source and target are text
		if(typeof(source)==="string" && target.nodeName==="#text") {
			const value = (resolve(source,scope,actions)+"").trim(),
					doc = new DOMParser().parseFromString(value, "text/html"),
		  		children = slice(doc.body.childNodes);
		  if(children.some(node => node.nodeType === 1)) {
		  	const parent = target.parentElement;
		  	updateDOM(toVDOM(doc.body),doc.body,scope,actions,view,template);
		  	parent.removeChild(target);
		  	slice(doc.body.children).forEach(child => parent.appendChild(child));
		  } else if(target.data!==value) {
		  	target.data = value;
		  }
			return;
		}
		// if tags aren't the same
		if(source.tagName!==target.tagName) {
			// replace the target with the source
			!target.parentNode || target.parentNode.replaceChild(fromVDOM(source),target);
			return;
		}
		// loop through target attributes, remove where does not exist in source
		slice(target.attributes).forEach(attribute => source.attributes[attribute.name]!==null || target.removeAttribute(attribute.name));
		// loop through source attributes
		let directed;
		Object.keys(source.attributes).forEach(aname => {
			let value = source.attributes[aname],
			 type = typeof(value);
			const dname = resolve(aname.split(":")[0],scope,actions),
				directive = directives[dname]||tlx.directives[dname];
			value = resolve(value,scope,actions);
			type = typeof(value);
			// replace different
			if(value==null) {
				target.removeAttribute(aname);
				delete target[aname];
			} else if(["boolean","number","string"].includes(type)) {
				if(value!==target.getAttribute(aname)) {
					try {
						target.setAttribute(aname,value);
					} catch(e) {
						; // just ignore, may be an attribute with an unresolved argument, e.g. t-bind:${aname}
					}
				}
			} else {
					const pname = toPropertyName(aname);
					if(value!==target[pname])target[pname] = value;
			}
			if(directive) { 
				while(target.lastChild) target.removeChild(target.lastChild); 
				const render = (scope,actions) => {
					source.children.forEach(child => {
						if(typeof(child)==="string") target.appendChild(new Text(child));
						else target.appendChild(document.createElement(child.tagName));
						updateDOM(child,target.lastChild,scope,actions,view,template);
					});
					return target;
				};
				const result = directive(value,scope,actions,render,{element:target,raw:aname,resolved:aname.indexOf("${")>=0 ? resolve(aname,scope,actions) : aname}),
					rtype = typeof(result);
				if(!result) {
					target.parentElement.removeChild(target);
				} else if(rtype==="string") {
						directed = true;
						target.innerHTML = result;
				} else if(rtype==="object" && result instanceof HTMLElement) {
					directed = true;
					if(result!==target) target.parentElement.replaceNode(result,target);
				}
			}
		});
		if(!directed) {
			// remove extra children
			let remove = target.childNodes.length-source.children.length;
			while(remove-->0) !target.lastChild || target.removeChild(target.lastChild);
			// handle the child nodes
			let targets = slice(target.childNodes,0,source.children.length);
			if(targets.length===0) {
				const shadow = target.shadowRoot;
				if(shadow) targets = slice(shadow.childNodes,0,source.children.length);
			}
			source.children.forEach((child,i) => {
				// update if in range
				if(i<targets.length) {
					updateDOM(child,targets[i],scope,actions,view,template);
					return;
				}
				if(typeof(child)==="string") target.appendChild(new Text());
				else target.appendChild(document.createElement(child.tagName));
				updateDOM(child,target.lastChild,scope,actions,view,template);
			});
		}
	}
	
	function Component() { }
	Component.prototype = new Function();
	
	let CURRENTVIEW,
		PROTECTED;
	
	const DEPENDENCIES = new Map(),
		el = (string,tagName,attributes={}) => {
		  const attrs = Object.values(attributes)
		    .reduce((accum,[key,val]) => accum += ` ${key}="${val}"`,"");
		  return `<${tagName}${attrs}>${string}</${tagName}>`;
		},
		getUndefined = error => {
			if(error.message.indexOf("not defined")>=0) {
				const property = error.message.split(" ")[0];
				try {
					return Function(`return ${property}`)();
				} catch(e) {
					return property;
				}
			}
		},
		interpolate = (template,...interpolations) => interpolations,
		resolve = (value,scope,actions) => {
			if(typeof(value)==="string" && value.indexOf("${")>=0) {
				const	extras = {},
					unary = value.lastIndexOf("${")===0 && value[value.length-1]==="}";
				while(true) {
					try {
						value = Function("scope","actions","extras","__interpolate","with(scope.__t_model||{}) { with(scope) { with(actions) { with(extras) { return " + (unary ? "__interpolate" : "") + "`" + value + "`}}}}")(scope||{},actions||{},extras,interpolate);
						if(unary) value = value[0];
						break;
					} catch(e) {
						const variable = getUndefined(e);
						if(!variable) throw e;
						scope.__t_model[variable]; // force get for dependency tracking
						extras[variable] = "";
					}
				}
			}
			return value;
		},
		patch = (target,source) => {
			source = Object.assign(target,source);
			Object.keys(source).forEach(key => {
				if(source[key]===undefined) {
					delete target[key];
					delete source[key];
				}
			});
			return target;
		},
		reactor = (object={},watchers={}) => {
			Object.keys(object).forEach(key => {
				if(object[key] && typeof(object[key])==="object") reactor(object[key],watchers[key]);
			});
			const proxy = new Proxy(object,{
				get(target,property) {
					if(CURRENTVIEW) {
						let dependencies = DEPENDENCIES.get(target);
						if(!dependencies) {
							dependencies = {};
							DEPENDENCIES.set(target,dependencies);
						}
						dependencies[property] || (dependencies[property] = new Set());
						dependencies[property].add(CURRENTVIEW);
					}
					return target[property];
				},
				set(target,property,value) {
					const watcher = watchers[property]||watchers["*"],
						oldvalue = target[property];
					if(oldvalue===value) return true;
					if(watcher) {
						(Array.isArray(watcher) ? watcher : [watcher]).forEach(callback => watchers[property](oldvalue,value,property,proxy));
					}
					target[property] = value;
					const dependencies = DEPENDENCIES.get(target);
					if(dependencies && dependencies[property]) {
						dependencies[property].forEach(view => {
							if(view.parentElement && view.render) view.render();
							else dependencies[property].delete(view);
						});
					}
					return true;
				}
			});
			return proxy;
		},
		handlers = handlers => {
			return event => {
				const handler = handlers[event.type]||handlers["*"];
				if(handler) handler(event);
			}
		},
		component = (tagName,config={}) => {
			let {template,customElement,model,attributes,actions,controller,linkModel,reactive,lifecycle={},protect} = config;
			if(template && customElement) throw new Error("Component can't take both template and customElement");
			if(!template && !customElement) throw new Error("Component must have template or customElement");
			config = Object.assign({lifecycle:{}},config);
			if(!customElement) {
				const cname = tagName.split("-").map(part => `${part[0].toUpperCase()+part.substring(1)}`).join("");
				customElement = Function("template",`return class ${cname} extends HTMLElement { constructor() { super(); const shadow = this.attachShadow({mode: 'open'}); shadow.innerHTML = template.innerHTML||template; }}`)(template);
			}
			customElement.defaults =  {model,attributes,actions,controller,linkModel,reactive,lifecycle,protect};
			customElements.define(tagName,customElement,config.extends ? {extends:config.extends} : undefined);
			const prototype = new Component(),
					f = function(overrides={}) {
						const el = document.createElement(tagName),
							config = Object.assign({controller,linkModel,lifecycle,protect,reactive},overrides);
						config.model = patch(JSON.parse(JSON.stringify(model||{})),overrides.model);
						if(config.reactive) config.model = reactor(config.model);
						config.attributes = patch(Object.assign({},attributes),overrides.attributes);
						config.actions = patch(Object.assign({},actions),overrides.actions);
						Object.keys(config.attributes).forEach(key => {
							const value = config.attributes[key];
							if(value==null) el.removeAttribute(toAttributeName(key));
							else if(["boolean","number","string"].includes(typeof(value))) el.setAttribute(toAttributeName(key),value);
							else el[toPropertyName(key)] = value;
						});
						if(lifecycle.beforeCreate) lifecycle.beforeCreate.call(el);
						tlx.view(el,config);
						if(lifecycle.created) lifecycle.created.call(el);
						return el;
					};
				f.constructor = Component;
				Object.setPrototypeOf(f,prototype);
				return f;
		},
		router = routes => {
			function handleEvent(event) {
				Object.defineProperty(event,"stopRoute",{enumerable:false,configurable:true,writable:true,value:function(){ this.routeStopped = true; }})
				const href = event.target.href;
				if(href) {
					const a = event.target,
						target = a.getAttribute("target")||a.view;
					let pathname = a.pathname.substring(1);
					if(a.protocol==="file:") pathname = pathname.substring(pathname.indexOf(":")+2);
					for(let match in routes) {
						const f = routes[match];
						try {
							match = Function("return " + match)();
						} catch(e) {
							;
						}
						const type = typeof(match),
							args = {};
						if(type==="string") {
							const mparts = match.split("/"),
								pparts = pathname.split("/");
							if(mparts.length!==pparts.length) continue;
							// get the : delimited values out of path
							// for args and fail if there is not a path match
							if(!mparts.every((mpart,i) => {
								if(mpart[0]===":") {
									args[mpart.substring(1)] = pparts[i];
									return true;
								}
								return mpart===pparts[i];
							})) {
								continue;
							};
						}
						if(type==="string" || (type==="function" && match(pathname)) || match.match(pathname)) {
							f.call(event,args);
							event.preventDefault();
							if(event.routeStopped) break;
						}
					}
				}
			}
			Object.defineProperty(handleEvent,"add",{enumerable:false,configurable:true,writable:true,value:(path,f) => routes[path] = f});
			routes = Object.assign({},routes);
			return handleEvent;
		},
		slice = arrayLike => [].slice.call(arrayLike),
		toPropertyName = attributeName => {
			const parts = attributeName.split("-");
			let name = parts.shift(),
				part = parts.shift();
			while(part) {
				name += part[0].toUpperCase() + part.substring(1);
				part = parts.shift();
			}
			return name;
		},
		toAttributeName = name => {
			let attributeName = "";
			for(let i=0;i<name.length;i++) {
				const c = name[i];
				if(i>0 && c===c.toUpperCase()) attributeName += "-";
				attributeName += c;
			}
			return attributeName;
		},
		toVDOM = (node,attributes,tagName=node.tagName) => {
			if(node.nodeName==="#text") return node.textContent;
			const vdom = {tagName,attributes:Object.assign({},attributes),children:[]};
			slice(node.attributes).forEach(attribute => vdom.attributes[attribute.name] = attribute.value);
			for(const key in node) {
				if(key[0]==="o" && key[1]==="n" && typeof(node[key])==="function") vdom.attributes[key] = node[key];
			}
			slice(node.childNodes).forEach(child => vdom.children.push(toVDOM(child)));
			return vdom;
		},
		fromVDOM = vdom => {
			if(typeof(vdom)==="string") return new Text(vdom);
			const el = document.createElement(vdom.tagName);
			Object.keys(vdom.attributes).forEach(aname => {
				const value = vdom.attributes[aname];
				if(value!=null && typeof(value)!=="string") el[aname] = value;
				else el.setAttribute(aname,value);
			});
			vdom.children.forEach(child => el.appendChild(fromVDOM(child)));
			return el;
		},
		view = (el,{template,model={},attributes={},actions={},controller,linkModel,lifecycle={},protect=PROTECTED}=el.constructor.defaults||{}) => {
			if(template) {
				const type = typeof(template);
				if(type==="object") {
					if(template.tagName==="TEMPLATE") template.innerText = template.innerHTML;
					Object.assign(slice(template.attributes).reduce((accum,attribute) => {
						accum[attribute.name] = attribute.value;
						return accum;
					},{}),attributes);
					template = template.shadowRoot ? template.shadowRoot : template;
				} else {
					const fragment = document.createElement(el.tagName),
						text = new Text(template);
					if(fragment.shadowRoot) {
						while(fragment.shadowRoot.lastChild) fragment.shadowRoot.removeChild(fragment.shadowRoot.lastChild);
						fragment.shadowRoot.appendChild(text);
					} else {
						fragment.appendChild(text)
					}
					template = fragment;
				}
			}
			let mounted;
			const scope = {__t_model:model},
					eltag = template && (template.tagName==="TEMPLATE" || (template.tagName==="SCRIPT" && template.type==="template")) ? el.tagName : undefined,
					vdom = toVDOM(template||el,attributes,eltag),
					linkmodel = (path,...renders) => {
						return event => {
							const parts = path.split(".");
							// walk down the parts of the path on the model
							let final = parts.pop(),
								key,
								node = scope.__t_model;
							while((key = parts.shift())) {
								node = node[key];
								if(!node) node[key] = {}; // created undefined properties
							}
							node[final] = event.target.value; // set the value
							renders.forEach(selector => document.querySelectorAll(selector).forEach(el => !el.render || el.render()));
						}
					},
					render = (data=scope,partial) => {
						if(tlx.off || !el.parentElement) return;
						const currentview = CURRENTVIEW,
							local = data===scope ? scope : {__t_model:data};
						if(partial) patch(model,data);
						CURRENTVIEW = el;
						if(mounted && lifecycle.beforeUpdate) lifecycle.beforeUpdate.call(el);
						updateDOM(vdom,el,local,actions);
						CURRENTVIEW = currentview;
						if(mounted && lifecycle.updated) lifecycle.updated.call(el);
						return el;
					};
			if(lifecycle.beforeMount) lifecycle.beforeMount.call(el);
			if(el.hasAttribute("defer")) el.removeAttribute("defer");
			else render(scope);
			mounted = true;
			if(lifecycle.mounted) lifecycle.mounted.call(el);
			if(controller) {
				let {handleEvent,events,options=false} = controller;
				if(typeof(controller)==="function") handleEvent = controller;
				if(events) events.forEach(event => el.addEventListener(event,handleEvent,options))
				else {
					for(const key in el) {
						if(key[0]==="o" && key[1]==="n") el.addEventListener(key.substring(2),controller,options);
					}
				}
			}
			const inputs = slice(el.querySelectorAll("input"));
			if([ _window.HTMLInputElement,_window.HTMLSelectElement,_window. HTMLTextAreaElement].some(cls => el instanceof cls)) inputs.push(el);
			inputs.forEach(input => {
				if(protect || input.hasAttribute("protect")) {
					const _setAttribute = input.setAttribute;
					let oldvalue = input.getAttribute("value");
					if(oldvalue==null || (oldvalue[0]==="$" && oldvalue[1]==="{" && oldvalue[oldvalue.length-1]==="}")) oldvalue = "";
					input.setAttribute = function(name,value) {
						if((protect || this.hasAttribute("protect")) && name==="value" && value) {
							 if(value && clean(value)===undefined) {
								 value = oldvalue;
								 input.setCustomValidity("Invalid input");
							 } else {
								 input.setCustomValidity("");
								 oldvalue = value;
							 }
						}
						_setAttribute.call(this,name,value);
					}
					input.addEventListener("input",(event) => {
						if(event.target.value && clean(event.target.value)===undefined) {
							input.setCustomValidity("Invalid input");
							input.value = oldvalue;
							event.preventDefault();
							return false;
						}
						input.setCustomValidity("");
						oldvalue = event.target.value;
					 })
				}
			});
			if(linkModel) inputs.forEach(input => input.addEventListener("change",event => !input.validity.valid || linkmodel(input.name)(event),false));
			Object.entries({render,linkModel:linkmodel,model}).forEach(([key,value]) => Object.defineProperty(el,key,{enumerable:false,configurable:true,writable:true,value}));
			return el;
		},
		clean = (data,options=clean.options) => {
			// to change standard options pass {coerce:[],accept:[],reject:[],escape:[],eval:false} as third argument
			// data may be safe if coerced into a proper format
			data = options.coerce.reduce((accum,coercer) => coercer(accum),data);
			//these are always safe
			if(options.accept.some(test => test(data))) return data;
		    //these are always unsafe
			if(options.reject.some(test => test(data))) return;
		    //remove unsafe data from arrays
			if(Array.isArray(data)) {
				data.forEach((item,i) => data[i] = clean(data)); 
				return data;
			}
	    //recursively clean data on objects
			if(data && typeof(data)==="object") { 
				for(let key in data) {
					const cleaned = clean(data[key]);
					if(cleaned===undefined) delete data[key];
					else data[key] = cleaned;
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
						return clean(Function("return " + data).call(null));
					} catch(error) {
						// otherwise, just return it
						return data;
					}
				}
			}
		return data;
	},
	protect = (el=window,violated=() => "") => {
		// on client or a server pseudo window is available
		if(typeof(window)!=="undefined" && window.prompt && el===window) {
			const _prompt = window.prompt.bind(window);
			window.prompt = function(title) {
				const input = _prompt(title),
					cleaned = clean(input);
				if(cleaned===undefined) window.alert("Invalid input: " + input);
				else return cleaned;
			}
			PROTECTED = true;
			return;
		}
	  return el;
	},
	directives = {
			"t-for": (value,scope,actions,render,{raw,resolved,element}={}) => {
				// directive is of the form "t-for:varname:looptype"
				let [_,vname,looptype] = resolved.split(":");
				if(!looptype) looptype = Array.isArray(value) ? "of" : "in";
				if(looptype==="in") for(let key in value) render(Object.assign({},scope,{[vname]:key}));
				else if(looptype==="of") for(let item of value) render(Object.assign({},scope,{[vname]:item}));
				else throw new TypeError(`loop type must be 'in' or 'of' for ${raw}`);
				return element;
			},
			"t-foreach": (array,scope,actions,render,{element}={}) => {
				if(Array.isArray(array)) array.forEach((value,index) => render(Object.assign(scope,{value,index,array}),actions));
				return element;
			},
			"t-forvalues": (object,scope,actions,render,{element}={}) => {
				if(object && typeof(object)==="object") Object.entries(object).forEach(([key,value],index) => render(Object.assign(scope,{value,key,object}),actions));
				return element;
			},
			"t-if": (bool,scope,actions,render) => bool ? render(scope,actions) : undefined
	};
	// default options/support for coerce, accept, reject, escape, eval
	clean.options = {
		coerce: [],
		accept: [data => !data || ["number","boolean"].includes(typeof(data))],
		reject: [
			// executable data
			data => typeof(data)==="function",
			// possible server execution like <?php
			data => typeof(data)==="string" && data.match(/<\s*\?\s*.*\s*/),
			// direct eval, might block or negatively impact clean itself,
			data => typeof(data)==="string" && data.match(/eval|alert|prompt|dialog|void|clean\s*\(/),
			// very suspicious,
			data => typeof(data)==="string" && data.match(/url\s*\(/),
			// might inject nastiness into logs,
			data => typeof(data)==="string" && data.match(/console\.\s*.*\s*\(/),
			// contains javascript,
			data => typeof(data)==="string" && data.match(/javascript:/),
			// arrow function
			data => typeof(data)==="string" && data.match(/\(\s*.*\s*\)\s*.*\s*=>/),
			// function
			data => typeof(data)==="string" && data.match(/[Ff]unction\s*.*\s*\(\s*.*\s*\)\s*.*\s*\{\s*.*\s*\}\s*.*\s*\)\s*.*\s*\(\s*.*\s*\)/),
			// Function
			data => typeof(data)==="string" && data.match(/Function\s*.*\s*\(\s*.*\s*\)\s*/),	
		],
		escape: [ 
			data => { // handle possible query strings
				if(typeof(data)==="string" && data[0]==="?") { 
					const parts = data.split("&");
					let max = parts.length;
					return parts.reduce((accum,part,i) => { 
							const [key,value] = decodeURIComponent(part).split("="),
								type = typeof(value), // if type undefined, then may not even be URL query string, so clean "key"
								cleaned = (type!=="undefined" ? clean(value) : clean(key)); 
							// keep only those parts of query string that are clean
							if(cleaned!==undefined) accum += (type!=="undefined" ? `${key}=${cleaned}` : cleaned) + (i<max-1 ? "&" : "");
							else max--;
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
	};
	
	const tlx = {component,reactor,view,router,handlers,escape:clean,protect,resolve,JSDOM,directives:{},el};
	
	if(typeof(module)!=="undefined") module.exports = tlx;
	if(typeof(window)!=="undefined") window.tlx = tlx;
}).call(this);