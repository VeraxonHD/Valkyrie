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
    }else if(member.permissions.has("BAN_MEMBERS") == false){
        return interaction.reply("Code 103 - Invalid Permissions. You are missing permission BAN_MEMBERS")
    }else{
        var targetID = interaction.options.getMember("member")? interaction.options.getMember("member").id: interaction.options.getString("userid");
        var reason = interaction.options.getString("reason");
        if(!reason){
            reason = "No reason Specified."
        }

        guild.members.fetch(targetID).then(async targetMember =>{
            if(targetMember.bannable){
                targetMember.ban({days: 7, reason: reason});
                interaction.reply(`User ${targetMember.displayName} was banned from the server. Reason: ${reason}. <:banhammer:722877640201076775>`)
                Configs.findOne({where:{guildID: guild.id}}).then(async guildConfig => {
                    const logchannel = await guild.channels.resolve(guildConfig.logChannelID);
                    const embed = await logs.logBan(targetMember.id, reason, member, guild);
                    logchannel.send({embeds: [embed]});
                }).then(()=>{
                    var guildUserCompositeKey = guild.id + targetID
                    Users.increment("globalBanCount",{where:{userID: targetID}});
                    GuildUsers.increment("guildBanCount",{where:{guildUserID: guildUserCompositeKey}});
                    Infractions.create({
                        guildID: guild.id,
                        userID: targetID,
                        type: 3,
                        reason: reason,
                        moderatorID: member.id
                    });
                }).catch(e => {
                    console.log(e);
                    return interaction.reply("Code 110 - Database Error - could not find a config record for this guild..");
                });
                
            }else{
                return interaction.reply("Code 104 - Unknown target member. They may have left the server or you may have an invalid mention. Try using \`/ban user\` instead.");
            }
        }); 
    }
}