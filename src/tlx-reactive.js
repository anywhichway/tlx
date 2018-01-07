(function(tlx) {
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
						!option.selected || value.push(tlx.fromJSON(option.value));
					}
				} else {
					value = tlx.fromJSON(target.value);
				}
				const parts = property.split(".");
				let state = this.state;
				property = parts.pop(); // get final property
				for(let key of parts) {
					state = state[key] || {};
				} // walk tree
				state[property] = value; // set property
			}
		};
		return f.bind(tlx.getState(this)||(this.state={}));
	}
	tlx.options || (tlx.options={});
	tlx.options.reactive = true;
}(tlx));