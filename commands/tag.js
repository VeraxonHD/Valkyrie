class longFieldHandler{
    constructor(fieldArray) {
        //console.log("CONSTRUCTOR CALLED")
        if(!fieldArray){
            fieldArray = [];
        }
        this.content = fieldArray;
    }
    getContent(){
        return this.content;
    }
}

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

    if(args[0].name == "modify"){
        if(!member.permissions.has("MANAGE_MESSAGES")){
            return interaction.reply("Code 103 - Invalid permissions. You are missing permission MANAGE_MESSAGES");
        }
        var subArgs = args[0].options[0].options;
        var subCommand = args[0].options[0]
        if(subCommand.name == "name"){
            var tagOldName = subArgs[0].value;
            var tagNewName = subArgs[1].value;

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
    }else if(args[0].name == "list"){
        Tags.findAll({where: {guildID: guild.id}}).then(tags => {
            var tagLength = 0;
            var thisFieldTagContent = [];
            var tagFields = [];
            var tagFieldCounter = 0;
            while(tags.length != 0){
                //console.log(`Current Length of Tags Array: ${tags.length}`)
                var thisTag = tags.pop();
                tagString = `**${thisTag.name}** - ${thisTag.response}`;
                //console.log(`tagString: ${tagString}`)
                tagLength += tagString.length;
                //console.log(`Field String Length (tagLength): ${tagLength}`)
                if(tagLength >= 1023){
                    tagFields.push(new longFieldHandler(thisFieldTagContent))
                    //console.log(`EXCEEDED 1023 CHARACTERS. Pusing the current fieldcontent: ${thisFieldTagContent}`)
                    //Re-push the tag onto the stack so it can be picked up next iteration
                    tags.push(thisTag);
                    //reset variables
                    tagLength = 0;
                    tagFieldCounter++;
                    thisFieldTagContent = [];
                }else{
                    thisFieldTagContent.push(tagString)
                    //console.log(`Pushing string to current field content: ${thisFieldTagContent}`)
                    if(tags.length == 0){
                        //console.log(`Tags Length hit 0. Pushing final content: ${thisFieldTagContent}`)
                        tagFields.push(new longFieldHandler(thisFieldTagContent))
                    }
                }
            }

            const embed = new Discord.MessageEmbed()
                .setAuthor(`List of Tags in ${guild.name}`)
                .setFooter(`list.tags.valkyrie`)
                .setColor("#00C597")
                .setTimestamp(new Date());
            //console.log(`\n Tag Fields Length: ${tagFields.length}`)
            var number = 1;
            tagFields.forEach(field =>{
                embed.addField(`Tags - Page ${number}`, field.getContent())
                number++;
            })
            interaction.reply({embeds: [embed]});
        })
    }else{
        var subArgs = args[0].options;
        if(args[0].name == "create"){
            if(!member.permissions.has("MANAGE_MESSAGES")){
                return interaction.reply("Code 103 - Invalid permissions. Missing permission MANAGE_MESSAGES");
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
                return interaction.reply("Code 103 - Invalid permissions. You are missing permission MANAGE_MESSAGES");
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
            Tags.findOne({where: {[Op.and]: [{guildID: guild.id}, {name: tagName}]}}).then(async tag =>{
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
                            tagAccessMembers[i] = await guild.members.resolve(tagAccessMembersRaw[i]).toString();
                        }
                    }
                    

                    var tagAccessRoles = "All Roles";
                    if(tagAccessRolesRaw.length > 0){
                        tagAccessRoles = [];
                        for(var i = 0; i < tagAccessRolesRaw.length; i++){
                            tagAccessRoles[i] = await guild.roles.resolve(tagAccessRolesRaw[i]).toString();
                        }
                    }

                    var tagAccessChannels = "All Channels";
                    if(tagAccessChannelsRaw.length > 0){
                        tagAccessChannels = [];
                        for(var i = 0; i < tagAccessChannelsRaw.length; i++){
                            tagAccessChannels[i] = await guild.channels.resolve(tagAccessChannelsRaw[i]).toString();
                        }
                    }

                    var embed = new Discord.MessageEmbed()
                        .setAuthor(`Information for tag ${tagName}`)
                        .addField("Guild", client.guilds.cache.get(tagGuild).name)
                        .addField("Creator", await guild.members.resolve(tagCreator).toString())
                        .addField("Response Text", tagResponse)
                        .addField("Whitelisted Members", tagAccessMembers, true)
                        .addField("Whitelisted Roles", tagAccessRoles, true)
                        .addField("Whitelisted Channels", tagAccessChannels, true)
                        .addField("Usage Count", tagUses)
                        .addField("Created At", df(tagCreatedAt, "dd/mm/yyyy HH:MM:ss Z"))
                        .setFooter(`${tagName}.info.tags.valkyrie`)
                        .setColor("#00C597")
                        .setTimestamp(new Date());
                    
                    return interaction.reply({embeds: [embed]});
                }
            }).catch(e =>{
                interaction.reply("Error 110 - An Error with the Database occured.");
                return console.error(e);
            })
        }
    }
}