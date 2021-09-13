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

    const subcommandGroup = args._group;
    const subcommand = args.getSubcommand();

    if(subcommand == "init"){
        //Argument Handling
        var rrChannel = args.getChannel("channel");
        var messageText = args.getString("message");
        if(!messageText){
            messageText = "Select one of the Emoji below to recieve the corresponding role.";
        }

        const embed = new Discord.MessageEmbed()
                .setAuthor(messageText)
                .setColor("ORANGE");
        rrChannel.send({embeds: [embed]}).then(rrMsg =>{
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
    }else if(subcommand == "add"){
        var messageID = args.getString("messageid");
        var reactionEmoji = args.getString("reactionemoji");
        var reactionRole = args.getRole("role");

        ReactionRoles.findOne({where: {messageID: messageID}}).then(async row =>{
            var rrGuild = client.guilds.cache.get(row.guildID);
            var rrChannel = rrGuild.channels.cache.get(row.channelID);
            var rrData = row.reactions;

            rrChannel.messages.fetch(row.messageID).then(rrMessage =>{
                var rrEmoji = client.emojis.resolve(reactionEmoji.split(":")[2].split(">")[0]);
                if(rrMessage){
                    if(rrEmoji){
                        if(reactionRole){
                            rrMessage.react(rrEmoji).then(async m =>{
                                rrData[rrEmoji.id] = {
                                    "emojiID": rrEmoji.id,
                                    "roleID": reactionRole.id,
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
    }else if(subcommand == "delete"){
        var messageID = args.getString("messageid")

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