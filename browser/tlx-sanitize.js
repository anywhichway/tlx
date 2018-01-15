(function(tlx) {
	var global = (typeof(window)!=="undefined" ? window : this);
	tlx.escape = function(data) {
		const type = typeof(data);
		if(type==="function") return;
		if(["number","boolean"].includes(type) || !data) {
			return data;
		}
		if(Array.isArray(data)) {
			for(let i=0;i<data.length;i++) {
				data[i] = this.escape(data[i]);
			}
			return data;
		}
		if(data && type==="object") {
			for(let key in data) {
				data[key] = this.escape(data[key]);
			}
			return data;
		}
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(data));
    data = div.innerHTML;
    try {
    	JSON.parse(`${data}`)==data;
    	// string is boolean, number, undefined, or null, now convert it
    	try {
    		return JSON.parse(data); // a string with no spaces, a boolean, or a number
    	} catch(error) {
    		return data; // a string with spaces
    	}
    } catch(error) {
    	try {
    		// converts to functions or objects and escapes them
    		return this.escape(Function("return " + data.replace(/&gt;/g,">"))());
    	} catch(error) {
    		return data;
    	}
    }
  }
	const _prompt = global.prompt.bind(global);
	if(_prompt) {
		global.prompt = function(title) {
			const input = _prompt(title),
				result = (tlx.options.sanitize ? tlx.escape(input) : input);
			if(typeof(result)=="undefined") {
				global.alert("Invalid input: " + input);
			} else {
				return result;
			} 
		}
	}
	
	tlx.options || (tlx.options={});
	tlx.options.sanitize = true;
})(tlx);