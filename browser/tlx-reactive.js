(function(tlx) {
	
	HTMLElement.prototype.linkState = function(property) {
		const f = function(event) {
			const target = event.target;
			let value;
			if(target.type==="checkbox") value = target.checked;
			else if(target.type==="select-multiple") {
				value = [];
				for(let option of target.options) !option.selected || value.push(fromJSON(option.value));
			}
			else {
				value = fromJSON(target.value);
			}
			const parts = property.split(".");
			let state = this;
			property = parts.pop(); // get final property
			for(let key of parts) { state = state[key] || {}}; // walk tree
			state[property] = value; // set property
		}
		return f.bind(getstate(this)||(this.state={}));
	}
	const fromJSON = (value) => {
			if(typeof(value)==="string") {
				try { value = JSON.parse(value.replace(/&quot;/g,'"'));	} catch(e) { }
			}
			return value;
		},
		getstate = (node) => {
				if(!node) return;
				if(node.state) return node.state;
				if(node.parentElement||node.ownerElement) return getstate(node.parentElement||node.ownerElement);
		};
	tlx.activate = (object) => {
		if(!object || typeof(object)!=="object" || object.tlxDependents) return object;
		const dependents = {},
			proxy = new Proxy(object,{
				get: (target,property) => {
					if(property==="tlxDependents") return dependents;
					const value = target[property],
						type = typeof(value);
					if(tlx._NODE && type!=="function" && type!=="undefined") {
						dependents[property] || (dependents[property] = new Set());
						dependents[property].add(tlx._NODE);
					}
					return value;
				},
				set: (target,property,value) => {
					if(target[property]!==value) {
						!value || typeof(value)!=="object" || value.tlxDependents || (value = tlx.activate(value));
						target[property] = value;
						if(dependents[property]) {
							for(let dependent of dependents[property]) {
								if(!dependent.ownerElement && !dependent.parentElement) {
									dependents[property].delete(dependent);
								} else {
									if(!dependent.vnode) {
										if(dependent.outerHTML.indexOf("${")>=0) {
											tlx.render(tlx.h(dependent),null,dependent);
										}
									} else {
										tlx.render(dependent.vnode,null,dependent);
									}
								}
							}
						}
					}
					return true;
				}
			});
		for(let key in object) object[key] = tlx.activate(object[key]);
		return proxy;
	};
	tlx.options || (tlx.options={});
	tlx.options.reactive = true;
		
})(tlx);