(function() {
	class VNode {
		constructor(config) {
			Object.assign(this,config);
		}
	}
	const restore = function(el,values) {
			for(let child of [].slice.call(el.children)) restore(child,values);
			for(let attribute of [].slice.call(el.attributes)) {
				if(attribute.name.indexOf("on")===0) {
					const name = attribute.name.toLowerCase().substring(2),
						value = values[attribute.value];
					typeof(value)!=="function" || ((el.__l || (el.__l = {}))[name] = el[attribute.name] = value); // .__l for preact compatibility
				}
			}
			if(el.tagName==="TLXELEMENT") el.parentElement.replaceChild(values[el.innerText],el);
			return el;
		},
		toh = function(el) {
			if(el instanceof Text) return el.textContent || "";
			const children = [],
				attributes = {};
			for(let attribute of [].slice.call(el.attributes)) {
				let name = attribute.name;
				const value = el[name] || attribute.value;
				if(typeof(React)!=="undefined" && typeof(value)==="function" && name.indexOf("on")===0) {
					name = `on${name[2].toUpperCase()}${name.substring(3)}`; // convert to mixed case for React compatibility
				}
				attributes[name] = value;
			}
			for(let child of [].slice.call(el.childNodes)) child instanceof Attr || children.push(toh(child));
			!this.state || (attributes.state = this.state);
			return tlx.h(el.localName,attributes,children);
		};
	function tlx(strings,...values) {
		if(values.length===1 && strings.filter(item => item.length>0).length===0) return values[0];
		const elements = [];
		let result = "";
		for(let i=0;i<strings.length;i++) {
			const string = strings[i],
				type = typeof(values[i]);
			let value = (Array.isArray(values[i]) ? "" : values[i]);
			if(Array.isArray(values[i])) {
				for(let item of values[i]) {
					value += (item && typeof(item)==="object" ? (item instanceof HTMLElement ? item.textContent : (item instanceof HTMLElement ? item.outerHTML : item)) : item);
				}
			} else if(type==="function" || (value && type==="object" && !(value instanceof Node))) {
				const parts = string.split(" "),
					attr = parts[parts.length-1];
				!attr || attr[attr.length-2]!="=" || (value = i); 
			} else if(value && type==="object") value = `<tlxelement>${i}</tlxelement>`;
			result += (string + (i<values.length ? value : ""));
		}
		let el = document.createElement("span");
		el.innerHTML = result;
		if(el.children.length===1) {
			const html = el.children[0].innerHTML;
			el = document.createElement(el.children[0].tagName);
			el.innerHTML = html;
			for(let attribute of [].slice.call(el.attributes)) el.setAtttribute(attribute.name,attribute.value);
		}
		return toh(restore(el,values),this);
	}
	tlx.render = (vnode,target) => {  
	    if(typeof(vnode)==="function") vnode = vnode();
	    if(typeof(vnode)!=="object") return document.createTextNode(vnode);
	    const node = document.createElement(vnode.nodeName),
	    	attributes = vnode.attributes || {};
	    for(let name in attributes) {
	    	const value = attributes[name], 
	    		type = typeof(value); 
	    	if(type==="function" || (value && type==="object")) node[name] = value;
	    	else node.setAttribute(name, value);
	    }
	    (vnode.children || []).forEach(child => node.appendChild(tlx.render(child,null)));
	    if(target) target.appendChild(node);
	    return node;
	}
	tlx.h = (nodeName, attributes, ...args) => {
		if(typeof(React)!=="undefined") return React.createElement(nodeName,attributes,args);
		if(typeof(preact)!=="undefined") return preact.h(nodeName,attributes, ...args);
		let children = args.length ? [].concat(...args) : null;
		if(typeof(nodeName)==="function") {
			const tree = nodeName();
			for(let name in attributes) tree.attributes[name] = attributes[name];
			for(let child of children) tree.children.push(child);
			return tree;
		}
	    return new VNode({nodeName,attributes,children});
	}
	if(typeof(module)!=="undefined") module.exports = tlx;
	if(typeof(window)!=="undefined") window.tlx = tlx;
}).call(this);