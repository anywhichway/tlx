(function() {
	"use strict";
	const formChild = (element) => {
		if(!element) return false;
		if(element.parentElement instanceof HTMLFormElement) return true;
		return formChild(element.parentElement);
	}
	class tlxEditor extends tlx.Component {
		static get attributes() {
			return {
				label: "",
				type: "text"
			}
		}
		linkState(property) {
			const f = super.linkState(property);
			return function(event) {
				if(this.validate(event)) f(event);
			}
		}
		render(attributes) {
			// if already inside a form, then fields do not need to be wrapped in forms
			const isform = !formChild(this);
			if(!attributes) { // if attributes not passed, then get them from the parent custom tag
				attributes = {};
				for(let attribute of [].slice.call(this.attributes)) {
					attributes[attribute.name] = tlx.getAttribute(this,attribute.name);
				}
			}
			// resolve options, which is a special addition that supports validation on input fields, e.g. typing in a specific value
			!attributes.options || (this.options = attributes.options = tlx.resolve(attributes.options,this));
			// resolve value which is needed for raiogroup handling
			!attributes.value || (this.value = tlx.resolve(attributes.value,this));
			const type = attributes.type;
			let vnode;
			if(type==="select-one") vnode = tlx`<span><label style="padding-right:.5em"></label> <select>${attributes.options.map(value => (tlx`<option>${value}</option>`))}</select></span>`;
			else if(type==="select-multiple") vnode = tlx`<span><label style="padding-right:.5em"></label> <select style="vertical-align:top" multiple>${attributes.options.map(value => (tlx`<option>${value}</option>`))}</select></span>`;
			else if(type==="radiogroup") {
				// generate a random name to tie radios together
				// almost impossible for something else to get the same name
				// 1 chance in 2^53 assuming 2 radiogroups are created in the same millisecond
				const name = Date.now()+(String(Math.random()).substring(2)); 
				vnode = tlx`<span><label style="padding-right:.5em"></label> <span>${attributes.options.map(value => (tlx`<span><input type="radio" name="${name}" value="${value}">${value}</input></span>`))}</span></span>`;
			} else if(type==="textarea") {
				const elementtext = `<span>${isform ? "<form>" : ""}<label style="padding-right:.5em"></label> <textarea style="vertical-align:top;" ${this.options ? "required" : ""}></textarea>${isform ? "</form>" : ""}</span>`;
				vnode = Function("return tlx`"+elementtext+"`").call(this);
			} else {
				const elementtext = `<span>${isform ? "<form>" : ""}<label style="padding-right:.5em"></label> <input type="${type}" ${this.options ? "required" : ""}>${isform ? "</form>" : ""}</span>`;
				vnode = Function("return tlx`"+elementtext+"`").call(this);
			}
			// add all the passed attributes except label to the input element
			for(let name in attributes) {
				const value = attributes[name];
				if(name==="label") {
					vnode.children[0].children.push(value);
				} else if(name!=="type"){
					const input = vnode.children.filter(child => ["select","span","textarea","input"].includes(child.nodeName))[0]; 
					typeof(input.attributes[name])!=="undefined" || (input.attributes[name] = value);
					if(input.nodeName==="span") { // radiogroup
						for(let child of input.children[0]) {
							child.children[1]!=this.value || (child.children[0].attributes.checked = true);
						}
					}
				}
			}
			return vnode;
		}
		validate(event) {
			const target = event.target,
				value = tlx.fromJSON(target.value),
				title = target.getAttribute("title"),
				options = this.options;
			// set a CSS invalid style in case one has not been provided
			target.style.invalid || (target.style.invalid = "{border: 2px solid red;}");
			target.orginalTitle!=null || (target.orginalTitle = title || "");
			if(options) {
				const choices = [].slice.call(options);
				if(!choices.some(option => option===value || tlx.fromJSON(option.value)===value)) {
					target.setCustomValidity("Must be one of: " + JSON.stringify(options));
				} else {
					target.setCustomValidity("");
				}
			}
			if(target.validationMessage) {
				// us the title attribute as the error message in case the filed is not in a form
				// browsers will not display their standard error floats when field are not in forms
				target.setAttribute("title",target.validationMessage);
				return;
			}
			target.setAttribute("title",target.orginalTitle);
			return true;
		}
	}
	document.registerTlxComponent("tlx-editor",tlxEditor);
	
	if(typeof(module)!=="undefined") module.exports = tlxEditor;
	if(typeof(window)!=="undefined") window.tlxEditor = tlxEditor;
})();