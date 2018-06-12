(function() {
	const bind = function(model={},element=(typeof(document)!=="undefined" ? document.body.firstElementChild : null),options) {
		if(typeof(element)==="string") element = document.querySelector(element);
		if(!element) throw new TypeError("null element passed to tlx.bind");
		options = Object.assign({},tlx.defaults,options);
		if(arguments.length<3) { options.reactive = true; options.partials = true; }
		const controller = tlx.mvc({model,template:element.cloneNode(true)},element,options);
		if(options.reactive) return makeProxy(model,controller);
		return model;
	 },
		domParser = new DOMParser(),
		makeProxy = (data,controller) => {
			if(!data || typeof(data)!=="object") return data;
			if(Array.isArray(data)) data.forEach((item,i) => data[i] = makeProxy(item,controller))
			else Object.keys(data).forEach(key => data[key] = makeProxy(data[key],controller))
			return new Proxy(data,{
				set(target,property,value) {
					target[property] = value;
					controller.render();
					return true;
				},
				deleteProperty(target,property) {
					delete target[property];
					controller.render();
				}
			})
		}
		parse = (strings,...values) => {
			if(strings[0]==="" && strings[1]==="" && values.length===1) return values[0]===undefined ? "" : values[0];
			if(values.length===0) return strings[0];
			return strings.reduce((html,string,i) => html += string + (i<strings.length-1 ? (typeof(values[i])==="string" ? values[i] : (values[i]===undefined ? "" : JSON.stringify(values[i]))) : ""),"");
		},
		resolve = (scope,value) => {
			if(value.includes && !value.includes("$")) return value+"";
			const extras = {};
			while(extras) {
				try { 
					return scope ? Function("p","with(this) { with(this.model||{}) { return p`" + value + "`; }}").call(Object.assign(scope,extras),parse) : value
				} catch(e) {
					if(e instanceof ReferenceError) {
						let vname = e.message.split(" ").shift();
						if(vname[0]==="'" && vname[vname.length-1]==="'") vname = vname.substring(1,vname.length-1);
						extras[vname] = "";
					} else {
						return ""; 
					}
				}
			}
		},
		vtdom = (data,scope,classes,skipResolve) => {
			const vnode = (() => {
					let node = data["t-template"] || data;
					const type = typeof(data);
					if(type==="string") {
						const doc = domParser.parseFromString(data,"text/html");
						node = doc.body.childNodes[0];
					} else if(!node || type!=="object" || !(node instanceof Node)) throw new TyperError("Argument to tlx.vtdom must be string or Node");
					
					node["t-template"] || (node["t-template"]=data["t-template"]||node.cloneNode(true));
					
					if(node instanceof Text) {
						return skipResolve ? node.data: resolve(scope,node.data);
					}
					
					const attributes = {"t-template":node["t-template"]},
						keys = Object.keys(node.attributes);
					for(const key of keys) {
						const attr = node.attributes[key],
							value = skipResolve ? attr.value : resolve(scope,attr.value);
						if(value.call) { //typeof(value)==="function", faster to check .call
							const render = scope.controller ? scope.controller.render : scope.render,
								partials = render ? render.partials : false,
								model = partials ? tlx.clone(scope.model||scope) : scope.model||scope,
								f = value.bind(model),
								current = tlx.clone(model),
								update = (partial) => {
									if(partials) tlx.merge(scope.model||scope,partial);
									if(tlx.different(current,scope.model||scope) && render) render();
								};
							Object.defineProperty(model,"update",{enumerable:false,configurable:true,writable:true,value:update});
							attributes[attr.name] = (...args) => { update(f(...args)); };
						} else {
							attributes[attr.name] =  value;
						}
					}
					if(classes) {
						if(attributes.class) attributes.class += " " + classes;
						else attributes.class = classes;
					}
					
					const vnode = tlx.h(node.tagName.toLowerCase(),attributes);
					if(!vnode.call) { //typeof(vnode)!=="function"
						if(node.id) vnode.key = node.id;
						if(!skipResolve) {
							for(const aname in vnode.attributes) {
								if(aname==="t-state" || (tlx.directives && tlx.directives[aname])) {
									let value = vnode.attributes[aname];
									if(!Array.isArray(value) && value && typeof(value)==="object" && scope && typeof(scope)==="object") value = tlx.merge({},scope,value);
									if(aname==="t-state") {
										if(scope.model) tlx.merge(scope.model,value);
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
								const value = skipResolve ? child.data : resolve(scope,child.data);
								//vnode.children.push(typeof(value)==="string" ? value : JSON.stringify(value));
								vnode.children.push(value+"");
							} else if(child.nodeName!=="SCRIPT"){
								vnode.children.push(vtdom(child,scope,classes,skipResolve));
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