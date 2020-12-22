//Dependencies
const Discord = require("discord.js");
const interactions = require("discord-slash-commands-client");
const { Sequelize, DataTypes, Op } = require("sequelize");
const ms = require("ms");
const df = require("dateformat");

//File Loads
const sysConfig = require("./store/config.json");
const common = require("./util/commonFuncs.js");
const logs = require("./util/logFunctions.js");
const package = require("./package.json");

//Globals
const client = new Discord.Client();
    client.interactions = new interactions.Client(
        sysConfig.token,
        "789655175048331283"
    );
const commands = client.interactions;
const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "./store/database.db",
    define: {
        freezeTableName: true
    }
});

//Database Definitions and Loading
const Configs = sequelize.define("Configs", {
    guildID: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        primaryKey: true
    },
    ownerID: {
        type: DataTypes.STRING,
        allowNull: false
    },
    mutedRoleID: {
        type: DataTypes.STRING
    },
    logChannelID: {
        type: DataTypes.STRING
    }
});
const Mutes = sequelize.define("Mutes", {
    guildID: {
        type: DataTypes.STRING,
        allowNull: false
    },
    memberID: {
        type: DataTypes.STRING,
        allowNull: false
    },
    endsAt: {
        type: DataTypes.BIGINT
    },
    reason: {
        type: DataTypes.STRING
    }
});
const Users = sequelize.define("Users", {
    userID: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
        unique: true
    },
    globalMsgCount: {
        type: DataTypes.INTEGER
    },
    globalWarnCount: {
        type: DataTypes.INTEGER
    },
    globalMuteCount: {
        type: DataTypes.INTEGER
    },
    globalKickCount: {
        type: DataTypes.INTEGER
    },
    globalBanCount: {
        type: DataTypes.INTEGER
    },
    lastSeenGuildID: {
        type: DataTypes.STRING
    },
    lastSeenChannelID: {
        type: DataTypes.STRING
    },
    lastSeenTime: {
        type: DataTypes.DATE
    }
});
const GuildUsers = sequelize.define("GuildUsers", {
    guildUserID: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
        unique: true
    },
    guildID: {
        type: DataTypes.STRING,
        allowNull: false
    },
    userID: {
        type: DataTypes.STRING,
        allowNull: false
    },
    guildMsgCount: {
        type: DataTypes.INTEGER
    },
    guildWarnCount: {
        type: DataTypes.INTEGER
    },
    guildMuteCount: {
        type: DataTypes.INTEGER
    },
    guildKickCount: {
        type: DataTypes.INTEGER
    },
    guildBanCount: {
        type: DataTypes.INTEGER
    }
})

//Automated/Frquent Functions
client.setInterval(async () => {
    //Automated Umute Handling
    Mutes.findAll({where: {endsAt: {[Op.and]: [{[Op.lte]: Date.now(), [Op.ne]: "-1"}]}}}).then(rows =>{
        rows.forEach(row => {
            client.guilds.fetch(row.guildID).then(rGuild =>{
                rGuild.members.fetch(row.memberID).then(rMember =>{
                    Configs.findOne({where: {guildID: rGuild.id}}).then(guildConfig =>{
                        if(rMember.roles.cache.has(guildConfig.mutedRoleID)){
                            rMember.roles.remove(rGuild.roles.cache.get(guildConfig.mutedRoleID));
                        }
                        row.destroy();
                    });
                });
            });
        });
    });
}, 2000);

/**==============
 * Event Handlers
 ==============*/

/**
 * 'ready' event - Called when bot is connected to the API.
 */
