//Dependencies
const Discord = require("discord.js");
const interactions = require("discord-slash-commands-client");

//File Loads
const config = require("./store/config.json");
const common = require("./util/commonFuncs.js");
const { S_IFREG } = require("constants");

//Globals
const client = new Discord.Client();
client.interactions = new interactions.Client(
    config.token,
    "789655175048331283"
);
var commands = client.interactions;

//common.listCommands(commands)

client.on("ready", () =>{
    console.log("Bot Loaded.");

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
        type: 4,
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
});

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
});

client.on("message", (message) =>{
    if(message.channel.type != "text"){return}
    if(message.content.startsWith(config.prefix) != -1){
        var msgCommand = message.content.split(config.prefix)[1];
    }
});

//Client Log In
client.login(config.token);