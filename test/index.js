var chai,
	expect,
	unionizor,
	_;
if(typeof(window)==="undefined") {
	chai = require("chai");
	expect = chai.expect;
	unionizor = require("../index.js");
	_ = require("lodash");
}

var testobject = tlx.activate({name:"Joe",address:{city:"Seattle",state:"WA"},children:["Sara","Mike"],publicKey:{show:true,key:"a key"},privateKey:{show:false,key:"a key"}});

describe("Test",function() {
	it("primtive",function(done) {
		const app = document.getElementById("app");
		app.innerHTML = "${name}";
		tlx.bind(testobject)(document.getElementById("app"));
		setTimeout(() => {
			expect(document.getElementById("app").innerHTML).to.equal("Joe");
			done();
		},20)
	});
	it("object",function(done) {
		const app = document.getElementById("app");
		app.innerHTML = "${address.city}";
		tlx.bind(testobject)(document.getElementById("app"));
		setTimeout(() => {
			expect(document.getElementById("app").innerHTML).to.equal("Seattle");
			done();
		},20)
	});
	it("t-foreach",function(done) {
		const app = document.getElementById("app");
		app.innerHTML = "<span id='result' t-foreach='${children}'>${value}</span>";
		tlx.bind(testobject)(document.getElementById("app"));
		setTimeout(() => {
			expect(document.getElementById("result").innerHTML).to.equal("SaraMike");
			done();
		},20)
	});
	it("t-for of",function(done) {
		const app = document.getElementById("app");
		app.innerHTML = "<span id='result' t-for='child of ${children}'>${child}</span>";
		tlx.bind(testobject)(document.getElementById("app"));
		setTimeout(() => {
			expect(document.getElementById("result").innerHTML).to.equal("SaraMike");
			done();
		},20)
	});
	it("t-for in",function(done) {
		const app = document.getElementById("app");
		app.innerHTML = "<span id='result' t-for='property in ${address}'>${property}</span>";
		tlx.bind(testobject)(document.getElementById("app"));
		setTimeout(() => {
			expect(document.getElementById("result").innerHTML).to.equal("citystate");
			done();
		},20)
	});
	it("t-if",function(done) {
		const app = document.getElementById("app");
		app.innerHTML = "<span id='result' t-if='${publicKey.show}'>${publicKey.key}</span>";
		tlx.bind(testobject)(document.getElementById("app"));
		setTimeout(() => {
			expect(document.getElementById("result").innerHTML).to.equal("a key");
			done();
		},20)
	});
	it("t-if not",function(done) {
		const app = document.getElementById("app");
		app.innerHTML = "<span id='result' t-if='${privateKey.show}'>${privateKey.key}</span>";
		tlx.bind(testobject)(document.getElementById("app"));
		setTimeout(() => {
			expect(document.getElementById("result").innerHTML).to.equal("");
			done();
		},20)
	});
	it("reactive primitive",function(done) {
		const app = document.getElementById("app");
		app.innerHTML = "${name}";
		tlx.bind(testobject)(document.getElementById("app"));
		testobject.name = "Mary";
		setTimeout(() => {
			expect(document.getElementById("app").innerHTML).to.equal("Mary");
			done();
		},20)
	});
	it("reactive object",function(done) {
		const app = document.getElementById("app");
		app.innerHTML = "${address.city}";
		tlx.bind(testobject)(document.getElementById("app"));
		testobject.address.city = "Portland";
		setTimeout(() => {
			expect(document.getElementById("app").innerHTML).to.equal("Portland");
			done();
		},20)
	});
	it("reactive object parent",function(done) {
		const app = document.getElementById("app");
		app.innerHTML = "${address.city}";
		tlx.bind(testobject)(document.getElementById("app"));
		testobject.address = {city: "Seattle"};
		setTimeout(() => {
			expect(document.getElementById("app").innerHTML).to.equal("Seattle");
			done();
		},20)
	});
});