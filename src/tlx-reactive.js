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
	HTMLElement.prototype.linkState = (path, element) => event => {
		const target = event.target;
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
				//value = (tlx.options.sanitize ? tlx.escape(target.value) : target.value);
				value = target.value;
			}
			const parts = path.split(".");
			let scope = element["t-state"] || (element["t-state"] = {});
			path = parts.pop(); // get final path
			for(let key of parts) {
				scope = scope[key] || (scope[key] = {});
			} // walk tree
			if(scope[path]!==value) {
				scope[path] = value; // set path
				if(element.render) element.render();
				else tlx.mvc({model:element["t-state"],controller:element["t-controller"],template:element["t-template"]||element.innerHTML},element);
			}
		}
	};
}).call(this)