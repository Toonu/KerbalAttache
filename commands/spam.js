module.exports = {
	name: 'spam',
	description: 'Command for sending X spammy messages!',
	args: true,
	usage: '<amountOfSpam>',
	cooldown: 5,
	guildOnly: true,
	execute(message, args) {
		message.delete()
        if (args[1] =! undefined) {
            message.client.channels.cache.get('686606880461684794').send('Spam.');
        }

		var i;
		for (i = 0; i < parseInt(args[0] - 1); i++) {
			message.channel.send('Pong.');
		}
		message.channel.send('Done!');
	},
};