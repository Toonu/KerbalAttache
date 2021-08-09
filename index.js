const {prefix} = require('./config.json'), Discord = require('discord.js'), fs = require('fs'),
	{init} = require("./sheet"), {log, perm, messageHandler} = require("./utils"), trade = require('./commands/trade');
client = new Discord.Client();

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
	client.user.setActivity("over players.", { type: "WATCHING" }).catch(error => log(error, true));
	init();
});

client.on('message', message => {
	//Ignored messages without a prefix.
	if (!message.content.startsWith(prefix) || message.author.bot) {
		return;
	}
	
	//Prepares the arguments.
	const args = message.content.slice(prefix.length).trim().split(/ +/);

	//Finds the command.
	const command = client.commands.get(args.shift().toLowerCase());

	if (!command) {
		return messageHandler(message, 'Not a command!', true);
	}

	//Checking for DMs.
	if (command.guildOnly && message.channel.type === 'dm') {
		return messageHandler(message, 'I cannot execute this command inside DMs!', true);
	}

	//Checking for arguments.
	if (command.args && (!args.length || command.args > args.length)) {
		return messageHandler(message, `You didn't provide all required arguments, ${message.author.username}!
The proper usage would be:\n${command.usage}\n\nFor more information, type ${prefix}help ${command.name}.`, true, 20000);
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
			messageHandler(message, `Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`, true);
		}
	}
	if (!perm(message, 1, false)) {
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
		messageHandler(message, 'There was an error trying to execute that command!');
		messageHandler(message, error, true);
	}
});

//const {CLIENT_TOKEN} = process.env;
const {CLIENT_TOKEN} = require('./env.json');
client.login(CLIENT_TOKEN).catch(error => log(error, true));
trade.setClient(client);



