exports.execute = async (message, args) => {
    if(message.author.id != "213040107278696450"){ return; }

    const main = require("../main.js");

    const client = main.getClient();
    const guild = message.guild;

    function clean(text) {
        if (typeof(text) === "string")
            return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
        else
            return text;
    }
    try {
        var code = args.join(" ");
        if(code.startsWith("```")){
            code = code.split("```")[1]
        }
        var evaled = await eval(code);

        if(evaled){
            return;
        }

        if (typeof evaled !== "string")
            evaled = require("util").inspect(evaled);

        message.channel.send(clean(evaled))
            .then(message=>message.react('✅'));
    } catch (err) {
            message.channel.send(`\`Code execution failed.\` \`\`\`xl\n${clean(err)}\n\`\`\``)
                .then(message=>message.react('❎'));
    }
}