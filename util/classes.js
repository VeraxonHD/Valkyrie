class MultiEmbed{
    constructor(){
        this.currentPage = 0;
        this.pages = [];
        this.author = "MultiEmbed";
        this.footer = "MultiEmbed";
        this.color = "RED"
    }

    setAuthor(author){
        this.author = author;
        return this;
    }

    setFooter(footer){
        this.footer = footer;
        return this;
    }

    setColor(color){
        this.color = color;
        return this;
    }

    addPage(page){
        this.pages.push(page);
        return this;
    }

    printPages(){
        return console.log(this.pages);
    }

    editPage(pageNumber, newField){
        pages[pageNumber] = newField
    }

    previousPage(){
        this.currentPage--;
        return this.render();
    }

    nextPage(){
        this.currentPage++;
        return this.render();
    }

    render(){
        const Discord = require("discord.js");
        var embed = new Discord.MessageEmbed()
            .setAuthor(this.author)
            .setColor(this.color)
            .setFooter(`${this.footer} | Page ${this.currentPage + 1}/${this.pages.length}`);
        this.pages[this.currentPage].fields.forEach(field => {
            embed.addFields(field);
        });

        var previousButton = new Discord.MessageButton()
            .setCustomId('previous')
            .setLabel('<')
            .setStyle('PRIMARY');
        var nextButton = new Discord.MessageButton()
            .setCustomId('next')
            .setLabel('>')
            .setStyle('PRIMARY');
        var endButton = new Discord.MessageButton()
            .setCustomId('end')
            .setLabel('X')
            .setStyle('DANGER');

        if(this.currentPage == 0){
            previousButton.setDisabled(true);
        }else{
            previousButton.setDisabled(false);
        }

        if(this.currentPage == this.pages.length - 1){
            nextButton.setDisabled(true);
        }else{
            nextButton.setDisabled(false);
        }

        const buttons = new Discord.MessageActionRow()
			.addComponents(previousButton, nextButton, endButton);
        
        return {embeds: [embed], components: [buttons]};
    }

    finalRender(finalMessage){
        const Discord = require("discord.js");
        var embed = new Discord.MessageEmbed()
            .setAuthor(this.author)
            .setColor(this.color)
            .setFooter(`${this.footer}`)
            .addField("This interactive menu has expired.", `${finalMessage}`);
        return {embeds: [embed], components: []};
    }
}

class MultiEmbedPage{
    constructor(fields){
        this.fields = fields;
    }

    addField(field){
        return this.fields.push(field);
    }

    printFields(){
        return console.log(this.fields);
    }
}

module.exports = { MultiEmbed, MultiEmbedPage }