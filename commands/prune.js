module.exports = {
	name: 'prune',
	usage: '<M:amountToDelete> <M:deleteOldMessages [true | false]>',
	description: 'Prune messages from channel.',
	guildOnly: true,
	args: true,
    perms: 'Moderator',
	cooldown: 5,
	execute(message, args) {
        try {
            var amount = parseInt(args[0]);
            if (isNaN(amount)) {
                return message.reply('that doesn\'t seem to be a valid number. Canceling operation.');
            }
        } catch(err) {
            message.channel.send(err);
            return;
        }
		
		let bool = false;
		if (args[1] === "true") {
			bool = true;
		}
        message.channel.bulkDelete(amount, bool)
        console.log(`Deleted ${amount}`);
	}
};