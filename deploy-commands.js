require('dotenv').config();

const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error('Missing DISCORD_TOKEN, CLIENT_ID, or GUILD_ID in .env');
  process.exit(1);
}

const commands = [
  new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song, playlist, or search query.')
    .addStringOption((option) =>
      option
        .setName('query')
        .setDescription('YouTube URL or search text')
        .setRequired(true),
    ),
  new SlashCommandBuilder().setName('skip').setDescription('Skip the current track.'),
  new SlashCommandBuilder().setName('replay').setDescription('Replay the previous track.'),
  new SlashCommandBuilder().setName('stop').setDescription('Stop playback and clear the queue.'),
  new SlashCommandBuilder().setName('pause').setDescription('Pause playback.'),
  new SlashCommandBuilder().setName('resume').setDescription('Resume playback.'),
  new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Add a song to the queue or show the current queue.')
    .addStringOption((option) =>
      option
        .setName('query')
        .setDescription('YouTube URL or search text to queue')
        .setRequired(false),
    ),
  new SlashCommandBuilder().setName('nowplaying').setDescription('Show the current track.'),
].map((command) => command.toJSON());

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
