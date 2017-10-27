# tlx

Like JSX but uses JavaScript Template Literals plus adds reactivity and attribute directives - No Preprocessor Required.

Use just the parts you want (sizes are minified and GZipped):

`tlx-core.js` - 2.6K Replaces JSX. Continue to use `React` or `Preact`.

`tlx-render.js` - 1.5K Replaces non-component aspects of `React` and `Preact`. Enables "inverted JSX", i.e. puts the focus on HTML while supporting the power of in-line template literals, e.g. `<div>${item.message}</div>`.

`tlx-reactive.js` - 0.75K Adds reactivity to templates like Vue and many other libraries.

`tlx-directives.js` - 0.7K If you like Vue or Angular, you can also use the built-in directives `t-if`, `t-foreach`, and `t-for`. Or, add your own directives. However, many directives are un-necessary due to the power of in-line template literals embedded in your HTML.

Watch for `tlx-components.js` and `tlx-router.js` coming soon.

Or, include everything with `tlx.js` at just 5K.


# Installation

`npm install tlx`

# Usage

Load the files you need from the `browser` directory.

# API

If you want to templatize regular HTML outside of a script, bind`tlx` to an object and call it with an HTMLElement as an argument, e.g. `tlx.bind({<some data>})(document.getElementbyId(<some id>));` If you do this in `onload` with the argument `document.body`, your entire page will be a template! Think of it as inverted JSX, i.e. JSX with focus on HTML rather than JavaScript. This is useful for SEO dependent sites or where layout needs to be put directly in the hands of a visual designer.

Or, if you are a `preact` or `React` fan, just prefix your template literals with `tlx`.

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
<body onload="tlx.bind({name:'Joe',address:{city:'Seattle',state:'WA'}})(document.body)">
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
<script src="../browser/tlx.js"></script>
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

# Directives

Iterating directivies are slightly different than Vue. The iteration expression exists in an attribute on the containing element rather than the child element being duplicated.

# Acknowledgements

Substantial portions of `tlx-core.js` are drawn from from [Hyperx](https://github.com/choojs/hyperx).

The idea of `linkState` to simplify reactive binding is drawn from `preact`.

# Release History (Reverse Chronological Order)

2017-10-27 v0.0.6-beta Fixed build issue. tlx.js was getting overwritten.

2017-10-27 v0.0.6-beta Added support for directives `t-if`, `t-foreach`, `t-for`. See the example `examples/tlx.html` pending documentation updates. Split into multiple modules so only what is needed has to be loaded: tlx-core.js, tlx-render.js, tlx-reactive.js, tlx-directives.js, tlx.js (all the modules). Minified versions of all files are available.

2017-10-26 v0.0.5-beta HTML reactivity added.

2017-10-25 v0.0.4-beta Documentation updates.

2017-10-25 v0.0.3-beta Entire HTML pages or page fragments can now be treated as templates outside of scripts.

2017-10-24 v0.0.2-beta Reworked internals to use some code from [Hyperx](https://github.com/choojs/hyperx). Started adding full page re-activity.

2017-10-23 v0.0.1-beta Initial public release



# License
 
 MIT