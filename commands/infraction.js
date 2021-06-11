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

    //Database Retrieval
    const Users = main.getUsersTable();
    const GuildUsers = main.getGuildUsersTable();
    const Configs = main.getConfigsTable();
    const Infractions = main.getInfractionsTable();

    if(args[0].name == "list"){
        const subCommandArgs = args[0].options[0].options[0];
        const targetID = subCommandArgs.value;
        const targetMember = await guild.members.resolve(targetID);

        Infractions.findAll({where: {[Op.and]: [{guildID: guild.id}, {userID: targetID}]}}).then(async infractions => {
            if(infractions.length > 0){
                var infWarns = [];
                var infMutes = [];
                var infKicks = [];
                var infBans = [];

                infractions.forEach(infraction => {
                    switch(infraction.type){
                        case 0: 
                            infWarns.push(`**ID**: ${infraction.infractionID} | **Reason**: ${infraction.reason} | **Moderator** ${guild.members.resolve(infraction.moderatorID)}`);
                            console.log(`Pushing warn ${infraction} to array`)
                            break;
                        case 1: 
                            infMutes.push(`**ID**: ${infraction.infractionID} | **Reason**: ${infraction.reason} | **Moderator** ${guild.members.resolve(infraction.moderatorID)}`);
                            break;
                        case 2: 
                            infKicks.push(`**ID**: ${infraction.infractionID} | **Reason**: ${infraction.reason} | **Moderator** ${guild.members.resolve(infraction.moderatorID)}`);
                            break;
                        case 3:
                            infBans.push(`**ID**: ${infraction.infractionID} | **Reason**: ${infraction.reason} | **Moderator** ${guild.members.resolve(infraction.moderatorID)}`);
                            break;
                        default:
                            break;
                    }
                });

                console.log(`After: ${infWarns}`)

                const embed = new Discord.MessageEmbed()
                    .setAuthor(`List of Infractions for ${targetMember.user.tag} in ${guild.name}`)
                    .setFooter(`list.tags.valkyrie`)
                    .setColor("#00C597")
                    .setTimestamp(new Date());
                
                if(infWarns.length > 0){
                    embed.addField("Warns", infWarns);
                }else{
                    embed.addField("Warns", "None");
                }
                if(infMutes.length > 0){
                    embed.addField("Mutes", infMutes);
                }else{
                    embed.addField("Mutes", "None");
                }
                if(infKicks.length > 0){
                    embed.addField("Kicks", infKicks);
                }else{
                    embed.addField("Kicks", "None");
                }
                if(infBans.length > 0){
                    embed.addField("Bans", infBans);
                }else{
                    embed.addField("Bans", "None");
                }
                    
                interaction.reply({embeds: [embed]});
            }else{
                interaction.reply("This user does not have any infractions.");
            }
        });
    }else if(args[0].name == "revoke"){

    }
}