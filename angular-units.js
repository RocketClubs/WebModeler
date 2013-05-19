angular.module('angularUnits', [])
	.service('unitsConverter', [function() {
		var conversionMultipliers = {
			'mm': 1.0,
			'cm': 0.1,
			'm': 0.001,
			'km': 0.000001,
			'in': 0.0393701,
			'ft': 0.00328084,
			'yd': 0.00109361,
			'mi': 0.000000621371
		};
		var service = {
			convert: function (value, fromUnit, toUnit) {
				if (toUnit === undefined) {
					toUnit = fromUnit;
					fromUnit = 'mm';
				}
				var fromMultipler = conversionMultipliers[fromUnit];
				if (fromMultipler === undefined) {
					throw "The unit '" + fromUnit + "' is not recognized.";
				}
				var toMultipler = conversionMultipliers[toUnit];
				if (toMultipler === undefined) {
					throw "The unit '" + toUnit + "' is not recognized.";
				}
				var convertMultiplier = toMultipler / fromMultipler;
				return value * convertMultiplier;
			}
		};
		return service;
	}])
    .filter('units', ['unitsConverter', function (unitsConverter) {
        return function (input, desiredUnits) {
            return unitsConverter.convert(input, desiredUnits).toFixed(2) + ' ' + desiredUnits;
        };
    }]);