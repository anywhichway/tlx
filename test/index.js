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
		expect(el.innerHTML).equal("test");
		done();
	});
	it("string template",function(done) {
		const template = "${data}";
		tlx.view(el,{model:{data:"test"},template});
		expect(el.innerHTML).equal("test");
		done();
	});
	it("element template",function(done) {
		const template = document.createElement("template");
		template.innerHTML = "${data}";
		tlx.view(el,{model:{data:"test"},template});
		expect(el.innerHTML).equal("test");
		done();
	});
	it("script template",function(done) {
		const template = document.createElement("script");
		template.setAttribute("type","template");
		template.innerHTML = "${data}";
		tlx.view(el,{model:{data:"test"},template});
		expect(el.innerHTML).equal("test");
		done();
	});
	it("text template",function(done) {
		tlx.view(el,{model:{data:"test"}},"#test");
		expect(el.innerHTML).equal("test");
		done();
	});
	it("$ access",function(done) {
		el.innerHTML = `<div id="names" names="\${['joe','bill','mary']}">
		\${
			tlx.el($view.names.reduce((accum,name) => accum += tlx.el(name,"li"),""),"ul")
		}</div>`;
		tlx.view(el);
		expect(el.firstElementChild.innerHTML).equal(`<ul><li>joe</li><li>bill</li><li>mary</li></ul>`);
		done();
	});
	it("input processing",function(done) {
		el.innerHTML = '<input value="${value}">';
		const model = tlx.reactor();
		tlx.view(el,{model,linkModel:true});
		expect(el.firstElementChild.value).equal("");
		model.value = "test";
		expect(el.firstElementChild.value).equal("test");
		done();
	});
	it("content directive (null content)",function(done) {
		el.innerHTML = '<div t-content="${value}">original</div>';
		tlx.view(el,{model:{value:null}});
		expect(el.innerHTML).equal('<div t-content="${value}">original</div>');
		done();
	});
	it("content directive (empty content)",function(done) {
		el.innerHTML = '<div t-content="${value}">original</div>';
		tlx.view(el,{model:{value:""}});
		expect(el.innerHTML).equal('<div></div>');
		done();
	});
	it("content directive (render content)",function(done) {
		el.innerHTML = '<div t-content="${value}"></div>';
		tlx.view(el,{model:{value:1}});
		expect(el.innerHTML).equal(`<div>1</div>`);
		done();
	});
	it("conditional (render content)",function(done) {
		el.innerHTML = "${show ? 'hi' : ''}";
		tlx.view(el,{model:{show:true}});
		expect(el.innerHTML).equal("hi");
		done();
	});
	it("conditional (don't render content)",function(done) {
		el.innerHTML = "${show ? 'hi' : ''}";
		tlx.view(el,{model:{show:false}});
		expect(el.innerHTML).equal("");
		done();
	});
	it("conditional directive (render content)",function(done) {
		el.innerHTML = '<div t-if="${show}">hi</div>';
		tlx.view(el,{model:{show:true}});
		expect(el.innerHTML).equal(`<div t-if="true">hi</div>`);
		done();
	});
	it("conditional directive (don't render content)",function(done) {
		el.innerHTML = '<div t-if="${show}">hi</div>';
		tlx.view(el,{model:{show:false}});
		expect(el.innerHTML).equal(`<div t-if="false"></div>`);
		done();
	});
	it("reactive directive",function(done) {
		el.innerHTML = '<div t-if="${show}">hi</div>';
		const model = tlx.reactor({show:true});
		tlx.view(el,{model});
		expect(el.innerHTML).equal(`<div t-if="true">hi</div>`);
		model.show = false;
		expect(el.innerHTML).equal(`<div t-if="false"></div>`);
		done();
	});
	it("for directive",function(done) {
		el.innerHTML = '<div t-for:i:of="${[1,2,3]}">${i}</div>';
		tlx.view(el);
		expect(el.innerHTML).equal('<div t-for:i:of="${[1,2,3]}">123</div>');
		done();
	});
	it("for directive infer looptype",function(done) {
		el.innerHTML = '<div t-for:i="${[1,2,3]}">${i}</div>';
		tlx.view(el);
		expect(el.innerHTML).equal('<div t-for:i="${[1,2,3]}">123</div>');
		done();
	});
	it("foreach directive",function(done) {
		el.innerHTML = '<div t-foreach="${[1,2,3]}">${value}</div>';
		tlx.view(el);
		expect(el.innerHTML).equal('<div t-foreach="${[1,2,3]}">123</div>');
		done();
	});
	it("complex template",function(done) {
		const model = {
				show: true,
				names: ["joe","bill","mary"]
				},
				template = `<script type="template">
					\${
						show
						? "<ul>" + names.reduce((accum,name) => accum += \`<li>\${name}</li>\`,"") + "</ul>"
						: ""
					}
				</script>`;
			tlx.view(el,{model,template});
			expect(el.innerHTML).not.equal("");
			done();
	});
	it("component",function(done) {
		const component = tlx.component("my-component",{template:"<div>My Component</div>"}),
		el = new component();
		expect(el.tagName).equal("MY-COMPONENT");
		expect(el.shadowRoot.innerHTML).equal("<div>My Component</div>");
		done();
	});
	it("attribute",function(done) {
		el.innerHTML = "${data}";
		tlx.view(el,{model:{data:"test"},attributes:{id:1}});
		expect(el.innerHTML).equal("test");
		expect(el.getAttribute("id")).equal("1");
		done();
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
		el.dispatchEvent(event);
		expect(el.innerHTML).equal("test");
		expect(typeof(el.onclick)).equal("function");
		expect(el.wasclicked).equal(true);
		done();
	});
	it("reactive",function(done) {
		el.innerHTML = "${data}";
		const model = tlx.reactor({data:"test"});
		tlx.view(el,{model});
		expect(el.innerHTML).equal("test");
		model.data = "changed";
		expect(el.innerHTML).equal("changed");
		done();
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
		expect(el.innerHTML).equal("<input name=\"data\" value=\"test\">");
		el.firstElementChild.setAttribute("value","changed");
		el.firstElementChild.value = "changed";
		el.firstElementChild.dispatchEvent(event);
		expect(el.innerHTML).equal("<input name=\"data\" value=\"changed\">");
		expect(model.data).equal("changed");
		done();
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
		expect(el.innerHTML).equal("<input name=\"data\" value=\"test\">");
		el.firstElementChild.setAttribute("value","function() { return 'a'}");
		el.firstElementChild.dispatchEvent(event);
		expect(el.innerHTML).equal("<input name=\"data\" value=\"test\">");
		expect(model.data).equal("test");
		done();
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
		expect(el.innerHTML).equal("<input name=\"data\" value=\"test\">");
		el.firstElementChild.setAttribute("value","function() { }");
		el.firstElementChild.value = "function() { }";
		el.firstElementChild.dispatchEvent(event);
		expect(el.innerHTML).equal("<input name=\"data\" value=\"function() { }\">");
		expect(model.data).equal("function() { }");
		done();
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
		expect(el.innerHTML).equal("<input name=\"data\" value=\"test\" protect=\"\">");
		el.firstElementChild.setAttribute("value","function() { }");
		el.firstElementChild.dispatchEvent(event);
		expect(el.innerHTML).equal("<input name=\"data\" value=\"test\" protect=\"\">");
		expect(model.data).equal("test");
		done();
	});
	it("escape function",function(done) {
		expect(tlx.escape(function() {})).equal(undefined);
		done();
	});
	it("escape function string",function(done) {
		expect(tlx.escape("function() {}")).equal(undefined);
		done();
	});
	it("escape Function string",function(done) {
		expect(tlx.escape("Function('return true`)")).equal(undefined);
		done();
	});
	it("escape arrow function",function(done) {
		expect(tlx.escape("()=>{}")).equal(undefined);
		done();
	});
	it("escape server exec",function(done) {
		expect(tlx.escape("<?php")).equal(undefined);
		done();
	});
	it("escape log",function(done) {
		expect(tlx.escape("console.log('a')")).equal(undefined);
		done();
	});
	it("escape eval",function(done) {
		expect(tlx.escape("eval()")).equal(undefined);
		done();
	});
	it("custom directive",function(done) {
		tlx.directives["my-case"] = function(toCase,model,actions,render) {
			switch(toCase) {
				case "upper": return render(model,actions).innerHTML.toUpperCase();
				case "lower": return render(model,actions).innerHTML.toLowerCase();
				default: return render(model,actions);
			}
		};
		el.innerHTML = `<div my-case="upper">upper</div>`;
		tlx.view(el);
		expect(el.innerHTML).equal(`<div my-case="upper">UPPER</div>`);
		done();
	});
	it("dynamic directive",function(done) {
			el.innerHTML = '<div ${directivename}:i:${looptype}="${directivevalue}">${i}</div>';
			tlx.view(el,{model:{directivename:"t-for",directivevalue:[1,2,3],looptype:"of"}});
			expect(el.innerHTML).equal('<div ${directivename}:i:${looptype}="${directivevalue}">123</div>');
			done();
	})
});





