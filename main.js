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
    intents: ["GUILDS", "GUILD_MEMBERS", "GUILD_PRESENCES", "GUILD_EMOJIS", "GUILD_MESSAGE_REACTIONS", "GUILD_BANS", "GUILD_VOICE_STATES", "GUILD_MESSAGES", "GUILD_MESSAGE_TYPING"]
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
const Warns = sequelize.define("Warns", {
    guildID: {
        type: DataTypes.STRING,
        allowNull: false
    },
    memberID: {
        type: DataTypes.STRING,
        allowNull: false
    },
    moderatorID: {
        type: DataTypes.STRING
    },
    reason: {
        type: DataTypes.STRING
    }
});
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
exports.getWarnsTable = () =>{
    return Warns;
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
//Client Getter
exports.getClient = () =>{
    return client;
}

//Automated/Frquent Functions
client.setInterval(async () => {
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
    await Warns.sync();
    await Tags.sync();
    await Lobbies.sync();
    await LobbyHubs.sync();

    //Set Presence
    client.user.setPresence({ activity: { name: `Ver: ${package.version}` }, status: 'online' });
    
    //Register Global Commands
    const cmds = await client.application.commands.set(commands);
    console.log(cmds)
    /* for(var command in commands){
        console.log(`Registering command ${commands[command].name}...`)
        await client.application.commands.create(commands[command]).then(newCommand => {
            console.log(`Registered new command ${commands[command].name} successfully.`)
        }).catch(e => {console.error(e)});
    } */

    /*var testguild = client.guilds.cache.get("409365548766461952");
    testguild.commands.fetch().then(cmds =>{
        cmds.forEach(ccmds =>{
            console.log(`${ccmds.name}, ${ccmds.id}`);
        });
    });*/
    
});

/**
 * 'interactionCreate' - Called when a user runs a slash-command.
 * @param interaction - The interaction object from the API
 */
client.on("interaction", (interaction) =>{
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
        ownerID: guild.ownerID
    }).then( () =>{
        console.log(`Joined Guild ${guild.name} (${guild.id}) successfully.`);
        client.guilds.fetch("409365548766461952").then(devGuild => {
            devGuild.channels.resolve("742885805449805945").send(`I joined a new server! Name: ${guild.name}, ID: ${guild.id}, Owner: <@${guild.ownerID}>`);
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
                    color: "RED"
                },
                reason: "Automatically created a Muted Role. If you have one already, please edit the config file to point to that role. Else, feel free to edit this role however you please."
            }).then(newMutedRole => {
                Configs.update({mutedRoleID: newMutedRole.id}, {where:{guildID: guild.id}})
            })
        }catch(e){
            mutedRoleExists = false;
            console.log(e);
            //return channel.send("Code 120 - Bot has insufficient Permissions to Create a Role.");
        }
    }else{
        Configs.update({mutedRoleID: mutedRole.id}, {where:{guildID: guild.id}}).catch(e => {
            console.log(e);
            //return channel.send("Code 110 - Unknown Error with Database.");
        })
    }

    var logChannel = guild.channels.cache.find(c => c.name.toLowerCase === "logchannel");
    if(!logChannel){
        try{
            guild.channels.create("logchannel", {
                type: "text",
                topic: "Log channel for Valkyrie"
            }).then(newLogChannel => {
                Configs.update({logChannelID: newLogChannel.id}, {where: {guildID: guild.id}}).catch(e=>{
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
        Configs.update({logChannelID: logChannel.id}, {where:{guildID: guild.id}}).catch(e => {
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
    }else{
        embed.addField("I automatically created/found an existing mute role", "Feel free to edit the name, position or permissions however you want!");
    }
    if(logChannelExists == false){
        embed.addField("I couldn't find or create a log channel", "If you already have one, use `/config logchannel` to change the server config");
    }else{
        embed.addField("I automatically created/found an existing log channel", "Feel free to edit the name, position or permissions however you want!");
    }

    guild.members.fetch(guild.ownerID).then(guildOwner =>{
        guildOwner.send({embed})
    });
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
 * 'guildMemberAdd' - Called when a member joins a guild.
 * @param member - the member that joined's object
 */
client.on("guildMemberAdd", member => {
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
                member.send({embed});
            }catch(e){
                console.log("Tried sending welcome message to the user, but it was not successful");
            }
        }
    })
});

/**
 * voiceStateUpdate - Called when the voice state event is fired 
 * @param oldState - the old state
 * @param newState - the new state
 */
client.on("voiceStateUpdate", async(oldState, newState) =>{
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