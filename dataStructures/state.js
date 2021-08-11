class State {
	constructor(name, denomym) {
		this.name = name;
		this.denomym = denomym;
		this.account = 0;
		this.balance = 0;
		this.assets = {};
		this.incomePenaltyCoefficient = 1;
		this.research = new NationalResearch();
		this.tiles = 5;
	}
}