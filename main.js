//Dependencies
const Discord = require("discord.js");
const { Sequelize, DataTypes, Op } = require("sequelize");
const ms = require("ms");
const df = require("dateformat");

//File Loads
const sysConfig = require("./store/config.json");
const common = require("./util/commonFuncs.js");
const logs = require("./util/logFunctions.js");
const package = require("./package.json");
const commands = require("./store/commands.json");

//Globals
const client = new Discord.Client({
    partials: ["MESSAGE", "REACTION", "CHANNEL"],
    intents: ["GUILDS", "GUILD_MEMBERS", "GUILD_PRESENCES", "GUILD_EMOJIS_AND_STICKERS", "GUILD_MESSAGE_REACTIONS", "GUILD_BANS", "GUILD_VOICE_STATES", "GUILD_MESSAGES", "GUILD_MESSAGE_TYPING"]
});
const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "./store/database.db",
    define: {
        freezeTableName: true
    },
    logging: false
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
    },
    logTypes: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    autoRoleID: {
        type: DataTypes.STRING
    },
    welcomeMessage: {
        type: DataTypes.STRING
    },
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
const ReactionRoles = sequelize.define("ReactionRoles", {
    reactionRoleID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        unique: true,
        allowNull: false,
        autoIncrement: true
    },
    guildID: {
        type: DataTypes.STRING,
        allowNull: false
    },
    channelID: {
        type: DataTypes.STRING,
        allowNull: false
    },
    messageID: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    creatorGUID: {
        type: DataTypes.STRING,
        allowNull: false
    },
    reactions: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {}
    }
})
const Tags = sequelize.define("Tags", {
    guildID: {
        type: DataTypes.STRING,
        allowNull: false
    },
    creatorID: {
        type: DataTypes.STRING,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    response: {
        type: DataTypes.STRING,
        allowNull: false
    },
    access: {
        type: DataTypes.JSON
    },
    uses: {
        type: DataTypes.INTEGER
    }
})
const Lobbies = sequelize.define("Lobbies", {
    guildID: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lobbyID: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lobbySize: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    lobbyLocked: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    creatorID: {
        type: DataTypes.STRING,
        allowNull: false
    }
});
const LobbyHubs = sequelize.define("LobbyHubs", {
    guildID: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lobbyID: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lobbyHubParentID: {
        type: DataTypes.STRING,
        allowNull: false
    },
    creatorID: {
        type: DataTypes.STRING,
        allowNull: false
    }
});
const Infractions = sequelize.define("Infractions", {
    infractionID: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
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
    type: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 0,
            max: 3
        }
    },
    reason: {
        type: DataTypes.STRING,
        validate:{
            customValidator(value){
                if(value === null){
                    value = "No Reason Specified"
                }
            }
        }
    },
    moderatorID: {
        type: DataTypes.STRING,
        allowNull: false
    }
});
const Dividers = sequelize.define("Dividers", {
    guildID: {
        type: DataTypes.STRING,
        allowNull: false
    },
    dividerRoleID: {
        type: DataTypes.STRING,
        allowNull: false
    },
    topRoleID:{
        type: DataTypes.STRING,
        allowNull: false
    },
    bottomRoleID: {
        type: DataTypes.STRING,
        allowNull: false
    }
})
const Blacklists = sequelize.define("Blacklists", {
    blacklistID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    guildID: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phrase: {
        type: DataTypes.STRING,
        allowNull: false
    },
    automodRule:{
        type: DataTypes.INTEGER,
        defaultValue: null
    },
    automodOptions:{
        type: DataTypes.JSON,
        defaultValue: {}
    }
})
const BlacklistExemptions = sequelize.define("BlacklistExemptions", {
    guildID: {
        type: DataTypes.STRING,
        allowNull: false
    },
    userID: {
        type: DataTypes.STRING,
        allowNull: false
    }
})

