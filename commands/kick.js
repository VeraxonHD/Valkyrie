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
    }else if(member.permissions.has("KICK_MEMBERS") == false){
        return interaction.reply("Code 103 - Invalid Permissions. You are missing permission KICK_MEMBERS")
    }else{
        var targetID;
        var reason = "No Reason Specified";
        args[0].options.forEach(arg => {
            if(arg.name == "member" || arg.name == "userid"){
                targetID = arg.value;
            }else if(arg.name == "reason"){
                reason = arg.value;
            }
        });

        guild.members.fetch(targetID).then(async targetMember =>{
            if(targetMember.kickable){
                targetMember.kick(reason);
                interaction.reply(`User ${targetMember.displayName} was kicked from the server. Reason: ${reason}.`)
                Configs.findOne({where:{guildID: guild.id}}).then(async guildConfig => {
                    guild.channels.resolve(guildConfig.logChannelID).send(await logs.logKick(targetMember, reason, member, guild));
                }).then(()=>{
                    var guildUserCompositeKey = guild.id + targetID
                    Users.increment("globalKickCount",{where:{userID: targetID}});
                    GuildUsers.increment("guildKickCount",{where:{guildUserID: guildUserCompositeKey}});
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