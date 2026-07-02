require('dotenv').config();

// This script registers the bot's slash commands with one or more Discord servers.
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

// These values come from .env.
const { DISCORD_TOKEN, CLIENT_ID, GUILD_IDS } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_IDS) {
  console.error('Missing DISCORD_TOKEN, CLIENT_ID, or GUILD_IDS in .env');
  process.exit(1);
}

// Slash command definitions. These are what Discord shows when users type "/".
const commands = [
  new SlashCommandBuilder()
    .setName('tplay')
    .setDescription('Play a song, playlist, or search query.')
    .addStringOption((option) =>
      option
        .setName('query')
        .setDescription('YouTube URL or search text')
        .setRequired(true),
    ),
  new SlashCommandBuilder().setName('tskip').setDescription('Skip the current track.'),
  new SlashCommandBuilder().setName('tloop').setDescription('Loop the current track.'),
  new SlashCommandBuilder().setName('tstoploop').setDescription('Stop looping the current track.'),
  new SlashCommandBuilder().setName('treplay').setDescription('Replay the previous track.'),
  new SlashCommandBuilder().setName('tclear').setDescription('Clear queued songs.'),
  new SlashCommandBuilder().setName('trandom').setDescription('Play a random song from this session'),
  new SlashCommandBuilder()
    .setName('tartist')
    .setDescription('Keep playing songs by an artist.')
    .addStringOption((option) =>
      option
        .setName('artist')
        .setDescription('Artist name')
        .setRequired(true),
    ),
  new SlashCommandBuilder().setName('tstopartist').setDescription('Stop artist mode.'),
  new SlashCommandBuilder().setName('tstop').setDescription('Stop playback and clear the queue.'),
  new SlashCommandBuilder().setName('tpause').setDescription('Pause playback.'),
  new SlashCommandBuilder().setName('tresume').setDescription('Resume playback.'),
  new SlashCommandBuilder()
    .setName('tqueue')
    .setDescription('Add a song to the queue or show the current queue.')
    .addStringOption((option) =>
      option
        .setName('query')
        .setDescription('YouTube URL or search text to queue')
        .setRequired(false),
    ),
  new SlashCommandBuilder().setName('tnowplaying').setDescription('Show the current track.'),
].map((command) => command.toJSON());

// Send the command list to every server ID listed in GUILD_IDS.
async function main() {
  const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
  const guildIds = GUILD_IDS.split(',').map((id) => id.trim()).filter(Boolean);

  console.log(`Deploying ${commands.length} commands to ${guildIds.length} server(s)`);
  
  for (const guildId of guildIds) {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, guildId), { body: commands });
    console.log(`Commands deployed to guild ${guildId}.`);
  }

  console.log('Done. Commands should appear within a minute.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
