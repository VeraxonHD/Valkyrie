exports.execute = async (interaction) => {
    //Interaction information
    const guild = interaction.guild;
    const channel = interaction.channel;
    const member = interaction.member;
    const args = interaction.options || null;

    //Dependencies
    const main = require("../main.js");
    const { Op } = require("sequelize");
    const df = require("dateformat");

    //Database Retrieval
    const Lobbies = main.getLobbiesTable();
    const LobbyHubs = main.getLobbyHubsTable();
    const client = main.getClient();

    const subcommandGroup = interaction.options._group;
    const subcommand = interaction.options.getSubcommand();

    if(subcommandGroup == "modify"){
        if(subcommand == "size"){
            var lobbyNewSize = interaction.options.getInteger("size");
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
        }else if(subcommand == "locked"){
            lobbyLockedState = interaction.options.getBoolean("toggle");
            Lobbies.findOne({where: {[Op.and]: [{guildID: guild.id},{creatorID: member.id}]}}).then(lobby =>{
                if(lobby){
                    var lobbyChannel = guild.channels.cache.get(lobby.lobbyID);
                    
                    if(lobbyLockedState == true){
                                                lobbyChannel.permissionOverwrites.create(guild.id, {
                            "CONNECT": false,
                        });
                        lobbyChannel.permissionOverwrites.create(member, {
                            "CONNECT": true,
                        });
                        interaction.reply(`Successfully changed your Lobby locked state to true.`);
                    }else{
                        lobbyChannel.permissionOverwrites.set([]);
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