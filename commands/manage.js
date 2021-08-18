const {ping, messageHandler, report} = require("../utils");
const {prefix} = require('../database.json');
const {nodes} = require('../dataImports/tt.json');
const {systems, assets} = require('../dataImports/assets.json');
const {findAsset} = require('../sheet');

// noinspection JSUnusedLocalSymbols
module.exports = {
	name: 'manage',
	description: 'Command for editing states by the moderators.',
	args: 3,
	usage: `${prefix}manage [USER] [ITEM] [VALUE]

    ITEMS:
    \`\`\`ini
    account
	penalty
	tiles
    rp
    cf
    budget
    nodes
    techlevel
    assets
	
	***Special operations*** have their own config style:
	
	[techlevel:]
	${prefix}manage [USER] techlevel [THEATRE] [VALUE]
	Theaters: 0 air 1 ground 2 naval 3 space 4 industrial
	
	[assets:]
	${prefix}manage [USER] assets [ASSET] [VALUE]
	
	[nodes:]
	${prefix}manage [USER] nodes [NODE] [DEL]
	
	[systems:]
	${prefix}manage [USER] systems [SYSTEM] [AMOUNT]
	\`\`\`
	`,
	cooldown: 5,
	guildOnly: true,
	execute: async function manage(message, args, db) {
		//Getting user.
		let discordUser = ping(message);
		let dbUser = db.getUser(discordUser);
		
		//Validating user.
		if (!dbUser) {
			return messageHandler(message, 'InvalidArgumentType: User is not defined', true);
		} else if (!dbUser.state) {
			return messageHandler(message, 'NullReferenceException: User state is not defined', true);
		}
		
		try {
			switch (args[1].toLowerCase()) {
				case 'account':
                    args[2] = parseInt(args[2]);
					dbUser.state.account = args[2];
					break;
				case 'penalty':
                    args[2] = parseInt(args[2]);
					dbUser.state.account -= args[2];
					break;
				case 'tiles':
                    args[2] = parseInt(args[2]);
					dbUser.state.tiles = args[2];
					break;
				case 'rp':
                    args[2] = parseInt(args[2]);
					dbUser.state.research.RP = args[2];
					break;
				case 'cf':
                    args[2] = parseInt(args[2]);
					dbUser.state.research.CF = args[2];
					break;
				case 'budget':
                    args[2] = parseInt(args[2]);
					dbUser.state.research.budget = args[2];
					break;
				case 'nodes':
					let i = dbUser.state.research.unlockedNodesList.indexOf(args[2]);
					if (args[3] && args[3].toLowerCase() === 'del') {
						if (i === -1) {
							return messageHandler(message,
								new Error('InvalidTypeException: Node was not found!'), true);
						} else {
							dbUser.state.research.unlockedNodesList.splice(i, 1);
						}
					} else if (nodes[args[2]]) {
						if (i !== -1) {
							return messageHandler(message,
								new Error('InvalidTypeException: Node is already unlocked!'), true);
						}
						dbUser.state.research.unlockedNodesList.push(args[2]);
					} else {
						return messageHandler(message,
							new Error('InvalidTypeException: Node does not exist!'), true);
					}
					break;
				case 'techlevel':
					args[2] = parseInt(args[2]);
					args[3] = parseFloat(args[3]);
					if (0 <= args[2] < 5) {
						dbUser.state.research.technologicalLevels[args[2]] = args[3];
					} else {
						return messageHandler(message,
							new Error('InvalidTypeException: Theatre is not a number!'), true);
					}
					break;
				case 'systems':
					args[3] = parseFloat(args[3]);
					if (systems[args[2]]) {
						dbUser.state.assets.systems[args[2]] = args[3];
					} else {
						return messageHandler(message,
							new Error('InvalidTypeException: System does not exist!'), true);
					}
					break;
				case 'assets':
					args[3] = parseFloat(args[3]);
					let asset = findAsset(args[2]);
					
					dbUser.state.assets.assets[asset.theatre][asset.name] = args[3];
					break;
				default:
					return messageHandler(message,
						new Error('InvalidArgumentException: Non-existing configuration option argument.'), true);
			}
		} catch (error) {
			return messageHandler(message, error, true);
		}
		
		db.export();
		report(message, `${message.author} edited ${args[1]} of ${dbUser.state.name} to ${args}`, this.name);
		return messageHandler(message, 'Value was edited!', true);
	}
};