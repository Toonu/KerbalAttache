const Discord = require('discord.js');

exports.DatabaseUser = class DatabaseUser {
	
	/**
	 * @param {module:"discord.js".User} user
	 * @param {string} notes
	 * @param {exports.State} state
	 */
	constructor(user, state = undefined, notes = ' ') {
		this.user = user;
		this.state = state;
		this.notes = notes;
	}
	
	/**
	 * @param {exports.DatabaseUser | module:"discord.js".User} comparedUser
	 * @return {boolean} true if users are the same.
	 */
	isEqual(comparedUser) {
		if (comparedUser instanceof Discord.User) {
			return comparedUser.id === this.user.id;
		}
		return comparedUser.user.id === this.user.id;
	}
};