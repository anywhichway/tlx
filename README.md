

# TLX v1.0.0

Imagine a light weight combination of JSX, Vue, React, Riot, and HyperApp but using JavaScript template literals.

At 3.5K minified + Gzipped, 11K minified, 18K raw TLX v1.0.0 is just 80% of the size of v0.1.10 and faster.

Use just the parts you want (sizes are minified and GZipped):

`tlx-core.min.js` - 1.1K Enables "inverted JSX", i.e. puts the focus on HTML while supporting the power of in-line template literals, e.g. `<div>${item.message}</div>`. Use for full SEO enablement and [multi-page apps](#multipage-apps). Continue to use React or Preact.

`tlx-component.min.js` - 0.75K Enables components.

`tlx-reactive.min.js` - 0.9K Adds uni-directional and bi-directional state [reactivity](#reactivity) to templates in a manner similar to Vue and many other libraries.

`tlx-template.min.js` -  0.7k Adds the abiliy to define components using HTML template tags similar to Riot. Includes support for scoped styles.

`tlx-directives.min.js` - 0.3K If you like Vue or Angular, you can also use the built-in [directives](#directives) `t-if`, `t-foreach`, `t-for`, and `t-on`. Or, [add your own directives](#directives). However, many directives are un-necessary due to the power of in-line template literals embedded in your HTML.

Watch for `tlx-router.js` coming soon.

Or, include everything with `tlx.min.js` at just 3.5K minified + Gzipped, 11K minified, 18K raw.

***Don't forget***, give us a star if you like what you see!

# Contents

[Installation](#installation)

[API](#api)

[Components](#components)

[Acknowledgements](#acknowledgements)

[Release History](#release-history)


# Installation

`npm install tlx`

# Usage

Load the files you need from the `browser` directory.

Call `tlx.enable()` before you try to use anything else.

# API

If you want to templatize regular HTML outside of a script, bind an object to an HTMLElement with `tlx.bind`, e.g. `tlx.bind({<some data>},document.getElementbyId(<some id>));` Think of it as inverted JSX, i.e. JSX with focus on HTML rather than JavaScript. This is useful for SEO dependent sites or where layout needs to be put directly in the hands of a visual designer.

Examples are best!

Don't forget call `tlx.enable()` before you try to use anything else.

Use to templatize regular HTML:

```html
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
```

## Components

See the examples directory and the Medium article pending further documentation.


# Acknowledgements

The idea of `linkState` to simplify reactive binding is drawn from `preact`.

Obviously, inspiration has been drawn from `React`, `preact`, `Vue`, and `Angular`. We also got inspiration from `Ractive`, `moon`, and `hyperapp`. 

Portions of TLX were drawn from another AnyWhichWay codebase `fete`, which reached its architectural limits and is no longer maintained.

# Release History

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