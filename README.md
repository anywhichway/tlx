# TLX

Like JSX but uses JavaScript Template Literals plus adds reactivity and attribute directives - No Preprocessor Required.

Use just the parts you want (sizes are minified and GZipped):

`tlx-core.js` - 2.6K Replaces JSX. Continue to use `React` or `preact`.

`tlx-render.js` - 1.5K Replaces non-component aspects of `React` and `preact`. Enables "inverted JSX", i.e. puts the focus on HTML while supporting the power of in-line template literals, e.g. `<div>${item.message}</div>`.

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
<body onload="tlx.bind({name:'Joe',address:{city:'Seattle',state:'WA'}})()">
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
<body onload="tlx.bind({name:'Joe',address:{city:'Seattle',state:'WA'}})()">
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

# Reactivity

Reactivity is supported by activating objects that are used via `state` directives (see below) or bound to a `tlx` parser invocation, e.g. `tlx.bind({message: "Hello World"})&#96;${message}&#96;`. Activated objects are proxies that log the currently processing HTML node when their properties are accessed via template literal interpolations. When property values are set, the other HTML nodes that reference the property are automatically re-rendered.

Objects are automatically activated when first referenced if `tlx.options.reactive` is truthy. Loading the file `tlx-reactive.js` automatically sets the value to `true`. A future version of the software will support the values `change` and `input`. Meanwhile, you must handcode an event handler on input fields if you desire two-way data binding, e.g.:

```html
<body onload="tlx.bind({name:'Joe'})()">
<div>
	Name: <input value="${name}" oninput="${this.linkState('name')}">
</div>
</body>

```

If you need to be able to reference the activated object outside of TLX code so you UI is responsive to external changes, then you can activate it using `const <activated> = tlx.activate(<object>)`, prior to handing it to `tlx.bind` or resolving it in a template literal.

The reactivity module also normalizes the behavior of `checkbox` and `multiple-select` so that state object properties are set to a booleans or Arrays respectively and UI elements get checked or selected appropriately.

# Directives

The following directives are built-in:

`state`, which is a special directive in that it is not prefixed with a letter and a hyphen but supports interpolation, e.g. `state="[1,2,3]"` or `state="${[1,2,3]}"` are both valid. Interpolations are frequently useful in order to simplify the expression of JSON, e.g. `state="{name: 'Bill}"` is not valid JSON, where as `state="${{name: 'Bill'}}"` is valid JavaScript and will return the correct object, i.e. `{"name":"Bill"}`. Setting state also take priority over other attributes so that the state is available to the other attribute directives.

`t-for="<vname> of <array>"`, which operates just like its JavaScript counterpart.

`t-for="<vname> in <object>"`, which operates just like its JavaScript counterpart except that a locally scoped variable `object` is available in the nested HTML string literal expressions so that `${object[key]}` can be used to retrieve a value.

`t-foreach="<object>"`, which is smart and operates on either an array or regular object. The variables `key`, `value` and `object` are available to nested HTML string literal expressions.

`t-if="<boolean>"`, which will prevent rendering of child elements if the boolean is falsy.

New directives can be added by augmenting the object `tlx.directives.HTMLElement` with a key representing the directive name, e.g. `x-mydirective`, and a function as the value with the signature, `(node,value) ...`. The function is free to change the `htmlElement` as it sees fit, e.g.:

```js
tlx.directives.HTMLElement["t-if"] = (node,value) => {
		if(!value) {
			while(node.lastChild) node.removeChild(node.lastChild);
		}
		return value;
	};
```

Although it may appear as if directives could be specialized by element class, this is not currently possible. All custom directives should be associated with `HTMLElement`.

Advanced users can also set directives on the VDom for efficiency, e.g.:

```js
tlx.directives.VDom["t-if"] = (node,value) => {
		if(!value) {
			node.children = null;
		}
		return value;
	}
}

```

Note, full interpolation may not have occured when processing the VDom, so HTMLElement directives should also be implemented.

Iterating directives are slightly different than Vue. The iteration expression exists in an attribute on the containing element rather than the child element being duplicated, for example:

TLX:

```html
<ul t-for="item of ${[{message:'Foo'},{message:'Bar'}]}"><li>${item.message}</li></ul>
```

Vue:

```html
<ul><li f-for="item of [{message:'Foo'},{message:'Bar'}]">{{item.message}}</li></ul>

```

# Acknowledgements

Substantial portions of `tlx-core.js` are drawn from from [Hyperx](https://github.com/choojs/hyperx).

The idea of `linkState` to simplify reactive binding is drawn from `preact`.

Obviously inspiration has been drawn from `React`, `preact`, `Vue`, and `Angular`. We also got inspiration from `Ractive`, `moon`, and `hyperapp`. Portions of TLX were also drawn from another anywhichway codebase `fete`, which reached its architectural limits.

# Release History (Reverse Chronological Order)

2017-10-27 v0.0.8-beta Documentation updates.

2017-10-27 v0.0.7-beta Fixed build issue. tlx.js was getting overwritten.

2017-10-27 v0.0.6-beta Added support for directives `t-if`, `t-foreach`, `t-for`. See the example `examples/tlx.html` pending documentation updates. Split into multiple modules so only what is needed has to be loaded: tlx-core.js, tlx-render.js, tlx-reactive.js, tlx-directives.js, tlx.js (all the modules). Minified versions of all files are available.

2017-10-26 v0.0.5-beta HTML reactivity added.

2017-10-25 v0.0.4-beta Documentation updates.

2017-10-25 v0.0.3-beta Entire HTML pages or page fragments can now be treated as templates outside of scripts.

2017-10-24 v0.0.2-beta Reworked internals to use some code from [Hyperx](https://github.com/choojs/hyperx). Started adding full page re-activity.

2017-10-23 v0.0.1-beta Initial public release



# License
 
 MIT