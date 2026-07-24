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

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

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

Naples Italy RP • Centrale Notifiche Staff`
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
        const codiceAccesso = 'dqsaytem'; 
        const oraApertura = new Date().toLocaleTimeString('it-IT');

        const eCircle = '<:ssu_circle:1521589524306722816>';
        const eVerified1 = '<:verified1:1521587794340872193>';
        const eKey = '<:key:1521593933271007465>';
        const eVerified2 = '<:verified2:1521589455310422097>';
        const eShield = '<:shield:1521588388137013350>';
        const eClock = '<:clock:1521595170661859552>';

        const embedDescription = 
`### Naples Italy Roleplay — SERVER APERTO

${eCircle} **SSU - SERVER START UP**

${eVerified1} **Nome Server:** \`Naples Italy Roleplay\`
${eKey} **Codice Accesso:** \`${codiceAccesso}\`

──────────────────────────
Entra , ricordiamo di seguire il nostro **regolamento** Ufficiale.
Lo staff è **presente e attivo** per garantire una sessione ottimale.
──────────────────────────

${eVerified2} **Partecipazione**
Lo staff Chiede Massima **Partecipazione** e **Collaborazione** Da Parte vostra.

${eShield} **Moderazione**
La Moderazione è **Presente e Attiva** Per Assistenza !

${eClock} **Orario Apertura**
\`${oraApertura}\``;

        const embed = new EmbedBuilder()
            .setColor('#2B2D31')
            .setDescription(embedDescription)
            .setImage('https://cdn.discordapp.com/attachments/1520423599884865536/1527221403391234058/standard_2.gif?ex=6a646b44&is=6a6319c4&hm=d74e595f42ceacd3bbff3dfdc2c17bf805d7eb8453d6a0dcdbdfe8a4aa84db43&');

        // Riga con entrambi i pulsanti (Link Roblox + Modulo Richiesta Staff con la tua emoji)
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('Accedi al Server')
                .setStyle(ButtonStyle.Link)
                .setURL('https://www.roblox.com/share?v=v2&code=5ihdm3h6ha2xgj'),
            new ButtonBuilder()
                .setCustomId('btn_richiesta_staff')
                .setLabel('Richiesta Staff in Game')
                .setStyle(ButtonStyle.Success) // Colore verde
                .setEmoji('1521589524306722816')
        );

        await interaction.reply({ 
            content: '@everyone Server Online — <:verificato:1521587794340872193> Vi Aspettiamo su Naples Italy Roleplay!', 
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
`### Naples Italy Roleplay — SERVER CHIUSO

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
            .setDescription(embedDescription);

        await interaction.reply({ 
            content: `@everyone Server Chiuso — Grazie per la partecipazione su Naples Italy Roleplay!`, 
            embeds: [embed] 
        });
        return;
    }
});

client.login(process.env.TOKEN);
