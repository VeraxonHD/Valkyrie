exports.execute = async (interaction) => {
    //Interaction information
    const guild = interaction.guild;
    const channel = interaction.channel;
    const member = interaction.member;
    const args = interaction.options || null;

    //Dependencies
    const main = require("../main.js");
    const logs = require("../util/logFunctions.js");
    const ms = require("ms");

    //Database Retrieval
    const Users = main.getUsersTable();
    const GuildUsers = main.getGuildUsersTable();
    const Configs = main.getConfigsTable();
    const Mutes = main.getMutesTable();

    if(args == null){
        return interaction.reply("Code 101 - No Arguments Supplied.");
    }else if(member.permissions.has("MANAGE_MESSAGES") == false){
        return interaction.reply("Code 103 - Invalid Permissions. You are missing permission MANAGE_MESSAGES")
    }else{
        var targetID;
        var duration = -1;
        var reason = "No Reason Specified";
        args[0].options.forEach(arg => {
            if(arg.name == "member" || arg.name == "userid"){
                targetID = arg.value;
            }else if(arg.name == "duration"){
                duration = arg.value;
            }else if(arg.name == "reason"){
                reason = arg.value;
            }
        });

        var endsTimestamp;
        try{
            endsTimestamp = Date.now() + ms(duration);
        }catch{
            return interaction.reply("Code 102 - Invalid Argument: 'duration'.\nMust follow (int)(scale)\nExample: ```'10s' - 10 seconds\n'30m' - 30 minutes\n'2h' - 2 Hours\nFull list of examples: https://github.com/vercel/ms#examples```")
        }

        Configs.findOne({where: {guildID: guild.id}}).then(async guildConfig =>{
            var mutedRole = guild.roles.cache.get(guildConfig.mutedRoleID);
            if(!mutedRole){
                return interaction.reply("Code 100 - Muted Role is invalid - database corruption?");
            }
            guild.members.fetch(targetID).then(async targetMember =>{
                targetMember.roles.add(mutedRole).then(async newMember =>{
                    interaction.reply(`**${newMember.displayName}** has been muted for **${duration}**. Reason: **${reason}**.`);
                    newMember.send(`You have been Muted in **${guild.name}** for **${duration}**. Reason: **${reason}**.`);
                    Mutes.create({
                        guildID: guild.id,
                        memberID: targetID,
                        endsAt: endsTimestamp,
                        reason: reason
                    }).then(()=>{
                        var guildUserCompositeKey = guild.id + targetID
                        Users.increment("globalMuteCount",{where:{userID: targetID}});
                        GuildUsers.increment("guildMuteCount",{where:{guildUserID: guildUserCompositeKey}});
                    }).catch(e => {
                        interaction.reply("Code 110 - Unknown Error with Database.");
                        console.log(e);
                    });
                    guild.channels.resolve(guildConfig.logChannelID).send(await logs.logMute(targetMember, duration, reason, member, guild));
                }).catch(e=>{
                    console.log(e);
                    return interaction.reply("Code 100 - Failed to add Mute Role to User.");
                });
            }).catch( e=>{
                console.log(e);;
                return interaction.reply("Code 104 - Invalid User or Member Argument.");
            });
        }).catch(e => {
            console.log(e);
            return interaction.reply("Code 110 - Unknown Error with Database.");
        });
    }
}