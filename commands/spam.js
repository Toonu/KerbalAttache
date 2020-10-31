module.exports = {
	name: 'spam',
	description: 'Command for sending messages.',
	args: true,
	usage: '<D:amount>',
	cooldown: 5,
	guildOnly: true,
	execute(message, args) {
        const js = require('./../json');

        try {
            args[0] = parseInt(args[0]);
            if (isNaN(args[0])) {
                return message.reply('that doesn\'t seem to be a valid number. Canceling operation.');
            }
        } catch(err) {
            message.channel.send(err);
            return;
        }

        if (js.perm(message, 1)) {
            message.delete()
			for (var i = 0; i < parseInt(args[0] - 1); i++) {
				message.channel.send('Pong.');
			}
			message.channel.send('Done!');
        }
	},
};