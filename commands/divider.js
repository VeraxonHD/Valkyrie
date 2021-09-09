exports.execute = async (interaction) => {
    //Interaction information
    const guild = interaction.guild;
    const channel = interaction.channel;
    const member = interaction.member;
    const args = interaction.options || null;

    //Dependencies
    const main = require("../main.js");
    const { Op } = require("sequelize");

    //Database Retrieval
    const Dividers = main.getDividersTable();

    if(!member.permissions.has("MANAGE_ROLES")){ return interaction.reply("Code 103 - Invalid Permissions. You are missing permission MANAGE_ROLES") }

    var subcommand = interaction.options.getSubcommand();
    if(subcommand == "add"){
        var dividerRole = interaction.options.getRole("divider-role");
        var topRole = interaction.options.getRole("top-role");
        var bottomRole = interaction.options.getRole("bottom-role");

        Dividers.create({
            guildID: guild.id,
            dividerRoleID: dividerRole.id,
            topRoleID: topRole.id,
            bottomRoleID: bottomRole.id
        }).then(()=>{
            guild.members.cache.each(gMember => {
                if(!gMember.roles.cache.has(dividerRole.id)){
                    gMember.roles.cache.each(mRole => {
                        if(mRole.position >= bottomRole.position && mRole.position <= topRole.position){
                            //console.log(`Member ${gMember.user.tag} did not have the divider role. Adding...`)
                            gMember.roles.add(dividerRole);
                        }
                    })
                }
            })
            return interaction.reply("Successfully create an auto-divider.")
        })
    }else if(subcommand == "remove"){
        var dividerRole = interaction.options.getRole("divider-role");
        Dividers.findOne({where: {[Op.and]: [{guildID: guild.id}, {dividerRoleID: dividerRole.id}]}}).then(divider =>{ 
            if(!divider){
                return interaction.reply("Could not find a divider applied to that role")
            }else{
                divider.destroy().then(() =>{
                    guild.members.cache.each(gMember => {
                        if(gMember.roles.cache.has(dividerRole.id)){
                            //console.log(`Member ${gMember.user.tag} has divider role. Removing...`)
                            gMember.roles.remove(dividerRole);
                        }
                    })
                    return interaction.reply("Deleted divider successfully.")
                })
            }
        })
    }
}