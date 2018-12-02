var mocha,
	chai,
	expect,
	tlx;
if(typeof(window)==="undefined") {
	chai = require("chai");
	expect = chai.expect;
	const benchtest = require("../index.js");
	beforeEach(benchtest.test);
	after(benchtest.report);
	tlx = require("../index.js");
}

var document;
if(typeof(document)==="undefined") {
	const	dom = new tlx.JSDOM(`<!DOCTYPE html>
				<html>
				<head></head>
				<body>
				<div id="test1">
				<a href="test/1#test">Test</a>
				<span>Name: <input value="\${name}" name="name"></span>
				</div>
				
				<div id="test2">
				<span>Name: \${name}</span>
				</div>
				</body>
				</html>
			`);
		document = dom.window.document;
		
		const model = tlx.reactor({name:"bill"},{name:function() { console.log(arguments); }}),
		t1 = tlx.view(document.getElementById("test1"),{
							model,
							linkModel:true,
							actions:{click:function(e) {  }},
							controller:tlx.handlers({click:tlx.router({"Users/Simon/git/tlx/test/test/:id":args => console.log(args)})})});
		t2 = tlx.view(document.getElementById("test2"),{model});

	model.name = "jane"

	console.log(document.body.innerHTML);
}

const el = document.createElement("div");
document.body.appendChild(el);

tlx.protect();

//window.prompt("test");
delete tlx.protected

describe("views",function() {
	it("direct element",function(done) {
		el.innerHTML = "${data}";
		tlx.view(el,{model:{data:"test"}});
		window.requestAnimationFrame(() => {
			expect(el.innerHTML).equal("test");
			done();
		});
	});
	it("string template",function(done) {
		const template = "${data}";
		tlx.view(el,{model:{data:"test"},template});
		window.requestAnimationFrame(() => {
			expect(el.innerHTML).equal("test");
			done();
		});
	});
	it("element template",function(done) {
		const template = document.createElement("template");
		template.innerHTML = "${data}";
		tlx.view(el,{model:{data:"test"},template});
		window.requestAnimationFrame(() => {
			expect(el.innerHTML).equal("test");
			done();
		});
	});
	it("conditional template (render content)",function(done) {
		el.innerHTML = "${show ? 'hi' : ''}";
		tlx.view(el,{model:{show:true}});
		window.requestAnimationFrame(() => {
			expect(el.innerHTML).equal("hi");
			done();
		});
	});
	it("conditional template (don't render content)",function(done) {
		el.innerHTML = "${show ? 'hi' : ''}";
		tlx.view(el,{model:{show:false}});
		window.requestAnimationFrame(() => {
			expect(el.innerHTML).equal("");
			done();
		});
	});
	it("complex template",function(done) {
		const model = {
				show: true,
				names: ["joe","bill","mary"]
				},
				template = `<div>
					\${
						show
						? "<ul>" + names.reduce((accum,name) => accum += \`<li>\${name}</li>\`,"") + "</ul>"
						: ""
					}
				</div>`;
			tlx.view(el,{model,template});
			window.requestAnimationFrame(() => {
				expect(el.innerHTML).not.equal("");
				done();
			});
	});
	it("attribute",function(done) {
		el.innerHTML = "${data}";
		tlx.view(el,{model:{data:"test"},attributes:{id:1}});
		window.requestAnimationFrame(() => {
			expect(el.innerHTML).equal("test");
			expect(el.getAttribute("id")).equal("1");
			done();
		});
	});
	it("action",function(done) {
		el.innerHTML = "${data}";
		const event = new MouseEvent('click', {
		    view: window,
		    bubbles: true,
		    cancelable: true
		  });
		tlx.view(el,{model:{data:"test"},attributes:{onclick:"(${click})(event)"},actions:{click: (event) => { 
			event.target.wasclicked=true
			}}});
		window.requestAnimationFrame(() => {
			el.dispatchEvent(event);
			expect(el.innerHTML).equal("test");
			expect(typeof(el.onclick)).equal("function");
			expect(el.wasclicked).equal(true);
			done();
		});
	});
	it("reactive",function(done) {
		el.innerHTML = "${data}";
		const model = tlx.reactor({data:"test"});
		tlx.view(el,{model});
		window.requestAnimationFrame(() => {
			expect(el.innerHTML).equal("test");
			model.data = "changed";
			window.requestAnimationFrame(() => {
				expect(el.innerHTML).equal("changed");
				done();
			});
		});
	});
	it("auto linkModel",function(done) {
		el.innerHTML = "<input name='data' value='${data}'>";
		const model = {data:"test"},
			event = new MouseEvent('change', {
		    view: window,
		    bubbles: true,
		    cancelable: true
		  });
		tlx.view(el,{model,linkModel:true});
		window.requestAnimationFrame(() => {
			expect(el.innerHTML).equal("<input name=\"data\" value=\"test\">");
			el.firstElementChild.setAttribute("value","changed");
			el.firstElementChild.dispatchEvent(event);
			window.requestAnimationFrame(() => {
				expect(el.innerHTML).equal("<input name=\"data\" value=\"changed\">");
				expect(model.data).equal("changed");
				done();
			});
		});
	});
	it("auto protect",function(done) {
		el.innerHTML = "<input name='data' value='${data}'>";
		const model = {data:"test"},
			event = new MouseEvent('change', {
		    view: window,
		    bubbles: true,
		    cancelable: true
		  });
		tlx.view(el,{model});
		window.requestAnimationFrame(() => {
			expect(el.innerHTML).equal("<input name=\"data\" value=\"test\">");
			el.firstElementChild.setAttribute("value","function() { return 'a'}");
			el.firstElementChild.dispatchEvent(event);
			window.requestAnimationFrame(() => {
				expect(el.innerHTML).equal("<input name=\"data\" value=\"test\">");
				expect(model.data).equal("test");
				done();
			});
		});
	});
	it("un-protect",function(done) {
		el.innerHTML = "<input name='data' value='${data}'>";
		const model = {data:"test"},
			event = new MouseEvent('change', {
		    view: window,
		    bubbles: true,
		    cancelable: true
		  });
		tlx.view(el,{model,linkModel:true,protect:false});
		window.requestAnimationFrame(() => {
			expect(el.innerHTML).equal("<input name=\"data\" value=\"test\">");
			el.firstElementChild.setAttribute("value","function() { }");
			el.firstElementChild.dispatchEvent(event);
			window.requestAnimationFrame(() => {
				expect(el.innerHTML).equal("<input name=\"data\" value=\"function() { }\">");
				expect(model.data).equal("function() { }");
				done();
			});
		});
	});
	it("direct protect",function(done) {
		el.innerHTML = "<input name='data' value='${data}' protect>";
		const model = {data:"test"},
			event = new MouseEvent('change', {
		    view: window,
		    bubbles: true,
		    cancelable: true
		  });
		tlx.view(el,{model,linkModel:true,protect:false});
		window.requestAnimationFrame(() => {
			expect(el.innerHTML).equal("<input name=\"data\" value=\"test\" protect=\"\">");
			el.firstElementChild.setAttribute("value","function() { }");
			el.firstElementChild.dispatchEvent(event);
			window.requestAnimationFrame(() => {
				expect(el.innerHTML).equal("<input name=\"data\" value=\"test\" protect=\"\">");
				expect(model.data).equal("test");
				done();
			});
		});
	});
});





