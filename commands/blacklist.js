exports.execute = (interaction) => {
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
    
    var subcommand = args[0].name
    if(subcommand == "add"){
        var subValue = args[0].options[0].value
        
        Blacklists.findOne({where: {[Op.and]: [{guildID: guild.id}, {phrase: subValue}]}}).then(blacklistItem => {
            if(blacklistItem){
                return interaction.reply("That phrase is already in the blacklist for this guild!");
            }else{
                Blacklists.create({
                    guildID: guild.id,
                    phrase: subValue
                }).then(() =>{
                    return interaction.reply(`Added "**${subValue}**" to the guild blacklist.`);
                }).catch(err => {
                    console.log(err);
                    return interaction.reply("Code 110 - Unknown Database Error. Could not write to Blacklists table");
                });
            }
        });
    }else if(subcommand == "list"){
        Blacklists.findAll({where: {guildID: guild.id}}).then(blacklist => {
            if(blacklist.length == 0){
                return interaction.reply("There are no blacklisted phrases on this Guild.");
            }else{
                const blacklistStringify = [];
                blacklist.forEach(item => {
                    blacklistStringify.push(`**ID**: ${item.blacklistID} | **Phrase**: ${item.phrase}\n`);
                })
                return interaction.reply(blacklistStringify);
            }
        });
    }else if(subcommand == "remove"){
        var subValue = args[0].options[0].value
        
        Blacklists.findOne({where: {[Op.and]: [{guildID: guild.id}, {blacklistID: subValue}]}}).then(blacklistItem => {
            if(!blacklistItem){
                return interaction.reply("That blacklist item does not exist on this Guild.");
            }else{
                blacklistItem.destroy();
                return interaction.reply(`Successfully deleted item ${blacklistItem.blacklistID} - ${blacklistItem.phrase} from the blacklist.`);
            }
        });
    }else if(subcommand == "exempt"){
        var subVar = args[0].options[0].name;
        if(subVar == "add"){
            var targetmember = args[0].options[0].options[0].value;
            BlacklistExemptions.findOne({where: {[Op.and]: [{guildID: guild.id}, {userID: targetmember}]}}).then(async row => {
                if(!row){
                    BlacklistExemptions.create({
                        guildID: guild.id,
                        userID: targetmember
                    }).then(async ()=>{
                        return interaction.reply(`Added ${await guild.members.fetch(targetmember)} to the list of exempt members.`);
                    })
                }else{
                    return interaction.reply("That user is already exempt from blacklist checks on this Guild.");
                }
            })
        }else if(subVar == "remove"){
            var targetmember = args[0].options[0].options[0].value;
            BlacklistExemptions.findOne({where: {[Op.and]: [{guildID: guild.id}, {userID: targetmember}]}}).then(async row => {
                if(!row){
                    return interaction.reply("That user is not exempt from blacklist checks on this Guild.");
                }else{
                    row.destroy().then(async ()=>{
                        return interaction.reply(`Removed ${await guild.members.fetch(targetmember)} to the list of exempt members.`);
                    })
                }
            })
        }else if(subVar == "list"){
            BlacklistExemptions.findAll({where: {guildID: guild.id}}).then(rows => {
                var exemptUsers = [];
                rows.forEach(row => {
                    exemptUsers.push(guild.members.fetch(targetmember));
                })
            })
        }
    }else if(subcommand == "automod"){
        var subVar = args[0].options[0].name;
        if(subVar == "set"){
            var blacklistid = args[0].options[0].options[0].value;
            var choice = args[0].options[0].options[1].value;
            var muteduration = args[0].options[0].options[2]? args[0].options[0].options[2].value: null;
            
            if(choice == 1 && muteduration == null){
                return interaction.reply("You must define a valid muteduration argument.")
            }else if(choice == 1 && !ms(muteduration)){
                console.log(muteduration);
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
        }else if(subVar == "remove"){
            var blacklistid = args[0].options[0].options[0].value;
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
}