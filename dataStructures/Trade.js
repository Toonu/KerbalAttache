const {formatCurrency} = require('../utils');
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
	 * Method compares two trades to find if they are identical based on their ID.
	 * @param {exports.Trade} trade
	 * @return {boolean}
	 */
	isEqual(trade) {
		return trade.id === this.id;
	}
	
	/**
	 * Method creates string representation of a trade.
	 * @param {exports.Database} db database to use.
	 * @return {string} representation of a trade.
	 */
	toString(db) {
		let authorUser = db.getUser(this.author);
		let recipientUser = db.getUser(this.recipient);
		return `ID[${this.id}] ${authorUser.state.name} | ${authorUser.user.username} ${this.isSelling ? '-' : `+`}[${this.amount} ${this.asset.name}] > ${recipientUser.state.name} | `
			+ `${recipientUser.user.username} ${this.isSelling ? '+' : `-`}[${this.amount} ${this.asset.name}] for ${formatCurrency(this.money)} paid to ${this.isSelling ? authorUser.state.name : recipientUser.state.name}.`
	}
	
	/**
	 * Method finishes trade by modifying the two DatabaseUsers.
	 * @param {exports.Database} db database.
	 * @throws {Error} when author or recipient are having negative amount of assets or money.
	 */
	finishTrade(db) {
		let author = db.getState(this.author);
		let recipient = db.getState(this.recipient);
		
		author.assets.modify(this.asset, this.isSelling ? -this.amount : this.amount, author, true);
		recipient.assets.modify(this.asset, this.isSelling ? this.amount : -this.amount, recipient, true);
		author.account += this.isSelling ? this.money : -this.money;
		recipient.account -= this.money ? -this.money : this.money;
		
		if (this.isSelling && recipient.account < 0) {
			throw new Error('InvalidOperationException: Recipient has not enough money!');
		} else if (author.account < 0) {
			throw new Error('InvalidOperationException: Author has not enough money!');
		}
		
		db.export();
	}
};