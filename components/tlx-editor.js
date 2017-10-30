(function() {
	class tlxEditor extends tlx.Component {
		static get attributes() {
			return {
				label: "",
				type: "text",
				value: ""
			}
		}
		render() { // should be render and return tlx` result, for super class perhaps use innerHTL and cache, then components would look just like HTML!!!
			const attributes = tlx.getAttributes(this);
			const type = attributes.type;
			if(type==="select-one") return tlx`<span><label>${attributes.label}</label> <select value="${attributes.value}">${attributes.options.map(value => (tlx`<option>${value}</option>`))}</select></span>`;
			if(type==="select-multiple") return tlx`<span><label>${attributes.label}</label> <select style="vertical-align:top" value="${attributes.value}" multiple>${attributes.options.map(value => (tlx`<option>${value}</option>`))}</select></span>`;
			return tlx`<span><label>${attributes.label}</label> <input type="${attributes.type}" value="${attributes.value}"></span>`;
		}
	}
	document.registerElement("tlx-editor",tlxEditor);
	
	if(typeof(module)!=="undefined") module.exports = tlxEditor;
	if(typeof(window)!=="undefined") window.tlxEditor = tlxEditor;
})();