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
	
	const global = window;
	
	const tlx = {
			components:{},
			enable(options={}) {
				this.options = Object.assign({},this.options,options);
				
				if(options.sanitize!==false) {
					const _prompt = global.prompt.bind(global);
					if(_prompt) {
						global.prompt = function(title) {
							const result = tlx.escape(_prompt(title));
							if(typeof(result)=="undefined") {
								global.alert("Invalid input: " + result);
							} else {
								return result;
							} 
						}
					}
				}

				HTMLElement.prototype.getAttributes = function() {
					return [].slice.call(this.attributes).reduce((accum,attribute) => { accum[attribute.name] = this.getAttribute(attribute.name); return accum;},{});
				}
				const _render = HTMLElement.prototype.render = function() {
					for(let attribute of [].slice.call(this.attributes)) {
						attribute.render();
						if(attribute.name==="t-on") {
							for(let key in this["t-on"]) {
								this["on"+key] = this["t-on"][key];
							}
						} else {
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
					}
					if(this.render===_render) {
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
					let type = typeof(value),
						oldvalue = this.getAttribute(name);
					
					// sanitize
					type!=="string" || tlx.options.sanitize===false || (value = tlx.escape(value));
					
					const neq = !equal(oldvalue,value);
					if(neq || lazy) {
						if(value==null) { delete this[name]; this.removeAttribute(name); }
						if(type==="object" || type==="function") this[name] = value;
						else _HTMLElement_setAttribute.call(this,name,value);
						name!=="state" || !this.bind || this.bind(value);
					}
					if(!lazy && this.constructor.observedAttributes && this.constructor.observedAttributes.includes[name] && this.attributeChangedCallback) {
						this.attributeChangedCallback(name,oldvalue,value,null);
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
			  		this.render = function() { 
			  			const as = this.getAncestorWithState(),
			  				value = Function("el","state","with(el) { with(state) { return (function() { return arguments[arguments.length-1]; })`" + template + "` }}")(this.ownerElement,as.state||{});
			  			this.ownerElement.setAttribute(this.name,value,true); return value; }
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
					const parentNode = this.parentNode || this.ownerElement;
					if(parentNode && parentNode instanceof HTMLElement) {
						const state = parentNode.getAttribute("state");
						if(state) return {parentNode,state};
						return parentNode.getAncestorWithState();
					}
					return {}
				}
				
				if(this.options.polyfill==="force") {
					this.options.components = true;
				}
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
				if(this.options.polyfill && this.polyfill) {
					this.polyfill(this.options.polyfill==="force" || false);
				}
			},
			escape(str) {
		    const div = document.createElement('div');
		    div.appendChild(document.createTextNode(str));
		    str = div.innerHTML;
		    try {
		    	JSON.parse(`${str}`)==str;
		    	return str; // string is boolean, number, undefined, or null
		    } catch(error) {
		    	try {
		    		Function("return " + str)();
		    		return undefined; // string is executable!
		    	} catch(error) {
		    		return str;
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
}).call(this);