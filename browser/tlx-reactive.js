(function(tlx) {
	"use strict";
	HTMLElement.prototype.linkState = function(property) {
		const f = function(event) {
			const target = event.target;
			if([HTMLInputElement,HTMLTextAreaElement,HTMLSelectElement].some(cls => target instanceof cls)) {
				let value;
				if(target.type==="checkbox") {
					value = target.checked;
				}
				else if(target.type==="select-multiple") {
					value = [];
					for(let option of target.options) {
						!option.selected || value.push(tlx.fromJSON(option.value));
					}
				} else {
					value = tlx.fromJSON(target.value);
				}
				const parts = property.split(".");
				let state = this;
				property = parts.pop(); // get final property
				for(let key of parts) {
					state = state[key] || {};
				} // walk tree
				state[property] = value; // set property
			}
		};
		return f.bind(tlx.getState(this)||(this.state={}));
	};
	tlx.activate = (object) => {
		if(!object || typeof(object)!=="object" || object.tlxDependents) {
			return object;
		}
		const dependents = {},
			proxy = new Proxy(object,{
				get: (target,property) => {
					if(property==="tlxDependents") {
						return dependents;
					}
					const value = target[property],
						type = typeof(value);
					if(tlx._NODE && type!=="function" && type!=="undefined") {
						dependents[property] || (dependents[property] = new Set());
						dependents[property].add(tlx._NODE);
					}
					return value;
				},
				set: (target,property,value) => {
					const oldvalue = target[property];
					if(oldvalue!==value) {
						const type = typeof(value);
						!value || type!=="object" || value.tlxDependents || (value = tlx.activate(value));
						if(typeof(oldvalue)===type==="object") {
							const olddependents = oldvalue.tlxDependents,
								newdependents = value.tlxDependents;
							if(olddependents) {
								for(let key in olddependents) {
									newdependents[key] = olddependents[key];
								}
							}
						}
						target[property] = value;
						if(dependents[property]) {
							for(let dependent of dependents[property]) {
								if(!dependent.ownerElement && !dependent.parentElement) {
									dependents[property].delete(dependent);
								} else {
									dependent.vnode.node = dependent;
									tlx.render(dependent.vnode);
									dependent.vnode.node = null;
								}
							}
						}
					}
					return true;
				}
			});
		for(let key in object) {
			object[key] = tlx.activate(object[key]);
		}
		return proxy;
	};
	tlx.getState = (node) => { // force resolution of parent states first
		if(!node) {
			return;
		}
		if(node.state) {
			return node.state;
		}
		return tlx.getState(node.parentElement||node.ownerElement);
	};
	tlx.options || (tlx.options={});
	tlx.options.reactive = true;
		
}(tlx));