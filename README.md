# TLX v1.0.0b

TLX is a tiny (2K minimized and gzipped) multi-paradigm, less opinionated, front-end toolkit supporting:

1) template literals in place of JSX,

2) template definition directly in HTML or JavaScript,

3) direct binding to DOM nodes,

3) automatic or manual creation of standards compliant custom elements and components,

4) optional automatic binding of form fields to state,

5) optional 2-way state data binding with automatic re-rendering,

6) direct DOM diffing (no virtual DOM)

7) standards compliant event handlers, a.k.a controllers

8) a default router (implemented as a controller)

Custom attribute directives are not currently supported because they aren't strictly needed and we are attempting to minimize size and complexity.

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
  * [API](#api)
- [Design Notes](#design-notes)
- [Acknowledgements](#acknowledgements)
- [Release History (reverse chronological order)<a name="release"></a>](#release-history--reverse-chronological-order--a-name--release----a-)
- [License](#license)


# Installation

`npm install tlx`

# Usage

## NodeJS

Server based rendering is not yet supported.

## Browser

Copy the `tlx.js` file from `node_modules/tlx/browser` to your desired location and change the path below accordingly.

```html
<script src="tlx.js"></script>
```

## Compatibility

Tlx runs untranspiled in Chrome and Firefox. Since Edge does not yet support `customElements`, it requires a [polyfill](https://github.com/webcomponents/custom-elements) for components and custom elements to work on that platform.

Tlx is agnostic to the use of build tools and development pipelines. In fact, it is currently only delivered in ES16 format since most people doing substantive development have their own preferred build pipleline that will do any necesssary transpiling.

# Examples

## Simplest Apps

The simplest apps to write are those that use HTML to define templates and use element `name` attribute values to support two-way data binding and automatic browser updates through the use of a reactive data model.


```
<!DOCTYPE html>
<html lang="en">
<body>
<div id="message">
Hello ${firstName}.
</div>
First Name: <input id="name" name="firstName" value="${firstName}" placeholder="Type name and enter">
<script src="../index.js"></script>
<script>
// create an empty reactive model to share
const model = tlx.reactor();
// bind message area to model
tlx.view(document.getElementById("message"),{model});
// bind field to model and link "name" attribute values to model using linkState automatically
tlx.view(document.getElementById("name"),{model,linkState:true})
</script>
</body>
</html>
```

Note, for large applications some people find two way data binding and automatic updates can lead to hard to track down infinite loops.

## Manual State Updating

Slightly more complex to write are apps that use manual state updating:

```
<!DOCTYPE html>
<html lang="en">
<body>
<div id="message">
Hello ${firstName}.
</div>
First Name: <input id="name" name="firstName" value="${firstName}" placeholder="Type name and enter" onchange="this.view.linkState('firstName')(event)">
<script src="../index.js"></script>
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

```
<!DOCTYPE html>
<html lang="en">
<body>
<div id="message">
Hello ${firstName}.
</div>
First Name: <input id="name" name="firstName" value="${firstName}" placeholder="Type name and enter" onchange="this.view.linkState('firstName','#message')(event)">
<script src="../index.js"></script>
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

## API

Since there are only 6 API entry points, they are presented in order of likely use rather than alphabetically.

### `tlx.reactor(object={},watchers={})`

Returns a deep `Proxy` for `object` that automatically tracks usage in `views` and re-renders them when data they use changes.

### `tlx.view(el,{template,model={},actions={},controller,linkState}={})`

Returns a `view` of the specified `template` bound to the DOM element `el`. If no `template` is specified, then the initial outerHTML of the `el` becomes the template.

`el` - A DOM element, the HTML of which may contain content that looks an behaves like JavaScript string template literals.

`template` - optional DOM element or escaped JavaScript template literal, e.g. `\${firstName}` vs `${firstName}`.

`model` - The data used when resolving the string template literals.

`actions` - A keyed object where each property value is a function. These can also be accessed from the templates; however, they are frozen when the view is created.

### `tlx.handlers(object)`

### `tlx.router(object)`

### `tlx.component(tagName,{template,model,attributes,actions,controller,linkState,customElement})`

### `tlx.off`




# Design Notes

Since most developers requring transpiled code are already running build pipelines, no transpiled files are provided. However, the code as delivered will run in the most recent versions of Chrome, Firefox, and Edge.

The HTML5 standard data attribute type and the `dataset` property on HTMLElements are not used for two reasons:

1) Prefixing all attributes with "data-" gets pretty noisy.

2) The standard data attributes do not support storing the proxies that are required for making everything reactive. All values are converted to strings.


# Acknowledgements

The idea of the `linkState` function to simplify reactive binding is drawn from `preact`.

Obviously, inspiration has been drawn from `React`, `preact`, `Vue`, `Angular`, `Riot` and `Hyperapp`. We also got inspiration from `Ractive` and `moon`. 

# Release History (reverse chronological order)<a name="release"></a>

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