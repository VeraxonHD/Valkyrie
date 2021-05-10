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

    if(args == null){
        return interaction.reply("Code 101 - No Arguments Supplied.");
    }else if(member.permissions.has("BAN_MEMBERS") == false){
        return interaction.reply("Code 103 - Invalid Permissions. You are missing permission BAN_MEMBERS")
    }else{
        var targetID;
        var reason = "No Reason Specified";
        args[0].options.forEach(arg => {
            if(arg.name == "member" || arg.name == "user"){
                targetID = arg.value;
            }else if(arg.name == "reason"){
                reason = arg.value;
            }
        });

        guild.members.fetch(targetID).then(targetMember =>{
            if(targetMember.bannable){
                targetMember.ban({days: 7, reason: reason});
                interaction.reply(`User ${targetMember.displayName} was banned from the server. Reason: ${reason}. <:banhammer:722877640201076775>`)
                Configs.findOne({where:{guildID: guild.id}}).then(guildConfig => {
                    guild.channels.resolve(guildConfig.logChannelID).send(logs.logBan(targetMember, reason, member));
                }).then(()=>{
                    var guildUserCompositeKey = guild.id + targetID
                    Users.increment("globalBanCount",{where:{userID: targetID}});
                    GuildUsers.increment("guildBanCount",{where:{guildUserID: guildUserCompositeKey}});
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