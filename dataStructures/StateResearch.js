const {theatres} = require('./enums');
const cfg = require('./../config.json');
const tt = require('../dataImports/tt.json');

exports.StateResearch = class StateResearch {
	constructor() {
		this.RP = 0;
		this._CF = 1;
		this._budget = 0;
		this.previousBudget = 0;
		
		this.unlockedNodesList = ['40search', '50armour'];
		this.technologicalLevels = {};
		this.searchRange = 100;
		this.AEWRange = 0;
		this.ballisticRange = 0;
		this.armour = 200;

		for (const theatre of Object.values(theatres)) {
			this.technologicalLevels[theatre] = 0.1;
		}
	}
	
	/**
	 * Method calculates new RP based on researchBudget and new CF based on previousBudget. Finally it saves new
	 * budget as previous Budget.
	 */
	turn() {
		this.RP = parseFloat((this.RP + ((this._budget / 20000) * this.CF)).toFixed(2));
		//Increases CF only if budget is not 0 and is under 2.
		if (this._budget === this.previousBudget && this._budget && this.CF < 2) {
			this.CF = parseFloat((this.CF + 0.1).toFixed(1));
		} else if (this._budget !== this.previousBudget) {
			this.CF = 1;
		}
		this.previousBudget = this._budget;
	}
	
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
	
	get CF() {
		return this._CF;
	}
	
	set CF(value) {
		if (!isNaN(parseInt(value))) {
			this._CF = value;
		}
	}
	
	/**
	 * Method adds node to the researched technologies of the state after checking the prerequistes.
	 * @param {exports.TechNode} node node to unlock.
	 */
	unlockNode(node) {
		//Validating input data.
		if (node.name.substring(0, 2) > cfg.era || (node.name.startsWith('early') && 50 > cfg.era)) {
			throw new Error('Node is too futuristic!');
		} else if (this.RP - node.cost < 0) {
			throw new Error('ArgumentOutOfRangeException: Not enough Research Points to unlock the node.');
		} else if (this.unlockedNodesList.includes(node.name)) {
			throw new Error('Node is already unlocked!');
		}
		
		for (const prerequisite of node.prereq) {
			if (!this.unlockedNodesList.includes(prerequisite)) {
				throw new Error('Prerequisites for the node are not met!');
			}
		}
		
		this.technologicalLevels[node.theatre] += 0.1;
		this.technologicalLevels[node.theatre] = parseFloat(this.technologicalLevels[node.theatre].toFixed(1));
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
		
		this.unlockedNodesList.push(node.name);
	}
	
	/**
	 * Method turns the unlocked nodes into array or arrays containing unlocked technologies of the state.
	 * @returns {string[Array][string]} returns array with each unlocked item on a new line.
	 */
	toArray() {
		let tt = require('../dataImports/tt.json');
		
		let finalArray = [
			[`Maximal armour thickness:     ${`[${this.armour}]`.padStart(5)}mm`],
			[`Maximal indirect fire range:  ${`[${this.ballisticRange}]`.padStart(5)}RU`],
			[`Maximal radar range:          ${`[${this.searchRange}]`.padStart(5)}RU`],
			[`Maximal airborne radar range: ${`[${this.AEWRange}]`.padStart(5)}RU`],
			[`\n\n[Unlocked Nodes and their technologies]\n`]
		];
		
		for (const name of this.unlockedNodesList) {
			finalArray.push([`\n[${name}] Unlocks:`]);
			tt.nodes[name].unlocks.forEach(unlock => finalArray.push(unlock));
		}
		
		return finalArray;
	}
};