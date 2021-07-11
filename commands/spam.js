const {perm} = require("../jsonManagement");
module.exports = {
	name: 'spam',
	description: 'Command for sending spam messages.',
	args: true,
	usage: '[D:amount]',
	cooldown: 5,
	guildOnly: true,
	execute(message, args) {
        args[0] = parseInt(args[0]);
        if (isNaN(args[0])) {
            message.reply('that doesn\'t seem to be a valid number. Canceling operation.').then(msg => msg.delete({timeout: 9000}));
        } else if (perm(message, 1, true)) {
			for (let i = 0; i < parseInt(args[0]) - 1; i++) {
				message.channel.send('Pong.');
			}
			message.channel.send('Done!');
        }
        message.delete()
	},
};