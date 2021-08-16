const {theatres} = require('./enums');
const {assets, systems} = require(`../dataImports/assets.json`);
const discord = require('discord.js');
const {System} = require('./System');

exports.StateAssets = class StateAssets {
	constructor() {
		this.systems = {};
		this.assets = {};
		
		for (const theatre of Object.values(theatres)) {
			this.assets[theatre] = {};
		}
		for (const [name, asset] of Object.entries(assets)) {
			this.assets[asset.theatre][name] = 0;
		}
		for (const name of Object.keys(systems)) {
			this.systems[name] = 0;
		}
	}
	
	
	/**
	 * Method adds or removes amount of assets or systems and accounts their price onto the state account.
	 * @param {exports.Asset, exports.System} asset
	 * @param {number} amount
	 * @param {exports.State} state
	 * @param {boolean} ignorePrice true if price is ignored and not accounted.
	 * @throws {Error} if nation assets, systems or account money go into negative numbers.
	 */
	modify(asset, amount, state, ignorePrice = false) {
		if (asset instanceof System) {
			this.systems[asset.name] += amount;
			if (this.systems[asset.name] < 0) {
				this.systems[asset.name] -= amount;
				throw new Error(`InvalidOperationException: You cannot go into ${this.systems[asset.name]} of systems`);
			}
		} else {
			this.assets[asset.theatre][asset.name] += amount;
			if (this.assets[asset.theatre][asset.name] < 0) {
				this.assets[asset.theatre][asset.name] -= amount;
				throw new Error(`InvalidOperationException: You cannot go into ${this.assets[asset.theatre][asset.name]} of systems`);
			}
		}
		if (!ignorePrice) {
			state.account -= asset.cost * amount * (amount < 0 ? 0.7 : 1);
			if (state.account < 0) {
				throw new Error('Warning: You went bancrupt with your money!');
			}
		}
	}
	
	toEmbeds(state) {
		let embeds = [createEmbed(state, 'Aerial vehicles'), createEmbed(state, 'Ground vehicles'),
			createEmbed(state, 'Naval vehicles'), createEmbed(state, 'Space vehicles'),
			createEmbed(state,'Systems')];
		
		//Techs
		for (const [theatre, technologicalLevel] of Object.entries(state.research.technologicalLevels)) {
			embeds[theatre].addField('Advancement level:', `\`\`\`ini\n[${technologicalLevel}]\`\`\``);
		}
		//Systems and assets
		for (const [name, amount] of Object.entries(this.systems)) {
			if (amount !== 0) {
				embeds[4].addField(name, amount, true);
			}
		}
		for (let [theatre, units] of Object.entries(this.assets)) {
			theatre = parseFloat(theatre);
			// noinspection JSCheckFunctionSignatures
			for (const [name, amount] of Object.entries(units)) {
				if (amount !== 0) {
					embeds[theatre].addField(name, amount, true);
				}
			}
		}

		let embedExport = [];
		
		for (let i = 0; i < embeds.length; i++) {
			if (embeds[i].fields.length !== 1) {
				embedExport.push(embeds[i]);
			}
		}
		
		return embedExport;
	}
};


function createEmbed(state, roster) {
	return new discord.MessageEmbed()
	.setColor(state.colour)
	.setTitle(`${roster} roster of ${state.name}`)
	.setURL(state.map)
	.setThumbnail('https://imgur.com/IvUHO31.png')
	.setFooter('Made by the Attachè to the United Nations. (Link in header)' +
		'                                                                               .',
		'https://imgur.com/KLLkY2J.png');
}