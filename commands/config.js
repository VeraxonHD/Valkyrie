exports.execute = (interaction) => {
    //Interaction information
    const guild = interaction.guild;
    const channel = interaction.channel;
    const member = interaction.member;
    const args = interaction.options || null;

    //Dependencies
    const main = require("../main.js");
    const logs = require("../util/logFunctions.js");
    const { Op } = require("sequelize");

    //Database Retrieval
    const Configs = main.getConfigsTable();
    const Blacklists = main.getBlacklistsTable();

    if(args == null){
        return interaction.reply("Code 101 - No Arguments Supplied.");
    }else if(member.permissions.has("ADMINISTRATOR") == false){
        return interaction.reply("Code 103 - Invalid Permissions. You are missing permission ADMINISTRATOR.")
    }else{
        var conVar = args[0].name;
        var value = args[0].options? args[0].options[0].value : null;
        if(conVar == "muterole"){
            Configs.update({mutedRoleID: value},{where: {guildID: guild.id}}).then(() =>{
                return interaction.reply(`Updated \`${conVar}\` to \`${value}\` successfully.`)
            }).catch(e => {
                interaction.reply("Code 110 - Unknown Error with Database.")
                return console.error(e);
            });
            return interaction.reply(`Updated muted role to <@&${value}> successfully.`);
        }else if(conVar == "logchannel"){
            Configs.update({logChannelID: value},{where: {guildID: guild.id}}).then(() =>{
                return interaction.reply(`Updated \`${conVar}\` to \`${value}\` successfully.`)
            }).catch(e => {
                interaction.reply("Code 110 - Unknown Error with Database.")
                return console.error(e);
            });
            return interaction.reply(`Updated log channel to <#${value}> successfully.`);
        }else if(conVar == "autorole"){
            Configs.update({autoRoleID: value},{where: {guildID: guild.id}}).then(() =>{
                return interaction.reply(`Updated \`${conVar}\` to \`${value}\` successfully.`)
            }).catch(e =>{
                interaction.reply("Code 110 - Unknown Error with Database.");
                return console.error(e);
            });
            return interaction.reply(`Updated auto role to <@&${value}> successfully.`);
        }else if(conVar == "welcomemsg"){
            Configs.update({welcomeMessage: value},{where: {guildID: guild.id}}).then(() =>{
                return interaction.reply(`Updated \`${conVar}\` to \`${value}\` successfully.`)
            }).catch(e =>{
                interaction.reply("Code 110 - Unknown Error with Database.");
                return console.error(e);
            });
        }else if(conVar == "logs"){
            var subConVar = args[0].options[0].name
            var subValue = args[0].options[0].options[0].value

            Configs.findOne({where: {guildID: guild.id}}).then(config => {
                if(!config){
                    return;
                }else{
                    var logTypes = config.logTypes;
                    logTypes[subConVar] = subValue

                    Configs.update({logTypes: logTypes}, {where: {guildID: guild.id}}).then(() => {
                        return interaction.reply(`Updated log type \`${subConVar}\` to \`${value}\` successfully.`);
                    }).catch(e => {
                        interaction.reply("Code 110 - Unknown Error with Database.");
                        return console.error(e);
                    })
                }
            })
        }
    }
}