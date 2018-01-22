(function() {
	"use strict";
	/* Copyright 2017,2018 AnyWhichWay, Simon Y. Blackwell, MIT License
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
	tlx.directives || (tlx.directives={});
	tlx.options.reactive = true;
	tlx.bind = (object,element,controller) => {
		return tlx.state(element.vNode(),object);
	}
	
	function createProxy(vnode,object,path="") {
		if(object.__isState__) return object;
		for(let key in object) {
			const value = object[key],
				type = typeof(value);
			if(value && type==="object") {
				object[key] = createProxy(vnode,value,(path.length>0 ? `${path}.${key}` : key));
			}
		}
		return new Proxy(object,{
			get(target,property) {
				if(property==="__isState__") return true;
				if(property==="__parentState__") {
					let parent = vnode.node.parentElement;
					while(parent) {
						const state = (parent.vnode ? parent.vnode.state : null);
						if(state) return state;
						parent = parent.parentElement;
					}
				}
				let value = target[property],
					type = typeof(value);
				if(type==="undefined") {
					let parent = vnode.node.parentElement,
						state;
					while(parent) {
						state = (parent.vnode ? parent.vnode.state : null);
						if(state) {
							value = state[property];
							if(typeof(value)!=="undefined") {
								return value;
							}
						}
						parent = parent.parentElement;
					}
				} else {
					const fullpath = (path.length>0 ? `${path}.${property}` : property),
						properties = this.get.properties || (this.get.properties = {}),
						nodes = properties[fullpath] || (properties[fullpath] = new Set());
					!tlx.CNODE || nodes.add(tlx.CNODE);
				}
				return value;
			},
			set(target,property,value) {
				const oldvalue = target[property];
				if(oldvalue!==value) {
					target[property] = value;
					const fullpath = (path.length>0 ? `${path}.${property}` : property),
						properties = this.get.properties;
					if(properties && properties[fullpath]) {
						for(let node of properties[fullpath]) node.render();
					}
				}
				return true;
			}
		});
	}
	tlx.state = (vnode,object={}) => vnode.state = createProxy(vnode,object);
	tlx.directives["t-state"] = (value,_,vnode) => {
		tlx.state(vnode,value);
	}
	HTMLElement.prototype.linkState = function(property) {
		const f = function(event) {
			const target = event.target;
			if([HTMLInputElement,HTMLTextAreaElement,HTMLSelectElement,HTMLAnchorElement].some(cls => target instanceof cls)) {
				let value;
				if(target.type==="checkbox") {
					value = target.checked;
				}
				else if(target.type==="select-multiple") {
					value = [];
					for(let option of [].slice.call(target.options)) {
						!option.selected || value.push((tlx.options.sanitize ? tlx.escape(option.value) : option.value));
					}
				} else {
					value = (tlx.options.sanitize ? tlx.escape(target.value) : target.value);
				}
				const parts = property.split(".");
				let state = this;
				property = parts.pop(); // get final property
				for(let key of parts) {
					state = state[key] || {};
				} // walk tree
				state[property] = value; // set property
			}
		};
		let state = this.__vNode__.attributes.state;
		if(!state) {
			const as = this.__vNode__.getAncestorWithState();
			state = as.state;
		}
		if(!state) {
			console.warn("Attempting to use linkState when no state exists in DOM tree.")
		}
		return f.bind(state);
	}
	
}).call(this);