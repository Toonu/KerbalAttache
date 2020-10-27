const fs = require('fs');
const {google} = require('googleapis');
const fn = require("./fn");
const gm = require("./game");
const cfg = require("./config.json")

//Function finds first element target in column.
async function findVertical(target, col, message, bool) {
    return new Promise(async function (resolve, reject) {  
        var array = await fn.ss(["getA", `${col}1`, `${col}100`], message, bool, "Maintenance").catch(err => reject(err));
        var height = 0
        for (const element of array) {
            height += 1;
            if (element[0] == target) {
                resolve(height);
            }
        }
        reject("Not found in vertical range.");
    })
}

//Function finds first row containing the target in row.
async function findHorizontal(target, row, message, bool) {
    return new Promise(async function (resolve, reject) {
        var e = 64; //char A dec num
        var array = await fn.ss(["getA", `A${row}`, `BA${row}`], message, bool, "Maintenance").catch(err => reject(err));
        for (const element of array[0]) {
            e += 1;
            if (element == target) {
                resolve(e);
            }
        }
        reject("Not found in horizontal range.");
    })
}

exports.findUnitPrice = async function(unit, message) {
    return new Promise(async function(resolve, reject) {
        var prices = await findVertical("Data", "A", message).catch(err => message.channel.send("Error Vertical - " + err));
        var column = await findHorizontal(unit, "4", message).catch(err => message.channel.send("Error Horizontal - " + err));
        var result = await fn.ss(["get", `${String.fromCharCode(column)}${prices}`], message).catch(err => reject(err));
        resolve(result);
    })
}