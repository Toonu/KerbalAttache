const cfg = require('./config.json');
const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
const fn = require("./sheet");
const keep_alive = require('./keep_alive.js')
const js = require("./jsonManagement");

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
	console.log('Deployed and ready!');
	client.user.setActivity("over players.", { type: "WATCHING" })
	fn.init();
});

client.on('message', message => {
	if (!message.content.startsWith(cfg.prefix) || message.author.bot) return;
  
	//Prepares the arguments and command
	const args = message.content.slice(cfg.prefix.length).trim().split(/ +/);
	const commandName = args.shift().toLowerCase();

	//If command doesnt exist.
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
			reply += `\nThe proper usage would be: \`${cfg.prefix}${command.name} ${command.usage}\``;
		}
		message.channel.send(reply).then(() => {
			message.delete({timeout: 10000});
		});
		return;
	}

	//Checking for cool down
	if (!coolDowns.has(command.name)) {
		coolDowns.set(command.name, new Discord.Collection());
	}
	
	const now = Date.now();
	const timestamps = coolDowns.get(command.name);
	const coolDownAmount = (command.cooldown || 3) * 1000;

	if (timestamps.has(message.author.id)) {
		const expirationTime = timestamps.get(message.author.id) + coolDownAmount;

		if (now < expirationTime && message.author.id !== 319919565079576576) {
			const timeLeft = (expirationTime - now) / 1000;
			message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`)
				.then(() => {
					message.delete({timeout: 10000});
				});
		}
	}
	if (!js.perm(message, 1)) {
		timestamps.set(message.author.id, now);
	}
	setTimeout(() => timestamps.delete(message.author.id), coolDownAmount);
	
	try {
        if (message.channel.type === 'dm') {
            console.log('DM from '+ message.author.username + ": " + message.content);
        } else {
			console.log(`Server ${message.guild.name} (${message.author.username}): ${message.content}`);
		}
		command.execute(message, args);
	} catch (error) {
		console.error(error);
		message.reply('There was an error trying to execute that command!')
			.then(() => message.delete({timeout: 10000}));
	}
});

//const {CLIENT_TOKEN} = process.env;
const {CLIENT_TOKEN} = require('./env.json');
client.login(CLIENT_TOKEN);


/**
 * TODO Ultimate goal:   KSP mod for development price directly in game.
 * TODO Hyper goal:      Map integration via xml editing.
 * TODO Super goal:      Turn command.
 * Turn command.
 * Trade embed and confirmation of the customer/recipient nation in DMs or something like that.
 * Can be working with reacting on old messages, then checking if its the correct message and then doing the task?
 * Trade command missing trading weapons?
 * Add split to the listing messages if they exceed the 2000k limit. Possible with discord.js send options.
 *
 * Embed colors per command type or area
 * Fix error reporting for tech and other messages when it is not found/error like ?tech unlocks missilesARM
 *
 * Tech
 *
 *
 **/
