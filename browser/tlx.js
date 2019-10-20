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
	
	// update target DOM node from source DOM node
	// make changes only where necessary
	// supports multi-root sources and targets
	function updateDOM(source,target,scope,actions,view=target,template=source) {
		Object.defineProperty(target,"view",{enumerable:false,configurable:true,writable:true,value:view});
		Object.assign(scope,{"$source":source,
												"$target":target,
												"$template":template.children ? (template.children.length> 1 ? template.children : template.children[0]) : template,
												"$view":view.children.length> 1 ? view.children : view.children[0]});
		// if source and target are text
		if(typeof(source)==="string") {
			const value = (resolve(source,scope,actions)+""),
					doc = new DOMParser().parseFromString(value, "text/html"),
		  		children = slice(doc.body.childNodes);
		  if(children.some(node => node.nodeType === 1)) {
		  	updateDOM(toVDOM(doc.body),doc.body,scope,actions,view,template);
		  	let parent;
		  	if(target.nodeType===3) {
			  	parent = target.parentElement;
			  	parent.removeChild(target);
		  	} else if(target.nodeType===1) {
		  		parent = target;
		  		while(parent.lastChild) parent.removeChild(parent.lastChild);
		  	}
		  	slice(doc.body.childNodes).forEach(child => parent.appendChild(child));
		  } else if(target.data!==value) {
		  	target.data = value;
		  }
		  return view;
		}
		target.view.template = target.view.innerHTML;
		// if tags aren't the same
		if(source.tagName!==target.tagName) {
			// replace the target with the source
			if(target.parentNode) {
				const el = document.createElement(source.tagName);
				target.parentNode.replaceChild(el,target);
				target = el;
			}
		}
		// loop through target attributes, remove where does not exist in source
			slice(target.attributes).forEach(attribute => source.attributes[attribute.name]!==null || target.removeAttribute(attribute.name));
			// loop through source attributes
			let directed;
			Object.keys(source.attributes).forEach(aname => {
				let value = source.attributes[aname],
				 type = typeof(value),
				 currentview = CURRENTVIEW;
				CURRENTVIEW = target;
				const dname = resolve(aname.split(":")[0],scope,actions),
					directive = directives[dname]||tlx.directives[dname];
				value = resolve(value,scope,actions);
				CURRENTVIEW = currentview;
				type = typeof(value);
				// replace different
				if(value==null) {
					target.removeAttribute(aname);
					delete target[aname];
				} else if(["boolean","number","string"].includes(type)) {
					if(value!==target.getAttribute(aname)) {
						try {
							target.setAttribute(aname,value);
							if(aname==="value") target.value = value;
						} catch(e) {
							; // just ignore, may be an attribute with an unresolved argument, e.g. t-bind:${aname}
						}
					}
				} else {
						const pname = toPropertyName(aname);
						if(value!==target[pname]) target[pname] = value;
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
					if(result==null) {
						target.parentElement.removeChild(target);
					} else if(rtype==="string") {
							directed = true;
							target.innerHTML = result;
					} else if(rtype==="object" && result instanceof HTMLElement) {
						directed = true;
						if(result!==target) target.parentElement.replaceChild(result,target);
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
		
		return view;
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
		isURL = string => {
			try {
				const url = new URL(string);
				if(url.pathname) return true;
				return false;
			} catch(e) {
				return false;
			}
		},
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
			const target = Object.assign(Array.isArray(object) ? [] : {},object);
			Object.keys(target).forEach(key => {
				if(target[key] && typeof(target[key])==="object") target[key] = reactor(target[key],watchers[key]);
			});
			const proxy = new Proxy(target,{
				get(target,property) {
					if(property==="__isReactor__") return true;
					// keep track of where object properties are referenced
					// take advantage of JavaScript single threading by using a single
					// global variable pointing to a DOM node. The variable gets set each
					// time a DOM node is accessed by tlx code
					if(CURRENTVIEW) {
						let dependencies = DEPENDENCIES.get(target);
						if(!dependencies) {
							dependencies = {};
							DEPENDENCIES.set(target,dependencies);
						}
						if(!dependencies[property]) dependencies[property] = new Set();
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
					if(value && typeof(value)==="object" && !value.__isReactor__) {
						value = reactor(value);
					}
					target[property] = value;
					// if oldvalue is undefined, then a new property is being added so get all references to object, not just those using property
					const dependencies = DEPENDENCIES.get(target);
					if(dependencies) {
						const propertysets = oldvalue===undefined ? Object.values(dependencies) : [dependencies[property]],
						rendered = new Set(); // keep track of rendered views in case the sam eone occurs twice fro new properties
						if(propertysets) {
							propertysets.forEach(set => {
								(set||[]).forEach(view => {
									const render = view.render || (view.view ? view.view.render : null);
									if(!rendered.has(view) && view.parentElement && render) {
										render();
										rendered.add(view);
									} else if(oldvalue!==undefined) { // view no longer valid if no parentElement
										dependencies[property].delete(view);
									}
								});
							});
						}
					}
					return true;
				},
				deleteProperty(target,property) {
					delete target[property];
					const dependencies = DEPENDENCIES.get(target);
					if(dependencies && dependencies[property]) {
						dependencies[property].forEach(view => {
							const render = view.render || (view.view ? view.view.render : null);
							if(view.parentElement && render) render();
							else dependencies[property].delete(view); // view no longer valid if no parentElement
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
		define = (selector,config={}) => {
			const nodes = [].slice = document.querySelectorAll(selector);
			nodes.forEach((el) => view(el,config))
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
		popstate = event => {
			const render = pushstate.states.pop();
			if(render) render();
		},
		pushstate = (render,href) => {
			// history.pushState can't clone the render function, so use a parrallel history
			pushstate.states.push(render);
			history.pushState({},"",href);
		},
		router = routes => {
			pushstate.states || (pushstate.states = []);
			window.addEventListener("popstate",popstate,false);
			function handleEvent(event) {
				Object.defineProperty(event,"stopRoute",{enumerable:false,configurable:true,writable:true,value:function(pushHistory) {
					if(pushHistory) pushstate(this.target.view.render,href);
					this.routeStopped = true; 
				}});
				const href = event.target.href,
					done = (pushHistory) => event.stopRoute(pushHistory);
				if(href) {
					const a = event.target;
					let pathname = a.pathname;
					if(a.protocol==="file:") pathname = pathname.substring(pathname.indexOf(":")+1);
					for(let match in routes) {
						let f = routes[match];
						try { // convert functions or RegExp as property names into functions
							match = Function("return " + match)();
						} catch(e) {
							;
						}
						const type = typeof(match);
						let args = {};
						Object.defineProperty(args,"raw",{enumerable:false,value:[]});
						Object.defineProperty(args,"resolved",{enumerable:false,value:[]});
						if(type==="string") {
							const mparts = match.split("/"),
								pparts = pathname.split("/");
							if(mparts.length!==pparts.length) continue;
							// get the : delimited values out of path
							// for args and fail if there is not a path match
							let prev;
							if(mparts.every((mpart,i) => {
								if(mpart[0]===":") {
									const value = clean(pparts[i],Object.assign({},clean.options,{eval:true}));
									args.raw.push(mpart);
									args.resolved.push(value);
									args[mpart.substring(1)] = value;
									prev = "param";
									return true; // params always "match"
								}
								if(mpart!==pparts[i]) return false;
							  // so long as non-param parts of paths are equal every loop will still process
								if(mpart) {
									if(args.raw.length===0 || prev==="param") {
										args.raw.push("/"+mpart);
										args.resolved.push("/"+mpart);
									} else {
										args.raw[args.raw.length-1] += "/" + mpart;
										args.resolved[args.resolved.length-1] += "/" + mpart;
									}
								}
								return true;
							})) {
								if(a.search) {
									const search = clean(a.search).substring(1); // top level clean and escape of query
									args.raw.push(search)
									const sparts = search.split("&");
									if(sparts.length>0) {
										const query = sparts.reduce((accum,part) => {
											const parts = part.split("=");
											accum[parts[0]] = clean(parts[1],Object.assign({},clean.options,{eval:true})); // converts to primitives or objects
											return accum;
										},{});
										args.query = query;
										args.resolved.push(query);
									}
								}
							} else {
								continue; // goto next route because of path mistmatch
							}
						}
						// key type was a string, or a string converted to a function, or a string converted to a RegExp
						if(type==="string" || (type==="function" && (args=match(new URL(a.href)))) || (match instanceof RegExp && match.test(pathname) && (args=new URL(a.href)))) {
							f.call(event,args,done);
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
		toPropertyName = attributeName => { // convert dashed attribute name to camel case property name
			const parts = attributeName.split("-");
			let name = parts.shift(),
				part = parts.shift();
			while(part) {
				name += part[0].toUpperCase() + part.substring(1);
				part = parts.shift();
			}
			return name;
		},
		toAttributeName = name => { // convert camel case property name to dashed attribute name
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
				if(key[0]==="o" && key[1]==="n") {
					let f = node[key];
					const avalue = node.getAttribute(key);
					if(!f && avalue) {
						 f = new Function("event",avalue)
					}
					if(f) vdom.attributes[key] = f;
				}
			}
			slice(node.childNodes).forEach(child => vdom.children.push(toVDOM(child)));
			return vdom;
		},
		view = function(el,config=el.constructor.defaults||{}) {
			let {template,model={},attributes={},actions={},controller,linkModel=tlx.linkModel,lifecycle={},protect=PROTECTED} = config;
			if(el.length && el[0]!=null && !el.options) {
				if(typeof(el)==="string") {
					const targets = [].slice.call(document.querySelectorAll(el));
					targets.forEach(el => view(el,config));
				} else {
					[].slice.call(el).forEach(el => view(el,config));
				}
				return el;
			}
			if(template) {
				const type = typeof(template);
				if(type==="object") {
					if(template.tagName==="TEMPLATE") template.innerText = template.innerHTML;
					else template = template.shadowRoot ? template.shadowRoot : template.firstChild;
				} else {
					const fragment = document.createElement(el.tagName),
						isurl = isURL(template),
						text = new Text(isurl ? `loading ${template}...` : template);
					if (text[0]!=="#"){
						fragment.appendChild(text)
					}
					config = Object.assign({},config);
					delete config.template;
					if(isurl) {
						fetch(template).then(response => {
							if(response.ok) return response.text();
							throw new Error(`Error: ${text.data}`);
						}).then(template => {
							el.innerHTML = template;
							view(el,config);
							return;
						}).catch(e => {
							el.innerHTML = e.message;
							return;
						});
					} else if(template[0]==="#"){
						const source = document.getElementById(template.substring(0));
						el.innerHTML = source;
						return view(el,config);
					}
					template = fragment;
				}
			}
			let mounted;
			const scope = {__t_model:model},
					eltag = template && (template.tagName==="TEMPLATE" || template.tagName==="SCRIPT") ? el.tagName : undefined,
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
			} else {
				Object.keys(config).forEach((key) => {
					if(key.startsWith("on") && typeof(config[key])==="function") {
						el.addEventListener(key.substring(2),config[key])
					}
				})
			}
			const inputs = el instanceof HTMLInputElement ? [el] : slice(el.querySelectorAll("input, textarea, select"));
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
						if(oldvalue!==event.target.value) {
							input.setCustomValidity("");
							oldvalue = event.target.value;
						}
					 })
				}
			});
			if(linkModel) inputs.forEach(input => input.addEventListener(typeof(linkModel)==="string" && el.tagName!=="SELECT" ? linkModel : "change",event => !input.validity.valid || linkmodel(input.name)(event),false));
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
				const scope = this || typeof(globalThis)!=="undefined" ? globalThis : typeof(global)!=="undefined" ? global : {};
				if(options.eval && !scope[data.trim()]) { // allows reference to global names but not execution, see below
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
			"t-content": (value,scope,actions,render,{raw,resolved,element}={}) => {
				//element = element.cloneNode(element,true);
				if(value!=null) {
					element.removeAttribute("t-content");
					element.innerHTML=tlx.escape(value);
				} else {
					element.outerHTML=element.view.template;
				}
				return element;
			},
			"t-for": (value,scope,actions,render,{raw,resolved,element}={}) => {
				// directive is of the form "t-for:varname:looptype"
				let [_,vname,looptype] = resolved.split(":"),
					index = 0;
				if(!looptype) looptype = value[Symbol.iterator] ? "of" : "in";
				if(looptype==="in") {
					for(let key in value) {
						render(Object.assign({},scope,{[vname]:key,index}));
						index++;
					}
				}
				else if(looptype==="of") {
					for(let item of value) {
						render(Object.assign({},scope,{[vname]:item,index}));
						index++;
					}
				}
				else throw new TypeError(`loop type must be 'in' or 'of' for ${raw}`);
				return element;
			},
			"t-foreach": (iterable,scope,actions,render,{element}={}) => {
				//if(Array.isArray(array)) array.forEach((value,index) => render(Object.assign(scope,{value,index,array}),actions));
				if(iterable[Symbol.iterator]) {
					let index = 0;
					const config = {index:index++,iterable};
					if(Array.isArray(iterable)) config.array = iterable;
					scope = Object.assign({},scope,config);
					for(const value of iterable) {
						scope.value = value;
						render(scope,actions);
					}
				}
				return element;
			},
			"t-forvalues": (object,scope,actions,render,{element}={}) => {
				if(object && typeof(object)==="object") (object.entries ? object.entries() : Object.entries(object)).forEach(([key,value],index) => render(Object.assign({},scope,{value,key,object}),actions));
				return element;
			},
			"t-if": (bool,scope,actions,render,{element}={}) => bool ? render(scope,actions) : ""
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
			data => typeof(data)==="string" && data.match(/(eval|alert|prompt|dialog|void|clean)\s*\(+/),
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
					const parts = data.substring(1).split("&");
					let max = parts.length;
					return parts.reduce((accum,part,i) => { 
							const [key,value] = decodeURIComponent(part).split("=");
								// if value undefined, then may not even be URL query string, so clean "key"
							let cleaned = (value!==undefined ? clean(value) : clean(key)); 
							// keep only those parts of query string that are clean
							if(cleaned && typeof(cleaned)==="object") cleaned = JSON.stringify(cleaned);
							if(cleaned!==undefined) accum += (value!==undefined ? `${key}=${cleaned}` : cleaned) + (i<max-1 ? "&" : "");
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
	
	/*
	 tlx.routes = function(routes) {
	 for route, load, when loaded, index
	const routes = {
			path1: {
				title:
				description:
				template:
			}
			path2: template,
			path3: 
	}
	
	index.tri.url.tricount
	
	tlx.search = function(str) {
		// tokens
		// find trigrams in index
		tlx.index[trigrams]
		urls as keys with counts as values;
	}
	tlx.search("token1 token2")*/
	
	const tlx = {component,reactor,view,define,router,handlers,escape:clean,protect,resolve,JSDOM,directives:{},el};
	
	if(typeof(module)!=="undefined") module.exports = tlx;
	if(typeof(window)!=="undefined") window.tlx = tlx;
}).call(this);