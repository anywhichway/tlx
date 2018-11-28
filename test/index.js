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

/*const target = document.getElementById("target"),
	source = document.getElementById("source");

function generateSource() {
	let count = 100,
		root = document.createElement("div"),
		parent = root;
	while(count--) {
		const random = Math.round(Math.random()*100),
			id = random % 10 ? random : 1,
			el = document.createElement("div");
		el.setAttribute("name",id);
		parent.appendChild(el);
		parent = el;
	}
	source.innerHTML = root.innerHTML;
}
generateSource();

const //t1 = view(document.getElementById("test1"),{actions:{change:function(e) { e.preventDefault(); t2.render({name:e.target.value})}}}),
model = tlx.reactor({name:"bill"},{name:function() { console.log(arguments); }}),
//t1 = view(document.getElementById("test1"),{model,actions:{change:function(e) { 
	//e.target.view.linkState('name','#test2')(e)
//}}}),
t1 = tlx.view(document.getElementById("test1"),{
					model,
					linkState:true,
					actions:{click:function(e) {  }},
					controller:tlx.handlers({click:tlx.router({"Users/Simon/git/tlx/test/test/:id":args => console.log(args)})})});
t2 = tlx.view(document.getElementById("test2"),{model}),
c1 = tlx.component("my-div",{template:'Name: <input value="${name}">',model,attributes:{age:20},register:true}),
t3 = c1({model:{name:"joe"},attributes:{gender:"male"}}),
t4 = tlx.view(document.getElementById("complex"),{model:{items:[1,2,3]}}),
t5 = tlx.view(document.getElementById("conditional"),{model:{show:false,items:[1,2,3]}});

document.body.appendChild(t3);

document.getElementById("test2").addEventListener("click",event => console.log(event),false);

model.name = "jane"*/

const el = document.createElement("div");
document.body.appendChild(el);

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
		tlx.view(el,{model:{data:"test"},attributes:{onclick:"${click}"},actions:{click: (event) => { 
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
	it("auto linkState",function(done) {
		el.innerHTML = "<input name='data' value='${data}'>";
		const model = {data:"test"},
			event = new MouseEvent('change', {
		    view: window,
		    bubbles: true,
		    cancelable: true
		  });
		tlx.view(el,{model,linkState:true});
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
});

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
							linkState:true,
							actions:{click:function(e) {  }},
							controller:tlx.handlers({click:tlx.router({"Users/Simon/git/tlx/test/test/:id":args => console.log(args)})})});
		t2 = tlx.view(document.getElementById("test2"),{model});

	model.name = "jane"

	console.log(document.body.innerHTML);
}




