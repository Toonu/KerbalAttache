const {database} = require('./database');

exports.Trade = class Trade {
	/**
	* @param {exports.DatabaseUser} author
	* @param {exports.DatabaseUser} recipient
	* @param {number} amount
	* @param {number} money
	* @param {exports.Asset} asset
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
	
	/**
	 *
	 * @param {exports.Trade} trade
	 * @return {boolean}
	 */
	isEqual(trade) {
		return trade.id === this.id;
	}
	
	finishTrade() {
		this.isSelling ? this.author.state.account : this.recipient.state.account += this.money;
		this.isSelling ? this.recipient.state.account : this.author.state.account -= this.money;
		
		this.isSelling ? this.author.state.assets[asset.theatre][asset.name] : this.recipient.state.account[asset.theatre][asset.name] -= this.amount;
		this.isSelling ? this.recipient.state.assets[asset.theatre][asset.name] : this.author.state.account[asset.theatre][asset.name] += this.amount;
		
		database.removeTrade(this.id);
	}
};