const {theatres} = require('./enums');

exports.Asset = class Asset {
	constructor(name, desc, theatre, cost) {
		this.name = '';
		this.desc = '';
		this.theatre = theatres.ground;
		this.cost = 0;
	}
};