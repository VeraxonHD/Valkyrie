exports.execute = (interaction) => {
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

    //Arguments
    var targetID;
    var reason = "No Reason Supplied";
    args[0].options.forEach(arg => {
        if(arg.name == "mention" || arg.name == "userid"){
            targetID = arg.value;
        }else if(arg.name == "reason"){
            reason = arg.value;
        }
    });

    guild.members.fetch(targetID).then(targetMember => {
        Warns.create({
            guildID: guild.id,
            memberID: targetID,
            moderatorID: member.id,
            reason: reason
        }).then(() => {
            const guildUserCompositeKey = guild.id + member.id;
            channel.send(`**${targetMember.displayName}** has been warned. Reason: **${reason}**.`);
            targetMember.send(`You have been Warned in **${guild.name}**. Reason: **${reason}**.`);

            Users.increment("globalWarnCount",{where:{userID: targetID}});
            GuildUsers.increment("guildWarnCount",{where:{guildUserID: guildUserCompositeKey}});

            Configs.findOne({where:{guildID: guild.id}}).then(guildConfig => {
                guild.channels.resolve(guildConfig.logChannelID).send(logs.logWarn(targetMember, reason, member));
            })
        }).catch(err =>{
            console.log(err);
            return channel.send("Code 110 - Unknown Error with Database.");
        });
    });
}