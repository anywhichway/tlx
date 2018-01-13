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
	
	const tlx = {
			components:{},
			enable(options={}) {
				this.options = Object.assign({},this.options,options);
				
				if(this.options.sanitize!==false) {
					const _prompt = global.prompt.bind(global);
					if(_prompt) {
						global.prompt = function(title) {
							const input = _prompt(title),
								result = tlx.escape(input);
							if(typeof(result)=="undefined") {
								global.alert("Invalid input: " + input);
							} else {
								return result;
							} 
						}
					}
				}
				
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

				HTMLElement.prototype.getAttributes = function() {
					return [].slice.call(this.attributes).reduce((accum,attribute) => { (accum[attribute.name] = this.getAttribute(attribute.name)); return accum;},{});
				}
				const _render = HTMLElement.prototype.render = function() {
					for(let attribute of [].slice.call(this.attributes)) {
						attribute.render();
						!tlx.renderDirective || tlx.renderDirective(this,attribute);
					}
					if(this.render===_render) {
						for(let child of [].slice.call(this.childNodes)) child instanceof HTMLTemplateElement || child instanceof HTMLScriptElement || child.render();
						return this.innerHTML;
					} else {
						return this.render();
					}
				}
				const _HTMLElement_getAttribute = HTMLElement.prototype.getAttribute;
				HTMLElement.prototype.getAttribute = function(name) {
					let value = this[name],
						type = typeof(value);
					if(type==="undefined") { value = _HTMLElement_getAttribute.call(this,name); type = typeof(value); }
					if(value && type==="object" && value instanceof HTMLElement) return value.getAttributes();
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
							value = this.resolve(value);
						} else if(name.indexOf("on")!==0) {
							value = tlx.escape(value);
						}
						type = typeof(value);
					}
					
					const oldvalue = this.getAttribute(name),
						neq = !equal(oldvalue,value);
					if(neq || lazy) {
						if(value==null) { delete this[name]; this.removeAttribute(name); }
						if(type==="object" || type==="function") {
							this[name] = value;
							name!=="state" || !this.bind || this.bind(value);
							type==="function" || (value = "${" + JSON.stringify(value) + "}");
						}
						name==="state" || _HTMLElement_setAttribute.call(this,name,value);
					}
					if(!lazy && this.constructor.observedAttributes && this.constructor.observedAttributes.includes[name] && this.attributeChangedCallback) {
						this.attributeChangedCallback(name,oldvalue,value,null);
					}
					if(tlx.options.reactive && !lazy && this.render && neq) this.render();
				}
			  Node.prototype.render = function() {
			  	const owner = this.ownerElement;
			  	if(this.value.indexOf("${")>=0 && !Object.getOwnPropertyDescriptor(this,"render")  && owner.resolve) {
			  		const template = this.value;
			  		this.render = function() { 
			  			const value = owner.resolve(template);
			  			owner.setAttribute(this.name,value,true); return value; }
			  		return this.render();
			  	}
			  	return this.value;
			  }
				Text.prototype.render = function() {
					const parent = this.parentElement;
					if(this.textContent.indexOf("${")>=0 && !Object.getOwnPropertyDescriptor(this,"render") && parent.resolve) {
						const template = this.textContent;
						this.render = function() {
							this.textContent = parent.resolve(template);
						}
						return this.render();
					}
					return this.textContent;
				}
			
				if(this.options.polyfill==="force") {
					this.options.components = true;
					// add warning is not loaded
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
			},
			escape(data) {
				const type = typeof(data);
				if(type==="function") return;
				if(["number","boolean"].includes(type) || !data) {
					return data;
				}
				if(Array.isArray(data)) {
					for(let i=0;i<data.length;i++) {
						data[i] = this.escape(data[i]);
					}
					return data;
				}
				if(data && type==="object") {
					for(let key in data) {
						data[key] = this.escape(data[key]);
					}
					return data;
				}
		    const div = document.createElement('div');
		    div.appendChild(document.createTextNode(data));
		    data = div.innerHTML;
		    try {
		    	JSON.parse(`${data}`)==data;
		    	return str; // string is boolean, number, undefined, or null
		    } catch(error) {
		    	try {
		    		return this.escape(Function("return " + data)());
		    	} catch(error) {
		    		return data;
		    	}
		    }
		  }
		}
		
	if(typeof(module)!=="undefined") {
		module.exports = tlx;
	}
	if(typeof(window)!=="undefined") {
		window.tlx = tlx;
	}
}).call(typeof(window)!=="undefined" ? window : this);