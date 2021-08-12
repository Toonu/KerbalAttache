const {System} = require('./System');
const {Asset} = require('./Asset');
exports.Trade = class Trade {
	/**
	* @param author
	* @param recipient
	* @param {number} amount
	* @param {number} money
	* @param {exports.Asset | exports.System} asset
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
	
	finishTrade(db) {
		let author = db.getState(this.author);
		let recipient = db.getState(this.recipient);
		
		if (this.isSelling) {
			author.account += this.money;
			recipient.account -= this.money;
		} else {
			recipient.account += this.money;
			author.account -= this.money;
		}
		
		if (this.asset instanceof Asset) {
			author.assets.assets[this.asset.theatre][this.asset.name] -= this.amount;
			recipient.assets.assets[this.asset.theatre][this.asset.name] += this.amount;
		} else {
			author.assets.systems[this.asset.name] -= this.amount;
			recipient.assets.systems[this.asset.name] += this.amount;
		}
	}
};