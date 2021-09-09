exports.execute = async (interaction) => {
    //Interaction information
    const guild = interaction.guild;
    const channel = interaction.channel;
    const member = interaction.member;
    const args = interaction.options || null;
    
    //Dependencies
    const main = require("../main.js");
    const logs = require("../util/logFunctions.js");
    const { Op } = require("sequelize");
    const ms = require("ms");
    
    //Database Retrieval
    const Blacklists = main.getBlacklistsTable();
    const BlacklistExemptions = main.getBlacklistExemptionsTable();

    if(!member.permissions.has("MANAGE_MESSAGES")){
        return interaction.reply("Code 103 - Invalid Permissions. You are missing permission MANAGE_MESSAGES");
    }
    
    var subcommandgroup = interaction.options._group;
    var subcommand = interaction.options.getSubcommand();
    if(subcommandgroup == null && subcommand == "add"){
        var phrase = interaction.options.getString("phrase");
        
        Blacklists.findOne({where: {[Op.and]: [{guildID: guild.id}, {phrase: phrase}]}}).then(blacklistItem => {
            if(blacklistItem){
                return interaction.reply("That phrase is already in the blacklist for this guild!");
            }else{
                Blacklists.create({
                    guildID: guild.id,
                    phrase: phrase
                }).then(() =>{
                    return interaction.reply(`Added "**${phrase}**" to the guild blacklist.`);
                }).catch(err => {
                    console.log(err);
                    return interaction.reply("Code 110 - Unknown Database Error. Could not write to Blacklists table");
                });
            }
        });
    }else if(subcommandgroup == null && subcommand == "list"){
        Blacklists.findAll({where: {guildID: guild.id}}).then(blacklist => {
            if(blacklist.length == 0){
                return interaction.reply("There are no blacklisted phrases on this Guild.");
            }else{
                var blacklistStringify = [];
                blacklist.forEach(item => {
                    blacklistStringify.push(`**ID**: ${item.blacklistID} | **Phrase**: ${item.phrase}`);
                });
                return interaction.reply(blacklistStringify.join("\n"));
            }
        });
    }else if(subcommandgroup == null && subcommand == "remove"){
        var blacklistID = interaction.options.getInteger("blacklistid");
        
        Blacklists.findOne({where: {[Op.and]: [{guildID: guild.id}, {blacklistID: blacklistID}]}}).then(blacklistItem => {
            if(!blacklistItem){
                return interaction.reply("That blacklist item does not exist on this Guild.");
            }else{
                blacklistItem.destroy();
                return interaction.reply(`Successfully deleted item ${blacklistItem.blacklistID} - ${blacklistItem.phrase} from the blacklist.`);
            }
        });
    }else if(subcommandgroup == "exempt" && subcommand == "add"){
        var targetmember = interaction.options.getMember("user");
        BlacklistExemptions.findOne({where: {[Op.and]: [{guildID: guild.id}, {userID: targetmember.id}]}}).then(async row => {
            if(!row){
                BlacklistExemptions.create({
                    guildID: guild.id,
                    userID: targetmember.id
                }).then(async ()=>{
                    return interaction.reply(`Added ${await targetmember.toString()} to the list of exempt members.`);
                })
            }else{
                return interaction.reply("That user is already exempt from blacklist checks on this Guild.");
            }
        })
    }else if(subcommandgroup == "exempt" && subcommand == "remove"){
        var targetmember = interaction.options.getMember("user");
        BlacklistExemptions.findOne({where: {[Op.and]: [{guildID: guild.id}, {userID: targetmember.id}]}}).then(async row => {
            if(!row){
                return interaction.reply("That user is not exempt from blacklist checks on this Guild.");
            }else{
                row.destroy().then(async ()=>{
                    return interaction.reply(`Removed ${await targetmember.toString()} to the list of exempt members.`);
                })
            }
        })
    }else if(subcommandgroup == "exempt" && subcommand == "list"){
        BlacklistExemptions.findAll({where: {guildID: guild.id}}).then(async rows => {
            if(rows.length == 0){
                return interaction.reply("There are no exempt users on this Guild.");
            }else{
                var exemptUsers = [];
                rows.forEach(async row => {
                    var exemptuser = guild.members.resolve(row.userID);
                    exemptUsers.push(exemptuser.user.tag);
                });
                return interaction.reply(`**Exempt members on this guild**: ${exemptUsers.join(", ")}`);
            }
        })
    }else if(subcommandgroup == "automod" && subcommand == "set"){
        var blacklistid = interaction.options.getInteger("blacklistid");
        var choice = interaction.options.getInteger("action");
        var muteduration = interaction.options.getString("muteduration")? interaction.options.getString("muteduration"): null;
        
        if(choice == 1 && muteduration == null){
            return interaction.reply("You must define a valid muteduration argument.")
        }else if(choice == 1 && !ms(muteduration)){
            return interaction.reply("You defined an invalid muteduration. Accepted Formats: 1h (1 Hour), 15m (15 Minutes), 1d (1 Day) etc.")
        }
        
        Blacklists.findOne({where: {[Op.and]: [{guildID: guild.id}, {blacklistID: blacklistid}]}}).then(blacklistItem => {
            if(blacklistItem){
                var options = {};
                if(choice == 1){
                    var options = {
                        "muteduration": muteduration
                    }
                }
                Blacklists.update({automodRule: choice, automodOptions: options}, {where: {[Op.and]: [{guildID: guild.id}, {blacklistID: blacklistid}]}}).then(() => {
                    return interaction.reply("Added automod data to the blacklist item successfully.");
                }).catch(err => {
                    console.log(err);
                    return interaction.reply("Code 110 - There was an error updating the database with the valid automod data.");
                });
            }
        })
    }else if(subcommandgroup == "automod" && subVar == "remove"){
        var blacklistid = interaction.options.getInteger("blacklistid");
        Blacklists.findOne({where: {[Op.and]: [{guildID: guild.id}, {blacklistID: blacklistid}]}}).then(blacklistItem => {
            if(blacklistItem){
                Blacklists.update({automodRule: null, automodOptions: {}}, {where: {[Op.and]: [{guildID: guild.id}, {blacklistID: blacklistid}]}}).then(() => {
                    return interaction.reply("Deleted automod data successfully");
                }).catch((err) => {
                    console.log(err);
                    return interaction.reply("Code 110 - There was an unknown error when trying to delete the automod role data.");
                })
            }
        })
    }
}