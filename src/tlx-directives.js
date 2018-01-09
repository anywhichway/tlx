(function(tlx) {
	"use strict";
	tlx.directives = {
			"t-if": (value,template,element) => {
				if(value) {
					return element.resolve(template,{value})
				}
			},
			"t-for": (spec,template,element) => {
	  			if(spec.of) {
	  				return spec.of.reduce((accum,value,index,array) => accum += element.resolve(template,{[spec.let||spec.var]:value,value,index,array}),"");
	  			} else {
	  				return Object.keys(spec.in).reduce((accum,key) => accum += element.resolve(template,{[spec.let||spec.var]:key,value:spec.in[key],key,object:spec.in}),"");
	  			}
			},
			"t-foreach": (value,template,element) => {
				if(Array.isArray(value)) return tlx.directives["t-for"]({of:value,let:'value'},template,element);
				return tlx.directives["t-for"]({in:value,let:'key'},template,element);
			}
	}
	tlx.renderDirective = function(element,attribute) {
		if(attribute.name==="t-on") {
			for(let key in element["t-on"]) {
				element["on"+key] = element["t-on"][key];
			}
		} else {
			const directive = (tlx.directives ? tlx.directives[attribute.name] : null);
			if(directive) {
				const template = element.innerHTML || element.textContent,
					name = attribute.name,
					render = (element.render===HTMLElement.prototype.render ? null : element.render);
	  		element.render = function()  {
	  			!render || render.call(element);
	  			const html = directive(element.getAttribute(name),template,element);
	  			if(typeof(html)==="undefined") {
	  				element.innerHTML = "";
	  			} else {
	  				element.innerHTML = html;
		  			for(let child of [].slice.call(element.childNodes)) child instanceof HTMLTemplateElement || child instanceof HTMLScriptElement || child.render();
	  			}
	  			return element.innerHTML;
	  		}
	  	}
		}
	}
}(tlx));