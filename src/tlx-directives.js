(function() {
	"use strict"
	/* Copyright 2017,2018, AnyWhichWay, Simon Y. Blackwell, MIT License
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
	const directives = {
			"t-if": function(vnode,node,value) {
				return tlx.truthy(value);
			},
			"t-foreach": (vnode,node,items) => {
				vnode.children = [];
				const scope = Object.assign({},items);
				if(Array.isArray(items)) {
					items.forEach((value,index,array) => {
						for(const child of node.childNodes) {
							const vdom = tlx.vtdom(child,Object.assign(scope,{currentValue:value,value,index,array}));
							if(vdom) vnode.children.push(vdom);
						}
					});
				} else {
					Object.keys(items).forEach((key,index,object) => {
						const value = items[key];
						for(const child of node.childNodes) {
							const vdom = tlx.vtdom(child,Object.assign(scope,{currentValue:value,key,value,index,object}));
							if(vdom) vnode.children.push(vdom);
						}
					});
				}
			},
			"t-for": function(vnode,node,spec) {
				const inIndex = spec.indexOf(" in")>=0 ? spec.indexOf(" in") : Infinity,
						ofIndex = spec.indexOf(" of")>=0 ? spec.indexOf(" of") : Infinity,
						i = Math.min(inIndex,ofIndex);
				if(i===Infinity) throw new TypeError(`Malformed t-for spec '${spec}'`);
				vnode.children = [];
				const	type = i===inIndex ? "in" : "of",
						vname = spec.substring(0,i).trim(),
						target = spec.substring(i+3,spec.length).trim();
				let value;
				try {
					value = Function("return " + target).call(null);
					const scope = Object.assign({},value);
					if(type==="of") {
						for(const item of value) {
							for(const child of node.childNodes) {
								const vdom = tlx.vtdom(child,Object.assign(scope,{[vname]:item,value}));
								if(vdom) vnode.children.push(vdom);
							}
						}
					} else {
							for(const item in value) {
								for(const child of node.childNodes) {
									const vdom = tlx.vtdom(child,Object.assign(scope,{[vname]:item,key:item}));
									if(vdom) vnode.children.push(vdom);
								}
							}
					}		
				} catch(e) {
					throw new TypeError(`Malformed t-for spec '${spec}'`);
				}
			},
			"t-on": function(vnode,node,spec) {
				for(const key in spec) {
					vnode.attributes["on"+key] = spec[key];
				}
				return true;
			}
	};
	directives["@"] = directives["t-on"];
	tlx.directive = (key,f) => directives[key] = f;
	if(typeof(module)!=="undefined") module.exports = (tlx) => tlx.directives = directives;
	if(typeof(window)!=="undefined") tlx.directives = directives;
}).call(this)