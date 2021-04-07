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
        return interaction.reply("Code 101 - No Arguments Supplied.");
    }else if(member.permissions.has("ADMINISTRATOR") == false){
        return interaction.reply("Code 103 - Invalid Permissions.")
    }else{
        args[0].options.forEach(arg => {
            var conVar = arg.name;
            var value = arg.value;
            if(conVar == "muterole"){
                Configs.update({mutedRoleID: value},{where: {guildID: guild.id}}).catch(e => {
                    interaction.reply("Code 110 - Unknown Error with Database.")
                    console.log(e);
                });
                return interaction.reply(`Updated muted role to <@&${value}> successfully.`);
            }else if(conVar == "logchannel"){
                Configs.update({logChannelID: value},{where: {guildID: guild.id}}).catch(e => {
                    interaction.reply("Code 110 - Unknown Error with Database.")
                    console.log(e);
                });
                return interaction.reply(`Updated log channel to <#${value}> successfully.`);
            }else if(conVar == "autorole"){
                Configs.update({autoRoleID: value},{where: {guildID: guild.id}}).catch(e =>{
                    interaction.reply("Code 110 - Unknown Error with Database.");
                    console.log(e);
                });
                return interaction.reply(`Updated auto role to <@&${value}> successfully.`);
            }
        });
    }
}