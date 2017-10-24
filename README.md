# tlx

Like JSX but uses JavaScript Template Literals - No Preprocessor Required

15K Raw, 5K minified, 2K Gzipped - No dependencies

Works with React and Preact.

Substantial portions drawn from from [Hyperx](https://github.com/choojs/hyperx). Adds its own render function. Automatic page templates with re-activity and first class components coming soon.

# Installation

`npm install tlx`

# Usage

Just prefix your template literals with `tlx`.

Examples are best!

```js
<script src="../browser/index.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/preact/8.2.5/preact.min.js"></script>
<div id="content"></div>
<script>
const el = document.getElementById("content");

tlx.render(tlx`<p>tlx.render 
	<span>Hello, world!</span>
	<button onClick="(function() { alert('hi!'); })()">Click Me</button>
	</p>`,el);

preact.render(tlx`<p>preact.render
	<span>Hello, world!</span> 
	<button onclick="(function() { alert('hi!'); })()">Click Me</button>
	</p>`,el);

const model = {	onclick() { alert('hi!'); } };

tlx.render(tlx.bind(model)`<p>bound tlx + tlx.render
	<span>Hello, world!</span>
	<button onclick="${model.onclick}">Click Me</button>
	</p>`,el);

preact.render(tlx.bind(model)`<p>bound tlx + preact.render
	<span>Hello, world!</span>
	<button onclick="${model.onclick}">Click Me</button>
	</p>`,el);

tlx.render(tlx`
	tlx.render list
	<ul>
		${[1,2,3].map(item => (tlx`<li>${item}</li>`))}
	</ul>
	`,el);

preact.render(tlx`
	preact.render list
	<ul>
		${[1,2,3].map(item => (tlx`<li>${item}</li>`))}
	</ul>
	`,el);
</script>
```

# Release History (Reverse Chronological Order)

2017-10-23 v0.0.1-beta Initial public release

2017-10-24 v0.0.2-beta Reworked internals to use some code from [Hyperx](https://github.com/choojs/hyperx). Started adding full page re-activity.

# License
 
 MIT