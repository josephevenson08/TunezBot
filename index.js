require('dotenv').config();

const { Client, Events, GatewayIntentBits } = require('discord.js');
const { Player, GuildQueueEvent } = require('discord-player');
const { YoutubeExtractor } = require('discord-player-youtubei');

const { DISCORD_TOKEN } = process.env;

if (!DISCORD_TOKEN) {
  console.error('Missing DISCORD_TOKEN in .env');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

const player = new Player(client);

player.events.on(GuildQueueEvent.PlayerStart, (queue, track) => {
  queue.metadata?.send(`Now playing: **${track.cleanTitle || track.title}**`).catch(() => {});
});

player.events.on(GuildQueueEvent.AudioTracksAdd, (queue, tracks) => {
  queue.metadata?.send(`Queued **${tracks.length}** tracks.`).catch(() => {});
});

player.events.on(GuildQueueEvent.EmptyQueue, (queue) => {
  queue.metadata?.send('Queue finished.').catch(() => {});
});

player.events.on(GuildQueueEvent.Error, (queue, error) => {
  console.error(error);
  queue.metadata?.send(`Playback error: ${error.message}`).catch(() => {});
});

player.events.on(GuildQueueEvent.PlayerError, (queue, error) => {
  console.error(error);
  queue.metadata?.send(`Track error: ${error.message}`).catch(() => {});
});

function getQueue(interaction) {
  return player.nodes.get(interaction.guildId);
}

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

function trackTitle(track) {
  return track?.cleanTitle || track?.title || 'Unknown track';
}

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

function queuedTracks(queue) {
  if (typeof queue.tracks.toArray === 'function') {
    return queue.tracks.toArray();
  }

  return queue.tracks.store || [];
}

function playerNodeOptions(channel) {
  return {
    metadata: channel,
    leaveOnEmpty: true,
    leaveOnEnd: true,
    leaveOnEndCooldown: 120000,
    leaveOnStop: true,
    volume: 70,
  };
}

client.once(Events.ClientReady, async (readyClient) => {
  await player.extractors.register(YoutubeExtractor, {});
  console.log(`Logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand() || !interaction.inGuild()) {
    return;
  }

  const { commandName } = interaction;

  if (commandName === 'play') {
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
      const result = await player.play(channel, query, {
        requestedBy: interaction.user,
        nodeOptions: playerNodeOptions(interaction.channel),
      });

      await interaction.followUp(`Added: **${trackTitle(result.track)}**`);
    } catch (error) {
      console.error(error);
      await interaction.followUp(`Could not play that: ${error.message}`);
    }

    return;
  }

  const queue = getQueue(interaction);

  if (commandName === 'queue') {
    const query = interaction.options.getString('query', false);

    if (query) {
      if (!queue || queue.deleted || !queue.currentTrack) {
        await interaction.reply({
          content: 'Start a song with `/play` first, then use `/queue` to add the next one.',
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

  if (commandName === 'skip') {
    if (queuedTracks(queue).length < 1) {
      await interaction.reply('There is no next track queued.');
      return;
    }

    const skipped = queue.node.skip();
    await interaction.reply(skipped ? 'Skipped.' : 'There was nothing to skip.');
    return;
  }

  if (commandName === 'stop') {
    queue.delete();
    await interaction.reply('Stopped playback and cleared the queue.');
    return;
  }

  if (commandName === 'pause') {
    const paused = queue.node.pause();
    await interaction.reply(paused ? 'Paused.' : 'Playback is already paused.');
    return;
  }

  if (commandName === 'resume') {
    const resumed = queue.node.resume();
    await interaction.reply(resumed ? 'Resumed.' : 'Playback is not paused.');
    return;
  }

  if (commandName === 'nowplaying') {
    const current = queue.currentTrack;
    const timestamp = queue.node.createProgressBar();
    await interaction.reply(
      current ? `Now playing: **${trackTitle(current)}**\n${timestamp || ''}` : 'Nothing is playing.',
    );
    return;
  }

});

client.login(DISCORD_TOKEN);
