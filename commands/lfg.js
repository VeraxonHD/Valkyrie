exports.execute = async (interaction) => {
    const guild = interaction.guild;
    const channel = interaction.channel;
    const member = interaction.member;
    const args = interaction.options || null;

    //Dependencies
    const main = require("../main.js");
    const Discord = require("discord.js");

    //Database Retrieval
    const LFGroups = main.getLFGroupsTable();
    const LFGParticipants = main.getLFGParticipantsTable();

    const subcommandGroup = args._group;
    const subcommand = args.getSubcommand();

    if(subcommandGroup == null && subcommand == "create"){
        const lfgName = args.getString("name");
        const lfgTime = args.getString("time");
        const lfgDesc = args.getString("description");
        const lfgSize = args.getInteger("group-size");
        const lfgPing = args.getRole("role")? args.getRole("role"): null;

        const date = new Date(lfgTime)
        const sinceEpoch = date.getTime() / 1000

        if(isNaN(sinceEpoch)){
            return interaction.reply({content: "That was an invalid date/time. Please follow the Format: yyyy/mm/dd hh:mm (will convert to local time by default, or add GMT±?)\nExamples:\n•`2021/01/12 12:00` - 12:00 PM on the 12th of January 2021\n•`2022/08/24 16:00 GMT+3` 16:00 in the GMT+3 Timezone on the 24th of August 2022", ephemeral: true});
        }

        var embed = new Discord.MessageEmbed()
            .addField("Activity:", lfgName, true)
            .addField("Start Date/Time:", `<t:${sinceEpoch}:F>`, true)
            .addField("Description:", lfgDesc)
            .addField("Group Size:", lfgSize.toString(), true)
            .addField(`Participants: 1/${lfgSize}`, `${member.user.tag}`, true)
            .setColor("WHITE")
            .setTimestamp(new Date())
            .setFooter("lfg.valkyrie")

        const buttonRow = new Discord.MessageActionRow()
            .addComponents(
                new Discord.MessageButton()
                    .setCustomId("lfgJoin")
                    .setLabel("Join")
                    .setStyle("SUCCESS"),
                new Discord.MessageButton()
                    .setCustomId("lfgLeave")
                    .setLabel("Leave")
                    .setStyle("DANGER"),
                new Discord.MessageButton()
                    .setCustomId("lfgSubstitute")
                    .setLabel("Substitute")
                    .setStyle("SECONDARY")                
            )

        channel.send({embeds: [embed], components: [buttonRow]}).then(async msg => {
            embed.setFooter(`lfg.valkyrie | Message ID: ${msg.id}`);
            await msg.edit({embeds: [embed]})
            LFGroups.create({
                guildID: guild.id,
                messageID: msg.id,
                channelID: channel.id,
                creatorID: member.id,
                name: lfgName,
                time: sinceEpoch,
                description: lfgDesc,
                groupSize: lfgSize,
                pingRole: lfgPing,
                notified: false
            }).then(() =>{
                LFGParticipants.create({
                    messageID: msg.id,
                    memberID: member.id,
                    commitmentType: 0
                })
                return interaction.reply({content: "Created LFG post successfully.", ephemeral: true});
            }).catch(err => {
                msg.delete();
                console.error(err);
                return interaction.reply({content: "Code 110 - Failed to create a Database entry for this LFG post.", ephemeral: true})
            });
        })

    }else if(subcommandGroup == "edit"){
        const lfgEmbedID = args.getString("messageid");
        if(subcommand == "name"){
            const newName = args.getString("new-name");
            LFGroups.findOne({where: {messageID: lfgEmbedID}}).then(async row =>{
                if(row){
                    if(member.id != row.creatorID){
                        return interaction.reply({content: "Error - you do not own this LFG Post, and therefore are unauthorized to edit it.", ephemeral: true});
                    }
                    const lfgEmbedChannel = await guild.channels.resolve(row.channelID);
                    if(!lfgEmbedChannel){ return interaction.reply({content: "Code 102 - The channel that the LFG embed message used to exist in no longer exists.", ephemeral: true})}
                    const lfgEmbedMessage = await lfgEmbedChannel.messages.fetch(lfgEmbedID);
                    if(!lfgEmbedMessage){ return interaction.reply({content: "Code 102 - That LFG embed message no longer exists.", ephemeral: true})}

                    const lfgEmbed = lfgEmbedMessage.embeds[0];

                    const lfgEmbedNameField = lfgEmbed.fields.find(element => element.name.includes("Activity"));
                    var newField;

                    newField = {name: "Activity:", value: newName, inline: true}
                    lfgEmbed.fields[lfgEmbed.fields.indexOf(lfgEmbedNameField)] = newField;

                    lfgEmbedMessage.edit({embeds: [lfgEmbed]});

                    LFGroups.update({name: newName}, {where: {messageID: lfgEmbedID}}).then(() =>{
                        return interaction.reply({content: `Updated name to **${newName}** successfully`, ephemeral: true});
                    })
                }else{
                    return interaction.reply({content: `Code 102 - An existing LFG embed with that message ID does not exist.`, ephemeral: true});
                }
            })
        }else if(subcommand == "time"){
            const newTime = args.getString("new-time");
            LFGroups.findOne({where: {messageID: lfgEmbedID}}).then(async row =>{
                if(row){
                    if(member.id != row.creatorID){
                        return interaction.reply({content: "Error - you do not own this LFG Post, and therefore are unauthorized to edit it.", ephemeral: true});
                    }
                    const lfgEmbedChannel = await guild.channels.resolve(row.channelID);
                    if(!lfgEmbedChannel){ return interaction.reply({content: "Code 102 - The channel that the LFG embed message used to exist in no longer exists.", ephemeral: true})}
                    const lfgEmbedMessage = await lfgEmbedChannel.messages.fetch(lfgEmbedID);
                    if(!lfgEmbedMessage){ return interaction.reply({content: "Code 102 - That LFG embed message no longer exists.", ephemeral: true})}

                    const lfgEmbed = lfgEmbedMessage.embeds[0];

                    const lfgEmbedTimeField = lfgEmbed.fields.find(element => element.name.includes("Start Date/Time"));

                    const date = new Date(newTime)
                    const sinceEpoch = date.getTime() / 1000

                    if(isNaN(sinceEpoch)){
                        return interaction.reply({content: "That was an invalid date/time. Please follow the Format: yyyy/mm/dd hh:mm (will convert to local time by default, or add GMT±?)\nExamples:\n•`2021/01/12 12:00` - 12:00 PM on the 12th of January 2021\n•`2022/08/24 16:00 GMT+3` 16:00 in the GMT+3 Timezone on the 24th of August 2022", ephemeral: true});
                    }

                    var newField = {name: "Start Date/Time:", value: `<t:${sinceEpoch}:F>`, inline: true};
                    lfgEmbed.fields[lfgEmbed.fields.indexOf(lfgEmbedTimeField)] = newField;

                    lfgEmbedMessage.edit({embeds: [lfgEmbed]});

                    LFGroups.update([{time: sinceEpoch}, {notified: false}], {where: {messageID: lfgEmbedID}}).then(() =>{
                        return interaction.reply({content: `Updated time to **${newTime}** successfully`, ephemeral: true});
                    })
                }else{
                    return interaction.reply({content: `Code 102 - An existing LFG embed with that message ID does not exist.`, ephemeral: true});
                }
            })
        }else if(subcommand == "description"){
            const newDesc = args.getString("new-desc");
            LFGroups.findOne({where: {messageID: lfgEmbedID}}).then(async row =>{
                if(row){
                    if(member.id != row.creatorID){
                        return interaction.reply({content: "Error - you do not own this LFG Post, and therefore are unauthorized to edit it.", ephemeral: true});
                    }
                    const lfgEmbedChannel = await guild.channels.resolve(row.channelID);
                    if(!lfgEmbedChannel){ return interaction.reply({content: "Code 102 - The channel that the LFG embed message used to exist in no longer exists.", ephemeral: true})}
                    const lfgEmbedMessage = await lfgEmbedChannel.messages.fetch(lfgEmbedID);
                    if(!lfgEmbedMessage){ return interaction.reply({content: "Code 102 - That LFG embed message no longer exists.", ephemeral: true})}

                    const lfgEmbed = lfgEmbedMessage.embeds[0];

                    const lfgEmbedDescField = lfgEmbed.fields.find(element => element.name.includes("Description"));
                    var newField;

                    newField = {name: "Description:", value: newDesc, inline: false}
                    lfgEmbed.fields[lfgEmbed.fields.indexOf(lfgEmbedDescField)] = newField;

                    lfgEmbedMessage.edit({embeds: [lfgEmbed]});

                    LFGroups.update({name: newDesc}, {where: {messageID: lfgEmbedID}}).then(() =>{
                        return interaction.reply({content: `Updated description to **${newDesc}** successfully`, ephemeral: true});
                    })
                }else{
                    return interaction.reply({content: `Code 102 - An existing LFG embed with that message ID does not exist.`, ephemeral: true});
                }
            })
        }else if(subcommand == "group-size"){
            const newSize = args.getInteger("new-size");
            LFGroups.findOne({where: {messageID: lfgEmbedID}}).then(async row =>{
                if(row){
                    if(member.id != row.creatorID){
                        return interaction.reply({content: "Error - you do not own this LFG Post, and therefore are unauthorized to edit it.", ephemeral: true});
                    }
                    const lfgEmbedChannel = await guild.channels.resolve(row.channelID);
                    if(!lfgEmbedChannel){ return interaction.reply({content: "Code 102 - The channel that the LFG embed message used to exist in no longer exists.", ephemeral: true})}
                    const lfgEmbedMessage = await lfgEmbedChannel.messages.fetch(lfgEmbedID);
                    if(!lfgEmbedMessage){ return interaction.reply({content: "Code 102 - That LFG embed message no longer exists.", ephemeral: true})}

                    const lfgEmbed = lfgEmbedMessage.embeds[0];

                    const lfgEmbedSizeField = lfgEmbed.fields.find(element => element.name.includes("Group Size"));
                    var newField = {name: "Group Size:", value: newSize.toString(), inline: true};
                    lfgEmbed.fields[lfgEmbed.fields.indexOf(lfgEmbedSizeField)] = newField;

                    const lfgEmbedParticipantsField = lfgEmbed.fields.find(element => element.name.includes("Participants"));
                    const currentParticipants = lfgEmbedParticipantsField.name.split(" ")[1].split("/")[0];
                    newField = {name: `Participants: ${currentParticipants}/${newSize}`, value: lfgEmbedParticipantsField.value, inline: true}
                    lfgEmbed.fields[lfgEmbed.fields.indexOf(lfgEmbedParticipantsField)] = newField;

                    lfgEmbedMessage.edit({embeds: [lfgEmbed]});

                    LFGroups.update({groupSize: newSize}, {where: {messageID: lfgEmbedID}}).then(() =>{
                        return interaction.reply({content: `Updated size to **${newSize}** successfully`, ephemeral: true});
                    })
                }else{
                    return interaction.reply({content: `Code 102 - An existing LFG embed with that message ID does not exist.`, ephemeral: true});
                }
            })
        }
    }else if(subcommandGroup == null && subcommand == "delete"){
        const lfgEmbedID = args.getString("messageid");
        LFGroups.findOne({where: {messageID: lfgEmbedID}}).then(async row =>{
            if(row){
                if(member.id != row.creatorID && !member.permissions.has("MANAGE_MESSAGES")){
                    return interaction.reply({content: "Error - you do not own this LFG Post, and therefore are unauthorized to edit it.", ephemeral: true});
                }
                const lfgEmbedChannel = await guild.channels.resolve(row.channelID);
                if(!lfgEmbedChannel){ return interaction.reply({content: "Code 102 - The channel that the LFG embed message used to exist in no longer exists.", ephemeral: true})}
                const lfgEmbedMessage = await lfgEmbedChannel.messages.fetch(lfgEmbedID);
                if(!lfgEmbedMessage){ return interaction.reply({content: "Code 102 - That LFG embed message no longer exists.", ephemeral: true})}

                lfgEmbedMessage.delete().then(() => {
                    row.destroy().then(() => {
                        LFGParticipants.findAll({where: {messageID: lfgEmbedID}}).then((participants) =>{
                            participants.forEach(participant =>{
                                participant.destroy();
                            })
                            return interaction.reply({content: "The LFG Post has been deleted successfully.", ephemeral: true});
                        })
                    })
                })
            }
        })
    }else if(subcommandGroup == null && subcommand == "reputation"){
        return interaction.reply({content: "LFG Reputation is not yet implemented.", ephemeral: true});
    }
}