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

    const { Op } = require("sequelize");

    //Database Retrieval
    const Configs = main.getConfigsTable();
    const Polls = main.getPollsTable();
    const PollOptions = main.getPollOptionsTable();
    const PollResponses = main.getPollResponses();
    
    const subcommandGroup = args._group;
    const subcommand = args.getSubcommand();

    if(subcommand == "create"){
        const subject = args.getString("subject")
        const embed = new Discord.MessageEmbed()
            .setAuthor(subject)
            .setColor("GREEN")
            .setTimestamp(new Date())

        channel.send({embeds: [embed]}).then(emsg => {
            if(emsg){
                Polls.create({
                    pollID: emsg.id,
                    channelID: channel.id,
                    creatorID: member.id,
                    subject: subject
                }).then(() => {
                    newEmbed = emsg.embeds[0]
                    newEmbed.footer = {text: `poll.valkyrie | ${emsg.id}`}
                    
                    emsg.edit({embeds: [newEmbed]}).then(emsg => {
                        return interaction.reply({content: `Created poll with ID ${emsg.id} successfully. To add options, use \`/poll add-option\``, ephemeral: true});
                    })
                }).catch(err => {
                    emsg.delete().then(() => {
                        console.error(err)
                        return interaction.reply({content: "Failed to write to the database, please try again in a moment. Cleaning up...", ephemeral: true});
                    })
                })
            }else{
                return interaction.reply({content: "Failed to send embed message. Please try again later.", ephemeral: true});
            }
        })
    }else if(subcommand == "add-option"){
        const pollid = args.getString("pollid")
        const option = args.getString("option")

        //TODO: Add check for if option name already exists

        Polls.findOne({where: {pollID: pollid}}).then(poll => {
            if(!poll){
                return interaction.reply({content: `Poll \`${pollid}\` does not exist.`, ephemeral: true});
            }else{
                PollOptions.findOne({where: {[Op.and]: [{pollID: poll.pollID},{optionText: option}]}}).then(row => {
                    if(row){
                        return interaction.reply({content: `That option already exists on this poll. Please use a different option name.`, ephemeral: true});
                    }else{
                        channel.messages.fetch(poll.pollID).then(pollMessage => {
                            var components = []
                            if(pollMessage.components.length == 0){
                                components = new Discord.MessageActionRow()
                            }else{
                                components = pollMessage.components[0]
                            }
        
                            components.addComponents(
                                new Discord.MessageButton()
                                    .setCustomId(`poll-${poll.pollID}-${option}`)
                                    .setLabel(option)
                                    .setStyle("PRIMARY")
                            )
        
                            pollMessage.edit({embeds: [pollMessage.embeds[0]], components: [components]})
                            
                            PollOptions.create({
                                pollID: poll.pollID,
                                optionText: option
                            })
        
                            return interaction.reply({content: `Added option ${option} to ${poll.pollID}`, ephemeral: true});
                        })
                    }
                })
            }
        })
    }else if(subcommand == "close"){
        const pollid = args.getString("pollid")
        const anonymousResults = args.getBoolean("anonymous-results")
        const privateResults = args.getBoolean("private-results")

        var results = []

        await Polls.findOne({where: {pollID: pollid}}).then(async poll => {
            if(!poll){
                return interaction.reply({content: `Poll \`${pollid}\` does not exist.`, ephemeral: true});
            }else{
                await PollOptions.findAll({where: {pollid: poll.pollID}}).then(async options => {
                    for(var index in options){
                        await PollResponses.findAll({where: {[Op.and]: [{pollID: poll.pollID},{option: options[index].optionText}]}}).then(async responses =>{
                            var members = []
                            responses.forEach(response => {
                                members.push(response.memberID)
                            })
                            results[options[index].optionText] = {
                                "option": options[index].optionText,
                                "votes": responses.length,
                                "members": members
                            }
                        })
                    }
                })
                var embed = new Discord.MessageEmbed()
                    .setAuthor(`Results of poll "${poll.subject}"`)
                    .setColor("GREEN")
                    .setTimestamp(new Date())
                for(var index in results){
                    var result = results[index]
                    if(anonymousResults){
                        embed.addField(`Option "${result.option}": ${result.votes} votes`, `Votes are anonymized for this result call.`)
                    }else{
                        mentionables = result.members
                        for(var index in mentionables){
                            mentionables[index] = `<@${mentionables[index]}>`
                        }
                        embed.addField(`Option "${result.option}": ${result.votes} votes`, `Voted for by: ${mentionables.join(`, `)}`)
                    }
                    
                }
                if(privateResults){
                    Configs.findOne({where: {guildID: guild.id}}).then(config => {
                        var logChannel = guild.channels.resolve(config.logChannelID)
                        if(logChannel){
                            logChannel.send({embeds: [embed]})
                        }
                    })
                }else{
                    var pollChannel = guild.channels.resolve(poll.channelID)
                    if(pollChannel){
                        pollChannel.send({embeds: [embed]})
                    }
                }
                return interaction.reply({content: `Successfully closed poll \`${poll.pollID}\`.`, ephemeral: true});
                
            }
        })
    }
}