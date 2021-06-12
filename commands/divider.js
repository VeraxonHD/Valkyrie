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
    const Dividers = main.getDividersTable();

    if(!member.permissions.has("MANAGE_ROLES")){ return interaction.reply("Code 103 - Invalid Permissions. You are missing permission MANAGE_ROLES") }

    var subcommand = args[0];
    if(subcommand.name == "add"){
        var dividerRole = subcommand.options[0].role;
        var topRole = subcommand.options[1].role;
        var bottomRole = subcommand.options[2].role;

        Dividers.create({
            guildID: guild.id,
            dividerRoleID: dividerRole.id,
            topRoleID: topRole.id,
            bottomRoleID: bottomRole.id
        }).then(()=>{
            return interaction.reply("Successfully create an auto-divider.")
        })
    }else if(subcommand.name == "remove"){
        var dividerRole = subcommand.options[0].role;
        Dividers.findOne({where: {[Op.and]: [{guildID: guild.id}, {dividerRoleID: dividerRole.id}]}}).then(divider =>{ 
            if(!divider){
                return interaction.reply("Could not find a divider applied to that role")
            }else{
                divider.destroy().then(() =>{
                    return interaction.reply("Deleted divider successfully.")
                })
            }
        })
    }
}