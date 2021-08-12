const {theatres} = require('./enums');
const {assetsFile} = require('../config.json');
const {assets, systems} = require(`../dataImports/${assetsFile}`);
const discord = require('discord.js');

exports.StateAssets = class StateAssets {
	constructor() {
		this.systems = {};
		this.assets = {};
		
		for (const theatre of Object.values(theatres)) {
			this.assets[theatre] = {};
		}
		for (const [name, asset] of Object.entries(assets)) {
			this.assets[asset.theatre][name] = 1;
		}
		for (const name of Object.keys(systems)) {
			this.systems[name] = 1;
		}
	}
	
	
	/**
	* Method adds or removes amount of assets.
	* @param {number} theatre
	* @param {string} assetName
	* @param {number} amount
	*/
	modifyAssets(theatre, assetName, amount) {
		this.assets[theatre][assetName] += amount;
	}
	
	/**
	* Method adds or removes amount of systems.
	* @param {number} systemName
	* @param {number} amount
	*/
	modifySystems(systemName, amount) {
		this.systems[systemName] += amount;
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
			embeds[4].addField(name, amount, true);
		}
		for (let [theatre, units] of Object.entries(this.assets)) {
			theatre = parseFloat(theatre);
			// noinspection JSCheckFunctionSignatures
			for (const [name, amount] of Object.entries(units)) {
				embeds[theatre].addField(name, amount, true);
			}
		}
		
		return embeds;
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