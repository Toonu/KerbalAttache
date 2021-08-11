class Loan {
	constructor(creditor, debtor, debt, percentage, turns) {
		this.creditor = creditor;
		this.debtor = debtor;
		this.debt = debt;
		this.percentage = percentage;
		this.turns = turns;
		
		this.v = 1/(1+(percentage/100));
		this.k = debt * (1/(this.v*(1-this.v^turns)/(1-this.v)));
	}
	
	turn() {
		this.debt -= this.k;
		this.creditor.account += this.k;
		this.debtor.account -= this.k;
	}
}