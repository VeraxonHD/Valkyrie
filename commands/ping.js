exports.execute = (interaction) => {
    var main = require("../main.js")
    var client = main.getClient();
    return interaction.channel.send(`Pong! Average Service Latency: \`${client.ws.ping}ms\`.`);
}