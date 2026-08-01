const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    PermissionFlagsBits, 
    REST, 
    Routes,
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle 
} = require('discord.js');
const express = require('express');

// Server Express per tenere attivo il bot su Render / UptimeRobot
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Il Bot SSU/SSD è online e operativo!');
});

app.listen(port, () => {
    console.log(`🌐 Server web in ascolto sulla porta ${port}`);
});

// --- SISTEMA DI AUTO-PING PER EVITARE L'IBERNAZIONE SU RENDER ---
const SELF_URL = 'https://ssu-ssd.onrender.com';

setInterval(async () => {
    try {
        await fetch(SELF_URL);
        console.log('🔄 Auto-ping eseguito con successo per mantenere attivo il bot.');
    } catch (err) {
        console.error('⚠️ Errore durante l\'auto-ping:', err.message);
    }
}, 4 * 60 * 1000); // Esegue una richiesta ogni 4 minuti

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

// --- GESTIONE ERRORI GLOBALI PER EVITARE CRASH (EXIT CODE 1) ---
client.on('error', error => {
    console.error('⚠️ Errore del client Discord catturato:', error);
});

process.on('unhandledRejection', error => {
    console.error('⚠️ Promessa non gestita catturata:', error);
});

// Immagini personalizzate
const EMBED_THUMBNAIL = 'https://cdn.discordapp.com/attachments/1531402756269805770/1531402786598682824/IMG_2695.png?ex=6a69157c&is=6a67c3fc&hm=b39a6f487454937505d86f1c7180b0d0bddaa16e3c3e1f603ed24951fc392345&';
const BANNER_SSU = 'https://cdn.discordapp.com/attachments/1531402756269805770/1531792531300417546/IMG_5524.png?ex=6a6c7ab6&is=6a6b2936&hm=31ccd7c321527d3030831a638781aee189f0b62c820cb3e202c43b696915d981&';
const BANNER_SSD = 'https://cdn.discordapp.com/attachments/1531402756269805770/1531792531551944815/IMG_5525.png?ex=6a6c7ab6&is=6a6b2936&hm=9d17bd7ac95d6409e80214ec55a0c4cf351eaed7a9da8f6e1810d7cc499d7dea&';

client.once('ready', async () => {
    console.log(`🤖 Bot SSU/SSD avviato con successo come ${client.user.tag}`);

    const commands = [
        new SlashCommandBuilder()
            .setName('ssu')
            .setDescription('Avvia l\'annuncio di Server Start Up (SSU)')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        new SlashCommandBuilder()
            .setName('ssd')
            .setDescription('Avvia l\'annuncio di Server Shut Down (SSD)')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    ];

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('✅ Comandi /ssu e /ssd registrati con successo!');
    } catch (err) {
        console.error('❌ Errore nella registrazione dei comandi:', err);
    }
});

