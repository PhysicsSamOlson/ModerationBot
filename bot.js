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
const profileCard = require('./Misc/profileCard')
const bot = new Eris(info.token);
const moderator = info.moderators //edit these
const muted = info.muted //in 
const logChannel = info.logChannel //info.json
const censoredWords = info.censoredWords
const censoredUsernames = info.censoredUsernames
const welcomeMessage = fs.readFileSync("./Misc/welcome.txt", 'utf-8') //Your welcome message to new users located here
bot.on("ready", async () => {
  await bot.editStatus({
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
  let embed = createEmbedFields(null, member, [{ name: 'Member Left', value: `<@!${member.id}> has left ${guild.name}` }], `ID: ${member.id}`, false)
  await bot.createMessage(logChannel, { embed })
})
bot.on("messageUpdate", async (message, oldMessage) => {
  if (message == null || message.channel.guild == null || message.author.bot === true || oldMessage == null)
    return
  let fullMsg = message.content.slice()
  if (message.content === oldMessage.content)
    return
  if (oldMessage.content.length > 1000)
    oldMessage.content = oldMessage.content.slice(0, 1000) + '...'
  if (message.content.length > 1000) {
    message.content = message.content.slice(0, 1000) + '...'
  }
  let embed = createEmbedFields(`**Message edited in <#${message.channel.id}> [Jump to Message](https://discordapp.com/channels/${message.channel.guild.id}/${message.channel.id}/${message.id})**`, message.member, [{ name: 'Before', value: oldMessage.content }, { name: 'After', value: message.content }], `User ID: ${message.member.id}`, false)
  await bot.createMessage(logChannel, { embed })
  if (badToGood(fullMsg, checkForMod(message.member, moderator)) || checkFontChar(fullMsg, checkForMod(message.member, moderator))) {
    embed = createEmbed('Word censor', `${message.member.username}#${message.member.discriminator}\'s message got deleted:\n**${message.content}**`, 'Moderation', bot)
    await bot.createMessage(logChannel, { embed })
    await message.delete()
    await bot.createMessage((await bot.getDMChannel(message.member.id)).id, 'You have been moderated, that word is not allowed here!')
  }
})
bot.on("messageDelete", async (message) => {
  if (message.channel.guild == null || message == null || message.content == null)
    return
  if (message.content.length > 1000)
    message.content = message.content.slice(0, 1000) + '...'
  try {
    let embed = createEmbedFields(`**Message sent by <@!${message.member.id}> deleted in <#${message.channel.id}>**`, message.member, [{ name: 'Deleted Message', value: message.content }], `User ID: ${message.member.id}`, false)
    await bot.createMessage(logChannel, { embed })
  } catch {
    message.embeds.description == null ? message.embeds.description = 'Unknown content' : message.embeds.description = message.embeds.description
    let embed = createEmbedFields(`**Embed message sent by <@!${message.member.id}> deleted in <#${message.channel.id}>**`, message.member, [{ name: 'Deleted Message', value: message.embeds.description }], `User ID: ${message.member.id}`, false); await bot.createMessage(logChannel, { embed })
  }
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
  let embed = createEmbedFields(null, member, [{ name: 'Nickname Change', value: `<@!${member.id}> changed their name from ${oldMember.nick} to ${nickName}` }], 'Logger', true)
  await bot.createMessage(logChannel, { embed })
})
bot.on("messageCreate", async (msg) => {
  if (msg.member == null || msg.author.bot === true)
    return
  let userXp = JSON.parse(xpSystem.userXp)
  let randomNum = Math.random(); let amountofXp;
  randomNum <= 0.33 ? amountofXp = 15 : randomNum > 0.33 && randomNum <= 0.66 ? amountofXp = 20 : amountofXp = 25;
  if (userXp[msg.author.id] == null) {
    userXp[msg.author.id] = { xp: amountofXp, time: Date.now(), lvl: 0, xpToLvl: 100 - amountofXp, totalXP: 100, user: `${msg.author.username}#${msg.author.discriminator}`, cooldown: Date.now() - 10000 }
    await xpSystem.updateUserXp(userXp)
  }
  if ((Date.now() - userXp[msg.author.id]['time']) > 60000) {
    let xp2lvl = 5 * (Math.pow(userXp[msg.author.id]['lvl'], 2)) + 50 * userXp[msg.author.id]['lvl'] + 100;
    if ((userXp[msg.author.id]['xp'] + amountofXp) >= userXp[msg.author.id]['totalXP']) {
      xp2lvl = 5 * (Math.pow(userXp[msg.author.id]['lvl'] + 1, 2)) + 50 * (userXp[msg.author.id]['lvl'] + 1) + 100;
      userXp[msg.author.id] = { xp: userXp[msg.author.id]['xp'] + amountofXp, time: Date.now(), lvl: userXp[msg.author.id]['lvl'] + 1, xpToLvl: (userXp[msg.author.id]['totalXP'] + xp2lvl) - (userXp[msg.author.id]['xp'] + amountofXp), totalXP: xp2lvl + userXp[msg.author.id]['totalXP'], user: `${msg.author.username}#${msg.author.discriminator}`, cooldown: userXp[msg.author.id]['cooldown'] }
      await bot.createMessage(msg.channel.id, `Nice ${msg.member.username}#${msg.member.discriminator}, you xfered enough rating to get to level ${userXp[msg.author.id]['lvl']}!`)
    } else
      userXp[msg.author.id] = { xp: userXp[msg.author.id]['xp'] + amountofXp, time: Date.now(), lvl: userXp[msg.author.id]['lvl'], xpToLvl: userXp[msg.author.id]['totalXP'] - (userXp[msg.author.id]['xp'] + amountofXp), totalXP: userXp[msg.author.id]['totalXP'], user: `${msg.author.username}#${msg.author.discriminator}`, cooldown: userXp[msg.author.id]['cooldown'] }
    await xpSystem.updateUserXp(userXp)
  }
  let nickName; msg.member.nick == null ? nickName = msg.member.username : nickName = msg.member.nick
  let prefix = info.prefix
  checkForMod(msg.member, moderator) ? moderators = true : moderators = false
  if (msg.content.substring(0, prefix.length) !== prefix) {
    let checkContent = msg.content
    let checkChars = checkFontChar(msg.content, moderators)
    if (badToGood(checkContent, moderators) === true) {
      await msg.delete()
      try {
        await bot.createMessage((await bot.getDMChannel(msg.member.id)).id, 'You have been moderated, that word is not allowed here!')
      } catch { return }
    }
    if (checkChars === true) {
      await msg.delete()
      try {
        await bot.createMessage((await bot.getDMChannel(msg.member.id)).id, 'You have been moderated, that type of text is not allowed here!')
      } catch { return }
    }
  }
  let mentioned; let mentionedNickName;
  msg.mentions.length === 0 ? mentioned = false : mentioned = msg.mentions[0]
  if (mentioned !== false)
    mentioned.nick == null ? mentionedNickName = mentioned.username : mentionedNickName = mentioned.nick
  let newMsg = msg.content.slice(prefix.length)
  let command = newMsg.split(' ')[0]
  if (command === 'rank') {
    let cooldowns = userXp[msg.author.id]['cooldown']
    if (cooldowns + 10000 > Date.now())
      return msg.channel.createMessage(`Cooldown... please wait **${Math.floor((cooldowns + 10000 - Date.now()) / 1000)}** more seconds`)
    try {
      await profileCard.execute(msg, userXp)
      userXp[msg.author.id]['cooldown'] = Date.now()
      await xpSystem.updateUserXp(userXp)
    } catch (e) { console.error(e) }
  }
  if (command === 'leaderboard') {
    let leaderboard = []
    const rankFieldWidth = 2;
    const xpFieldWidth = 6;
    let header = `| ${'#'.padStart(rankFieldWidth)} | ${'XP'.padStart(xpFieldWidth)} | User\n`
    Object.keys(userXp).forEach(user => {
      leaderboard.push(userXp[user])
    })
    leaderboard.sort((a, b) => b.xp - a.xp)
    leaderboard = leaderboard.slice(0, 10)
    let top10 = header
    for (let i = 0; i < 10 && i < leaderboard.length; i++) {
      let rank = String(i + 1)
      let xp = String(leaderboard[i].xp)
      let user = leaderboard[i].user
      top10 += `| ${rank.padStart(rankFieldWidth)} | ${xp.padStart(xpFieldWidth)} | ${user}\n`
    }
    let embed = createEmbed('XP Leaderboard', '```' + top10 + '```', 'Leaderboard', bot)
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
        return await bot.createMessage(msg.channel.id, 'Sorry I can only delete up to 100 messages at a time')
      if (isNaN(x[1]) || Math.sign(x[1]) === -1 || Number(x[1]) === 0)
        return await bot.createMessage(msg.channel.id, 'Invalid amount of messages to delete')
      await msg.channel.purge(x[1])
      await bot.createMessage(msg.channel.id, x[1] + ' messages have been deleted').then(function (response) {
        setTimeout(async function () {
          await response.delete()
        }, 60000)
      })
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
    if (command === 'ban') {
      if (mentioned === false)
        return await msg.channel.createMessage('You need to specify an user')
      if (checkForMod(msg.channel.guild.members.get(mentioned.id), moderator))
        return await msg.channel.createMessage('I cannot ban that user')
      try {
        let embed = createEmbed(`${mentioned.username}#${mentioned.discriminator}`, `${mentionedNickName} has been banned by ${nickName}`, 'Banhammer', bot)
        await bot.banGuildMember(msg.channel.guild.id, mentioned.id, 7, `Banned by ${nickName}`)
        return await msg.channel.createMessage({ embed })
      } catch { await msg.channel.createMessage('I do not have permissions to ban that user') }
    }

    if (command === 'unban') {
      if (msg.content.split(' ').length < 2)
        return await msg.channel.createMessage(`The syntax is ${prefix}unban USERID`)
      let unbannedUser = msg.content.split(' ').slice(1).join(' ')
      let embed = createEmbed('User Unbanned', `<@!${unbannedUser}> has been unbanned by ${nickName}`, 'Banhammer', bot)
      try {
        await bot.unbanGuildMember(msg.channel.guild.id, unbannedUser, 7, `Unbanned by ${nickName}`)
        return await msg.channel.createMessage({ embed })
      } catch { await msg.channel.createMessage('That user is not banned') }
    }
    if (command === 'mute') {
      if (mentioned === false)
        return await msg.channel.createMessage('You need to specify an user')
      if (checkForMod(msg.channel.guild.members.get(mentioned.id), moderator))
        return await msg.channel.createMessage('I cannot mute that user')
      try {
        await bot.addGuildMemberRole(msg.channel.guild.id, mentioned.id, muted, `Muted by ${nickName}`)
        let embed = createEmbed(`${mentioned.username}#${mentioned.discriminator}`, `${mentionedNickName} has been muted by ${nickName}`, 'Mutehammer', bot)
        return await msg.channel.createMessage({ embed })
      } catch { await msg.channel.createMessage('I do not have permissions to mute this user') }
    }
    if (command === 'unmute') {
      if (mentioned === false)
        return await msg.channel.createMessage('You need to specify an user')
      if (checkForMod(msg.channel.guild.members.get(mentioned.id), moderator))
        return await msg.channel.createMessage('I cannot unmute that user')
      try {
        await bot.removeGuildMemberRole(msg.channel.guild.id, mentioned.id, muted, `Unmuted by ${nickName}`)
        let embed = createEmbed('User Unmuted', `${mentionedNickName} has been unmuted by ${nickName}`, 'Mutehammer', bot)
        return await msg.channel.createMessage({ embed })
      } catch { await msg.channel.createMessage('I do not have permissions to unmute this user') }
    }
    if (command === 'kick') {
      if (mentioned === false)
        return await msg.channel.createMessage('You need to specify an user')
      if (checkForMod(msg.channel.guild.members.get(mentioned.id), moderator))
        return await msg.channel.createMessage('I cannot kick that user')
      try {
        await msg.channel.guild.members.get(mentioned.id).kick(`Kicked by ${nickName}`)
        let embed = createEmbed(`${mentioned.username}#${mentioned.discriminator}`, `${mentionedNickName} has been kicked by ${nickName}`, 'Kickhammer', bot)
        return await msg.channel.createMessage({ embed })
      } catch { await msg.channel.createMessage('That user cannot be kicked') }
    }
  }

})
function badToGood(word, moderators) {
  if (moderators)
    return false
  word = word.toLowerCase().replace(/[\u007F-\uFFFF]\s*/g, "").replace(/`/g, '').replace(/\n/g, '').replace(/\*/g, '').replace(/_/g, '').replace(/~/g, '')
  let checker = false;
  if (censoredWords.some(bad => word.includes(bad)))
    checker = true;
  return checker;
}
function nicknameCheck(word, moderators) {
  if (moderators)
    return false
  word = word.toLowerCase()
  let checker = false;
  if (censoredUsernames.some(bad => word.includes(bad)))
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
