const {State} = require('./dataStructures/state');
const {nodes} = require('./dataImports/tt.json');
const {theatres} = require('./dataStructures/enums');

exports.start = async function start() {
	let state = new State('Test', 'Test');
	
	state.research.RP = 1000;
	state.research.unlockNode('50armour', nodes['50armour']);
	state.assets.addAsset(theatres.ground, 'MBT', 10);
	state.assets.addAsset(theatres.aerial, 'MM', 5);
	state.updateBalance();

	console.log('x');
};
