# tlx

Like JSX but uses JavaScript Template Literals - No Preprocessor Required

4K Raw, 2.3K minified, 1K Gzipped - No dependencies

Works with React and Preact.

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
	<button onClick="${ () => alert('hi!') }">Click Me</button>
	</p>`,el);

preact.render(tlx`<p>preact.render
	<span>Hello, world!</span> 
	<button onclick="${ () => alert('hi!') }">Click Me</button>
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

tlx.render(tlx`<p>
	tlx.render list
	<ul>
		${[1,2,3].map(item => (`<li>${item}</li>`))}
	</ul>
	</p>`,el);

preact.render(tlx`<p>
	preact.render list
	<ul>
		${[1,2,3].map(item => (`<li>${item}</li>`))}
	</ul>
	</p>`,el);
</script>
```

# Release History (Reverse Chronological Order)

2017-10-23 v0.0.1-beta Initial public release

 # License
 
 MIT
