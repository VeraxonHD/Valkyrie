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
    const Tags = main.getTagsTable();
    const client = main.getClient();

    if(!args[0].options[0].options){
        var subArgs = args[0].options;
        if(args[0].name == "create"){
            if(!member.permissions.has("MANAGE_MESSAGES")){
                return interaction.reply("Code 103 - Invalid permissions.");
            }

            var tagName = subArgs[0].value;
            var tagResponse = subArgs[1].value;

            Tags.findOne({where: {[Op.and]: [{guildID: guild.id}, {name: tagName}]}}).then(tag =>{
                if(!tag){
                    Tags.create({
                        guildID: guild.id,
                        creatorID: member.id,
                        name: tagName,
                        response: tagResponse,
                        access: {
                            "members": [],
                            "roles": [],
                            "channels": []
                        },
                        uses: 0
                    }).then(() => {
                        return interaction.reply(`Created a new tag.\nName: **${tagName}**\nResponse **${tagResponse}**`);
                    }).catch(e =>{
                        console.error(e);
                        return interaction.reply("Error 110 - An Error with the Database occured.");
                    })
                }else{
                    return interaction.reply(`Tag **${tagName}** already exists. If you want to modify this tag, try \`/tag modify name\` or \`/tag modify response\``);
                }
            }).catch(e =>{
                console.error(e);
                return interaction.reply("Error 110 - An Error with the Database occured.");
            })
        }else if(args[0].name == "delete"){
            if(!member.permissions.has("MANAGE_MESSAGES")){
                return interaction.reply("Code 103 - Invalid permissions.");
            }

            var tagName = subArgs[0].value;
            
            Tags.findOne({where: {[Op.and]: [{guildID: guild.id}, {name: tagName}]}}).then(tag =>{
                if(!tag){
                    interaction.reply(`Tag **${tagName}** does not exist.`);
                }else{
                    tag.destroy().then(() =>{
                        return interaction.reply(`Tag **${tagName}** was deleted successfully.`);
                    }).catch(e =>{
                        console.error(e);
                        return interaction.reply("Error 110 - An Error with the Database occured.");
                    })
                }
            }).catch(e =>{
                interaction.reply("Error 110 - An Error with the Database occured.");
                return console.error(e);
            })
        }else if(args[0].name == "info"){
            var tagName = subArgs[0].value;
            Tags.findOne({where: {[Op.and]: [{guildID: guild.id}, {name: tagName}]}}).then(tag =>{
                if(!tag){
                    interaction.reply(`Tag **${tagName}** does not exist.`);
                }else{
                    var tagGuild = tag.guildID;
                    var tagCreator = tag.creatorID;
                    var tagResponse = tag.response;
                    var tagUses = tag.uses;
                    var tagCreatedAt = tag.createdAt;

                    var tagAccessMembersRaw = tag.access["members"];
                    var tagAccessRolesRaw = tag.access["roles"];
                    var tagAccessChannelsRaw = tag.access["channels"];

                    var tagAccessMembers = "All Members";
                    if(tagAccessMembersRaw.length > 0){
                        tagAccessMembers = [];
                        for(var i = 0; i < tagAccessMembersRaw.length; i++){
                            tagAccessMembers[i] = `<@${tagAccessMembersRaw[i]}>`;
                        }
                    }
                    

                    var tagAccessRoles = "All Roles";
                    if(tagAccessRolesRaw.length > 0){
                        tagAccessRoles = [];
                        for(var i = 0; i < tagAccessRolesRaw.length; i++){
                            tagAccessRoles[i] = `<@${tagAccessRolesRaw[i]}>`;
                        }
                    }

                    var tagAccessChannels = "All Channels";
                    if(tagAccessChannelsRaw.length > 0){
                        tagAccessChannels = [];
                        for(var i = 0; i < tagAccessChannelsRaw.length; i++){
                            tagAccessChannels[i] = `<@${tagAccessChannelsRaw[i]}>`;
                        }
                    }

                    console.log(tagAccessMembers)
                    console.log(tagAccessRoles)
                    console.log(tagAccessChannels)

                    var embed = new Discord.MessageEmbed()
                        .setAuthor(`Information for tag ${tagName}`)
                        .addField("Guild", client.guilds.cache.get(tagGuild).name)
                        .addField("Creator", `<@${tagCreator}>`)
                        .addField("Response Text", tagResponse)
                        .addField("Whitelisted Members", tagAccessMembers, true)
                        .addField("Whitelisted Roles", tagAccessRoles, true)
                        .addField("Whitelisted Channels", tagAccessChannels, true)
                        .addField("Usage Count", tagUses)
                        .addField("Created At", df(tagCreatedAt, "dd/mm/yyyy HH:MM:ss Z"))
                        .setFooter(`${tagName}.info.tags.valkyrie`)
                        .setColor("#00C597")
                        .setTimestamp(new Date());
                    
                    return interaction.reply({embed});
                }
            }).catch(e =>{
                interaction.reply("Error 110 - An Error with the Database occured.");
                return console.error(e);
            })
        }
    }else if(args[0].name == "modify"){
        if(!member.permissions.has("MANAGE_MESSAGES")){
            return interaction.reply("Code 103 - Invalid permissions.");
        }
        var subArgs = args[0].options[0].options;
        var subCommand = args[0].options[0]
        if(subCommand.name == "name"){
            var tagOldName = subArgs[0].value;
            var tagNewName = subArgs[1].value;

            console.log(subArgs)

            Tags.findOne({where: {[Op.and]: [{guildID: guild.id}, {name: tagOldName}]}}).then(tag =>{
                if(!tag){
                    interaction.reply(`Tag **${tagOldName}** does not exist.`);
                }else{
                    Tags.update({name: tagNewName}, {where: {name: tagOldName}}).then(() =>{
                        return interaction.reply(`Tag **${tagOldName}** was renamed to **${tagNewName}** successfully.`);
                    }).catch(e =>{
                        console.error(e);
                        return interaction.reply("Error 110 - An Error with the Database occured.");
                    })
                }
            }).catch(e =>{
                interaction.reply("Error 110 - An Error with the Database occured.");
                return console.error(e);
            })
        }else if(subCommand.name == "response"){
            var tagName = subArgs[0].value;
            var tagNewResponse = subArgs[1].value;

            console.log(subArgs)

            Tags.findOne({where: {[Op.and]: [{guildID: guild.id}, {name: tagName}]}}).then(tag =>{
                if(!tag){
                    interaction.reply(`Tag **${tagName}** does not exist.`);
                }else{
                    Tags.update({response: tagNewResponse}, {where: {[Op.and]: [{guildID: guild.id}, {name: tagName}]}}).then(() =>{
                        return interaction.reply(`Tag **${tagName}**'s response was changed to **${tagNewResponse}** successfully.`);
                    }).catch(e =>{
                        console.error(e);
                        return interaction.reply("Error 110 - An Error with the Database occured.");
                    });
                }
            }).catch(e =>{
                interaction.reply("Error 110 - An Error with the Database occured.");
                return console.error(e);
            })
        }else if(subCommand.name == "access"){
            if(subArgs.length > 2){
                return interaction.reply("You should only include *either* a \`role\` or a \`user\`, but not both.");
            }
            var tagName = subArgs[0].value;
            var tagNewAccess = subArgs[1].value;
            var tagNewAccessType = subArgs[1].type;
            Tags.findOne({where: {[Op.and]: [{guildID: guild.id}, {name: tagName}]}}).then(tag =>{
                if(!tag){
                    interaction.reply(`Tag **${tagName}** does not exist.`);
                }else{
                    var tagAccess = tag.access;
                    if(tagNewAccessType == "ROLE"){
                        if(tagAccess.roles.includes(tagNewAccess)){
                            tagAccess.roles.splice(tagAccess.roles.indexOf(tagNewAccess), 1);
                        }else{
                            tagAccess.roles.push(tagNewAccess)
                        }
                    }else if(tagNewAccessType == "USER"){
                        if(tagAccess.members.includes(tagNewAccess)){
                            tagAccess.members.splice(tagAccess.members.indexOf(tagNewAccess), 1);
                        }else{
                            tagAccess.members.push(tagNewAccess)
                        }
                    }
                    Tags.update({access: tag.access}, {where: {[Op.and]: [{guildID: guild.id}, {name: tagName}]}}).then(() =>{
                        return interaction.reply(`Tag **${tagName}**'s access was changed to reflect new settings.`);
                    }).catch(e =>{
                        console.error(e);
                        return interaction.reply("Error 110 - An Error with the Database occured.");
                    });
                }
            }).catch(e =>{
                interaction.reply("Error 110 - An Error with the Database occured.");
                return console.error(e);
            });
        }else if(subCommand.name == "channels"){
            var tagName = subArgs[0].value;
            var tagChannel = subArgs[1].value;
            Tags.findOne({where: {[Op.and]: [{guildID: guild.id}, {name: tagName}]}}).then(tag =>{
                if(!tag){
                    interaction.reply(`Tag **${tagName}** does not exist.`);
                }else{
                    var tagAccess = tag.access;
                    if(tagAccess.channels.includes(tagChannel)){
                        tagAccess.channels.splice(tagAccess.channels.indexOf(tagChannel), 1);
                    }else{
                        tagAccess.channels.push(tagChannel)
                    }
                    Tags.update({access: tag.access}, {where: {[Op.and]: [{guildID: guild.id}, {name: tagName}]}}).then(() =>{
                        return interaction.reply(`Tag **${tagName}**'s access was changed to reflect new settings.`);
                    }).catch(e =>{
                        console.error(e);
                        return interaction.reply("Error 110 - An Error with the Database occured.");
                    });
                }
            }).catch(e =>{
                interaction.reply("Error 110 - An Error with the Database occured.");
                return console.error(e);
            });
        }
    }
}