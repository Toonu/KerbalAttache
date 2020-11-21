const {ping} = require("../jsonManagement"), {getArray} = require("../sheet"),
    cfg = require('../config.json'), {findVertical} = require("../game");
module.exports = {
    name: 'sub',
    description: 'Command for getting information about your subscriptions!',
    args: false,
    usage: '[M:@user]',
    cooldown: 5,
    guildOnly: true,
    execute: async function sub(message, args) {
        let nation = ping(message, 2);
        let row = -99;
        let end = undefined;

        while (end === undefined && row < 300) {
            row += 100;
            end = await findVertical('Data', `B`, 'Database', row);
        }
        let data = await getArray('A1', `AK${end + row - 1}`, 0, 0, 'Database');

        let nat = cfg.users[nation.id].nation;
        let analyse = '';
        let array = [];

        for (let i = data.length - 1; i > 0; i--) {
            if ((args[0] === `<@!${nation.id}>` || args[0] === undefined) && data[i][1] === nat) {
                array.push(data[i]);
            }
        }

        let l = 0;

        array.forEach(r => {
            if (r[2].length > l) {
                l = r[2].length;
            }
        })

        array.forEach(r => {
            let money = parseInt(r[33].replace(/[,|$]/g, ''));
            money = money.toLocaleString('fr-FR', { style: 'currency', currency: cfg.money });
            analyse += `[${r[2].padStart(l)}] ${r[21]} ${(r[23] + r[24] + r[25]).replace('.', '').padEnd(24)} ${money.padEnd(15)} ${r[26].padEnd(10)} ${r[36]}\n`;
        })

        message.channel.send(`\`\`\`ini\n${analyse}\`\`\``, {split: {prepend: `\`\`\`ini\n`, append: `\`\`\``}}).then(msg => {
            if (msg.length < 5) {
                msg.forEach(m => {
                    m.delete({timeout: 32000})
                });
            } else {
                msg.delete({timeout: 32000});
            }
        });
        return message.delete();
    }
};