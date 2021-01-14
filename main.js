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
const client = new Discord.Client({partials: ["MESSAGE", "REACTION"]});
    client.interactions = new interactions.Client(
        sysConfig.token,
        sysConfig.botID
    );
const commands = client.interactions;
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
const Warns = sequelize.define("Mutes", {
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

//Client Getter
exports.getClient = () =>{
    return client;
}

//Automated/Frquent Functions
client.setInterval(async () => {
    //Automated Umute Handling
    Mutes.findAll({where: {endsAt: {[Op.and]: [{[Op.lte]: Date.now(), [Op.ne]: "-1"}]}}}).then(rows =>{
        rows.forEach(row => {
            client.guilds.fetch(row.guildID).then(rGuild =>{
                rGuild.members.fetch(row.memberID).then(rMember =>{
                    Configs.findOne({where: {guildID: rGuild.id}}).then(guildConfig =>{
                        var mutedRole = rGuild.roles.cache.get(guildConfig.mutedRoleID)
                        if(rMember.roles.cache.has(mutedRole.id)){
                            rMember.roles.remove(mutedRole);
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
    await ReactionRoles.sync();
    await Mutes.sync();

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
    //ReactRoles command
    commands.createCommand({
        name: "reactrole",
        description: "Create, modify and delete reaction roles",
        options: [
            {
                name: "init",
                description: "Initialize a React Role 'Base' Message",
                type: 1,
                options: [
                    {
                        name: "channel",
                        description: "The channel to initialize the Base Message",
                        type: 7,
                        required: true,
                    },
                    {
                        name: "message",
                        description: "The text you want the Base Message to display",
                        type: 3
                    }
                ]
            },
            {
                name: "add",
                description: "Add a reaction to an initialized Base Message.",
                type: 1,
                options: [
                    {
                        name: "messageID",
                        description: "The ID of the pre-initialized Base Message to add to",
                        type: 3,
                        required: true,
                    },
                    {
                        name: "reactionEmoji",
                        description: "The emoji you wish to add",
                        type: 3,
                        required: true
                    },
                    {
                        name: "role",
                        description: "The role you want to associate with this emoji",
                        type: 8,
                        required: true
                    }
                ]
            },
            {
                name: "delete",
                description: "Delete a Base Message",
                type: 1,
                options: [
                    {
                        name: "messageID",
                        description: "The ID of the Base Message you want to delete",
                        type: 3,
                        required: true
                    }
                ]
            }
        ]
    }).then(newCommand => {console.log("Created Command"); common.printCommand(newCommand)});
    //Warn Command
    commands.createCommand({
        name: "warn",
        description: "Warns a Member.",
        options: [
            {
                name: "user",
                description: "Warn a user by User ID",
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
                        description: "The reason for their warn",
                        type: 3
                    }
                ]
            },
            {
                name: "mention",
                description: "Warn a user my mention",
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
                        description: "The reason for their warn",
                        type: 3
                    }
                ]
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
    var cmdFile = require(`./commands/${interaction.name}.js`);
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
    }else{
        return;
    }
});

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
                console.log(`Added ${role.name} to ${member.user.tag}`);
            })
        }catch(e){
            console.log(e);
        }
    })
})

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
                console.log(`Removed ${role.name} from ${member.user.tag}`);
            })
        }catch(e){
            console.log(e);
        }
    })
})

//Client Log In
client.login(sysConfig.token);

//Handle unhandled rejections
process.on("unhandledRejection", err => {
    console.error(`An Unhandled Rejection occured. File: ${err.fileName}\nFull Error: ${err}`);
});