var doesArrayContain = function(arrayList, item) {
		var length = arrayList.length;

		for(var i = 0; i < length; i++) {
			if (arrayList[i] === item)
				return true;
		}

		return false;
	},
	isExpired = function(expiresDate) {
		return expiresDate < new Date();
	},
	isEmpty= function(item) {
		return !item || item.length === 0;
	};

exports.doesArrayContain = doesArrayContain;
exports.isExpired = isExpired;
exports.isEmpty = isEmpty;