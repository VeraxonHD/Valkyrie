exports.execute = async (interaction) => {
    //Interaction information
    const guild = interaction.guild;
    const channel = interaction.channel;
    const member = interaction.member;
    const args = interaction.options || null;

    //Dependencies
    const main = require("../main.js");
    const logs = require("../util/logFunctions.js");
    const { Op } = require("sequelize");
    const Discord = require("discord.js");

    //Database Retrieval
    const Configs = main.getConfigsTable();
    const Blacklists = main.getBlacklistsTable();

    if(args == null){
        return interaction.reply("Code 101 - No Arguments Supplied.");
    }else if(member.permissions.has("ADMINISTRATOR") == false){
        return interaction.reply("Code 103 - Invalid Permissions. You are missing permission ADMINISTRATOR.")
    }else{
        var subcommandGroup = interaction.options._group;
        var subcommand = interaction.options.getSubcommand();

        if(subcommandGroup == null && subcommand == "muterole"){
            const role = interaction.options.getRole("role");
            Configs.update({mutedRoleID: role.id},{where: {guildID: guild.id}}).then(() =>{
                return interaction.reply(`Updated \`${subcommand}\` to \`${role.name}\` successfully.`)
            }).catch(e => {
                interaction.reply("Code 110 - Unknown Error with Database.")
                return console.error(e);
            });
        }else if(subcommandGroup == null && subcommand == "logchannel"){
            const channel = interaction.options.getChannel("channel");
            Configs.update({logChannelID: channel.id},{where: {guildID: guild.id}}).then(() =>{
                return interaction.reply(`Updated \`${subcommand}\` to \`${channel.toString()}\` successfully.`)
            }).catch(e => {
                interaction.reply("Code 110 - Unknown Error with Database.")
                return console.error(e);
            });
        }else if(subcommandGroup == null && subcommand == "autorole"){
            const role = interaction.options.getRole("role");
            var roleid = null;
            if(role){
                roleid = role.id;
            }
            Configs.update({autoRoleID: roleid},{where: {guildID: guild.id}}).then(() =>{
                if(roleid == null){
                    return interaction.reply(`Unset \`${subcommand}\` successfully.`)
                }else{
                    return interaction.reply(`Updated \`${subcommand}\` to \`${role.name}\` successfully.`)
                }
            }).catch(e =>{
                interaction.reply("Code 110 - Unknown Error with Database.");
                return console.error(e);
            });
        }else if(subcommandGroup == null && subcommand == "welcomemsg"){
            var msg = interaction.options.getString("message");
            if(!msg){
                msg = null;
            }
            Configs.update({welcomeMessage: msg},{where: {guildID: guild.id}}).then(() =>{
                if(msg == null){
                    return interaction.reply(`Unset \`${subcommand}\` successfully.`)
                }else{
                    return interaction.reply(`Updated \`${subcommand}\` to \`${msg}\` successfully.`)
                }
            }).catch(e =>{
                interaction.reply("Code 110 - Unknown Error with Database.");
                return console.error(e);
            });
        }else if(subcommandGroup == "logs"){
            var logType = subcommand;
            var logEnabled = interaction.options.getBoolean("enable");

            Configs.findOne({where: {guildID: guild.id}}).then(config => {
                if(!config){
                    return;
                }else{
                    var logTypes = config.logTypes;
                    logTypes[logType] = logEnabled

                    Configs.update({logTypes: logTypes}, {where: {guildID: guild.id}}).then(() => {
                        return interaction.reply(`Updated log type \`${logType}\` to \`${logEnabled}\` successfully.`);
                    }).catch(e => {
                        interaction.reply("Code 110 - Unknown Error with Database.");
                        return console.error(e);
                    })
                }
            })
        }else if(subcommandGroup == null && subcommand == "list"){
            Configs.findOne({where: {guildID: guild.id}}).then(async row => {
                var enabledLogs = [];
                for(var log in row.logTypes){
                    if(row.logTypes[log] == true){
                        enabledLogs.push(log)
                    }
                }
                if(enabledLogs.length == 0){
                    enabledLogs = "None enabled"
                }else{
                    enabledLogs = enabledLogs.join(", ");
                }
                const logChannel = row.logChannelID? await guild.channels.resolve(row.logChannelID): "None set";
                const autoRole = row.autoRoleID? await guild.roles.resolve(row.autoRoleID): "None set";
                const muteRole = row.mutedRoleID? await guild.roles.resolve(row.mutedRoleID): "None set";
                const welcomeMessage = row.welcomeMessage? row.welcomeMessage: "None set";

                const embed = new Discord.MessageEmbed()
                    .setAuthor(`Config for ${guild.name}`)
                    .setColor("AQUA")
                    .addField("Mute Role", muteRole.toString(), true)
                    .addField("Log Channel", logChannel.toString(), true)
                    .addField("Auto-assigned Role", autoRole.toString(), true)
                    .addField("Enabled Log Types", enabledLogs, false)
                    .addField("Welcome Message", welcomeMessage, false)
                    .setTimestamp(new Date())
                    .setFooter("list.config.valkyrie");
                
                return interaction.reply({embeds: [embed]});
            })
        }
    }
}