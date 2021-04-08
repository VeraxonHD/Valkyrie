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
    const Configs = main.getConfigsTable();
    const Mutes = main.getMutesTable();

    if(args == null){
        return interaction.reply("Code 101 - No Arguments Supplied.");
    }else if(member.permissions.has("MANAGE_MESSAGES") == false){
        return interaction.reply("Code 103 - Invalid Permissions.")
    }else{
        var targetID;
        args[0].options.forEach(arg => {
            if(arg.name == "mention" || arg.name == "userid"){
                targetID = arg.value;
            }
        });

        Configs.findOne({where: {guildID: guild.id}}).then(guildConfig =>{
            var mutedRole = guild.roles.cache.get(guildConfig.mutedRoleID);
            if(!mutedRole){
                return interaction.reply("Code 100 - Muted Role is invalid - database corruption?");
            }
            guild.members.fetch(targetID).then(targetMember =>{
                targetMember.roles.remove(mutedRole).then(newMember =>{
                    Mutes.findOne({where: {memberID: targetID}}).then(row =>{
                        row.destroy();
                        return interaction.reply(`Member <@${targetID}> was unmuted successfully.`);
                    }).catch(e => {
                        interaction.reply("Code 104 - That member is not muted (Invalid User)");
                        console.log(e);
                    });
                }).catch(e =>{
                    console.log(e);
                    return interaction.reply("Code 100 - Failed to add Mute Role to User.");
                });
            }).catch(e =>{
                console.log(e);
                return interaction.reply("Code 104 - Invalid User or Member Argument.");
            });
        }).catch(e => {
            console.log(e);
            return interaction.reply("Code 110 - Unknown Error with Database.");
        });
    }
}