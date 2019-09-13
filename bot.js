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
const xpSystem = require('./xpSystem.js')
const bot = new Eris(info.token);
const moderator = ['ROLE 1', 'ROLE 2'] //mod role ids here as array
const muted = 'MUTED ID' //muted role id here
const logChannel = 'ARCHIVE CHANNEL' //channel for logging stuff
const welcomeMessage = fs.readFileSync("./Misc/welcome.txt", 'utf-8') //Your welcome message to new users here
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
  let embed = createEmbedFields(null, member, [{ name: 'Member Joined', value: `<@!${member.id}> has joined ${guild.name}` }, { name: 'Account Creation Date', value: new Date(member.createdAt).toString() }], `ID: ${member.id}`, false)
  if (JSON.parse(xpSystem.userXp)[member.id] != null)
    embed.fields.push({ name: 'Returning user', value: 'This is a returning user' })
  await bot.createMessage(logChannel, { embed })
  if (nicknameCheck(member.username, checkForMod(member, moderator))) {
    await member.edit({ nick: 'FuzzySquirrel' + Math.floor(Math.random() * 1000) })
    await bot.createMessage((await bot.getDMChannel(member.id)).id, 'That username is not allowed here. We have changed it for you. If you have any problems, please contact @Moderators')
  }
})
bot.on("guildMemberRemove", async (guild, member) => {
  let embed = createEmbed('Member leave', `<@!${member.id}> has left ${guild.name}`, 'Logger', bot)
  await bot.createMessage(logChannel, { embed })
})
bot.on("messageUpdate", async (message, oldMessage) => {
  if (message.channel.guild == null)
    return
  if (message.author.bot === true)
    return
  let embed = createEmbedFields(`**Message edited in <#${message.channel.id}> [Jump to Message](https://discordapp.com/channels/${message.channel.guild.id}/${message.channel.id}/${message.id})**`, message.member, [{ name: 'Before', value: oldMessage.content }, { name: 'After', value: message.content }], `User ID: ${message.member.id}`, false)
  await bot.createMessage(logChannel, { embed })
  if (badToGood(message.content, checkForMod(member, moderator)) || checkFontChar(message.content, checkForMod(member, moderator))) {
    embed = createEmbed('Word censor', `${message.member.username}#${message.member.discriminator}\'s message got deleted:\n**${message.content}**`, 'Moderation', bot)
    await bot.createMessage(logChannel, { embed })
    await message.delete()
    await bot.createMessage((await bot.getDMChannel(message.member.id)).id, 'You have been moderated, that word is not allowed here!')
  }
})
bot.on("messageDelete", async (message) => {
  if (message.channel.guild == null)
    return
  let embed = createEmbedFields(`**Message sent by <@!${message.member.id}> deleted in <#${message.channel.id}>**`, message.member, [{ name: 'Deleted Message', value: message.content }], `User ID: ${message.member.id}`, false)
  await bot.createMessage(logChannel, { embed })
})
bot.on("guildMemberUpdate", async (guild, member, oldMember) => {
  if (member.bot === true)
    return
  let nickName; member.nick == null ? nickName = member.username : nickName = member.nick
  oldMember.nick == null ? oldMember.nick = member.username : oldMember.nick = oldMember.nick
  if (oldMember.nick === nickName)
    return
  if (nicknameCheck(nickName, checkForMod(member, moderator))) {
    await member.edit({ nick: oldMember.nick })
    await bot.createMessage((await bot.getDMChannel(member.id)).id, 'That username is not allowed here. We have changed it for you. If you have any problems, please contact @Moderators')
  }
  let embed = createEmbedFields(null, member, [{ name: 'Name Change', value: `<@!${member.id}> changed their name from ${oldMember.nick}#${member.discriminator} to ${nickName}#${member.discriminator}` }], 'Logger', true)
  await bot.createMessage(logChannel, { embed })
})
bot.on("messageCreate", async (msg) => {
  if (msg.author.bot === true)
    return
  if (msg.member == null)
    return
  let userXp = JSON.parse(xpSystem.userXp)
  let randomNum = Math.random(); let amountofXp;
  randomNum <= 0.33 ? amountofXp = 15 : randomNum > 0.33 && randomNum <= 0.66 ? amountofXp = 20 : amountofXp = 25;
  if (userXp[msg.author.id] == null) {
    userXp[msg.author.id] = { xp: amountofXp, time: Date.now(), lvl: 0, xpToLvl: 100 - amountofXp, totalXP: 100, user: `${msg.author.username}#${msg.author.discriminator}` }
    xpSystem.updateUserXp(userXp)
  }
  if ((Date.now() - userXp[msg.author.id]['time']) > 60000) {
    let xp2lvl = 5 * (Math.pow(userXp[msg.author.id]['lvl'], 2)) + 50 * userXp[msg.author.id]['lvl'] + 100;
    if ((userXp[msg.author.id]['xp'] + amountofXp) >= userXp[msg.author.id]['totalXP']) {
      xp2lvl = 5 * (Math.pow(userXp[msg.author.id]['lvl'] + 1, 2)) + 50 * (userXp[msg.author.id]['lvl'] + 1) + 100;
      userXp[msg.author.id] = { xp: userXp[msg.author.id]['xp'] + amountofXp, time: Date.now(), lvl: userXp[msg.author.id]['lvl'] + 1, xpToLvl: (userXp[msg.author.id]['totalXP'] + xp2lvl) - (userXp[msg.author.id]['xp'] + amountofXp), totalXP: xp2lvl + userXp[msg.author.id]['totalXP'], user: `${msg.author.username}#${msg.author.discriminator}` }
      await bot.createMessage(msg.channel.id, `Nice ${msg.member.username}#${msg.member.discriminator}, you xfered enough rating to get to level ${userXp[msg.author.id]['lvl']}!`)
    } else
      userXp[msg.author.id] = { xp: userXp[msg.author.id]['xp'] + amountofXp, time: Date.now(), lvl: userXp[msg.author.id]['lvl'], xpToLvl: userXp[msg.author.id]['totalXP'] - (userXp[msg.author.id]['xp'] + amountofXp), totalXP: userXp[msg.author.id]['totalXP'], user: `${msg.author.username}#${msg.author.discriminator}` }
    xpSystem.updateUserXp(userXp)
  }
  let nickName; msg.member.nick == null ? nickName = msg.member.username : nickName = msg.member.nick
  let prefix = info.prefix
  checkForMod(msg.member, moderator) ? moderators = true : moderators = false
  if (msg.content.substring(0, prefix.length) !== prefix) {
    let checkContent = msg.content.toLowerCase().replace(/[\u007F-\uFFFF]\s*/g, "").replace(/`/g, '').replace(/\n/g, '').replace(/\*/g, '').replace(/_/g, '').replace(/~/g, '')
    let embed; let checkChars = checkFontChar(msg.content, moderators)
    if (badToGood(checkContent, moderators) === true) {
      embed = createEmbed('Word censor', `${nickName}\'s message got deleted:\n**${msg.content}**`, 'Moderation', bot)
      await bot.createMessage(logChannel, { embed })
      await msg.delete()
      await bot.createMessage((await bot.getDMChannel(msg.member.id)).id, 'You have been moderated, that word is not allowed here!')
    }
    if (checkChars === true) {
      embed = createEmbed('Wierd font moderation', `${nickName}\'s message got deleted:\n**${msg.content}**`, 'Moderation', bot)
      await bot.createMessage(logChannel, { embed })
      await msg.delete()
      await bot.createMessage((await bot.getDMChannel(msg.member.id)).id, 'You have been moderated, that type of text is not allowed here!')
    }
  }
  let mentioned; let mentionedNickName;
  msg.mentions.length === 0 ? mentioned = false : mentioned = msg.mentions[0]
  if (mentioned !== false)
    mentioned.nick == null ? mentionedNickName = mentioned.username : mentionedNickName = mentioned.nick
  let newMsg = msg.content.slice(prefix.length)
  let command = newMsg.split(' ')[0]
  if (command === 'rank') {
    let embed;
    if (mentioned === false)
      embed = createEmbedFields(null, msg.member, [{ name: 'Rank Card', value: `You currently have ${userXp[msg.author.id]['xp']} xp and need ${(userXp[msg.author.id]['xpToLvl'])} more xp to level up` }, { name: 'Level', value: userXp[msg.author.id]['lvl'] }], 'XpSystem', true)
    else if (userXp[mentioned.id] == null)
      embed = createEmbedFields(null, mentioned, [{ name: 'Rank Card', value: 'They have not yet started to gain xp' }, { name: 'Level', value: 'Unranked' }])
    else
      embed = createEmbedFields(null, mentioned, [{ name: 'Rank Card', value: `They currently have ${userXp[mentioned.id]['xp']} xp and need ${(userXp[mentioned.id]['xpToLvl'])} more xp to level up` }, { name: 'Level', value: userXp[mentioned.id]['lvl'] }], 'XpSystem', true)
    await msg.channel.createMessage({ embed })
  }
  if (command === 'leaderboard') {
    let leaderboard = []
    let messageArr = ['#', 'XP', 'User']; let message = '``';
    for (let j in messageArr)
      message += ' | ' + messageArr[j]
    message += '\n'
    Object.keys(userXp).forEach(user => {
      leaderboard.push(userXp[user])
    })
    leaderboard.sort((a, b) => b.xp - a.xp)
    leaderboard = leaderboard.slice(0, 10)
    let top10 = message
    for (let i = 0; i < 10 && i < leaderboard.length; i++) {
      let rank = (Number(i) + 1).toString().padStart(2, '\u2000')
      leaderboard[i].xp = (leaderboard[i].xp.toString()).padStart(4, '\u2000')
      top10 += `|${rank}  |${leaderboard[i].xp}|${leaderboard[i].user}\n`
    }
    top10 += '``'
    let embed = createEmbed('XP Leaderboard', top10, 'Leaderboard', bot)
    return await msg.channel.createMessage({ embed })

  }
  if (moderators === true) {
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
    if (command === 'user-info') {
      if (mentioned === false)
        return await msg.channel.createMessage('You need to specify an user')
      let discordJoinDate = new Date(mentioned.createdAt).toString(); let serverJoinDate = new Date(msg.channel.guild.members.get(msg.mentions[0].id).joinedAt).toString()
      let embedFields = [{ name: 'Joined Discord at', value: discordJoinDate }, { name: 'Joined Server at', value: serverJoinDate }]
      let embed = {
        color: 0x6ade89,
        timestamp: new Date(),
        fields: embedFields,
        thumbnail: {
          url: mentioned.avatarURL
        },
        footer: {
          icon_url: bot.user.avatarURL,
          text: 'User Info'
        }
      }
      msg.channel.createMessage({ embed })
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
function badToGood(word, moderators) {
  if (moderators)
    return false
  word = word.toLowerCase()
  let badwords = ['bad', 'words', 'as', 'array', 'strings']
  let checker = false;
  if (badwords.some(bad => word.includes(bad)))
    checker = true;
  return checker;
}
function nicknameCheck(word, moderators) {
  if (moderators)
    return false
  word = word.toLowerCase()
  let badwords = ['rp1']
  let checker = false;
  if (badwords.some(bad => word.includes(bad)))
    checker = true;
  return checker;
}
function checkFontChar(phrase, moderators) {
  if (moderators)
    return false
  let check = phrase.match(/(?:[\p{M}]{1})([\p{M}])+?/uisg)
  if (check == null)
    return false
  else
    return true
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
function checkForMod(member, moderator) {
  let checker = false
  moderator.forEach(role => {
    if (member.roles.indexOf(role) >= 0)
      checker = true
  })
  return checker
}
function createEmbedFields(content, member, fields, footerText, boolean) {

  let embedMessageDefault = {
    author: {
      name: `${member.username}#${member.discriminator}`,
      icon_url: member.avatarURL
    },
    thumbnail: {
      url: member.avatarURL
    },
    color: 0x6ade89,
    timestamp: new Date(),
    fields: fields,
    footer: {
      text: footerText
    }
  }
  if (content != null)
    embedMessageDefault['description'] = content
  if (boolean === true)
    delete embedMessageDefault['thumbnail']
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
(async () => {
  await bot.connect();
  await xpSystem.load();
})().catch(console.error);
