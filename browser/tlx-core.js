(function() {

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
			bind(object,node,path="") {
				for(let key in object) {
					const value = object[key];
					if(value && typeof(value)==="object") object[key] = this.activate(value,node,`${path}${key}.`);
				}
				let proxy = (node.attributes.state ? node.attributes.state.data : null);
				if(!proxy) {
					const nodes = new Map();
					proxy = new Proxy(object,{
						get(target,property) {
							if(property==="__boundNodes__") return nodes;
							let value = target[property];
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
						}
					});
					node.setAttribute("state",proxy,true);
				}
				return proxy;
			},
			enable(options={}) {
				window.addEventListener("load",() => {
					this.mount();
				});
				this.options = Object.assign(options);
				HTMLElement.prototype.render = function() {
					for(let child of [...this.childNodes]) child.render();
				}
				HTMLElement.prototype.getAttributes = function() {
					return [].slice.call(this.attributes).reduce((accum,attribute) => { accum[attribute.name] = this.getAttribute(attribute.name); return accum;},{});
				}
				_HTMLElement_getAttribute = HTMLElement.prototype.getAttribute;
				HTMLElement.prototype.getAttribute = function(name) {
					let value = this[name],
						type = typeof(value);
					if(type==="undefined") value = this.parse(_HTMLElement_getAttribute.call(this,name)); type = typeof(value);
					if(value && type==="object" && value instanceof HTMLElement) return value.getAttributes();
					return value;
				}
				_HTMLElement_setAttribute = HTMLElement.prototype.setAttribute;
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
						if(value==null) delete this[name]; this.removeAttribute(name);
						if(type==="object") this[name] = value;
						else _HTMLElement_setAttribute.call(this,name,value);
					}
					if(tlx.options.reactive && !lazy && this.render && neq) this.render();
				}
				Node.prototype.parse = function(value) {
					if(typeof(value)==="string" && value.indexOf("${")===0) return this.parse(Function("return (function() { return arguments[arguments.length-1]; })`" + value + "`")());
					try { return JSON.parse(value)	} catch(error) { return value }
				}
				Text.prototype.parse = function(value) {
					if(typeof(value)==="string" && value.indexOf("${")===0) {
						const {_,state} = this.getAncestorWithState();
						return Function("state","with(state) { return `" + value + "` }")(state||{});
					}
					try { return JSON.parse(value)	} catch(error) { return value }
				}
				Text.prototype.render = function() {
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
			},
			mount(...tagNames) {
				tagNames.length>0 || (tagNames = Object.keys(this.components));
				for(let tagName of tagNames) {
					const component = this.components[tagName];
					for(let element of document.getElementsByTagName(tagName)||[]) {
						const attributes = [].slice.call(element.attributes).reduce((accum,attribute) => { accum[attribute.name] = attribute.value; return accum; },{});
						component(attributes,element.innerHTML,element);
						element.render();
					}
				}
			},
			register(tagName,component) {
				this.components[tagName] = component;
			},
			getTagName(component) {
				for(let tagName in this.components) {
					if(this.components[tagName]===component) return tagName;
				}
			},
			Mixin: {
				initialize(attributes) {
					for(let name in attributes) this.setAttribute(name,this.parse(attributes[name]),true);
					//for(let attribute of [...this.attributes]) this.setAttribute(attribute.name,this.getAttribute(attribute.value),true); // forces "compilation"
					this.id || this.setAttribute("id",`rid${String(Math.random()).substring(2)}`,true);
				},
				resolve(template,attributes) {
					return Function("el","a","with(el) { with(a) { return `" + template + "`} }")(this,Object.assign({},this.getAttributes(),attributes)); },
				toString() { 
					const stringify = (v) => {
							const type = typeof(v);
							if(type==="string") return v;
							if(v && type==="object") {
								if(Array.isArray(v)) v = v.map(item => (item && typeof(item)==="object" && item instanceof HTMLElement ? item.getAttributes() : item));
								else if (v instanceof HTMLelement) v = v.getAttributes();
								return "${" + JSON.stringify(v) + "}";
							}
							return JSON.stringify(v);
						}
					return `<${this.localName}${[].slice.call(this.attributes).reduce((accum,attribute) => accum += (` ${attribute.name}="${stringify(this.getAttribute(attribute.name))}"`),"")}>${this.innerHTML}</${this.localName}>`
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