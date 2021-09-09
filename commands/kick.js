exports.execute = async (interaction) => {
    //Interaction information
    const guild = interaction.guild;
    const channel = interaction.channel;
    const member = interaction.member;
    const args = interaction.options || null;

    //Dependencies
    const main = require("../main.js");
    const logs = require("../util/logFunctions.js");

    //Database Retrieval
    const Users = main.getUsersTable();
    const GuildUsers = main.getGuildUsersTable();
    const Configs = main.getConfigsTable();
    const Infractions = main.getInfractionsTable();
    
    if(args == null){
        return interaction.reply("Code 101 - No Arguments Supplied.");
    }else if(member.permissions.has("KICK_MEMBERS") == false){
        return interaction.reply("Code 103 - Invalid Permissions. You are missing permission KICK_MEMBERS")
    }else{
        var targetID = interaction.options.getMember("member")? interaction.options.getMember("member").id: interaction.options.getString("userid");
        var reason = interaction.options.getString("reason");
        if(!reason){
            reason = "No reason specified"
        }

        guild.members.fetch(targetID).then(async targetMember =>{
            if(targetMember.kickable){
                targetMember.kick(reason);
                interaction.reply(`User ${targetMember.displayName} was kicked from the server. Reason: ${reason}`);
                Configs.findOne({where:{guildID: guild.id}}).then(async guildConfig => {
                    const embed = await logs.logKick(targetMember, reason, member, guild);
                    const logchannel = await guild.channels.resolve(guildConfig.logChannelID);
                    logchannel.send({embeds: [embed]});
                }).then(()=>{
                    var guildUserCompositeKey = guild.id + targetID
                    Users.increment("globalKickCount",{where:{userID: targetID}});
                    GuildUsers.increment("guildKickCount",{where:{guildUserID: guildUserCompositeKey}});
                    Infractions.create({
                        guildID: guild.id,
                        userID: targetMember.id,
                        type: 2,
                        reason: reason,
                        moderatorID: member.id
                    })
                }).catch(e => {
                    console.log(e);
                    return interaction.reply("Code 110 - Unknown Error with Database.");
                });
            }else{
                return interaction.reply("Code 100 - Unknown Error Occurred.")
            }
        }); 
    }
}