(function(tlx) {
	"use strict";
	const elements = {};
	document.registerTlxComponent = function(name,cls) {
		tlx.Component.register(cls,name);
	}
	tlx.Component = class Component extends HTMLElement {
		static create(element) {
			element = (element && element instanceof HTMLElement ? element : document.createElement(element));
			return element;
		}
		static register(cls,name=cls.name) {
			const cname = name.toUpperCase();
			if(elements[cname]!=cls) {
				elements[cname] = cls;
				cls.create = (element) => {
					element = Component.create(element);
					Object.setPrototypeOf(element,cls.prototype);
					if(cls.attributes) {
						for(let name in cls.attributes) {
							const value = tlx.getAttribute(element,name);
							value!=null || tlx.setAttribute(element,name,tlx.resolve(cls.attributes[name],element,null,name==="value"));
						}
					}
					return element;
				}
			}
		}
		static registered(name) {
			return elements[name.toUpperCase()];
		}
		constructor() {
			super();
		}
		setState(state) {
			this.state || (tlx.options.active ? tlx.activate({}) : {});
			Object.assign(this.state,state);
		}
	}
})(tlx);