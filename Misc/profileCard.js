//CREDIT TO https://github.com/riyacchi/ for providing majority of the profileCard.js code. Thanks Riya! If you copy any of this code, you must give credit to https://github.com/riyacchi/ and follow the License.
const uniqid = require('uniqid');
const Canvas = require('canvas');

class Profile {
    /**
     * Main method getting executed upon command trigger
     * @param {object} message Message object emitted from the Discord API
     */
    async execute(message, userXp) {
        let profileCardUser;
        if (message.mentions.length) {
            profileCardUser = message.mentions[0];
        } else {
            profileCardUser = message.author;
        } if (profileCardUser.bot) return message.channel.createMessage('Bots don\'t have xp')

        // Indicate loading
        message.channel.sendTyping();

        // Create canvas and its context
        const canvas = Canvas.createCanvas(400, 170);
        const ctx = canvas.getContext('2d');


        try {
            // Profile card data
            const bgImg = await Canvas.loadImage('./Misc/mb3.png');
            const avatar = await Canvas.loadImage(profileCardUser.dynamicAvatarURL('jpg', 128));
            const dbLevel = userXp[profileCardUser.id].lvl;
            const dbXP = userXp[profileCardUser.id].xp;
            const totalXP = userXp[profileCardUser.id].totalXP;
            const xpNeededForLevelUp = (5 * (Math.pow(dbLevel, 2)) + 50 * (dbLevel) + 100)
            const currentXPToBeginWith = xpNeededForLevelUp - (totalXP - dbXP);
            const levelPercentageComplete = Math.floor(currentXPToBeginWith / xpNeededForLevelUp * 100);
            const scorebarWidth = levelPercentageComplete * 2.8;
            let leaderboard = [];
            Object.keys(userXp).forEach(user => {
                userXp[user]['id'] = user
                leaderboard.push(userXp[user])
            })
            leaderboard.sort((a, b) => b.xp - a.xp)
            const rank = (leaderboard.map(function (e) { return e.id; }).indexOf(profileCardUser.id)) + 1;
            // Background Fill
            ctx.fillStyle = '#2d2d37';
            ctx.fillRect(0, 0, 400, 170);

            // Background Image
            ctx.drawImage(bgImg, 0, 0, 400, 105);

            // Background Image Overlay
            ctx.fillStyle = 'rgba(9, 9, 9, .5)';
            ctx.fillRect(0, 0, 400, 105);

            // Username
            ctx.font = '16px Arial';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(profileCardUser.username, 136, 95);
            const usernameLength = ctx.measureText(profileCardUser.username).width;

            // Usertag
            ctx.font = '10px Exo';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText('#' + profileCardUser.discriminator, 136 + usernameLength, 95);

            // Levelbar Background
            ctx.fillStyle = "rgba(132, 132, 132, .4)";
            ctx.fillRect(120, 105, 280, 5);

            // Levelbar
            ctx.fillStyle = "#" + 'e8ff54';
            ctx.fillRect(120, 105, scorebarWidth, 5);

            // Levelbar Text Now
            ctx.font = 'bold 9px Arial Bold';
            ctx.textAlign = 'right';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(currentXPToBeginWith, 392 - ctx.measureText(' / ' + xpNeededForLevelUp + ' XP').width, 100);

            // Levelbar Text Needed
            ctx.font = '9px Arial';
            ctx.textAlign = 'right';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(' / ' + xpNeededForLevelUp + ' XP', 392, 100);

            // Level Label
            ctx.font = '10px Exo';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#' + 'e65c5c';
            ctx.fillText('LEVEL', 150, 133);

            // Level Text
            ctx.font = '16px Exo';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(dbLevel, 150, 152);
            // Rank Label
            ctx.font = "10px Exo";
            ctx.textAlign = 'center';
            ctx.fillStyle = '#' + '4287f5';
            ctx.fillText('RANK', 270, 133);

            // Rank Text
            ctx.font = "16px Exo";
            ctx.textAlign = 'center';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(rank, 270, 152);
            // XP Label
            ctx.font = "10px Exo";
            ctx.textAlign = 'center';
            ctx.fillStyle = '#' + '66e055';
            ctx.fillText('TOTAL XP', 210, 133);

            // XP Text
            ctx.font = "16px Exo";
            ctx.textAlign = 'center';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(dbXP, 210, 152);

            // Bot Owner Icon ** Please keep this as me, for credit :) **
            if (profileCardUser.id === '288841415696449538') {
                const ownerBadge = await Canvas.loadImage('./Misc/creatorBadge.png');

                ctx.drawImage(ownerBadge, 343, 126, 16, 12);
                ctx.font = "9px Exo";
                ctx.textAlign = 'center';
                ctx.fillStyle = '#FFFFFF';
                ctx.fillText('CREATOR', 350, 151);
            }

            // 100k XP Badge
            if (dbXP >= 100000 && profileCardUser.id !== '288841415696449538') {
                const ohkBadge = await Canvas.loadImage('./Misc/badge.png');
                ctx.drawImage(ohkBadge, 342, 129, 26, 20);
            }

            // Background Avatar Circle
            ctx.beginPath();
            ctx.arc(74, 74, 57, 0, Math.PI * 2, true);
            ctx.fillStyle = "#2d2d37";
            ctx.fill();
            ctx.closePath();

            // Avatar Image
            ctx.save();
            ctx.beginPath();
            ctx.arc(74, 74, 53, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, 21, 21, 106, 106);
            ctx.restore();

            message.channel.createMessage(undefined, { file: canvas.toBuffer(), name: `${uniqid()}.png` });
        } catch (profileGeneratorError) {
            console.error(profileGeneratorError)
        }
    }
}

module.exports = new Profile();
