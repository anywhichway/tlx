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
	if(!tlx.options.components) console.warn("tlx-component mut be loaded to use tlx-template");
	tlx.compile = function(template) {
		const tagname = template.getAttribute("t-tagname");
		if(!tagname) return;
		const clone = document.createElement(tagname);
		clone.innerHTML = template.innerHTML;
		const	styles = clone.querySelectorAll("style"),
			scripts = clone.querySelectorAll("script");
		for(let style of [...styles]) {
			let spec = style.innerText,
				matches = spec.match(/.*\{.+\}/g),
				text = (matches ? matches.reduce((accum,item) => accum += `${tagname} ${item.trim()} `,"") : "");
			spec = (matches ? matches.reduce((accum,item) => accum = accum.replace(item,""),spec) : spec);
			matches = spec.match(/.*;/g),
			text = (matches ? matches.reduce((accum,item) => accum += `${tagname} ${item.trim()} `,text) : text);
			style.innerText = text.trim();
			document.head.appendChild(style);
		}
		const scope = [...template.attributes].reduce((accum,attribute) => { ["id","t-tagname"].includes(attribute.name) || (accum[attribute.name] = attribute.value); return accum; },{});
		for(let script of [...scripts]) {
			const newscope = Function(`with(this) { ${script.innerText} }`).call(scope);
			!newscope || (scope = newscope);
			clone.removeChild(script);
		}
		const templatehtml = clone.innerHTML.replace(/&gt;/g,">").replace(/&lt;/g,"<");
		scope.render = function() { 
			return this.innerHTML = this.resolve(templatehtml,this);
		}
		const component = Function("defaults",`return function(attributes={},el=document.createElement("${tagname}")) {
					Object.assign(el,tlx.Mixin);
					el.initialize({...defaults,...attributes});
					}`)(scope);
		this.register(tagname,component);
	}
	tlx.options || (tlx.options={});
	tlx.options.templates = true;
}(tlx));