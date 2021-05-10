exports.execute = async (interaction) => {
    //Interaction information
    const guild = interaction.guild;
    const channel = interaction.channel;
    const member = interaction.member;
    const args = interaction.options || null;

    //Dependencies
    const main = require("../main.js");
    const logs = require("../util/logFunctions.js");
    const Discord = require("discord.js");
    const { Op } = require("sequelize");
    const df = require("dateformat");

    //Database Retrieval
    const Configs = main.getConfigsTable();
    const client = main.getClient();

    console.log(args[0].options.options)
}