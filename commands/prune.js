module.exports = {
	name: 'prune',
	usage: '[M:amountToDelete] [M:deleteOldMessages [true]]',
	description: 'Prune messages from channel.',
	guildOnly: true,
	args: true,
	cooldown: 5,
	execute: function prune(message, args) {
		const amount = parseInt(args[0]) + 1;
		if (isNaN(amount)) {
			message.channel.send(`That doesn't seem to be a valid number. Canceling operation.`).then(msg => msg.delete({timeout: 9000}));
			message.delete();
			return;
		}

		let bool = false;
		if (args[1] === "true") {
			bool = true;
		}
		message.channel.bulkDelete(amount, bool)
			.then(() => {
				console.log(`Deleted ${amount}`);
			})
			.catch(err => {
				console.log(err.message);
				message.channel.send(err.message).then(msg => {
					msg.delete({timeout: 9000});
				})
				message.delete();
			})
	}
};