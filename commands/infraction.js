exports.execute = async (interaction) => {
    //Interaction information
    const guild = interaction.guild;
    const channel = interaction.channel;
    const member = interaction.member;
    const args = interaction.options || null;

    //Dependencies
    const main = require("../main.js");
    const Discord = require("discord.js");
    const { Op } = require("sequelize");
    const { MultiEmbed, MultiEmbedPage } = require("../util/classes");

    //Database Retrieval
    const Users = main.getUsersTable();
    const GuildUsers = main.getGuildUsersTable();
    const Infractions = main.getInfractionsTable();

    if(!member.permissions.has("MANAGE_MESSAGES")){ return interaction.reply("Code 103 - Invalid Permissions. You are missing permission MANAGE_MESSAGES") }

    const subcommand = args.getSubcommand();
    const subcommandGroup = args._group;

    if(subcommandGroup == "list"){
        var targetMember;
        if(subcommand == "user"){
            targetMember = await guild.members.resolve(args.getString("userid"));
        }else if(subcommand == "mention"){
            targetMember = args.getMember("member");
        }

        Infractions.findAll({where: {[Op.and]: [{guildID: guild.id}, {userID: targetMember.id}]}}).then(async infractions => {
            if(infractions.length > 0){
                var infWarns = [];
                var infMutes = [];
                var infKicks = [];
                var infBans = [];

                var multiEmbed = new MultiEmbed()
                    .setAuthor(`Multi-Page Embed for Infractions of ${targetMember.displayName}`)
                    .setFooter("list.infraction.valkyrie")
                    .setColor("00c597")
            
                infractions.forEach(infraction => {
                    var pageFields = []
                    var moderator = guild.members.resolve(infraction.moderatorID);
                    if(!moderator){
                        moderator = "Moderator no longer in server"
                    }else{
                        moderator = moderator.toString();
                    }

                    var type = ""
                    switch(infraction.type){
                        case 0: 
                            type = "Warn"
                            break;
                        case 1: 
                            type = "Mute"
                            break;
                        case 2: 
                            type = "Kick"
                            break;
                        case 3:
                            type = "Mute"
                            break;
                        default:
                            break;
                    }

                    const idField = {name: "Infraction ID", value: `${infraction.infractionID}`, inline: true}
                    const typeField = {name: "Infraction Type", value: type, inline: true}
                    const moderatorField = {name: "Moderator", value: moderator, inline: true}
                    const reasonField = {name: "Reason for Infraction", value: infraction.reason, inline: false}

                    pageFields.push(idField)
                    pageFields.push(typeField)
                    pageFields.push(moderatorField)
                    pageFields.push(reasonField)
                    
                    var page = new MultiEmbedPage(pageFields)

                    multiEmbed.addPage(page)                    
                });

                var embed = multiEmbed.render();

                interaction.reply({content: `Displaying infractions for ${targetMember.user.tag}`, ephemeral: true})

                channel.send(embed).then(async msg => {
                    const filter = f => f.user.id === member.id
                    const collector = msg.createMessageComponentCollector({ filter, time: 120000 });

                    collector.on("collect", async i => {
                        if(i.customId == "previous"){
                            await i.deferUpdate();
                            const previousPage = multiEmbed.previousPage();
                            i.editReply(previousPage);
                        }else if(i.customId == "next"){
                            await i.deferUpdate();
                            const nextPage = multiEmbed.nextPage();
                            i.editReply(nextPage);
                        }else if(i.customId == "end"){
                            collector.stop();
                        }
                    })

                    collector.on("end", collected => {
                        const finalPage = multiEmbed.finalRender(`${multiEmbed.pages.length} infractions were displayed.`);
                        msg.edit(finalPage)
                    })
                }).catch(console.error);
            }else{
                interaction.reply("This user does not have any infractions in this guild.");
            }
        });
    }else if(subcommandGroup == "revoke"){
        var targetMember;
        if(subcommand == "user"){
            targetMember = await guild.members.resolve(args.getString("userid"));
        }else if(subcommand == "mention"){
            targetMember = args.getMember("member");
        }
        const argInfractionID = args.getString("infractionid");

        Infractions.findOne({where: {[Op.and]: [{guildID: guild.id}, {userID: targetMember.id}, {infractionID: argInfractionID}]}}).then(row => {
            if(!row){
                return interaction.reply(`That user does not have an infraction with ID ${argInfractionID}. Try \`/infraction list\`.`);
            }else{
                row.destroy().then(() =>{
                    return interaction.reply("Successfully deleted the specified infraction.");
                })
            }
        })
    }
}