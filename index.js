import { prefix } from './config.json';
import { Client, Collection } from 'discord.js';
const client = new Client();
import { readdirSync } from 'fs';
import { init } from "./fn";

//Adds commands from the command folder collection.
client.commands = new Collection();
const commandFiles = readdirSync('./commands').filter(file => file.endsWith('.js'));
const cooldowns = new Collection();
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	
	client.commands.set(command.name, command);
}

//Starts the bot
client.on('ready', () => {
	console.log('Deployed and ready!');
	client.user.setActivity("over players.", { type: "WATCHING" })
	init();
});

//Awaits event
client.on('message', message => {
	if (!message.content.startsWith(prefix) || message.author.bot) return;
  
	//Prepares the arguments
	const args = message.content.slice(prefix.length).trim().split(/ +/);
	const commandName = args.shift().toLowerCase();

	//If comand doesnt exist, else assigns command.
	if (!client.commands.has(commandName)) return;
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
		cooldowns.set(command.name, new Collection());
	}
	
	const now = Date.now();
	const timestamps = cooldowns.get(command.name);
	const cooldownAmount = (command.cooldown || 3) * 1000;
	//Manages cooldown
	if (timestamps.has(message.author.id)) {
		const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

		if (now < expirationTime && message.author.id != 319919565079576576) {
			const timeLeft = (expirationTime - now) / 1000;
			return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
		}
	}

	timestamps.set(message.author.id, now);
	setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
	
	//Executes command with arguments.
	try {
        if (message.channel.type === 'dm') {
            console.log('DM from '+ message.author.name + ": " + message.content);
        } else {
			console.log(`Server ${message.guild.name} (${message.author.username}): ${message.content}`);
		}
		command.execute(message, args);
	} catch (error) {
		console.error(error);
		message.reply('There was an error trying to execute that command!');
	}
});
//Logs in and starts the bot.
const {CLIENT_TOKEN} = process.env;
client.login(CLIENT_TOKEN);