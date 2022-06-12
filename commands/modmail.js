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
    const pb = require("pastebin-api")

    var PasteClient = pb.PasteClient
    var Publicity = pb.Publicity
    var ExpireDate = pb.ExpireDate

    //Database Retrieval
    const Configs = main.getConfigsTable();
    const ModmailTickets = main.getModmailTicketsTable();
    
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
                tickets.forEach(ticket => {
                    ticketList.push(`**Created**: ${ticket.createdAt} - **Closed**: ${ticket.open?"No":"Yes"} - **Archive link**: ${ticket.open?"Ticket Open - No Archive":ticket.archive}`)
                })
                return interaction.reply(ticketList.join("\n"))
            }
        })
    }

    function closeTicket(){
        ModmailTickets.findOne({where: {channelID: channel.id}}).then(ticket => {
            if(!ticket){
                return interaction.reply({content: "This is not a valid ticket channel. This command can only be used in modmail ticket channels.", ephemeral: true})
            }else{
                guild.members.fetch(ticket.userID).then(replyMember => {
                    var embed = new Discord.MessageEmbed()
                            .setColor("RED")
                            .setDescription(`The ticket was closed by the Staff team of **${guild.name}**. If you require further assistance, please open a new Ticket.`)
                    if(replyMember){
                        replyMember.send({embeds: [embed]})
                    }
                    channel.send({embeds: [embed]})
                    ticket.update({open: false})

                    //Archival/Transaction Generation
                    
                    var allMessages = []
                    channel.messages.fetch().then(msgs => {
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
                            messagesFormatted.push(`[${msg.timestamp}] - ${msg.content} [Attachments: ${msg.attachments.toString()}]`)
                        })
                        messagesFormatted.reverse()
                        pbClient = new PasteClient(config.pastebinToken)
                        pbClient.createPaste({
                            code: messagesFormatted.join("\n"),
                            expireDate: ExpireDate.Never,
                            name: channel.name,
                            publicity: Publicity.Unlisted
                        }).then(url => {
                            Configs.findOne({where: {guildID: guild.id}}).then(config => {
                                if(config){
                                    const logchannel = guild.channels.resolve(config.logChannelID)
                                    const embed = new Discord.MessageEmbed()
                                        .setTitle(`Modmail Ticket ${channel.name} closed`)
                                        .setURL(url)
                                        .setColor("BLUE")
                                        .setTimestamp(new Date())
                                    logchannel.send({embeds: [embed]})

                                    ticket.update({archive: url})

                                    channel.delete()

                                    return interaction.reply({content: `The ticket was closed by ${member.toString()}.`, ephemeral: false});
                                }
                            })
                            
                        })
                    })
                })
            }
        })
    }
}