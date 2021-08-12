const {exportFile} = require('../utils');
const {Loan} = require('./Loan');
const {Asset} = require('./Asset');
const {DatabaseUser} = require('./DatabaseUser');
const {Trade} = require('./Trade');
const {State} = require('./State');
const {StateAssets} = require('./StateAssets');
const {StateResearch} = require('./StateResearch');
Discord = require('discord.js');

exports.Database = class Database {
	constructor() {
		const databaseImport = require('../database.json');
		this.turn = -1;
		this.loans = [];
		this.trades = [];
		this.users = [];
		
		for (const loan of databaseImport.loans) {
			loan.creditor = Object.assign(new DatabaseUser(undefined, undefined), loan.creditor);
			loan.debtor = Object.assign(new DatabaseUser(undefined, undefined), loan.debtor);
			this.loans.push(Object.assign(new Loan(), loan));
		}
		for (const trade of databaseImport.trades) {
			trade.author = Object.assign(new DatabaseUser(undefined, undefined), trade.author);
			trade.recipient = Object.assign(new DatabaseUser(undefined, undefined), trade.recipient);
			trade.asset = Object.assign(new Asset(), trade.asset);
			this.addTrade(Object.assign(
				new Trade(undefined, undefined, undefined, undefined, undefined, undefined), trade));
		}
		for (let user of databaseImport.users) {
			let assets = Object.assign(new StateAssets(), user.state.assets);
			let research = Object.assign(new StateResearch(), user.state.research)
			
			let state = Object.assign(new State(), user.state);
			state.assets = assets;
			state.research = research;
			let protoUser = new DatabaseUser(user.user, state, user.notes);
			
			this.users.push(protoUser);
		}
	}
	
	
	/**
	* @param {exports.Trade} trade
	*/
	addTrade(trade) {
		trade.id = this.trades.length;
		this.trades.push(trade);
		this.export();
	}
	
	/**
	* @param {number} id
	*/
	removeTrade(id) {
		let isFailure = true;
		for (let i = 0; i < this.trades.length; i++) {
			if (this.trades[i].id === id) {
				this.trades.splice(i, 1);
				isFailure = false;
				break;
			}
		}
		if (isFailure) {
			throw new Error('Trade does not exist.')
		}
		this.export();
	}
	
	
	addUser(discordUser) {
		this.users.push(discordUser);
		this.export();
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
		this.export();
	}
	
	export() {
		exportFile('database.json', this);
	}
};