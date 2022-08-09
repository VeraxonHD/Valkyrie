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
    const config = require("../store/config.json");
    const df = require("dateformat")

    var fs = require("fs")

    const { Op } = require("sequelize");

    //Database Retrieval
    const Configs = main.getConfigsTable();
    const ModmailTickets = main.getModmailTicketsTable();
    const ModmailBlocked = main.getModmailBlockedTable();
    
    const subcommandGroup = args._group;
    const subcommand = args.getSubcommand();

    if(subcommand == "reply"){
        ModmailTickets.findOne({where: {channelID: channel.id}}).then(ticket => {
            if(!ticket){
                return interaction.reply({content: "This is not a valid ticket channel. This command can only be used in modmail ticket channels.", ephemeral: true})
            }else{
                guild.members.fetch(ticket.userID).then(replyMember => {
                    if(!replyMember){
                        closeTicket()
                        return interaction.reply({content: "The author of this ticket is no longer a member of this server... Cleaning up.", ephemeral: true});
                        
                    }else{
                        const content = args.getString("message")
                        const anonymous = args.getBoolean("anonymous")
                        var sender;
                        if(anonymous){
                            sender = "Anonymous"
                        }else{
                            sender = member.displayName
                        }
                        var localEmbed = new Discord.MessageEmbed()
                            .setColor("GREEN")
                            .setDescription(`📤 ${member.toString()}: ${content}`)
                        channel.send({embeds: [localEmbed]})

                        var sentEmbed = new Discord.MessageEmbed()
                            .setColor("GREEN")
                            .setDescription(`📥 **${sender}**: ${content}`)
                        replyMember.send({embeds: [sentEmbed]})

                        return interaction.reply({content: "Replied to the Ticket Author successfully", ephemeral: true});
                    }
                })
            }
        })
    }else if(subcommand == "close"){
        if(!member.permissions.has("MANAGE_MESSAGES")){
            return interaction.reply({content: "Code 103 - You do not have the MANAGE_MESSAGES permission necessary to close this ticket.", ephemeral: true});
        }else{
            closeTicket()
        }
    }else if(subcommand == "rename"){
        if(!member.permissions.has("MANAGE_MESSAGES")){
            return interaction.reply({content: "Code 103 - You do not have the MANAGE_MESSAGES permission necessary to rename this ticket.", ephemeral: true});
        }else{
            var newName = args.getString("name")
            newName = newName.replace(" ", "-")
            ModmailTickets.findOne({where: {channelID: channel.id}}).then(ticket => {
                if(!ticket){
                    return interaction.reply({content: "This is not a valid ticket channel. This command can only be used in modmail ticket channels.", ephemeral: true})
                }else{
                    channel.edit({
                        name: newName
                    }).then(() => {
                        return interaction.reply({content: `Renamed ticket to **${newName}** successfully.`, ephemeral: true});
                    }).catch(err => {
                        console.error(err);
                        return interaction.reply({content: "Code 100 - Failed to rename the Channel", ephemeral: true});
                    })
                }
            })
        }
    }else if(subcommand == "history"){
        const targetMember = args.getUser("member")
        ModmailTickets.findAll({where: {userID: targetMember.id}}).then(tickets => {
            if(tickets.length == 0){
                return interaction.reply({content: "The member provided has no ticket history.", ephemeral: false});
            }else{
                var ticketList = []
                var files = []
                tickets.forEach(ticket => {
                    if(ticket.archive.indexOf("pastebin") == -1 && !ticket.open){
                        ticketList.push(`**Created**: ${df(ticket.createdAt, "dd/mm/yyyy HH:MM:ss Z")} - **Closed**: ${ticket.open?"No":"Yes"} - **File attached**`)
                        files.push({attachment: ticket.archive})
                    }else{
                        ticketList.push(`**Created**: ${df(ticket.createdAt, "dd/mm/yyyy HH:MM:ss Z")} - **Closed**: ${ticket.open?"No":"Yes"} - **Archive**: ${ticket.open?"Ticket Open - No Archive":ticket.archive}`)
                    }
                    
                })
                return interaction.reply({content: ticketList.join("\n"), files: files})
            }
        })
    }else if(subcommand == "block"){
        const targetMember = args.getUser("member")

        if(!targetMember){
            return interaction.reply({content: "Code 104 - That member does not exist.", ephemeral: true});
        }else{
            ModmailBlocked.findOne({where: {[Op.and]: [{guildID: guild.id},{userID: targetMember.id}]}}).then(blocked => {
                if(!blocked){
                    ModmailBlocked.create({
                        guildID: guild.id,
                        userID: targetMember.id
                    }).then(() => {
                        return interaction.reply({content: `${targetMember.toString()} was blocked from sending modmail tickets.`, ephemeral: true});
                    })
                }else{
                    return interaction.reply({content: "That member is already blocked from sending tickets.", ephemeral: true});
                    
                }
            })
            
        }
    }else if(subcommand == "unblock"){
        const targetMember = args.getUser("member")

        ModmailBlocked.findOne({where: {[Op.and]: [{guildID: guild.id},{userID: targetMember.id}]}}).then(blocked => {
            if(!blocked){
                return interaction.reply({content: "That member is not blocked.", ephemeral: true});
            }else{
                blocked.destroy().then(() => {
                    return interaction.reply({content: `${targetMember.toString()} was unblocked from sending modmail tickets.`, ephemeral: true});
                })
            }
        })
    }

    function closeTicket(){
        ModmailTickets.findOne({where: {channelID: channel.id}}).then(async ticket => {
            if(!ticket){
                return interaction.reply({content: "This is not a valid ticket channel. This command can only be used in modmail ticket channels.", ephemeral: true})
            }else{
                var embed = new Discord.MessageEmbed()
                    .setColor("RED")
                    .setDescription(`The ticket was closed by the Staff team of **${guild.name}**. If you require further assistance, please open a new Ticket.`)
                guild.members.fetch(ticket.userID).then(replyMember => {
                    if(replyMember){
                        replyMember.send({embeds: [embed]})
                    }
                });

                channel.send({embeds: [embed]})
                ticket.update({open: false})

                //Archival/Transaction Generation
                
                var allMessages = []
                channel.messages.fetch().then(async msgs => {
                    msgs.forEach(m => {
                        //console.log(m)
                        if(m.embeds.length > 0){
                            var attachments = []
                            if(m.attachments.size > 0){
                                m.attachments.forEach(attachment => {
                                    attachments.push(attachment.url)
                                })
                            }
                            allMessages.push({timestamp: m.createdAt, content: m.embeds[0].description, attachments: attachments})
                        }
                    })
                    var messagesFormatted = []
                    allMessages.forEach(msg => {
                        console.log(msg.attachments)
                        if(msg.attachments.length > 0){
                            messagesFormatted.push(`[${msg.timestamp}] - ${msg.content} [Attachments: ${msg.attachments.toString()}]`)
                        }else{
                            messagesFormatted.push(`[${msg.timestamp}] - ${msg.content}`)
                        }
                        
                    })
                    messagesFormatted.reverse()

                    var filename = `${new Date().getTime()} ${ticket.userID}.txt`
                    var path = `./store/modmail/${filename}`
                    fs.writeFile(path, `banana`, err =>{
                        if(err) console.error(err)
                    })
                    var file = fs.createWriteStream(path)
                    file.on("error", (err) => {
                        console.error(err)
                        return interaction.reply({content: "There was an error generating the ticket archive data. Apologies for the inconvenience", ephemeral: false});                            
                    })
                    messagesFormatted.forEach(msg =>{
                        file.write(msg + "\n")
                    })
                    file.end();
                    Configs.findOne({where: {guildID: guild.id}}).then(config => {
                        if(config){
                            const logchannel = guild.channels.resolve(config.logChannelID)
                            if(logchannel){
                                const embed = new Discord.MessageEmbed()
                                .setTitle(`Modmail Ticket ${channel.name} closed`)
                                .setColor("BLUE")
                                .setTimestamp(new Date())
                                logchannel.send({embeds: [embed],
                                    files: [{
                                        attachment: path,
                                        name: filename,
                                        description: "A modmail log file"
                                    }]
                                })

                                ticket.update({archive: path})

                                interaction.reply({content: `The ticket was closed by ${member.toString()}.`, ephemeral: false});

                                channel.delete()
                            }
                        }
                    })
                })
            }
        })
    }
}