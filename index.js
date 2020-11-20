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
	client.user.setActivity("over players.", { type: "WATCHING" }).catch(err => console.log(err));
	fn.init();
});

client.on('message', message => {
	if (!message.content.startsWith(cfg.prefix) || message.author.bot) return;
  
	//Prepares the arguments and command
	const args = message.content.slice(cfg.prefix.length).trim().split(/ +/);
	const commandName = args.shift().toLowerCase();

	//If command doesnt exist.
	if (!client.commands.has(commandName)) {
		message.channel.send('Not a command!').then(msg => msg.delete({timeout: 9000}));
		message.delete().then(r => r);
	}

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
		// noinspection JSUnresolvedFunction
		message.channel.send(reply).then(() => {
			message.delete({timeout: 10000}).catch(err => console.log(err));
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

		if (now < expirationTime && message.author.id !== '319919565079576576') {
			const timeLeft = (expirationTime - now) / 1000;
			message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`)
				.then(() => {
					message.delete({timeout: 10000}).catch(err => console.log(err));
				});
		}
	}
	if (!js.perm(message, 1)) {
		timestamps.set(message.author.id, now);
	}
	setTimeout(() => timestamps.delete(message.author.id), coolDownAmount);
	
	try {
		let today = new Date();
		let dateTime = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate()+' '+today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
		if (message.channel.type === 'dm') {
            console.log(`[${dateTime} UTC] DM from ${message.author.username}: ${message.content}`);
        } else {
			console.log(`[${dateTime} UTC] Server ${message.guild.name} (${message.author.username}): ${message.content}`);
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
client.login(CLIENT_TOKEN).catch(err => console.log(err));


/**
 * TODO Hyper goal:   	KSP mod for development price directly in game.
 * TODO Super goal:     Map integration via xml editing.
 *
 * Buy command not buying weapon parts.
 * Trade command not trading weapon parts.
 *
 **/
