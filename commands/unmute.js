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
        return channel.send("Code 101 - No Arguments Supplied.");
    }else if(member.hasPermission("MANAGE_MESSAGES") == false){
        return channel.send("Code 103 - Invalid Permissions.")
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
                return channel.send("Code 100 - Muted Role is invalid - database corruption?");
            }
            guild.members.fetch(targetID).then(targetMember =>{
                targetMember.roles.remove(mutedRole).then(newMember =>{
                    Mutes.findOne({where: {memberID: targetID}}).then(row =>{
                        row.destroy();
                    }).catch(e => {
                        channel.send("Code 110 - Unknown Error with Database.")
                        console.log(e);
                    });
                }).catch(e =>{
                    console.log(e);
                    return channel.send("Code 100 - Failed to add Mute Role to User.");
                });
            }).catch(e =>{
                console.log(e);
                return channel.send("Code 104 - Invalid User or Member Argument.");
            });
        }).catch(e => {
            console.log(e);
            return channel.send("Code 110 - Unknown Error with Database.")
        });
    }
}