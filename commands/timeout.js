exports.execute = async (interaction) => {
    //Interaction information
    const guild = interaction.guild;
    const channel = interaction.channel;
    const member = interaction.member;
    const args = interaction.options || null;

    //Dependencies
    const main = require("../main.js");
    const logs = require("../util/logFunctions.js");
    const ms = require("ms");

    //Database Retrieval
    const Users = main.getUsersTable();
    const GuildUsers = main.getGuildUsersTable();
    const Configs = main.getConfigsTable();
    const Timeouts = main.getTimeoutsTable();
    const Infractions = main.getInfractionsTable();

    if(args == null){
        return interaction.reply("Code 101 - No Arguments Supplied.");
    }else if(member.permissions.has("MODERATE_MEMBERS") == false){
        return interaction.reply("Code 103 - Invalid Permissions. You are missing permission MODERATE_MEMBERS")
    }else{
        var targetID = args.getMember("member")? args.getMember("member").id: args.getString("userid");
        var duration = args.getString("duration")? args.getString("duration"): -1;
        var reason = args.getString("reason");
        if(!reason){
            reason = "No reason specified";
        }

        const durationMS = ms(duration);
        if(isNaN(durationMS)){
            return interaction.reply("That is not a valid duration. Please provide a duration as defined here: https://www.npmjs.com/package/ms#Examples");
        }else if(durationMS < 0){
            return interaction.reply("The duration cannot be in the past. Please provide a positive duration.")
        }

        guild.members.fetch(targetID).then(async targetMember => {
            if(!targetMember){
                return interaction.reply("Code 104 - Invalid Member.");
            }else{
                targetMember.timeout(durationMS, reason).then(async (mem) =>{
                    const unix = Date.now();
                    const expiresUnix = Math.floor(unix / 1000) + (durationMS / 1000)
                    console.log(expiresUnix)
                    mem.send(`You have been timed out in **${guild.name}** for **${duration}**. Reason: **${reason}**. Your timeout will expire <t:${expiresUnix}:R>.`)
                    Timeouts.create({
                        guildID: guild.id,
                        memberID: targetID,
                        moderatorID: member.id,
                        duration: durationMS,
                        reason: reason
                    }).then(()=>{
                        var guildUserCompositeKey = guild.id + targetID
                        Users.increment("globalMuteCount",{where:{userID: targetID}});
                        GuildUsers.increment("guildMuteCount",{where:{guildUserID: guildUserCompositeKey}});
                        Infractions.create({
                            guildID: guild.id,
                            userID: targetID,
                            type: 1,
                            reason: reason,
                            moderatorID: member.id
                        });
                    });

                    Configs.findOne({where: {guildID: guild.id}}).then(async guildConfig => {
                        if(!guildConfig){
                            return interaction.reply("Code 110 - Unknown database error. Config does not exist.")
                        }
                        const logchannel = await guild.channels.resolve(guildConfig.logChannelID);
                        const embed = await logs.logMute(targetMember, duration, reason, member, guild);

                        logchannel.send({embeds: [embed]});

                        return interaction.reply(`Timed out **${targetMember.displayName}** for **${duration}**. Reason: **${reason}**`);
                    })
                })
            }
        })
    }
}