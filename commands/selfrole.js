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
    const { Op } = require("sequelize")

    //Database Retrieval
    const SelfRoles = main.getSelfRolesTable();
    const SelfRoleOptions = main.getSelfRoleOptionsTable();
    const client = main.getClient();

    if(member.permissions.has("ADMINISTRATOR") == false){
        return interaction.reply("Code 102 - Invalid Permissions. You are missing permission ADMINISTRATOR");
    }

    const subcommandGroup = args._group;
    const subcommand = args.getSubcommand();

    if(subcommand == "init"){
        const srChannel = args.getChannel("channel");
        var srMessage = args.getString("message")? args.getString("message"): "Select one or more options below to get the assigned roles.";
        var srColour = args.getString("colour")? args.getString("colour"): srColour = "ORANGE";

        const embed = new Discord.MessageEmbed()
            .setColor(srColour)
            .setDescription(srMessage);
        
        channel.send({embeds: [embed]}).then(srMessage => {
            SelfRoles.create({
                guildID: guild.id,
                channelID: channel.id,
                messageID: srMessage.id
            }).then(() =>{
                return interaction.reply({content: `A new Self Role Base Message has been created. Its ID is ${srMessage.id}. You will need this ID to add or delete Self Roles as well as edit the Message Text. You can get this value at any time by enabling developer settings and using Right Click -> Copy ID.`, ephemeral: true});
            }).catch(err => {
                console.error(err);
                return interaction.reply({content: "There was an error writing to the database. Please wait and retry.", ephemeral: true});
            })
        })
    }else if(subcommand == "add"){
        const srMessageID = args.getString("messageid")
        const srDisplayText = args.getString("displaytext")
        const srRole = args.getRole("role")

        SelfRoles.findOne({where: {messageID: srMessageID}}).then(row => {
            if(row){
                const srChannel = guild.channels.resolve(row.channelID)
                if(srChannel){
                    srChannel.messages.fetch(row.messageID).then(srMessage => {
                        SelfRoleOptions.findOne({where: {[Op.and]: [{baseMessageID: srMessage.id},{roleID: srRole.id}]}}).then(optionRow => {
                            if(optionRow){
                                return interaction.reply({content: "That role already has an option in this list, and was therefore not added.", ephemeral: true});
                            }else{
                                var menu;
                                if(srMessage.components.length > 0){
                                    menu = srMessage.components[0]
                                    menu.components[0].addOptions({
                                        label: srDisplayText,
                                        description: `Click to add role ${srRole.name}`,
                                        value: `selfrole-${srMessage.id}-${srRole.id}`
                                    }).setMaxValues(menu.components[0].options.length).setMinValues(0)
                                }else{
                                    menu = new Discord.MessageActionRow()
                                        .addComponents(
                                            new Discord.MessageSelectMenu()
                                                .setCustomId(`selfrole-${srMessage.id}`)
                                                .setPlaceholder(`Click to Select Role(s)`)
                                                .addOptions(
                                                    {
                                                        label: srDisplayText,
                                                        description: `Click to add role ${srRole.name}`,
                                                        value: `selfrole-${srMessage.id}-${srRole.id}`
                                                    }
                                                )
                                                .setMaxValues(1)
                                                .setMinValues(0)
                                        )
                                }
                                srMessage.edit({embeds: [srMessage.embeds[0]], components: [menu]}).then(() => {
                                    SelfRoleOptions.create({
                                        baseMessageID: srMessage.id,
                                        optionID: `selfrole-${srMessage.id}-${srRole.id}`,
                                        roleID: srRole.id
                                    }).then(() => {
                                        return interaction.reply({content: `Added role ${srRole.name} to the list of options successfully.`, ephemeral: true});
                                    }).catch(err => {
                                        console.error(err);
                                        return interaction.reply({content: "An unknown error occurred while writing to the Database. Please wait and retry.", ephemeral: true});
                                    })
                                }).catch(err => {
                                    return interaction.reply({content: "An unknown error occurred while adding a new option. Please wait and retry.", ephemeral: true});
                                })
                            }
                        })
                    })
                }else{
                    row.destroy();
                    return interaction.reply({content: "This Self Role Base Message could not be found.", ephemeral: true});
                }
            }
        })

        
    }else if(subcommand == "delete"){
        const srMessageID = args.getString("messageid")
        const srRole = args.getRole("role")

        SelfRoles.findOne({where: {messageID: srMessageID}}).then(row => {
            if(row){
                const srChannel = guild.channels.resolve(row.channelID)
                srChannel.messages.fetch(row.messageID).then(srMessage => {
                    var actionRow = srMessage.components[0]
                    var menu = actionRow.components[0]
                    var srOptions = menu.options
                    var newOptions = []
                    srOptions.forEach(srOption => {
                        if(srOption.value.indexOf(srRole.id) == -1){
                            newOptions.push(srOption)
                        }
                    })
                    var newComponents;
                    if(newOptions.length == 0){
                        actionRow = []
                    }else{
                        menu.setMaxValues(newOptions.length)
                        menu.setOptions(newOptions)
                        actionRow.setComponents(menu)
                        actionRow = [actionRow]
                    }
                    
                    srMessage.edit({components: actionRow}).then(() => {
                        SelfRoleOptions.findOne({where: {roleID: srRole.id}}).then(row => {
                            if(row){
                                row.destroy();
                            }else{
                                return interaction.reply({content: "That role is not set as an option for this Self Role List.", ephemeral: true});
                            }
                        })
                    })
                    return interaction.reply({content: `Deleted the option for Role ${srRole.name} successfully.`, ephemeral: true});                 
                })
            }else{
                return interaction.reply({content: "That is not a valid Self Role Base Message.", ephemeral: true});
            }
        })
    }else if(subcommand == "delete-all"){
        const srMessageID = args.getString("messageid")
        SelfRoles.findOne({where: {messageID: srMessageID}}).then(row => {
            if(row){
                const srChannel = guild.channels.resolve(row.channelID)
                srChannel.messages.fetch(srMessageID).then(srMessage => {
                    srMessage.delete();
                })
                row.destroy()
            }else{
                return interaction.reply({content: "That is not a valid SelfRole Message ID.", ephemeral: true});
            }
        })
        SelfRoleOptions.destroy({where: {baseMessageID: srMessageID}})
        return interaction.reply({content: "Deleted Self Role menu successfully.", ephemeral: true});
        
    }else if(subcommand == "edit"){
        const srMessageID = args.getString("messageid");
        const srNewText = args.getString("newtext");

        SelfRoles.findOne({where: {messageID: srMessageID}}).then(srRecord => {
            if(srRecord){
                const srChannel = guild.channels.resolve(srRecord.channelID);
                if(!srChannel){
                    return interaction.reply({content: `Could not find the channel that that SelfRole base message ID links to, does it still exist?`, ephemeral: true});
                }else{
                    srChannel.messages.fetch(srRecord.messageID).then(async srMessage => {
                        srEmbed = srMessage.embeds[0]
                        srEmbed.setDescription(srNewText)
                        srMessage.edit({embeds: [srEmbed]})
                        return interaction.reply({content: "Edited the SelfRole message text successfully.", ephemeral: true})
                    }).catch(err => {
                        console.error(err);
                        return interaction.reply({content: `Could not find that SelfRole base message, does it still exist?`, ephemeral: true});
                    })
                }
            }else{
                return interaction.reply({content: `Could not find that SelfRole base message, did you ever initialise it? Try \`/selfrole init\``, ephemeral: true});
            }
        })
    }
}