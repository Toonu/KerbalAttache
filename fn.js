const fs = require('fs');
const {google} = require('googleapis');
const fn = require("./fn");
const gm = require("./game");
var client;
const cfg = require("./config.json")
const {CLIENT_TOKEN, type, project_id, private_key_id, private_key, client_email} = process.env;
const {} = process.env;


exports.init = function () {
    client = new google.auth.JWT(client_email, null, private_key, ["https://www.googleapis.com/auth/spreadsheets"]);
};
exports.ss = async function (args, message, tab) {
    return new Promise(async function (resolve, reject) {
        client.authorize(async function(err,tokens) {
            try {
                if (err) throw "Autorization failed." + err;
                else {
                    const gs = google.sheets({version: "v4", auth: client});
    
                    if (!checkCoordinate(args[1])) throw "Wrong first coordinate input";
                    args[1] = args[1].toUpperCase();
    
                    if (tab == undefined) {
                        var tab = "Maintenance";
                    }

                    if (args[0].startsWith("getA")) {
                        args[2] = args[2].toUpperCase();
                        if (!checkCoordinate(args[2])) throw "Wrong second coordinate input.";

                        resolve(await getAInternal(args[1], args[2], args[3], args[4], message, gs, tab));
                    } else if (args[0].startsWith("set")) {
                        resolve(setInternal(args[1], args[2], message, gs, tab));
                    } else if (args[0].toLowerCase().startsWith("get")) {
                        resolve(await getInternal(args[1], message, gs, tab));
                    }
                }
            } catch(err) {
                reject(err);
            }
        })
    })
};

async function getInternal(x,message,gs,tab) { 
    const getData = {
    spreadsheetId: cfg.sheet,
    range:  `${tab}!${x}`
    };
    let data = await gs.spreadsheets.values.get(getData);
    let dataArray = data.data.values;

    if (dataArray != undefined) {
        return dataArray[0][0];
    }
    message.channel.send("Cell empty");
    return false;
}
async function getAInternal(x, y, c, r, message, gs, tab) {
    try {
        if (parseInt(c) < 0 || parseInt(r) < 0 || c == undefined || r == undefined) {
            c = 0, r = 0;
        };
        r = parseInt(r), c = parseInt(c), newY = "", newYNum = "";

        for (let ch of y) {
            let coord = new RegExp(/[^0-9]+/g);
            if (coord.test(ch)) {
                newY += ch;
            } else {
                newYNum += ch;
            }
        }
        
        let intermediate = newY.charCodeAt(newY.length-1) + c;

        if (intermediate > 90) {
            newY = "A" + newY;
            intermediate -= 25;
        }

        newY = newY.substring(0, newY.length - 1) + String.fromCharCode(intermediate);

        if (r > 0) {
            newYNum = parseInt(newYNum) + r; 
        }
        
        y = newY + newYNum;

    } catch (err) {
        message.channel.send(err);
        return false;
    }
        
    const getData = {
    spreadsheetId: cfg.sheet,
    range: `${tab}!${x}:${y}`
    };

    let data = await gs.spreadsheets.values.get(getData);
    let dataArray = data.data.values;
    return dataArray;
    
};
async function setInternal(x, data, message, gs,tab) {
    if (data == undefined) {
        message.channel.send("Data empty. Operation failed.");
        return false;
    } 
    try {
        const pushData = {
            spreadsheetId: cfg.sheet,
            range: `${tab}!${x}`,
            valueInputOption: "RAW",
            resource: {values: [[data]]}
        };
        await gs.spreadsheets.values.update(pushData);       
        return true;
    } catch(error) {
        message.channel.send(`Operation failed: ${error.message}`);
        return false;
    }
};
function checkCoordinate(x,message) {
    let coord = new RegExp(/[A-Z]+[0-9]+/g);
    if (coord.test(x)) {
        return true;
    }
    return false;
};

exports.createUser = function(message, nationIn, colorIn, passwordIn) {           
    const id = message.mentions.users.map(user => {
        return user.id;
    });

    if (nationIn == undefined) {
        nationIn = "undefined";
    }
    if (colorIn == undefined) {
        colorIn = "undefined";
    }
    if (passwordIn == undefined) {
        passwordIn = "undefined";
    }

    if (cfg.users[id] == undefined) {
        cfg.users[id] = {
            nation: nationIn, 
            color: colorIn, 
            password: passwordIn};
        fn.exportFile("config.json", cfg);
        return true;
    }
    return false;
};
exports.modifyUser = function(message, user, type, data) {
    switch(type) {
        case "0":
            cfg.users[user].nation = data;
            break;
        case "1":
            cfg.users[user].color = data;
            break;
        case "2":
            cfg.users[user].password = data;
            break;
        default:
            return false;
    }

    fn.exportFile("config.json", cfg);
    return true;
};
exports.delUser = function(user) {
    delete cfg.users[user];
    fn.exportFile("config.json", cfg);
};
exports.exportFile = function(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 4));
};
exports.perm = function(message, type) {
    switch(type) {
        case 0:
            return true;
        case 1:
            if (message.member.roles.cache.has(cfg.developers) || message.member.roles.cache.has(cfg.administrators)) {
                return true;
            }
            message.reply("You do not have permissions to do that. The Directorate for Distribution of information apologies.")
            return false;
        case 2:
            if (message.member.roles.cache.has(cfg.administrators)) {
                return true;
            }
            message.reply("You do not have permissions to do that. The Directorate for Distribution of information apologies.")
            return false;
        default:
            message.reply("You do not have permissions to do that. The Directorate for Distribution of information apologies.")
            return false;
    }
};