client.on("ready", async () =>{
    console.log("Bot Loaded.");

    //Sync Database Tables
    await Configs.sync();
    await Mutes.sync();
    await Users.sync();
    await GuildUsers.sync();

    //Set Presence
    client.user.setPresence({ activity: { name: `Ver: ${package.version}` }, status: 'idle' });

    //PingPong Command
    commands.createCommand({
        name: "ping",
        description: "Replies 'Pong!' and includes an average latency"
    }).then(newCommand => {console.log("Created Command"); common.printCommand(newCommand)});
    //Ban Command
    commands.createCommand({
        name: "ban",
        description: "Bans a Member from the Discord.",
        type: 4,
        options: [
            {
                name: "user",
                description: "Ban a user by User ID",
                type: 1,
                options: [
                    {
                        name: "UserID",
                        description: "The User's Unique Snowflake ID",
                        type: 3,
                        required: true
                    },
                    {
                        name: "Reason",
                        description: "The reason for their ban",
                        type: 3
                    }
                ]
            },
            {
                name: "mention",
                description: "Ban a user my mention",
                type: 1,
                options: [
                    {
                        name: "Mention",
                        description: "The User's @Mention",
                        type: 6,
                        required: true
                    },
                    {
                        name: "Reason",
                        description: "The reason for their ban",
                        type: 3
                    }
                ]
            }
        ]
    }).then(newCommand => {console.log("Created Command"); common.printCommand(newCommand)});
    //Kick Command
    commands.createCommand({
        name: "kick",
        description: "Kicks a Member from the Discord.",
        options: [
            {
                name: "user",
                description: "Kick a user by User ID",
                type: 1,
                options: [
                    {
                        name: "UserID",
                        description: "The User's Unique Snowflake ID",
                        type: 3,
                        required: true
                    },
                    {
                        name: "Reason",
                        description: "The reason for their kick",
                        type: 3
                    }
                ]
            },
            {
                name: "mention",
                description: "Kick a user my mention",
                type: 1,
                options: [
                    {
                        name: "Mention",
                        description: "The User's @Mention",
                        type: 6,
                        required: true
                    },
                    {
                        name: "Reason",
                        description: "The reason for their kick",
                        type: 3
                    }
                ]
            }
        ]
    }).then(newCommand => {console.log("Created Command"); common.printCommand(newCommand)});
    //Mute Command
    commands.createCommand({
        name: "mute",
        description: "Mute a user, applying a role that stops them from speaking.",
        options: [
            {
                name: "user",
                description: "Mute a user by User ID",
                type: 1,
                options: [
                    {
                        name: "UserID",
                        description: "The User's Unique Snowflake ID",
                        type: 3,
                        required: true
                    },
                    {
                        name: "Duration",
                        description: "Mute Duration. Accepted Formats: '1h' (1 Hour), '15m' (15 Minutes), '1d' (1 Day) etc.",
                        type: 3
                    },
                    {
                        name: "Reason",
                        description: "The reason for their mute",
                        type: 3
                    }
                ]
            },
            {
                name: "mention",
                description: "Mute a user my mention",
                type: 1,
                options: [
                    {
                        name: "Mention",
                        description: "The User's @Mention",
                        type: 6,
                        required: true
                    },
                    {
                        name: "Duration",
                        description: "Mute Duration. Accepted Formats: '1h' (1 Hour), '15m' (15 Minutes), '1d' (1 Day) etc.",
                        type: 3
                    },
                    {
                        name: "Reason",
                        description: "The reason for their mute",
                        type: 3
                    }
                ]
            }
        ]
    }).then(newCommand => {console.log("Created Command"); common.printCommand(newCommand)});
    //Unmute Command    
    commands.createCommand({
        name: "unmute",
        description: "Unmute a user.",
        options: [
            {
                name: "user",
                description: "Unmute a user by User ID",
                type: 1,
                options: [
                    {
                        name: "UserID",
                        description: "The User's Unique Snowflake ID",
                        type: 3,
                        required: true
                    }
                ]
            },
            {
                name: "mention",
                description: "Unmute a user my mention",
                type: 1,
                options: [
                    {
                        name: "Mention",
                        description: "The User's @Mention",
                        type: 6,
                        required: true
                    }
                ]
            }
        ]
    }).then(newCommand => {console.log("Created Command"); common.printCommand(newCommand)});
    //Config Command
    commands.createCommand({
        name: "config",
        description: "Enables admins to change certain values or behaviours.",
        options: [
            {
                name: "muterole",
                description: "The Role to apply to users when /mute-d.",
                type: 1,
                options: [
                    {
                        name: "muterole",
                        description: "@Role Mentionable of the Mute Role.",
                        type: 8,
                        required: true
                    }
                ]
            },
            {
                name: "logchannel",
                description: "The channel to log bot interactions to.",
                type: 1,
                options: [
                    {
                        name: "logchannel",
                        description: "#Channel Mentionable of the new Log Channel",
                        type: 7,
                        required: true
                    }
                ]
            }
        ]
    }).then(newCommand => {console.log("Created Command"); common.printCommand(newCommand)});
    //UserInfo Command
    commands.createCommand({
        name: "userinfo",
        description: "View your own (or a target's) user information",
        options: [
            {
                name: "mention",
                description: "Optional target @member",
                type: 6
            },
            {
                name: "userid",
                description: "User ID of the target",
                type: 3
            }
        ]
    }).then(newCommand => {console.log("Created Command"); common.printCommand(newCommand)});

    //Delete Command Template
    //commands.deleteCommand("commandID", "guildID") //Local Command
    //commands.deleteCommand("commandID") //Global Command

    //List all Commands
    common.listCommands(commands);
});

