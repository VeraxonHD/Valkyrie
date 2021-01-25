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

    if(member.hasPermission("ADMINISTRATOR") == false){
        return channel.send("Code 102 - Invalid Permissions.");
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

        var rrChannel = guild.channels.resolve(channelID);
        const embed = new Discord.MessageEmbed()
                .setAuthor(messageText)
                .setColor("ORANGE");
        rrChannel.send({embed}).then(message =>{
            ReactionRoles.create({
                guildID: guild.id,
                channelID: channel.id,
                messageID: message.id,
                creatorGUID: (guild.id + author.id),
                reactions: {}
            }).catch(e=>{
                console.log(e);
                return channel.send("Error 110 - Unknown Database Error")
            });
        }).catch(e=>{
            console.log(e);
            return channel.send("Code 120 - Bot has insufficient Permissions to write to the targeted channel.")
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
            var rrChannel = rrGuild.channels.resolve(row.channelID);
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
                            })
                        }
                    }
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
                    })
                }
            })
        })
    }
}