const {exportFile, log} = require('../utils');
const {Loan} = require('./Loan');
const {Asset} = require('./Asset');
const {DatabaseUser} = require('./DatabaseUser');
const {Trade} = require('./Trade');
const {State} = require('./State');
const {StateAssets} = require('./StateAssets');
const {StateResearch} = require('./StateResearch');
const {System} = require('./System');
const {setCellArray} = require('../sheet');
Discord = require('discord.js');

exports.Database = class Database {
	constructor(client) {
		const databaseImport = require(`../database.json`);
		this.turn = databaseImport.turn;
		this.prefix = databaseImport.prefix;
		this.sheet = databaseImport.sheet;
		this.money = databaseImport.money;
		this.moneyLocale = databaseImport.moneyLocale;
		this.era = databaseImport.era;
		this.tabMain = databaseImport.tabMain;
		this.tabSubmissions = databaseImport.tabSubmissions;
		this.tabSubmissionsEnd = databaseImport.tabSubmissionsEnd;
		this.assetsFile = databaseImport.assetsFile;
		this.channelReporting = databaseImport.channelReporting;
		this.channelBattles = databaseImport.channelBattles;
		this.channelAnnounce = databaseImport.channelAnnounce;
		this.roleHeadOfState = databaseImport.roleHeadOfState;
		this.roleModerator = databaseImport.roleModerator;
		this.administrators = databaseImport.administrators;
		this.developers = databaseImport.developers;
		
		
		this.loans = [];
		this.trades = [];
		this.users = [];
		
		for (const loan of databaseImport.loans) {
			this.loans.push(Object.assign(new Loan(), loan));
		}
		for (const trade of databaseImport.trades) {
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
	
	/**
	 * Method parses user Objects into class instances.
	 * @param client                        Discord client.
	 * @param {exports.DatabaseUser} user   Discord user to parse.
	 * @return {exports.DatabaseUser}       returns DatabaseUser.
	 */
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
	
	/**
	 * Method finds and returns trade with specified id.
	 * @param id searched trade ID.
	 * @return {undefined, exports.Trade} returns undefined if trade is not found.
	 */
	getTrade(id) {
		let result;
		let isFound = false;
		for (result of this.trades) {
			if (result.id === id) {
				isFound = true;
				break;
			}
		}
		return isFound ? result : undefined;
	}
	
	/**
	 * Method finds and returns user based on his id or his state name.
	 * @param {string, number, module:"discord.js".User} nameId   User's nation name or discord id.
	 * @return {exports.DatabaseUser, undefined}   returns DatabaseUser object or undefined if not found.
	 */
	getUser(nameId) {
		let result;
		let isFound = false;
		if (nameId instanceof Discord.User) {
			for (result of this.users) {
				if (result.isEqual(nameId)) {
					isFound = true;
					break;
				}
			}
		} else if (!isNaN(parseInt(nameId))) {
			for (result of this.users) {
				if (result.user.id === nameId) {
					isFound = true;
					break;
				}
			}
		} else {
			for (result of this.users) {
				if (result.state && result.state.name === nameId) {
					isFound = true;
					break;
				}
			}
		}
		return isFound ? result : undefined;
	}
	
	/**
	 * Method finds and returns State object from user ID or user's state name.
	 * @param {string, number, module:"discord.js".User} nameId Discord user ID or State name.
	 * @returns {undefined, exports.State} returns State object or undefined if not found.
	 */
	getState(nameId) {
		let result = this.getUser(nameId);
		if (!result) return undefined;
		return result.state ? result.state : undefined;
	}
	
	/**
	 * Method adds trade to the database.
	 * @param {exports.Trade} trade trade to add.
	 */
	addTrade(trade) {
		trade.id = this.trades.length;
		this.trades.push(trade);
	}
	
	/**
	 * Method deletes trade with specified ID.
	 * @param id trade ID to delete.
	 * @returns {boolean} returns true if successful.
	 */
	removeTrade(id) {
		let isFound = false;
		for (let i = 0; i < this.trades.length; i++) {
			if (this.trades[i].id === id) {
				this.trades.splice(i, 1);
				isFound = true;
				break;
			}
		}
		return isFound;
	}
	
	/**
	 * Method adds user to the database.
	 * @param {exports.DatabaseUser} databaseUser user to add.
	 */
	addUser(databaseUser) {
		this.users.push(databaseUser);
	}
	
	/**
	 * Method removes user and all his loans and trades.
	 * @param {module:"discord.js".User} discordUser Discord user to remove.
	 * @return {boolean} returns true if user was found and removed. Else false.
	 */
	removeUser(discordUser) {
		let isFound = false;
		//Deletion
		for (let i = 0; i < this.users.length; i++) {
			if (this.users[i].isEqual(discordUser)) {
				this.users.splice(i, 1);
				isFound = true;
				break;
			}
		}

		//Removing user trades
		for (let i = 0; i < this.trades.length; i++) {
			if (this.trades[i].author === discordUser.id || this.trades[i].recipient === discordUser.id) {
				this.trades.splice(i, 1);
				i--;
			}
		}
		//Removing user loans
		for (let i = 0; i < this.loans.length; i++) {
			if (this.loans[i].creditor === discordUser.id || this.loans[i].debtor === discordUser.id) {
				this.loans.splice(i, 1);
				i--;
			}
		}
		return isFound;
	}
	
	/**
	 * Method removes loan from the database.
	 * @param {exports.Loan} loan loan to remove.
	 * @returns {boolean} returns true if successful.
	 */
	removeLoan(loan) {
		let isFound = false;
		for (let i = 0; i < this.loans.length; i++) {
			if (this.loans[i] === loan) {
				this.loans.splice(i, 1);
				isFound = true;
				break;
			}
		}
		return isFound;
	}
	
	/**
	 * Method exports database into database.json.
	 */
	export() {
		exportFile('database.json', this);
	}
	
	exportSheet() {
		let headerRow = [];
		let array = [];
		let firstCycle = true;
		for (const user of this.users) {
			if (!user.state) {
				continue;
			}
			
			let userRow = [];
			userRow.push(user.state.name, user.state.account, user.state.balance);
			if (firstCycle)
				headerRow.push('Nation', 'Account', 'Balance');
			for (const theatre of Object.values(user.state.assets.assets)) {
				// noinspection JSCheckFunctionSignatures
				for (const [name, item] of Object.entries(theatre)) {
					userRow.push(item);
					if (firstCycle)
						headerRow.push(name);
				}
			}
			for (const [name, item] of Object.entries(user.state.assets.systems)) {
				userRow.push(item);
				if (firstCycle)
					headerRow.push(name);
			}
			if (firstCycle)
				headerRow.push('AerialCF', 'GroundCF', 'NavalCF', 'SpaceCF', 'IndustrialCF');
			for (const value of Object.values(user.state.research.technologicalLevels)) {
				userRow.push(value);
			}
			
			if (firstCycle)
				headerRow.push('Penalty', 'RP', 'Budget', 'OldBudget', 'Tiles');
			
			userRow.push(user.state.incomePenaltyCoefficient, user.state.research.RP, user.state.research.budget,
				user.state.research.previousBudget, user.state.tiles);
			
			if (firstCycle)
				array.push(headerRow);
			array.push(userRow);
			
			firstCycle = false;
		}
		
		setCellArray('A1', array, this.tabMain).catch(r => log(r));
	}
};