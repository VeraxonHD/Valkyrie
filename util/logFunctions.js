/**
 * Generates a Mute log embed
 * @param {Discord.GuildMember} targetMember 
 * @param {String} duration
 * @param {String} reason
 * @param {Discord.GuildMember} moderator
 */
exports.logMute = (targetMember, duration, reason, moderator)=>{
    const Discord = require("discord.js");
    const embed = new Discord.MessageEmbed()
        .setAuthor("Member Muted")
        .addField("Member", targetMember, true)
        .addField("Duration", duration, true)
        .addField("Reason", reason, true)
        .addField("Moderator", moderator)
        .setColor("RED")
        .setFooter("logMute.logs.valkyrie");
    return {embed};
}

/**
 * Generates a Ban log embed
 * @param {Discord.GuildMember} targetMember 
 * @param {String} reason
 * @param {Discord.GuildMember} moderator
 */
exports.logBan = (targetMember, reason, moderator)=>{
    const Discord = require("discord.js");
    const embed = new Discord.MessageEmbed()
        .setAuthor("Member Banned")
        .addField("Member", targetMember, true)
        .addField("Reason", reason, true)
        .addField("Moderator", moderator)
        .setColor("RED")
        .setFooter("logBan.logs.valkyrie");
    return {embed};
}

/**
 * Generates a Kick log embed
 * @param {Discord.GuildMember} targetMember 
 * @param {String} reason
 * @param {Discord.GuildMember} moderator
 */
exports.logKick = (targetMember, reason, moderator)=>{
    const Discord = require("discord.js");
    const embed = new Discord.MessageEmbed()
        .setAuthor("Member Kicked")
        .addField("Member", targetMember, true)
        .addField("Reason", reason, true)
        .addField("Moderator", moderator)
        .setColor("RED")
        .setFooter("logKick.logs.valkyrie");
    return {embed};
}