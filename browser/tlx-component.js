(function(tlx) {
	const elements = {},
		_registerElement = document.registerElement;
	document.registerElement = function(name,cls) {
		//if(typeof(customElements)!=="undefined") customElements.define(name,cls);
		tlx.Component.register(cls,name);
	}
	//if(!_registerElement) {
		/*function createComponents(node=document.body) {
			for(let child of [].slice.call(node.children)) {
				const cls = elements[child.tagName];
				if(cls) {
					Object.setPrototypeOf(child,cls.prototype);
					child.connectedCallback(null,document);
				}
				createComponents(child);
			}
		}*/
		//setTimeout(createComponents);
		//document.onload = createComponents;
	//}
	tlx.Component = class Component extends HTMLElement {
		static create(attributes,element) {
			element = (element && element instanceof HTMLElement ? element : document.createElement(element));
			for(let name in attributes) tlx.setAttribute(element,name,attributes[name]);
			!element.state || !tlx.options || !tlx.options.reactive || (element.state = tlx.activate(element.state));
			return element;
		}
		static register(cls,name=cls.name) {
			const cname = name.toUpperCase();
			if(elements[cname]!=cls) {
				elements[cname] = cls;
				cls.create = (attributes,element) => {
					element = Component.create(attributes,element);
					Object.setPrototypeOf(element,cls.prototype);
					if(cls.attributes) {
						for(let name in cls.attributes) {
							if(!tlx.getAttribute(element,name)) tlx.setAttribute(element,name,cls.attributes[name]);
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
		connectedCallback() { 
			if(!this.tlxConnected) {
				this.tlxConnected = true;
				const attributes = tlx.getAttributes(this),
					state = tlx.getState(this);
				!state || (attributes.state = state);
				for(let name in attributes) {
					let value = attributes[name],
						type = typeof(value);
					if(name!=="value" && type==="string" && value.indexOf("${")>=0) value = attributes[name] = tlx.fromJSON(tlx.resolve(value,this));
					tlx.setAttribute(this,name,value);
				}
				this.tlxInitializing = true;
				tlx.render(this.render(),null,this);
				for(let name in attributes) !tlx.directives || !tlx.directives.HTMLElement || !tlx.directives.HTMLElement.handle || tlx.directives.HTMLElement.handle(name,attributes[name],this);
				delete this.tlxInitializing;
			} else if(!this.tlxInitializing) {
				const replacement = tlx.render(this.render());
				while(this.lastChild) this.removeChild(this.lastChild);
				for(let child of [].slice.call(replacement.children)) this.appendChild(child);
			}
		}
		setState(state) {
			this.state || (tlx.options.active ? tlx.activate({}) : {});
			Object.assign(this.state,state);
		}
	}
})(tlx);