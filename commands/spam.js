module.exports = {
	name: 'spam',
	description: 'Command for sendign messages.',
	args: true,
	usage: '<D:amount>',
	cooldown: 5,
	guildOnly: true,
	execute(message, args) {
        if (js.perm(message, 1)) {
            message.delete()
			for (var i = 0; i < parseInt(args[0] - 1); i++) {
				message.channel.send('Pong.');
			}
			message.channel.send('Done!');
        }
	},
};