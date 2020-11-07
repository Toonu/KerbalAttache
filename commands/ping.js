module.exports = {
	name: 'ping',
	description: 'Ping!',
	guildOnly: true,
	execute(message) {
		message.channel.send('Pong.').then(msg => msg.delete({timeout: 12000}));
		message.delete({timeout: 12000});
	},
};