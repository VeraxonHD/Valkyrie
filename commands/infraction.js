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

                infractions.forEach(infraction => {
                    var moderator = guild.members.resolve(infraction.moderatorID);
                    if(!moderator){
                        moderator = "Moderator no longer in server"
                    }else{
                        moderator = moderator.toString();
                    }
                    switch(infraction.type){
                        case 0: 
                            infWarns.push(`**ID**: ${infraction.infractionID} | **Reason**: ${infraction.reason} | **Moderator** ${moderator.toString()}`);
                            break;
                        case 1: 
                            infMutes.push(`**ID**: ${infraction.infractionID} | **Reason**: ${infraction.reason} | **Moderator** ${moderator.toString()}`);
                            break;
                        case 2: 
                            infKicks.push(`**ID**: ${infraction.infractionID} | **Reason**: ${infraction.reason} | **Moderator** ${moderator.toString()}`);
                            break;
                        case 3:
                            infBans.push(`**ID**: ${infraction.infractionID} | **Reason**: ${infraction.reason} | **Moderator** ${moderator.toString()}`);
                            break;
                        default:
                            break;
                    }
                });

                const embed = new Discord.MessageEmbed()
                    .setAuthor(`List of Infractions for ${targetMember.user.tag} in ${guild.name}`)
                    .setFooter(`list.tags.valkyrie`)
                    .setColor("#00C597")
                    .setTimestamp(new Date());
                
                if(infWarns.length > 0){
                    embed.addField("Warns", infWarns.join("\n"));
                }else{
                    embed.addField("Warns", "None");
                }
                if(infMutes.length > 0){
                    embed.addField("Mutes", infMutes.join("\n"));
                }else{
                    embed.addField("Mutes", "None");
                }
                if(infKicks.length > 0){
                    embed.addField("Kicks", infKicks.join("\n"));
                }else{
                    embed.addField("Kicks", "None");
                }
                if(infBans.length > 0){
                    embed.addField("Bans", infBans.join("\n"));
                }else{
                    embed.addField("Bans", "None");
                }
                    
                interaction.reply({embeds: [embed]});
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