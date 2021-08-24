const {formatCurrency} = require('../utils');
// noinspection OverlyComplexArithmeticExpressionJS
exports.Loan = class Loan {
	constructor(creditor, debtor, debt, percentage, turns) {
		this.creditor = creditor;
		this.debtor = debtor;
		this.debt = debt;
		
		let v = 1 / (1 + (percentage / 100));
		this.payment = debt * (1 / (v * (1 - Math.pow(v, turns)) / (1 - v)));
	}
	
	turn(db) {
		this.debt -= this.payment;
		
		//Loan turn payments are calculated in state calcBalance methods.
		
		if (this.debt < 5) {
			db.removeLoan(this);
			return false;
		}
		return true;
	}
	
	toString(db) {
		let debtor = db.getUser(this.debtor);
		let creditor = db.getUser(this.creditor);
		return `${debtor.state.name} | ${debtor.user.username} owes the ${creditor.state.name} | `
			+ `${creditor.user.username} [${formatCurrency(this.debt)}] on ${formatCurrency(this.payment)} interest per turn.`
	}
};