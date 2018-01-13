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
	
		HTMLElement.prototype.resolve = function(template,attributes={}) {
				const as = this.getAncestorWithState(),
					first = template.indexOf("${"),
					second = (first>=0 ? template.indexOf("${",first+1) : -1);
				if(first>=0) {
					if(second>=0 || first>0) {
						return Function("el","__state__","__attr__","with(el) { with(__state__) { with(el.state||{}) { with(__attr__) { return `" + template + "`}}}}")(this,as.state||{},Object.assign({},this.getAttributes(),attributes)); 
					}
					const value =  Function("el","__state__","__attr__","with(el) { with(__state__) { with(el.state||{}) { with(__attr__) { return (function() { return arguments[arguments.length-1]; })`" + template + "` }}}}")(this,as.state||{},Object.assign({},this.getAttributes(),attributes));
					return (tlx.options.sanitize===false ? value : tlx.escape(value));
				}
				return template;
			}
		Node.prototype.getAncestorWithState = function() {
				const parentNode = this.parentNode || this.ownerElement;
				if(parentNode && parentNode instanceof HTMLElement) {
					const state = parentNode.getAttribute("state");
					if(state) return {parentNode,state};
					return parentNode.getAncestorWithState();
				}
				return {};
			}
				
})(tlx);