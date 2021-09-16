exports.execute = async (interaction) => {
    //Interaction information
    const guild = interaction.guild;
    const channel = interaction.channel;
    const member = interaction.member;
    const args = interaction.options || null;

    //Dependencies
    const main = require("../main.js");
    const logs = require("../util/logFunctions.js");

    //Database Retrieval
    const amount = args.getInteger("amount");
    const targetMember = args.getMember("user");

    channel.messages.fetch().then(async fetchMessages => {
        var messageSelection = fetchMessages;
        if(targetMember != null){
            messageSelection = fetchMessages.filter(m => m.author.id === targetMember.id);
        }
        messageSelection = messageSelection.first(amount);
        await channel.bulkDelete(messageSelection).then(() => {
            return interaction.reply({content: `Deleted ${amount} messages successfully.`, ephemeral: true});
        }).catch(err => {
            console.error(err);
            return interaction.reply({content: `Code 100 - Could not delete messages.`, ephemeral: true});
        });
    })

}