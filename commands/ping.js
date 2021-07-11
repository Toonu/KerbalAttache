module.exports = {
	name: 'ping',
	description: 'Ping!',
	guildOnly: true,
	execute(message) {
		message.channel.send('Pong.').then(msg => msg.delete({timeout: 9000}));
		message.delete();
	},
};