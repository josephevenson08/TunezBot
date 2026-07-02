require('dotenv').config();

// Import the Discord bot tools, music player, YouTube extractor, and yt-dlp wrapper.
const { Client, Events, GatewayIntentBits, ActivityType } = require('discord.js');
const { Player, GuildQueueEvent, QueueRepeatMode } = require('discord-player');
const { YoutubeExtractor } = require('discord-player-youtubei');
const youtubeDl = require('youtube-dl-exec');

// Pull the bot token from .env so it is not hard-coded in the source code.
const { DISCORD_TOKEN } = process.env;

if (!DISCORD_TOKEN) {
  console.error('Missing DISCORD_TOKEN in .env');
  process.exit(1);
}

// Create the Discord client. GuildVoiceStates is required for voice channel/music features.
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

// Create one music player for the bot and track the activity update timer.
const player = new Player(client);
let activityInterval = null;
let sessionHistory = [];
const artistModes = new Map();

// Use yt-dlp to get a direct playable YouTube audio stream.
async function createYoutubeStream(track) {
  const output = await youtubeDl(track.url, {
    getUrl: true,
    format: track.live ? 'best[height<=360]' : 'bestaudio',
    noWarnings: true,
    noProgress: true,
  });

  return String(output).trim().split(/\r?\n/)[0];
}

// Music player events handle messages and bot status while tracks play.
player.events.on(GuildQueueEvent.PlayerStart, (queue, track) => {
  queue.metadata?.send(`Now playing: **${track.cleanTitle || track.title}**`).catch(() => {});


  sessionHistory.push(track);
  sessionHistory = sessionHistory.slice(-50);//prevent it from growing forever

  updateBotActivity(queue);

  clearInterval(activityInterval);
  activityInterval = setInterval(() => {
    updateBotActivity(queue);
  }, 3000);
});

player.events.on(GuildQueueEvent.AudioTracksAdd, (queue, tracks) => {
  queue.metadata?.send(`Queued **${tracks.length}** tracks.`).catch(() => {});
});

player.events.on(GuildQueueEvent.EmptyQueue, async (queue) => {
  const artist = artistModes.get(queue.guild.id);

  if (artist) {
    try {
      const track = await playArtistTrack(queue, artist);

      if (track) {
        queue.metadata?.send(`Artist mode: **${trackTitle(track)}**`).catch(() => {});
        return;
      }
    } catch (error) {
      console.error(error);
      queue.metadata?.send(`Artist mode could not find another **${artist}** song.`).catch(() => {});
    }
  }

  queue.metadata?.send('Queue finished.').catch(() => {});

  clearInterval(activityInterval);
  activityInterval = null;

  client.user.setPresence({ activities: [], status: 'online' });
});

player.events.on(GuildQueueEvent.Error, (queue, error) => {
  console.error(error);
  queue.metadata?.send(`Playback error: ${error.message}`).catch(() => {});
});

player.events.on(GuildQueueEvent.PlayerError, (queue, error) => {
  console.error(error);
  queue.metadata?.send(`Track error: ${error.message}`).catch(() => {});
});

// Clear voice-session state when the bot leaves voice.
player.events.on(GuildQueueEvent.Disconnect, (queue) => { 
  sessionHistory = [];
  artistModes.delete(queue.guild.id);
  
  clearInterval(activityInterval);
  activityInterval = null;

  client.user.setPresence({ activities: [], status: 'online' });
});

// Convert milliseconds into m:ss text for the bot's activity status.
function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms <= 0) {
    return '0:00';
  }

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;   
}

// Show "Song Name current / total" as the bot's Discord activity.
function updateBotActivity(queue) {
  const track = queue?.currentTrack;

  if (!track) {
    client.user.setPresence({ activities: [], status: 'online'});
    return;
  }

  const timestamp = queue.node.getTimestamp();
  const current = timestamp?.current?.label || '0:00';
  const total = timestamp?.total?.label || formatDuration(track.durationMS);

  client.user.setActivity(`${trackTitle(track)} ${current} / ${total}`, {
    type: ActivityType.Listening,
  })
}

// Get the current music queue for the server where the command was used.
function getQueue(interaction) {
  return player.nodes.get(interaction.guildId);
}

// Make sure the user is in voice, and if the bot is already in voice, it is the same channel.
function ensureVoiceChannel(interaction) {
  const channel = interaction.member?.voice?.channel;

  if (!channel) {
    return null;
  }

  if (
    interaction.guild.members.me?.voice.channelId &&
    interaction.guild.members.me.voice.channelId !== channel.id
  ) {
    return null;
  }

  return channel;
}

// Safely choose a readable track title.
function trackTitle(track) {
  return track?.cleanTitle || track?.title || 'Unknown track';
}

