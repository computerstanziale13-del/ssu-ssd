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
const EMBED_THUMBNAIL = 'https://cdn.discordapp.com/attachments/1496592684721246208/1533894848791449700/ChatGPT_Image_1_ago_2026_18_44_18.png?ex=6a722666&is=6a70d4e6&hm=27e6038cfafb941b815a6b29547ce45b2599f9376ad04d92e0db8a0ac9d72be3&';

// Banner SSU aggiornato con il nuovo link che hai fornito
const BANNER_SSU = 'https://cdn.discordapp.com/attachments/1530001472492933191/1534295243891937556/46c2a86293a7fd82cac1adb46402e54e.webp?ex=6a739b4b&is=6a7249cb&hm=623aac4851c576d2c56cea9e2270dc3a0915be2fda4221c92318c3805360a017&';

// Banner SSD (puoi modificarlo con un altro link se vuoi, al momento usa sempre il nuovo)
const BANNER_SSD = 'https://cdn.discordapp.com/attachments/1530001472492933191/1534295243891937556/46c2a86293a7fd82cac1adb46402e54e.webp?ex=6a739b4b&is=6a7249cb&hm=623aac4851c576d2c56cea9e2270dc3a0915be2fda4221c92318c3805360a017&';

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
    try {
        // --- GESTIONE MODAL SUBMIT (Invio Modulo Richiesta Staff) ---
        if (interaction.isModalSubmit() && interaction.customId === 'modal_staff_game') {
            const robloxName = interaction.fields.getTextInputValue('roblox_name');
            const motif = interaction.fields.getTextInputValue('motif');
            const oraSegnalazione = new Date().toLocaleTimeString('it-IT');
            const channelId = '1521601801227604038'; // Canale notifiche staff
            const staffRoleId = '1518557087347638403'; // Ruolo staff da pingare

            const targetChannel = interaction.guild.channels.cache.get(channelId);
            if (!targetChannel) {
                return await interaction.reply({ content: '❌ Errore: Canale delle notifiche staff non trovato!', ephemeral: true });
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

Italian Country • Centrale Notifiche Staff`
                );

            await targetChannel.send({
                content: `⚠️ **NOTIFICA IN-GAME** — <@&${staffRoleId}>`,
                embeds: [embedRichiesta]
            });

            return await interaction.reply({ content: '✅ Richiesta di supporto inviata con successo al team staff!', ephemeral: true });
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
`### Italian Country — SERVER APERTO

<:emoji:1524957824315031703> **SSU - SERVER START UP**

<:verified1:1521587794340872193> **Nome Server:** \`Italian Country\`
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
                content: '@everyone Server Online — <:verified1:1521587794340872193> Vi Aspettiamo su Italian Country!', 
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
`### Italian Country — SERVER CHIUSO

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
                content: `@everyone Server Chiuso — Grazie per la partecipazione su Italian Country!`, 
                embeds: [embed] 
            });
            return;
        }

    } catch (err) {
        console.error('⚠️ Errore durante la gestione di un\'interazione:', err.message);
    }
});

client.login(process.env.TOKEN);
