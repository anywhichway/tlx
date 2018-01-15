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
	
	const global = this;
	
	class VNode {
		constructor(nodeName,attributes,children,node) {
			Object.defineProperty(this,"node",{enumerable:false,configurable:true,writable:true,value:node});
			Object.defineProperty(node,"__vNode__",{enumerable:false,configurable:true,writable:true,value:this});
			this.nodeName = nodeName,
			this.attributes = attributes,
			this.children = children,
			this.key = this.attributes.id || (this.attributes.id = (Math.random()+"").substring(2));
		}
		toString() {
			return `<${this.nodeName}${Object.keys(this.attributes).reduce((accum,key) => accum += (` ${key}="${this.attributes[key]}"`),"")}>${this.children.reduce((accum,child) => accum += " " + child,"")}</${this.tagName}>`;
		}
		render(attributes) {
			return this.node.render(attributes);
		}
	}
	
	const tlx = {
			components:{},
			enable(options={}) {
				this.options = Object.assign({},this.options,options);
				
				if(this.options.sanitize && !tlx.escape) {
					console.warn("Sanitizing on but tlx-santize.js does not appear to be loaded.")
				}
				
				tlx.bind = function(object,htmlOrElementOrVNode,controller,path="") {
					let node = htmlOrElementOrVNode;
					if(typeof(htmlOrElement)==="string") {
						const el = document.createElement("div");
						div.innerHTML = htmlOrElement;
						node = el.firstChild;
					} else if(htmlOrElementOrVNode instanceof VNode) {
						node = htmlOrElementOrVNode.node;
					}
					if(controller) {
						node.addEventListener(controller);
					}
					if(node.state===object && object.__boundNodes__) return object;
					for(let key in object) {
						const value = object[key];
						if(value && typeof(value)==="object") {
							object[key] = this.bind(value,node,controller,`${path}${key}.`).object;
						}
					}
					let proxy = (node.attributes.state ? node.attributes.state.data : null);
					if(!proxy) {
						const nodes = new Map();
						proxy = new Proxy(object,{
							get(target,property) {
								if(property==="__boundNodes__") return nodes;
								let value = target[property];
								const type = typeof(value);
								if(typeof(property)!=="string" || type==="function") return value;
								if(type==="undefined") {
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
					return {object:proxy,el:node,controller};
				}
				HTMLElement.prototype.bind = function(object,controller) {
					return tlx.bind(object,this,controller);
				}
				HTMLElement.prototype.getAttributes = function(ignore={}) {
					return [].slice.call(this.attributes).reduce((accum,attribute) => {
						if(typeof(ignore[attribute.name])==="undefined") {
							let name = attribute.name,
								value = this.getAttribute(name),
								type = typeof(value);
							if(type==="function" && name.indexOf("on")===0) {
								name = "on" + name.substring(2,3).toUpperCase() + name.substring(3);
								value = value.bind(this);
							}
							value==null || (accum[name] = value); 
						}
						return accum;},{});
				}
				const _render = HTMLElement.prototype.render = function() {
					for(let attribute of [].slice.call(this.attributes)) {
						attribute.render();
						!tlx.renderDirective || tlx.renderDirective(this,attribute);
					}
					if(this.render===_render) {
						for(let child of [].slice.call(this.childNodes)) !child.render || child instanceof HTMLTemplateElement || child instanceof HTMLScriptElement || child.render();
						return this.innerHTML;
					} else {
						return this.render();
					}
				}
				const _HTMLElement_getAttribute = HTMLElement.prototype.getAttribute;
				HTMLElement.prototype.getAttribute = function(name) {
					const desc = Object.getOwnPropertyDescriptor(this,name);
					let value = (desc ? desc.value : desc),
						type = typeof(value);
					if(type==="undefined") {
						value = _HTMLElement_getAttribute.call(this,name);
						type = typeof(value);
					}
					if(type==="string" && value.indexOf("${")>=0) {
						value = this.setAttribute(name,value,true);
						type = typeof(value);
					}
					if(value && type==="object" && value instanceof HTMLElement) return value.getAttributes();
					if(value==null) return;
					try { return JSON.parse(value)	} catch(error) { return value };
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
					let type = typeof(value);
					if(type==="string") {
						if(this.resolve) {
							value = this.resolve(value,this.attributes);
						} else if(name.indexOf("on")!==0) {
							!tlx.options.sanitize || (value = tlx.escape(value));
						}
						type = typeof(value);
					}
					
					const oldvalue = lazy || this.getAttribute(name),
						neq = lazy || !equal(oldvalue,value);
					if(neq) {
						if(value==null) { delete this[name]; this.removeAttribute(name); }
						if(type==="object" || type==="function") {
							this[name] = value;
							name!=="state" || !this.bind || type==="function" || this.bind(value);
							name==="state" || type==="function" || (value = "${" + JSON.stringify(value) + "}");
						}
						name==="state" || type==="function" || _HTMLElement_setAttribute.call(this,name,value);
					}
					if(!lazy && this.constructor.observedAttributes && this.constructor.observedAttributes.includes[name] && this.attributeChangedCallback) {
						this.attributeChangedCallback(name,oldvalue,value,null);
					}
					if(tlx.options.reactive && !lazy && this.render && neq) this.render();
					return value;
				}

				const getChildren = (el) => {
					const result = [];
			    for(let i=0;i<el.childNodes.length;i++) {
			      const child = el.childNodes[i].h();
			     !child || result.push(child);
			    }
			    return result;
				}
				Node.prototype.h = function(html) {
					if(html) {
						this.innerHTML = html;
					}
					if(this.tagName) {
						return new VNode(this.tagName,this.getAttributes(),getChildren(this));
					}
					if(this instanceof Text) {
						return this.data;
					}
				}

				Attr.prototype.render = function() {
			  	const owner = this.ownerElement;
			  	if(this.value.indexOf("${")>=0 && !Object.getOwnPropertyDescriptor(this,"render")  && owner.resolve) {
			  		const template = this.value.trim();
			  		this.render = function() { 
			  			const value = (this.name==="state" && owner.state ? owner.state : owner.resolve(template,owner.attributes));
			  			owner.setAttribute(this.name,value,true); return value; }
			  		return this.render();
			  	}
			  	return this.value;
			  }
				Text.prototype.render = function() {
					const parent = this.parentElement;
					if(this.textContent.indexOf("${")>=0 && !Object.getOwnPropertyDescriptor(this,"render") && parent.resolve) {
						const template = this.textContent.trim();
						this.render = function() {
							this.textContent = parent.resolve(template);
						}
						return this.render();
					}
					return this.textContent;
				}
			
				if(this.options.polyfill==="force") {
					if(this.options.components!==true || !tlx.define) {
						console.warn("Attempting to force polyfill when tlx-component.js module not activated or loaded.");
					}
				}
				window.addEventListener("load",() => {
					const doc = document;
					if(this.options.templates) {
						for(let element of [].slice.call(doc.getElementsByTagName("template")||[])) {
							this.compile(element);
						}
					}
					if(this.options.components) this.mount();
					doc.head.render();
					doc.body.render();
				});
				if(this.options.polyfill && this.polyfill) {
					this.polyfill(this.options.polyfill==="force" || false);
				}
				return Object.assign({},this.options);
			}
		}
		
	if(typeof(module)!=="undefined") {
		module.exports = tlx;
	}
	if(typeof(window)!=="undefined") {
		window.tlx = tlx;
	}
}).call(typeof(window)!=="undefined" ? window : this);