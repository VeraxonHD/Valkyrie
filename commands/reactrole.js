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
    const ReactionRolesOptions = main.getReactionRolesOptionsTable();
    const client = main.getClient();

    if(member.permissions.has("ADMINISTRATOR") == false){
        return interaction.reply("Code 102 - Invalid Permissions. You are missing permission ADMINISTRATOR");
    }

    const subcommandGroup = args._group;
    const subcommand = args.getSubcommand();

    if(subcommand == "init"){
        const rrChannel = args.getChannel("channel")
        const rrKey = args.getBoolean("key")
        var rrMessage = args.getString("message")
        var rrColour = args.getString("colour")

        if(!rrMessage){
            rrMessage = "Select a reaction below to obtain the relevant role"
        }

        var embed = new Discord.MessageEmbed()
            .setAuthor(rrMessage);
        if(rrColour){
            embed.setColor(rrColour);
        }else{
            embed.setColor("ORANGE");
        }
        if(rrKey){
            embed.addField("Key", "[The Key of each emote and its corresponding role]")
        }

        rrChannel.send({embeds: [embed]}).then(msg => {
            ReactionRoles.create({
                guildID: guild.id,
                channelID: rrChannel.id,
                messageID: msg.id,
                keyEnabled: rrKey
            }).then(() => {
                return interaction.reply({content: "Successfully created a new reactrole base message. To add react roles to it, use the \`/reactrole add\` command.", ephemeral: true});
            }).catch(err => {
                console.error(err);
                return interaction.reply({content: "There was an error writing the new react role to the database. Please try again later.", ephemeral: true});
            })
        })
    }else if(subcommand == "add"){
        const rrMessageID = args.getString("messageid");
        const rrReactionEmoji = args.getString("reactionemoji");
        const rrRole = args.getRole("role");

        var emoji = client.emojis.resolveId(rrReactionEmoji);

        ReactionRoles.findOne({where: {messageID: rrMessageID}}).then(rrRecord => {
            if(rrRecord){
                const rrChannel = guild.channels.resolve(rrRecord.channelID);
                if(!rrChannel){
                    return interaction.reply({content: `Could not find the channel that that ReactRole base message ID links to, does it still exist?`, ephemeral: true});
                }else{
                    rrChannel.messages.fetch(rrRecord.messageID).then(async rrMessage => {
                        rrMessage.react(rrReactionEmoji).then(rrReaction => {
                            var custom;
                            var emojiID;
                            if(rrReaction.emoji.id == null){
                                custom = false;
                                emojiID = rrReaction.emoji.name
                            }else{
                                custom = true;
                                emojiID = rrReaction.emoji.id;
                            }

                            ReactionRolesOptions.create({
                                baseMessageID: rrMessageID,
                                customEmoji: custom,
                                emoji: emojiID,
                                roleID: rrRole.id
                            }).then(() => {
                                const rrEmbed = rrMessage.embeds[0];
                                const rrEmbedKeyField = rrEmbed.fields.find(element => element.name.includes("Key"));

                                if(rrEmbedKeyField){
                                    var rrEmbedKeyField_Content = rrEmbedKeyField.value

                                    if(rrEmbedKeyField_Content == "[The Key of each emote and its corresponding role]"){
                                        rrEmbedKeyField_Content = ["[The Key of each emote and its corresponding role]"]
                                    }else{
                                        rrEmbedKeyField_Content = rrEmbedKeyField_Content.split("\n")
                                    }

                                    rrEmbedKeyField_Content.push(`${rrReaction.emoji} - ${rrRole.toString()}`)

                                    var newField = {name: "Key", value: rrEmbedKeyField_Content.join("\n"), inline: false}

                                    rrEmbed.fields[rrEmbed.fields.indexOf(rrEmbedKeyField)] = newField
                                    rrMessage.edit({embeds: [rrEmbed]})
                                }

                                return interaction.reply({content: `Emoji **${rrReaction.emoji.name}** linked to role **${rrRole.name}**`, ephemeral: true});
                            }).catch(err => {
                                console.error(err);
                                return interaction.reply({content: "Code 110 - Database Error - Could not write new Option to database. Try again later.", ephemeral: true});
                            })
                        }).catch(err => {
                            console.error(err);
                            return interaction.reply({content: `Failed to link an unknown emoji to role **${rrRole.name}**. Check it exists and that Valkyrie is in the server that the emoji is registered to.`, ephemeral: true});
                        });
                    }).catch(err => {
                        console.error(err);
                        return interaction.reply({content: `Could not find that ReactRole base message, does it still exist?`, ephemeral: true});
                    })
                }
            }else{
                return interaction.reply({content: `Could not find that ReactRole base message, did you ever initialise it? Try \`/reactrole init\``, ephemeral: true});
            }
        })
    }else if(subcommand == "delete"){
        const rrMessageID = args.getString("messageid")
        const rrRole = args.getRole("role")

        ReactionRoles.findOne({where: {messageID: rrMessageID}}).then(rrRecord => {
            if(!rrRecord){
                return interaction.reply({content: `Could not find that ReactRole base message, did you ever initialise it? Try \`/reactrole init\``, ephemeral: true});
            }else{
                var rrChannel = guild.channels.resolve(rrRecord.channelID)
                if(!rrChannel){
                    return interaction.reply({content: `Could not find the channel that that ReactRole base message ID links to, does it still exist?`, ephemeral: true});
                }else{

                    ReactionRolesOptions.findOne({where: {roleID: rrRole.id}}).then(rrOption => {
                        if(rrOption){
                            if(rrOption.customEmoji){
                                rrChannel.messages.fetch(rrMessageID).then(rrMessage => {
                                    var reactions = rrMessage.reactions.cache
                                    reactions.forEach(reaction => {
                                        if(reaction.emoji.id == rrOption.emoji){
                                            reaction.remove().then(() => {
                                                rrOption.destroy().then(() => {
                                                    const rrEmbed = rrMessage.embeds[0];
                                                    const rrEmbedKeyField = rrEmbed.fields.find(element => element.name.includes("Key"));

                                                    if(rrEmbedKeyField){
                                                        var currentContent = rrEmbedKeyField.value

                                                        if(currentContent == "[The Key of each emote and its corresponding role]"){
                                                            currentContent = ["[The Key of each emote and its corresponding role]"]
                                                        }else{
                                                            currentContent = currentContent.split("\n")
                                                        }

                                                        var newContent = []

                                                        currentContent.forEach(line => {
                                                            if(!line.includes(rrRole.toString())){
                                                                newContent.push(line)
                                                            }
                                                        })

                                                        if(newContent.length == 0){
                                                            newContent = "[The Key of each emote and its corresponding role]"
                                                        }else{
                                                            newContent = newContent.join("\n")
                                                        }

                                                        var newField = {name: "Key", value: newContent, inline: false}

                                                        rrEmbed.fields[rrEmbed.fields.indexOf(rrEmbedKeyField)] = newField
                                                        rrMessage.edit({embeds: [rrEmbed]})
                                                    }

                                                    return interaction.reply({content: `Successfully removed the Role **${rrRole.name}** from the Reaction Role options`, ephemeral: true})
                                                }).catch(err => {
                                                    console.error(err);
                                                    return interaction.reply({content: `Code 110 - Database Error - Could not remove the role option from the database. Please try again later.`, ephemeral: true})
                                                })
                                            }).catch(err => {
                                                console.error(err)
                                                return interaction.reply({content: `Code 100 - Unknown error occured when attempting to delete all reactions of that emoji. Try again later.`})
                                            })
                                        }
                                    })
                                }).catch(err => {
                                    console.error(err);
                                    return interaction.reply({content: `Could not find that ReactRole base message, does it still exist?`, ephemeral: true});
                                })
                            }else{
                                rrChannel.messages.fetch(rrMessageID).then(rrMessage => {
                                    var reactions = rrMessage.reactions.cache
                                    reactions.forEach(reaction => {
                                        if(reaction.emoji.name == rrOption.emoji){
                                            reaction.remove().then(() => {
                                                rrOption.destroy().then(() => {
                                                    const rrEmbed = rrMessage.embeds[0];
                                                    const rrEmbedKeyField = rrEmbed.fields.find(element => element.name.includes("Key"));
    
                                                    if(rrEmbedKeyField){
                                                        var currentContent = rrEmbedKeyField.value

                                                        if(currentContent == "[The Key of each emote and its corresponding role]"){
                                                            currentContent = ["[The Key of each emote and its corresponding role]"]
                                                        }else{
                                                            currentContent = currentContent.split("\n")
                                                        }

                                                        var newContent = []

                                                        currentContent.forEach(line => {
                                                            if(!line.includes(rrRole.toString())){
                                                                newContent.push(line)
                                                            }
                                                        })

                                                        if(newContent.length == 0){
                                                            newContent = "[The Key of each emote and its corresponding role]"
                                                        }else{
                                                            newContent = newContent.join("\n")
                                                        }

                                                        var newField = {name: "Key", value: newContent, inline: false}

                                                        rrEmbed.fields[rrEmbed.fields.indexOf(rrEmbedKeyField)] = newField
                                                        rrMessage.edit({embeds: [rrEmbed]})
                                                    }

                                                    return interaction.reply({content: `Successfully removed the Role **${rrRole.name}** from the Reaction Role options`, ephemeral: true})
                                                }).catch(err => {
                                                    console.error(err);
                                                    return interaction.reply({content: `Code 110 - Database Error - Could not remove the role option from the database. Please try again later.`, ephemeral: true})
                                                })
                                            }).catch(err => {
                                                console.error(err)
                                                return interaction.reply({content: `Code 100 - Unknown error occured when attempting to delete all reactions of that emoji. Try again later.`})
                                            })
                                        }
                                    })
                                }).catch(err => {
                                    console.error(err);
                                    return interaction.reply({content: `Could not find that ReactRole base message, does it still exist?`, ephemeral: true});
                                })
                            }
                        }else{
                            return interaction.reply({content: `Could not find the emoji that the supplied Role links to, have you set it up using \`/reactrole add\``, ephemeral: true});
                        }
                    })   
                }
            }
        })
    }else if(subcommand == "delete-all"){
        const rrMessageID = args.getString("messageid")

        ReactionRoles.findOne({where: {messageID: rrMessageID}}).then(rrRecord => {
            if(rrRecord){
                const rrChannel = guild.channels.resolve(rrRecord.channelID);
                if(!rrChannel){
                    return interaction.reply({content: `Could not find the channel that that ReactRole base message ID links to, does it still exist?`, ephemeral: true});
                }else{
                    rrChannel.messages.fetch(rrRecord.messageID).then(async rrMessage => {
                        rrMessage.delete()
                        rrRecord.destroy()
                        ReactionRolesOptions.destroy({where: {baseMessageID: rrMessageID}})

                        return interaction.reply({content: "Deleted the react role message and cleaned up all connected options.", ephemeral: true})
                    }).catch(err => {
                        console.error(err);
                        return interaction.reply({content: `Could not find that ReactRole base message, does it still exist?`, ephemeral: true});
                    })
                }
            }else{
                return interaction.reply({content: `Could not find that ReactRole base message, did you ever initialise it? Try \`/reactrole init\``, ephemeral: true});
            }
        })
    }else if(subcommand == "edit"){
        const rrMessageID = args.getString("messageid");
        const rrNewText = args.getString("newtext");

        ReactionRoles.findOne({where: {messageID: rrMessageID}}).then(rrRecord => {
            if(rrRecord){
                const rrChannel = guild.channels.resolve(rrRecord.channelID);
                if(!rrChannel){
                    return interaction.reply({content: `Could not find the channel that that ReactRole base message ID links to, does it still exist?`, ephemeral: true});
                }else{
                    rrChannel.messages.fetch(rrRecord.messageID).then(async rrMessage => {
                        rrEmbed = rrMessage.embeds[0]
                        console.log(rrEmbed.author)
                        newAuthor = {name: rrNewText, url: undefined, iconURL: undefined, proxyIconURL: undefined}

                        rrEmbed.author = newAuthor

                        rrMessage.edit({embeds: [rrEmbed]})
                        return interaction.reply({content: "Edited the Reaction Role message text successfully.", ephemeral: true})
                    }).catch(err => {
                        console.error(err);
                        return interaction.reply({content: `Could not find that ReactRole base message, does it still exist?`, ephemeral: true});
                    })
                }
            }else{
                return interaction.reply({content: `Could not find that ReactRole base message, did you ever initialise it? Try \`/reactrole init\``, ephemeral: true});
            }
        })
    }
}