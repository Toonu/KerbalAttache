const {theatres} = require('./enums');

exports.Asset = class Asset {
	constructor() {
		this.name = '';
		this.desc = '';
		this.theatre = theatres.ground;
		this.cost = 0;
	}
};