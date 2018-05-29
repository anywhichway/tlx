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
	HTMLElement.prototype.linkState = (path, ...elements) => event => {
		const target = event.target;
		for(let element of elements) {
			if(typeof(element)==="string") element = document.querySelector(element);
			if([HTMLInputElement,HTMLTextAreaElement,HTMLSelectElement,HTMLAnchorElement].some(cls => target instanceof cls)) {
				let value;
				if(target.type==="checkbox") value = target.checked;
				else if(target.type==="select-multiple") {
					value = [];
					for(let option of [].slice.call(target.options)) {
						!option.selected || value.push(tlx.options.sanitize ? tlx.escape(option.value) : option.value);
					}
				} else {
					value = (tlx.defaults.protect ? tlx.escape(target.value) : target.value);
				}
				const parts = path.split("."),
					model = {};
				let scope = model;
				const property = parts.pop(); // get final path
				for(let key of parts) { // walk tree
					scope = scope[key] || (scope[key] = {});
				} 
				//if(scope[property]!==value) {
					scope[property] = value; // set path
					if(element.render) element.render(model);
					else tlx.mvc({model:model,controller:element["t-controller"],template:element["t-template"]||element.outerHTML},element);
				//}
			}
		}
	};
	
	if(typeof(module)!=="undefined") module.exports = () => {};
}).call(this)