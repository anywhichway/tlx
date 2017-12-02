(function(tlx) {
	"use strict";
	tlx.directives = {
		VNode: {
			"t-if": (value,vnode) => {
				if(!value) {
					vnode.children = null;
				}
			},
			"t-for": (value,vnode,node) => {
				if(typeof(value)==="string") {
					const [key,op] = value.replace(/\</g,"\\<").split(" ");
					if(op==="of") {
						const target = value.substring(value.indexOf(" of ")+4),
							array = JSON.parse(target),
							extras = {array};
						for(let index=0;index<array.length;index++) {
							extras.index = index;
							extras.value = array[index];
							extras[key] = array[index];
							for(let child of vnode.children) {
								tlx.render(child,null,node,extras);
							}
						}
					} else if(op==="in") {
						const target = value.substring(value.indexOf(" in ")+4),
							object = JSON.parse(target);
						for(let property in object) {
							const extras = {object};
							for(let child of vnode.children) {
								extras.key = property;
								extras[key] = property;
								tlx.render(child,null,node,extras);
							}
						}
					}
				}
			},
			"t-foreach": (value,vnode,node) => {
				const object = value;
				if(Array.isArray(value)) {
					for(let key=0;key<object.length;key++) {
						const value = object[key];
						for(let child of vnode.children) {
							tlx.render(child,null,node,{value,key,object});
						}
					}
				} else {
					for(let key in object) {
						const value = object[key];
						for(let child of vnode.children) {
							tlx.render(child,null,node,{value,key,object});
						}
					}
				}
			}
		},
		HTMLElement: {
			"t-if": (value,vnode,node) => {
				if(!value) {
					while(node.lastChild) {
						node.removeChild(node.lastChild);
					}
				}
			},
			"t-on": (value,vnode,node) => {
				node.removeAttribute("t-on");
				for(let event in value) {
					//node.addEventListener(event,value[event]);
					node["on"+event] = value[event];
				}
			}
		}
	};
}(tlx));