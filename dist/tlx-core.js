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
	const booleanAttribute = ["checked","disabled","hidden","multiple","nowrap","selected","required"],
		createNode = (vnode,node,parent,options) => {
			const type = typeof(vnode);
			let append;
			if(type==="function") {
				vnode(node)
			} if(vnode && type==="object") {
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
					if(child) createNode(child,node.childNodes[i],node,options);
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
		different = (o1,o2) => {
			const t1 = typeof(o1),
				t2 = typeof(o2);
			if(t1!==t2) return true;
			if(t1!=="object") return o1!==o2;
			return Object.keys(o1).some(key => different(o1[key],o2[key])) || Object.keys(o2).some(key => different(o1[key],o2[key]));
		},
		falsy = value => !value || (typeof(value)==="string" && (value==="false" || value==="0")),
		h = (nodeName,attributes={},children=[]) => {
			if(typeof(tlx.customElements)!=="undefined") {
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
		mvc = function(config={template:document.body.firstElementChild.outerHTML},target=document.body.firstElementChild,options={}) {
			let {model={},view,controller=model,template} = config;
			if(!target || !(target instanceof Node)) throw new TypeError("tlx.mvc or tlx.app target must be DOM Node");
			options = Object.assign({},tlx.defaults,options);
			if(options.protect) {
				if(!tlx.escape) throw new Error("tlx options.protect is true, but tlx.escape is null");
				if(typeof(window)!=="undefined") 
					if(typeof(options.protect)==="function") tlx.protect(window,options.protect);
					else tlx.protect(window);
			}
			if(!template && !view) throw new TypeError("tlx.mvc must specify a view or template");
			if(!view && template) {
				if(!tlx.vtdom) throw new Error("tlx-vtdom.js must be loaded to use templates.")
				const scope = {};
				Object.defineProperty(scope,"model",{value:model});
				Object.defineProperty(scope,"controller",{value:controller});
				view = (model,controller) => tlx.vtdom(template,scope);
			}
			const proxy = wire(model,view,controller,target,options);
			while(target.lastChild) target.removeChild(target.lastChild);
			controller.render = proxy.render;
			controller.render.reactive = options.reactive;
			controller.render.partials = options.partials;
			proxy.render(model,true);
			return proxy;
		},
		realize = (vnode,target,parent,options) => { //target,parent
			const type = typeof(vnode.valueOf());
			if(target) {
				return createNode(vnode,target,parent,options);
			}
		},
		setAttributes = (element,vnode,options) => {
			for(const aname in vnode.attributes) {
				const value  = vnode.attributes[aname];
				if(aname==="style" && value && typeof(value)==="object") value = Object.keys(value).reduce((accum,key) => accum += `${key}:${value};`);
				if(!booleanAttribute.some(name => name===aname && falsy(value))) {
					const type = typeof(value);
					if(type==="function" || (value && type==="object") || aname==="t-template") element[aname] = value;
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
			const state = target["t-state"] || (target["t-state"] = {}),
				render = function render(newState=model,force) {
					Object.assign(state,newState);
					if(force) {
						if(updating) updating = clearTimeout(updating);
						target = realize(view(model,proxy),target,target.parentNode,options);
					} else if(!updating) {
						updating = setTimeout((...args) => { 
								target = realize(...args);
								updating = false; 
							},
							0,
							view(model,proxy),target,target.parentNode,options);
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
									if(options.partials) Object.assign(model,result);
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
	tlx.defaults = {};
	tlx.different = different;
	tlx.falsy = falsy;
	tlx.truthy = value => !falsy(value);
	tlx.h = h;
	tlx.mvc = mvc;
	
	if(typeof(module)!=="undefined") module.exports = tlx;
	if(typeof(window)!=="undefined") window.tlx = tlx;
}).call(this);