//DB Table Getters
exports.getConfigsTable = () =>{
    return Configs;
}
exports.getMutesTable = () =>{
    return Mutes;
}
exports.getUsersTable = () =>{
    return Users;
}
exports.getGuildUsersTable = () =>{
    return GuildUsers;
}
exports.getReactionRolesTable = () =>{
    return ReactionRoles;
}
exports.getTagsTable = () =>{
    return Tags;
}
exports.getLobbiesTable = () =>{
    return Lobbies;
}
exports.getLobbyHubsTable = () =>{
    return LobbyHubs;
}
exports.getInfractionsTable = () =>{
    return Infractions;
}
exports.getDividersTable = () =>{
    return Dividers;
}
exports.getBlacklistsTable = () => {
    return Blacklists;
}
exports.getBlacklistExemptionsTable = () => {
    return BlacklistExemptions;
}
//Client Getter
exports.getClient = () =>{
    return client;
}

//Automated/Frquent Functions

const interval = setInterval(function() {
    //Automated Umute Handling
    Mutes.findAll({where: {endsAt: {[Op.and]: [{[Op.lte]: Date.now(), [Op.ne]: "-1"}]}}}).then(async rows =>{
        rows.forEach(row => {
            client.guilds.fetch(row.guildID).then(async rGuild =>{
                rGuild.members.fetch(row.memberID).then(async rMember =>{
                    Configs.findOne({where: {guildID: rGuild.id}}).then(async guildConfig =>{
                        var mutedRole = rGuild.roles.cache.get(guildConfig.mutedRoleID)
                        if(!mutedRole){
                            console.log(`Muted Role ${guildConfig.mutedRoleID} in guild ${row.guildID} no longer exists. Deleting record in Mutes table.`);
                            row.destroy();
                        }
                        if(rMember.roles.cache.has(mutedRole.id)){
                            rMember.roles.remove(mutedRole);
                        }
                        row.destroy();
                    });
                }).catch( err =>{
                    console.log(`Member ${row.memberID} from Mutes table no longer exists. Deleting record.`);
                    row.destroy();
                });
            }).catch( err =>{
                console.log(`Guild ${row.guildID} from Mutes table no longer exists. Deleting record.`);
                row.destroy();
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
    await ReactionRoles.sync();
    await Mutes.sync();
    await Tags.sync();
    await Lobbies.sync();
    await LobbyHubs.sync();
    await Infractions.sync();
    await Dividers.sync();
    await Blacklists.sync();
    await BlacklistExemptions.sync();
    
    //Set Presence
    //client.user.setPresence({ activity: { name: `Ver: ${package.version}` }, status: 'online' });
    client.user.setActivity(`Ver ${package.version} | Serving ${client.users.cache.size} members on ${client.guilds.cache.size} guilds`, {type: "PLAYING"})
    
    //Register Global Commands
    const cmds = await client.application.commands.set(commands);
    //console.log(cmds)
    /* for(var command in commands){
        console.log(`Registering command ${commands[command].name}...`)
        await client.application.commands.create(commands[command]).then(newCommand => {
            console.log(`Registered new command ${commands[command].name} successfully.`)
        }).catch(e => {console.error(e)});
    } */
    
    var testguild = client.guilds.cache.get("409365548766461952");
    /* await testguild.commands.create(infractioncmd).then(newcmd => {
        console.log(newcmd.name + " " + newcmd.id)
    }) */
});

/**
* 'interactionCreate' - Called when a user runs a slash-command.
* @param interaction - The interaction object from the API
*/
client.on("interactionCreate", (interaction) =>{
    if(!interaction.isCommand()){ return; }

    var cmdFile = require(`./commands/${interaction.commandName}.js`);
    if(!cmdFile){
        return;
    }else{
        try{
            cmdFile.execute(interaction);
        }catch(e){
            console.log(e);
        }
    }
});

/**
* 'guildCreate' - Called when joining a new Guild
* @param guild - The guild object from the API
*/
client.on("guildCreate", async (guild) =>{
    var mutedRoleExists = true;
    var logChannelExists = true;
    
    Configs.create({
        guildID: guild.id,
        ownerID: guild.ownerId,
        logTypes: {
            usermigration: true,
            messagedelete: true,
            messageedit: true,
            voicestate: true,
            rolechanges: true
        }
    }).then( () =>{
        console.log(`Joined Guild ${guild.name} (${guild.id}) successfully.`);
        client.guilds.fetch("409365548766461952").then(devGuild => {
            devGuild.channels.resolve("742885805449805945").send(`I joined a new server! Name: ${guild.name}, ID: ${guild.id}, Owner: <@${guild.ownerId}>`);
        })
    }
    ).catch(console.log)
    
    var mutedRole = guild.roles.cache.find(r => r.name.toLowerCase() == "muted");
    //Find or Create a 'Muted' Role.
    if(!mutedRole){
        try{
            guild.roles.create({
                data: {
                    name: "Muted",
                    color: "RED",
                    reason: "Automatically created a Muted Role. If you have one already, please use /config to point to that role. Else, feel free to edit this role however you please."
                }
            }).then(newMutedRole => {
                Configs.update({mutedRoleID: newMutedRole.id}, {where:{guildID: guild.id}}).then(() => {
                    embed.addField("I automatically created a muted role", "Feel free to edit this role however you want!");
                }).catch(e => {
                    console.log(e);
                })
            })
        }catch(e){
            mutedRoleExists = false;
            console.log(e);
            //return channel.send("Code 120 - Bot has insufficient Permissions to Create a Role.");
        }
    }else{
        Configs.update({mutedRoleID: mutedRole.id}, {where:{guildID: guild.id}}).then(() => {
            embed.addField("I found an existing mute role", "You already had a role called 'Muted', so I set that as the role to apply when a member is muted.\nYou can edit this at any time with the command \`/config mutedrole\`");
        }).catch(e => {
            console.log(e);
            //return channel.send("Code 110 - Unknown Error with Database.");
        })
    }
    
    var logChannel = guild.channels.cache.find(c => c.name.toLowerCase() === "logchannel");
    if(!logChannel){
        try{
            guild.channels.create("logchannel", {
                data: {
                    type: "text",
                    topic: "Log channel for Valkyrie",
                    reason: "Automatically created a Log Channel. If you have one already, please use /config to point to that role. Else, feel free to edit this channel however you please."
                },
            }).then(newLogChannel => {
                Configs.update({logChannelID: newLogChannel.id}, {where: {guildID: guild.id}}).then(() => {
                    embed.addField("I automatically created a log channel", "Feel free to edit this channel however you want!");
                }).catch(e=>{
                    console.log(e);
                    //return channel.send("Code 110 - Unknown Error with Database.");
                })
            })
        }catch(e){
            logChannelExists = false;
            console.log(e);
            //return channel.send("Code 120 - Bot has insufficient Permissions to Create a Channel.");
        }
    }else{
        Configs.update({logChannelID: logChannel.id}, {where:{guildID: guild.id}}).then(() => {
            embed.addField("I found an existing log channel", "You already had a channel called #logchannel, so I set that as the destination for all my log features.\nYou can edit this at any time with the command \`/config logchannel\`");
        }).catch(e => {
            console.log(e);
            //return channel.send("Code 110 - Unknown Error with Database.");
        })
    }
    
    const embed = new Discord.MessageEmbed()
    .setColor("GREEN")
    .setTimestamp(Date.now())
    .setAuthor("Welcome to the Valkyrie family!")
    .addField("Support Discord", "Need help? Join https://discord.gg/NvqK5W9");
    if(mutedRoleExists == false){
        embed.addField("I couldn't find or create a muted role", "If you already have one, use `/config muterole` to change the server config");
    }
    if(logChannelExists == false){
        embed.addField("I couldn't find or create a log channel", "If you already have one, use `/config logchannel` to change the server config");
    }
    
    guild.members.fetch(guild.ownerId).then(guildOwner =>{
        guildOwner.send({embeds: [embed]})
    });
})

/**
* 'message' - Called when a message is sent in a monitored Guild
* @param message - The message object
*/
client.on("messageCreate", async (message) =>{
    if(message.author.id == client.user.id){ return }
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
        if(message.content.length > 0){
            Blacklists.findAll({where: {guildID: message.guild.id}}).then(async blacklist => {
                BlacklistExemptions.findOne({where: {[Op.and]: [{guildID: message.guild.id},{userID: message.author.id}]}}).then(async row => {
                    if(!row){
                        if(blacklist.length != 0){
                            blacklist.forEach(async blacklistItem => {
                                if(message.content.indexOf(blacklistItem.phrase) != -1){
                                    message.reply("Your message contained a phrase on this Guild's blacklist. The message has been deleted.").then(async () => {
                                        var logchannel = await common.getLogChannel(message.guild.id);
                                        
                                        switch (blacklistItem.automodRule) {
                                            case 0:
                                                Infractions.create({
                                                    guildID: message.guild.id,
                                                    userID: message.author.id,
                                                    type: 0,
                                                    reason: "Use of a blacklisted word/phrase - automod warn action",
                                                    moderatorID: client.user.id
                                                });
                                                if(logchannel){
                                                    await logchannel.send(await logs.logWarn(message.author.id, "Use of a blacklisted word/phrase - automod warn action", client.user.id, message.guild));
                                                } 
                                                break;
                                            case 1:
                                                var mutedRole;
                                                await Configs.findOne({where: {guildID: message.guild.id}}).then(async guildConfig =>{
                                                    mutedRole = message.guild.roles.cache.get(guildConfig.mutedRoleID);
                                                })
                                                if(mutedRole){
                                                    message.member.roles.add(mutedRole).then(() => {
                                                        const duration = blacklistItem.automodOptions.muteduration;
                                                        Mutes.create({
                                                            guildID: message.guild.id,
                                                            memberID: message.author.id,
                                                            endsAt: Date.now() + ms(duration),
                                                            reason: "Use of a blacklisted word/phrase - automod mute action"
                                                        }).then(async ()=>{
                                                            Users.increment("globalMuteCount",{where:{userID: message.author.id}});
                                                            GuildUsers.increment("guildMuteCount",{where:{guildUserID: guildUserCompositeKey}});
                                                            
                                                            Infractions.create({
                                                                guildID: message.guild.id,
                                                                userID: message.author.id,
                                                                type: 1,
                                                                reason: "Use of a blacklisted word/phrase - automod mute action",
                                                                moderatorID: client.user.id
                                                            });
                                                            
                                                            if(logchannel){
                                                                await logchannel.send(await logs.logMute(message.author.id, "Use of a blacklisted word/phrase - automod mute action", duration, client.user.id, message.guild));
                                                            } 
                                                        }).catch(e => {
                                                            console.log(e);
                                                        });
                                                    }) 
                                                }
                                                break;
                                            case 2:
                                                message.member.kick("Use of a blacklisted word/phrase - automod kick action").then(async () => {
                                                    Infractions.create({
                                                        guildID: message.guild.id,
                                                        userID: message.author.id,
                                                        type: 2,
                                                        reason: "Use of a blacklisted word/phrase - automod kick action",
                                                        moderatorID: client.user.id
                                                    });
                                                    if(logchannel){
                                                        await logchannel.send(await logs.logKick(message.author.id, "Use of a blacklisted word/phrase - automod kick action", client.user.id, message.guild));
                                                    } 
                                                });
                                                
                                                break;
                                            case 3:
                                                message.member.ban({days: 7, reason: "Use of a blacklisted word/phrase - automod kick action"}).then(async () => {
                                                    Infractions.create({
                                                        guildID: message.guild.id,
                                                        userID: message.author.id,
                                                        type: 2,
                                                        reason: "Use of a blacklisted word/phrase - automod kick action",
                                                        moderatorID: client.user.id
                                                    });
                                                    if(logchannel){
                                                        await logchannel.send(await logs.logBan(message.author.id, "Use of a blacklisted word/phrase - automod ban action", client.user.id, message.guild));
                                                    } 
                                                });
                                                break;
                                            default:
                                                break;
                                        }                    
                                        message.delete();
                                    })
                                }
                            })
                        }
                    }
                })
            })
            if(message.content.startsWith('$')){
                var tagFromMsg = message.content.split('$')[1].split(' ')[0];
                Tags.findOne({where: {[Op.and]: [{guildID: message.guild.id}, {name: tagFromMsg}]}}).then(tag =>{
                    if(tag){
                        var channelAccess, roleAccess, memberAccess = false;
                        
                        if(tag.access.channels.includes(message.channel.id) || tag.access.channels.length == 0){
                            channelAccess = true;
                        }
                        
                        if(tag.access.roles.length == 0){
                            roleAccess = true;
                        }else{
                            tag.access.roles.forEach(role =>{
                                if(message.member.roles.cache.has(role)){
                                    roleAccess = true;
                                    return;
                                }
                            });
                        }
                        
                        if(tag.access.members.includes(message.member.id) || tag.access.members.length == 0){
                            memberAccess = true;
                        }
                        
                        if(channelAccess && roleAccess && memberAccess){
                            var response = tag.response;
                            
                            response = response.replace(/%AUTH/g, message.member.displayName);
                            response = response.replace(/%CHAN/g, message.channel.name);
                            response = response.replace(/%GULD/g, message.guild.name);
                            
                            Tags.increment('uses', {where: {[Op.and]: [{guildID: message.guild.id}, {name: tagFromMsg}]}});
                            return message.channel.send(response);
                        }
                    }
                });
            }
            if(message.content.startsWith(sysConfig.prefix)){
                const args = message.content.slice(sysConfig.prefix.length).split(" ");
                const commandName = args.shift().toLowerCase();
                var cmdFile = require(`./commands/${commandName}.js`);
                if(!cmdFile){
                    return;
                }else{
                    try{
                        cmdFile.execute(message, args);
                    }catch(e){
                        console.log(e);
                    }
                }
            }
        }
        
    }else{
        return;
    }
});

/**
* 'messageReactionAdd' - Called when a reaction is added to a message
* @param messageReaction - the reaction object
* @param user - the user that reacted
*/
client.on("messageReactionAdd", async (messageReaction, user) => {
    
    if(user.id === client.user.id) return;
    
    if(messageReaction.message.partial) await messageReaction.message.fetch();
    var message = messageReaction.message;
    var emojiID = messageReaction.emoji.id;
    
    ReactionRoles.findOne({where: {messageID: message.id}}).then(row => {
        if(!row) return;
        var role = message.guild.roles.resolve(row.reactions[emojiID].roleID);
        
        try{
            message.guild.members.fetch(user.id).then(member =>{
                member.roles.add(role);
            })
        }catch(e){
            console.log(e);
        }
    })
});

/**
* 'messageReactionRemove' - Called when a reaction is removed from a message
* @param messageReaction - the reaction object
* @param user - the user that reacted
*/
client.on("messageReactionRemove", async (messageReaction, user) => {
    
    if(user.id === client.user.id) return;
    
    if(messageReaction.message.partial) await messageReaction.message.fetch();
    var message = messageReaction.message;
    var emojiID = messageReaction.emoji.id;
    
    ReactionRoles.findOne({where: {messageID: message.id}}).then(row => {
        if(!row) return;
        var role = message.guild.roles.resolve(row.reactions[emojiID].roleID);
        
        try{
            message.guild.members.fetch(user.id).then(member =>{
                member.roles.remove(role);
            })
        }catch(e){
            console.log(e);
        }
    })
});

/**
* 'messageDelete' - Called when a message is deleted
* @param message - The message object
*/
client.on("messageDelete", async (message) =>{
    if(message.partial){
        return;
    }
    
    const guild = message.guild;
    const member = message.member;

    if(!member || !guild){
        return;
    }
    
    const enabled = await common.getLogTypeState(guild.id, "messagedelete");
    if(enabled == false){
        return;
    }
    
    const logchannel = await common.getLogChannel(guild.id);
    if(!logchannel){
        return;
    }else{
        const attachments = [];
        if(message.attachments.size != 0){
            message.attachments.each(attachment => {
                attachments.push(attachment.proxyURL)
            })
        }
        
        const embed = new Discord.MessageEmbed()
            .setAuthor(`${member.displayName}'s message was deleted`)
            .addField("Message Data", `**Date/Time**: ${df(message.createdTimestamp, "dd/mm/yyyy HH:MM:ss Z")}\n**Creator Name/ID**: ${guild.members.resolve(member.id).toString()} (${member.id})\n`)
            .setColor("RED")
            .setFooter("messagedelete.logs.valkyrie")
            .setTimestamp(new Date());
        
        if(message.content){
            embed.addField("Message Content", message.content)
        }
        if(attachments.length != 0){
            embed.addField("Message Attachment URLs", attachments)
        }
        
        return logchannel.send({embeds: [embed]});
    }
});

/**
* 'messageUpdate' - Called when a message is edited
* @param oldMessage - old message object
* @param newMessage - new message object
*/
client.on("messageUpdate", async (oldMessage, newMessage) =>{
    if(newMessage.partial) await newMessage.fetch();
    if(oldMessage.partial) await oldMessage.fetch();
    
    const guild = newMessage.guild;
    const member = newMessage.member;
    
    if((newMessage) && (newMessage.content != oldMessage.content)){
        const enabled = await common.getLogTypeState(guild.id, "messageedit");
        if(enabled == false){
            return;
        }
        const logchannel = await common.getLogChannel(guild.id);
        if(!logchannel){
            return;
        }else{
            const oldContent = oldMessage.content ? oldMessage.content : "Old Message Content was Empty";
            const newContent = newMessage.content ? newMessage.content : "New Message Content is Empty";
            const attachments = [];
            
            if(oldMessage.attachments.size != 0){
                oldMessage.attachments.each(attachment => {
                    attachments.push(attachment.proxyURL)
                })
            }
            
            const embed = new Discord.MessageEmbed()
            .setAuthor(`${member.displayName}'s message was edited`)
            .addField("Message Data", `**Date/Time**: ${df(oldMessage.createdTimestamp, "dd/mm/yyyy HH:MM:ss Z")}\n**Creator Name/ID**: ${guild.members.resolve(member.id).toString()} (${member.id})\n`)
            .addField("Old Message Content", oldContent)
            .addField("New Message Content", newContent)
            .setColor("ORANGE")
            .setFooter("messageupdate.logs.valkyrie")
            .setTimestamp(new Date());
            
            if(attachments.length != 0){
                embed.addField("Message Attachment URLs", attachments)
            }
            
            return logchannel.send({embeds: [embed]});
        }
    }else{
        return;
    }
});

/**
* 'guildMemberAdd' - Called when a member joins a guild.
* @param member - the member that joined's object
*/
client.on("guildMemberAdd", async (member) => {
    const guild = member.guild;
    Configs.findOne({where:{guildID: guild.id}}).then(row => {
        if(row.autoRoleID != null){
            if(guild.roles.cache.get(row.autoRoleID)){
                member.roles.add(row.autoRoleID);
            }
        }
        if(row.welcomeMessage != null){
            const embed = new Discord.MessageEmbed()
            .addField(`Welcome to ${guild.name}!`, row.welcomeMessage)
            .setColor("GREEN");
            try{
                member.send({embeds: [embed]});
            }catch(e){
                console.log("Tried sending welcome message to the user, but it was not successful");
            }
        }
    })
    
    const enabled = await common.getLogTypeState(guild.id, "usermigration");
    if(enabled){
        const logchannel = await common.getLogChannel(guild.id);
        if(logchannel){
            const embed = new Discord.MessageEmbed()
            .setAuthor(`${member.user.tag} joined the server`)
            .addField("Event Data", `**Date/Time**: ${df(new Date(), "dd/mm/yyyy HH:MM:ss Z")}\n**User Name/ID**: ${guild.members.resolve(member.id).toString()} (${member.id})\n**New Guild Size**: ${guild.memberCount}`)
            .setThumbnail(member.user.avatarURL())
            .setColor("DARK_GREEN")
            .setFooter("guildmemberadd.logs.valkyrie")
            .setTimestamp(new Date());
            logchannel.send({embeds: [embed]});
        }
    }
});

/**
* 'guildMemberRemove' - Called when a member leaves a guild.
* @param member - the member that left's object
*/
client.on("guildMemberRemove", async (member) => {
    const guild = member.guild;
    
    const enabled = await common.getLogTypeState(guild.id, "usermigration");
    if(enabled){
        const logchannel = await common.getLogChannel(guild.id);
        if(logchannel){
            const embed = new Discord.MessageEmbed()
            .setAuthor(`${member.user.tag} left the server`)
            .addField("Event Data", `**Date/Time**: ${df(new Date(), "dd/mm/yyyy HH:MM:ss Z")}\n**User Name/ID**: ${member.user.tag} (${member.id})\n**New Guild Size**: ${guild.memberCount}`)
            .setThumbnail(member.user.avatarURL())
            .setColor("DARK_RED")
            .setFooter("guildmemberremove.logs.valkyrie")
            .setTimestamp(new Date());
            logchannel.send({embeds: [embed]});
        }
    }
})

/**
* 'guildMemberUpdate' - called when a member updates
* @param oldMember - old member object
* @param newMember - new member object
*/
client.on("guildMemberUpdate", async (oldMember, newMember) =>{
    if(oldMember.partial) await oldMember.fetch();
    if(newMember.partial) await newMember.fetch();
    
    const guild = newMember.guild;
    const member = newMember;
    
    if((oldMember && newMember) && (oldMember.roles != newMember.roles)){
        const diff = oldMember.roles.cache.difference(newMember.roles.cache).first();
        if(!diff){ return }
        if(oldMember.roles.cache.has(diff.id) && !newMember.roles.cache.has(diff.id)){
            Dividers.findAll({where: {guildID: guild.id}}).then(dividers =>{
                dividers.forEach(divider => {
                    var topRole = guild.roles.resolve(divider.topRoleID);
                    var bottomRole = guild.roles.resolve(divider.bottomRoleID);
                    var dividerRole = guild.roles.resolve(divider.dividerRoleID);
                    if(diff.position >= bottomRole.position && diff.position <= topRole.position && !member.roles.cache.has(dividerRole)){
                        var search = false;
                        member.roles.cache.forEach(role => {
                            if(role.position >= bottomRole.position && role.position <= topRole.position){
                                search = true;
                            }
                        })
                        if(search == false){
                            member.roles.remove(dividerRole);
                        }
                    }
                })
            })
        }else if(!oldMember.roles.cache.has(diff.id) && newMember.roles.cache.has(diff.id)){
            Dividers.findAll({where: {guildID: guild.id}}).then(dividers =>{
                dividers.forEach(divider => {
                    var topRole = guild.roles.resolve(divider.topRoleID);
                    var bottomRole = guild.roles.resolve(divider.bottomRoleID);
                    var dividerRole = guild.roles.resolve(divider.dividerRoleID);
                    if(diff.position >= bottomRole.position && diff.position <= topRole.position && !member.roles.cache.has(dividerRole)){
                        member.roles.add(dividerRole);
                    }
                })
            })
        }
        
        const enabled = await common.getLogTypeState(guild.id, "messageedit");
        if(enabled == false){
            return;
        }
        const logchannel = await common.getLogChannel(guild.id);
        if(!logchannel){
            return;
        }else{
            const role = guild.roles.cache.get(diff.id)
            if(!role){
                return;
            }
            
            const embed = new Discord.MessageEmbed()
            .setAuthor(`${member.displayName}'s roles were updated`)
            .addField("Update Data", `**Date/Time**: ${df(new Date(), "dd/mm/yyyy HH:MM:ss Z")}\n**Creator Name/ID**: ${guild.members.resolve(member.id).toString()} (${member.id})\n`)
            .setColor("LUMINOUS_VIVID_PINK")
            .setFooter("roles.guildmemberupdate.logs.valkyrie")
            .setTimestamp(new Date());
            
            if(oldMember.roles.cache.has(role.id) && !newMember.roles.cache.has(role.id)){
                embed.addField("Role Removed", role.toString())
            }else if(!oldMember.roles.cache.has(role.id) && newMember.roles.cache.has(role.id)){
                embed.addField("Role Added", role.toString())
            }
            
            logchannel.send({embeds: [embed]});
        }
    }
})

/**
* voiceStateUpdate - Called when the voice state event is fired 
* @param oldState - the old state
* @param newState - the new state
*/
client.on("voiceStateUpdate", async(oldState, newState) =>{
    if(oldState.channel == newState.channel) return;
    
    const guild = newState.guild;
    const member = newState.member;
    
    const enabled = await common.getLogTypeState(guild.id, "messageedit");
    if(enabled == true){
        const logchannel = await common.getLogChannel(guild.id);
        if(logchannel){
            const embed = new Discord.MessageEmbed()
            .setAuthor(`${member.displayName}'s voice state was updated`)
            .addField("Voice State Data", `**Date/Time**: ${df(new Date(), "dd/mm/yyyy HH:MM:ss Z")}\n**Creator Name/ID**: ${guild.members.resolve(member.id).toString()} (${member.id})\n`)
            .setColor("AQUA")
            .setFooter("voicestateupdate.logs.valkyrie")
            .setTimestamp(new Date());
            
            if(!oldState.channel && newState.channel){ //If a member joins a channel for the first time
                embed.addField("Member Joined Channel", `**${newState.channel.name}**`)
            }else if((oldState.channel != newState.channel) && (oldState.channel && newState.channel)){ //If a member changes channel
                embed.addField("Member Moved Channel", `From **${oldState.channel.name}** to **${newState.channel.name}**`)
            }else if(!newState.channel){ //If a member disconnects from voice entirely
                embed.addField("Member Left Channel", `**${oldState.channel.name}**`)
            }
            logchannel.send({embeds: [embed]});
        }
    }
    
    if(!oldState.channel && newState.channel){ //If a member joins a channel for the first time
        await checkHubThenCreate(newState);
    }else if((oldState.channel != newState.channel) && (oldState.channel && newState.channel)){ //If a member changes channel
        await checkHubThenCreate(newState);
        await checkLobbyThenDelete(oldState);
    }else if(!newState.channel){ //If a member disconnects from voice entirely
        await checkLobbyThenDelete(oldState);
    }
    
});

/**========================
* SUPPLEMENTARY FUNCTIONS
=========================*/

/**
* checkHubThenCreate - checks if the voice channel joined is a hub channel (and if the user already has a lobby made)
* According to this check, create a new lobby and move the user
* @param {*} newState 
*/
async function checkHubThenCreate(newState){
    var member = newState.member;
    var guild = newState.guild;
    await LobbyHubs.findOne({where: {[Op.and]: [{guildID: guild.id},{lobbyID: newState.channel.id}]}}).then(async lobbyhub =>{
        if(lobbyhub){
            await Lobbies.findOne({where: {[Op.and]: [{guildID: guild.id},{creatorID: member.id}]}}).then(async lobby =>{
                if(lobby){
                    var userLobby = guild.channels.cache.get(lobby.lobbyID);
                    await member.edit({
                        channel: userLobby
                    });
                }else{
                    var lobbyChannelParent = guild.channels.cache.get(lobbyhub.lobbyHubParentID);
                    guild.channels.create(`${member.displayName}'s Lobby`, {
                        type: "voice",
                        parent: lobbyChannelParent
                    }).then(async newLobby =>{
                        Lobbies.create({
                            guildID: guild.id,
                            lobbyID: newLobby.id,
                            lobbySize: null,
                            lobbyLocked: false,
                            creatorID: member.id
                        }).catch(e =>{
                            return console.error(e);
                        })
                        
                        member.edit({
                            channel: newLobby
                        });
                    })
                }
            })
        }else{
            return;
        }
    })
}
/**
* checkLobbyThenDelete - deletes the lobby if it is empty
* @param {*} oldState 
*/
async function checkLobbyThenDelete(oldState){
    var guild = oldState.guild;
    Lobbies.findOne({where: {[Op.and]: [{guildID: guild.id},{lobbyID: oldState.channel.id}]}}).then(lobby =>{
        if(lobby){
            var lobbyChannel = guild.channels.cache.get(lobby.lobbyID);
            if(lobbyChannel.members.size == 0){
                lobbyChannel.delete();
                lobby.destroy();
            }
        }
    })
}

//Client Log In
client.login(sysConfig.token);

//Handle unhandled rejections
process.on("unhandledRejection", err => {
    console.error(err);
});