/**
 * 'interactionCreate' - Called when a user runs a slash-command.
 * @param interaction - The interaction object from the API
 */
client.on("interactionCreate", (interaction) =>{
    //Defs
    const guild = interaction.guild;
    const channel = interaction.channel;
    const member = interaction.member;
    const author = interaction.author;
    var args = interaction.options || null;

    if(interaction.name == "ping"){
        interaction.channel.send(`Pong! Average Service Latency: \`${client.ws.ping}ms\`.`);
    }
    else if(interaction.name == "ban"){
        if(args == null){
            return channel.send("Code 101 - No Arguments Supplied.");
        }else if(member.hasPermission("BAN_MEMBERS") == false){
            return channel.send("Code 103 - Invalid Permissions.")
        }else{
            var targetID;
            var reason = "No Reason Specified";
            args[0].options.forEach(arg => {
                if(arg.name == "mention" || arg.name == "userid"){
                    targetID = arg.value;
                }else if(arg.name == "reason"){
                    reason = arg.value;
                }
            });

            guild.members.fetch(targetID).then(targetMember =>{
                if(targetMember.bannable){
                    targetMember.ban({days: 7, reason: reason});
                    channel.send(`User ${targetMember.displayName} was banned from the server. Reason: ${reason}. <:banhammer:722877640201076775>`)
                    Configs.findOne({where:{guildID: guild.id}}).then(guildConfig => {
                        guild.channels.resolve(guildConfig.logChannelID).send(logs.logBan(targetMember, reason, member));
                    }).then(()=>{
                        var guildUserCompositeKey = guild.id + targetID
                        Users.increment("globalBanCount",{where:{userID: targetID}});
                        GuildUsers.increment("guildBanCount",{where:{guildUserID: guildUserCompositeKey}});
                    }).catch(e => {
                        console.log(e);
                        return channel.send("Code 110 - Unknown Error with Database.");
                    });
                    
                }else{
                    return channel.send("Code 100 - Unknown Error Occurred.");
                }
            }); 
        }
    }
    else if(interaction.name == "kick"){
        if(args == null){
            return channel.send("Code 101 - No Arguments Supplied.");
        }else if(member.hasPermission("KICK_MEMBERS") == false){
            return channel.send("Code 103 - Invalid Permissions.")
        }else{
            var targetID;
            var reason = "No Reason Specified";
            args[0].options.forEach(arg => {
                if(arg.name == "mention" || arg.name == "userid"){
                    targetID = arg.value;
                }else if(arg.name == "reason"){
                    reason = arg.value;
                }
            });

            guild.members.fetch(targetID).then(targetMember =>{
                if(targetMember.kickable){
                    targetMember.kick(reason);
                    channel.send(`User ${targetMember.displayName} was kicked from the server. Reason: ${reason}.`)
                    Configs.findOne({where:{guildID: guild.id}}).then(guildConfig => {
                        guild.channels.resolve(guildConfig.logChannelID).send(logs.logKick(targetMember, reason, member));
                    }).then(()=>{
                        var guildUserCompositeKey = guild.id + targetID
                        Users.increment("globalKickCount",{where:{userID: targetID}});
                        GuildUsers.increment("guildKickCount",{where:{guildUserID: guildUserCompositeKey}});
                    }).catch(e => {
                        console.log(e);
                        return channel.send("Code 110 - Unknown Error with Database.");
                    });
                }else{
                    return channel.send("Code 100 - Unknown Error Occurred.")
                }
            }); 
        }
    }
    else if(interaction.name == "mute"){
        if(args == null){
            return channel.send("Code 101 - No Arguments Supplied.");
        }else if(member.hasPermission("MANAGE_MESSAGES") == false){
            return channel.send("Code 103 - Invalid Permissions.")
        }else{
            var targetID;
            var duration = -1;
            var reason = "No Reason Specified";
            args[0].options.forEach(arg => {
                if(arg.name == "mention" || arg.name == "userid"){
                    targetID = arg.value;
                }else if(arg.name == "duration"){
                    duration = arg.value;
                }else if(arg.name == "reason"){
                    reason = arg.value;
                }
            });

            var endsTimestamp;
            try{
                endsTimestamp = Date.now() + ms(duration);
            }catch{
                return channel.send("Code 102 - Invalid Argument: 'duration'.\nMust follow (int)(scale)\nExample: ```'10s' - 10 seconds\n'30m' - 30 minutes\n'2h' - 2 Hours\nFull list of examples: https://github.com/vercel/ms#examples```")
            }

            Configs.findOne({where: {guildID: guild.id}}).then(guildConfig =>{
                var mutedRole = guild.roles.cache.get(guildConfig.mutedRoleID);
                if(!mutedRole){
                    return channel.send("Code 100 - Muted Role is invalid - database corruption?");
                }
                guild.members.fetch(targetID).then(targetMember =>{
                    targetMember.roles.add(mutedRole).then(newMember =>{
                        channel.send(`**${newMember.displayName}** has been muted for **${duration}**. Reason: **${reason}**.`);
                        newMember.send(`You have been Muted in **${guild.name}** for **${duration}**. Reason: **${reason}**.`);
                        Mutes.create({
                            guildID: guild.id,
                            memberID: targetID,
                            endsAt: endsTimestamp,
                            reason: reason
                        }).then(()=>{
                            var guildUserCompositeKey = guild.id + targetID
                            Users.increment("globalMuteCount",{where:{userID: targetID}});
                            GuildUsers.increment("guildMuteCount",{where:{guildUserID: guildUserCompositeKey}});
                        }).catch(e => {
                            channel.send("Code 110 - Unknown Error with Database.");
                            console.log(e);
                        });
                        guild.channels.resolve(guildConfig.logChannelID).send(logs.logMute(targetMember, duration, reason, member));
                    }).catch(e=>{
                        console.log(e);
                        return channel.send("Code 100 - Failed to add Mute Role to User.");
                    });
                }).catch( e=>{
                    console.log(e);;
                    return channel.send("Code 104 - Invalid User or Member Argument.");
                });
            }).catch(e => {
                console.log(e);
                return channel.send("Code 110 - Unknown Error with Database.");
            });
        }
    }
    else if(interaction.name == "unmute"){
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
    else if(interaction.name == "config"){
        if(args == null){
            return channel.send("Code 101 - No Arguments Supplied.");
        }else if(member.hasPermission("ADMINISTRATOR") == false){
            return channel.send("Code 103 - Invalid Permissions.")
        }else{
            args[0].options.forEach(arg => {
                var conVar = arg.name;
                var value = arg.value;
                if(conVar == "muterole"){
                    Configs.update({mutedRoleID: value},{where: {guildID: guild.id}}).catch(e => {
                        channel.send("Code 110 - Unknown Error with Database.")
                        console.log(e);
                    });
                    return channel.send(`Updated muted role to <@&${value}> successfully.`);
                }else if(conVar == "logchannel"){
                    Configs.update({logChannelID: value},{where: {guildID: guild.id}}).catch(e => {
                        channel.send("Code 110 - Unknown Error with Database.")
                        console.log(e);
                    });
                    return channel.send(`Updated log channel to <#${value}> successfully.`);
                }
            });
        }
    }
    else if(interaction.name == "userinfo"){
        var targetID;
        if(args != null){
            targetID = args[0].value;
        }else{
            targetID = member.id;
        }

        guild.members.fetch(targetID).then(targetMember =>{
            Users.findOne({where: {userID: targetMember.id}}).then(userData => {
                var guildUserCompositeKey = guild.id + targetMember.id;
                var lastSeenChannelName = client.guilds.cache.get(userData.lastSeenGuildID).channels.resolve(userData.lastSeenChannelID);
                var lastSeenGuildName = client.guilds.cache.get(userData.lastSeenGuildID).name;
                GuildUsers.findOne({where: {guildUserID: guildUserCompositeKey}}).then(guildUserData =>{
                    const embed = new Discord.MessageEmbed()
                        .setAuthor(`UserInfo for ${targetMember.user.tag}`)
                        .addField("General User Data", `**User ID**: ${targetMember.id}\n**Account Mention**: ${targetMember}\n**Is a Bot?**: ${targetMember.user.bot}\n**Created At**: ${df(targetMember.user.createdTimestamp, "dd/mm/yyyy HH:MM:ss Z")}`)
                        .addField("Global Valkyrie Data", `**Messages Sent**: ${userData.globalMsgCount}\n**Last Seen** in ${lastSeenGuildName} (${lastSeenChannelName}) at ${df(userData.lastSeenTime, "dd/mm/yyyy HH:MM:ss Z")}`)
                        .addField("Global Infractions", `**Warns**:${userData.globalMuteCount}\n**Mutes**:${userData.globalMuteCount}\n**Kicks**:${userData.globalKickCount}\n**Bans**:${userData.globalBanCount}`, true)
                        .addField("This Guild Data", `**Messages Sent**: ${guildUserData.guildMsgCount}\n**Joined At**: ${df(guildUserData.createdAt, "dd/mm/yyyy HH:MM:ss Z")}`)
                        .addField("This Guild Infractions", `**Warns**:${guildUserData.guildWarnCount}\n**Mutes**:${guildUserData.guildMuteCount}\n**Kicks**:${guildUserData.guildKickCount}\n**Bans**:${guildUserData.guildBanCount}`, true)
                        .setColor("#00C597")
                        .setFooter("userinfo.interactions.valkyrie")
                        .setTimestamp(new Date());
                channel.send({embed})
                })
            })
        })
    }
});

/**
 * 'guildCreate' - Called when joining a new Guild
 * @param guild - The guild object from the API
 * @todo Add automated log channel creation
 */
client.on("guildCreate", async (guild) =>{
    Configs.create({
        guildID: guild.id,
        ownerID: guild.ownerID
    }).then( () =>{
        console.log(`Joined Guild ${guild.name} (${guild.id}) successfully.`);
        client.guilds.fetch("409365548766461952").then(devGuild => {
            devGuild.channels.resolve("742885805449805945").send(`I joined a new server! Name: ${guild.name}, ID: ${guild.id}, Owner: <@${guild.ownerID}>`);
        })
    }
    ).catch(console.log)

    var mutedRole = guild.roles.cache.find(r => r.name.toLowerCase() == "muted")
    //Find or Create a 'Muted' Role.
    if(!mutedRole){
        try{
            guild.roles.create({
                data: {
                    name: "Muted",
                    color: "RED"
                },
                reason: "Automatically created a Muted Role. If you have one already, please edit the config file to point to that role. Else, feel free to edit this role however you please."
            }).then(newMutedRole => {
                Configs.update({mutedRoleID: newMutedRole.id}, {where:{guildID: guild.id}})
            })
        }catch(e){
            console.log(e)
        }
    }else{
        Configs.update({mutedRoleID: mutedRole.id}, {where:{guildID: guild.id}}).catch(e => {
            channel.send("Code 110 - Unknown Error with Database.")
            console.log(e);
        })
    }

    //Find or Create a 'LogChannel'.
})

/**
 * 'message' - Called when a message is sent in a monitored Guild
 * @param message - The message object
 */
client.on("message", async (message) =>{
    if(message.channel.type === "text" && message.author.id != client.user.id){
        var guildUserCompositeKey = message.guild.id + message.author.id;
        Users.findOne({where: {userID: message.author.id}}).then(user => {
            if(!user){
                Users.create({
                    userID: message.author.id,
                    globalMsgCount: 1,
                    globalWarnCount: 0,
                    globalMuteCount: 0,
                    globalKickCount: 0,
                    globalBanCount: 0,
                    lastSeenGuildID: message.guild.id,
                    lastSeenChannelID: message.channel.id,
                    lastSeenTime: Date.now()
                });
            }else{
                Users.increment('globalMsgCount', {where: {userID: message.author.id}});
            }
        });
        GuildUsers.findOne({where: {guildUserID: guildUserCompositeKey}}).then(guildUser => {
            if(!guildUser){
                GuildUsers.create({
                    guildUserID: guildUserCompositeKey,
                    guildID: message.guild.id,
                    userID: message.author.id,
                    guildMsgCount: 1,
                    guildWarnCount: 0,
                    guildMuteCount: 0,
                    guildKickCount: 0,
                    guildBanCount: 0,
                });
            }else{
                GuildUsers.increment('guildMsgCount', {where: {guildUserID: guildUserCompositeKey}});
            }
        });
    }else{
        return;
    }
});
//Client Log In
client.login(sysConfig.token);