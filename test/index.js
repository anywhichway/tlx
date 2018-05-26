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
	it("escape function",function() {
		expect(tlx.escape("() => { true; }")).to.equal(undefined);
	});
	it("escape html",function() {
		expect(tlx.escape("<div onclick='((event) => console.log(event))(event)'>Test</div>")).to.equal(undefined);
	});
	it("escape object",function() {
		const object = {
					nested: {
						f: () => true,
						s: "test"
					}
			},
			escaped = tlx.escape(object);
		expect(escaped.nested.f).to.equal(undefined);
		expect(escaped.nested.s).to.equal("test");
	});
	it("primtive",function() {
		const app = document.getElementById("app");
		app.innerHTML = "${name}";
		tlx.bind(testobject,app);
		expect(document.getElementById("app").innerHTML).to.equal("Joe");
	});
	it("object",function() {
		const app = document.getElementById("app");
		app.innerHTML = "${address.city}";
		tlx.bind(testobject,app);
		expect(document.getElementById("app").innerHTML).to.equal("Seattle");
	});
	it("t-foreach",function() {
		const app = document.getElementById("app");
		app.innerHTML = `<span id="result" t-foreach="\${children}">\${value}</span>`;
		tlx.bind(testobject,app.firstChild);
		expect(document.getElementById("result").innerHTML).to.equal("SaraMike");
	});
	it("t-for of",function() {
		const app = document.getElementById("app");
		app.innerHTML = `<span id="result" t-for="child of \${children}">\${child}</span>`;
		tlx.bind(testobject,app.firstChild);
		expect(document.getElementById("result").innerHTML).to.equal("SaraMike");
	});
	it("t-for in",function() {
		const app = document.getElementById("app");
		app.innerHTML = `<span id="result" t-for="property in \${address}">\${property}</span>`;
		tlx.bind(testobject,app.firstChild);
		expect(document.getElementById("result").innerHTML).to.equal("citystate");
	});
	it("t-if",function() {
		const app = document.getElementById("app");
		app.innerHTML = "<span id='result' t-if='${publicKey.show}'>${publicKey.key}</span>";
		tlx.bind(testobject,app.firstChild);
		expect(document.getElementById("result").innerHTML).to.equal("a key");
	});
	it("t-if not",function() {
		const app = document.getElementById("app");
		app.innerHTML = "<span id='result' t-if='${privateKey.show}'>${privateKey.key}</span>";
		tlx.bind(testobject,app.firstChild);
		expect(document.getElementById("result").innerHTML).to.equal("");
	});
	it("reactive primitive",function() {
		const app = document.getElementById("app");
		app.innerHTML = "${name}";
		const object = tlx.bind(testobject,app);
		object.name = "Mary";
		app.render(null,true);
		expect(document.getElementById("app").innerHTML).to.equal("Mary");
	});
	it("reactive object",function() {
		const app = document.getElementById("app");
		app.innerHTML = "${address.city}";
		const object = tlx.bind(testobject,app);
		object.address.city = "Portland";
		app.render(null,true);
		expect(document.getElementById("app").innerHTML).to.equal("Portland");
	});
	it("reactive object parent",function() {
		const app = document.getElementById("app");
		app.innerHTML = "${address.city}";
		const object = tlx.bind(testobject,app);
		object.address = {city: "Seattle"};
		app.render(null,true);
		expect(document.getElementById("app").innerHTML).to.equal("Seattle");
	});
});