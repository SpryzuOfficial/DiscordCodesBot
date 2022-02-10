require('dotenv').config();

const fs = require('fs');
const {Client, Intents} = require('discord.js');

const Code = require('./models/code');
const User = require('./models/user');
const keepAlive = require('./server');
const { dbConnection } = require('./config_database');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

dbConnection();

client.on('ready', () =>
{
    console.log(client.user.tag);
});

client.on('messageCreate', async(message) =>
{
    const list = message.content.split(' ');
    const command = list[0];
    const args = list.slice(1);

    try
    {
        if(message.member.roles.cache.has(process.env.BUY))
        {
            if(command == '*get')
            {
                const arg_name = args[0].toLocaleLowerCase();

                if(stock(arg_name) < 1)
                {
                    message.channel.send('No codes available in DB');
                    return;
                }

                const users = await User.find();
                
                let timeLeft;
                let elm;
                const id = message.author.id;
                const time = new Date().getTime();

                let band = 0;
                users.forEach(async(element) =>
                {
                    if(element.id == id)
                    {
                        let hour;
                        if(message.member.roles.cache.has(process.env.C12))
                        {
                            hour = 12;
                        }
                        else if(message.member.roles.cache.has(process.env.C3))
                        {
                            hour = 3;
                        }
                        else
                        {
                            hour = 12;
                        }
                        
                        timeLeft = ((3600000 * hour) - (time - element.time)) / 3600000;
                        if((time - element.time) > 3600000 * hour)
                        {
                            elm = element;
                            band = 1;
                        }
                        else
                        {
                            band = 2;
                        }
                    }
                });
                
                if(band == 1)
                {
                    await User.findByIdAndUpdate(elm._id, {id, time});
                }
                else if(band == 2)
                {
                    await message.channel.send('Wait! ' + Math.round(timeLeft) + ' hour cooldown 😎');
                    return;
                }
                else
                {
                    const user = User({id, time});

                    await user.save();
                }

                const codes = await Code.find();

                const elements = []
                codes.forEach((element) =>
                {
                    if(element.name == arg_name)
                    {
                        elements.push(element);
                    }
                });

                const index = Math.floor(Math.random() * elements.length);

                client.users.cache.get(message.author.id).send(elements[index].name);
                client.users.cache.get(message.author.id).send(elements[index].value);

                await Code.findByIdAndDelete(elements[index]._id);

                await message.channel.send('Code sent');
            }
        }

        if(message.member.roles.cache.has(process.env.ADM) || message.member.roles.cache.has(process.env.BUY))
        {
            if(command == '*stock')
            {
                if(args[0] != undefined)
                {
                    const name = args[0].toLowerCase();

                    await message.channel.send(stock(name) + " " + name + ' codes in stock');
                }
            }
        }

        if(message.member.roles.cache.has(process.env.ADM))
        {
            if(command == '-add')
            {
                const name = args[0].toLocaleLowerCase();
                const value = args[1];

                const code = new Code({name, value});

                await code.save();

                await message.channel.send('Saved in DB');
            }
        }

        if(message.member.id == message.guild.ownerId)
        {
            if(command == '*reset')
            {
                const mention = message.mentions.members.first();

                let member;
                if(mention)
                {
                    member = mention.user.id;
                }
                else
                {
                    member = message.member.id;
                }

                const users = await User.find();

                let elm;
                users.forEach(async(element) =>
                {
                    if(element.id == member)
                    {
                        elm = element;
                    }
                });

                await User.findByIdAndDelete(elm._id);

                await message.channel.send('<@!' + member + '> cooldown reset');
            }
        }
    }
    catch(error)
    {
        console.log(error);
    }
});

const stock = async(name) =>
{
    let stocks = 0;

    const codes = await Code.find();
    codes.forEach((element) =>
    {
        if(element.name == name)
        {
            stocks++;
        }
    });

    return stocks;
}

if(process.env.PRODUCTION == 1)
{
    keepAlive();
}

client.login(process.env.TOKEN);