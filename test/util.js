var expect = require('chai').expect,
	util = require('../authServer/util');

describe('doesArrayContain', function() {
	var testArray = ['item1', 'item2', 'item3', 'item4'],
		itemNotInArray = 'item5',
		itemInArray = 'item3';

	it ('returns true when an array contains an expected item', function() {
		expect(util.doesArrayContain(testArray, itemInArray)).to.be.true;
	});

	it ('returns false when an array does not contain the expected item', function() {
		expect(util.doesArrayContain(testArray, itemNotInArray)).to.be.false;
	});

	it ('returns false when a null array is passed in', function() {
		expect(util.doesArrayContain(null, itemNotInArray)).to.be.false;
	});

	it ('returns false when an undefined array is passed in', function() {
		expect(util.doesArrayContain(null, itemNotInArray)).to.be.false;
	});

	it ('returns false when a null item passed in', function() {
		expect(util.doesArrayContain(testArray, null)).to.be.false;
	});

	it ('returns false when an undefined item passed in', function() {
		expect(util.doesArrayContain(testArray, undefined)).to.be.false;
	});
});