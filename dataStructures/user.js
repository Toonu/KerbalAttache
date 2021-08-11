
class User {
	
	/**
	* @param {module:"discord.js".User} user
	* @param {string} notes
	* @param {State} state
	*/
	constructor(user, notes = undefined, state = undefined) {
		this.user = user;
		this.state = state;
		this.notes = notes;
	}
}