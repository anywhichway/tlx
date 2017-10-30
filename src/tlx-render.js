(function(tlx) {
	
	const resolve = function(template,node,nonReactive) { // walk up the DOM tree for state data, n=node,s=state,p=property,e=extras
			const code = // left align, 2 char indent, single char variables to reduce size since templates not minimized
`let state=n.state;
while(!state && n && (n.parentElement||n.ownerElement)) { n = n.parentElement||n.ownerElement; state = !n || n.state; }
if(!state) return;
 do{
  try {
   with(e){with(state){return $.parser__template__;}}
  }catch(err){
   if(err instanceof ReferenceError){
    const p=err.message.split(" ")[0];
     let prnt=n.parentElement||n.ownerElement,v;
      while(prnt){
       let s = prnt.state;
       if(s && typeof(s)==="object" && p in s){v=s[p];break;}
       prnt=prnt.parentElement;
	  }
      if(typeof(v)==="undefined") return; 
	  else e[p]=v;
   }else throw(err);
  }
 }while(true)`.replace(/__template__/g,"`"+template+"`");
			tlx._NODE = (nonReactive ? null : node);
			const extrs = {};
			let value = new Function("n","$","e",code).call(node,node,tlx.$,extrs);
			tlx._NODE = null;
			return value;
	};
	tlx.getState = (node) => { // force resolution of parent states first
		let state;
		if(!node) return;
		if(node.state) return node.state;
		let parent = node.parentElement||node.ownerElement;
		if(parent) state = tlx.getState(parent);
		const statestr = node.getAttribute("state");
		if(statestr && statestr.indexOf("${")>=0) {
			return node.state = resolve(statestr,{state:{}});
		}
		return state;
	}
	tlx.render = (vnode,target,node) => {
		function renderVNode(vnode,node,parent) {
		    if(typeof(vnode)!=="object") {
		    	let text = vnode+"";
				if(/\S/.test(text)) { // don't bother with empty text nodes
			    	text = text.replace(/[ \r\n\t]+/g," ");
					if(text[0]===" " && text[1]===" ") text = text.trimLeft() + " ";
					if(text[text.length-1]===" " && text[text.length-2]===" ") text = text.trimRight() + " ";
					if(text.indexOf("${")>=0) {
						node || (node = document.createTextNode(text));
						templates.set(node,text);
						return node;
					}
					!node || (node.textContent = text);
					node || (node = document.createTextNode(text));
					node.parentNode || !parent || parent.appendChild(node);
					return node;
				}
				return;
		    }
		    if(["template","script"].includes(vnode.nodeName)) return node;
		    node || (node = document.createElement(vnode.nodeName));
		    node.parentNode || !parent || parent.appendChild(node);
		    const attributes = vnode.attributes || {};
		    if(attributes.state && typeof(attributes.state)==="string") {
				const value = tlx.fromJSON(vnode.attributes.state);
				attributes.state===value || (attributes.state = value);
			}
		    if(tlx.directives && tlx.directives.VNode && tlx.directives.VNode.handle) {
		    	for(let name in attributes) {
		    		tlx.directives.VNode.handle(name,tlx.fromJSON(attributes[name]),vnode);
		    	}
		    }
		    for(let name in attributes) {
		    	const value = attributes[name],
	    			type = typeof(value);
		    	if((type==="string" && value.indexOf("${")>=0) || name[1]==="-") {
		    		templates.set(templates.size,{node:node,template:value,name});
		    	} else tlx.setAttribute(node,name,value);
		    }
		    (vnode.children || []).forEach(child => {
		    	if(!child) return; // should not happen
		    	Array.isArray(child) || (child = [child]); // not sure why this needs to happen sometimes, child should never be an array
		    	for(let vnode of child) {
		    		const childnode = renderVNode(vnode,null,node);
			    	if(!childnode) return;
			    	childnode.vnode = vnode;
			    	if(childnode instanceof Text && childnode.textContent.indexOf("${")>=0) {
			    		templates.set(childnode,childnode.textContent.trim());
				    }
				    node.appendChild(childnode);
		    	}
		    });
		    if(tlx.Component && node && node instanceof HTMLElement) {
		    	const cls = tlx.Component.registered(node.tagName);
		    	!cls || cls.create(vnode.attributes||{},node).connectedCallback();
		    }
		    return node;
		}
	    if(node) {
	    	while(node.lastChild) node.removeChild(node.lastChild);
	    }
	    !node || (node.vnode = vnode);
		const templates = new Map();
		node = renderVNode(vnode,node);
		for(let [node,template] of templates) {
			if(typeof(template)==="object") { // it is an attribute
				const name = template.name;
				node = template.node;
				template = template.template;
				const nonreactive = name!=="value" || !tlx.Component || node instanceof tlx.Component;
					resolved = (typeof(template)==="string" ? tlx.fromJSON(resolve(template,node,nonreactive)) : template);
				type = typeof(resolved);
			    !tlx.directives || !tlx.directives.HTMLElement || !tlx.directives.HTMLElement.handle || tlx.directives.HTMLElement.handle(name,resolved,node);
			    tlx.setAttribute(node,name,resolved);
			} else {
				const resolved = resolve(template,node);
				node.textContent = (!resolved || typeof(resolved)!=="object" ? resolved : JSON.stringify(resolved));
			}
		}
	    if(target) target.appendChild(node);
	    return node;
	};
	tlx.resolve = resolve;
	tlx._NODE = null;
	tlx.$ = {
		parser(strings,...values) {
			if(values.length===1 && strings.filter(item => item.length>0).length===0) return values[0];
			let result = "";
			for(let i=0;i<strings.length;i++) result += (strings[i] + (i<values.length ? (values[i] && typeof(values[i])==="object" ? JSON.stringify(values[i]) : values[i]) : ""));
			return result;
		}
	};
})(tlx);