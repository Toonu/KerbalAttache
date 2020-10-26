const { prefix, debug, guild, main_channel } = require('./config.json');
const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
const fn = require("./fn");
const { Console } = require('console');
const {google} = require('googleapis');

//Adds commands from the command folder collection.
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const cooldowns = new Discord.Collection();
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	
	client.commands.set(command.name, command);
}

//Starts the bot
client.on('ready', () => {
	console.log('Deployed and ready!');
	client.user.setActivity("over players.", { type: "WATCHING" })
	fn.init();
});

client.on('message', message => {
	if (!message.content.startsWith(prefix) || message.author.bot) return;
  
	//Prepares the arguments and command
	const args = message.content.slice(prefix.length).trim().split(/ +/);
	const commandName = args.shift().toLowerCase();

	if (commandName.startsWith(`reset`) && message.author.id == 319919565079576576) {
		resetBot(message.channel);
		return;
	}

	//If comand doesnt exist.
	if (!client.commands.has(commandName)) return;
	//Else
	const command = client.commands.get(commandName);

	//Checking for DMs
	if (command.guildOnly && message.channel.type === 'dm') {
		return message.reply('I can\'t execute that command inside DMs!');
	}

	//Checking for arguments
	if (command.args && !args.length) {
		let reply = `You didn't provide any arguments, ${message.author}!`;
		if (command.usage) {
			reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
		}
		return message.channel.send(reply);
	}

	//Checking for cooldown
	if (!cooldowns.has(command.name)) {
		cooldowns.set(command.name, new Discord.Collection());
	}
	
	const now = Date.now();
	const timestamps = cooldowns.get(command.name);
	const cooldownAmount = (command.cooldown || 3) * 1000;

	if (timestamps.has(message.author.id)) {
		const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

		if (now < expirationTime && message.author.id != 319919565079576576) {
			const timeLeft = (expirationTime - now) / 1000;
			return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
		}
	}

	timestamps.set(message.author.id, now);
	setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
	
	try {
		if (debug) {
			console.log(' Server: ' + message.content);
		}
		command.execute(message, args);
	} catch (error) {
		console.error(error);
		message.reply('there was an error trying to execute that command!');
	}
});

const {CLIENT_TOKEN} = process.env;
client.login(CLIENT_TOKEN);

// Turn bot off (destroy), then turn it back on
function resetBot(channel) {
    // send channel a message that you're resetting bot [optional]
    channel.send('Resetting...')
    .then(msg => client.destroy())
    .then(() => client.login(CLIENT_TOKEN));
}