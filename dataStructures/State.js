const {StateAssets} = require('./StateAssets');
const {StateResearch} = require('./StateResearch');
const {assets} = require(`../dataImports/assets.json`);
const discord = require('discord.js');
const {formatCurrency} = require('../utils');



exports.State = class State {
	constructor(name, denomym, colour = 'fffffe', map = 'https://x.com/') {
		this.name = name;
		this.demonym = denomym;
		this._account = 2000000;
		this.balance = 0;
		this.assets = new StateAssets(this);
		this._incomePenaltyCoefficient = 1;
		this.research = new StateResearch(this);
		this._tiles = 5;
		this._colour = colour;
		this._map = map;
	}
	
	/**
	 * Method calculates new account balance based on balance and updates research turn.
	 * @param {exports.Database} db Database to use.
	 */
	turn(db) {
		this.research.turn();
		this.updateBalance(db);
		
		this.account += this.balance;
		this.account = Math.round(this.account);
	}
	
	/**
	 * Method recalculates balance. Used when printing state information or calculating turn.
	 * @param {exports.Database} db Database used in calculating loans into the balance.
	 */
	updateBalance(db) {
		let expenses = 0;
		let income = 0;
		for (const [theatre, item] of Object.entries(this.assets.assets)) {
			// noinspection JSCheckFunctionSignatures
			for (const [type, amount] of Object.entries(item)) {
				if (amount > 0) {
					expenses -= (assets[type].cost / 4) * (0.975 + this.research.technologicalLevels[theatre] / 4) * amount;
				}
			}
		}
		expenses -= this.research.budget;
		if (this.account < 0) {
			this.incomePenaltyCoefficient = 1 + (this.account / 1000000)
		} else {
			this.incomePenaltyCoefficient = 1;
		}
		
		//Tiles income
		// noinspection OverlyComplexArithmeticExpressionJS
		income += (1 + Math.log10(this._tiles) * 100 + this._tiles / 3) * 14300 * this.incomePenaltyCoefficient;
		
		let user = db.getUser(this.name);
		
		//Loans
		for (const loan of db.loans) {
			if (loan.creditor === user.user.id) {
				income += loan.payment;
			} else if (loan.debtor === user.user.id) {
				expenses -= loan.payment;
			}
		}
		
		this.balance = Math.round(income + expenses);
	}
	
	/**
	 * Method converts state information into an embed.
	 * @param {exports.Database} db Database used in calculating balance.
	 * @return {module:"discord.js".MessageEmbed}   returns Discord.MessageEmbed.
	 */
	toEmbed(db) {
		this.updateBalance(db);
		
		let embed = new discord.MessageEmbed()
		.setColor(this._colour)
		.setTitle(`National Bank of ${this.name}`)
		.setURL(this.map) //URL clickable from the title
		.setThumbnail('https://imgur.com/IvUHO31.png')
		.addField('Account:', formatCurrency(this.account))
		.addField('Balance:', formatCurrency(this.balance))
		.addField('Research budget:', formatCurrency(this.research.budget), true)
		.addField('Research Points:', `${new Intl.NumberFormat(db.moneyLocale,
			{minimumSignificantDigits: 3}).format(this.research.RP)} RP`, true)
		.addField('CF', this.research.CF, true)
		.addField('Tiles:', this.tiles, true)
		.setFooter('Made by the Attachè to the United Nations\nThis message will be auto-destructed in 32' +
			' seconds!', 'https://imgur.com/KLLkY2J.png');
		
		if (this.incomePenaltyCoefficient < 1) {
			embed.addField('Penalty:', this.incomePenaltyCoefficient, true);
		}
		return embed;
	};
	
	/**
	 * Method compares two states based on their name.
	 * @param {exports.State} state state to compare this with.
	 * @return {boolean} true if equal.
	 */
	isEqual(state) {
		return state.name === this.name;
	}
	
	//Getters and setters.
	
	get account() {
		return this._account;
	}
	
	set account(value) {
		value = parseInt(value);
		if (isNaN(value)) {
			throw new Error('InvalidTypeException: Value is not a number!');
		} else {
			this._account = value;
		}
	}
	
	get incomePenaltyCoefficient() {
		return this._incomePenaltyCoefficient;
	}
	
	set incomePenaltyCoefficient(value) {
		value = parseInt(value);
		if (isNaN(value)) {
			throw new Error('InvalidTypeException: Value is not a number!');
		} else {
			this._incomePenaltyCoefficient = value;
		}
	}
	
	/**
	 * Method sets new number of tiles for state.
	 * @throws {Error} when trying to set negative amount of tiles.
	 * @param {number} value new tiles value to set.
	 **/
	set tiles(value) {
		if (value >= 0) {
			this._tiles = value;
		} else {
			throw new Error('ArgumentOutOfRangeException: Tiles cannot go into negative numbers. Canceling operation.');
		}
	}
	
	/**
	 * Tiles getter.
	 * @return {number} amount of tiles.
	 */
	get tiles() {
		return this._tiles;
	}
	
	/**
	 * Colour getter.
	 * @return {string} colour hex code 6 characters long and without the #.
	 */
	get colour() {
		return this._colour;
	}
	
	/**
	 * Method sets new state colour. Use without the beggining #.
	 * @throws {Error} when the value is not hex colour six-character code.
	 * @param value colour hex value to set.
	 */
	set colour(value) {
		if (value.length === 6) {
			this._colour = value;
		} else {
			throw new Error('ArgumentOutOfRangeException: Not a colour hex code! Write hex code without a #.');
		}
	}
	
	/**
	 * Method returns state map URL link.
	 * @return {string} map URL link.
	 */
	get map() {
		return this._map;
	};
	
	/**
	 * Method sets state map URL link.
	 * @throws {Error} when the set URL link is not in proper format.
	 * @param value URL link to set the map to.
	 */
	set map(value) {
		if (new RegExp(/https:\/\/drive.google\.com\/file\/d\/.+/).test(value)) {
			this._map = value;
		} else {
			throw new Error('ArgumentException: Not a map URL link!');
		}
	};
};