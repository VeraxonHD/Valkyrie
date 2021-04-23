exports.execute = (interaction) => {
    var main = require("../main.js")
    var client = main.getClient();
    return interaction.reply(`Pong! Average Service Latency: \`${client.ws.ping}ms\`.`);
}