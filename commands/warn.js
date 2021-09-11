exports.execute = async (interaction) => {
    //Interaction information
    const guild = interaction.guild;
    const channel = interaction.channel;
    const member = interaction.member;
    const args = interaction.options || null;

    //Dependencies
    const main = require("../main.js");
    const logs = require("../util/logFunctions.js");

    //Database Retrieval
    const Users = main.getUsersTable();
    const GuildUsers = main.getGuildUsersTable();
    const Configs = main.getConfigsTable();
    const Infractions = main.getInfractionsTable();

    if(member.permissions.has("MANAGE_MESSAGES") == false){
        return interaction.reply("Code 103 - Invalid Permissions.");
    }

    //Arguments
    var targetID = args.getMember("member")? args.getMember("member").id: args.getString("userid");
    var reason = args.getString("reason");
    if(!reason){
        reason = "No reason specified"
    }

    guild.members.fetch(targetID).then(async targetMember => {
        Infractions.create({
            guildID: guild.id,
            userID: targetID,
            type: 0,
            reason: reason,
            moderatorID: member.id
        }).then(async () => {
            const guildUserCompositeKey = guild.id + targetMember.id;
            interaction.reply(`**${targetMember.displayName}** has been warned. Reason: **${reason}**.`);
            targetMember.send(`You have been Warned in **${guild.name}**. Reason: **${reason}**.`);

            Users.increment("globalWarnCount",{where:{userID: targetID}});
            GuildUsers.increment("guildWarnCount",{where:{guildUserID: guildUserCompositeKey}});

            Configs.findOne({where:{guildID: guild.id}}).then(async guildConfig => {
                const logchannel = await guild.channels.resolve(guildConfig.logChannelID);
                const embed = await logs.logWarn(targetMember, reason, member, guild);
                logchannel.send({embeds: [embed]});
            })
        }).catch(err =>{
            console.log(err);
            return interaction.reply("Code 110 - Unknown Error with Database.");
        });
    });
}