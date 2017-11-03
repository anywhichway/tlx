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

var primitiveUnion = unionizor(),
	objectUnion = unionizor(true),
	keyedObjectUnion = unionizor("o");

var o1 = {o:1},
	o2 = {o:2},
	o3 = {o:3},
	o4 = {o:4};

describe("Test",function() {
	it("primitive",function() {
		var result = primitiveUnion([3,1,2,3],[3,"2",4]);
		expect(result.length).to.equal(5);
	});
	it("lodash primitive",function() {
		var result = _.union([3,1,2],[3,"2",4]);
		expect(result.length).to.equal(5);
	});
	it("object with primitives",function() {
		var result = objectUnion([3,1,2,3],[3,"2",4]);
		expect(result.length).to.equal(5);
	});
	it("objects",function() {
		var result = objectUnion([o3,o1,o2,o3],[o3,"2",o4]);
		expect(result.length).to.equal(5);
	});
	it("lodash objects",function() {
		var result = _.union([o3,o1,o2,o3],[o3,"2",o4]);
		expect(result.length).to.equal(5);
	});
	it("keyed objects",function() {
		var result = keyedObjectUnion([o3,o1,o2,o3],[o3,"2",o4]);
		expect(result.length).to.equal(5);
	});
});