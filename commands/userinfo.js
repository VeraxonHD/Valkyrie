exports.execute = (interaction) => {
    //Interaction information
    const guild = interaction.guild;
    const channel = interaction.channel;
    const member = interaction.member;
    const args = interaction.options || null;

    //Dependencies
    const main = require("../main.js");
    const logs = require("../util/logFunctions.js");
    const Discord = require("discord.js");

    //Database Retrieval
    const Users = main.getUsersTable();
    const GuildUsers = main.getGuildUsersTable();

    var targetID;
    if(args != null){
        targetID = args[0].value;
    }else{
        targetID = member.id;
    }

    guild.members.fetch(targetID).then(targetMember =>{
        Users.findOne({where: {userID: targetMember.id}}).then(userData => {
            var guildUserCompositeKey = guild.id + targetMember.id;
            var lastSeenChannelName = client.guilds.cache.get(userData.lastSeenGuildID).channels.resolve(userData.lastSeenChannelID);
            var lastSeenGuildName = client.guilds.cache.get(userData.lastSeenGuildID).name;
            GuildUsers.findOne({where: {guildUserID: guildUserCompositeKey}}).then(guildUserData =>{
                const embed = new Discord.MessageEmbed()
                    .setAuthor(`UserInfo for ${targetMember.user.tag}`)
                    .addField("General User Data", `**User ID**: ${targetMember.id}\n**Account Mention**: ${targetMember}\n**Is a Bot?**: ${targetMember.user.bot}\n**Created At**: ${df(targetMember.user.createdTimestamp, "dd/mm/yyyy HH:MM:ss Z")}`)
                    .addField("Global Valkyrie Data", `**Messages Sent**: ${userData.globalMsgCount}\n**Last Seen** in ${lastSeenGuildName} (${lastSeenChannelName}) at ${df(userData.lastSeenTime, "dd/mm/yyyy HH:MM:ss Z")}`)
                    .addField("Global Infractions", `**Warns**:${userData.globalMuteCount}\n**Mutes**:${userData.globalMuteCount}\n**Kicks**:${userData.globalKickCount}\n**Bans**:${userData.globalBanCount}`, true)
                    .addField("This Guild Data", `**Messages Sent**: ${guildUserData.guildMsgCount}\n**Joined At**: ${df(guildUserData.createdAt, "dd/mm/yyyy HH:MM:ss Z")}`)
                    .addField("This Guild Infractions", `**Warns**:${guildUserData.guildWarnCount}\n**Mutes**:${guildUserData.guildMuteCount}\n**Kicks**:${guildUserData.guildKickCount}\n**Bans**:${guildUserData.guildBanCount}`, true)
                    .setColor("#00C597")
                    .setFooter("userinfo.interactions.valkyrie")
                    .setTimestamp(new Date());
            channel.send({embed})
            })
        })
    })
}