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
	const tlx = this.tlx || (this.tlx = {});
	tlx.options || (tlx.options={});
	tlx.options.components = true;
	tlx.components = {};
	tlx.define = function(tagName,component) {
		this.components[tagName] = component;
		if(this.promises && this.promises[tagName]) {
			this.promises[tagName](component);
		}
	}
	tlx.get = function(tagName) {
		return this.components[tagName];
	}
	tlx.mount = function(...tagNames) {
		tagNames.length>0 || (tagNames = Object.keys(this.components));
		for(let tagName of tagNames) {
			const component = this.components[tagName],
				elements = [].slice.call(document.getElementsByTagName(tagName)||[]);
			for(let element of elements) {
				if(!element.vnode) {
					const attributes = [].slice.call(element.attributes).reduce((accum,attribute) => { accum[attribute.name] = attribute.value; return accum; },{});
					component(attributes,element).vnode.render();
				}
			}
		}
	}
	tlx.whenDefined = function(tagName) {
		this.promises || (this.promises = {});
		let resolver;
		const promise = new Promise(resolve => resolver = resolve);
		this.promises[tagName] = resolver;
		!this.components[tagName] || resolver(this.components[tagName]);
		return promise;
	}
	tlx.getTagName = function(component) {
		for(let tagName in this.components) {
			if(this.components[tagName]===component || this.components[tagName].class===component) return tagName;
		}
	}
	tlx.Mixin = {
		initialize(attributes={}) {
			const properties = Object.assign({},attributes);
			for(let key in properties) {
				const value = properties[key],
					type = typeof(value);
				type!=="object" || delete attributes[key];
			}
			const vnode = this.vNode(null,attributes);
			for(let key in properties) {
				vnode[key] = tlx.resolve(vnode,properties[key],attributes,vnode.state);
			}
			return vnode;
		},
	/*	toString() { 
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
		}*/
	}
	
	if(typeof(module)!=="undefined") module.exports = tlx;
	if(typeof(window)!=="undefined") window.tlx = tlx;
}).call(typeof(window)!=="undefined" ? window : this);