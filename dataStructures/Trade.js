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
	
	/**
	 * Method finishes trade by modifying the two DatabaseUsers.
	 * @param {exports.Database} db database.
	 * @throws {Error} when author or recipient are having negative amount of assets or money.
	 */
	finishTrade(db) {
		let author = db.getState(this.author);
		let recipient = db.getState(this.recipient);
		let authorData;
		let recipientData;
		
		//Setting up modified assets or systems data.
		if (this.asset instanceof Asset) {
			authorData = author.assets.assets[this.asset.theatre][this.asset.name];
			recipientData = recipient.assets.assets[this.asset.theatre][this.asset.name];
		} else {
			authorData = author.assets.systems[this.asset.name];
			recipientData = recipient.assets.systems[this.asset.name];
		}
		
		if (this.isSelling) {
			if (recipient.account - this.money < 0) {
				throw new Error(`${recipient.name} has not enough money!`);
			} else if (authorData - this.amount < 0) {
				throw new Error(`${author.name} has not enough assets!`);
			} else {
				author.account += this.money;
				author.assets.assets[this.asset.theatre][this.asset.name] -= this.amount;
				
				recipient.account -= this.money;
				recipient.assets.assets[this.asset.theatre][this.asset.name] += this.amount;
			}
		} else if (author.account - this.money < 0) {
			throw new Error(`${author.name} has not enough money!`);
		} else if (recipientData - this.amount < 0) {
			throw new Error(`${recipient.name} has not enough assets!`);
		} else {
			author.account -= this.money;
			author.assets.systems[this.asset.name] += this.amount;
			
			recipient.account += this.money;
			recipient.assets.systems[this.asset.name] -= this.amount;
		}
	}
};