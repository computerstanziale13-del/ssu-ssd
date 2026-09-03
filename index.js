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

// Server Express per mantenere attivo il Web Service su Render
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Il Bot SSU/SSD è online e operativo!');
});

app.listen(port, () => {
    console.log(`🌐 Server web in ascolto sulla porta ${port}`);
});

// --- AUTO-PING SICURO (Gestito con gestione errori per evitare il crash del processo) ---
const SELF_URL = process.env.RENDER_EXTERNAL_URL || 'https://ssu-ssd.onrender.com';

setInterval(async () => {
    try {
        // Utilizziamo un blocco try/catch dedicato per evitare Unhandled Rejections
        const res = await globalThis.fetch(SELF_URL).catch(() => null);
        if (res && res.ok) {
            console.log('🔄 Auto-ping eseguito con successo per mantenere attivo il bot.');
        }
    } catch (err) {
        console.warn('⚠️ Avviso durante l\'auto-ping (ignorato per evitare crash):', err.message);
    }
}, 4 * 60 * 1000); // 4 minuti

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

// --- GESTIONE ERRORI GLOBALI PER PREVENIRE CRASH FATALI ---
client.on('error', error => {
    console.error('⚠️ Errore del client Discord catturato:', error);
});

process.on('unhandledRejection', error => {
    // Ignora gli errori di interazione scaduta (10062) per evitare il blocco del processo
    if (error?.code === 10062) {
        console.warn('⚠️ Interazione scaduta ignorata (Unknown interaction).');
        return;
    }
    console.error('⚠️ Promessa non gestita catturata:', error);
});

process.on('uncaughtException', error => {
    console.error('⚠️ Eccezione non catturata:', error);
});

// Immagini personalizzate
const EMBED_THUMBNAIL = 'https://cdn.discordapp.com/attachments/1532820317112893662/1545010053935800360/ChatGPT_Image_1_set_2026_21_28_29.png?ex=6a9a963d&is=6a9944bd&hm=0de62600ef2e833f064758a4a2b79295956fcdc1589acefe47fdb7eb08d15499&';
const BANNER_SSU = 'https://cdn.discordapp.com/attachments/1532820317112893662/1545010054514745435/ChatGPT_Image_1_set_2026_21_33_32.png?ex=6a9a963d&is=6a9944bd&hm=1494623ce38bc64dc40dc8b5c6f66253cef29a8aa40edff8c35964d5e8acaca6&';
const BANNER_SSD = 'https://cdn.discordapp.com/attachments/1532820317112893662/1545010054514745435/ChatGPT_Image_1_set_2026_21_33_32.png?ex=6a9a963d&is=6a9944bd&hm=1494623ce38bc64dc40dc8b5c6f66253cef29a8aa40edff8c35964d5e8acaca6&';

client.once('ready', async () => {
    console.log(`🤖 Bot SSU/SSD avviato con successo come ${client.user.tag}`);

    const commands = [
        new SlashCommandBuilder()
            .setName('ssu')
            .setDescription('Avvia l\'annuncio di Server Start Up (SSU) per Emergency Hamburg')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        new SlashCommandBuilder()
            .setName('ssd')
            .setDescription('Avvia l\'annuncio di Server Shut Down (SSD) per Emergency Hamburg')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    ];

    const tokenToUse = process.env.TOKEN;
    const rest = new REST({ version: '10' }).setToken(tokenToUse);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('✅ Comandi /ssu e /ssd registrati con successo!');
    } catch (err) {
        console.error('❌ Errore nella registrazione dei comandi:', err);
    }
});

client.on('interactionCreate', async interaction => {
    try {
        // --- GESTIONE MODAL SUBMIT ---
        if (interaction.isModalSubmit() && interaction.customId === 'modal_staff_game') {
            const robloxName = interaction.fields.getTextInputValue('roblox_name');
            const motif = interaction.fields.getTextInputValue('motif');
            const oraSegnalazione = new Date().toLocaleTimeString('it-IT');
            const channelId = '1542488615232348220';
            const staffRoleId = '1542488319739559957';

            const targetChannel = interaction.guild.channels.cache.get(channelId);
            if (!targetChannel) {
                return await interaction.reply({ content: '❌ Errore: Canale delle notifiche staff non trovato!', flags: 64 });
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

Molise RP • Centrale Notifiche Staff`
                );

            await targetChannel.send({
                content: `⚠️ **NOTIFICA IN-GAME** — <@&${staffRoleId}>`,
                embeds: [embedRichiesta]
            });

            return await interaction.reply({ content: '✅ Richiesta di supporto inviata con successo al team staff!', flags: 64 });
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

        // --- COMANDO SSU EMERGENCY HAMBURG ---
        if (interaction.commandName === 'ssu') {
            const codiceAccesso = '06zx6fba'; 
            const oraApertura = new Date().toLocaleTimeString('it-IT');

            const embedDescription = 
`### Molise RP — SERVER APERTO

<:molise:1545037819087425636> **SSU - SERVER START UP**

<:info1:1545022596221771836> **Nome Server:** \`Molise RP\`
<:whitemod:1545020693253460039> **Codice Accesso:** \`${codiceAccesso}\`

──────────────────────────
Entra , ricordiamo di seguire il nostro **regolamento** Ufficiale.
Lo staff è **presente e attivo** per garantire una sessione ottimale.
──────────────────────────

<:admin1:1545022647178633286> **Partecipazione**
Lo staff chiede massima **partecipazione** e **collaborazione** da parte vostra.

<:green:1545038777628495993> **Moderazione**
La Moderazione è **Presente e Attiva** Per Assistenza !

<:info1:1545022596221771836> **Orario Apertura**
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
                    .setEmoji('1545037819087425636')
            );

            await interaction.reply({ 
                content: '@everyone Server Online — <:molise:1545037819087425636> Vi Aspettiamo su Molise RP!', 
                embeds: [embed], 
                components: [row] 
            });
            return;
        }

        // --- COMANDO SSD EMERGENCY HAMBURG ---
        if (interaction.commandName === 'ssd') {
            const oraChiusura = new Date().toLocaleTimeString('it-IT');
            const customEmoji = '<:emoji_custom:1524956959944474624>';

            const embedDescription = 
`### Molise RP — SERVER CHIUSO

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
                content: `@everyone Server Chiuso — Grazie per la partecipazione su Molise RP!`, 
                embeds: [embed] 
            });
            return;
        }

    } catch (err) {
        if (err?.code === 10062) return; // Ignora silenziosamente le interazioni scadute
        console.error('⚠️ Errore durante la gestione di un\'interazione:', err);
    }
});

client.login(process.env.TOKEN);
