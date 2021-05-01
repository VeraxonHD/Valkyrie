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
    const LobbyHubs = main.getLobbyHubsTable();
    const client = main.getClient();

    if(!args[0].options[0].options){
        var subArgs = args[0].options;
        if(args[0].name == "create"){
            if(!member.permissions.has("MANAGE_MESSAGES")){
                return interaction.reply("Code 103 - Invalid permissions.");
            }
            var lobbyChannel = subArgs[0].value;
            var lobbyParent = subArgs[1].value;
            if(guild.channels.cache.get(lobbyChannel).type != "voice"){
                return interaction.reply("That is not a voice channel. Lobby Hub channels must be of type VOICE_CHANNEL");
            }
            LobbyHubs.findOne({where: {[Op.and]: [{guildID: guild.id},{lobbyID: lobbyChannel}]}}).then(lobby =>{
                if(!lobby){
                    LobbyHubs.create({
                        guildID: guild.id,
                        lobbyID: lobbyChannel,
                        lobbyHubParentID: lobbyParent,
                        creatorID: member.id
                    }).then(() =>{
                        return interaction.reply("New Lobby Hub Created");
                    }).catch(e => {
                        console.error(e);
                        return interaction.reply("Code 110 - Failed to create Lobby Hub in Databse");
                    })
                }else{
                    return interaction.reply("That lobby hub channel has already been created.");
                }
            });
        }else if(args[0].name == "delete"){
            if(!member.permissions.has("MANAGE_MESSAGES")){
                return interaction.reply("Code 103 - Invalid permissions.");
            }
            var lobbyChannel = subArgs[0].value;
            if(guild.channels.cache.get(lobbyChannel).type != "voice"){
                return interaction.reply("That is not a voice channel. Lobby Hub channels must be of type VOICE_CHANNEL");
            }
            LobbyHubs.findOne({where: {[Op.and]: [{guildID: guild.id},{lobbyID: lobbyChannel}]}}).then(lobby =>{
                if(lobby){
                    lobby.destroy();
                    return interaction.reply("Successfully removed lobby hub from channel.");
                }else{
                    return interaction.reply("That is not a lobby hub channel.");
                }
            });
        }
    }
}