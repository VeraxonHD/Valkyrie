/**
 * Creates a String from a command object
 * @param {CommandObject} cmd 
 * @returns {String} String
 */
exports.commandToString = (cmd)=>{
    return `Name: ${cmd.name}\t Desc: ${cmd.description}\t ID: ${cmd.id}`;
}

/**
 * Prints a Command Object to string - uses .commandToString()
 * @param {CommandObject} cmd 
 */
exports.printCommand = (cmd) =>{
    return console.log(this.commandToString(cmd))
}

/**
 * Lists all commands on the bot.
 * @param {Object} commands 
 */
exports.listCommands = async (commands) =>{
    await commands.getCommands().then(cmds =>{console.log("Global Commands:"); console.log(cmds)})
    await commands.getCommands(null, "409365548766461952").then(cmds =>{console.log("Guild Commands:"); console.log(cmds)})
}

exports.getLogChannel = async (a_guildid) =>{
    const main = require("../main.js");
    const Configs = main.getConfigsTable();
    const client = main.getClient();

    var res = null;

    await Configs.findOne({where: {guildID: a_guildid}}).then(async config => {
        var guild = await client.guilds.fetch(a_guildid);
        var channel = await guild.channels.resolve(config.logChannelID);
        res = channel;
    })

    return res;
}

exports.getLogTypeState = async (a_guildid, a_logType) => {
    const main = require("../main.js");
    const Configs = main.getConfigsTable();

    var res;

    await Configs.findOne({where: {guildID: a_guildid}}).then(config => {   
        res = config.logTypes[a_logType];
    }).catch((err) => {
        res = err;
    })

    return res;
}