exports.Loan = class Loan {
	constructor(creditor, debtor, debt, percentage, turns) {
		this.creditor = creditor;
		this.debtor = debtor;
		this.debt = debt;
		
		let v = 1 / (1 + (percentage / 100));
		this.payment = debt * (1 / (v * (1 - v^turns) / (1 - v)));
	}
	
	turn(db) {
		this.debt -= this.payment;
		
		//Loan turn payments are calculated in state calcBalance methods.
		
		if (this.debt < 5) {
			db.removeLoan(this);
		}
	}
};