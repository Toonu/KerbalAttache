const discord = require('discord.js');
exports.TechNode = class TechNode {
	/**
	* Blank class to support JSON import missing variables errors.
	*/
	constructor(name, desc, cost, category, theatre, unlocks, prereq) {
		this.name = name;
		this.desc = desc;
		this.cost = cost;
		this.category = category;
		this.theatre = theatre;
		this.unlocks = unlocks;
		this.prereq = prereq;
		
		if (!this.unlocks) {
			this.unlocks = [];
		}
		if (!this.prereq) {
			this.prereq = [];
		}
	}
	
	toEmbed() {
		let unlocks = [];
		
		for (const unlock of this.unlocks) {
			unlocks.push(`\n${unlock}`);
		}
		
		let embed = new discord.MessageEmbed()
		.setColor('#065535')
		.setTitle(`Node: ${this.name}`)
		.setURL('https://discord.js.org/') //URL clickable from the title
		.setThumbnail('https://imgur.com/IvUHO31.png')
		.addField('Unlocks:', `\`\`\`\n${unlocks}\`\`\``)
		.addField('Cost:', `${this.cost}RP`, true)
		.addField('Buy?', 'Press ✅', true)
		.setFooter('Made by the Attachè to the United Nations.\nThis message will be auto-destructed in 32 seconds if not reacted upon!', 'https://imgur.com/KLLkY2J.png');
		
		if (this.prereq.length !== 0) {
			embed.addField( 'Requirements:', this.prereq);
		}
		
		return embed;
	}
};