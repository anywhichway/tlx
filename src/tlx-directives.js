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
	  				return Object.keys(spec.in).reduce((accum,key) => accum += element.resolve(template,{[spec.let||spec.var]:spec.in[key],value:spec.in[key],key,object:spec.in}),"");
	  			}
			},
			"t-foreach": (value,template,element) => {
				if(Array.isArray(value)) return tlx.directives["t-for"]({of:value,let:'value'},template,element);
				return tlx.directives["t-for"]({in:value,let:'key'},template,element);
			},
			"t-on": (value,template,element) => {
				for(let key in value) {
					element["on"+key] = value[key];
				}
				return template;
			}
	};
}(tlx));