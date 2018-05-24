(function() {
	const tlx = require("./src/tlx-core.js");
	require("./src/tlx-vtdom.js")(tlx);
	require("./src/tlx-reactive.js")(tlx);
	require("./src/tlx-directives.js")(tlx);
	//require("./src/tlx-sanitize.js");
})();