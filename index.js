const internal_keccak256 = require('js-sha3').keccak256;
const BN = require('bn.js');
var utf8 = require('utf8');

(function () {
	'use strict';

	function Keccak256() {
		var hash = internal_keccak256.create();
		var _that = this;

		//public methods
		this.update = function (data) {
			if (typeof data === 'string') {
				if (data.substr(0, 2).toLocaleLowerCase() == '0x') {
					_doUpdate(data.substr(2), 'hex');
				}
				else {
					_doUpdate(data, 'string');
				}
			}
			else if (typeof data === 'object') {
				if (Object.prototype.toString.call(data) === '[object Array]') {
					for (var i = 0; i < data.length; i++) {
						_that.update(data[i]);
					}
				}
				else {
					if (typeof data.type === 'string' && typeof data.data !== 'undefined') {
						_doUpdate(data.data, data.type);
					}
					else {
						for (var prop in data) {
							_that.update(data[prop]);
						}	
					}
				}
			}
			else if (typeof data === 'number') {
				_doUpdate(data, 'number');
			}
			else {
				throw new Error("Unsupported type");
			}
		};

		this.digest = function() {
			return hash.hex();
		};

		this.digestAsArray = function() {
			return str_to_hex(hash.hex());
		};

		//private methods
		var _doUpdate = function(data, _type) {
			if (_type == 'string') {
				//convert string to UTF-8 and then to hex
				_doUpdate(utf8ToHex(data), 'hex');
			}
			else if (_type == 'hex') {
				if (data.length > 0) {
					hash.update(str_to_hex(data));
				}
			}
			else if (_type == 'number') {
				//convert number to Big Number if needed
				if (typeof data === 'number') {
					data = new BN(data);
				}
				else if (!isBN(data)) {
					throw new Error("Not a BigNumber");
				}
				//update
				_doUpdate(data, 'int256');
			}
			else if (_type.substr(0, 4) == 'uint') {
				//get target size
				var size = getIntUintSize(_type.substr(4));
				//convert number to Big Number if needed
				if (typeof data === 'number') {
					data = new BN(data);
				}
				else if (!isBN(data)) {
					throw new Error("Not a BigNumber");
				}
				if (data.isNeg()) {
					throw new Error("Type 'uint' cannot be negative");
				}
				//convert to hex
				data = data.toString(16);
				if (data.length & 1) {
					data = "0" + data;
				}
				data = reverse_hex(data);
				//truncate trailing zeros
				data = data.replace(/0+$/, '');
				//check if the hexa number fits into destination size
				if (data.length > size / 4) {
					throw new Error("Overflow");
				}
				//complete the string with zeros at the right
				data += string_repeat("0", size / 4 - data.length);
				//update
				_doUpdate(data, 'hex');
			}
			else if (_type.substr(0, 3) == 'int') {
				var isNeg;

				//get target size
				var size = getIntUintSize(_type.substr(3));
				//convert number to Big Number if needed
				if (typeof data === 'number') {
					data = new BN(data);
				}
				else if (!isBN(data)) {
					throw new Error("Not a BigNumber");
				}
				isNeg = data.isNeg();
				if (isNeg) {
					data = data.toTwos(256);
				}
				//convert to hex
				data = data.toString(16);
				if (data.length & 1) {
					if (!isNeg) {
						data = "0" + data;
					}
					else {
						data = "F" + data;
					}
				}
				data = reverse_hex(data).toLocaleLowerCase();
				//process depending on sign
				if (!isNeg) {
					//truncate trailing zeros
					data = data.replace(/0+$/, '');
					//check if the hexa number fits into destination size
					if (data.length > size / 4) {
						throw new Error("Overflow");
					}
					//complete the string with zeros at the right
					data += string_repeat("0", size / 4 - data.length);
				}
				else {
					//truncate trailing "F"s
					data = data.replace(/f+$/, '');
					//check if the hexa number fits into destination size
					if (data.length > size / 4) {
						throw new Error("Overflow");
					}
					//complete the string with "F"s at the right
					data += string_repeat("f", size / 4 - data.length);
				}
				//update
				_doUpdate(data, 'hex');
			}
			else {
				throw new Error("Unsupported type");
			}
		};
	}

	var isBN = function (object) {
		return object instanceof BN || (object && object.constructor && object.constructor.name === 'BN');
	};

	var utf8ToHex = function (str) {
		var hex = "";

		str = utf8.encode(str);
		str = str.replace(/^(?:\u0000)*/,'');
		str = str.split("").reverse().join("");
		str = str.replace(/^(?:\u0000)*/,'');
		str = str.split("").reverse().join("");

		for (var i = 0; i < str.length; i++) {
			var code = str.charCodeAt(i);
			hex += ("00" + code.toString(16)).slice(-2);
		}
		return hex;
	};

	var getIntUintSize = function (str) {
		var _size;

		if (str.length == 0)
			return 256;

		if (/^\d+$/.test(str) == false) {
			throw new Error("Unsupported type"); 
		}

		try {
			_size = parseInt(str);
		}
		catch (e) {
			throw new Error("Unsupported type"); 
		}
		if (_size < 8 || _size > 256 || (_size % 8) != 0)
			throw new Error("Unsupported type"); 
		return _size;
	}

	var string_repeat = function (pattern, count) {
		if (count < 1)
			return '';
		var result = '';
		while (count > 1) {
			if (count & 1) {
				result += pattern;
			}
			count >>>= 1;
			pattern += pattern;
		}
		return result + pattern;
	}

	var str_to_hex = function (str) { 
		var result = [];
		for (var i = 0; i < str.length; i += 2) { 
			result.push(parseInt(str.substr(i, 2), 16));
		}
		return result;
	}

	var reverse_hex = function (str) { 
		var result = [];
		for (var i = 0; i < str.length; i += 2) { 
			result.push(str.substr(str.length - i - 2, 2));
		}
		return result.join('');
	}

	//----------------

	var methods = {
		create: function () {
			return new Keccak256();
		}
	};

	if (typeof module === 'object' && module.exports) {
		module.exports = methods;
	}
	if (typeof define === 'function' && define.amd) {
		define(function () {
			return methods;
		});
	}
})();
