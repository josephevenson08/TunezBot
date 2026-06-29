require('dotenv').config();

// This script registers the bot's slash commands with one Discord server.
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

// These values come from .env.
const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error('Missing DISCORD_TOKEN, CLIENT_ID, or GUILD_ID in .env');
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
  new SlashCommandBuilder().setName('treplay').setDescription('Replay the previous track.'),
  new SlashCommandBuilder().setName('tclear').setDescription('Clear queued songs.'),
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

// Send the command list to Discord for the configured server.
async function main() {
  const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

  console.log(`Deploying ${commands.length} guild commands...`);
  await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
  console.log('Commands deployed. They should appear in your server within a minute.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
