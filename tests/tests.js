var assert = require('assert');
var keccak256 = require('../index.js');

var hash = keccak256.create();
hash.update("hello");
console.log(hash.digest());
assert.equal(hash.digest(), '1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8', "Hash of Hello FAILED!!");


var hash = keccak256.create();
hash.update({
	text: "hello",
	value: 258,
	value3: -258,
	value2: 10.3,
	super_value: {
		type: 'uint64',
		data: 666
	}
});
console.log(hash.digest());
