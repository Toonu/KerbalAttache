const Discord = require('discord.js');
const fs = require('fs');
const os = require('os');
const {init} = require("./sheet");
const {log, perm, messageHandler} = require("./utils");
const trade = require('./commands/trade');
const {startup} = require('./keep_alive');


const {Database} = require('./dataStructures/Database');
let client = new Discord.Client();

//Adds commands from the command folder collection.
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const coolDowns = new Discord.Collection();
let db = new Database(client);
trade.setClient(client);

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	
	client.commands.set(command.name, command);
}

//Starts the bot
client.on('ready', () => {
	log(`Deployed and ready!`);
	client.user.setActivity("over players.", { type: "WATCHING" }).catch(error => log(error, true));
	startup();
	init();
});

client.on('message', message => {
	//Ignored messages without a prefix.
	if (!message.content.startsWith(db.prefix) || message.author.bot) {
		return;
	}
	
	//Prepares the arguments.
	const args = message.content.slice(db.prefix.length).trim().split(/ +/);

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
The proper usage would be:\n${command.usage}\n\nFor more information, type ${db.prefix}help ${command.name}.`, true, 20000);
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
		
		//if (command.usesDB) {
		//	db = new Database(client);
		//}
		command.execute(message, args, db);
	} catch (error) {
		messageHandler(message, 'There was an error trying to execute that command!');
		messageHandler(message, error, true);
	}
});

const {CLIENT_TOKEN} = os.platform() === 'linux' ? process.env : require('./env.json');
client.login(CLIENT_TOKEN).catch(error => log(error, true));





