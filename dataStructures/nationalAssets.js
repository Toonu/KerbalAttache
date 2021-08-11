const {theatres} = require('./enums');
const {assetsFile} = require('../config.json');
const {assets} = require(`../dataImports/${assetsFile}`);

exports.NationalAssets = class NationalAssets {
	constructor() {
		for (const theatre of Object.values(theatres)) {
			this[theatre] = {};
		}
		for (const [name, asset] of Object.entries(assets)) {
			this[asset.theatre][name] = 0;
		}
	}
	
	addAsset(theatre, type, amount) {
		this[theatre][type] += amount;
	}
};