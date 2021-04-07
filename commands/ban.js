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
    }else if(member.hasPermission("BAN_MEMBERS") == false){
        return interaction.reply("Code 103 - Invalid Permissions.")
    }else{
        var targetID;
        var reason = "No Reason Specified";
        args[0].options.forEach(arg => {
            if(arg.name == "mention" || arg.name == "userid"){
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
                    return interaction.reply("Code 110 - Unknown Error with Database.");
                });
                
            }else{
                return interaction.reply("Code 100 - Unknown Error Occurred.");
            }
        }); 
    }
}