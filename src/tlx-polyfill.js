(function(tlx) {
	"use strict"
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
	let polyfill = (typeof(global.customElements)==="undefined" ? "force" : true);
	tlx.polyfill = function(force) {
		if(typeof(global.customElements)==="undefined" || force) {
			const _document_createElement = document.createElement.bind(document);
			document.createElement = function(tagName,options) {
				const ctor = tlx.customElementRegistry.get(tagName);
				const el = _document_createElement(tagName,options);
				if(ctor) {
					ctor(el);
					!el.adoptedCallback || setTimeout(() => el.adoptedCallback(null,document));
				}
				return el;
			}
			const document_adoptNode = document.adoptNode.bind(document);
			document.adoptNode = function(node) {
				const olddocument = node.ownerDocument;
				node = _document_adoptNode(node);
				!node.adoptedCallback || document===olddocument || setTimeout(() => node.adoptedCallback(olddocument,document));
				return node
			}
			const node_appendChild = Node.prototype.appendChild;
			Node.prototype.appendChild = function(node) {
				!node.connectedCallback || node.ownerDocument || setTimeout(() => node.connectedCallback());
				return node_appendChild.call(this,node);
			}
			const node_insertBefore = Node.prototype.insertBefore;
			Node.prototype.insertBefore = function(newChild,referenceChild) {
				!newChild.connectedCallback || newChild.ownerDocument || setTimeout(() => newChild.connectedCallback());
				return node_insertBefore.call(this,newChild,referenceChild);
			}
			const node_removeChild = Node.prototype.removeChild;
			Node.prototype.removeChild = function(node) {
				!node.disconnectedCallback || setTimeout(() => node.disconnectedCallback());
				return node_removeChild.call(this,node);
			}
			const node_replaceChild = Node.prototype.replaceChild;
			Node.prototype.replaceChild = function(newChild,oldChild) {
				!newChild.connectedCallback || newChild.ownerDocument || setTimeout(() => newChild.connectedCallback());
				!oldChild.disconnectedCallback || setTimeout(() => oldChild.disconnectedCallback());
				return node_replaceChild.call(this,newChild,oldChild);
			}
			
			const _HTMLElement = HTMLElement;
			global.HTMLElement = class HTMLElement { 
				constructor(tagName) {
					const el =  _document_createElement(tagName);
					Object.defineProperty(this,"__el__",{enumerable:false,configurable:true,writable:true,value:el});
					const prototype = Object.getPrototypeOf(this),
						descriptors = Object.getOwnPropertyDescriptors(prototype);
					for(let key in descriptors) {
						key==="constructor" || (el[key] = prototype[key]);
					}
				}
			}
			tlx.customElementRegistry = {
					define(name,cls,options) {
							const ctor = function(attributes={},el=_document_createElement(name)) {
								Object.defineProperty(el,"constructor",{enumerable:false,configurable:true,writeable:true,value:cls});
								const instance = new cls(name),
									proto = Object.create(cls.prototype);
								Object.keys(instance).forEach(key => (el[key] = instance[key]));
								for(let key in attributes) {
									el.setAttribute(key,attributes[key],true);
									if(cls.observedAttributes && cls.observedAttributes.includes(key) && el.attributeChangedCallback) {
										el.attributeChangedCallback(key,null,attributes[key],null);
									}
								}
								return el;
							}
							tlx.define(name,ctor);
					},
					get(name) {
						return tlx.get(name);
					},
					whenDefined(name) {
						return tlx.whenDefined(name);
					}
			}
			Object.defineProperty(global,"customElements",{enumerable:true,configurable:true,writable:false,value:tlx.customElementRegistry});
		}
	}
	
	tlx.options || (tlx.options={});
	tlx.options.polyfill = polyfill;
	typeof(global.customElements)!=="undefined" || (tlx.options.components = true);
}).call(this,tlx);