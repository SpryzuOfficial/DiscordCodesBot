require('dotenv').config();

const fs = require('fs');
const {Client, Intents} = require('discord.js');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

client.on('ready', () =>
{
    console.log(client.user.tag);
});

client.on('messageCreate', async(message) =>
{
    const list = message.content.split(' ');
    const command = list[0];
    const args = list.slice(1);

    if(command == '*code')
    {
        const path = './db/data.json';
        const data = JSON.parse(fs.readFileSync(path));

        const pathu = './db/user.json';
        const datau = JSON.parse(fs.readFileSync(pathu));

        const names = [];
        data.data.forEach((element, index) =>
        {
            if(element.name == args[0])
            {
                names.push({element, index});
            }
        });

        if(names.length < 1)
        {
            message.channel.send('No codes available in DB');
            return;
        }

        const user = message.author.id;
        const time = new Date().getTime();

        let band = true;
        datau.users.forEach(async(element, i) =>
        {
            if(element.user == message.author.id)
            {
                if((time - element.time) > 3600000 * 12)
                {
                    datau.users.splice(i, 1);
                    band = true;
                }
                else
                {
                    band = false;
                }
            }
        });

        if(!band)
        {
            await message.channel.send('Wait until you can request another one');
            return;
        }
        
        datau.users.push({user, time});

        fs.writeFileSync(pathu, JSON.stringify(datau));

        const index = Math.floor(Math.random() * names.length);
        const {element, index: i} = names[index];

        client.users.cache.get(message.author.id).send(element["name"]);
        for(let el in element)
        {
            if(el != "name")
            {
                client.users.cache.get(message.author.id).send(element[el]);
            }
        }

        data.data.splice(i, 1);

        fs.writeFileSync(path, JSON.stringify(data));
    }

    if(command == '-add')
    {
        const name = args[0];

        const body = {name};

        args.forEach((element, index) =>
        {
            if(index != 0)
            {
                body[index] = element;
            }
        });

        const path = './db/data.json';
        const data = JSON.parse(fs.readFileSync(path));

        data.data.push(body);

        fs.writeFileSync(path, JSON.stringify(data));

        await message.channel.send('Saved in DB');
    }
});

client.login(process.env.TOKEN);