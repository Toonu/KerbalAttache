const {exportFile} = require('../utils');
const {Loan} = require('./Loan');
const {Asset} = require('./Asset');
const {DatabaseUser} = require('./DatabaseUser');
const {Trade} = require('./Trade');
const {State} = require('./State');
const {StateAssets} = require('./StateAssets');
const {StateResearch} = require('./StateResearch');
const {System} = require('./System');
Discord = require('discord.js');

exports.Database = class Database {
	constructor(client) {
		const databaseImport = require('../database.json');
		this.turn = -1;
		this.loans = [];
		this.trades = [];
		this.users = [];
		
		for (const loan of databaseImport.loans) {
			loan.creditor = this.parseUser(client, loan.creditor);
			loan.debtor = this.parseUser(client, loan.debtor);
			this.loans.push(Object.assign(new Loan(), loan));
		}
		for (const trade of databaseImport.trades) {
			trade.author = this.parseUser(client, trade.author);
			trade.recipient = this.parseUser(client, trade.recipient);
			if (trade.asset.theatre === undefined) {
				trade.asset = Object.assign(new System(), trade.asset);
			} else {
				trade.asset = Object.assign(new Asset(), trade.asset);
			}
			
			this.addTrade(Object.assign(
				new Trade(undefined, undefined, undefined, undefined, undefined, undefined), trade));
		}
		for (let user of databaseImport.users) {
			this.users.push(this.parseUser(client, user));
		}
		
		this.export();
	}
	
	parseUser(client, user) {
		let assets;
		let research;
		let state;
		
		if (user.state) {
			assets = Object.assign(new StateAssets(), user.state.assets);
			research = Object.assign(new StateResearch(), user.state.research);
			state = Object.assign(new State(), user.state);
			
			state.assets = assets;
			state.research = research;
		}
		
		let userUser = Object.assign(new Discord.User(client, user.user));
		return new DatabaseUser(userUser, state, user.notes);
	}
	
	getTrade(id) {
		let trade;
		for (trade of this.trades) {
			if (trade.id === id) break;
		}
		return trade;
	}
	
	/**
	 * Method returns state object from user ID or nation name.
	 * @param {string, number} name
	 */
	getState(name) {
		let nation;
		if (isNaN(parseInt(name))) {
			for (nation of this.users) {
				if (nation.id === name) break;
			}
		} else {
			for (nation of this.users) {
				if (nation.state.name === name) break;
			}
		}
	}
	
	
	/**
	* @param {exports.Trade} trade
	*/
	addTrade(trade) {
		trade.id = this.trades.length;
		this.trades.push(trade);
	}
	
	/**
	* @param {number} id
	*/
	removeTrade(id) {
		let isFailure = true;
		let trade;
		for (let i = 0; i < this.trades.length; i++) {
			if (this.trades[i].id === id) {
				trade = this.trades.splice(i, 1);
				isFailure = false;
				break;
			}
		}
		if (isFailure) {
			throw new Error('Trade does not exist.')
		}
		return trade[0];
	}
	
	
	addUser(discordUser) {
		this.users.push(discordUser);
	}
	
	
	removeUser(discordUser) {
		//Deletion
		for (let i = 0; i < this.users.length; i++) {
			if (this.users[i].isEqual(discordUser)) {
				this.users.splice(i, 1);
				break;
			}
		}
		//Trades
		for (let i = 0; i < this.trades.length; i++) {
			if (this.trades[i].author.isEqual(discordUser) || this.trades[i].recipient.isEqual(discordUser)) {
				this.trades.splice(i, 1);
			}
		}
		//Loans
		for (let i = 0; i < this.loans.length; i++) {
			if (this.loans[i].creditor.isEqual(discordUser) || this.loans[i].debtor.isEqual(discordUser)) {
				this.loans.splice(i, 1);
			}
		}
	}
	
	export() {
		exportFile('database.json', this);
	}
};