// Clean up pasted YouTube links, Discord markdown links, and youtu.be playlist URLs.
function normalizePlayQuery(query) {
  const trimmed = query.trim();
  const markdownLink = trimmed.match(/^\[([^\]]+)]\((https?:\/\/[^)]+)\)$/i);
  const normalized = markdownLink ? markdownLink[2] : trimmed.replace(/^<(.+)>$/, '$1');

  try {
    const url = new URL(normalized);
    const hostname = url.hostname.replace(/^www\./, '');
    const isYoutube = hostname === 'youtube.com' || hostname === 'music.youtube.com';
    const isShortYoutube = hostname === 'youtu.be';

    if (isYoutube || isShortYoutube) {
      const videoId = isShortYoutube ? url.pathname.slice(1).split('/')[0] : url.searchParams.get('v');

      if (videoId) {
        return `https://www.youtube.com/watch?v=${videoId}`;
      }
    }
  } catch {
    // Plain search text is fine.
  }

  return normalized;
}

// Discord Player stores queued songs in a custom queue object, so normalize it to an array.
function queuedTracks(queue) {
  if (typeof queue.tracks.toArray === 'function') {
    return queue.tracks.toArray();
  }

  return queue.tracks.store || [];
}

// Shared playback options used when starting or queueing music.
function playerNodeOptions(channel) {
  return {
    metadata: channel,
    leaveOnEmpty: true,
    leaveOnEnd: true,
    leaveOnEndCooldown: 300000,
    leaveOnStop: true,
    selfDeaf: false,
    volume: 70,
  };
}

// Find and play another YouTube result for the artist currently in artist mode.
async function playArtistTrack(queue, artist) {
  const channel = queue.channel;

  if (!channel) {
    return null;
  }

  const searchTerms = [
    `${artist} official audio`,
    `${artist} official music video`,
    `${artist} songs`,
    `${artist} lyrics`,
  ];
  const query = searchTerms[Math.floor(Math.random() * searchTerms.length)];

  const result = await player.play(channel, query, {
    nodeOptions: playerNodeOptions(queue.metadata),
  });

  return result.track;
}

// Load the YouTube extractor once the bot is logged in and ready.
client.once(Events.ClientReady, async (readyClient) => {
  await player.extractors.register(YoutubeExtractor, {
    createStream: createYoutubeStream,
  });
  console.log(`Logged in as ${readyClient.user.tag}`);
});

