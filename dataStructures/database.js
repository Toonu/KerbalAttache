

new class Database {
	constructor() {
		this.states = [];
		this.loans = [];
		this.trades = {};
	}
	
	/**
	* @param {State} state
	*/
	addState(state) {
		this.states.push(state);
	}
	
	/**
	* @param {State} state
	*/
	removeState(state) {
		let index = this.states.indexOf(state);
		if (index === -1) {
			throw new Error('NullReferenceException: State not found.');
		}
		this.states.splice(index, 1);
	}
	
	/**
	* @param {Loan} loan
	*/
	addLoan(loan) {
		this.loans.push(loan);
	}
	
	/**
	* @param {Loan} loan
	*/
	removeLoan(loan) {
		let index = this.loans.indexOf(loan);
		if (index === -1) {
			throw new Error('NullReferenceException: State not found.');
		}
		this.states.splice(index, 1);
	}
	
	/**
	* @param {TradeObject} trade
	*/
	addTrade(trade) {
		let id = this.trades.length;
		this.trades[id] = trade;
		trade.id = id;
	}
	
	/**
	* @param {number} id
	*/
	removeTrade(id) {
		this.trades[id].remove();
	}
};