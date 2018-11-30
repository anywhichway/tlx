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
		_window,
		requestAnimationFrame;
	if(typeof(window)==="undefined") {
		JSDOM = require("jsdom").JSDOM;
		_window = new JSDOM(``).window;
		requestAnimationFrame = f => f();
	} else {
		_window = window;
		requestAnimationFrame = _window.requestAnimationFrame;
	}
	var document = _window.document;
		

	//update target DOM node from source DOM node
	//make changes only where necessary
	function updateDOM(source,target,actions={},view=target) {
		Object.defineProperty(target,"view",{enumerable:false,configurable:true,writable:true,value:view});
		// if source and target are text
		if(source.nodeName==="#text" && target.nodeName==="#text") {
			// update is data not the same
			if(target.data!==source.data) requestAnimationFrame(() => target.data = source.data);
			return;
		}
		// if the constructors aren't the same or they have different css content
		if(source.constructor!==target.constructor || source.style.cssText!==target.style.cssText) {
			// replace the target with the source
			!target.parentNode || requestAnimationFrame(() => target.parentNode.replaceChild(source,target));
			return;
		}
		// patch functions so closures work
		for(const key in source) {
			if(key[0]==="o" && key[1]==="n" && typeof(source[key])==="function") {
				Object.keys(actions).some(fname => {
					const action = actions[fname]+"",
						handler = source[key]+"",
						body = handler.substring(handler.indexOf("{")+1,handler.lastIndexOf("}")).trimStart().trimEnd();
					if(body===action) {
						target.addEventListener(key.substring(2),actions[fname]);
						return true;
					}
				})
			}
		}
		// loop through source attributes
		[].slice.call(source.attributes).forEach(attribute => {
			const sourcevalue = source.getAttribute(attribute.name);
			// replace different
			if(sourcevalue!==target.getAttribute(attribute.name)) requestAnimationFrame(() => target.setAttribute(attribute.name,sourcevalue))
		});
		// loop through target attributes
		[].slice.call(target.attributes).forEach(attribute => {
			// remove where does not exist in source
			if(source.getAttribute(attribute.name)==null) requestAnimationFrame(() => target.removeAttribute(attribute.name))
		});
		// remove extra children
		let remove = target.childNodes.length-source.childNodes.length;
		while(remove-->0) {
			!target.lastChild || target.removeChild(target.lastChild);
		}
		// handle the child nodes
		let targets = [].slice.call(target.childNodes,0,source.childNodes.length);
		if(targets.length===0) {
			const shadow = target.shadowRoot;
			if(shadow) targets = [].slice.call(shadow.childNodes,0,source.childNodes.length);
		}
		let sources = [].slice.call(source.childNodes);
		if(sources.length===0) {
			const shadow = source.shadowRoot;
			if(shadow) sources = [].slice.call(shadow.childNodes);
		}
		sources.forEach((snode,i) => {
			// update if in range
			if(i<targets.length) updateDOM(snode,targets[i],actions,view);
			// otherwise, append
			else requestAnimationFrame(() => target.appendChild(snode.cloneNode(true)));
		});
	}
	
	function Component() {
		
	}
	Component.prototype = new Function();
	
	let CURRENTVIEW;
	
	const DEPENDENCIES = new Map(),
		getUndefined = error => {
			const i = error.message.indexOf("not defined");
			if(i>=0) {
				const property = error.message.split(" ")[0];
				try {
					return Function(`return ${property}`)();
				} catch(e) {
					return property;
				}
			}
		},
		parse = (template, ...interpolations) => {
			if(Array.isArray(template)) { // was called as a string literal interpolator
				template = template.reduce((accum,chunk,i) => accum += chunk + (i<template.length-1 ? interpolations[i]  : ""),"");
			}
			return Function("model","actions","extras","with(model) { with(actions) { with(extras) { return `" + template + "`}}}");
		},
		patch = (target,source) => {
			source = Object.assign(target,source);
			Object.keys(source).forEach(key => {
				if(typeof(source[key])==="undefined") {
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
						const callbacks = Array.isArray(watcher) ? watcher : [watcher];
						callbacks.forEach(callback => watchers[property](oldvalue,value,property,proxy));
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
		component = (tagName,config={}) => { // config = {template,model,attributes,actions,controller,ctor,register}
			let {template,customElement,model,attributes,actions,controller,linkModel,reactive,lifecycle={}} = config;
			if(template && customElement) throw new Error("Component can only take a template or customElement, not both")
			if(!customElement) {
				const cname = tagName.split("-").map(part => `${part[0].toUpperCase()+part.substring(1)}`).join("");
				if(typeof(template)!=="function") template = parse(template||"")
customElement = Function("template","model","actions","reactive",`return class ${cname} extends HTMLElement {
constructor() { super(); const shadow = this.attachShadow({mode: 'open'}),extras = {};
while(true) {
	try {
		shadow.innerHTML = template(reactive ? reactor(model) : model,actions,extras); break;
	} catch(e) {
		const variable = getUndefined(e);
		if(!variable) throw e;
		model[variable]; // force get
		extras[variable] = undefined;
	}}}}`)(template,JSON.parse(JSON.stringify(model)),actions,reactive);
			}
			customElements.define(tagName,customElement,config.extends ? {extends:config.extends} : undefined);
			const prototype = new Component(),
					f = function(overrides) {
						const el = document.createElement(tagName),
							config = Object.assign({controller,linkModel,lifecycle},overrides);
						config.model = patch(model,overrides.model);
						config.attributes = patch(Object.assign({},attributes),overrides.attributes);
						config.actions = patch(Object.assign({},actions),overrides.actions);
						if(lifecycle.beforeCreate) lifecycle.beforeCreate.call(el);
						view(el,config);
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
		view = (el,{template,model={},attributes={},actions={},controller,linkModel,lifecycle={},protect=PROTECTED}={}) => {
			const ttype = typeof(template);
			if(ttype!=="function") {
				if(template && ttype==="object" && template instanceof _window.HTMLElement) template = template.innerHTML;
				template = parse(template||el.innerHTML.replace(/&gt;/g,">").replace(/&lt;/g,"<"))
			}
			let mounted;
			const render = (data=model,partial) => {
					if(tlx.off || !el.parentElement) return;
					const fragment = document.createElement(el.tagName),
						extras = {},
						currentview = CURRENTVIEW;
					if(partial) data = patch(model,data);
					else if(data!==model) Object.assign(model,data);
					CURRENTVIEW = el;
					while(true) {
						try {
							fragment.innerHTML = template(model,actions,extras);
							break;
						} catch(e) {
							const variable = getUndefined(e);
							if(!variable) throw e;
							model[variable]; // force get
							extras[variable] = undefined;
						}
					}
					CURRENTVIEW = currentview;
					if(mounted && lifecycle.beforeUpdate) lifecycle.beforeUpdate.call(el);
					Object.keys(attributes).forEach(key => {
						fragment.setAttribute(key,Function("model","actions","with(model) { with(actions) { return `" + attributes[key] + "`}}")(model,actions));
					});
					updateDOM(fragment,el,actions);
					if(mounted && lifecycle.updated) lifecycle.updated.call(el);
				},
				linkmodel = (path,...renders) => {
					return event => {
						const parts = path.split(".");
						let final = parts.pop(),
							key,
							node = model;
						while((key = parts.shift())) {
							node = node[key];
							if(node===undefined) {
								node[key] = {};
							}
						}
						node[final] = event.target.value;
						renders.forEach(selector => document.querySelectorAll(selector).forEach(el => !el.render || el.render()));
					}
				};
			if(lifecycle.beforeMount) lifecycle.beforeMount.call(el);
			render(model);
			mounted = true;
			if(lifecycle.mounted) lifecycle.mounted.call(el);
			if(controller) {
				let {handleEvent,events,options=false} = controller;
				if(typeof(controller)==="function") handleEvent = controller;
				if(events) {
					events.forEach(event => el.addEventListener(event,handleEvent,options))
				} else {
					for(const key in el) {
						if(key[0]==="o" && key[1]==="n") el.addEventListener(key.substring(2),controller,options);
					}
				}
			}
			const inputs = [].slice.call(el.querySelectorAll("input"));
			if(el instanceof _window.HTMLInputElement) inputs.push(el);
			inputs.forEach(input => {
				if(protect || input.hasAttribute("protect")) {
					const _setAttribute = input.setAttribute;
					let oldvalue = input.getAttribute("value");
					input.setAttribute = function(name,value) {
						if((protect || this.hasAttribute("protect")) && name==="value" && value) {
							value =  clean(value);
							 if(value===undefined) {
								 value = typeof(violated)==="function" ? violated(value) : oldvalue;
							 }
						}
						oldvalue = value;
						_setAttribute.call(this,name,value);
					}
					input.addEventListener("change",(event) => {
						 const desc = {enumerable:true,configurable:true,writable:false};
						 desc.value = new Proxy(event.target,{
							 get(target,property) {
								 let value = target[property];
								 if(property==="value" && value) {
									 value =  clean(value);
									 if(value===undefined) {
										 value = typeof(violated)==="function" ? violated(value) : oldvalue;
									 }
								 }
								 oldvalue = value;
								 return value;
							 }
						 });
						 Object.defineProperty(event,"target",desc);
					 })
				}
			});
			if(linkModel) {
				inputs.forEach(input => input.addEventListener("change",event => linkmodel(event.target.name)(event),false))
			}
			Object.defineProperty(el,"render",{enumerable:false,configurable:true,writable:true,value:render});
			Object.defineProperty(el,"linkModel",{enumerable:false,configurable:true,writable:true,value:linkmodel});
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
						return clean(Function("return " + data).call(null));
					} catch(error) {
						// otherwise, just return it
						return data;
					}
				}
			}
		return data;
	}
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
			// self eval, might negatively impact clean itself
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
								cleaned = (type!=="undefined" ? clean(value) : clean(key)); 
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
	let PROTECTED;
	const protect = (el=window,violated=() => "") => {
		// on client or a server pseudo window is available
		if(typeof(window)!=="undefined" && window.prompt && el===window) {
			const _prompt = window.prompt.bind(window);
			window.prompt = function(title) {
				const input = _prompt(title),
					cleaned = clean(input);
				if(typeof(cleaned)=="undefined") {
					window.alert("Invalid input: " + input);
				} else {
					return cleaned;
				} 
			}
			PROTECTED = true;
			return;
		}
	  return el;
	}
		
	const tlx = {component,reactor,view,router,handlers,escape:clean,protect,JSDOM};
	
	if(typeof(module)!=="undefined") module.exports = tlx;
	if(typeof(window)!=="undefined") window.tlx = tlx;
}).call(this);
