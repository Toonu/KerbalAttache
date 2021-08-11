const {theatres} = require('./enums');

class Unit {
	constructor() {
		this.name = '';
		this.desc = '';
		this.theatre = theatres.ground;
		this.cost = 0;
	}
}