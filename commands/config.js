exports.execute = (interaction) => {
    //Interaction information
    const guild = interaction.guild;
    const channel = interaction.channel;
    const member = interaction.member;
    const args = interaction.options || null;

    //Dependencies
    const main = require("../main.js");
    const logs = require("../util/logFunctions.js");

    //Database Retrieval
    const Configs = main.getConfigsTable();

    if(args == null){
        return channel.send("Code 101 - No Arguments Supplied.");
    }else if(member.hasPermission("ADMINISTRATOR") == false){
        return channel.send("Code 103 - Invalid Permissions.")
    }else{
        args[0].options.forEach(arg => {
            var conVar = arg.name;
            var value = arg.value;
            if(conVar == "muterole"){
                Configs.update({mutedRoleID: value},{where: {guildID: guild.id}}).catch(e => {
                    channel.send("Code 110 - Unknown Error with Database.")
                    console.log(e);
                });
                return channel.send(`Updated muted role to <@&${value}> successfully.`);
            }else if(conVar == "logchannel"){
                Configs.update({logChannelID: value},{where: {guildID: guild.id}}).catch(e => {
                    channel.send("Code 110 - Unknown Error with Database.")
                    console.log(e);
                });
                return channel.send(`Updated log channel to <#${value}> successfully.`);
            }else if(conVar == "autorole"){
                Configs.update({autoRoleID: value},{where: {guildID: guild.id}}).catch(e =>{
                    channel.send("Code 110 - Unknown Error with Database.");
                    console.log(e);
                });
                return channel.send(`Updated auto role to <@&${value}> successfully.`);
            }
        });
    }
}