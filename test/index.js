var mocha,
	chai,
	expect;
if(typeof(window)==="undefined") {
	chai = require("chai");
	expect = chai.expect;
	const benchtest = require("../index.js");
	beforeEach(benchtest.test);
	after(benchtest.report);
}

const target = document.getElementById("target"),
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
model = reactor({name:"bill"},{name:function() { console.log(arguments); }}),
//t1 = view(document.getElementById("test1"),{model,actions:{change:function(e) { 
	//e.target.view.linkState('name','#test2')(e)
//}}}),
t1 = view(document.getElementById("test1"),{
					model,
					linkState:true,
					actions:{click:function(e) {  }},
					controller:handlers({click:router({"Users/Simon/git/tlx/test/test/:id":args => console.log(args)})})});
t2 = view(document.getElementById("test2"),{model}),
c1 = component("my-div",{template:'Name: <input value="${name}">',model,attributes:{age:20},register:true}),
t3 = c1({model:{name:"joe"},attributes:{gender:"male"}}),
t4 = view(document.getElementById("complex"),{model:{items:[1,2,3]}}),
t5 = view(document.getElementById("conditional"),{model:{show:false,items:[1,2,3]}});

document.body.appendChild(t3);

document.getElementById("test2").addEventListener("click",event => console.log(event),false);

model.name = "jane"


describe("Test",function() {
//beforeEach(generateSource);
it("Direct #",function(done) {
	generateSource();
	target.innerHTML = source.innerHTML;
	expect(target.innerHTML).equal(source.innerHTML);
	done();
});
it("updateDOM #",function(done) {
	generateSource();
	updateDOM(source.firstElementChild,target.firstElementChild);
	expect(target.innerHTML).equal(source.innerHTML);
	done();
});
});

