var chai,
	expect,
	_;
if(typeof(window)==="undefined") {
	chai = require("chai");
	expect = chai.expect;
	_ = require("lodash");
}

tlx.enable();

var testobject = {name:"Joe",address:{city:"Seattle",state:"WA"},children:["Sara","Mike"],publicKey:{show:true,key:"a key"},privateKey:{show:false,key:"a key"}};

describe("Test",function() {
	it("primtive",function() {
		const app = document.getElementById("app");
		app.innerHTML = "${name}";
		tlx.bind(testobject,document.getElementById("app"));
		app.render();
		//setTimeout(() => {
			expect(document.getElementById("app").innerHTML).to.equal("Joe");
		//	done();
		//},30)
	});
	it("object",function() {
		const app = document.getElementById("app");
		app.innerHTML = "${address.city}";
		tlx.bind(testobject,document.getElementById("app"));
		app.render();
		//setTimeout(() => {
			expect(document.getElementById("app").innerHTML).to.equal("Seattle");
		//	done();
		//},30)
	});
	/*it("t-foreach",function(done) {
		const app = document.getElementById("app");
		app.innerHTML = "<span id='result' t-foreach='${children}'>${value}</span>";
		tlx.bind(testobject)(document.getElementById("app"));
		setTimeout(() => {
			expect(document.getElementById("result").innerHTML).to.equal("SaraMike");
			done();
		},30)
	});
	it("t-for of",function(done) {
		const app = document.getElementById("app");
		app.innerHTML = "<span id='result' t-for='child of ${children}'>${child}</span>";
		tlx.bind(testobject)(document.getElementById("app"));
		setTimeout(() => {
			expect(document.getElementById("result").innerHTML).to.equal("SaraMike");
			done();
		},30)
	});
	it("t-for in",function(done) {
		const app = document.getElementById("app");
		app.innerHTML = "<span id='result' t-for='property in ${address}'>${property}</span>";
		tlx.bind(testobject)(document.getElementById("app"));
		setTimeout(() => {
			expect(document.getElementById("result").innerHTML).to.equal("citystate");
			done();
		},30)
	});
	it("t-if",function(done) {
		const app = document.getElementById("app");
		app.innerHTML = "<span id='result' t-if='${publicKey.show}'>${publicKey.key}</span>";
		tlx.bind(testobject)(document.getElementById("app"));
		setTimeout(() => {
			expect(document.getElementById("result").innerHTML).to.equal("a key");
			done();
		},30)
	});
	it("t-if not",function(done) {
		const app = document.getElementById("app");
		app.innerHTML = "<span id='result' t-if='${privateKey.show}'>${privateKey.key}</span>";
		tlx.bind(testobject)(document.getElementById("app"));
		setTimeout(() => {
			expect(document.getElementById("result").innerHTML).to.equal("");
			done();
		},30)
	});*/
	it("reactive primitive",function() {
		const app = document.getElementById("app");
		app.innerHTML = "${name}";
		const object = tlx.bind(testobject,document.getElementById("app"));
		app.render();
		object.name = "Mary";
		//setTimeout(() => {
			expect(document.getElementById("app").innerHTML).to.equal("Mary");
		//	done();
		//},30)
	});
	it("reactive object",function() {
		const app = document.getElementById("app");
		app.innerHTML = "${address.city}";
		const object = tlx.bind(testobject,document.getElementById("app"));
		app.render();
		object.address.city = "Portland";
		//setTimeout(() => {
			expect(document.getElementById("app").innerHTML).to.equal("Portland");
		//	done();
		//},30)
	});
	it("reactive object parent",function() {
		const app = document.getElementById("app");
		app.innerHTML = "${address.city}";
		const object = tlx.bind(testobject,document.getElementById("app"));
		app.render();
		object.address = {city: "Seattle"};
		//setTimeout(() => {
			expect(document.getElementById("app").innerHTML).to.equal("Seattle");
			//done();
		//},30)
	});
});