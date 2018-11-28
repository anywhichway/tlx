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
	//update target DOM node from source DOM node
	//make changes only where necessary
	function updateDOM(source,target,view=target) {
		Object.defineProperty(target,"view",{enumerable:false,configurable:true,writable:true,value:view});
		// if source and target are text
		if(source.nodeName==="#text" && target.nodeName==="#text") {
			// update is data not the same
			if(target.data!==source.data) {
				target.data = source.data;
			}
			return;
		}
		// if the constructors aren't the same or they have different css content
		if(source.constructor!==target.constructor || source.style.cssText!==target.style.cssText) {
			// replace the target with the source
			!target.parentNode || target.parentNode.replaceChild(source,target);
			return;
		}
		// loop through source attributes
		[].slice.call(source.attributes).forEach(attribute => {
			const sourcevalue = source.getAttribute(attribute.name);
			// replace different
			if(sourcevalue!==target.getAttribute(attribute.name)) {
				target.setAttribute(attribute.name,sourcevalue)
			}
		});
		// loop through target attributes
		[].slice.call(target.attributes).forEach(attribute => {
			// remove where does not exist in source
			if(source.getAttribute(attribute.name)==null) {
				target.removeAttribute(attribute.name)
			}
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
			if(shadow) {
				targets = [].slice.call(shadow.childNodes,0,source.childNodes.length);
			}
		}
		let sources = [].slice.call(source.childNodes);
		if(sources.length===0) {
			const shadow = source.shadowRoot;
			if(shadow) {
				sources = [].slice.call(shadow.childNodes);
			}
		}
		sources.forEach((snode,i) => {
			if(i<targets.length) { // update if in range
				updateDOM(snode,targets[i],view);
			} else { // otherwise, append
				target.appendChild(snode.cloneNode(true));
			}
		});
	}
	
	function Component() {
		
	}
	Component.prototype = new Function();
	
	let CURRENTVIEW;
	
	const DEPENDENCIES = new Map(),
		resolve = (chunks,...interpolations) => {
			return chunks.reduce((accum,chunk,i) => accum += chunk + (i<chunks.length-1 && typeof(interpolations[i])!=="undefined"? interpolations[i]  : ""),"");
		},
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
			if(!Array.isArray(template)) {
				return Function("model","actions","extras","with(model) { with(actions) { with(extras) { return this`" + template + "`}}}").bind(resolve);
			}
			const str = template.reduce((accum,chunk,i) => accum += chunk + (i<template.length-1 ? interpolations[i]  : ""),"").replace(/\{\{/g,"${").replace(/\}\}/g,"}");
			return Function("model","actions","extras","with(model) { with(actions) { with(extras) { return this`" + str + "`}}}").bind(resolve);
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
				if(object[key] && typeof(object[key])==="object") {
					reactor(object[key],watchers[key]);
				}
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
					if(oldvalue===value) {
						return true;
					}
					if(watcher) {
						const callbacks = Array.isArray(watcher) ? watcher : [watcher];
						callbacks.forEach(callback => watchers[property](oldvalue,value,property,proxy));
					}
					target[property] = value;
					const dependencies = DEPENDENCIES.get(target);
					if(dependencies && dependencies[property]) {
						dependencies[property].forEach(view => {
							if(view.parentElement && view.render) {
								view.render();
							} else {
								dependencies[property].delete(view);
							}
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
				if(handler) {
					handler(event);
				}
			}
		},
		component = (tagName,config={}) => { // config = {template,model,attributes,actions,controller,ctor,register}
			let {template,customElement,model,attributes,actions,controller,linkState,reactive} = config;
			if(template && customElement) {
				throw new Error("Component can only take a template or customElement, not both")
			}
			if(!customElement) {
				const cname = tagName.split("-").map(part => `${part[0].toUpperCase()+part.substring(1)}`).join("");
				if(typeof(template)!=="function") {
					template = parse(template||"")
				}
				customElement = Function("template","model","actions","reactive",`return class ${cname} extends HTMLElement {
						constructor() {
							super();
							const shadow = this.attachShadow({mode: 'open'}),
								extras = {};
							while(true) {
								try {
									shadow.innerHTML = template(reactive ? reactor(model) : model,actions,extras);
									break;
								} catch(e) {
									const variable = getUndefined(e);
									if(!variable) throw e;
									model[variable]; // force get
									extras[variable] = undefined;
								}
							}
						}
					}`)(template,JSON.parse(JSON.stringify(model)),actions,reactive);
			}
			customElements.define(tagName,customElement,config.extends ? {extends:config.extends} : undefined);
			const prototype = new Component(),
					f = function(overrides) {
						const el = document.createElement(tagName),
							config = Object.assign({controller,linkState},overrides);
						config.model = patch(model,overrides.model);
						config.attributes = patch(Object.assign({},attributes),overrides.attributes);
						config.actions = patch(Object.assign({},actions),overrides.actions);
						return view(el,config);
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
					if(a.protocol==="file:") {
						pathname = pathname.substring(pathname.indexOf(":")+2);
					}
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
							if(mparts.length!==pparts.length) {
								continue;
							}
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
							if(event.routeStopped) {
								break;
							}
						}
					}
				}
			}
			Object.defineProperty(handleEvent,"add",{enumerable:false,configurable:true,writable:true,value:(path,f) => routes[path] = f});
			routes = Object.assign({},routes);
			return handleEvent;
		},
		view = (el,{template,model={},actions={},controller,linkState}={}) => {
			if(typeof(template)!=="function") {
				template = parse(template||el.outerHTML.replace(/&gt;/g,">").replace(/&lt;/g,"<"))
			}
			const render = (data=model,partial) => {
					if(tlx.off || !el.parentElement) return;
					const fragment = document.createElement("body");
					if(partial) {
						data = patch(model,data);
					} else if(data!==model) {
						Object.assign(model,data);
					}
					const extras = {},
						currentview = CURRENTVIEW;
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
					updateDOM(fragment.firstChild,el);
				},
				linkstate = (path,...renders) => {
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
						renders.forEach(selector => {
							document.querySelectorAll(selector).forEach(el => !el.render || el.render());
						});
					}
				};
			render(model);
			if(controller) {
				let {handleEvent,events,options=false} = controller;
				if(typeof(controller)==="function") {
					handleEvent = controller;
				}
				if(events) {
					events.forEach(event => {
						el.addEventListener(event,handleEvent,options);
					})
				} else {
					for(const key in el) {
						if(key[0]==="o" && key[1]==="n") {
							el.addEventListener(key.substring(2),controller,options);
						}
					}
				}
			}
			if(linkState) {
				el.addEventListener("change",event => linkstate(event.target.name)(event),false);
			}
			Object.defineProperty(el,"render",{enumerable:false,configurable:true,writable:true,value:render});
			Object.defineProperty(el,"linkState",{enumerable:false,configurable:true,writable:true,value:linkstate});
			return el;
		};
		
	const tlx = {component,reactor,view,router,handlers};
	
	if(typeof(module)!=="undefined") module.exports = tlx;
	if(typeof(window)!=="undefined") window.tlx = tlx;
}).call(this);
