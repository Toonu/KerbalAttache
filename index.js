const {prefix} = require('./config.json'), Discord = require('discord.js'),
fs = require('fs'), fn = require("./sheet"), {log, perm} = require("./utils");
client = new Discord.Client();

//const {CLIENT_TOKEN} = process.env;
const {CLIENT_TOKEN} = require('./env.json');

//Adds commands from the command folder collection.
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const coolDowns = new Discord.Collection();
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	
	client.commands.set(command.name, command);
}

//Starts the bot
client.on('ready', () => {
	log(`Deployed and ready!`);
	client.user.setActivity("over players.", { type: "WATCHING" }).catch(error => console.error(error));
	fn.init();
});

client.on('message', message => {
	//Ignored messages without a prefix.
	if (!message.content.startsWith(prefix) || message.author.bot) return;
  
	//Prepares the arguments.
	const args = message.content.slice(prefix.length).trim().split(/ +/);

	//Finds the command.
	const command = client.commands.get(args.shift().toLowerCase());
    if (!command) {
        message.channel.send('Not a command!')
			.then(errorMessage => errorMessage.delete({timeout: 9000}).catch(error => console.error(error)))
			.catch(networkError => console.error(networkError));
        return message.delete().catch(error => console.error(error));
    }

	//Checking for DMs.
	if (command.guildOnly && message.channel.type === 'dm') {
		message.reply('I can\'t execute this command inside DMs!').catch(networkError => console.error(networkError));
		return message.delete().catch(error => console.error(error));
    }

	//Checking for arguments.
	if (command.args && (!args.length || command.args > args.length)) {
		message.channel.send(`You didn't provide all required arguments, ${message.author.username}!
The proper usage would be:\n${command.usage}\n\nFor more information, type ${prefix}help ${command.name}.`)
			.then(helpMessage => helpMessage.delete({timeout: 20000}).catch(error => console.error(error)))
			.catch(networkError => console.error(networkError));
		return message.delete().catch(error => console.error(error));
	}

	//Checking for cool down.
	if (!coolDowns.has(command.name)) {
		coolDowns.set(command.name, new Discord.Collection());
	}
	
	const now = Date.now();
	const timestamps = coolDowns.get(command.name);
	const coolDownAmount = (command.cooldown || 3) * 1000;

	if (timestamps.has(message.author.id)) {
		const expirationTime = timestamps.get(message.author.id) + coolDownAmount;

		if (now < expirationTime && message.author.id !== '319919565079576576') {
			const timeLeft = (expirationTime - now) / 1000;
			message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`)
				.then(errorMessage => {
					errorMessage.delete({timeout: 10000}).catch(error => console.error(error));
					message.delete().catch(error => console.error(error));
				})
				.catch(networkError => log.error(networkError));
		}
	}
	if (!perm(message, 1)) {
		timestamps.set(message.author.id, now);
	}
	setTimeout(() => timestamps.delete(message.author.id), coolDownAmount);

	//Executing the actual command.
	try {
		if (message.channel.type === 'dm') {
            log(`DM from ${message.author.username}: ${message.content}`);
        } else {
			log(`Server ${message.guild.name} (${message.author.username}): ${message.content}`);
		}
		command.execute(message, args);
	} catch (error) {
		console.error(error);
		message.reply('There was an error trying to execute that command!')
			.then(errorMessage => errorMessage.delete({timeout: 10000}).catch(error => console.error(error)))
			.catch(networkError => console.error(networkError));
		message.delete().catch(error => console.error(error));
	}
});

client.login(CLIENT_TOKEN).catch(error => console.error(error));

/**
 * accept
 * assets
 * balance
 * battle
 * buy
 * reject
 * tech
 * tiles
 * trade
 * game
 *
 * XXX
 *
 * config
 * help
 * map
 * ping
 * prune
 * reload
 * spam
 * sub
 * turn
 * usercreate
 *
 * index
 * sheet
 * utils
 *
 * YYY
 *
 * userdel
 * useredit
 * userinfo
**/


