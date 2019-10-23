# TLX v1.0.45

TLX is a small (< 5k minimized and gzipped) multi-paradigm front-end library supporting: template literals in place of JSX; multi-root templates using HTML, JavaScript, or remote URL references; `t-for`, `t-foreach`, `t-forvalues` with iterable protocol support; `t-if` attribute directive; custom attribute directives; optional two-way data binding; automatic or manual creation of standards compliant custom elements and components; standards compliant event handlers; a default router; extended lifecycle callbacks; automatic HTML injection protection.


Tlx can be used in a manner that respects the separation or intergration of development responsibilites between those with a focus on style and layout (HTML and CSS) vs. those with a focus of logic (JavaScript).


***Don't forget***, give us a star if you like what you see!

- [Installation](#installation)
- [Usage](#usage)
  * [NodeJS](#nodejs)
  * [Browser](#browser)
  * [Compatibility](#compatibility)
- [Examples](#examples)
  * [Simplest Apps](#simplest-apps)
  * [Manual State Updating](#manual-state-updating)
  * [Manual State Updating and Re-Rendering](#manual-state-updating-and-re-rendering)
- [Template Scripting](#template-scripting)
- [Type="text/template" Script Tag](#template)
- [Attribute Directives](#attribute-directives)
  * [`t-content`](#t-content)
  * [`t-if`](#t-if)
  * [`t-for:varname[:in|of]`](#t-for)
  * [`t-foreach`](#t-foreach)
  * [`t-forvalues`](#t-forvalues)
  * [Custom Attribute Directives](#custom-attribute-directives)
- [Working With Components](#working-with-components)
- [Server Side Rendering](#server-side-rendering)
- [API](#api)
  * [`undefined tlx.protect()`](#protect)
  * [`Proxy tlx.reactor(object target={},object watchers={})`](#reactor)
  * [`HTMLElement tlx.el(string,tagName,attributes)`](#el)
  * [`HTMLElement tlx.view(HTMLElement el[,object options])`](#view)
  * [`function tlx.handlers(object handlers)`](#handlers)
  * [`function tlx.router(object routes)`](#router)
  * [`function tlx.component(string tagName,object options)`](#component)
  * [`any tlx.escape(any data)`](#escape)
  * [`tlx.off`](#off)
- [Performance](#performance)
- [Other Reading](#other-reading)
- [Design Notes](#design-notes)
  * [Differential Rendering](#differential-rendering)
  * [Model Storage](#model-storage)
  * [HTML Injection Protection](#html-injection-protection)
- [Acknowledgements](#acknowledgements)
- [Release History (reverse chronological order)](#release-history--reverse-chronological-order-)
- [License](#license)

# Installation

`npm install tlx`

or use from a CDN

`https://unpkg.com/tlx/browser/tlx.js`

`https://unpkg.com/tlx/browser/tlx.min.js`

# Usage

## NodeJS

```javascript
const tlx = require("tlx");
```

Also see section Server Side Rendering.

## Browser

Copy the `tlx.js` file from `node_modules/tlx/browser` to your desired location and change the path below accordingly.

```html
<script src="tlx.js"></script>
```

## Compatibility

Tlx runs untranspiled in relatively recent Chrome and Firefox. Since Edge does not yet support `customElements`, it requires a [polyfill](https://github.com/webcomponents/custom-elements) for components and custom elements to work on that platform.

Tlx is agnostic to the use of build tools and development pipelines. In fact, it is currently only delivered in ES16 format since most people doing substantive development have their own preferred build pipleline that will do any necesssary transpiling.

# Examples

See the `examples` directory for lots of examples, meanwhile here are some basic ones.

## Simplest Apps

The simplest apps to write are those that use HTML to define in-line templates and use element `name` attribute values to support two-way data binding and automatic browser updates through the use of a reactive data model.

```html
<!DOCTYPE html>
<html lang="en">
<body>
<div id="message">
Hello ${firstName}.
</div>
First Name: <input id="name" name="firstName" value="${firstName}">
<script src="tlx.js"></script>
<script>
// create an empty reactive model to share
const model = tlx.reactor();
// bind message area to model
tlx.view(document.getElementById("message"),{model});
// bind field to model and link "name" attribute values to model using linkModel automatically
tlx.view(document.getElementById("name"),{model,linkModel:true})
</script>
</body>
</html>
```

Note, for large applications, some people find two way data binding and automatic updates can lead to hard to track down infinite loops.

## Manual State Updating

Slightly more complex to write are apps that use manual state updating:

```html
<!DOCTYPE html>
<html lang="en">
<body>
<div id="message">
Hello ${firstName}.
</div>
First Name: <input id="name" value="${firstName}" onchange="this.view.linkModel('firstName')(event)">
<script src="tlx.js"></script>
<script>
// create an empty reactive model to share
const model = tlx.reactor();
// bind message area to model
tlx.view(document.getElementById("message"),{model});
// bind field to model
tlx.view(document.getElementById("name"),{model})
</script>
</body>
</html>
```

## Manual State Updating and Re-Rendering

You can take complete control over rendering by not using a reactive model and telling tlx which elements to re-render based on DOM selectors.

```html
<!DOCTYPE html>
<html lang="en">
<body>
<div id="message">
Hello ${firstName}.
</div>
First Name: <input id="name" value="${firstName}" onchange="this.view.linkModel('firstName','#message')(event)">
<script src="tlx.js"></script>
<script>
// create an empty model to share
const model = {};
// bind message area to model
tlx.view(document.getElementById("message"),{model});
// bind field to model
tlx.view(document.getElementById("name"),{model})
</script>
</body>
</html>
```

From this point onward application development gets more complex, but no more so that development with React, HyperHTML, Vue, or other frameworks. In fact, it is often far simpler.

# Template Scripting

Tlx uses JavaScript string template literal notation for templates. Except for atomic attribute templates (see below), all templates should resolve to a valid HTML string. 

Atomic attribute templates, i.e. those that involve a single literal, can resolve to any JavaScript type and will be stored directly on the HTMLElement. For example, `value="${[1,2,3]}"`

Below is a div that conditionally contains repeating content and assumes the provided model:


```html
<div id="names">
${
	show
	? tlx.el(names.reduce((accum,name) => accum += tlx.el(name,"li"),""),"ul")
	: ""
}
</div>
```

```javascript
const model = {
	show: true,
	names: ["joe","bill","mary"]
	},
	template = document.getElementById("names");
tlx.view(el,{model,template}); // assume el is bound elsewhere
```

You can also provide templates as strings, but if you want to be able to express them clearly across multiple lines, you will have to escape the interpolation directives, `$`, and nested backquotes, e.g.

```javascript
const model = {
	show: true,
	names: ["joe","bill","mary"]
	},
	template = `<div>
		\${
			show
			? tlx.el(names.reduce((accum,name) => accum += tlx.el(name,"li"),""),"ul")
			: ""
		}
	</div>`;
tlx.view(el,{model,template});
```

During processing, four special variables `$node`, `$script`, `$template`, and `$view` are available. These are the current element or text node and script plus the top level template vdom and view being processed, e.g.

```javascript
<div id="names" names="${['joe','bill','mary']}">
${
	tlx.el($view.names.reduce((accum,name) => accum += tlx.el(name,"li"),""),"ul")
}
</div>
```

```javascript
tlx.view(document.getElementById("names"));
```



# Type="text/template" Script Tag

You may occasionally run into issues where you can't create valid HTML with the scripts you wish to embed. This will typically happen if you include what looks like a tag or with complex table generating scripts. Tag issues can usually be resolved with `tlx.el(value,tagName)`. Otherwise, if you take your HTML with embedded scripts and place it within `<script id="myscript" type="text/template"> ... </script>`, you will be able to pass it to `tlx.view` as a template. This is because the browser will not attempt to parse it.

# Attribute Directives

TLX comes with five built-in attribute directives, `t-content`, `t-if`, `t-for`, `t-foreach` and `t-forvalues`.

For all directives, the `model` currently bound to an element is available as `${model}`.

## <a name="t-content">`t-content`</a>

Replaces the `innerHTML` of the element with the escaped value of `t-content`. This can be HTML or plain text.

## <a name="t-if">`t-if`</a>

If the value of `t-if` is truthy, then the element and its nested elements will be displayed,e.g.

```
<div t-if="true">Will be shown</div>
```

```
<div t-if="false">Will not be shown</div>
```

## <a name="t-for">`t-for:varname[:in|of]`</a>

The value provided to `t-for`, is the object to process. `t-for` will provide the key or item bound to `varname` for any nested string literal templates. The value of `t-for` can be anything that supports the iterable protocol, e.g.

```
<div t-for:i:of="${[1,2,3]}">${i}</div>
```

will render as

```
<div t-for:i:of="${[1,2,3]}">1,2,3</div>
```

The qualifiers `in` and `off` behave the same way they do for JavaScript loops. If the argument is not provided, then iterables will automatically use `of` and other objects will use `in`.

## <a name="t-foreach">`t-foreach`</a>

The value provided to `t-foreach`, is the array to process. `t-foreach` will provide the scope variables `value`, `index`, and `iterable` to any nested string literal templates. And, if the iterable is an array, the variable `array` will also be available, e.g.

```html
<table t-foreach="[1,2,3]">
<tr>
<td>${index}</td><td>${value}</td>
</tr>
</table>
```

If an array is not provided, the directive is effectively ignored. Consider using `t-forvalues` for more resilient code.

## <a name="t-forvalues">`t-forvalues`</a>

The directive `t-forvalues` is similar to `t-foreach`, but it can take either an array or a regular object. The scope variables provided are `value`, `key`, and `object` (which might be an array).

## Custom Attribute Directives

Custom directives can be added to the keyed object `tlx.directives`. They should be functions with the signature `(any attributeValue, object model,object actions,function render,object directive)`. The `render` function is generated internally by tlx. It returns the DOM element currently being processed. It has the call signature `(object model,object actions)`.

The directives can inspect the `model` and `actions` and use them or modified versions of them to call `render`. They can return any of the following:

1) `false`, `null`, `undefined` - The element is removed from the DOM

2) A string, which is used to replace the `innerHTML` of the element

3) A DOM node, which is used to replace the element

4) The return value of `render`, child elements have been handled by the directive

5) `directive.element` after calling `render`, child elements have been handled by the directive

6) `true` without calling `render`, normal behavior is maintained, child elment processing will continue

Below is the definition of `t-foreach`.

```javascript
"t-foreach": (array,model,actions,render,{element}={}) => {
	array.forEach((value,index) => {
		render(Object.assign({value,index,array},model),actions);
	});
	return element;
},
```

Here is an example that changes the case of all nested content:

```javascript
tlx.directives["my-case"] = function(toCase,model,actions,render,{element}={}) {
	switch(toCase) {
		case "upper": return render(model,actions).innerHTML.toUpperCase();
		case "lower": return render(model,actions).innerHTML.toLowerCase();
		default: return render(model,actions);
	}
}
```

More advanced use of custom directives can be made using `:` delimited attribute names. Below is the internal definition of `t-for` supported by a fourth argument which is an object that describes the directive, `{raw,resolved,element}`. `raw` is the directive name as it exists in HTML, e.g. `t-for:i:of`. `resolved` is usually the same as `raw`; however, tlx supports dynamic resolution of directive arguments, so you might get something like this, `{raw:"t-for:${varname}:of",resolved:"t-for:i:of"}`. `element` is just the DOM element being processed.

Note: If using dynamic resolution of directive arguments, make sure the substitution vairables are all lower case. Most browsers lower case attribute names when parsing, which effectively changes your code from this `varName` to this `varname` and model binding will fail to occur.

```javascript
"t-for": (value,scope,actions,render,{raw,resolved}={}) => {
	// directive is of the form "t-for:varname:looptype"
	const [_,vname,looptype] = resolved.split(":");
	if(looptype==="in") {
		for(let key in value) {
			render(Object.assign({},scope,{[vname]:key}))
		}
	} else if(looptype==="of") {
		for(let item of value) {
			render(Object.assign({},scope,{[vname]:item}))
		}
	} else {
		throw new TypeError(`loop type must be 'in' or 'of' for ${raw}`);
	}
	return true;
}
```

# Working With Components

The easiest way to work with components and maintain separation of concerns is to define them using [`function tlx.component(string tagName,object options)`](#-function-tlxcomponent-string-tagname-object-options--), put them in your HTML using their tag name and add the special unary attribute `defer`, and then later in a script turn them into a view.

```html
<my-custom-tag id="myid" defer></my-custom-tag>
<script>tlx.view(document.getElementById("myid"))</script>

```

Alternatively, you can create them in a script and then add them to the DOM:

```javascript
const el = new MyCustomTag({attributes:{id:"myid"}});
document.body.appendChild(el);

```


# Server Side Rendering

When run in a NodeJS server context, tlx loads the `jsdom` package for DOM simulation. To the degree that `JSDOM` supports what you need, you can use tlx on the server just like on the client. Tlx also exposes `JSDOM` as a convenience so you don't have to add it as a dependency to your own code.

The typical use case would be to load a file containing a template, pass it's string contents to `tlx.view`, and then write the HTML to a response object. The code below uses syncrhonous calls and does no error handling to keep the example simple, e.g.

The contents of "mytemplate.html":

```html
<div>
${
	show
	? tlx.el(names.reduce((accum,name) => accum += tlx.el(name,"li"),""),"ul");
	: ""
}
</div>
```

A fragment of the server response handler:

```javacript
const model = {
	show: true,
	names: ["joe","bill","mary"]
	},
	template = fs.readFileSync("mytemplate.html"),
	el = document.createElement("body");
	tlx.view(el,{model,template});
	response.end(el.innerHTML);
```

In a real world situation, the model would probably be pulled from a database and the filename would perhaps be part of a requested URL.

# API

Since there are only 10 API entry points, they are presented in order of likely use rather than alphabetically.

<a name="protect">`undefined tlx.protect()`</a> -

 * Turn on automatic HTML injection protection. Can be overridden on a `view` or HTMLInputElement level. The call also modifies the JavaScript `prompt` function such that any values entered by users are escaped to eliminate code injection. If
an attempt to inject code is made, then the user is informed there is an error and asked to enter somethng again. See `tlx.escape(data)` at the end of this section for info on the escape process.
<a name="reactor">`Proxy tlx.reactor(object target={},object watchers={})`</a> -

 * Returns a deep `Proxy` for `object` that automatically tracks usage in `views` and re-renders them when data they use changes.
     `target` - The `object` around which to wrap the `Proxy`. Note, althoush `Map` and `Set` can be used with attribute directives, it is not currently possible to make them reactive.
     `watchers` - A potentially nested object, the keys of which are intended to match the keys on the target `object`. The values are functions with the signature `(oldvalue,value,property,proxy)`. These are invoked synchronously any time the target property value changes. If they throw an error, the value will not get set. If you desire to use asyncronous behavior, then implement your code to inject asynchronicity. Promises will not be awaited if returned.

<a name="el">`HTMLElement tx.el(string,tagName,attributes)`</a> - 

 * Wraps `string` in the specified `tagName` with `attributes`. Helps avoid the inclusion of tags in embedded HTML scripts so that the use of `<script type="text/template">` can be avoided.

<a name="view">`HTMLElement tlx.view(HTMLElement||HTMLCollection el||DOMSelector[,object options])`</a> -

* Returns a `view` of the specified `template` bound to the DOM element `el`. If no `template` is specified, then the initial outerHTML of the `el` becomes the template. A `view` is an arbitrary collection of nested DOM nodes the leaves of which are selectively rendered if their contents have changed. The nested DOM nodes all have one additional property `view` that points back to the root element in the `view`.
    
   <ul>
   <li>`HTMLElement||HTMLCollection el` - An `HTMLElement` which may be empty or contain HTML that looks and behaves like JavaScript string template literals. The initial content is overwritten when the node is rendered, but kept as a template if one was not provided. If an `HTMLCollection` or `DOMSelector` is provided, then each item will be processed using the provided options. This makes it easy to process a whole bunch of DOM nodes returned from a DOM query.</li>
    <li>`object options` - `{template,model={},attributes={},actions={},controller,linkModel,lifecycle={},protect}={}`
    	<ul>
    	<li>`HTMLElement|idSelector|string url|string template` - An optional DOM element containing what looks like a JavaScript template literal or a string that is a valid string representation of a URL or a or an escaped JavaScript template literal, e.g. `\${firstName}` vs `${firstName}` containing HTML.</li>
		<li>`object model` - The data used when resolving the string template literals. This is typically shared across multiple `views`.</li>
       <li>`object actions` - A keyed object where each property value is a function. These can also be accessed from the templates; however, they are not available for updating in the same way as a `model`. If you provide a function as an attribute value, you need to wrap it in an invocation, e.g. `onclick="(${myclick})(event)`. You can also call the functions anywhere in your templates, e.g. `Name: ${getName()}`.</li>
       <li>`function controller` - A standard event handler function to which all events occuring in the view get passed. To limit the events handled, use the return value of `tlx.handlers(object)` as the controller.</li>
       <li>`boolean||string linkModel` - If truthy, then the `model` is automatically updated with values from form fields having a `name` attribute by using the `name` attribute value as the key on the model. If the value of `linkModel` is a string, then that event is used to trigger updates, typically this would be "change" or "input". Use "change" for triggering when a field loses focus, use "input" to react to every keystroke. If the value is truthy but not a string, "change" will be used.</li>
      <li>`object lifecycle` - Lifecycle callbacks that generally follow the Vue convention for `beforeMount`, `mounted`, `beforeUpdate`, `updated`. Because it is not a component, a view does not support `beforeCreate` and `created`. Because the VDOM is tiny and highly ephemeral and the DOM automatically manages disposal of un-used nodes, there is no `activated`, `deactivated`, `beforeDestroy`, or `destroyed`.</li>
      <li>`boolean protect` - Protect all input elements in the view. To protect just a single element, add the attribute `protect` to the element. If you have set a style for invalid input, it will be used for invalid elements, e.g.
      </li>
     </ul>
  </li>
  </ul>

```javascript
input:invalid { 
	box-shadow: 0 0 5px 1px red;
}
```


## on<event> handlers

The `options` object can also have `on<event>` handlers bound to it directly. These will be attached to the element. They should be used instead of a `controller`, since the `controller` will swallow a lot of events.

`function tlx.define(cssSelector,options)`

 * Returns `undefined`.

 * Attaches the view defined by options to the elements identified by the `cssSelector`. Should be call either during `onload` or at the end of the file.
 
 `function tlx.handlers(object handlers)`

 * Returns an event handler customized to deal with only the events specified on the `object`.
     `object handlers` - An object on which the keys are event names, e.g. "click", and the values are standard JavaScript event handlers, e.g.

```javascript
tlx.handlers({click: (event) => { event.preventDefault(); console.log(event); });
```

<a name="router">`function tlx.router(object routes)`</a> -

* Returns a handler designed to work with click events on anchor hrefs.
    `object routes` - An object on which the keys are paths to match, functions that return a boolean when passed the target URL path, or regular expressions that can be used to match a URL path. The values are the functions to execute if the path is matched. The functions take a keyed object as an argument holding any `:values` parsed from the URL plus a JSON object for the query string in a property named `query`, if any and a `done` callback. The event will be bound to `this`. The functions will typically instantiate a component and render it to the `this.target.view`; however, they can actually do anything. Calling `this.stopRoute()` or `done()` will stop more routes from being processed for the `event`. Passing `true` to `stopRoute()` or `done()` will update the browser history and show the URL in the navigation bar.

 * Also available on the keyed object passed to the routed function are two hidden properties, `raw` and `resolved`. These contain the processed path and query string in array formats, e.g. "/root/path/:id" results in `["/root/path",100,{name:"joe"}` for "root/path/100?name='joe'&address={city:'Seattle',state:'WA'}";

 * All parameter values and query strings are automatically cleaned because of the high risk of injection attacks through URLs. They are also converted into primitive types or JSON objects if possible.

```html
<div id="routed">
<a id="link" href="/test/path/1">Click Me</a>
</div>
<script>
const routed = document.getElementById("routed"),
	router =  tlx.router({
	  '/test/path/:id': function(args) {
	    console.log(this); // should be an event object
	    console.log(args);
	 	this.stopRoute(true); // stop routing and push href to history
	    tlx.view(routed,{template:"You clicked!"}); // show the next view
	  }}),
	  handlers = tlx.handlers({click:router});
tlx.view(routed,{controller:handlers});
</script>
```

 * The keys on the route may also be short strings convertible to functions or regular expressions like below. Note the use of the object initializer, `[ ]`, to conveniently turn a function or regular expression into a string for use as a  property name.

```javascript
{
	  [(url) => url.pathname==="/functionpath/" ? "the arg" : undefined ]: function(args) {
	    console.log(this); // should be an event object
	    console.log(args);
	 	this.stopRoute(); // stop routing, don't change view
	  },
	  [/regexp.*/]: function(args) {
	    console.log(this); // should be an event object
	    console.log(args);
	 	this.stopRoute(); // stop routing, don't change view
	  }
}
```

* If using a function as a property the return value is used as the argument to the routed function, unless the return value is undefined; in which case, the route fails to match. For regular expressions, the argument to the routed function will always be the URL object from the target.


<a name="component">`function tlx.component(string tagName,object options)`</a> -

* Returns a function that will create a custom element with `tagName`. Any nested HTML will be inside a
a shadow DOM. With the exception of `template` and `customElement` the options are default values for the function
returned, i.e. the returned fuction takes an options object with the same named properties, the values of which will be
merged into the defaults. To eliminate properties, merge in a object with a target property value of `undefined`.

* The returned element can be added to the DOM using normal DOM operations and will behave like a `view`.
    
  `string tagName` - The custom tag name to use for the component.
    
  `object options` - `{template,customElement,model,attributes,actions,controller,linkModel,lifeCycle,reactive,protect}`
  <ul>
  	<li>`HTMLElement|string template` or `HTMLCustomElement customElement` - A template specified as an element containing string literal notation as its content, or a string, or an escaped string literal. Or, an already defined custom element class.</li>
   <li>`object model` - See `tlx.view`.</li>
   <li>`object attributes` -  See `tlx.view`.</li>
   <li>`object actions` -  See `tlx.view`.</li>
   <li>`function controller` -  See `tlx.view`.</li>
   <li>`boolean linkModel` -  See `tlx.view`.</li>
   <li>`object lifecycle` - Lifecycle callbacks that generally follow the Vue convention for `beforeCreate`, `created`, `beforeMount`, `mounted`, `beforeUpdate`, `updated`.  Because there is no vdom and the DOM automatically manages disposal there is no `activated`, `deactivated`, `beforeDestroy`, or `destroyed`.</li>
   <li>`boolean reactive` - Set to truthy to make models reactive when they are created upon component creation.</li>
   <li>`boolean protect` - See `tlx.view`.</li>
 </ul>

<a name="escape">`any tlx.escape(any data)`</a> -

* Takes any data and escapes it so it can't be an HTML injection. Returns `undefined` if it can't be escaped. The psuedo code is as follows:

```javascript
type = typeof(data);
switch(data) {
	case type=="number"||type=="boolean": return data;
	case isServerExec(data): return; // e.g. <?php
	case isEvalOrBlocking(data): return;
	case consoleWrite(data): return; // might write nastiness to logs
	case containsJavaScript(data): return; // e.g. javascript:
	case containsFunction(data): return;
}
data = escapeQueryString(data);
data = escapeHTMLEntities(data); // e.g. >= becomes &gte;
return data
```

   `any data` - Any JavaScript data or function. Although, functions will always result in a return of `undefined`.

<a name="off">`tlx.off`</a> -

* Setting `tlx.off` to truthy will prevent any template resolution and display un-resolved string template literal notation.

# Performance

Tlx generally updates at about 60 FPS regardless of % of nodes changing. For a document with hundreds of nodes at between a 50% and 100% change rate this is comparable to most other front end toolkits. At lower rates of change, Tlx is not as fast as many other toolkits such as Aurelia, React, Vue. For most applications Tlx performance will be more than adequate.

# Other Reading

[Direct HTML Templating with TLX](https://medium.com/@anywhichway/direct-html-templating-with-tlx-57b1ad636b4a)

[HTML Injection Protection With TLX](https://medium.com/@anywhichway/html-injection-protection-with-tlx-35bda6a4c573)

[Custom Attribute Directives With TLX](https://medium.com/@anywhichway/custom-attribute-directives-with-tlx-13fd53bf2b9a)


# Design Notes

## Differential Rendering

Tlx generates a very light weight static virtual DOM using the `model` and template literals associated with the current `view`. This virtual DOM is recursively navigated to its leaf nodes, including attributes, which are resolved and then compared with the current DOM. If the current DOM has extra nodes, they are deleted. If the virtual DOM has more nodes than the current DOM, they are appended. If a current DOM leaf has different content than a virtual DOM leaf, the current DOM leaf is updated with the content of the virtual leaf.

## Model Storage

The HTML5 standard data attribute type and the `dataset` property on HTMLElements is not used to expose models for three reasons:

1) Prefixing all attributes with "data-" gets pretty noisy.

2) The standard data attributes do not support storing the proxies that are required for making everything reactive. All values are converted to strings.

3) Allowing direct manipulation of the `model` data members or model access from outside templates typically results in hard to follow buggy code. If you need to change the model data at runtime, then add methods to your model and call them from within your templates.

## HTML Injection Protection

`tlx.protect()` and `tlx.escape(data)` provide a means to limit the risk of HTML injection, i.e. user's entering code in forms or URL query strings that changes the behavior of a web application for another user. See [Finding HTML Injection Vulns](https://blog.qualys.com/technology/2013/05/30/finding-html-injection-vulns-part-i) or search Google for 
more information about the risks of HTML injection.


# Acknowledgements

The idea of the `linkModel` function to simplify reactive binding is drawn from `preact`.

The idea of using `:` to delimit arguments for custom directives is drawn from `Vue`.

The idea of auto binding based on query selectors was taken from wickedElements.

Obviously, inspiration has been drawn from `React`, `preact`, `Vue`, `Angular`, `Riot`, `Hyperapp` and `hyperHTML`. We also got inspiration from `Ractive` and `moon`. 

# Release History (reverse chronological order)

2019-10-19 v1.0.44 - Fixed [20](https://github.com/anywhichway/tlx/issues/20) - Reactor creation was not handling Arrays very well.

2019-05-25 v1.0.43 - Ehanced `t-content` to leave existing innerHTML if t-content value is null or undefined.

2019-05-25 v1.0.42 - Ehanced `reactor` to create nested reactors.

2019-05-18 v1.0.41 - Fixed [16](https://github.com/anywhichway/tlx/issues/16).

2019-05-17 v1.0.40 - Fixed [15](https://github.com/anywhichway/tlx/issues/15).

2019-05-01 v1.0.39 - Added `t-content` directive. [14](https://github.com/anywhichway/tlx/issues/14) Fixed some README.md formatting.

2019-02-20 v1.0.38 - Added `index` variable to automatic scope for `in` and `of` for directive.

2019-02-19 v1.0.37 - Fixed README formatting;

2019-02-16 v1.0.36 - Id selectors were sometimes mistaken for URLs due to presence of #. Fixed.

2019-02-16 v1.0.35 - `view` can now take a query selector as the first argument and will convert all matching elements. `template` can now also be an id selector.

2019-02-14 v1.0.34 - `tlx.define(selector,options)` was added, as was the handling on standard "on<event>" definitions as part of the options rather than using a controlller.

2018-12-29 v1.0.33 - Added `done` as second argument to route functions.

2018-12-29 v1.0.32 - Enhanced argument passing for route paths. Documented advanced routing and added example.

2018-12-28 v1.0.31 - Iterable protocol support for `t-for`, `t-foreach`, `t-values`. Router history added.

2018-12-27 v1.0.30 - Documentation correction for router, [12](https://github.com/anywhichway/tlx/issues/12)

2018-12-26 v1.0.29 - Added remote templates. Fixed differences in routing when loaded over file: vs http(s):.

2018-12-26 v1.0.28 - Improved array reactivity.

2018-12-24 v1.0.27 - Added `examples/router.html`.

2018-12-24 v1.0.26 - Added protection for `textarea`. Improved reactivity of `<select>`. Added capability to have `linkModel` respond to `oninput` as well as `onchange`.

2018-12-23 v1.0.25 - Added example for issue: [8](https://github.com/anywhichway/tlx/issues/8)

2018-12-23 v1.0.24 - Fixed issues: [5](https://github.com/anywhichway/tlx/issues/5), [7](https://github.com/anywhichway/tlx/issues/7), [8](https://github.com/anywhichway/tlx/issues/8)

2018-12-21 v1.0.23 - Documentation formatting.

2018-12-17 v1.0.22 - Relaxed script tag type checking so any script can be used as a template.

2018-12-16 v1.0.21 - Added `el` function. Added `$node`, `$script`, `$template`, and `$view` script variables.

2018-12-11 v1.0.20 - Improved `<template>` and `<script type="text/template">` handling.

2018-12-10 v1.0.19 - Exposed `resolve`.

2018-12-10 v1.0.18 - Exposed model as property value on views.

2018-12-8 v1.0.17b - Documentation updates. Improved direct component creation.

2018-12-8 v1.0.16b - Added `defer` attribute.

2018-12-7 v1.0.15b - Removed `requestAnimationFrame` from unit tests. Made directives fully dynamic. Added loop type inference to `t-for`. Added `t-forvalues` directive.

2018-12-6 v1.0.14b - Fixed edge case with custom directives not rendering children.

2018-12-6 v1.0.13b - Added support for dynamic arguments in custom directives. Simplified custom directive definition.

2018-12-5 v1.0.12b - Added advanced custom directives and `t-for:varName:loopType`.

2018-12-4 v1.0.11b - Updated `dbmon` benchmark. Running at 58 FPS under heavy load.

2018-12-4 v1.0.10b - Documentation updates. Removed a requestAnimationFrame that was causing issues with delays on custom attribute directives.

2018-12-3 v1.0.9b - Optimized component code.

2018-12-2 v1.0.8b - Documentation updates.

2018-12-1 v1.0.7b - Added attribute directives and very small transient vdom.

2018-11-30 v1.0.6b - Fixed issue with protect and initially unresolved attributes. 

2018-11-29 v1.0.5b - Updated examples.

2018-11-29 v1.0.4b - Documentation updates. Added HTML injection protection.

2018-11-28 v1.0.3b - Documentation updates. Renamed `linkState` to `linkModel` for consistency.

2018-11-28 v1.0.2b - Documentation updates. Added lifecycle callbacks and server side rendering.

2018-11-27 v1.0.1b - Documentation updates.

2018-11-27 v1.0.0b - Complete overhaul and simplification. Removal of virtual dom and attribute directives since they are no longer necessary.

2018-06-16 v0.2.22 - `vtdom` now auto removes attributes with empty values.

2018-06-15 v0.2.21 - Improved attribute support for components. Made `render` non-enumerable. Adjusted scope for directives. Made `t-for` fully consistent with JavaScript semantics.

2018-06-13 v0.2.20 - Improved attribute support for components.

2018-06-12 v0.2.19 - Improved Edge compatibility.

2018-06-08 v0.2.18 - Improved Edge compatibility.

2018-06-08 v0.2.17 - Provide access to outer scope in directives.

2018-06-01 v0.2.16 - Performance improvments. Added infinite/recursive object reference loop protection to object cloning.

2018-05-30 v0.2.15 - Re-enabled benchmark tests. Added `open` as a boolean attribute.

2018-05-29 v0.2.14 -Added `tlx-protect.js` to `tlx.js` bundle.  Added Simple Reactive Front End example for Medium article. 

2018-05-27 v0.2.13 - Branch merge dropped most recent `examples/component.html` and `src/reactive.js`. Added back.

2018-05-26 v0.2.12 - Resolve branch merge into master.

2018-05-26 v0.2.11b - Documentation refinements. Unit tests updated. Corrected issues with t-foreach looking at children rather than childNodes. Benchmarks still pending.

2018-05-25 v0.2.10b - Added lots of documentation and examples.  ***NOTE***: Unit tests still not updated.

2018-05-24 v0.2.9b - Renamed `state` to `t-state`. Modified `t-for` and `t-in` to parse text instead of taking object arguments. Dropped custom elements polyfill. Added `t-reactive` tag for Riot like templates. Eliminated need to call `tlx.enable()`. Renamed `tlx-sanitize` to `tlx-protect`. ***NOTE***: Unit tests not yet updated, but lots of examples!

2018-01-21 v0.2.8b - BETA regorganized modules. WARNING: Docs out of date. Server side unit tests and bundles `tlx.js` file not working.

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