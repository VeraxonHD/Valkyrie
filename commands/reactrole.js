exports.execute = (interaction) =>{
    //Interaction information
    const guild = interaction.guild;
    const channel = interaction.channel;
    const member = interaction.member;
    const args = interaction.options || null;
    const author = interaction.author;

    //Dependencies
    const main = require("../main.js");
    const logs = require("../util/logFunctions.js");
    const Discord = require("discord.js");

    //Database Retrieval
    const ReactionRoles = main.getReactionRolesTable();
    const client = main.getClient();

    if(member.permissions.has("ADMINISTRATOR") == false){
        return interaction.reply("Code 102 - Invalid Permissions. You are missing permission ADMINISTRATOR");
    }
    if(args[0].name == "init"){
        //Argument Handling
        var channelID;
        var messageText = "Select one of the Emoji below to recieve the corresponding role.";
        args[0].options.forEach(arg =>{
            if(arg.name == "channel"){
                channelID = arg.value;
            }else if(arg.name == "message"){
                messageText = arg.value;
            }
        });

        var rrChannel = guild.channels.cache.get(channelID);
        const embed = new Discord.MessageEmbed()
                .setAuthor(messageText)
                .setColor("ORANGE");
        rrChannel.send({embed}).then(rrMsg =>{
            ReactionRoles.create({
                guildID: guild.id,
                channelID: rrMsg.channel.id,
                messageID: rrMsg.id,
                creatorGUID: (guild.id + member.id),
                reactions: {}
            }).catch(e=>{
                console.log(e);
                return interaction.reply("Error 110 - Unknown Database Error")
            });
            interaction.reply("Initialized reaction role in channel successfully.");
        }).catch(e=>{
            console.log(e);
            return interaction.reply("Code 120 - Bot has insufficient Permissions to write to the targeted channel.")
        });
    }else if(args[0].name == "add"){
        var messageID;
        var reactionEmoji;
        var roleID;

        args[0].options.forEach(arg => {
            if(arg.name == "messageid"){
                messageID = arg.value;
            }else if(arg.name == "reactionemoji"){
                reactionEmoji = arg.value;
            }else if(arg.name == "role"){
                roleID = arg.value;
            }
        });

        ReactionRoles.findOne({where: {messageID: messageID}}).then(async row =>{
            var rrGuild = client.guilds.cache.get(row.guildID);
            var rrChannel = rrGuild.channels.cache.get(row.channelID);
            var rrData = row.reactions;

            rrChannel.messages.fetch(row.messageID).then(rrMessage =>{
                var rrEmoji = client.emojis.resolve(reactionEmoji.split(":")[2].split(">")[0]);
                var rrRole = rrGuild.roles.resolve(roleID);
                if(rrMessage){
                    if(rrEmoji){
                        if(rrRole){
                            rrMessage.react(rrEmoji).then(async m =>{
                                rrData[rrEmoji.id] = {
                                    "emojiID": rrEmoji.id,
                                    "roleID": rrRole.id,
                                    "messageID": rrMessage.id
                                }
                                ReactionRoles.update({reactions: rrData}, {where: {messageID: rrMessage.id}});
                                interaction.reply("Added a new reaction role to message successfully.");
                            }).catch(err => {
                                return interaction.reply("The supplied emoji is invalid. This may be caused either by the emoji being from a server of which I am not a member, or it's a default emoji.");
                            })
                        }else{
                            return interaction.reply("That role does not exist. Please try again later.");
                        }
                    }else{
                        return interaction.reply("The supplied emoji is invalid. This may be caused either by the emoji being from a server of which I am not a member, or it's a default emoji.");
                    }
                }else{
                    return interaction.reply("That message ID is not valid.");
                }
            })
        })
    }else if(args[0].name == "delete"){
        var messageID = args[0].options[0].value

        ReactionRoles.findOne({where: {messageID: messageID}}).then(async row =>{
            var rrGuild = client.guilds.cache.get(row.guildID);
            var rrChannel = rrGuild.channels.resolve(row.channelID);

            rrChannel.messages.fetch(row.messageID).then(rrMessage =>{
                if(rrMessage){
                    rrMessage.delete().then(async m =>{
                        await ReactionRoles.destroy({where: {messageID: rrMessage.id}});
                        interaction.reply("Reaction Role deleted successfully.");
                    })
                }
            })
        })
    }
}