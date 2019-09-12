/*
License
Copyright (c) 2019-Present TomiLahren
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including the rights to use, copy, modify 
and distribute copies of the Software, and to permit persons to whom the Software 
is furnished to do so, subject to the following terms and conditions: 
- The above copyright notice shall be included in all copies of the Software.
You may not:
  - Claim credit for, or refuse to give credit to the creator(s) of the Software.
  - Sell copies of the Software and of derivative works.
  - Modify the original Software to contain hidden harmful content. 
 
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

const Eris = require("eris");
const info = require('./info.json');
const fs = require('fs')
const bot = new Eris(info.token);
const moderator = 'ROLE ID' //mod role id here
bot.on("ready", () => {
  bot.editStatus({
    status: 'online',
    game: null,
    name: `the chat`,
    type: 2
  })
});
bot.on("error", console.error)

bot.on("messageCreate", async (msg) => {
  let prefix = info.prefix
  if (msg.member == null)
    return
  msg.member.roles.indexOf(moderator) >= 0 ? moderators = true : moderators = false
  if (msg.content.substring(0, prefix.length) !== prefix) {
    let checkContent = msg.content.replace(/[\u007F-\uFFFF]\s*/g, "").toLowerCase().replace(/`/g, '').replace(/\n/g, '').replace(/\*/g, '').replace(/_/g, '').replace(/~/g, '')
    if (badToGood(checkContent) === true) {
      await msg.delete()
      await bot.createMessage((await bot.getDMChannel(msg.member.id)).id, 'You have been moderated, that word is not allowed here!')
    }
    if (checkContent.length === 0) {
      await msg.delete()
      await bot.createMessage((await bot.getDMChannel(msg.member.id)).id, 'You have been moderated, that type of text is not allowed here!')
    }
  }
  else if (moderators === true) {
    msg.content = msg.content.slice(prefix.length)
    let command = msg.content.split(' ')[0]
    if (command === 'prefix') {
      if (msg.content.split(' ').length != 2)
        return bot.createMessage(msg.channel.id, `The syntax is ${prefix}prefix newprefix`)
      await updatePrefix(msg.content.split(' ')[1], info)
      await bot.createMessage(msg.channel.id, 'The new prefix for commands is ' + msg.content.split(' ')[1])
    }
    if (command === 'del') {
      let x = msg.content.split(' ')
      if (x[1] === '' || x[1] == null)
        x[1] = '50' //default amount of msgs to delete is 50 if nothing is specified
      x[1] = Math.floor(Number(x[1]))
      if (x[1] > 100)
        return bot.createMessage(msg.channel.id, 'Sorry I can only delete up to 100 messages at a time')
      if (isNaN(x[1]) || Math.sign(x[1]) === -1 || Number(x[1]) === 0)
        return bot.createMessage(msg.channel.id, 'Invalid amount of messages to delete')
      await msg.channel.purge(x[1])
      await bot.createMessage(msg.channel.id, x[1] + ' messages have been deleted').then(function (response) {
        setTimeout(async function () {
          await response.delete()
        }, 60000)
      })
    }
  }

})
function badToGood(word) {
  let badwords = ['bad', 'words', 'as', 'array', 'strings']
  if (badwords.some(bad => word.includes(bad)))
    return true;
  return false;
}
async function updatePrefix(prefix, info) {
  info.prefix = prefix
  let jsonMsg = {
    token: info.token,
    prefix: prefix
  }
  await fs.writeFile("./info.json", JSON.stringify(jsonMsg, null, 2), (error) => { if (error != null) { console.error(error) } })
}
bot.connect()
