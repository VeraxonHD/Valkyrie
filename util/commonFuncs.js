exports.commandToString = (cmd)=>{
    return `Name: ${cmd.name}\t Desc: ${cmd.description}\t ID: ${cmd.id}`;
}

exports.printCommand = (cmd) =>{
    return console.log(this.commandToString(cmd))
}

exports.listCommands = async (commands) =>{
    await commands.getCommands().then(cmds =>{console.log("Global Commands:"); console.log(cmds)})
    await commands.getCommands(null, "409365548766461952").then(cmds =>{console.log("Guild Commands:"); console.log(cmds)})
}