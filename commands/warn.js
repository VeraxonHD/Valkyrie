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
        }).then( model => {
            channel.send(`**${newMember.displayName}** has been warned. Reason: **${reason}**.`);
            newMember.send(`You have been Warned in **${guild.name}**. Reason: **${reason}**.`);
            return logs.logWarn(targetMember, reason, member);
        }).catch(err =>{
            console.log(err);
            return channel.send("Code 110 - Unknown Error with Database.");
        });
    });
}