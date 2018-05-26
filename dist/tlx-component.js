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
	const	compile = function(template) {
		const tagname = template.getAttribute("t-tagname"),
			reactive = tlx.truthy(template.getAttribute("t-reactive")),
			clone = document.createElement(tagname);
		clone.innerHTML = template.innerHTML;
		const	styles = clone.querySelectorAll("style")||[],
			scripts = clone.querySelectorAll("script")||[];
		for(let style of [].slice.call(styles)) {
			let spec = style.innerText||"",
				matches = spec.match(/.*\{.+\}/g),
				text = (matches ? matches.reduce((accum,item) => accum += `.${tagname} ${item.trim()} `,"") : "");
			spec = (matches ? matches.reduce((accum,item) => accum = accum.replace(item,""),spec) : spec);
			matches = spec.match(/.*;/g),
			text = (matches ? matches.reduce((accum,item) => accum += `${tagname} * {${item.trim()}} `,text) : text);
			style.innerText = text.trim();
			document.head.appendChild(style);
		}
		const model = [].slice.call(template.attributes).reduce((accum,attribute) => { ["id","t-tagname"].includes(attribute.name) || (accum[attribute.name] = attribute.value); return accum; },{});
		for(let script of [].slice.call(scripts)) {
			const newmodel = Function(`with(this) { ${script.innerText}; }`).call(model);
			!newmodel || (model = newmodel);
			clone.removeChild(script);
		}
		const templatehtml = `<div>${(clone.innerHTML.replace(/&gt;/g,">").replace(/&lt;/g,"<").trim()||"<span></span>")}</div>`;
		return function(attributes) {
			const view = () => tlx.vtdom(templatehtml,model,tagname);
			return target => tlx.mvc({model,view},target,{reactive}); //,options
		}
	},
	customElements = {},
	component = (tagName,ctorOrObject) => {
		const type = typeof(ctorOrObject);
		if(type==="function") {
			customElements[tagName] = ctorOrObject;
		} else if(ctorOrObject && type==="object") {
			customElements[tagName] = function(attributes) {
				const model = ctorOrObject.model(),
					controller = ctorOrObject.controller(),
					scope = {},
					view = () => tlx.vtdom(ctorOrObject.template,scope);
				Object.defineProperty(scope,"attributes",{value:attributes});
				Object.defineProperty(scope,"model",{value:model});
				Object.defineProperty(scope,"controller",{value:controller});
				return target => tlx.mvc({model,view,controller},target,ctorOrObject.options);
			}
		} else {
			throw new TypeError(`Custom element definition must be function or object, not ${ctorOrObject==null ? ctorOrObject : type}`);
		}
		const elements = document.getElementsByTagName(tagName);
		for(const element of elements) {
			customElements[tagName](element.attributes)(element);
		}
	};
	
	if(typeof(module)!=="undefined") module.exports = (tlx) => { 
		tlx.define = tlx.component = component;
		tlx.compile = compile;
		tlx.customElements = customElements;
	}
	if(typeof(window)!=="undefined") {
		tlx.define = tlx.component = component;
		tlx.compile = compile;
		tlx.customElements = customElements;
	}
}).call(this)