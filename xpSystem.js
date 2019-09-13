const util = require("util");
const fs = require("fs");
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
module.exports = {
    async load() {
        this.userXp = await readFile("./Misc/userXp.json")
    }, 
    async updateUserXp(userXp) {
        this.userXp = JSON.stringify(userXp, null, 1)
        await writeFile('./Misc/userXp.json', JSON.stringify(userXp, null, 1))
    }
}