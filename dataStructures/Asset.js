const {theatres} = require('./enums');

exports.Asset = class Asset {
	constructor(name, desc, theatre, cost) {
		this.name = name;
		this.desc = desc;
		this.theatre = theatre;
		this.cost = cost;
	}
};