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
	Object.assign(this.tlx.directives,{
			"t-if": (value,template,vnode) => {
				if(value) {
					const el = document.createElement("div"),
						resolved = el.vNode(tlx.resolve(vnode,template,null,vnode.currentState,{value}));
					if(resolved.children) return resolved.children;
					return resolved;
				}
				return [];
			},
			"t-for": (spec,template,vnode) => {
					const el = document.createElement("div"),
						children = [];
	  			if(spec.of) {
	  				spec.of.forEach((value,index,array) => {
	  					const extra = {[spec.let||spec.var]:value,value,index,array},
	  						resolved = el.vNode(template.resolve ? template.resolve(null,vnode.currentState,extra): tlx.resolve(vnode,template,null,vnode.currentState,extra));
	  					children[index] = (resolved.children ? resolved.children[0] : resolved);
	  				});
	  			} else {
	  				Object.keys(spec.in).forEach((key,index) => {
	  					const extra = {[spec.let||spec.var]:key,value:spec.in[key],key,object:spec.in},
  							resolved = el.vNode(template.resolve ? template.resolve(null,vnode.currentState,extra): tlx.resolve(vnode,template,null,vnode.currentState,extra));
	  					children[index] = (resolved.children ? resolved.children[0] : resolved);
	  				});
	  			}
	  			return children;
			},
			"t-foreach": (value,template,vnode) => {
				if(Array.isArray(value)) return tlx.directives["t-for"]({of:value,let:'value'},template,vnode);
				return tlx.directives["t-for"]({in:value,let:'key'},template,vnode);
			},
			"t-on": (value,_,vnode) => {
				for(let key in value) {
					vnode.attributes["on"+key] = `(${value[key]})(event)`;
				}
			}
	});
	if(typeof(module)!=="undefined") {
		module.exports = tlx;
	}
	if(typeof(window)!=="undefined") {
		window.tlx = tlx;
	}
}).call(typeof(window)!=="undefined" ? window : this);