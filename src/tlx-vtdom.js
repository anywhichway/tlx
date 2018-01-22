(function() {
	"use strict";
	/* Copyright 2017,2018 AnyWhichWay, Simon Y. Blackwell, MIT License
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
	*/
	const global = this,
		tlx = this.tlx || (this.tlx = {});
	tlx.options || (tlx.options={});
	tlx.render = (vnode,el) => {
		if(vnode instanceof VNode) {
			vnode.render();
			el.appendChild(vnode.node);
		}
	}
	tlx.escape || (tlx.escape = value => value);
	tlx.resolve = (vnode,tmplt,attr={},state=(vnode ? vnode.state : {}),extra={}) => {
		if(typeof(tmplt)==="string") {
			const first = tmplt.indexOf("${");
			if(first>=0) {
				let result;
				tlx.CNODE = vnode;
				let parent = (vnode ? vnode.node.parentNode : null);
				while(!state && parent) {
					state = (parent.vnode ? parent.vnode.state : null);
					parent = parent.parentNode;
				}
				state || (state = {});
				if(tmplt.indexOf("${",first+1)>=0 || first>0) {
					result = Function("__a__","vnode","__s__","__e__",
						"while(__s__) { try { with(__a__) { with(vnode) { with(__s__) { with(__e__) { return `" + tmplt.trim() + "`}}}}} catch(error) { __s__ = __s__.__parentState__; }}")(attr||{},vnode,state||{},extra); }
				else { 
					result =  Function("__a__","vnode","__s__","__e__",
						"while(__s__) { try { with(__a__) { with(vnode) { with(__s__) { with(__e__) { return (function() { return arguments[arguments.length-1]; })`" + tmplt.trim() + "` }}}}} catch(error) { __s__ = __s__.__parentState__; }}")(attr||{},vnode,state||{},extra);
				}
				tlx.CNODE = null;
				return result;
			}
		}
		return tmplt;
	}
	
	class VNode {
		constructor(nodeName,attr,children,node) {
			Object.defineProperty(node,"vnode",{enumerable:false,configurable:true,writable:true,value:this});
			this.node = node;
			this.nodeName = nodeName,
			this.attributes = attr = Object.assign({},attr);
			this.children = children.slice();
			this.key = attr.id || (attr.id = `id${(Math.random()+"").substring(2)}`);
			global[attr.id] = this;
		}
		h() {
			const vdom = {nodeName:this.nodeName,attributes:{},children:[],key:this.key};
			for(let key in this.attributes) {
				let value = tlx.resolve(this,this.attributes[key],null,this.currentState),
					i;
				if(typeof(value)==="string" && (i=value.lastIndexOf(")"))===value.trim().length-1 && i>value.indexOf(")")) {
					const body = value.substring(0,value.lastIndexOf("("));
					value = new Function("return " + body)();
				}
				if(key.indexOf("on")!==0) value = tlx.escape(value);
				if(typeof(value)!=="undefined") vdom.attributes[key] = value;
			}
			for(let child of this.children) vdom.children.push(child.h ? child.h() : tlx.resolve(this,child,this.attributes,this.currentState));
			return vdom;
		}
		html(tmplt,attr) {
			const id = this.attributes.id,
				html = tlx.resolve(this,tmplt,this.attributes,this.state,attr),
				el = document.createElement("div"),
				vnode = el.vNode(html);
			this.attributes = Object.assign({},this.attributes,vnode.attributes);
			!id || (this.attributes.id = id);
			this.children = vnode.children;
			VNode.prototype.render.call(this);
			return this;
		}
		toString() {
			return this.resolve();
		}
		resolve(attr,state,extra={}) {
			attr || (attr = this.attributes);
			return `<${this.nodeName}${Object.keys(attr).reduce((accum,key) => accum += (` ${key}="${attr[key]}"`),"")}>${this.children.reduce((accum,child) => accum += " " + (child.resolve ? child.resolve(null,state||this.state,extra) : tlx.resolve(this,child,null,state||this.state,extra)),"")}</${this.nodeName}>`;
		}
		render(attr,state) {
			const node = this.node;
			attr = Object.assign({},this.attributes,attr);
			if(this.state) Object.assign(this.state,state)
			this.currentState = this.state || state;
			let vchildren;
			for(let key in attr) {
				let value = tlx.resolve(this,attr[key],null,state);
				if(tlx.directives && tlx.directives[key]) vchildren = tlx.directives[key](value,this.children[0],this);
				value = (value && typeof(value)==="object" ? "${" + JSON.stringify(value) + "}" : value);
				node.attributes[key]===value || node.setAttribute(key,value);
			}
			// adjust state in case state added
			this.currentState = this.state || state;
			const nchildren = [].slice.call(node.childNodes);
			vchildren || (vchildren = this.children);
			for(let i=0;i<nchildren.length;i++) {
				const nchild = nchildren[i];
				if(i>=vchildren.length) node.removeChild(nchild);
				else {
					const vchild = vchildren[i];
					if(nchild instanceof Text) {
						const text = tlx.resolve(this,vchild,this.attributes,this.currentState);
						nchild.textContent===text || (nchild.textContent=text);
					} else if(vchild.node!==nchild) {
						vchild.render();
						node.replaceChild(vchild.node,nchild);
					} else vchild.render();
				}
			}
			for(let i=nchildren.length;i<vchildren.length;i++) {
				const vchild = vchildren[i];
				if(typeof(vchild)==="string") {
					const text = tlx.resolve(this,vchild,this.attributes,this.currentState);
					node.appendChild(new Text(text))
				} else node.appendChild(vchildren[i].render().node);
			}
			return this;
		}
	}
	
	HTMLElement.prototype.render = function(attr,html) {
		(!html && this.vnode) || (this.vnode = this.vNode(html,attr));
		return (html ? this.vnode.render() : this.vnode.render(attr));
	}

	Text.prototype.vNode = HTMLElement.prototype.vNode = function(html,attr) {
		if([HTMLScriptElement,HTMLTemplateElement].some(ctor => this instanceof ctor)) return;
		if(html!=null) {
			this.innerHTML = html;
			delete this.vnode;
		}
		let vnode = this.vnode;
		if(!vnode) {
			if(this.tagName) {
				const ownattr = [].slice.call(this.attributes).reduce((accum,attribute) => { accum[attribute.name] = attribute.value; return accum; },{})
				vnode = new VNode(this.tagName,Object.assign({},ownattr,attr),[],this);
			} else if(this instanceof Text) {
				const text = this.data.trim();
				if(text.length>0) vnode = text;
			}
		}
		if(!vnode) {
			!this.parentElement || this.parentElement.removeChild(this);
		} else if(this.tagName) {
			const children = vnode.children = [];
			for(let child of [].slice.call(this.childNodes)) {
				if(child.vNode) {
					const v = child.vNode();
					!v || children.push(v);
				}
			}
		}
		return vnode;
	}

	if(typeof(window)!=="undefined") {
		window.addEventListener("load",() => {
			if(tlx.compile) {
				const templates = document.getElementsByTagName("template")||[];
				for(let template of templates) tlx.compile(template);
			}
			!tlx.mount || tlx.mount();
			document.body.render();
		});
	}
		
	if(typeof(module)!=="undefined") {
		module.exports = tlx;
	}
	if(typeof(window)!=="undefined") {
		window.tlx = tlx;
	}
}).call(typeof(window)!=="undefined" ? window : this);