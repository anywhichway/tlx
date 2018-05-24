(function() {
	const bind = (model,element=(typeof(document)!=="undefined" ? document.body : null)) => tlx.mvc({model,template:element.innerHTML},typeof(element)==="string" ? document.querySelector(element) : element),
	 clone = (data) => {
			if(Array.isArray(data)) {
				const result = [];
				for(const key of data) {
					const value = clone(data[key]);
					if(value!==undefined) result.push(value);
				}
				return result;
			} 
			if(data && typeof(data)==="object") {
				const result = {}; //Object.create(Object.getPrototypeOf(data));
				for(const key in data) {
					const value = clone(data[key]);
					if(value!==undefined) result[key] = value;
				}
				return result;
			}
			return data;
		},
		domParser = new DOMParser(),
		parse = (strings,...values) => {
			if(strings[0]==="" && strings[1]==="" && values.length===1) return values[0];
			if(values.length===0) return strings[0];
			return strings.reduce((html,string,i) => html += string + (i<strings.length-1 ? (typeof(values[i])==="string" ? values[i] : (values[i]===undefined ? "" : JSON.stringify(values[i]))) : ""),"");
		},
		vtdom = (data,scope,skipResolve) => {
			const resolve = value => {try { return scope && !skipResolve ? Function("p","with(this) { with(this.model||{}) { return p`" + value + "`; }}").call(scope,parse) : value } catch(e) { return value; }},
				vnode = (() => {
					const type = typeof(data);
					let node = data;
					if(type==="string") {
						const doc = domParser.parseFromString(data,"text/html");
						node = doc.body.childNodes[0];
					} else if(!node || type!=="object" || !(node instanceof Node)) throw new TyperError("Argument to tlx.vtdom must be string or object");
					
					if(node instanceof Text) return resolve(node.data);
					
					const attributes = {};
					for(const attr of node.attributes) {
						let value = resolve(attr.value);
						if(typeof(value)==="function") {
							const render = scope.controller ? scope.controller.render : scope.render,
								partials = render ? render.partials : false,
								model = partials ? clone(scope.model||scope) : scope.model||scope,
								f = value.bind(model),
								current = clone(model),
								update = (partial) => {
									if(partials) Object.assign(scope.model||scope,partial);
									if(tlx.different(current,scope.model||scope) && render) render();
								};
							Object.defineProperty(model,"update",{enumerable:false,configurable:true,writable:true,value:update});
							value = (...args) => { update(f(...args)); };
						}
						attributes[attr.name] =  value;
					}
					attributes["t-template"] = "<div>"+node.innerHTML+"</div>";
					
					const vnode = tlx.h(node.tagName.toLowerCase(),attributes);
					if(typeof(vnode)!=="function") {
						if(node.id) vnode.key = node.id;
						if(!skipResolve) {
							for(const aname in vnode.attributes) {
								if(aname==="t-state" || (tlx.directives && tlx.directives[aname])) {
									let value = vnode.attributes[aname];
									if(!Array.isArray(value) && value && typeof(value)==="object" && scope && typeof(scope)==="object") value = Object.assign({},scope,value);
									if(aname==="t-state") {
										if(scope.model) Object.assign(scope.model,value);
										else Object.assign(scope,value);
									} else {
										const next = tlx.directives[aname](vnode,node,value);
										if(!next) return vnode;
									}
								}
							}
						}
						for(const child of node.childNodes) {
							if(child instanceof Text) {
								const value = resolve(child.data);
								vnode.children.push(typeof(value)==="string" ? value : JSON.stringify(value));
							} else {
								vnode.children.push(vtdom(child,scope,skipResolve));
							}
						}
					}
					return vnode;
				})();
			return vnode;
		};
	if(typeof(module)!=="undefined") module.exports = (tlx) => { tlx.vtdom = vtdom; tlx.bind = bind; }
	if(typeof(window)!=="undefined") tlx.vtdom = vtdom; tlx.bind = bind;
}).call(this)