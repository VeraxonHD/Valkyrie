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
    const Warns = main.getWarnsTable();
    const Users = main.getUsersTable();
    const GuildUsers = main.getGuildUsersTable();
    const Configs = main.getConfigsTable();
    const Infractions = main.getInfractionsTable();

    if(member.permissions.has("MANAGE_MESSAGES") == false){
        return interaction.reply("Code 103 - Invalid Permissions.");
    }

    //Arguments
    var targetID;
    var reason = "No Reason Supplied";
    args[0].options.forEach(arg => {
        if(arg.name == "member" || arg.name == "userid"){
            targetID = arg.value;
        }else if(arg.name == "reason"){
            reason = arg.value;
        }
    });

    guild.members.fetch(targetID).then(async targetMember => {
        Warns.create({
            guildID: guild.id,
            memberID: targetID,
            moderatorID: member.id,
            reason: reason
        }).then(async () => {
            const guildUserCompositeKey = guild.id + targetMember.id;
            interaction.reply(`**${targetMember.displayName}** has been warned. Reason: **${reason}**.`);
            targetMember.send(`You have been Warned in **${guild.name}**. Reason: **${reason}**.`);

            Users.increment("globalWarnCount",{where:{userID: targetID}});
            GuildUsers.increment("guildWarnCount",{where:{guildUserID: guildUserCompositeKey}});

            Infractions.create({
                guildID: guild.id,
                userID: targetID,
                type: 0,
                reason: reason,
                moderatorID: member.id
            });

            Configs.findOne({where:{guildID: guild.id}}).then(async guildConfig => {
                guild.channels.resolve(guildConfig.logChannelID).send(await logs.logWarn(targetMember, reason, member, guild));
            })
        }).catch(err =>{
            console.log(err);
            return interaction.reply("Code 110 - Unknown Error with Database.");
        });
    });
}