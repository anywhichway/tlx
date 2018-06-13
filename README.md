# TLX v0.2.20

Imagine a light weight combination of JSX, Vue, React, Riot, and HyperApp but using JavaScript template literals.

TLX is a tiny (from 1.9 to 5.3K) multi-paradigm, less opinionated, front-end toolkit that lets you use core aspects of your favorite framework programming style. With TLX you can use the style appropriate to the job or skills of the team.

`tlx-core.js` - Roughly equivalent to Hyperapp. 1.9K minifed and Gzipped, 4.7K minified, 10K raw. 

`tlx-vtdom.js` - Replaces JSX with HTML string literal substitution. 0.9K minifed and Gzipped, 1.8K minified, 4K raw.
 
`tlx-reactive.js` -  Adds basic reactivity without the need for controllers and views. 0.5K minifed and Gzipped, 0.8K minified, 2.5K raw.

`tlx-directives.js` - Adds standard directives like `t-if`, `t-on`, `t-foreach`, `t-for`. Supports custom directives. 0.6K minifed and Gzipped, 1.2K minified, 3.3K raw. 

`tlx-component.js` - Adds custom tags and Riot like components. 0.8K K minifed and Gzipped, 1.6K minified,  4.1K raw.

`tlx-protect.js` - Adds HTML script injection protection.  1.2K K minifed and Gzipped, 2.8K minified,  7.9K raw.

`tlx.js` - All files combined. Roughly equivalent to Vue. 5.3K minifed and Gzipped, 14.6K minified, 34K raw. 

`tlx-route.js` - COMING SOON.

Tlx provides a set of layered functions to support the implementation of reactive HTML front ends using the programming style most appropriate to the team or job at hand. While doing this it attempts to leverage as much built-in Javascript capability as possible and add minimal things to learn that can't be directly applied elsewhere. 

Tlx is not harder to learn than Vue and might actually be simpler since template literal substitution can be used for attributes and content; whereas, Vue does not allow mustache templates for attribute values. Tlx even supports the `@` shorthand for `t-on` like Vue does for `v-on`. No analogous shorthand is provided for `v-bind`, because it is un-necessary with template literal attribute substitution.

Tlx is less opinionated than most front end libraries. It supports:

1) One way or two way data binding
2) Immutable state or mutable state in controllers/actions
3) Distinct model and controller/action objects or single objects providing both model and controller
4) POJOs or class instances in arbitrary depth heirarchies as models and controllers/actions 
5) `h` function vDOM creation, string template vDOM creation, or HTML template vDom creation
6) Pseudo-compatibility options that can make it familiar to developers accustomed to other libraries or allow the overaly of architectural concerns, e.g. @ handler shorthand like Vue, style and functional code clustering ala Riot templates, similar function names (`tlx.directive` vs `Vue.directive` or `tlx.linkState` vs `preact.linkState`).

All the above should allow you to gradually move existing vanilla JavaScript into Tlx.

Tlx is agnostic as to the use of build tools and development pipelines. In fact, it is only delivered in ES16 format since most people doing substantive development have their own preferred build pipleline that will do any necesssary transpiling.

Tlx can also be used in a manner that respects the separation or intergration of development responsibilites between those with a focus on style and layout (HTML and CSS) vs. those with a focus of logic (JavaScript).


***Don't forget***, give us a star if you like what you see!

# Contents

