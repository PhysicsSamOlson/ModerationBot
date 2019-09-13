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
const moderator = 'MOD ID' //mod role id here
const muted = 'MUTED ID' //muted role id here
const logChannel = 'CHANNEL ID' //channel for logging stuff
const welcomeMessage = 'WELCOME MSG' //Your welcome message to new users here
bot.on("ready", () => {
  bot.editStatus({
    status: 'online',
    game: null,
    name: `the chat`,
    type: 2
  }) //changing name wont cause errors, be careful with the rest
});
bot.on("error", console.error)
bot.on("guildMemberAdd", async (guild, member) => {
  await bot.createMessage((await bot.getDMChannel(member.id)).id, welcomeMessage)
  let embed = createEmbed('Member join', `<@!${member.id}> has joined ${guild.name}`, 'Logger', bot)
  await bot.createMessage(logChannel, { embed })
})
bot.on("guildMemberRemove", async (guild, member) => {
  let embed = createEmbed('Member leave', `<@!${member.id}> has left ${guild.name}`, 'Logger', bot)
  await bot.createMessage(logChannel, { embed })
})
bot.on("messageUpdate", async (message, oldMessage) => {
  if (message.channel.guild == null)
    return
  if (message.member.bot === true)
    return
  let embed = createEmbed('Message edit', `Sent by <@!${message.member.id}>\n**Old Message:**\n${oldMessage.content}\n **New Message:**\n${message.content}`, 'Logger', bot)
  await bot.createMessage(logChannel, { embed })
})
bot.on("messageDelete", async (message) => {
  if (message.channel.guild == null)
    return
  let embed = createEmbed('Message delete', `Message deleted sent by <@!${message.member.id}>:**\n${message.content}**`, 'Logger', bot)
  await bot.createMessage(logChannel, { embed })
})
bot.on("guildMemberUpdate", async (guild, member, oldMember) => {
  if (member.bot === true)
    return
  let nickName; member.nick == null ? nickName = member.username : nickName = member.nick
  oldMember.nick == null ? oldMember.nick = member.username : oldMember.nick = oldMember.nick
  if (oldMember.nick === nickName)
    return
  let embed = createEmbed('Name change', `<@!${member.id}> changed their name from ${oldMember.nick} to ${nickName}`, 'Logger', bot)
  await bot.createMessage(logChannel, { embed })
})
bot.on("messageCreate", async (msg) => {
  if (msg.author.bot === true)
    return
  let nickName; msg.member.nick == null ? nickName = msg.member.username : nickName = msg.member.nick
  let prefix = info.prefix
  if (msg.member == null)
    return
  msg.member.roles.indexOf(moderator) >= 0 ? moderators = true : moderators = false
  if (msg.content.substring(0, prefix.length) !== prefix) {
    let checkContent = msg.content.replace(/[\u007F-\uFFFF]\s*/g, "").toLowerCase().replace(/`/g, '').replace(/\n/g, '').replace(/\*/g, '').replace(/_/g, '').replace(/~/g, '')
    let embed;
    if (badToGood(checkContent) === true) {
      embed = createEmbed('Word censor', `${nickName}\'s message got deleted:\n**${msg.content}**`, 'Moderation', bot)
      await bot.createMessage(logChannel, { embed })
      await msg.delete()
      await bot.createMessage((await bot.getDMChannel(msg.member.id)).id, 'You have been moderated, that word is not allowed here!')
    }
    if (checkContent.length === 0) {
      embed = createEmbed('Wierd font moderation', `${nickName}\'s message got deleted:\n**${msg.content}**`, 'Moderation', bot)
      await bot.createMessage(logChannel, { embed })
      await msg.delete()
      await bot.createMessage((await bot.getDMChannel(msg.member.id)).id, 'You have been moderated, that type of text is not allowed here!')
    }
  }
  else if (moderators === true) {
    let mentioned; let mentionedNickName;
    msg.mentions.length === 0 ? mentioned = false : mentioned = msg.mentions[0]
    if (mentioned !== false)
      mentioned.nick == null ? mentionedNickName = mentioned.username : mentionedNickName = mentioned.nick
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
    if (command === 'ban') {
      if (mentioned === false)
        return await msg.channel.createMessage('You need to specify an user')
      let embed = createEmbed('User banned', `${mentionedNickName} has been banned`, 'Banhammer', bot)
      await bot.banGuildMember(msg.channel.guild.id, mentioned.id, 7, `Banned by ${nickName}`)
      return await msg.channel.createMessage({ embed })
    }
    if (command === 'unban') {
      if (msg.content.split(' ').length < 2)
        return await msg.channel.createMessage(`The syntax is ${prefix}unban USERID`)
      let unbannedUser = msg.content.split(' ').slice(1).join(' ')
      let embed = createEmbed('User banned', `<@!${unbannedUser}> has been unbanned`, 'Banhammer', bot)
      await bot.unbanGuildMember(msg.channel.guild.id, unbannedUser, 7, `Unbanned by ${nickName}`)
      return await msg.channel.createMessage({ embed })
    }
    if (command === 'mute') {
      if (mentioned === false)
        return await msg.channel.createMessage('You need to specify an user')
      await bot.addGuildMemberRole(msg.channel.guild.id, mentioned.id, muted, `Muted by ${nickName}`)
      let embed = createEmbed('User Muted', `${mentionedNickName} has been muted`, 'MuteHammer', bot)
      return await msg.channel.createMessage({ embed })
    }
    if (command === 'unmute') {
      if (mentioned === false)
        return await msg.channel.createMessage('You need to specify an user')
      await bot.removeGuildMemberRole(msg.channel.guild.id, mentioned.id, muted, `Unmuted by ${nickName}`)
      let embed = createEmbed('User Unmuted', `${mentionedNickName} has been unmuted`, 'MuteHammer', bot)
      return await msg.channel.createMessage({ embed })
    }
  }

})
function badToGood(word) {
  let badwords = ['bad', 'words', 'as', 'array', 'strings']
  if (badwords.some(bad => word.includes(bad)))
    return true;
  return false;
}
function createEmbed(title, content, footerText, bot) {
  let embedMessageDefault = {
    title: title,
    color: 0x6ade89,
    timestamp: new Date(),
    description: content,
    footer: {
      icon_url: bot.user.avatarURL,
      text: footerText
    }
  }
  return embedMessageDefault
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
