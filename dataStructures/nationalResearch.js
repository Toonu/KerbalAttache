const {theatres} = require('./enums');
const tt = require('../dataImports/tt.json');

exports.NationalResearch = class NationalResearch {
	constructor() {
		this.RP = 0;
		this.CF = 1;
		this._budget = 0;
		this.previousBudget = 0;
		
		this.unlockedNodesList = {};
		this.technologicalLevels = {};
		this.searchRange = 100;
		this.AEWRange = 0;
		this.ballisticRange = 0;
		this.armour = 200;
		
		for (const theatre of Object.values(theatres)) {
			this.technologicalLevels[theatre] = 0.1;
		}
	}
	
	turn() {
		this.RP += (this._budget / 20000) * this.CF;
		//Increases CF only if budget is not 0 and is under 2.
		if (this._budget === this.previousBudget && this._budget && this.CF < 2) {
			this.CF += 0.1;
		} else if (this._budget !== this.previousBudget) {
			this.CF = 1;
		}
		this.previousBudget = this._budget;
	}
	
	/**
	* @param {number} value
	*/
	set budget(value) {
		if (value >= 0) {
			this._budget = value;
		} else {
			throw new Error('ArgumentOutOfRangeException: Budget cannot be set bellow 0.');
		}
	}
	
	get budget() {
		return this._budget;
	}
	
	/**
	* Method adds node to the researched technologies of the state after checking the prerequistes and amount of RP.
	* @param {string|number} name
	* @param {Node} node
	*/
	unlockNode(name, node) {
		if (this.RP - node.cost < 0) {
			throw new Error('ArgumentOutOfRangeException: Not enough Research Points to unlock the node.');
		}
		
		for (const prerequisite of node.prereq) {
			if (!this.unlockedNodesList[prerequisite]) {
				throw new Error('Prerequisites for the node are not met!');
			}
		}
		
		this.technologicalLevels[node.theatre] += 0.1;
		this.RP -= node.cost;
		
		//Checking for range nodes.
		for (let i = 0; i < node.unlocks.length; i++){
			const unlock = node.unlocks[i];
			if (unlock.includes('AEW Range')) {
				this.AEWRange = parseInt(unlock.substring(0, unlock.indexOf('RU')));
				node.unlocks.splice(i, 1);
				break;
			} else if (unlock.includes('Search Range')) {
				this.searchRange = parseInt(unlock.substring(0, unlock.indexOf('RU')));
				node.unlocks.splice(i, 1);
				break;
			} else if (unlock.includes('mm -')) {
				this.armour = parseInt(unlock.substring(0, unlock.indexOf('mm')));
				node.unlocks.splice(i, 1);
				break;
			} else if (unlock.includes('Ballistic Range')) {
				this.ballisticRange = parseInt(unlock.substring(0, unlock.indexOf('RU')));
				node.unlocks.splice(i, 1);
				break;
			}
		}
		
		this.unlockedNodesList[name] = node;
	}
	
	toArray() {
		let finalArray = [
			[`Maximal armour thickness: ${this.armour}mm.`], [`Maximal indirect fire range: ${this.ballisticRange}RU`],
			[`Maximal radar range: ${this.searchRange}RU`], [`Maximal airborne radar range: ${this.AEWRange}RU`]
		];
		let maximalNodeName = 0;
		
		for (const key of Object.keys(this.unlockedNodesList)) {
			if (key.length > maximalNodeName) {
				maximalNodeName = key.length;
			}
		}
		
		for (const [name, node] of Object.entries(this.unlockedNodesList)) {
			finalArray.push([`[${name.padStart(maximalNodeName)}] Unlocks:`]);
			for (const unlock of node.unlocks) {
				finalArray.push(unlock);
			}
		}
		
		return finalArray;
	}
};