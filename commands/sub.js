const {ping} = require("../jsonManagement"), {getArray} = require("../sheet"),
    cfg = require('../config.json'), {findVertical} = require("../game");
module.exports = {
    name: 'sub',
    description: 'Command for getting information about your subscriptions!',
    args: false,
    usage: '[craftName] [M:@user]\n\nIf no craft name is specified, lists all of your crafts.',
    cooldown: 5,
    guildOnly: true,
    execute: async function sub(message, args) {
        let nation = ping(message, 2);
        let row = -99;
        let end = undefined;

        while (end === undefined) {
            row += 100;
            end = await findVertical('Data', `B`, 'Database', row);
        }
        let data = await getArray('A1', `AK${end + row - 1}`, 0, 0, 'Database');

        let nat = cfg.users[nation.id].nation;
        for (let i = data.length - 1; i > 0; i--) {
            if (data[i][1] !== nat) {
                data.splice(i, 1);
            }
        }

        let analyse = '';
        if (args[0] === undefined) {
            let l = 0;
            for (let asset of data) if (asset.length > l) l = asset.length;
            for (let asset of data) {
                analyse += `[${asset[2].paddingLeft(l)}] ${asset[23] + asset[24] + asset[25]} ${asset[21]} ${asset[26]}
 ${asset[33]} ${asset[36]}`;
            }
        } else {
            for (let asset of data) {
                if (asset[0] === args[0]) {
                    analyse += `[${asset[2].paddingLeft(l)}] ${asset[23] + asset[24] + asset[25]} ${asset[21]} ${asset[26]}
 ${asset[33]} ${asset[36]}`;
                }
            }
        }

        message.channel.send(`\`\`\`ini\n${analyse}\`\`\``).then(msg => msg.delete({timeout: 9000}));
        return message.delete();
    },
};