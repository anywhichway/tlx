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
					const [key,op] = value.replace(/\</g,"\\<").split(" "),
						newchildren = [];
					if(op==="of") {
						const target = value.substring(value.indexOf(" of ")+4),
							array = JSON.parse(target);
						let extras = {array};
						for(let index=0;index<array.length;index++) {
							extras = Object.assign({},extras);
							extras.index = index;
							extras.value = array[index];
							extras[key] = array[index];
							for(let child of vnode.children) {
								const newchild = Object.assign(Object.create(Object.getPrototypeOf(child)),child);
								if(child.attributes) {
									newchild.attributes = Object.assign({},child.attributes);
									newchild.attributes.state = extras
								} else {
									newchild.state = extras;
								}
								newchildren.push(newchild);
							}
						}
					} else if(op==="in") {
						const target = value.substring(value.indexOf(" in ")+4),
							object = JSON.parse(target);
						for(let property in object) {
							let extras = {object};
							for(let child of vnode.children) {
								extras = Object.assign({},extras);
								extras.key = property;
								extras[key] = property;
								const newchild = Object.assign(Object.create(Object.getPrototypeOf(child)),child);
								if(child.attributes) {
									newchild.attributes = Object.assign({},child.attributes);
									newchild.attributes.state = extras
								} else {
									newchild.state = extras;
								}
								newchildren.push(newchild);
							}
						}
					}
					vnode.children = newchildren;
				}
			},
			"t-foreach": (value,vnode,node) => {
				const object = value,
					newchildren = [];
				if(Array.isArray(value)) {
					for(let key=0;key<object.length;key++) {
						const value = object[key];
						for(let child of vnode.children) {
							const newchild = Object.assign(Object.create(Object.getPrototypeOf(child)),child);
							if(child.attributes) {
								newchild.attributes = Object.assign({},child.attributes);
								newchild.attributes.state = {value,key,object};
							} else {
								newchild.state = {value,key,object};
							}
							newchildren.push(newchild);
						}
					}
				} else {
					for(let key in object) {
						const value = object[key];
						for(let child of vnode.children) {
							const newchild = Object.assign(Object.create(Object.getPrototypeOf(child)),child);
							if(child.attributes) {
								newchild.attributes = Object.assign({},child.attributes);
								newchild.attributes.state = {value,key,object};
							}  else {
								newchild.state = {value,key,object};
							}
						}
					}
				}
				vnode.children = newchildren;
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
					//node.addEventListener(event,(event) => {
					//	value[event](event);
					//});
					node["on"+event] = (e) => {
						setTimeout(() => value[event](e));
					}
				}
			}
		}
	};
}(tlx));