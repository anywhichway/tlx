(function(tlx) {
	
	const fromJSON = (value) => {
			if(typeof(value)==="string") {
				try { value = JSON.parse(value.replace(/&quot;/g,'"'));	} catch(e) { }
			}
			return value;
		},
		resolve = function(template,node) { // walk up the DOM tree for state data, n=node,s=state,p=property,e=extras
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
						tlx._NODE = node;
						const extrs = {};
						let value = new Function("n","$","e",code).call(node,node,tlx.$,extrs);
						tlx._NODE = null;
						return value;
	};
	tlx.render = (vnode,target,node) => {
		function renderVNode(vnode,node) {
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
					return node || document.createTextNode(text);
				}
				return;
		    }
		    node || (node = document.createElement(vnode.nodeName));
		    const attributes = vnode.attributes || {};
		    for(let name in attributes) {
		    	const value = attributes[name],
	    			type = typeof(value);
		    	if((type==="string" && value.indexOf("${")>=0) || name[1]==="-") {
		    		templates.set(templates.size,{node:node,template:value,name});
		    	} else {
			    	if(value && type==="object") node[name] = value;
			    	else if(type==="function") node.addEventListener(name.substring(2).toLowerCase(),value);
			    	else node.setAttribute(name, value);
		    	}
		    }
		    (vnode.children || []).forEach(child => {
		    	if(!child) return; // should not happen
		    	const childnode = renderVNode(child);
		    	if(!childnode) return;
		    	childnode.vnode = child;
		    	if(childnode instanceof Text && childnode.textContent.indexOf("${")>=0) {
		    		templates.set(childnode,childnode.textContent.trim());
			    }
			    node.appendChild(childnode);
		    });
		    return node;
		}
	    if(node) {
	    	while(node.lastChild) node.removeChild(node.lastChild);
	    }
	    !node || (node.vnode = vnode);
	    const attributes = vnode.attributes;
	    if(attributes) {
		    if(attributes.state && typeof(attributes.state)==="string") {
				const value = fromJSON(vnode.attributes.state);
				attributes.state===value || (attributes.state = value);
			}
		    if(tlx.directives && tlx.directives.VNode && tlx.directives.VNode.handle) {
		    	for(let name in attributes) {
		    		tlx.directives.VNode.handle(name,fromJSON(attributes[name]),vnode);
		    	}
		    }
	    }
		const templates = new Map();
		node = renderVNode(vnode,node);
		for(let [node,template] of templates) {
			if(typeof(template)==="object") { // it is an attribute
				const name = template.name;
				node = template.node;
				template = template.template;
				const resolved = fromJSON(resolve(template,node));
				type = typeof(resolved);
			    !tlx.directives || !tlx.directives.HTMLElement || !tlx.directives.HTMLElement.handle || tlx.directives.HTMLElement.handle(name,resolved,node);
				if(resolved && type==="object") node[name] = resolved;
	    		else if(type==="function") node.addEventListener(name.substring(2).toLowerCase(),resolved);
		    	else node.setAttribute(name, resolved);
				if(node.type==="checkbox" && name==="value" && resolved) node.checked = true;
				else if(node.type==="select-multiple" && name==="value" && Array.isArray(resolved)) {
					for(let option of [].slice.call(node.options)) !resolved.includes(fromJSON(option.value)) || (option.selected = true);
				}
			} else {
				const resolved = resolve(template,node);
				node.textContent = (!resolved || typeof(resolved)!=="object" ? resolved : JSON.stringify(resolved));
			}
		}
	    if(target) target.appendChild(node);
	    return node;
	};
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