client.on('interactionCreate', async interaction => {
    // --- GESTIONE MODAL SUBMIT (Invio Modulo Richiesta Staff) ---
    if (interaction.isModalSubmit() && interaction.customId === 'modal_staff_game') {
        const robloxName = interaction.fields.getTextInputValue('roblox_name');
        const motif = interaction.fields.getTextInputValue('motif');
        const oraSegnalazione = new Date().toLocaleTimeString('it-IT');
        const channelId = '1521601801227604038'; // Canale notifiche staff
        const staffRoleId = '1518557087347638403'; // Ruolo staff da pingare

        const targetChannel = interaction.guild.channels.cache.get(channelId);
        if (!targetChannel) {
            return interaction.reply({ content: '❌ Errore: Canale delle notifiche staff non trovato!', ephemeral: true });
        }

        const embedRichiesta = new EmbedBuilder()
            .setColor('#F1C40F')
            .setThumbnail(EMBED_THUMBNAIL)
            .setDescription(
`### 🚨 SUPPORTO IN-GAME RICHIESTO 🚨

🎮 **Chiamata di Emergenza dalla Sessione!**
Un cittadino ha inoltrato una segnalazione d'assistenza immediata direttamente dal server Roblox.

──────────────────────────
📌 **Dettagli Richiesta:**
👤 **Inviata da:** ${interaction.user} (\`${robloxName}\`)
⏱️ **Orario Segnalazione:** \`${oraSegnalazione}\`
⚡ **Motivo della chiamata:** \`${motif}\`
⚡ **Priorità:** Alta (Urgente)
──────────────────────────

⚠️ **Istruzioni per il Team Staff:**
Un membro abilitato del team è pregato di entrare in gioco il prima possibile, verificare l'accaduto e moderare la situazione per garantire il corretto svolgimento della simulazione.

Italian Life RP • Centrale Notifiche Staff`
            );

        await targetChannel.send({
            content: `⚠️ **NOTIFICA IN-GAME** — <@&${staffRoleId}>`,
            embeds: [embedRichiesta]
        });

        return interaction.reply({ content: '✅ Richiesta di supporto inviata con successo al team staff!', ephemeral: true });
    }

    // --- GESTIONE PULSANTI ---
    if (interaction.isButton()) {
        if (interaction.customId === 'btn_richiesta_staff') {
            const modal = new ModalBuilder()
                .setCustomId('modal_staff_game')
                .setTitle('Richiesta Staff in Game');

            const robloxInput = new TextInputBuilder()
                .setCustomId('roblox_name')
                .setLabel('Il tuo nome su Roblox')
                .setPlaceholder('Inserisci il tuo username...')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const motifInput = new TextInputBuilder()
                .setCustomId('motif')
                .setLabel('Motivo della chiamata')
                .setPlaceholder('Descrivi brevemente il problema...')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(robloxInput),
                new ActionRowBuilder().addComponents(motifInput)
            );

            return await interaction.showModal(modal);
        }
    }

    if (!interaction.isChatInputCommand()) return;

    // --- COMANDO SSU (Server Start Up) CON DOPPIO PULSANTE ---
    if (interaction.commandName === 'ssu') {
        const codiceAccesso = 'WERBEDVZ'; 
        const oraApertura = new Date().toLocaleTimeString('it-IT');

        const embedDescription = 
`### Italian Life RP — SERVER APERTO

<:emoji:1524957824315031703> **SSU - SERVER START UP**

<:verified1:1521587794340872193> **Nome Server:** \`Italian Life RP\`
<:key:1521593933271007465> **Codice Accesso:** \`${codiceAccesso}\`

──────────────────────────
Entra , ricordiamo di seguire il nostro **regolamento** Ufficiale.
Lo staff è **presente e attivo** per garantire una sessione ottimale.
──────────────────────────

<:emoji:1525053084261417067> **Partecipazione**
Lo staff chiede massima **partecipazione** e **collaborazione** da parte vostra.

<:shield:1521588388137013350> **Moderazione**
La Moderazione è **Presente e Attiva** Per Assistenza !

<:clock:1521595170661859552> **Orario Apertura**
\`${oraApertura}\``;

        const embed = new EmbedBuilder()
            .setColor('#2B2D31')
            .setThumbnail(EMBED_THUMBNAIL)
            .setDescription(embedDescription)
            .setImage(BANNER_SSU);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('Accedi al Server')
                .setStyle(ButtonStyle.Link)
                .setURL('https://www.roblox.com/share?v=v2&code=5ihdm3h6ha2xgj'),
            new ButtonBuilder()
                .setCustomId('btn_richiesta_staff')
                .setLabel('Richiesta Staff in Game')
                .setStyle(ButtonStyle.Success)
                .setEmoji('1524957824315031703')
        );

        await interaction.reply({ 
            content: '@everyone Server Online — <:verified1:1521587794340872193> Vi Aspettiamo su Italian Life RP!', 
            embeds: [embed], 
            components: [row] 
        });
        return;
    }

    // --- COMANDO SSD (Server Shut Down) SENZA PULSANTI ---
    if (interaction.commandName === 'ssd') {
        const oraChiusura = new Date().toLocaleTimeString('it-IT');
        const customEmoji = '<:emoji_custom:1524956959944474624>';

        const embedDescription = 
`### Italian Life RP — SERVER CHIUSO

${customEmoji} **SSD - SERVER SHUT DOWN**

🔒 **Stato Sessione:** \`Terminata\`
⏱️ **Orario Chiusura:** \`${oraChiusura}\`

──────────────────────────
La sessione di gioco è ufficialmente conclusa.
Grazie a tutti per aver partecipato e aver reso il Roleplay di alto livello!
Ci vediamo alla prossima apertura.
──────────────────────────`;

        const embed = new EmbedBuilder()
            .setColor('#E74C3C')
            .setThumbnail(EMBED_THUMBNAIL)
            .setDescription(embedDescription)
            .setImage(BANNER_SSD);

        await interaction.reply({ 
            content: `@everyone Server Chiuso — Grazie per la partecipazione su Italian Life RP!`, 
            embeds: [embed] 
        });
        return;
    }
});

client.login(process.env.TOKEN);
