const cfg = require('./../config.json');
const {database} = require('./database');

class TradeObject {
	/**
	* @param {State} author
	* @param {State} recipient
	* @param {number} amount
	* @param {number} money
	* @param {Unit} asset
	* @param {boolean} isSelling
	*/
	constructor(author, recipient, amount, money, asset, isSelling) {
		this.id = -1;
		this.author = author;
		this.recipient = recipient;
		this.amount = amount;
		this.money = money;
		this.asset = asset;
		this.isSelling = isSelling;
	}
	
	finishTrade() {
		this.isSelling ? this.author.account : this.recipient.account += this.money;
		this.isSelling ? this.recipient.account : this.author.account -= this.money;
		
		this.isSelling ? this.author.assets[asset.theatre][asset.name] : this.recipient.account[asset.theatre][asset.name] -= this.amount;
		this.isSelling ? this.recipient.assets[asset.theatre][asset.name] : this.author.account[asset.theatre][asset.name] += this.amount;
		
		database.removeTrade(this.id);
	}
}