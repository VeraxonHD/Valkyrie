/**
 * Generates a Mute log embed
 * @param {Discord.GuildMember} targetMember 
 * @param {String} duration
 * @param {String} reason
 * @param {Discord.GuildMember} moderator
 * @param {Discord.Guild} guild
 */
exports.logMute = async (targetMember, duration, reason, moderator, guild)=>{
    const Discord = require("discord.js");
    const embed = new Discord.MessageEmbed()
        .setAuthor("Member Muted")
        .addField("Member", await guild.members.resolve(targetMember).toString(), true)
        .addField("Duration", duration, true)
        .addField("Reason", reason, true)
        .addField("Moderator", await guild.members.resolve(moderator).toString())
        .setColor("RED")
        .setFooter("logMute.logs.valkyrie");
    return embed;
}

/**
 * Generates a Ban log embed
 * @param {Discord.GuildMember} targetMember 
 * @param {String} reason
 * @param {Discord.GuildMember} moderator
 * @param {Discord.Guild} guild
 */
exports.logBan = async (targetMember, reason, moderator, guild)=>{
    const Discord = require("discord.js");
    const embed = new Discord.MessageEmbed()
        .setAuthor("Member Banned")
        .addField("Member", await guild.members.resolve(targetMember).toString(), true)
        .addField("Reason", reason, true)
        .addField("Moderator", await guild.members.resolve(moderator).toString())
        .setColor("RED")
        .setFooter("logBan.logs.valkyrie");
    return embed;
}

/**
 * Generates a Kick log embed
 * @param {Discord.GuildMember} targetMember 
 * @param {String} reason
 * @param {Discord.GuildMember} moderator
 * @param {Discord.Guild} guild
 */
exports.logKick = async (targetMember, reason, moderator, guild)=>{
    const Discord = require("discord.js");
    const embed = new Discord.MessageEmbed()
        .setAuthor("Member Kicked")
        .addField("Member", await guild.members.resolve(targetMember).toString(), true)
        .addField("Reason", reason, true)
        .addField("Moderator", await guild.members.resolve(moderator).toString())
        .setColor("RED")
        .setDescription("Test")
        .setFooter("logKick.logs.valkyrie");
    return embed;
}

/**
 * Generates a Warn log embed
 * @param {Discord.GuildMember} targetMember 
 * @param {String} reason
 * @param {Discord.GuildMember} moderator
 * @param {Discord.Guild} guild
 */
exports.logWarn = async (targetMember, reason, moderator, guild)=>{
    const Discord = require("discord.js");
    const embed = new Discord.MessageEmbed()
        .setAuthor("Member Warned")
        .addField("Member", await guild.members.resolve(targetMember).toString(), true)
        .addField("Reason", reason, true)
        .addField("Moderator", await guild.members.resolve(moderator).toString())
        .setColor("RED")
        .setFooter("logWarn.logs.valkyrie");
    return embed;
}