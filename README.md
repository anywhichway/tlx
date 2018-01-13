

# TLX v1.0.0

Imagine a light weight combination of JSX, Vue, React, Riot, and HyperApp but using JavaScript template literals.

TLX is a tiny multi-paradigm front-end toolkit that lets you use core aspects of your favorite framework programming style. With TLX you can use the style appropriate to the job without re-tooling. You can use from 1.6 to 5K depending on what capability you need.

Use just the parts you want (sizes are minified and GZipped):

`tlx-core.min.js` - 1.6K Supports objects as attribute values. Provides input/attribute escape protection. All other modules depend on this.

`tlx-html.min.js` - 0.5K Enables "inverted JSX", i.e. puts the focus on HTML while supporting the power of in-line template literals, e.g. `<div>${item.message}</div>`. Continue to use React or Preact.

`tlx-directives.min.js` - 0.6K If you like Vue or Angular, you can also use the built-in [directives](##directives) `t-if`, `t-foreach`, `t-for`, and `t-on`. Or, [add your own directives](#directives). Depends on tlx-html.

`tlx-component.min.js` - 0.7K Enables components.

`tlx-reactive.min.js` - 0.9K Adds uni-directional and bi-directional state [reactivity](##reactivity) to a manner similar to Vue and many other libraries.

`tlx-template.min.js` -  0.7k Adds the ability to define components using HTML template tags similar to Riot. Includes support for scoped styles. Depends on tlx-components.


`tlx-polyfill.min.js` - 1.0K A polyfill for [Custom Elements](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Custom_Elements). The standard lifecyle events are respected and invoked. Depends on tlx-components.

Watch for `tlx-router.js` coming soon.

`tlx.min.js` - 4.8K minifed and Gzipped, includes everything ... 16.7K minified, 27.5K raw.


***Don't forget***, give us a star if you like what you see!

# Contents

[Installation](#installation)

[API](#api)

[Core](##core)

[HTML](##html)

[Directives](##directives)

[Iterating Directives](###iterating-directives)

[Custom Directives](###custom-directives)

[Component](##component)

[Design Notes](#design-notes)

[Acknowledgements](#acknowledgements)

[Release History](#release-history)


# Installation

`npm install tlx`

# Usage

Load the files you need from the `browser` directory.

Call `tlx.enable()` before you try to use anything else.

# API

## Core

The `core` module API exposes three functions useful to a developer:

`tlx.enable(options)` -

`tlx.escape(data)` - Used internally to provide a measure of HTML injection protection, but exposed to developers as a convenience. Escape takes a string or object and replaces angle brackets with entities while also removing functions from objects. This reduces the possibility that a user will be able to enter executable code via a URL that fills in a form which is then presented to another user. See [Finding HTML Injection Vulns](https://blog.qualys.com/technology/2013/05/30/finding-html-injection-vulns-part-i) or search Google for more information about the risks of HTML injection.

`tlx.bind(object,htmlElement)` - Used internally and also exposed to developers to attach an object to an HTMLElement to provide data storage that is inherited down the DOM tree. This function provides the core reactivity capability, but it is not turned on unless the `reactive` module is loaded or `tlx.enable` is called with `{reactive:true}`. See [HTML Module](##html) for more detail on the use of `tlx.bind`.

The remainder of the core wraps some existing DOM functions such as `setAttribute` and `getAttribute` in order to support transparent storage of data in addition to primitives and reduces the chance of HTML injection by using `tlx.escape`. It also adds some default behavior to DOM prototypes, i.e. `render` is added to `HTMLElement`, `Node` and `Text`. See [Design Notes](#design-notes) for more detail.

## HTML

The `html` module enhances the DOM to support resolving embeded string template literals.

`HTMLElement.prototype.resolve = function(template,values={})` - This function is used extensively in `tlx` internals. However, it generally only useful to developers wishing to implement [custom directives](###custom-directives). The function takes a string containing string literal syntax and walks up the DOM tree to resolve the variables in the string. Extra values can be provided as key value pairs.


Below is an example of using the `html` module:


If you want to templatize regular HTML outside of a script, bind an object to an HTMLElement with `tlx.bind`, e.g. `tlx.bind({<some data>},document.getElementbyId(<some id>));` 


```html
<!DOCTYPE html>
<html>
<head>
<script src="../src/tlx-core.js"></script>
<script src="../src/tlx-html.js"></script>
<script>tlx.enable()</script>
</head>
<body onload="tlx.bind({name:'Joe',address:{city:'Seattle',state:'WA'}},document.getElementByTagName('body')">
<div>
	<div>
	Name: ${name}
		<div>
		City: ${address.city}, State: ${address.state}
		</div>
	</div>
</div>
</body>
</html>
```

Alternatively, you can use a special attribute called `state`. Note, the value for `state` is itself a template literal.

```html
<!DOCTYPE html>
<html>
<head>
<script src="../src/tlx-core.js"></script>
<script src="../src/tlx-html.js"></script>
<script>tlx.enable()</script>
</head>
<body state="${{name:'Joe',address:{city:'Seattle',state:'WA'}}}">
<div>
	<div>
	Name: ${name}
		<div>
		City: ${address.city}, State: ${address.state}
		</div>
	</div>
</div>
</body>
</html>
```

The value of the `state` attribute or binding is inherited down the DOM tree. Note how it is possible to reference the `state` specified in the `body` element three `divs` below it. Specifying state again  shadows higher level attributes of the same name in the below example:

```html
<!DOCTYPE html>
<html>
<head>
<script src="../src/tlx-core.js"></script>
<script src="../src/tlx-html.js"></script>
<script>tlx.enable()</script>
</head>
<body state="${{name:'Joe',address:{city:'Seattle',state:'WA'}}}">
<div>
	<div state="${{address: {city:'New York', state:'NY'}}}">
	Name: ${name}
		<div >
		City: ${address.city}, State: ${address.state}
		</div>
	</div>
</div>
</body>
</html>
```

## Directives

The following directives are built-in:

`state`, which is a special directive in that it is not prefixed with a letter and a hyphen but supports interpolation, e.g. `state="${[1,2,3]}"`. Interpolations are frequently useful in order to simplify the expression of JSON, e.g. `state="{name: 'Bill}"` is not valid JSON, where as `state="${{name: 'Bill'}}"` is valid JavaScript and will return the correct object, i.e. `{"name":"Bill"}`. 

`t-for="${{let:<vname>, of: <array>}}"`, operates like its JavaScript counterpart, in addition to `<vname>`, the scoped variables `value`, `index`, and `array` (similar to `Array.prototype.forEach`) are available in nested HTML string literal expressions.

`t-for="${{let:<vname>, in: <object>}}"`, operates like its JavaScript counterpart except that in addition to `<vname>`, locally scoped variables `object` and `key` are available in the nested HTML string literal expressions so that `${object[key]}` can be used to retrieve a value in addition to `${object[<vname>]}`.

`t-foreach="${<object>}"`, is smart and operates on either an array or regular object. The variables `key`, `value` and `object` are available to nested HTML string literal expressions.

`t-if="${<boolean>}"`, prevents rendering of child elements if the boolean is falsy.

`t-import=<url>`, (coming soon) which will load a remote resource. Use with `t-if` to support on-demand/progressive loading.

`t-on="${{<eventName>: <handler>[,<eventName>:<handler>...]}`, adds event handlers. The handler signature is the same as a normal JavaScript event handler and just takes an `Event` as an argument.

### Iterating Directives

Iterating directives are slightly different than Vue. The iteration expression exists in an attribute on the containing element rather than the child element being duplicated, for example:

TLX:

```html
<ul t-for="${{let:"item", of: [{message:'Foo'},{message:'Bar'}]}}"><li>${item.message}</li></ul>
```

Vue:

```html
<ul><li f-for="item of [{message:'Foo'},{message:'Bar'}]">{{item.message}}</li></ul>

```

### Custom Directives

New directives can be added by augmenting the object `tlx.directives` or `tlx.directives.HTMLElement` with a key representing the directive name, e.g. `x-mydirective`, and a function as the value with the signature, `(value,template,htmlElement) ...`. Typically the function will return an interpolated template but it is also is free to change the `htmlElement` as it sees fit, e.g.:


```js
tx.directives["t-for"] = (spec,template,element) => {
	if(spec.of) {
		return spec.of.reduce((accum,value,index,array) => accum += element.resolve(template,{[spec.let||spec.var]:value,value,index,array}),"");
	} else {
		return Object.keys(spec.in).reduce((accum,key) => accum += element.resolve(template,{[spec.let||spec.var]:key,value:spec.in[key],key,object:spec.in}),"");
	}
}
```


## Component

The `component` module enables self contained web components. These are custom to `tlx` and similar to those described on the [Little ToDo](https://codeburst.io/little-todo-javascript-html-components-without-frameworks-87914d6dd2e) Medium article. `Tlx` also supports more standard components with custom HTML tags using the `polyfill` module.

The `component` module is typically used with the `html` module, but `html` is not strictly required.

Components are just functions that take two arguments, apply a Mixin, initialize themselves and supply a `render` function. They also have to be declared to `tlx` using a `define` statement. The rest is up to you!

First, we cover the API and then provide a general template and finish with an example.

`tlx.define(tagName,component)` - Registers the `tagName` with `tlx` as corresponding to the `component` creation function.
 
`tlx.get(tagName)` - Returns the component creation function associated with the `tagName`. Used internally but rarely by developers.

`tlx.mount(...tagNames)` - Turns all of the HTML elements in the document with the provided tag names into components. Callend automatically unless turned off using `tlx.enable`.

`tlx.whenDefined(tagName)` - Returns a promise that will resolve if a component function is ever registered with thew `tagName`. Rarely used. Provided for consistency with web standards.
	
`tlx.getTagName(component)` - Returns the tag name associated with the 	`component` creation function. Used in every component definition. See example below.

Here is the general template:

```javascript
// always provide a default element using el=document.createElement(tlx.getTagName(<your component variable>))
const myComponent = function(defaultAttributes={},el=document.createElement(tlx.getTagName(myComponent))) {
	Object.assign(el,tlx.Mixin);
	el.initialize(Object.assign({},defaultAttributes));
	
	... your code here ...
	
	el.render = (attributes) =>  {
		... your code here ...
		return <html>;
	}
	return el;
}
tlx.define(<tagName>,myComponent);

```


The below example, available in `examples/component.html` will render two interactive Todo lists. The first is created directly as HTML the other is created via JavaScript and then appended to the DOM.


```html
<!DOCTYPE html>
<html>
<head>
<script src="../src/tlx-core.js"></script>
<script src="../src/tlx-html.js"></script>
<script src="../src/tlx-component.js"></script>
<script>


const ToDo = function({title="",listid="",done=false},el = document.createElement(tlx.getTagName(ToDo))) {
	Object.assign(el,tlx.Mixin);
	
	// Note the use of default destructuring to provide both define time defaults and runtime overrides
	el.initialize(Object.assign({title,listid,done},arguments[0])); 
	
	el.remove = () => {
		el.parentElement.removeChild(el);
	}
	
	// Note how we assign and return innerHTML. You could also build the DOM and then return innerHTML
	// The escaped template literals are why we need the html module for this example.
	el.render = (attributes) => el.innerHTML = el.resolve(`
		<li id="\${id}">\${title} <input type="checkbox" \${(done ? "checked" : "")} onclick="(()=>{ \${listid||id}.remove('\${id}')})()"></li>
	`,attributes);
	return el;
}
tlx.define("todo",ToDo);

const ToDoList = function({title="",todos=[]},el = document.createElement(tlx.getTagName(ToDoList))) {
	const genId = () => "tid" + (Math.random()+"").substring(2); // not a great id generator, but fine for demo
	Object.assign(el,tlx.Mixin);
	el.initialize(Object.assign({title,todos},arguments[0]));
	el.todos.forEach(todo => todo.id || (todo.id = genId())); 
	el.add = () => {
		const title = prompt("ToDo Name");
		if(title) {
			el.todos.push({title,id:genId()});
			el.render();
		}
	}
	el.remove = (id) => {
		const i = el.todos.findIndex((item) => item.id===id);
		if(i>=0) {
			el.todos.splice(i,1);
			el.render();
		}
	}
	el.render = (attributes) => el.innerHTML = el.resolve(`
			<p>\${title}</p>
			<button onclick="\${id}.add()">Add Task</button>
			<ul>
			\${el.todos.reduce((accum,todo) => accum += ToDo(todo).render({listid:el.id}),"")}
			</ul>
	`,attributes);
	return el;
}
tlx.define("todolist",ToDoList);


tlx.enable();
</script>
</head>
<body>

<todolist title="My Tasks" todos="${[{title:'Task One'}]}"></todolist>

<div id="yourtasks"></div>

<script>
const todos = ToDoList({title:"Your Tasks",todos:[{title:"Task One"}]});
document.getElementById("anotherlist").appendChild(todos);
</script>
</body>
</html>
```


# Design Notes

Coming soon ...


# Acknowledgements

The idea of `linkState` to simplify reactive binding is drawn from `preact`.

Obviously, inspiration has been drawn from `React`, `preact`, `Vue`, `Angular` and `Riot`. We also got inspiration from `Ractive`, `moon`, and `hyperapp`. 

Portions of TLX were drawn from another AnyWhichWay codebase `fete`, which reached its architectural limits and is no longer maintained.

# Release History (reverse chronological order)

2018-01-13 v0.2.6b - BETA More examples, more testing, lots of documentation. Fixed issue with `state` shadowing due to commonly named variables.

2018-01-08 v0.2.5a - ALPHA Split HTML rendering into its own file.

2018-01-08 v0.2.4a - ALPHA Re-introduced Custom Element polyfill. The polyfill requires the use of the tlx-components module, except on platforms that support Custom Elements natively. Also added automatic escaping/sanitizing of attribute values.

2018-01-06 v0.2.3a - ALPHA Re-introduced and dramatically simplified attribute directives.

2018-01-06 v0.2.2a - ALPHA Started unit testing. Split reactivity and components into their own files. Added Riot like HTML template definition of components.

2018-01-06 v0.2.1a - ALPHA This is a complete re-write with a dramtic size reduction. Many API end-points have not yet been re-established, but we expect 90% compatibility with v0.1.10. Directives have not yet been implemented but will be fully supported. The most dramatic change is elimination of the hyperx code and a mandatory VDom. React and Preact interoperability will be mainatined and a polyfill for [custom elements HTML standard](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Custom_Elements) will be provided via optional modules.

2017-12-06 v0.1.10 - Further work on iterating directives

2017-12-05 v0.1.9 - Corrected issue with `t-on` needing to delay event handling to cover all use cases and iterating directives creating duplicate DOM nodes.

2017-12-02 v0.1.8 - Updated documentation for Components.

2017-12-02 v0.1.7 - Fixed package scoping issue related to `customElements` and some Edge browser compatibility.

2017-12-02 v0.1.6 - Modified component support to also support custom elements per HTML spec.

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