

# TLX v1.0.0

Imagine a light weight combination of JSX, Vue, React, Riot, and HyperApp but using JavaScript template literals.

TLX is a tiny multi-paradigm front-end toolkit that lets you use core aspects of your favorite framework programming style. With TLX you can use the style appropriate to the job without re-tooling. You can use from 1.6 to 5K depending on what capability you need.

Use just the parts you want (sizes are minified and GZipped):

`tlx-core.min.js` - 1.9K Supports objects as attribute values. Provides input/attribute escape protection. All other modules depend on this.

`tlx-sanitize.min.js` - Provides automatic input and attribute escaping to help prevent HTML injection.

`tlx-html.min.js` - 0.5K Enables "inverted JSX", i.e. puts the focus on HTML while supporting the power of in-line template literals, e.g. `<div>${item.message}</div>`. Continue to use React or Preact.

`tlx-directives.min.js` - 0.6K If you like Vue or Angular, you can also use the built-in [directives](##directives) `t-if`, `t-foreach`, `t-for`, and `t-on`. Or, [add your own directives](#directives). Depends on tlx-html.

`tlx-component.min.js` - 0.7K Enables components.

`tlx-reactive.min.js` - 0.9K Adds uni-directional and bi-directional state [reactivity](##reactivity) to a manner similar to Vue and many other libraries.

`tlx-template.min.js` -  0.7k Adds the ability to define components using HTML template tags similar to Riot. Includes support for scoped styles. Depends on tlx-components.


`tlx-polyfill.min.js` - 1.0K A polyfill for [Custom Elements](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Custom_Elements). The standard lifecyle events are respected and invoked. Depends on tlx-components.

Watch for `tlx-router.js` coming soon.

`tlx.min.js` - 5.3K minifed and Gzipped, includes everything ... 16.7K minified, 27.5K raw.


***Don't forget***, give us a star if you like what you see!

# Contents

<h2>[Installation](#installation)</h2>

<h2>[API](#api)</h2>

<h3>[Core](#core)</h3>

<h3>[Sanitize](#santize)</h3>

<h3>[HTML](#html)</h3>

<h3>[Directives](#directives)</h3>

<h4>[Iterating Directives](#iterating-directives)</h4>

<h4>[Custom Directives](#custom-directives)</h4>

<h3>[Reactive](#reactive)</h3>

<h3>[Component](#component)</h3>

<h3>[Template](#template)</h3>

<h3>[Polyfill](#polyfill)</h3>

<h2>[Design Notes](#design-notes)</h2>

<h2>[Acknowledgements](#acknowledgements)</h2>

<h2>[Release History](#release-history)</h2>


# Installation

`npm install tlx`

# Usage

Load the files you need from the `browser` directory.

Call `tlx.enable()` before you try to use anything else.

# API

## Core

The `core` module API exposes three functions useful to a developer:

`{sanitize,html,directives,component,template,reactive,polyfill} tlx.enable(options)` - The options object has a boolean flag for each `tlx` module, `sanitize`, `html`, `directives`, `component`, `template`, `reactive`, `polyfill`. The flag is automatically set to true if the module is loaded. The `polyfill` flag can also be set to `force` to overwrite natively supported behavior with that of the polyfill. When called, the function ehances a number of built-in DOM prototypes of functions and checks dependencies, e.g. the `template` module requires that the `component` module is loaded. The function returns a copy of the options.

`{object,element,controller} tlx.bind(object,htmlOrElement,controller)` - Used internally and also exposed to developers to attach an object and/or controller to an HTMLElement. A bound `object` provide data storage that is inherited down the DOM tree. This should generally be used for storing "business logic" state. DOM Attributes should be used for storing UI state. If the second argument is a string it should be HTML that has a single containing tag. It will be converted into an HTMLElement. The `controller` should take a single `Event` object as an argument. The returned `object` is a proxy for the one passed in. The `tlx.bind` function provides the core reactivity capability, but reactivity is not turned on unless the `reactive` module is loaded or `tlx.enable` is called with `{reactive:true}`. See [HTML Module](#html) for an example of using `tlx.bind`.

The remainder of the core wraps some existing DOM functions such as `setAttribute` and `getAttribute` in order to support transparent storage of complex data in addition to primitives and reduces the chance of HTML injection by using `tlx.escape`. It also adds some default behavior to DOM prototypes, i.e. `render` is added to `HTMLElement`, `Attr` and `Text`. See [Design Notes](#design-notes) for more detail.

## Sanitize

The `sanitize` module reduces the chance of HTML injection attacks. Including the module automatically enhances the build-in JavaScript prompt function to sanitize or reject dangerous input. Once `tlx.enable` is called, `setAttribute` is also enhanced.

`escapedData tlx.escape(data)` - Used internally to provide a measure of HTML injection protection, but exposed to developers as a convenience. `tlx.escape` takes any argument type and replaces angle brackets with entities in strings, removes functions from objects, and returns `undefined` if the argument is a function or convertable into a function. It also converts input strings to numbers or booleans if possible. This reduces the possibility that a user will be able to enter executable code via a URL that fills in a form which is then presented to another user or enter code that gets stored and then re-rendered for another individual. See [Finding HTML Injection Vulns](https://blog.qualys.com/technology/2013/05/30/finding-html-injection-vulns-part-i) or search Google for more information about the risks of HTML injection. 

## HTML

The `html` module enhances the DOM to support resolving embeded string template literals.

`primitiveOrObject HTMLElement.prototype.resolve = function(template,values={})` - This function is used extensively in `tlx` internals. However, it generally only useful to developers wishing to implement [custom directives](#custom-directives). The function takes a string containing string literal syntax and walks up the DOM tree to resolve the variables in the string. Extra values can be provided as key value pairs. The result will be a string unless the `template` being resolved is a single template literal, e.g. `${<some code>}`, in which case the result of the code will be returned.


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

The value of the `state` attribute or binding is inherited down the DOM tree. Note above how it is possible to reference the `state` specified in the `body` element three `divs` below it. Specifying state again shadows higher level attributes of the same name in the below example from `examples/htmlmodule.html`:

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

The following attribute directives are built-in:

`state`, which is a special directive in that it is not prefixed with a letter and a hyphen but supports interpolation, e.g. `state="${[1,2,3]}"`. Interpolations are frequently useful in order to simplify the expression of JSON, e.g. `state="{name: 'Bill}"` is not valid JSON, where as `state="${{name: 'Bill'}}"` is valid JavaScript and will return the correct object, i.e. `{"name":"Bill"}`. 

`t-for="${{let:<vname>, of: <array>}}"`, operates like its JavaScript counterpart, in addition to `<vname>`, the scoped variables `value`, `index`, and `array` (similar to `Array.prototype.forEach`) are available in nested HTML string literal expressions.

`t-for="${{let:<vname>, in: <object>}}"`, operates like its JavaScript counterpart except that in addition to `<vname>`, locally scoped variables `object` and `key` are available in the nested HTML string literal expressions so that `${object[key]}` can be used to retrieve a value in addition to `${object[<vname>]}`.

`t-foreach="${<object>}"`, is smart and operates on either an array or regular object. The variables `value`, `index` and `array` are available to nested HTML string literal expressions if an array is passed in, otherwise `key`, `value` and `object` are available.

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

## Reactive

Loading the `reactive` module turns on reactivity, changes to `state` will cause re-rendering automatically. It also exposes one function:

`HTMLElement.protoype.linkState(property)` - Returns an event handler function that will set `property` on the element's (or it's parent's) state based on the `target.value` of the handled `Event`. The function automatically handles conversion of the `checked` attribute to a boolean value in the target state property.

```html
<input type="text" onchange="this.linkState('name')(event)">
```

## Component

The `component` module enables self contained web components. These are custom to `tlx` and similar to those described on the [Little ToDo](https://codeburst.io/little-todo-javascript-html-components-without-frameworks-87914d6dd2e) Medium article. `Tlx` also supports more standard components with custom HTML tags using the `polyfill` module.

The `component` module is typically used with the `html` module, but `html` is not strictly required.

Components are just functions that take two arguments, apply a Mixin, initialize themselves and supply a `render` function. They also have to be declared to `tlx` using a `define` statement. The rest is up to you!

First, we cover the API and then provide a general template and finish with an example.

`tlx.define(tagName,component)` - Registers the `tagName` with `tlx` as corresponding to the `component` creation function.
 
`function tlx.get(tagName)` - Returns the component creation function associated with the `tagName`. Used internally but rarely by developers.

`tlx.mount(...tagNames)` - Turns all of the HTML elements in the document with the provided tag names into components. Callend automatically unless turned off using `tlx.enable`.

`Promise tlx.whenDefined(tagName)` - Returns a promise that will resolve if a component function is ever registered with thew `tagName`. Rarely used. Provided for consistency with web standards.
	
`string tlx.getTagName(component)` - Returns the tag name associated with the 	`component` creation function. Used in every component definition. See example below.

Here is the general template:

```javascript
// always provide a default element using el=document.createElement(tlx.getTagName(<your component variable>))
const myComponent = function(defaultAttributes={},el=document.createElement(tlx.getTagName(myComponent))) {
	// add capability required of all components
	Object.assign(el,tlx.Mixin);
	// all components must be initialized
	el.initialize(Object.assign({},defaultAttributes));
	
	... your code here ...
	
	// all components must provide a render function that returns HTML
	el.render = (attributes) =>  {
		... your code here ...
		return <html>;
	}
	// all components must return their implementing HTMLElement
	return el;
}
// all components must be declared to tlx
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

## Template

Similar to `Riot`, the `template` module lets you define components directly in your HTML file!

The `template` module exposes no functions for use by application developers. Once enbaled, its behavior is automatic.

The `component` and `html` modules are required for this to work. The code beow can be found in `examples/template.html`. Note the use of scoped styles.

```html
<!DOCTYPE html>
<html>
<head>
<script src="../src/tlx-core.js"></script>
<script src="../src/tlx-html.js"></script>
<script src="../src/tlx-component.js"></script>
<script src="../src/tlx-template.js"></script>

<script>tlx.enable();</script>

<template t-tagname="x-todo" title="Untitled Tasks">
	<h3 onclick="${id}.changeTitle(event)">${title}</h3>
	
	// render the actual list
  	<ul onclick="${id}.addTask()" >${tasks.reduce((accum,item) => accum += (`<li>${item}</li>`),"")}</ul>
  	
  	// these will be scoped automatically
	<style>
		h3 { font-size: 120% }
		font-style: italic;
	</style>
  
	<script>
		this.tasks = ["Task One"];
		this.addTask = function() {
			const task = prompt("Task Name:");
			if(task) {
				this.tasks.push(task);
				this.render();
			}
			event.stopPropagation();
		};
		this.changeTitle = function(event) { 
			const title = prompt("New Title:");
			if(title) {
				this.setAttribute("title",title);
				this.render(); // the reactive module has not be loaded, so we need to force render
			}
			event.stopPropagation();
		}
	</script>
</template>
</head>
<body>


<x-todo id="mytodos" title="My Tasks"></x-todo>

<div id="yourtasks"></div>

<script>
setTimeout(() => {
	const todos = tlx.get("x-todo")({title:"Your Tasks",tasks:["Your First Task"]});
	todos.render();
	document.getElementById("yourtasks").appendChild(todos);
});
</script>

</body>
</html>
```

## Polyfill

The `polyfill` module let's you create custom elements based on the [HTML standard](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Custom_Elements).

Loading the polyfill will automatically patch non-compliant browsers when `tlx.enable` is called. You can force compliant browsers to use the polyfill code with the option `{polyfill: force}`.

The polyfill wraps `HTMLElement` in some additional code so that `super` can take and argument which is the tag name to use for the custom element. The wrapper code creates the element in non-compliant browsers and sets it onto the property `__el__`. This property should subsequently be used and returned. If `__el__` is undefined, then the browser is compliant and `this` can be used. By using a simple convention, `const el = this.__el__ || this;`, as the first line after calling super, elements will work on both compliant and non-compliant browsers without additional work.

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<script src="../src/tlx-core.js"></script>
<script src="../src/tlx-html.js"></script>
<script src="../src/tlx-component.js"></script>
<script src="../src/tlx-polyfill.js"></script>
<script>tlx.enable({polyfill:"force"})</script>

<script>
class XTodo extends HTMLElement {
	constructor() { 
		super(tlx.getTagName(XTodo));
		
		// If the polyfill if being used, then super creates a native element and assigns it to el.
		// The property '__el__' should be used as a replacement for 'this', if it exists, and returned.
		const el = this.__el__ || this;
		
		// Define tasks local to the instance
		el.tasks = ["Task One"];
		
		return el;
	}
	// Custom methods for the Todo component.
	addTask(event) {
		const task = prompt("Task Name:");
		if(task) {
			this.tasks.push(task);
			event.currentTarget.innerHTML = this.buildList();
		} 
		event.stopPropagation();
	}
	buildList() {
		return this.tasks.reduce((accum,item) => accum += `<li>${item}</li>`,"");
	}
	changeTitle(event) {
		const title = prompt("New Title:");
		if(title) {
			this.setAttribute("title",title);
			event.target.innerHTML = title;
		}
		event.stopPropagation();
	}
	render(attributes) { // Always define a render function that takes an attribute map, i.e. {<name>:<value>,...}, as an argument.
		this.innerHTML = "";
		const h3 = document.createElement("h3"),
			ul = document.createElement("ul"),
			title = (attributes ? attributes.title : this.title || "Untitled Tasks");
		h3.innerHTML = title;
		ul.innerHTML = this.buildList();
		h3.onclick = (event) => this.changeTitle(event);
		ul.onclick = (event) => this.addTask(event);
		this.appendChild(h3);
		this.appendChild(ul);
	}
	connectedCallback() {
		console.log("Connected");
	}
	attributeChangedCallback(name,oldValue,newValue) {
		console.log(arguments);
	}
	static get observedAttributes() { return ["title"]; }
}
customElements.define("x-todo",XTodo);

</script>

</head>
<body>

<x-todo id="mytodos" title="My Tasks"></x-todo>

</body>
</html>
```

# Design Notes

In order to keep memory footprint down, there is currently no VDom or DOM diffing done by `tlx`.

Since not all browsers support a shadow DOM, a shadow DOM in not used for components.

Since most developers requring transpiled code are already running build pipelines, no transpiled files are provided. However, the code as delivered will run in the most recent versions of Chrome, Firefox, and Edge.

The HTML5 standard data attribute type and the `dataset` property on HTMLElements are not used for two reasons:

1) Prefixing all attribuets with "data-" gets pretty noisy.

2) The standard data attributes do not support storing the proxies that are required for making everything reactive.

We also did not want to wrap very DOM node in a Proxy. This has the negative consequence that non-primitive attribute values are stored directly on DOM Nodes and application developers need to be careful to avoid naming conflicts.


# Acknowledgements

The idea of `linkState` to simplify reactive binding is drawn from `preact`.

Obviously, inspiration has been drawn from `React`, `preact`, `Vue`, `Angular` and `Riot`. We also got inspiration from `Ractive`, `moon`, and `hyperapp`. 

Portions of TLX were drawn from another AnyWhichWay codebase `fete`, which reached its architectural limits and is no longer maintained.

# Release History (reverse chronological order)

2018-01-14 v0.2.7b - BETA sanitize put in its own module. Fixed issue with `linkState` not walking DOM tree for state.

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