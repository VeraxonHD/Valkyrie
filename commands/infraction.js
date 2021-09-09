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

    const subcommand = interaction.options.getSubcommand();
    const subcommandGroup = interaction.options._group;

    if(subcommandGroup == "list"){
        var targetMember;
        if(subcommand == "user"){
            targetMember = await guild.members.resolve(interaction.options.getString("userid"));
        }else if(subcommand == "mention"){
            targetMember = interaction.options.getMember("member");
        }

        Infractions.findAll({where: {[Op.and]: [{guildID: guild.id}, {userID: targetMember.id}]}}).then(async infractions => {
            if(infractions.length > 0){
                var infWarns = [];
                var infMutes = [];
                var infKicks = [];
                var infBans = [];

                infractions.forEach(infraction => {
                    var moderator = guild.members.resolve(infraction.moderatorID);
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
                interaction.reply("This user does not have any infractions.");
            }
        });
    }else if(subcommandGroup == "revoke"){
        var targetMember;
        if(subcommand == "user"){
            targetMember = await guild.members.resolve(interaction.options.getString("userid"));
        }else if(subcommand == "mention"){
            targetMember = interaction.options.getMember("member");
        }
        const argInfractionID = interaction.options.getString("infractionid");

        Infractions.findOne({where: {[Op.and]: [{guildID: guild.id}, {userID: targetMember.id}, {infractionID: argInfractionID}]}}).then(row => {
            if(!row){
                return interaction.reply(`That user does not have an infraction with ID ${argInfractionID}. Try \`/infraction list\`.`);
            }else{
                row.destroy().then(() =>{
                    var guildUserCompositeKey = guild.id + targetMember.id;
                    switch(row.type){
                        case 0:
                            GuildUsers.decrement("guildWarnCount", {where: {guildUserID: guildUserCompositeKey}});
                            Users.decrement("globalWarnCount", {where: {userID: targetMember.id}});
                            break;
                        case 1:
                            GuildUsers.decrement("guildMuteCount", {where: {guildUserID: guildUserCompositeKey}});
                            Users.decrement("globalMuteCount", {where: {userID: targetMember.id}});
                            break;
                        case 2:
                            GuildUsers.decrement("guildKickCount", {where: {guildUserID: guildUserCompositeKey}});
                            Users.decrement("globalKickCount", {where: {userID: targetMember.id}});
                            break;
                        case 3:
                            GuildUsers.decrement("guildBanCount", {where: {guildUserID: guildUserCompositeKey}});
                            Users.decrement("globalBanCount", {where: {userID: targetMember.id}});
                            break;
                        default:
                            break;
                    }
                    return interaction.reply("Successfully deleted the specified infraction.");
                })
            }
        })
    }
}