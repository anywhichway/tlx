var chai,
	expect,
	_,
	tlx;
if(typeof(window)==="undefined") {
	chai = require("chai");
	expect = chai.expect;
	_ = require("lodash");
	tlx = require("../index.js");
}

var testobject = {name:"Joe",address:{city:"Seattle",state:"WA"},children:["Sara","Mike"],publicKey:{show:true,key:"a key"},privateKey:{show:false,key:"a key"}};

describe("Test",function() {
	it("sanitize function",function() {
		expect(tlx.escape("() => { true; }")).to.equal(undefined);
	});
	it("sanitize html",function() {
		expect(tlx.escape("<div onclick='((event) => console.log(event))(event)'>Test</div>")).to.equal(undefined);
	});
	it("sanitize object",function() {
		const object = {
					nested: {
						f: () => true,
						s: "test"
					}
			},
			sanitized = tlx.escape(object);
		expect(sanitized.nested.f).to.equal(undefined);
		expect(sanitized.nested.s).to.equal("test");
	});
	it("sanitized setAttribute",function() {
		const el = document.createElement("div");
		el.setAttribute("title","function() { true; }");
		expect(el.getAttribute("title")).to.equal(null);
	});
	it("sanitized setAttribute onclick",function() {
		const el = document.createElement("div");
		el.setAttribute("onclick","function() { true; }");
		expect(el.getAttribute("onclick")).to.equal("function() { true; }");
	});
	it("primtive",function() {
		const app = document.getElementById("app");
		app.innerHTML = "${name}";
		tlx.bind(testobject,app);
		app.render();
		expect(document.getElementById("app").innerHTML).to.equal("Joe");
	});
	it("object",function() {
		const app = document.getElementById("app");
		app.innerHTML = "${address.city}";
		tlx.bind(testobject,app);
		app.render();
		expect(document.getElementById("app").innerHTML).to.equal("Seattle");
	});
	it("t-foreach",function() {
		const app = document.getElementById("app");
		app.innerHTML = `<span id="result" t-foreach="\${children}">\${value}</span>`;
		tlx.bind(testobject,app);
		app.render();
		expect(document.getElementById("result").innerHTML).to.equal("SaraMike");
	});
	it("t-for of",function() {
		const app = document.getElementById("app");
		app.innerHTML = `<span id="result" t-for="\${{let:'child',of:children}}">\${child}</span>`;
		tlx.bind(testobject,app);
		app.render();
		expect(document.getElementById("result").innerHTML).to.equal("SaraMike");
	});
	it("t-for in",function() {
		const app = document.getElementById("app");
		app.innerHTML = `<span id="result" t-for="\${{let:'property',in:address}}">\${property}</span>`;
		tlx.bind(testobject,app);
		app.render();
		expect(document.getElementById("result").innerHTML).to.equal("citystate");
	});
	it("t-if",function() {
		const app = document.getElementById("app");
		app.innerHTML = "<span id='result' t-if='${publicKey.show}'>${publicKey.key}</span>";
		tlx.bind(testobject,app);
		app.render();
		expect(document.getElementById("result").innerHTML).to.equal("a key");
	});
	it("t-if not",function() {
		const app = document.getElementById("app");
		app.innerHTML = "<span id='result' t-if='${privateKey.show}'>${privateKey.key}</span>";
		tlx.bind(testobject,app);
		app.render();
		expect(document.getElementById("result").innerHTML).to.equal("");
	});
	it("reactive primitive",function() {
		const app = document.getElementById("app");
		app.innerHTML = "${name}";
		const object = tlx.bind(testobject,app);
		app.render();
		object.name = "Mary";
		expect(document.getElementById("app").innerHTML).to.equal("Mary");
	});
	it("reactive object",function() {
		const app = document.getElementById("app");
		app.innerHTML = "${address.city}";
		const object = tlx.bind(testobject,app);
		app.render();
		object.address.city = "Portland";
		expect(document.getElementById("app").innerHTML).to.equal("Portland");
	});
	it("reactive object parent",function() {
		const app = document.getElementById("app");
		app.innerHTML = "${address.city}";
		const object = tlx.bind(testobject,app);
		app.render();
		object.address = {city: "Seattle"};
		expect(document.getElementById("app").innerHTML).to.equal("Seattle");
	});
});