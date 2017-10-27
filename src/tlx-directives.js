(function(tlx) {
	tlx.directives = {
		VNode: {
			handle(name,value,node) {
				const directive = this[name];
				if(directive && name[1]==="-") {
					node.attributes[name]  = directive(node,value);
				}
			},
			"t-if": (node,value) => {
				if(!value) {
					node.children = null;
				}
				return value;
			}
		},
		HTMLElement: {
			handle(name,value,node) {
				const directive = this[name];
				if(directive && name[1]==="-") {
					const result = directive(node,value);
					if(typeof(result)!=="undefined" && result!==value) {
						if(result && typeof(result)==="object") node[name] = result;
						else node.setAttribute(name,result);
					}
				}
			},
			"t-if": (node,value) => {
				if(!value) {
					while(node.lastChild) node.removeChild(node.lastChild);
				}
				return value;
			},
			"t-foreach": (node,value) => {
				const el = document.createElement(node.tagName),
					template = node.cloneNode(true),
					children = [].slice.call(template.childNodes);
				while(node.lastChild) node.removeChild(node.lastChild);
				if(Array.isArray(value)) {
					for(let i=0;i<value.length;i++) {
						for(let child of children) {
							const clone = child.cloneNode(true);
							el.appendChild(clone);
							tlx.bind({key:i,value:value[i],object:value})(clone);
						}
					}
				} else if(value && typeof(value)==="object") {
					for(let key in value) {
						for(let child of children) {
							const clone = child.cloneNode(true);
							el.appendChild(clone);
							tlx.bind({key,value:value[key],object:value})(clone);
						}
					}
				}
				for(let child of [].slice.call(el.childNodes)) node.appendChild(child);
			},
			"t-for": (node,value) => {
				if(typeof(value)==="string") {
					const el = document.createElement(node.tagName),
						template = node.cloneNode(true),
					children = [].slice.call(template.childNodes);
					while(node.lastChild) node.removeChild(node.lastChild);
					const [key,op,target] = value.split(" ");
					if(op==="of" && target) {
						let array;
						if(target.indexOf("${")>=0) {
							array = resolve(target,node);
						} else {
							try {
								array = JSON.parse(target);
							} catch(e) { }
						}
						for(let i=0;i<array.length;i++) {
							for(let child of children) {
								const clone = child.cloneNode(true);
								el.appendChild(clone);
								const state = {};
								state[key] = array[i];
								tlx.bind(state)(clone);
							}
						}
					} else if(op==="in" && target) {
						let object;
						if(target.indexOf("${")>=0) {
							object = resolve(target,node);
						} else {
							try {
								object = JSON.parse(target);
							} catch(e) { }
						}
						for(let property in object) {
							for(let child of children) {
								const clone = child.cloneNode(true);
								el.appendChild(clone);
								const state = {object};
								state[key] = property;
								tlx.bind(state)(clone);
							}
						}
					}
					for(let child of [].slice.call(el.childNodes)) node.appendChild(child);
				}
			}
		}
	}
})(tlx);