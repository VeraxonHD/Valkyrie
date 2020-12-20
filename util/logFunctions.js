/**
 * Generates a Mute log embed
 * @param {Discord.GuildMember} member 
 * @param {String} duration
 * @param {String} reason
 */
exports.logMute = (member, duration, reason)=>{
    const Discord = require("discord.js");
    const embed = new Discord.MessageEmbed()
        .setAuthor("Member Muted")
        .addField("Member Display Name", member.displayName, true)
        .addField("Duration", duration, true)
        .addField("Reason", reason, true)
        .setColor("RED")
        .setFooter("logMute.logs.valkyrie")
    return {embed}
}