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
							for(let element of document.getElementsByTagName("template")||[]) {
								this.compile(element)
							}
						}
						if(this.options.components) this.mount();
						document.head.render();
						document.body.render();
					});
				}
				HTMLElement.prototype.render = function() {
					for(let child of [...this.childNodes]) child instanceof HTMLTemplateElement || child instanceof HTMLScriptElement || child.render();
				}
				HTMLElement.prototype.getAttributes = function() {
					return [].slice.call(this.attributes).reduce((accum,attribute) => { accum[attribute.name] = this.getAttribute(attribute.name); return accum;},{});
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
				Text.prototype.render = function() {
					if(this.textContent.indexOf("${")>=0) {
						const template = this.textContent;
						this.render = function() {
							const {_,state} = this.getAncestorWithState();
							this.textContent = Function("state","with(state) { return `" + template + "` }")(state||{});
						}
						this.render();
					}
					this.textContent = this.parse(this.textContent)
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