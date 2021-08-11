const {NationalAssets} = require('./nationalAssets');
const {NationalResearch} = require('./nationalResearch');
const {assets} = require('../dataImports/assets.json');

exports.State = class State {
	constructor(user, name, denomym, color = 'fffffe', map = 'https://x.com/') {
		this.name = name;
		this.denomym = denomym;
		this.color = color;
		this.map = map;
		this.user = user;
		this.account = 0;
		this.balance = 0;
		this.assets = new NationalAssets();
		this.incomePenaltyCoefficient = 1;
		this.research = new NationalResearch();
		this._tiles = 5;
	}
	
	turn() {
		this.research.turn();
		this.updateBalance();
		this.account += this.balance;
	}
	
	
	updateBalance() {
		let expenses = 0;
		let income = 0;
		for (const [theatre, item] of Object.entries(this.assets)) {
			for (const [type, amount] of Object.entries(item)) {
				if (amount > 0) {
					expenses -= ((assets[type].cost / 4) * 0.975 + this.research.technologicalLevels[theatre] / 4) * amount;
				}
			}
		}
		expenses -= this.research.budget;
		
		//Tiles income
		// noinspection OverlyComplexArithmeticExpressionJS
		income += (1+Math.log10(this._tiles) * 100+this._tiles/3)*14300 * this.incomePenaltyCoefficient;
		
		this.balance = income + expenses;
	}
	
	/**
	* @param {number} value new tiles value to set.
	**/
	set tiles(value) {
		if (value >= 0) {
			this._tiles = value;
		} else {
			throw new Error('ArgumentOutOfRangeException: Tiles cannot be set bellow 0.');
		}
	}
	get tiles() {
		return this._tiles;
	}
};