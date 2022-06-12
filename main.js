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
const { MessageActionRow } = require("discord.js");
const { MessageSelectMenu } = require("discord.js");

//Globals
const client = new Discord.Client({
    partials: ["MESSAGE", "REACTION", "CHANNEL"],
    intents: ["GUILDS", "GUILD_MEMBERS", "GUILD_PRESENCES", "GUILD_EMOJIS_AND_STICKERS", "GUILD_MESSAGE_REACTIONS", "GUILD_BANS", "GUILD_VOICE_STATES", "GUILD_MESSAGES", "GUILD_MESSAGE_TYPING", "DIRECT_MESSAGES"]
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
    modmailEnabled: {
        type: DataTypes.BOOLEAN
    },
    modmailCategory: {
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
    keyEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    }
})
const ReactionRolesOptions = sequelize.define("ReactionRolesOptions", {
    baseMessageID: {
        type: DataTypes.STRING,
        allowNull: false
    },
    customEmoji: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    emoji: {
        type: DataTypes.STRING,
        allowNull: false
    },
    roleID: {
        type: DataTypes.STRING,
        allowNull: false
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
const LFGroups = sequelize.define("LFGroups", {
    groupID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    guildID: {
        type: DataTypes.STRING,
        allowNull: false
    },
    messageID: {
        type: DataTypes.STRING,
        allowNull: false
    },
    channelID: {
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
    time: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false
    },
    groupSize: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    pingRole: {
        type: DataTypes.STRING,
        allowNull: true
    },
    notified: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    }
})
const LFGParticipants = sequelize.define("LFGParticipants", {
    participantID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    messageID: {
        type: DataTypes.STRING,
        allowNull: false
    },
    memberID: {
        type: DataTypes.STRING,
        allowNull: false
    },
    commitmentType: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
})
const Timeouts = sequelize.define("Timeouts", {
    guildID: {
        type: DataTypes.STRING,
        allowNull: false
    },
    memberID: {
        type: DataTypes.STRING,
        allowNull: false
    },
    moderatorID: {
        type: DataTypes.STRING,
        allowNull: false
    },
    duration: {
        type: DataTypes.STRING,
        allowNull: false
    },
    reason: {
        type: DataTypes.STRING,
        allowNull: false
    }
})
const Polls = sequelize.define("Polls", {
    pollID: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
        autoIncrement: false
    },
    channelID: {
        type: DataTypes.STRING,
        allowNull: false
    },
    creatorID: {
        type: DataTypes.STRING,
        allowNull: false
    },
    subject: {
        type: DataTypes.STRING,
        allowNull: false
    },
    anonymizeResults: {
        type: DataTypes.BOOLEAN
    },
    privateResults: {
        type: DataTypes.BOOLEAN
    }
})
const PollOptions = sequelize.define("PollOptions", {
    pollID: {
        type: DataTypes.STRING,
        allowNull: false
    },
    optionNumber: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    optionText: {
        type: DataTypes.STRING,
        allowNull: false
    }
})
const ModmailTickets = sequelize.define("ModmailTickets", {
    ticketID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    userID: {
        type: DataTypes.STRING,
        allowNull: false
    },
    guildID: {
        type: DataTypes.STRING,
        allowNull: false
    },
    channelID: {
        type: DataTypes.STRING,
        allowNull: false
    },
    open: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    archive: {
        type: DataTypes.STRING
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
exports.getReactionRolesOptionsTable = () =>{
    return ReactionRolesOptions;
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
exports.getLFGroupsTable = () =>{
    return LFGroups;
}
exports.getLFGParticipantsTable = () =>{
    return LFGParticipants;
}
exports.getTimeoutsTable = () => {
    return Timeouts;
}
exports.getPollsTable = () => {
    return Polls;
}
exports.getPollOptionsTable = () => {
    return PollOptions;
}
exports.getModmailTicketsTable = () => {
    return ModmailTickets;
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

    //LFG Group checks
    LFGroups.findAll().then(groups => {
        if(groups.length > 0){
            groups.forEach(group => {
                if(group.notified == false){
                    if(group.time - 600 < Date.now().valueOf()/1000 && Date.now().valueOf()/1000 < group.time){
                        const lfgGuild = client.guilds.resolve(group.guildID);
                        if(!lfgGuild){
                            console.log(`LFG Guild ${group.guildID} does not exist. Deleting record...`);
                            LFGParticipants.findAll({where: {messageID: group.messageID}}).then(participants => {
                                participants.forEach(part => {
                                    part.destroy();
                                })
                            })
                            return group.destroy();
                        }

                        const lfgChannel = lfgGuild.channels.resolve(group.channelID);
                        if(!lfgChannel){
                            console.log(`LFG Channel ${group.channelID} does not exist. Deleting record...`);
                            LFGParticipants.findAll({where: {messageID: group.messageID}}).then(participants => {
                                participants.forEach(part => {
                                    part.destroy();
                                })
                            })
                            return group.destroy();
                        }

                        const lfgMessage = lfgChannel.messages.fetch(group.messageID).catch(err => { 
                            console.log(`LFG Message ${group.messageID} does not exist. Deleting record...`);
                            LFGParticipants.findAll({where: {messageID: group.messageID}}).then(participants => {
                                participants.forEach(part => {
                                    part.destroy();
                                })
                            })
                            return group.destroy();
                        });

                        LFGParticipants.findAll({where: {messageID: group.messageID}}).then(participants => {
                            if(participants.length > 0){
                                participants.forEach(participant => {
                                    const lfgParticipant = lfgGuild.members.resolve(participant.memberID);
                                    if(!lfgParticipant){ console.log(`LFG Participant ${participant.memberID} does not exist. Deleting record...`); participant.destroy(); }
                                    
                                    try{
                                        lfgParticipant.send(`Hello! You're receiving this notification because you've signed up for the event **${group.name}** in **${lfgGuild.name}**, which is scheduled to start in ~10 minutes.`);
                                    }catch(err){
                                        console.log(`Could not send LFG reminder message to user ${lfgParticipant.tag} - see error below`);
                                        console.error(err);
                                    }                   
                                })
                            }
                        })
                        LFGroups.update({notified: true}, {where: {messageID: group.messageID}});
                    }else if(Date.now().valueOf()/1000 > group.time + 300){
                        const lfgGuild = client.guilds.resolve(group.guildID);
                        if(lfgGuild){
                            const lfgChannel = lfgGuild.channels.resolve(group.channelID);
                            if(lfgChannel){
                                lfgChannel.messages.fetch(group.messageID).then(msg => {
                                    msg.delete();
                                }).catch(err => { 
                                    console.log(`LFG Message ${group.messageID} does not exist. Deleting record...`);
                                }); 
                            }
                        }
                        LFGParticipants.findAll({where: {messageID: group.messageID}}).then(participants => {
                            if(participants.length > 0){
                                participants.forEach(participant => {
                                    participant.destroy();              
                                })
                            }
                        })
                        LFGroups.update({notified: true}, {where: {messageID: group.messageID}});
                        return group.destroy();
                    }
                }
            });
        }
    })
}, 2000);

/**==============
* Event Handlers
==============*/

/**
* 'ready' event - Called when bot is connected to the API.
*/
client.on("ready", async () =>{
    console.log("[VALKYRIE] Bot Loaded.");
    
    //Sync Database Tables
    await Configs.sync();
    await Mutes.sync();
    await Users.sync();
    await GuildUsers.sync();
    await ReactionRoles.sync();
    await ReactionRolesOptions.sync();
    await Mutes.sync();
    await Tags.sync();
    await Lobbies.sync();
    await LobbyHubs.sync();
    await Infractions.sync();
    await Dividers.sync();
    await Blacklists.sync();
    await BlacklistExemptions.sync();
    await LFGroups.sync();
    await LFGParticipants.sync();
    await Timeouts.sync();
    await Polls.sync();
    await PollOptions.sync();
    await ModmailTickets.sync();

    console.log("[VALKYRIE] Tables Loaded.")
    
    //Set Presence
    //client.user.setPresence({ activity: { name: `Ver: ${package.version}` }, status: 'online' });
    client.user.setActivity(`Ver ${package.version} | Serving > ${client.users.cache.size} members on > ${client.guilds.cache.size} guilds`, {type: "PLAYING"})
    
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
    if(interaction.isCommand()){
        if(interaction.channel.type == "DM"){
            return interaction.reply({content: "Commands are not accepted via DMs.", ephemeral: true});
        }
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
    }else if(interaction.isButton()){
        //console.log(interaction)
        if(interaction.customId == "lfgJoin"){
            LFGroups.findOne({where: {messageID: interaction.message.id}}).then(group => {
                LFGParticipants.findOne({where: {[Op.and]: [{messageID: group.messageID},{memberID: interaction.user.id}]}}).then(participant => {
                    LFGParticipants.findAll({where: {[Op.and]: [{messageID: group.messageID}, {commitmentType: 0}]}}).then(allParticipants => {     
                        var currentSize = allParticipants.length;
                        var maxSize = group.groupSize;

                        if(currentSize == maxSize){
                            return interaction.reply({content: "This event is currently full. You can still register your interest as a Substitute player by clicking the 'Substitute' button.", ephemeral: true});
                        }

                        if(!participant){
                            LFGParticipants.create({
                                messageID: group.messageID,
                                memberID: interaction.user.id,
                                commitmentType: 0
                            }).then(() =>{    
                                var embed = interaction.message.embeds[0];
                                var participantsField = embed.fields.find(element => element.name.includes("Participants"));
                                var newParticipants;

                                currentSize++;
    
                                if(participantsField.value == "None" && participantsField.value.length == 4){
                                    newParticipants = [];
                                }else{
                                    newParticipants = participantsField.value.split(" | ");
                                }
    
                                newParticipants.push(interaction.user.tag)
    
                                var newField = {name: `Participants: ${currentSize}/${maxSize}`, value: newParticipants.join(" | "), inline: true}
    
                                embed.fields[embed.fields.indexOf(participantsField)] = newField;
    
                                return interaction.update({embeds: [embed]});
                                
                                
                            })
                        }else{
                            return interaction.reply({content: "You have already signed up for this event!", ephemeral: true});
                        }
                    });
                })
            });
        }else if(interaction.customId == "lfgLeave"){
            LFGroups.findOne({where: {messageID: interaction.message.id}}).then(group => {
                LFGParticipants.findOne({where: {[Op.and]: [{messageID: group.messageID},{memberID: interaction.user.id}]}}).then(participant => {
                    if(participant){
                        if(participant.commitmentType == 0){
                            participant.destroy();
                            LFGParticipants.findAll({where: {[Op.and]: [{messageID: group.messageID}, {commitmentType: 0}]}}).then(allParticipants => {
                                var currentSize = allParticipants.length;
                                var maxSize = group.groupSize;
        
                                var embed = interaction.message.embeds[0];
                                var participantsField = embed.fields.find(element => element.name.includes("Participants"));
    
                                var currentParticipants = participantsField.value.split(" | ")
    
                                var newParticipants = [];
                                currentParticipants.forEach(part => {
                                    if(!part.includes(interaction.user.tag)){
                                        newParticipants.push(part)
                                    }
                                })
    
                                if(newParticipants.length == 0){
                                    newParticipants = "None"
                                }else{
                                    newParticipants = newParticipants.join(" | ")
                                }
    
                                var newField = {name: `Participants: ${currentSize}/${maxSize}`, value: newParticipants, inline: true}
    
                                embed.fields[embed.fields.indexOf(participantsField)] = newField;
    
                                return interaction.update({embeds: [embed]});
                            })
                        }else{
                            participant.destroy();
                            LFGParticipants.findAll({where: {[Op.and]: [{messageID: group.messageID}, {commitmentType: 1}]}}).then(allSubstitutes => {
                                var embed = interaction.message.embeds[0];
                                var substitutesField = embed.fields.find(element => element.name.includes("Substitutes"));
    
                                var currentSubstitutes = substitutesField.value.split(" | ")
    
                                var newSubstitutes = [];
                                currentSubstitutes.forEach(part => {
                                    if(!part.includes(interaction.user.tag)){
                                        newSubstitutes.push(part)
                                    }
                                })
    
                                if(newSubstitutes.length == 0){
                                    newSubstitutes = "None"
                                }else{
                                    newSubstitutes = newSubstitutes.join(" | ")
                                }
    
                                var newField = {name: `Substitutes:`, value: newSubstitutes, inline: true}
    
                                embed.fields[embed.fields.indexOf(substitutesField)] = newField;
    
                                return interaction.update({embeds: [embed]});
                            })
                        }
                    }
                });
            });
        }else if(interaction.customId == "lfgSubstitute"){
            LFGroups.findOne({where: {messageID: interaction.message.id}}).then(group => {
                LFGParticipants.findOne({where: {[Op.and]: [{messageID: group.messageID},{memberID: interaction.user.id}]}}).then(participant => {
                    if(!participant){
                        LFGParticipants.create({
                            messageID: group.messageID,
                            memberID: interaction.user.id,
                            commitmentType: 1
                        }).then(() =>{
                            LFGParticipants.findAll({where: {messageID: group.messageID}}).then(allParticipants => {        
                                var embed = interaction.message.embeds[0];
                                var participantsField = embed.fields.find(element => element.name.includes("Participants"));
                                var substitutesField = embed.fields.find(element => element.name.includes("Substitutes"));
    
                                var newParticipants = [];
    
                                if(!substitutesField){
                                    newParticipants.push(interaction.user.tag)
                                    substitutesField = {name: "Substitutes:", value: newParticipants.join(" | "), inline: true}
                                    embed.spliceFields(embed.fields.indexOf(participantsField)+1, 0, substitutesField);
                                }else{
                                    if(substitutesField.value == "None" && substitutesField.value.length == 4){
                                        newParticipants = [];
                                    }else{
                                        newParticipants = substitutesField.value.split(" | ");
                                    }
    
                                    newParticipants.push(interaction.user.tag);
    
                                    var newField = {name: `Substitutes:`, value: newParticipants.join(" | "), inline: true}
                                    embed.fields[embed.fields.indexOf(substitutesField)] = newField;
                                }
    
                                return interaction.update({embeds: [embed]});
                            })
                        })
                    }else{
                        return interaction.reply({content: "You have already signed up for this event!", ephemeral: true});
                    }
                })
            });
        }
    }

    
});

/**
* 'guildCreate' - Called when joining a new Guild
* @param guild - The guild object from the API
*/
client.on("guildCreate", async (guild) =>{
    var mutedRoleExists = false;
    var logChannelExists = false;
    const embed = new Discord.MessageEmbed();
    
    Configs.create({
        guildID: guild.id,
        ownerID: guild.ownerId,
        logTypes: {
            usermigration: true,
            messagedelete: true,
            messagedeletebulk: true,
            messageedit: true,
            voicestate: true,
            rolechanges: true
        },
        modmailEnabled: false
    }).then( () =>{
        console.log(`Joined Guild ${guild.name} (${guild.id}) successfully.`);
        client.guilds.fetch("409365548766461952").then(devGuild => {
            devGuild.channels.resolve("742885805449805945").send(`I joined a new server! Name: ${guild.name}, ID: ${guild.id}, Owner: <@${guild.ownerId}>`);
        })
    }).catch(err => {
        if(err.name == "SequelizeUniqueConstraintError"){
            console.log(`Attempted to write new guild to database, but ID was already present - ID: ${guild.id}`);
        }else{
            console.error(err)
        }
    })
    
    var mutedRole = guild.roles.cache.find(r => r.name.toLowerCase() == "muted");
    //Find or Create a 'Muted' Role.
    if(!mutedRole){
        try{
            await guild.roles.create({
                name: "Muted",
                color: "RED",
                reason: "Automatically created a Muted Role. If you have one already, please use /config to point to that role. Else, feel free to edit this role however you please."
            }).then(async newMutedRole => {
                mutedRoleExists = true;
                await Configs.update({mutedRoleID: newMutedRole.id}, {where:{guildID: guild.id}}).then(() => {
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
        mutedRoleExists = true;
        await Configs.update({mutedRoleID: mutedRole.id}, {where:{guildID: guild.id}}).then(() => {
            embed.addField("I found an existing mute role", "You already had a role called 'Muted', so I set that as the role to apply when a member is muted.\nYou can edit this at any time with the command \`/config mutedrole\`");
        }).catch(e => {
            console.log(e);
            //return channel.send("Code 110 - Unknown Error with Database.");
        })
    }
    
    var logChannel = guild.channels.cache.find(c => c.name.toLowerCase() === "logchannel");
    if(!logChannel){
        try{
            await guild.channels.create("logchannel", {
                data: {
                    type: "GUILD_TEXT",
                    topic: "Log channel for Valkyrie",
                    reason: "Automatically created a Log Channel. If you have one already, please use /config to point to that channel. Else, feel free to edit this channel however you please."
                },
            }).then(async newLogChannel => {
                logChannelExists = true;
                await Configs.update({logChannelID: newLogChannel.id}, {where: {guildID: guild.id}}).then(() => {
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
        logChannelExists = true;
        await Configs.update({logChannelID: logChannel.id}, {where:{guildID: guild.id}}).then(() => {
            embed.addField("I found an existing log channel", "You already had a channel called #logchannel, so I set that as the destination for all my log features.\nYou can edit this at any time with the command \`/config logchannel\`");
        }).catch(e => {
            console.log(e);
            //return channel.send("Code 110 - Unknown Error with Database.");
        })
    }

    if(logChannelExists){
        logChannel = guild.channels.cache.find(c => c.name.toLowerCase() === "logchannel");
        client.channels.fetch("742734104419893322").then(statusUpdateChannel => {
            statusUpdateChannel.addFollower(logChannel.id, "Added automated Valkyrie Service Updates")
        }).catch(console.error);
    }
    
    embed.setColor("GREEN")
    embed.setTimestamp(Date.now())
    embed.setAuthor("Welcome to the Valkyrie family!")
    embed.addField("Support Discord", "Need help? Join https://discord.gg/NvqK5W9");
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
    if(message.channel.type === "GUILD_TEXT" && message.author.id != client.user.id){
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
                        var roleLength = tag.access.roles.length;
                        var memberLength = tag.access.members.length;
                        
                        if(tag.access.channels.includes(message.channel.id) || tag.access.channels.length == 0){
                            channelAccess = true;
                        }
                        
                        tag.access.roles.forEach(role =>{
                            if(message.member.roles.cache.has(role)){
                                roleAccess = true;
                                return;
                            }
                        });
                        
                        if(tag.access.members.includes(message.member.id)){
                            memberAccess = true;
                        }
                        
                        if(channelAccess && ((tag.access.roles.length == 0 && tag.access.members.length != 0 && memberAccess) || (tag.access.roles.length == 0 && tag.access.members.length == 0) || (tag.access.members.length == 0 && tag.access.roles.length != 0 && roleAccess) || (tag.access.roles.length != 0 && tag.access.members.length != 0 && memberAccess && roleAccess) || (roleAccess || memberAccess))){
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
    }else if(message.channel.type === "DM" && message.author.id != client.user.id){
        ModmailTickets.findOne({where: {[Op.and]: [{userID: message.author.id}, {open: true}]}}).then(async ticket => {
            var selectedGuild = null;
            var sharedGuilds = {};
            var enabledGuilds = [];
            await Configs.findAll({where: {modmailEnabled: true}}).then(configs => {
                configs.forEach(config => {
                    enabledGuilds.push(config.guildID)
                })
            })
            if(!ticket){
                var sharedGuilds = client.guilds.cache.filter(g => g.members.cache.has(message.author.id) && enabledGuilds.indexOf(g.id) != -1)
                if(sharedGuilds.size == 0){
                    return message.channel.send("Could not find a Guild to send your modmail request to - we do not share any common guilds!")
                }else if(sharedGuilds.size == 1){
                    selectedGuild = sharedGuilds.first()
                    message.reply(`Thank you for submitting a ticket. You are being connected to the staff team at **${selectedGuild.name}**. Please monitor here for any responses to your ticket.`)
                    doTicketCreate()
                }else{
                    var row = new MessageActionRow()
                        .addComponents(
                            new MessageSelectMenu()
                                .setCustomId("ModmailSelector")
                                .setPlaceholder("Select the relevant Guild from the list")
                        )  
                    sharedGuilds.forEach(sharedGuild => {
                        var newOption = {
                            label: sharedGuild.name,
                            value: sharedGuild.id
                        }
                        row.components[0].addOptions(newOption)
                    })
                    message.reply({content: "We are in more than one Mutual Guild! Please select the Guild from the list below, which will be used to route your request to the relevant staff team.", components: [row]}).then(selectionMessage => {
                        selectionMessage.awaitMessageComponent({componentType: "SELECT_MENU", time: 10000}).then(interaction => {
                            interaction.deferUpdate()
                            selectedGuild = client.guilds.resolve(interaction.values[0])
                            selectionMessage.edit({content: `You selected **${selectedGuild.name}** - thank you! Connecting you to the staff team there... Please monitor here for any responses to your ticket.`, components: []})

                            const embed = new Discord.MessageEmbed()
                                .setColor("BLUE")
                                .setDescription(`📤 ${message.author.toString()}: ${message.content}`)
                            message.channel.send({embeds: [embed]})

                            doTicketCreate()
                        }).catch(err => {
                            return selectionMessage.edit({content: `You did not select an option with the time limit (10 seconds). Please try again by sending a new message.`, components: []})
                        });
                    })
                }
                async function doTicketCreate(){
                    Configs.findOne({where: {guildID: selectedGuild.id}}).then(async config => {
                        var modmailCategory = await selectedGuild.channels.resolve(config.modmailCategory)
                        console.log(config)
                        if(!modmailCategory){
                            selectedGuild.fetchOwner().then(owner => {
                                //owner.send("Hi! A user created a modmail ticket, and although you have modmail enabled on your Guild (\`/config modmail enable\`), you didn't have a valid parent category set up. Therefore, I had to create one manually. This new category doesn't have any permissions set, so please set some at your earliest convenience if required. You can also change the parent category at any time using the command (\`/config modmail category\`). Thanks!")
                            })
                            await selectedGuild.channels.create("Modmail Tickets", {
                                type: "GUILD_CATEGORY"
                            }).then(async ncc => {
                                modmailCategory = ncc
                                await config.update({modmailCategory: ncc.id})
                            })
                        }
                        selectedGuild.channels.create(`${message.author.username}-${message.author.discriminator}`, {
                            parent: modmailCategory
                        }).then(ticketChannel => {
                            ModmailTickets.create({
                                userID: message.author.id,
                                guildID: selectedGuild.id,
                                channelID: ticketChannel.id,
                                open: true,
                                archive: null
                            })
                            if(message.attachments.size != 0){
                                message.attachments.forEach(attachment => {
                                    if(attachment.contentType != "image/png" && attachment.contentType != "image/jpeg" && attachment.contentType != "image/gif" && attachment.contentType != "video/mp4" && attachment.contentType != "video/quicktime" && attachment.contentType != "text/plain"){
                                        message.reply("I was unable to send that attachment as it is an unaccepted type - Please only send .png, .jpeg, .gif, .mp4, .mov or .txt files.")
                                    }else{
                                        attachments.push({attachment: attachment.url, name: attachment.name, description: "A modmail attachment"})
                                    }
                                })
                            }
                            selectedGuild.members.fetch(message.author.id).then(guildMember => {
                                const embed = new Discord.MessageEmbed()
                                    .setColor("BLUE")
                                    .setDescription(`📥 ${guildMember.toString()}: ${message.content}`)
                                ticketChannel.send({files: attachments, embeds: [embed]})
                            })
                        })
                    })
                }
            }else{
                var ticketGuild = client.guilds.resolve(ticket.guildID)
                if(!ticketGuild){
                    ticket.destroy()
                    //Cleanup
                }
                var ticketChannel = ticketGuild.channels.resolve(ticket.channelID)
                if(!ticketChannel){
                    ticket.destroy()
                    //cleanup
                }else{
                    var attachments = []
                    if(message.attachments.size != 0){
                        message.attachments.forEach(attachment => {
                            if(attachment.contentType != "image/png" && attachment.contentType != "image/jpeg" && attachment.contentType != "image/gif" && attachment.contentType != "video/mp4" && attachment.contentType != "video/quicktime" && attachment.contentType != "text/plain"){
                                message.reply("I was unable to send that attachment as it is an unaccepted type - Please only send .png, .jpeg, .gif, .mp4, .mov or .txt files.")
                            }else{
                                attachments.push({attachment: attachment.url, name: attachment.name, description: "A modmail attachment"})
                            }
                        })
                    }
                    ticketGuild.members.fetch(message.author.id).then(guildMember => {
                        const embed = new Discord.MessageEmbed()
                            .setColor("BLUE")
                            .setDescription(`📥 ${guildMember.toString()}: ${message.content}`)
                        ticketChannel.send({files: attachments, embeds: [embed]})
                    })
                }
            }
        })
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
    var guild = message.guild;
    var emoji = messageReaction.emoji.id ? messageReaction.emoji.id : messageReaction.emoji.name;
    
    ReactionRolesOptions.findOne({where: {[Op.and]: [{baseMessageID: message.id}, {emoji: emoji}]}}).then(rrOption => {
        if(rrOption){
            var role = guild.roles.resolve(rrOption.roleID)
            if(role){
                message.guild.members.fetch(user.id).then(member => {
                    member.roles.add(role)
                })
            }
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
    var guild = message.guild;
    var emoji = messageReaction.emoji.id ? messageReaction.emoji.id : messageReaction.emoji.name;
    
    ReactionRolesOptions.findOne({where: {[Op.and]: [{baseMessageID: message.id}, {emoji: emoji}]}}).then(rrOption => {
        if(rrOption){
            var role = guild.roles.resolve(rrOption.roleID)
            if(role){
                message.guild.members.fetch(user.id).then(member => {
                    member.roles.remove(role)
                })
            }
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

        const eventCreator = await guild.members.resolve(member.id).toString();
        const embed = new Discord.MessageEmbed()
            .setAuthor(`${member.displayName}'s message was deleted`)
            .addField("Message Data", `**Date/Time**: ${df(message.createdTimestamp, "dd/mm/yyyy HH:MM:ss Z")}\n**Author Name/ID**: ${eventCreator} (${member.id})\n`)
            .setColor("RED")
            .setFooter("messagedelete.logs.valkyrie")
            .setTimestamp(new Date());
        
        if(message.content){
            embed.addField("Message Content", message.content)
        }
        if(attachments.length != 0){
            embed.addField("Message Attachment URLs", attachments.join("\n"))
        }
        
        return logchannel.send({embeds: [embed]});
    }
});

client.on("messageDeleteBulk", async (messages) => {
    const guild = messages.first().guild;
    const channel = messages.first().channel;
    const { MultiEmbed, MultiEmbedPage } = require("./util/classes");

    const enabled = await common.getLogTypeState(guild.id, "messagedeletebulk");
    if(enabled == false){
        return;
    }

    const logchannel = await common.getLogChannel(guild.id);
    if(!logchannel){ return; }

    var multiEmbed = new MultiEmbed(2)
            .setAuthor("Bulk Delete Event")
            .setFooter("messagedeletebulk.logs.valkyrie");
    
    await messages.forEach(async message => {
        var attachments = [];
        if(message.attachments.size != 0){
            message.attachments.each(attachment => {
                attachments.push(attachment.proxyURL)
            })
        }

        const eventCreator = await guild.members.resolve(message.member.id).toString();
        var pageFields = [];
        const messageData = {name: "Message Data", value: `**Date/Time**: ${df(message.createdTimestamp, "dd/mm/yyyy HH:MM:ss Z")}\n**Author Name/ID**: ${eventCreator} (${message.member.id})\n`, inline: false}
        pageFields.push(messageData);

        var messageContent, messageAttachments;
        if(message.content){
            messageContent = {name: "Message Content", value: message.content, inline: false}
            pageFields.push(messageContent)
        }
        if(attachments.length != 0){
            messageAttachments = {name: "Message Attachments", value: attachments.join("\n"), inline: false}
            pageFields.push(messageAttachments)
        }

        multiEmbed.addPage(new MultiEmbedPage(pageFields));
    })

    const embed = multiEmbed.render();
    logchannel.send(embed).then(async msg => {
        const collector = msg.createMessageComponentCollector({ time: 120000 });

        collector.on("collect", async i => {
            if(i.customId == "previous"){
                await i.deferUpdate();
                const previousPage = multiEmbed.previousPage();
                i.editReply(previousPage);
            }else if(i.customId == "next"){
                await i.deferUpdate();
                const nextPage = multiEmbed.nextPage();
                i.editReply(nextPage);
            }else if(i.customId == "end"){
                collector.stop();
            }
        })

        collector.on("end", collected => {
            const finalPage = multiEmbed.finalRender(`${multiEmbed.pages.length} messages were deleted`);
            msg.edit(finalPage)
            console.log(`BulkDelete Collection Ended. Collected ${collected.size} events.`);
        })
    }).catch(console.error);
})

/**
* 'messageUpdate' - Called when a message is edited
* @param oldMessage - old message object
* @param newMessage - new message object
*/
client.on("messageUpdate", async (oldMessage, newMessage) =>{
    if(newMessage.channel.type == "DM"){return;}
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
            const eventCreator = await guild.members.resolve(member.id).toString();
            const embed = new Discord.MessageEmbed()
            .setAuthor(`${member.displayName}'s message was edited`)
            .addField("Message Data", `**Date/Time**: ${df(oldMessage.createdTimestamp, "dd/mm/yyyy HH:MM:ss Z")}\n**Author Name/ID**: ${eventCreator} (${member.id})\n`)
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
        const eventCreator = await guild.members.resolve(member.id).toString();
        if(logchannel){
            const embed = new Discord.MessageEmbed()
            .setAuthor(`${member.user.tag} joined the server`)
            .addField("Event Data", `**Date/Time**: ${df(new Date(), "dd/mm/yyyy HH:MM:ss Z")}\n**User Name/ID**: ${eventCreator} (${member.id})\n**New Guild Size**: ${guild.memberCount}`)
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
    if(member.id == client.user.id){ return; }

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
            
            const eventCreator = await guild.members.resolve(member.id).toString();

            const embed = new Discord.MessageEmbed()
            .setAuthor(`${member.displayName}'s roles were updated`)
            .addField("Update Data", `**Date/Time**: ${df(new Date(), "dd/mm/yyyy HH:MM:ss Z")}\n**Member Name/ID**: ${eventCreator} (${member.id})\n`)
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
        const eventCreator = await guild.members.resolve(member.id).toString();
        if(logchannel){
            const embed = new Discord.MessageEmbed()
            .setAuthor(`${member.displayName}'s voice state was updated`)
            .addField("Voice State Data", `**Date/Time**: ${df(new Date(), "dd/mm/yyyy HH:MM:ss Z")}\n**Member Name/ID**: ${eventCreator} (${member.id})\n`)
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
                        type: "GUILD_VOICE",
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