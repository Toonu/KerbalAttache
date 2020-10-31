module.exports = {
	name: 'prune',
	usage: '<A:amountToDelete> <A:deleteOldMessages [true|false]>',
	description: 'Prune messages from channel.',
	guildOnly: true,
	args: true,
	cooldown: 5,
	execute(message, args) {
		var amount = parseInt(args[0]);
		if (isNaN(amount)) {
			return message.reply('that doesn\'t seem to be a valid number.');
		}
		let bool = false;
		if (args[1] === "true") {
			var bool = true;
		}

		while (amount > 0) {
			if (amount > 100) {
				PruneChat(message, 100, bool)
			} else {
				PruneChat(message, amount+1, bool)
			}
			amount -= 100;
		}
	},
};

function PruneChat(message, amount, bool) {
	message.channel.bulkDelete(amount, bool)
	.catch(err => {
		console.error(err);
		message.channel.send('there was an error trying to prune messages in this channel!');
	});
	console.log(`Deleted ${amount}`);
}