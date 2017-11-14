[![Codacy Badge](https://api.codacy.com/project/badge/Grade/35bd9c60d5714ff5844f7cac0fc8498c)](https://www.codacy.com/app/syblackwell/tlx?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=anywhichway/tlx&amp;utm_campaign=Badge_Grade)

# TLX 

Imagine a light weight combination of JSX, Vue, and React but using JavaScript template literals - No Preprocessor Required.

Use just the parts you want (sizes are minified and GZipped):

`tlx-core.js` - 3.4K Replaces JSX. Continue to use `React` or `preact`.

`tlx-render.js` - 1.5K Replaces non-component aspects of `React` and `preact`. Enables "inverted JSX", i.e. puts the focus on HTML while supporting the power of in-line template literals, e.g. `<div>${item.message}</div>`. Use for full SEO enablement and [multi-page apps](#multipage-apps).

`tlx-reactive.js` - 0.8K Adds uni-directional and bi-directional state [reactivity](#reactivity) to templates in a manner similar to Vue and many other libraries.

`tlx-directives.js` - 0.5K If you like Vue or Angular, you can also use the built-in [directives](#directives) `t-if`, `t-foreach`, `t-for`, and `t-on`. Or, [add your own directives](#directives). However, many directives are un-necessary due to the power of in-line template literals embedded in your HTML.

`tlx-component.js` - 0.4K Custom HTML tags and first class [components](#components).

Watch for `tlx-router.js` coming soon.

Or, include everything with `tlx.js` at just 5.5K minified + Gzipped, 18.6K minified, 28K raw.

***Don't forget***, give us a star if you like what you see!



# Contents

[Installation](#installation)

[API](#api)

[Reactivity](#reactivity)

[Directives](#directives)

[Components](#components)

[Design Comments](#design-comments)

[Acknowledgements](#acknowledgements)

[Release History](#release-history)


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

Reactivity is supported by activating objects that are used via `state` directives (see below) or bound to a `tlx` parser invocation, e.g. `tlx.bind({message: "Hello World"})'${message}'`. Activated objects are proxies that log the currently processing HTML node when their properties are accessed via template literal interpolations. When property values are set, the other HTML nodes that reference the property are automatically re-rendered.

Objects are automatically activated when first referenced if `tlx.options.reactive` is truthy. Loading the file `tlx-reactive.js` automatically sets the value to `true`. A future version of the software will support the values `change` and `input`. Meanwhile, you must handcode an event handler on input fields if you desire two-way data binding, e.g.:

```html
<body onload="tlx.bind({name:'Joe'})()">
<div>
	Name: <input value="${name}" oninput="${this.linkState('name')}">
</div>
</body>

```

## Multipage Apps

The above technique can be used for multi-page apps. Just load the data you need into a header script or via an asynchronous call. The rest of the page can be plain HTML with placeholders for the data, e.g.

```html
<script>
var data = <do something to get establish data, e.g. async/await a call or write to this section on the server>;
</script>
<body onload="tlx.bind(data)()">

... a bunch of HTML containing template literal type tags ...

</body>
```

If you need to be able to reference the activated object outside of TLX code so your UI is responsive to external changes, then you can activate it using `const <activated> = tlx.activate(<object>)`, prior to handing it to `tlx.bind` or resolving it in a template literal.


# Directives

The following directives are built-in:

`state`, which is a special directive in that it is not prefixed with a letter and a hyphen but supports interpolation, e.g. `state="[1,2,3]"` or `state="${[1,2,3]}"` are both valid. Interpolations are frequently useful in order to simplify the expression of JSON, e.g. `state="{name: 'Bill}"` is not valid JSON, where as `state="${{name: 'Bill'}}"` is valid JavaScript and will return the correct object, i.e. `{"name":"Bill"}`. Setting state also take priority over other attributes so that the state is available to the other attribute directives.

`t-for="<vname> of <array>"`, operates like its JavaScript counterpart, in addition the `<vname>`, the scoped variables `value`, `index`, and `array` (similar to `Array.prototype.forEach`) are available in nested HTML string literal expressions.

`t-for="<vname> in <object>"`, operates like its JavaScript counterpart except that In addition the `<vname>`, locally scoped variables `object` and `key` are available in the nested HTML string literal expressions so that `${object[key]}` can be used to retrieve a value in addition to `${object[<vname>]}`.

`t-foreach="<object>"`, is smart and operates on either an array or regular object. The variables `key`, `value` and `object` are available to nested HTML string literal expressions.

`t-if="<boolean>"`, prevents rendering of child elements if the boolean is falsy.

`t-import=<url>`, (coming soon) which will load a remote resource. Use with `t-if` to support on-demand/progressive loading.

`t-on=<object>`, adds event handlers. The object takes the form `{<eventName>:<handler>[,<eventName>:<handler>...}}`. The handler signature is the same as a normal JavaScript event handler and just takes an `Event` as an argument.

## Iterating Directives

Iterating directives are slightly different than Vue. The iteration expression exists in an attribute on the containing element rather than the child element being duplicated, for example:

TLX:

```html
<ul t-for="item of ${[{message:'Foo'},{message:'Bar'}]}"><li>${item.message}</li></ul>
```

Vue:

```html
<ul><li f-for="item of [{message:'Foo'},{message:'Bar'}]">{{item.message}}</li></ul>

```

## Custom Directives

New directives can be added by augmenting the objects `tlx.directives.VNode` or `tlx.directives.HTMLElement` with a key representing the directive name, e.g. `x-mydirective`, and a function as the value with the signature, `(value,vnode,htmlElement) ...`. The function is free to change the `vnode` and `htmlElement` as it sees fit, e.g.:

`VNode` directives are processed after all attributes on the `vnode` have been interpolated and resolved but prior to adding sub-node to the real DOM node `htmlElement`. As a result, they can have a direct impact on the rendering of the `htmlElement`.

`HTMLElement` directives are processed after the `htmlElement` has been fully populated and added to the DOM. As a result they are lessefficient. Also, any changes to the `vdom` will effectively be ignored until the next time the `htmlElement` is rendered.


Here the VDom is modified for efficiency, the DOM will never get populaed with child notes if `value` is falsy:

```js
tlx.directives.VNode["t-if"] = (value,vnode) => {
		if(!value) {
			vnode.children = null;
		}
		return value;
	}
}
```

Here the DOM is manipulated after everything is resolved, it is far less efficient as a result.

```js
tlx.directives.HTMLElement["t-if"] = (value,htmlElement) => {
		if(!value) {
			while(htmlElement.lastChild) htmlElement.removeChild(htmlElement.lastChild);
		}
		return value;
	};
```


Although it may appear as if directives could be specialized by element class, this is not currently possible. All custom directives should be associated with `HTMLElement` or `VDom`.

# Components

Components work in a similar manner to `React` although `props` and lifecycle events are not currently supported.

Components only need to implement a single method, `render(attributes)`, which must return a `VNode` tree. The `attributes` argument is optional. It is used to pass to the component a map of the attributes associated with the custom tag actually in the HTML being processed. These will not be interpolated/resolved and in general do not need to be by `render`, unless it needs the values for its own processing. Once `render` has returned a `VNode`, the calling code will actually resolve the values.

Components must also be registered using

Below is a basic example:

```html
<script>
class Message extends tlx.Component {
	static get attributes() { // optionally define the default attributes for a component
		return {
			style: "font-weight:bold"
		}
	}
	render(attributes) { // required, should return VNode tree ... which tlx template processor does
		return tlx`<div>\${message}</div>`;
	}
}
document.registerTlxComponent("x-message",Message);
</script>
<body onload="tlx.bind({})()">
<x-message state="${{message:'Hello'}}"></x-message>
</body>
```

For a single component, `tlx-editor`, that combines several html editor types into one, see the `components/tlx-editor.js`.

# Design Comments

The `tlx` library has been designed so that converting to code to standards compliant Web Components once all browsers support their use should be straight forward.

# Acknowledgements

Substantial portions of `tlx-core.js` are drawn from from [Hyperx](https://github.com/choojs/hyperx).

The idea of `linkState` to simplify reactive binding is drawn from `preact`.

Obviously, inspiration has been drawn from `React`, `preact`, `Vue`, and `Angular`. We also got inspiration from `Ractive`, `moon`, and `hyperapp`. 

Portions of TLX were drawn from another AnyWhichWay codebase `fete`, which reached its architectural limits.

# Release History

2017-11-09 v0.1.5 - Added `document.tlxRender(data,embeddedLiterals,rerender)` as shorthand to render an the entire `document.body`.

2017-11-08 v0.1.4 - Adjusted VText to take booleans and numbers.

2017-11-07 v0.1.3 - Fixed input focus issues for components.

2017-11-07 v0.1.2 - Fixed input focus issues for components.

2017-11-06 v0.1.1 - Fixed packaging issues for tlx-components. Moved tlx-editor component to its own package.

2017-11-05 v0.1.0 - Production release. Minor documentation and code style changes.

2017-11-04 v0.0.11-beta Added unit tests. Release candidate. Codacy improvements.

2017-11-03 v0.0.10-beta Improved parsing of `t-for` directive. Optimized rendering and directives. The ordering of arguments for custom directives has been changed. `document.registerElement` was replaced with `document.registerTlxComponent` to avoid conflict with `registerElement` in Chrome. Added `dbmon` benchmark test.

2017-10-30 v0.0.9-beta Added component support. Enhanced documentation. Centralized some repeated code patterns.

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