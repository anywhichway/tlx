# tlx

Like JSX but uses JavaScript Template Literals and adds reactivity - No Preprocessor Required

15K Raw, 5K minified, 2K Gzipped - No dependencies

Works with `React` and `Preact`.

Substantial portions drawn from from [Hyperx](https://github.com/choojs/hyperx). Adds a `render` function like `React`, full or partial page HTML templating ("inverted JSX") and reactivity. Automatic reactivity, HTML directives and first class components coming soon.

# Installation

`npm install tlx`

# Usage

If you want to templatize regular HTML outside of a script, bind`tlx` to an object and call it with an HTMLElement as an argument, e.g. `tlx.bind({<some data>})(document.getElementbyId(<some id>));` If you do this in `onload` with the argument `document.body`, your entire page will be a template!. Think of it as inverted JSX, i.e. JSX with focus on HTML rather than JavaScript. This is useful for SEO dependent sites or where layout needs to be put directly in the hands of a visual designer.

Or, if you are a `preact` or `react` fan, just prefix your template literals with `tlx`.

Examples are best!

Use to templatize regular HTML:

```html
<body onload="tlx.bind({name:'Joe',address:{city:'Seattle',state:'WA'}})(document.body)">
<div>
	<div>
	Name: ${name}
		<div>
		City: ${address.city}, State: ${address.state}
		</div>
	</div>
</div>
</body>
```

Make it reactive (see examples/tlx.html):


```html
<body onload="tlx.bind(tlx.activate({name:'Joe',address:{city:'Seattle',state:'WA'}}))(document.body)">
	<div>
		<div>
		Name: <input value="${name}" oninput="${this.linkState('name')}">
		City: <input value="${address.city}" oninput="${this.linkState('address.city')}">
		State: <input value="${address.state}" oninput="${this.linkState('address.state')}">
		</div>
		<div>${name}, ${address.city} ${address.state}</div>
	</div>
</body>
```

Use with tlx.render or preact.render (see examples/tlx-and-preact.html and examples/react.html):

```js
<script src="../browser/index.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/preact/8.2.5/preact.min.js"></script>
<div id="content"></div>
<script>
const el = document.getElementById("content");

tlx.render(tlx`<p>tlx.render 
	<span>Hello, world!</span>
	<button onClick="() => { alert('hi!'); }">Click Me</button>
	</p>`,el);

preact.render(tlx`<p>preact.render
	<span>Hello, world!</span> 
	<button onclick="() => { alert('hi!'); }">Click Me</button>
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

2017-10-26 v0.0.5-beta HTML reactivity added.

2017-10-25 v0.0.4-beta Documentation updates.

2017-10-25 v0.0.3-beta Entire HTML pages or page fragments can now be treated as templates outside of scripts.

2017-10-24 v0.0.2-beta Reworked internals to use some code from [Hyperx](https://github.com/choojs/hyperx). Started adding full page re-activity.

2017-10-23 v0.0.1-beta Initial public release



# License
 
 MIT