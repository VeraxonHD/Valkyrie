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
    const df = require("dateformat");

    //Database Retrieval
    const Users = main.getUsersTable();
    const GuildUsers = main.getGuildUsersTable();
    const Infractions = main.getInfractionsTable();
    const client = main.getClient();

    var memberID = args.getMember("member")? args.getMember("member").id: null;
    var userID = args.getString("userid")? args.getString("userid") : null;
    var targetID;

    if(memberID){
        targetID = memberID;
    }else if(userID){
        targetID = userID;
    }else if(!memberID && !userID){
        targetID = member.id;
    }

    guild.members.fetch(targetID).then(async targetMember =>{
        Users.findOne({where: {userID: targetMember.id}}).then(async userData => {
            if(!userData){
                return interaction.reply({content: `Sorry, but the user data for that user could not be found, implying they have never sent a message in a server where Valkyrie is also present.`, ephemeral: true});
            }
            var guildUserCompositeKey = guild.id + targetMember.id;
            var lastSeenChannelName = client.guilds.cache.get(userData.lastSeenGuildID).channels.resolve(userData.lastSeenChannelID);
            var lastSeenGuildName = client.guilds.cache.get(userData.lastSeenGuildID).name;
            var guildWarnCount = 0, guildMuteCount = 0, guildKickCount = 0, guildBanCount = 0;
            var globalWarnCount = 0, globalMuteCount = 0, globalKickCount = 0, globalBanCount = 0;

            await Infractions.findAll({where: {userID: targetMember.id}}).then(async allInfractions => {
                allInfractions.forEach(infraction => {
                    if(infraction.type == 0){
                        globalWarnCount++
                    }else if(infraction.type == 1){
                        globalMuteCount++
                    }else if(infraction.type == 2){
                        globalKickCount++
                    }else if(infraction.type == 3){
                        globalBanCount++
                    }

                    if(infraction.guildID == guild.id){
                        if(infraction.type == 0){
                            guildWarnCount++
                        }else if(infraction.type == 1){
                            guildMuteCount++
                        }else if(infraction.type == 2){
                            guildKickCount++
                        }else if(infraction.type == 3){
                            guildBanCount++
                        }
                    }
                })
            })
            
            GuildUsers.findOne({where: {guildUserID: guildUserCompositeKey}}).then(guildUserData =>{
                const embed = new Discord.MessageEmbed()
                    .setAuthor(`UserInfo for ${targetMember.user.tag}`)
                    .addField("General User Data", `**User ID**: ${targetMember.id}\n**Account Mention**: ${targetMember}\n**Is a Bot?**: ${targetMember.user.bot}\n**Created At**: ${df(targetMember.user.createdTimestamp, "dd/mm/yyyy HH:MM:ss Z")}`)
                    .addField("Global Valkyrie Data", `**Messages Sent**: ${userData.globalMsgCount}\n**Last Seen** in ${lastSeenGuildName} (${lastSeenChannelName}) at ${df(userData.lastSeenTime, "dd/mm/yyyy HH:MM:ss Z")}`)
                    .addField("Global Infractions", `**Warns**: ${globalWarnCount}\n**Mutes**: ${globalMuteCount}\n**Kicks**: ${globalKickCount}\n**Bans**:  ${globalBanCount}`, true)
                    .addField("This Guild Data", `**Messages Sent**: ${guildUserData.guildMsgCount}\n**Joined At**: ${df(guildUserData.createdAt, "dd/mm/yyyy HH:MM:ss Z")}`)
                    .addField("This Guild Infractions", `**Warns**: ${guildWarnCount}\n**Mutes**: ${guildMuteCount}\n**Kicks**: ${guildKickCount}\n**Bans**: ${guildBanCount}`, true)
                    .setColor("#00C597")
                    .setFooter("userinfo.interactions.valkyrie")
                    .setTimestamp(new Date());
                interaction.reply({embeds: [embed]})
            })
        })
    })
}