[Installation](#installation)

[Usage](#usage)

   [Model View Controller Apps](#model-view-controller-apps)
   
   [HTML](#html)
   
   [Reactivity](#reactivity)
   
   [Directives](#directives)
   
   [Iterating Directives](#iterating-directives)
   
   [Custom Directives](#custom-directives)
   
   [Components](#components)
   
   [HTML Templates](#html-templates)
   
   [Protect](#protect)
   
[API](#api)

[Design Notes](#design-notes)

[Acknowledgements](#acknowledgements)

[Release History](#release)


# Installation

`npm install tlx`

# Usage

Load the files you need from the `dist` directory. The required files are named next to each section. For simplicity, if you wish, you can simply load `dist/tlx.js`.

## Model View Controller Apps

Tlx uses a Model/View/Controller paradigm, 

`{model:object={},view:function[,controller:object=model]}`

or

`{model:object={},template:string[,controller:object=model]}`

Models can be POJO's or instances of classes.

Views are functions that when provided a `model` and a `controller` return a virtual dom in the classic form, `{tagName:string,attributes:object,children:array}`. These are typically constructed using `tlx.h(tagName,attributes={},children=[])`.

If you provide a `template` string then the `view` function will be built automatically. There is not need to understand the virtual DOM or `tlx.h`.

Controllers can be POJO's or instances of classes. In fact, if no controller is specified, it is assumed the `model` provides the controller functionality. Hence, `controller` is an optional property.

Apps are created using 

```javascript
tlx.mvc({model:object={},view:function[,controller:object]},
         target:HTMLElement,
         {reactive:boolean,partials:boolean,protect:boolean})
```

When  called with no arguments, `tlx.mvc()`, will use `document.body.firstElementChild.outerHTML` as the template and `document.document.body.firstElementChild` as the target.

For convenience, you can also call `tlx.app(model,controller,view,target)` like Hyperapp; although, Hyperapp denotes the `controller` as `actions`.

When controller functions are called, `this` is bound to the `model` unless `partials` is truthy in the options, in which case `this` will be a copy of the `model` and from the perspective of the `controller` the `model` will be immutable. When `partials` is truthy, since the `model` is not directly available to the controller it needs to return the changes it wishes made to the model (the way Hyperapp behaves). In either case, Tlx will determine what nodes need to be re-rendered and will re-render them if `reactive` is truthy. 

By default `reactive` and `partials` are false when apps are created with `tlx.mvc`. When apps are created with `tlx.app`, the `reactive` and `partials` options are set to true, since this is the behavior in Hyperapp.

When the option `protect` is truthy, attribute values and the text of Text nodes are escaped to help prevent HTML script injection. The function `window.prompt` is also wrapped and its return value escaped. If the return value contains executable code, then prompt is re-run asking the user to enter a new value. If the value of a `protect` is a function, it is called with the invalid value and the return value is used as a substitute. If `protect` is truthy but not a function, then the invalid value is replaced with an empty string. For convenience tlx provides `tlx.escape` as the value of `protect`, which will remove or replace executable content.

You can change the default option values by setting `tlx.defaults` to the value you desire, e.g. `tlx.defaults = {reactive:true}`.

The below example, `examples/intro.html`, displays a form that updates a model every time the input field is changed. The form is protected against script injection via `window.prompt` which could result in unexpected executable code being stored in a database.

```html
<!DOCTYPE html>
<html>

<head>
<script src="../src/tlx-core.js"></script>
<script src="../src/tlx-protect.js"></script>
</head>

<body>
<div id="form"></div>
</body>

<script>
const h = tlx.h;

const form = (model,controller) => h("div",{},[h("input",{value:model.value,onchange:(event) => controller.onchange.call(model,event)}),model.value]);

tlx.defaults = {protect:(value) => { alert(`${value} is executable and invalid`); return ""; }};
tlx.mvc({
	model: {value:"test"},
	view: form,
	controller: {
			onchange: function(event) { 
				this.value = event.target.value;
			}
		}
	},
	document.getElementById("form"));
</script>

</html>
```

## HTML

Requires: `tlx-core.js` and `tlx-vtdom.js`

Tlx supports resolving string template literals embedded in HTML. 


```html
<!DOCTYPE html>
<html>
<head>
<script src="../src/tlx-core.js"></script>
</head>
<body onload="tlx.bind({name:'Joe',address:{city:'Seattle',state:'WA'}})">
<div>
	<div>
	Name: <input value="${name}">
		<div>
		City: ${address.city}, State: ${address.state}
		</div>
	</div>
</div>
</body>
</html>
```

## Reactivity

Requires: `tlx-core.js` and `tlx-reactive.js`

In addition to the reactivity that can be enabled using the `reactive` option to `tlx.mvc`, reactivity can be based on the `linkState(path:string,...targetSelector:string)` function, a concept borrowed from Preact and enhanced. This removes the complexity of creating views and controllers.

In its basic form, `linkState` takes a dot delimitted `path` and any number of `targetSelector` (usually ids including #) of HTML elements that have models bound to them. If no model is bound to the target, one will get created and bound. Whenever `linkState` is called, the `path` on the model bound to the target will be updated with the value of the `event.target` and the element identified by `targetSelector` will be re-rendered.

This can be used completely independent of the use of `tlx.mvc`. It automatically prevents direct and indirect looping, as shown below from `examples/linkstate.html`:

```html
First Name:<input id="firstName1" value="${name.first}" type="text" onchange="this.linkState('name.first','#firstName2','#firstName3')(event)">

<div id="firstName2">First Name:${name.first}</div>

First Name:<input id="firstName3" value="${name.first}" type="text" onchange="this.linkState('name.first','#firstName2','#firstName1')(event)">
```

## Directives

Requires: `tlx-core.js` and `tlx-directives.js`

The following attribute directives are built-in:

`t-state`, sets the state for the DOM node it is used in. Note, interpolations are frequently useful in order to simplify the expression of JSON, e.g. `state="{name: 'Bill}"` is not valid JSON, where as `state="${{name: 'Bill'}}"` is valid JavaScript and will return the correct object, i.e. `{"name":"Bill"}`. 

`t-for="<vname> of <array>"`, operates like its JavaScript counterpart, in addition to `<vname>`, the scoped variables `value`, `index`, and `array` (similar to `Array.prototype.forEach`) are available in nested HTML string literal expressions.

`t-for="<vname> in <object>"`, operates like its JavaScript counterpart except that in addition to `<vname>`, locally scoped variables `value`, `key', and `object` are available in the nested HTML string literal expressions so that `${object[key]}` and `${value}` can be used to retrieve a value in addition to `${object[<vname>]}`.

`t-foreach="${<objectOrArray>}"`, is smart and operates on either an array or regular object. The variables `value`, `index` and `array` are available to nested HTML string literal expressions if an array is passed in, otherwise `key`, `value` and `object` are available.

`t-if="${<boolean>}"`, prevents rendering of child elements if the boolean is falsy.

`t-on="${{<eventName>: <handler>[,<eventName>:<handler>...]}`, adds event handlers. The handler signature is the same as a normal JavaScript event handler and just takes an `Event` as an argument.

### Iterating Directives

Iterating directives are slightly different than Vue. The iteration expression exists in an attribute on the containing element rather than the child element being duplicated, for example:

Vue:

```html
<ul><li v-for="item of [{message:'Foo'},{message:'Bar'}]">{{item.message}}</li></ul>

```

Tlx:

```html
<ul t-for="item of [{message:'Foo'},{message:'Bar'}]}}"><li>${item.message}</li></ul>
```

Not only was it easier to implement this way as part of Tlx, we think it is also more closely aligned with normal coding syntax and semantics.

### Custom Directives

New directives can be added by augmenting the object `tlx.directives` with a key representing the directive name, e.g. `x-mydirective`, and a function as the value with the signature, `(vnode,node,attributeValue)`. `attributeValue` will be a string or a JavaScript value if the string is parseable using `JSON.parse`. The function is free to modify the `vnode` or `node` as it sees fit. The function should return a value if child nodes of `node` should be processed. If it returns `undefined`, then further processing of the `node` will be aborted. Internally the iterating directives return `undefined`. Below is the actual implementation of `t-on`.


```js
tlx.directives["t-on"] =  function(vnode,node,spec) {
	for(const key in spec) {
		vnode.attributes["on"+key] = spec[key];
	}
	return true;
}
```

## Components

Requires: `tlx-core.js`, `tlx-vtdom.js` and `tlx-component.js`

Components are associated with HTML tags and are created using `tlx.component(tagName,factory)` or `tlx.component(tagName,mvcSpec)`. If a `factory` is used it can take one argument, the attributes associated with the specific tag instance. It should return a function that takes one argument which will be called with the DOM node that is the element. The function is free to manipulate the DOM node as its sees fit and need not return a value. 

The below example, available in `examples/component.html`, will render 4 buttons using mvc specs. Each button behaves identically but is implemented using different approaches to reactivity or model immutability through the use of partials.

Note, when a template is used the values `attributes`, `controller`, and `model` are available. When using a `controller` function, `this` is bound to the `model` and also has one method `update(partial)` added to it. The argument `partial` is optional and only used if the component is configured to use partials.


```html
<!DOCTYPE html>
<html>
<head>
<script src="../src/tlx-core.js"></script>
<script src="../src/tlx-vtdom.js"></script>
<script src="../src/tlx-component.js"></script>
</head>
<body>
<button-counter1></button-counter1>
<button-counter2></button-counter2>
<button-counter3></button-counter3>
<button-counter4></button-counter4>
</body>
<script>
tlx.component('button-counter1', {
  model: function () {
    return {
      count: 0
    }
  },
  controller: function() {
  	return {
  		onclick: function(event) { this.count++; }
  	}
  },
  template: '<button title="${attributes.title}" onclick="${controller.onclick}">You clicked me ${model.count} times.</button>',
  options: {reactive: true}
});
tlx.component('button-counter2', {
  model: function () {
    return {
      count: 0
    }
  },
  controller: function() {
  	return {
  		onclick: function(event) { return {count: ++this.count}; }
  	}
  },
  template: '<button title="${attributes.title}" onclick="${controller.onclick}">You clicked me ${model.count} times.</button>',
  options: {reactive: true, partials: true}
});
tlx.component('button-counter3', {
  model: function () {
    return {
      count: 0
    }
  },
  controller: function() {
  	return {
  		onclick: function(event) { this.count++; this.update(); }
  	}
  },
  template: '<button title="${attributes.title}" onclick="${controller.onclick}">You clicked me ${model.count} times.</button>'
});
tlx.component('button-counter4', {
  model: function () {
    return {
      count: 0
    }
  },
  controller: function() {
  	return {
  		onclick: function(event) { this.update({count: ++this.count}); }
  	}
  },
  template: '<button title="${attributes.title}" onclick="${controller.onclick}">You clicked me ${model.count} times.</button>',
  options: {partials: true}
});
</script>
</html>
```

## HTML Templates

Requires: `tlx-core.js` and `tlx-component.js`. `tlx-vdom` will also be very useful.

Similar to `Riot`, you can also define components in an HTML `template` block. 

When using templates the following are true:

1) The required attribute `t-tagname` is used to asociate a custom element with the template.

2) The optional boolean attribute `t-reactive` can be present to automatically re-render the component if any of its data changes.

3) Other attributes will be available as properties on the instance of the component.

4) The `this` keyword will refer to the instance of the component.

5) The `style` block will be scoped to the instances of the component.

The code beow can be found in `examples/template.html`. Note the use of scoped styles.

```html
<!DOCTYPE html>
<html>
<head>
<script src="../src/tlx-core.js"></script>
<script src="../src/tlx-vtdom.js"></script>
<script src="../src/tlx-component.js"></script>
</head>
<template t-tagname="template-demo" t-reactive="true" title="Untitled Demo (click to title)">
	<h3 onclick="${changeTitle}">${title}</h3>

	<button onclick="${onclick}">You clicked me ${count} times.</button>
  	  	
	<style>
		h3 { font-style: italic }
	</style>
	
	<script>
		this.count = 0;
		this.onclick = function(event) {
			this.count++;
		};
		this.changeTitle = function(event) { 
			const title = prompt("New Title:");
			if(title) {
				this.title = title;
			}
		}
	</script>
</template>
<body onload="tlx.mvc()">
<template-demo></template-demo>
</body>
</html>
```

## Protect

`escapedData tlx.escape(data)` - Used internally to provide a measure of HTML injection protection, but exposed to developers as a convenience. `tlx.escape` takes any argument type and replaces angle brackets with entities in strings, removes functions from objects, and returns `undefined` if the argument is a function or convertable into a function. It also converts input strings to numbers or booleans if possible. This reduces the possibility that a user will be able to enter executable code via a URL that fills in a form which is then presented to another user or enter code that gets stored and then re-rendered for another individual. See [Finding HTML Injection Vulns](https://blog.qualys.com/technology/2013/05/30/finding-html-injection-vulns-part-i) or search Google for more information about the risks of HTML injection. 

To activate protection, set `protect` to truthy as documents in the introduction section on `tlx.mvc`. Or, if you wish to use protection with `linkState`, then set the global option `tlx.defaults.protect` to true, `tlx.escape` or your own escape function.

# API

To be written

# Design Notes

Since not all browsers support a shadow DOM, a shadow DOM in not used for components.

Since most developers requring transpiled code are already running build pipelines, no transpiled files are provided. However, the code as delivered will run in the most recent versions of Chrome, Firefox, and Edge.

The HTML5 standard data attribute type and the `dataset` property on HTMLElements are not used for two reasons:

1) Prefixing all attributes with "data-" gets pretty noisy.

2) The standard data attributes do not support storing the proxies that are required for making everything reactive. All values are converted to strings.


# Acknowledgements

The idea of `linkState` to simplify reactive binding is drawn from `preact`.

Obviously, inspiration has been drawn from `React`, `preact`, `Vue`, `Angular`, `Riot` and `Hyperapp`. We also got inspiration from `Ractive` and `moon`. 

# Release History (reverse chronological order)<a name="release"></a>

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