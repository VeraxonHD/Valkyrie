exports.execute = async (interaction) => {
    //Interaction information
    const guild = interaction.guild;
    const channel = interaction.channel;
    const member = interaction.member;
    const args = interaction.options || null;

    //Dependencies
    const main = require("../main.js");
    const logs = require("../util/logFunctions.js");
    const Discord = require("discord.js");
    const { Op } = require("sequelize");
    const df = require("dateformat");

    //Database Retrieval
    const Lobbies = main.getLobbiesTable();
    const LobbyHubs = main.getLobbyHubsTable();
    const client = main.getClient();

    if(args[0].name == "modify"){
        var subArgs = args[0].options[0].options;
        var subCommand = args[0].options[0];
        if(subCommand.name == "size"){
            lobbyNewSize = subArgs[0].value;
            Lobbies.findOne({where: {[Op.and]: [{guildID: guild.id},{creatorID: member.id}]}}).then(lobby =>{
                if(lobby){
                    var lobbyChannel = guild.channels.cache.get(lobby.lobbyID);
                    if(lobbyNewSize == "-1"){
                        lobbyNewSize = null;
                    }
                    lobbyChannel.setUserLimit(lobbyNewSize);
                    Lobbies.update({lobbySize: lobbyNewSize}, {where: {[Op.and]: [{guildID: guild.id},{lobbyID: lobbyChannel}]}}).then(() =>{
                        return interaction.reply(`Successfully changed your Lobby Channel size to ${lobbyNewSize}.`);
                    }).catch(e =>{
                        console.error(e);
                        return interaction.reply("Code 110 - Error changing size of lobby");
                    })
                }else{
                    return interaction.reply("Error: You do not have a lobby channel created in this guild.");
                }
            });
        }else if(subCommand.name == "locked"){
            lobbyLockedState = subArgs[0].value;
            Lobbies.findOne({where: {[Op.and]: [{guildID: guild.id},{creatorID: member.id}]}}).then(lobby =>{
                if(lobby){
                    var lobbyChannel = guild.channels.cache.get(lobby.lobbyID);
                    if(lobbyLockedState == true){
                        lobbyChannel.overwritePermissions([
                            {
                                id: guild.id,
                                deny: ["CONNECT"]
                            },
                            {
                                id: member,
                                allow: ["CONNECT"]
                            }
                        ])
                        interaction.reply(`Successfully changed your Lobby locked state to true.`);
                    }else{
                        lobbyChannel.permissionOverwrites.each(perm =>{perm.delete()});
                        interaction.reply(`Successfully changed your Lobby locked state to false.`);
                    }
                    //set permissions
                    Lobbies.update({lobbyLocked: lobbyLockedState}, {where: {[Op.and]: [{guildID: guild.id},{lobbyID: lobbyChannel}]}}).catch(e =>{
                        console.error(e);
                        return interaction.reply("Code 110 - Error changing locked state of lobby");
                    })
                }else{
                    return interaction.reply("Error: You do not have a lobby channel created in this guild.");
                }
            });
        }
    }
}