//Dependencies
const Discord = require("discord.js");
const interactions = require("discord-slash-commands-client");
const { Sequelize, DataTypes, Op } = require("sequelize");
const ms = require("ms");

//File Loads
const sysConfig = require("./store/config.json");
const common = require("./util/commonFuncs.js");
const logs = require("./util/logFunctions.js");

//Globals
const client = new Discord.Client();
    client.interactions = new interactions.Client(
        sysConfig.token,
        "789655175048331283"
    );
const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "./store/database.db",
    define: {
        freezeTableName: true
    }
});
const commands = client.interactions;

//Database Definitions and Loading
const Configs = sequelize.define("Configs", {
    guildID: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
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
})
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
})

//Automated unmute handling
client.setInterval(async () => {
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

    //FooBar Command
    commands.createCommand({
        name: "foo",
        description: "Replies 'Bar!'"
    }, "409365548766461952").then(newCommand => {console.log("Created Command"); common.printCommand(newCommand)});
    //PingPong Command
    commands.createCommand({
        name: "ping",
        description: "Replies 'Pong!'"
    }, "409365548766461952").then(newCommand => {console.log("Created Command"); common.printCommand(newCommand)});
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
    }, "409365548766461952").then(newCommand => {console.log("Created Command"); common.printCommand(newCommand)});
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
    }, "409365548766461952").then(newCommand => {console.log("Created Command"); common.printCommand(newCommand)});
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
    }, "409365548766461952").then(newCommand => {console.log("Created Command"); common.printCommand(newCommand)});
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
    }, "409365548766461952").then(newCommand => {console.log("Created Command"); common.printCommand(newCommand)});
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

    if(interaction.name == "foo"){
        interaction.channel.send("Bar!");
    }
    else if(interaction.name == "ban"){
        if(args == null){
            return channel.send("Code 101 - No Arguments Supplied.");
        }else if(member.hasPermission("BAN_MEMBERS") == false){
            return channel.send("Code 102 - Invalid Permissions.")
        }else{
            var targetID = args[0].options[0].value;

            var reason = args[0].options[1];
            if(!args[0].options[1]){
                reason = "No Reason Specified";
            }else{
                reason = reason.value;
            }
            guild.members.fetch(targetID).then(targetMember =>{
                if(targetMember.bannable){
                    targetMember.ban({days: 7, reason: reason});
                    channel.send(`User ${targetMember.displayName} was banned from the server. Reason: ${reason}. <:banhammer:722877640201076775>`)
                }else{
                    return channel.send("Code 100 - Unknown Error Occurred.")
                }
            }); 
        }
    }
    else if(interaction.name == "kick"){
        if(args == null){
            return channel.send("Code 101 - No Arguments Supplied.");
        }else if(member.hasPermission("KICK_MEMBERS") == false){
            return channel.send("Code 102 - Invalid Permissions.")
        }else{
            var targetID = args[0].options[0].value;

            var reason = args[0].options[1];
            if(!args[0].options[1]){
                reason = "No Reason Specified";
            }else{
                reason = reason.value;
            }
            guild.members.fetch(targetID).then(targetMember =>{
                if(targetMember.kickable){
                    targetMember.kick(reason);
                    channel.send(`User ${targetMember.displayName} was kicked from the server. Reason: ${reason}.`)
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
            return channel.send("Code 102 - Invalid Permissions.")
        }else{
            var targetID;
            var duration = -1;
            var reason = "No Reason Specified";
            args[0].options.forEach(arg => {
                if(arg.name == "mention" || arg.name == "userid"){
                    targetID = arg.value
                }else if(arg.name == "duration"){
                    duration = arg.value
                }else if(arg.name == "reason"){
                    reason = arg.value
                }
            });

            console.log(targetID)
            console.log(duration)
            console.log(reason)

            var endsTimestamp = Date.now() + ms(duration);

            Configs.findOne({where: {guildID: guild.id}}).then(guildConfig =>{
                var mutedRole = guild.roles.cache.get(guildConfig.mutedRoleID);
                guild.members.fetch(targetID).then(targetMember =>{
                    targetMember.roles.add(mutedRole).then(newMember =>{
                        channel.send(`**${newMember.displayName}** has been muted for **${duration}**. Reason: **${reason}**.`);
                        newMember.send(`You have been Muted in **${guild.name}** for **${duration}**. Reason: **${reason}**.`);
                        guild.channels.resolve(guildConfig.logChannelID).send(logs.logMute(targetMember, duration, reason));
                        Mutes.create({
                            guildID: guild.id,
                            memberID: targetID,
                            endsAt: endsTimestamp,
                            reason: reason
                        }).catch(console.log);
                    }).catch(console.log);
                }).catch(console.log);
            }).catch(console.log);
        }
    }
    else if(interaction.name == "unmute"){
        if(args == null){
            return channel.send("Code 101 - No Arguments Supplied.");
        }else if(member.hasPermission("MANAGE_MESSAGES") == false){
            return channel.send("Code 102 - Invalid Permissions.")
        }else{
            var targetID;
            args[0].options.forEach(arg => {
                if(arg.name == "mention" || arg.name == "userid"){
                    targetID = arg.value
                }
            });

            Configs.findOne({where: {guildID: guild.id}}).then(guildConfig =>{
                var mutedRole = guild.roles.cache.get(guildConfig.mutedRoleID);
                guild.members.fetch(targetID).then(targetMember =>{
                    targetMember.roles.remove(mutedRole).then(newMember =>{
                        Mutes.findOne({where: {memberID: targetID}}).then(row =>{
                            row.destroy();
                        }).catch(console.log);
                    }).catch(console.log);
                }).catch(console.log);
            }).catch(console.log);
        }
    }
});

/**
 * 'guildCreate' - Called when joining a new Guild
 * @param guild - The guild object from the API
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
        Configs.update({mutedRoleID: mutedRole.id}, {where:{guildID: guild.id}})
    }
})
//Client Log In
client.login(sysConfig.token);