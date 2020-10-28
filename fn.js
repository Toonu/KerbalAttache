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
exports.ss = function (args, message, tab) {
    return new Promise(function (resolve, reject) {
        client.authorize(function(err,tokens) {
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

                        getAInternal(args[1], args[2], args[3], args[4], message, gs, tab)
                        .then(resolve)
                        .catch(err => reject(err));
                    } else if (args[0].startsWith("set")) {
                        setInternal(args[1], args[2], message, gs, tab)
                        .then(resolve)
                        .catch(err => reject(err));
                    } else if (args[0].toLowerCase().startsWith("get")) {
                        getInternal(args[1], message, gs, tab)
                        .then(resolve)
                        .catch(err => reject(err));
                    }
                }
            } catch(err) {
                reject(err);
            }
        })
    })
};

function getInternal(x,message,gs,tab) { 
    return new Promise(function (resolve, reject) {
        const getData = {
        spreadsheetId: cfg.sheet,
        range:  `${tab}!${x}`
        };
        gs.spreadsheets.values.get(getData)
            .then(data => {
                let dataArray = data.data.values;

                if (dataArray != undefined) {
                    resolve(dataArray[0][0]);
                    return;
                }
                reject("Cell empty");
            })
            .catch(reject);
    });
}
function getAInternal(x, y, c, r, message, gs, tab) {
    return new Promise(function (resolve, reject) {
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
            reject(false);
        }
            
        const getData = {
        spreadsheetId: cfg.sheet,
        range: `${tab}!${x}:${y}`
        };

        gs.spreadsheets.values.get(getData)
            .then(data => {
                resolve(data.data.values);
            })
            .catch(reject);
    });
};
function setInternal(x, data, message, gs,tab) {
    return new Promise(function (resolve, reject) {
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
                gs.spreadsheets.values.update(pushData)
                    .then(resolve(true))
                    .catch(reject);
            } catch(error) {
                message.channel.send(`Operation failed: ${error.message}`);
                reject(false);
            }
        });
    };


function checkCoordinate(x,message) {
    let coord = new RegExp(/[A-Z]+[0-9]+/g);
    if (coord.test(x)) {
        return true;
    }
    return false;
}

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
            if (cfg.administrators.some(r=> message.member.roles.cache.has(r)) || cfg.developers.some(r=> message.member.roles.cache.has(r))) {

                return true;
            }
            message.reply("You do not have permissions to do that. The Directorate for Distribution of information apologies.")
            return false;
        case 2:
            if (cfg.administrators.some(r=> message.member.roles.cache.has(r))) {
                return true;
            }
            message.reply("You do not have permissions to do that. The Directorate for Distribution of information apologies.")
            return false;
        default:
            message.reply("You do not have permissions to do that. The Directorate for Distribution of information apologies.")
            return false;
    }
};