// Main slash command router. Every Discord command ends up in this event.
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand() || !interaction.inGuild()) {
    return;
  }

  const { commandName } = interaction;

  if (commandName === 'tplay') {
    // /tplay replaces the current song, but saves and restores the upcoming queue.
    const channel = ensureVoiceChannel(interaction);
    if (!channel) {
      await interaction.reply({
        content: 'Join the same voice channel as the bot first.',
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply();

    try {
      const query = normalizePlayQuery(interaction.options.getString('query', true));
      const existingQueue = getQueue(interaction);
      const preservedTracks =
        existingQueue && !existingQueue.deleted ? queuedTracks(existingQueue) : [];

      if (existingQueue && !existingQueue.deleted) {
        existingQueue.delete();
      }

      const result = await player.play(channel, query, {
        requestedBy: interaction.user,
        nodeOptions: playerNodeOptions(interaction.channel),
      });

      if (preservedTracks.length > 0) {
        result.queue.addTrack(preservedTracks);
      }

      await interaction.followUp(`Playing: **${trackTitle(result.track)}**`);
    } catch (error) {
      console.error(error);
      await interaction.followUp(`Could not play that: ${error.message}`);
    }

    return;
  }

  if (commandName === 'tartist') {
    const channel = ensureVoiceChannel(interaction);
    if (!channel) {
      await interaction.reply({
        content: 'Join the same voice channel as the bot first.',
        ephemeral: true,
      });
      return;
    }

    const artist = interaction.options.getString('artist', true);
    artistModes.set(interaction.guildId, artist);

    await interaction.deferReply();

    try {
      const result = await player.play(channel, `${artist} official audio`, {
        requestedBy: interaction.user,
        nodeOptions: playerNodeOptions(interaction.channel),
      });

      await interaction.followUp(
        `Artist mode started for **${artist}**. Added: **${trackTitle(result.track)}**`,
      );
    } catch (error) {
      console.error(error);
      artistModes.delete(interaction.guildId);
      await interaction.followUp(`Could not start artist mode: ${error.message}`);
    }

    return;
  }

  if (commandName === 'tstopartist') {
    artistModes.delete(interaction.guildId);
    await interaction.reply('Artist mode stopped.');
    return;
  }

  const queue = getQueue(interaction);

  if (commandName === 'tqueue') {
    // /tqueue with text adds a song; /tqueue with no text displays the queue.
    const query = interaction.options.getString('query', false);

    if (query) {
      if (!queue || queue.deleted || !queue.currentTrack) {
        await interaction.reply({
          content: 'Start a song with `/tplay` first, then use `/tqueue` to add the next one.',
          ephemeral: true,
        });
        return;
      }

      const channel = ensureVoiceChannel(interaction);
      if (!channel) {
        await interaction.reply({
          content: 'Join the same voice channel as the bot first.',
          ephemeral: true,
        });
        return;
      }

      await interaction.deferReply();

      try {
        const result = await player.play(channel, normalizePlayQuery(query), {
          requestedBy: interaction.user,
          nodeOptions: playerNodeOptions(interaction.channel),
        });

        await interaction.followUp(`Queued: **${trackTitle(result.track)}**`);
      } catch (error) {
        console.error(error);
        await interaction.followUp(`Could not queue that: ${error.message}`);
      }

      return;
    }

    if (!queue || queue.deleted) {
      await interaction.reply({ content: 'Nothing is playing right now.', ephemeral: true });
      return;
    }

    const current = queue.currentTrack;
    const upcoming = queuedTracks(queue).slice(0, 10);
    const lines = [
      current ? `Now: **${trackTitle(current)}**` : 'Now: nothing',
      ...upcoming.map((track, index) => `${index + 1}. ${trackTitle(track)}`),
    ];

    await interaction.reply(lines.join('\n'));
    return;
  }

  if (!queue || queue.deleted) {
    await interaction.reply({ content: 'Nothing is playing right now.', ephemeral: true });
    return;
  }

  if (commandName === 'tloop') {
    if (!queue.currentTrack) {
      await interaction.reply('Nothing is playing right now');
      return;
    }

    queue.setRepeatMode(QueueRepeatMode.TRACK);
    await interaction.reply(`Looping **${trackTitle(queue.currentTrack)}**`);
    return;
  }

  if (commandName === 'tstoploop') {
    queue.setRepeatMode(QueueRepeatMode.OFF);
    await interaction.reply('Loop stopped. The queue will continue after this song.');
    return;
  }
  
  if (commandName === 'tskip') {
    // Only skip when there is another song ready to play next.
    if (queuedTracks(queue).length < 1) {
      await interaction.reply('There is no next track queued.');
      return;
    }

    const skipped = queue.node.skip();
    await interaction.reply(skipped ? 'Skipped.' : 'There was nothing to skip.');
    return;
  }

  if (commandName === 'treplay') {
    // Replay the previous song from Discord Player's history.
    const previous = queue.history.previousTrack;

    if (!previous) {
      await interaction.reply('There is no previous track to replay.');
      return;
    }

    await interaction.deferReply();

    try {
      await queue.history.previous(false);
      await interaction.followUp(`Replaying: **${trackTitle(previous)}**`);
    } catch (error) {
      console.error(error);
      await interaction.followUp(`Could not replay that: ${error.message}`);
    }

    return;
  }

  if (commandName === 'trandom') {
    const candidates = sessionHistory.filter((track) => track.id !== queue.currentTrack?.id);

    if (candidates.length < 1) {
      await interaction.reply('No previous session songs to choose from yet.');
      return;
    }

    const randomTrack = candidates[Math.floor(Math.random() * candidates.length)];

    await interaction.deferReply();

    try {
      await queue.node.play(randomTrack, { queue: false });
      await interaction.followUp(`Random replay: **${trackTitle(randomTrack)}**`);
    } catch (error) {
      console.error(error);
      await interaction.followUp(`Could not play a random song: ${error.message}`);
    }

    return;
  }

  if (commandName === 'tclear') {
    // Clear upcoming songs without stopping the current song.
    const count = queuedTracks(queue).length;

    if (count < 1) {
      await interaction.reply('There are no queued songs to clear.');
      return;
    }

    queue.clear();
    await interaction.reply(`Cleared ${count} queued song${count === 1 ? '' : 's'}.`);
    return;
  }

  if (commandName === 'tstop') {
    // Stop playback completely and remove the whole queue.
    queue.delete();
    await interaction.reply('Stopped playback and cleared the queue.');
    return;
  }

  if (commandName === 'tpause') {
    // Pause the current track.
    const paused = queue.node.pause();
    await interaction.reply(paused ? 'Paused.' : 'Playback is already paused.');
    return;
  }

  if (commandName === 'tresume') {
    // Resume a paused track.
    const resumed = queue.node.resume();
    await interaction.reply(resumed ? 'Resumed.' : 'Playback is not paused.');
    return;
  }

  if (commandName === 'tnowplaying') {
    // Show the current song and Discord Player's progress bar.
    const current = queue.currentTrack;
    const timestamp = queue.node.createProgressBar();
    await interaction.reply(
      current ? `Now playing: **${trackTitle(current)}**\n${timestamp || ''}` : 'Nothing is playing.',
    );
    return;
  }

});

client.login(DISCORD_TOKEN);
