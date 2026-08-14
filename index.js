require('dotenv').config();

// Import the Discord bot tools, music player, YouTube extractor, and yt-dlp wrapper.
const { Client, Events, GatewayIntentBits, ActivityType } = require('discord.js');
const { Player, GuildQueueEvent, QueueRepeatMode } = require('discord-player');
const { YoutubeExtractor } = require('discord-player-youtubei');
const youtubeDl = require('youtube-dl-exec');

// Pull the bot token from .env.example so it is not hard-coded in the executable source code.
const { DISCORD_TOKEN } = process.env;

// check to make sure that the DISCORD_TOKEN is present in the .env.example file, if not, present an error to the end user and exit out of process with a log.
if (!DISCORD_TOKEN) {
  console.error('Missing DISCORD_TOKEN in .env');
  process.exit(1);
}

// Log any other errors instead of having no reasonable output, useful for troubleshooting.
// The event name must stay exactly 'unhandledRejection' — that string is Node's, not mine,
// so it cannot be reworded. Renaming it to 'unknownRejection' silently unregistered this
// handler, and one expired Discord interaction then took the whole bot offline.
process.on('unhandledRejection', (reason) => {
  console.error('Unknown rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

// Create the Discord client. 
// GatewayIntentBits.Guilds is used for explicitly giving the bot permission to access channels, roles, and actions.
// GatewayIntentBits.GuildVoiceStates is required for voice channel/music features like connection and disconnection.
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

// Create one music player for the bot.
const player = new Player(client);

// Per-guild state, all keyed by guild ID so multiple servers never share state.
// Used to store per instance states
const activityIntervals = new Map();
const sessionHistories = new Map();
const artistModes = new Map();

// Get (and lazily create) the play history array for a guild/discord server. 
// Useful to allow users to do repetitive actions for the bot.
function getSessionHistory(guildId) {
  if (!sessionHistories.has(guildId)) {
    sessionHistories.set(guildId, []);
  }

  return sessionHistories.get(guildId);
}
// ------------------------------------------left off here on 7/28------------------------------------------

// Pipe the audio out of yt-dlp directly, instead of asking it for a URL and handing that
// URL to ffmpeg.
//
// Why this changed. It used to use getUrl and return a link. yt-dlp could fetch that link
// itself, but ffmpeg fetching the same link is a separate request that does not inherit
// yt-dlp's session, and YouTube answers it with 403. ffmpeg then produced zero bytes, and
// discord-player cannot tell an empty stream from a track that finished - so the bot
// announced the song and instantly said "Queue finished", with no error anywhere. That one
// silent failure cost most of a day.
//
// Writing to stdout removes the second request entirely. yt-dlp does all the fetching with
// the session it already has, and ffmpeg just reads bytes off a pipe. Verified on the pi:
// piping delivers the full 3.27MiB.
//
// jsRuntimes matters and is not optional. YouTube guards playback with a JavaScript
// challenge, and yt-dlp needs a JS engine to solve it - it only enables deno by default, so
// this points it at the node already running the bot. Without it, downloads fail 403.
function createYoutubeStream(track) {
  const subprocess = youtubeDl.exec(track.url, {
    output: '-', // write the audio to stdout
    format: track.live ? 'best[height<=360]' : 'bestaudio', // audio only, no video data to throw away
    jsRuntimes: 'node',
    noWarnings: true,
    noProgress: true,
    quiet: true, // keep stderr clean, stdout is carrying audio
  });

  // execa rejects this promise when yt-dlp exits non-zero. Nothing awaits it, so without a
  // catch here a failed track becomes an unhandled rejection instead of a log line.
  subprocess.catch((error) => {
    if (!subprocess.killed) {
      console.error('yt-dlp stream failed:', error.shortMessage || error.message);
    }
  });

  return subprocess.stdout;
}

// Logs how long it takes to hand back a stream. This used to report 5-9 seconds, because
// the old version waited for yt-dlp to finish resolving a URL before anything could start.
// Now that it pipes, this should be a few milliseconds - spawning a process, not waiting on
// one. If this number goes back up, something has gone back to blocking.
async function createYoutubeStreamTimed(track) {
  const startedAt = Date.now();
  try {
    const url = await createYoutubeStream(track);
    console.log(`yt-dlp stream ready in ${Date.now() - startedAt}ms`);
    return url;
  } catch (error) {
    console.error(`yt-dlp failed after ${Date.now() - startedAt}ms:`, error.message);
    throw error;
  }
}

// Music player events handle messages and bot status while tracks play.
player.events.on(GuildQueueEvent.PlayerStart, (queue, track) => {
  queue.metadata?.send(`Now playing: **${track.cleanTitle || track.title}**`).catch(() => {}); // custom message attached

  const guildId = queue.guild.id; // gets guildID
  const history = getSessionHistory(guildId); // gets the history for the guild from the array
  history.push(track); // append the new track to the end of the array
  sessionHistories.set(guildId, history.slice(-50));// prevent it from growing forever

  updateBotActivity(queue); // updates bot activity to show the current track, not dependent on the interval set for updating 

  clearInterval(activityIntervals.get(guildId)); // if it exists, clears the interval
  activityIntervals.set(
    guildId,
    setInterval(() => {
      updateBotActivity(queue);
    }, 3000), // this is the interval i was talking about, every 3 seconds it will update the bot activity to show the progress bar and the current track on this discord page for the bot.
  );
});

// useful for youtube playlists, not just a singular url track
player.events.on(GuildQueueEvent.AudioTracksAdd, (queue, tracks) => {
  queue.metadata?.send(`Queued **${tracks.length}** tracks.`).catch(() => {}); // tells how many tracks were added, + ignores failed message send instead of crashing the bot.
});

player.events.on(GuildQueueEvent.EmptyQueue, async (queue) => {
  // If artist mode is on, keep finding songs by that artist instead of ending.
  const artist = artistModes.get(queue.guild.id);

  // for artist mode, continues to play tracks by the same artist up until the user stops.
  if (artist) {
    try {
      const track = await playArtistTrack(queue, artist);
      // repeats same nature from before
      if (track) {
        queue.metadata?.send(`Artist mode: **${trackTitle(track)}**`).catch(() => {});
        return;
      }
    } catch (error) {
      console.error(error); // reports error to console
      queue.metadata?.send(`Artist mode could not find another **${artist}** song.`).catch(() => {}); // catch for when the bot cant find another song to play by the artist
    }
  }
// ------------------------------------------left off here on 7/29------------------------------------------

  queue.metadata?.send('Queue finished.').catch(() => {}); 

  clearInterval(activityIntervals.get(queue.guild.id));
  activityIntervals.delete(queue.guild.id);

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
  const guildId = queue.guild.id;
  sessionHistories.delete(guildId);
  artistModes.delete(guildId);

  clearInterval(activityIntervals.get(guildId));
  activityIntervals.delete(guildId);

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

// Clean up pasted YouTube links, Discord markdown links, and youtube playlist URLs.
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

// Search YouTube via yt-dlp instead of the extractor's own search. YouTube's search API
// (used internally by the extractor) gets blocked on datacenter/cloud IPs far more
// readily than plain yt-dlp lookups do, so this keeps search working when hosted there.
async function searchYoutube(query, count = 1) {
  const output = await youtubeDl(`ytsearch${count}:${query}`, {
    dumpSingleJson: true,
    flatPlaylist: true,
    noWarnings: true,
    noProgress: true,
  });

  const parsed = typeof output === 'string' ? JSON.parse(output) : output;
  const entries = parsed.entries || [];

  return entries
    .filter((entry) => entry && entry.id)
    .map((entry) => `https://www.youtube.com/watch?v=${entry.id}`);
}

// Turn a /tplay or /tqueue query into a playable URL: pass real links through as-is,
// otherwise resolve plain search text to a URL via searchYoutube.
async function resolveToUrl(rawQuery) {
  const normalized = normalizePlayQuery(rawQuery);

  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  const [url] = await searchYoutube(normalized, 1);

  if (!url) {
    throw new Error('No results found for that search.');
  }

  return url;
}

// Retry a flaky operation once after a short delay. YouTube's extraction occasionally
// fails on the first attempt under bursty automated request patterns; a short pause
// and a single retry often succeeds where an immediate second attempt would not.
async function withRetry(fn, retries = 1, delayMs = 1500) {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return withRetry(fn, retries - 1, delayMs);
  }
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

  // Vary the search phrase a little so artist mode does not always get the same result.
  const query = searchTerms[Math.floor(Math.random() * searchTerms.length)];
  const urls = await searchYoutube(query, 8);

  // Avoid repeating a song this guild already heard this session, if a fresh option exists.
  const recentUrls = new Set(getSessionHistory(queue.guild.id).map((track) => track.url));
  const fresh = urls.filter((url) => !recentUrls.has(url));
  const pool = fresh.length > 0 ? fresh : urls;

  if (pool.length < 1) {
    return null;
  }

  const chosen = pool[Math.floor(Math.random() * Math.min(pool.length, 8))];

  const result = await withRetry(() =>
    player.play(channel, chosen, {
      nodeOptions: playerNodeOptions(queue.metadata),
    }),
  );

  return result.track;
}

// Search phrases used to look up songs related to a seed track's artist.
const RELATED_SEARCH_TEMPLATES = [
  (author) => `${author} mix`,
  (author) => `${author} radio`,
  (author) => `songs like ${author}`,
];

// Search for a different song stylistically related to the given track.
async function findRelatedTrack(guildId, seedTrack) {
  const author = seedTrack.author || seedTrack.title;
  const template = RELATED_SEARCH_TEMPLATES[Math.floor(Math.random() * RELATED_SEARCH_TEMPLATES.length)];

  const urls = await searchYoutube(template(author), 8);
  const recentUrls = new Set(getSessionHistory(guildId).map((track) => track.url));
  const candidates = urls.filter((url) => url !== seedTrack.url && !recentUrls.has(url));

  if (candidates.length < 1) {
    return null;
  }

  return candidates[Math.floor(Math.random() * Math.min(candidates.length, 8))];
}

// Load the YouTube extractor once the bot is logged in and ready.
//
// The createStream override stays. I tried removing it on the theory that it was only
// ever an AWS workaround and the extractor's own youtubei.js path would be fine from a
// residential IP — it would also have saved the 5-9 seconds of python startup that yt-dlp
// costs on this board. It does not work: without the override every track fails with
// NoResultError / ERR_NO_RESULT, which is the same error the AWS attempt hit. So the
// extractor's built-in streaming is broken here for its own reasons, not the IP's, and
// yt-dlp is doing real work rather than papering over something that has since healed.
//
// The cost is real and measured — see the timing wrapper below — but slow beats silent.
client.once(Events.ClientReady, async (readyClient) => {
  try {
    await player.extractors.register(YoutubeExtractor, {
      createStream: createYoutubeStreamTimed,
    });
  } catch (error) {
    console.error('Failed to register the YouTube extractor. Music playback will not work.', error);
    process.exit(1);
  }

  console.log(`Logged in as ${readyClient.user.tag}`);
});

// Main slash command router. Every Discord command ends up here.
// This is a named async function rather than an inline listener so the registration below
// can attach a .catch() to it. Without that, any error a handler does not catch itself
// escapes as a rejected promise that discord.js turns into a crash — which is exactly what
// an expired interaction did on the first live run on the Pi.
async function handleInteraction(interaction) {
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

    // Starting a specific song this way overrides artist mode, if it was on.
    artistModes.delete(interaction.guildId);

    await interaction.deferReply();

    try {
      const query = await resolveToUrl(interaction.options.getString('query', true));
      const existingQueue = getQueue(interaction);

      // Already playing: play the new song right now and leave the queue untouched.
      //
      // Two earlier attempts at this were wrong. Deleting the queue and rebuilding it
      // worked, but queue.delete() triggers leaveOnStop, so the bot dropped out of voice
      // and rejoined on every /tplay — and that rejoin was what timed out with the
      // AbortError. Then insertTrack(track, 0) followed by skip() played the wrong song,
      // because insertTrack appended instead of inserting at the front, so the skip landed
      // on whatever was already queued.
      //
      // node.play(track, { queue: false }) says "play this now, do not queue it", which is
      // exactly what this command means. /trandom already uses it for the same reason.
      if (existingQueue && !existingQueue.deleted && existingQueue.currentTrack) {
        const searchResult = await withRetry(() =>
          player.search(query, { requestedBy: interaction.user }),
        );
        const track = searchResult?.tracks?.[0];

        if (!track) {
          await interaction.followUp('Could not find anything for that.');
          return;
        }

        await withRetry(() => existingQueue.node.play(track, { queue: false }));

        await interaction.followUp(`Playing: **${trackTitle(track)}**`);
        return;
      }

      // Nothing playing, so there is no connection to preserve. Start one.
      const result = await withRetry(() =>
        player.play(channel, query, {
          requestedBy: interaction.user,
          nodeOptions: playerNodeOptions(interaction.channel),
        }),
      );

      await interaction.followUp(`Playing: **${trackTitle(result.track)}**`);
    } catch (error) {
      console.error(error);
      await interaction.followUp(`Could not play that: ${error.message}`);
    }

    return;
  }

  if (commandName === 'tartist') {
    // Start artist mode and immediately add one song by that artist.
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
      const [artistUrl] = await searchYoutube(`${artist} official audio`, 1);

      if (!artistUrl) {
        throw new Error('No results found for that artist.');
      }

      const result = await withRetry(() =>
        player.play(channel, artistUrl, {
          requestedBy: interaction.user,
          nodeOptions: playerNodeOptions(interaction.channel),
        }),
      );

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

  // server stop for artistmode
  if (commandName === 'tstopartist') {
    // Stop artist mode for this server only.
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
        const resolvedUrl = await resolveToUrl(query);
        const result = await withRetry(() =>
          player.play(channel, resolvedUrl, {
            requestedBy: interaction.user,
            nodeOptions: playerNodeOptions(interaction.channel),
          }),
        );

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

  // loop current song
  if (commandName === 'tloop') {
    if (!queue.currentTrack) {
      await interaction.reply('Nothing is playing right now'); //check if nothing is playing
      return;
    }

    queue.setRepeatMode(QueueRepeatMode.TRACK);
    await interaction.reply(`Looping **${trackTitle(queue.currentTrack)}**`); //show what song is being looped
    return;
  }

  // stop looping current song
  if (commandName === 'tstoploop') {
    queue.setRepeatMode(QueueRepeatMode.OFF);
    await interaction.reply('Loop stopped. The queue will continue after this song.'); 
    return;
  }

  // tskip function, skips current song playing
  if (commandName === 'tskip') {
    const artist = artistModes.get(interaction.guildId);

    // Nothing queued: in artist mode, fetch a fresh pick instead of refusing.
    if (queuedTracks(queue).length < 1) {
      if (!artist) {
        await interaction.reply('There is no next track queued.');
        return;
      }

      await interaction.deferReply();

      try {
        const track = await playArtistTrack(queue, artist);

        if (!track) {
          await interaction.followUp(`Could not find another **${artist}** song to skip to.`); //catch
          return;
        }

        queue.node.skip();
        await interaction.followUp(`Skipped. Artist mode: **${trackTitle(track)}**`); //shown what is skipped
      } catch (error) {
        console.error(error);
        await interaction.followUp(`Could not find another **${artist}** song: ${error.message}`); //fallback
      }

      return;
    }

    const skipped = queue.node.skip();
    await interaction.reply(skipped ? 'Skipped.' : 'There was nothing to skip.');
    return;
  }

  // replay function, if song ends and we want to replay the song, this does it. nothing can be queued 
  if (commandName === 'treplay') {
    // Replay the previous song from Discord Player's history.
    const previous = queue.history.previousTrack;

    if (!previous) {
      await interaction.reply('There is no previous track to replay.'); //catch
      return;
    }

    await interaction.deferReply();

    try {
      await queue.history.previous(false);
      await interaction.followUp(`Replaying: **${trackTitle(previous)}**`); //showing what is replayed
    } catch (error) {
      console.error(error);
      await interaction.followUp(`Could not replay that: ${error.message}`); //error log for replaying
    }

    return;
  }

  if (commandName === 'trandom') {
    const candidates = getSessionHistory(interaction.guildId).filter(
      (track) => track.id !== queue.currentTrack?.id,
    );

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
    // Stop playback completely, remove the whole queue, and cancel artist mode.
    artistModes.delete(interaction.guildId);
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
    // Show the current song, progress bar, and any active modes.
    const current = queue.currentTrack;

    if (!current) {
      await interaction.reply('Nothing is playing.');
      return;
    }

    const progressBar = queue.node.createProgressBar();
    const requester = current.requestedBy ? ` (requested by ${current.requestedBy})` : '';
    const loopLine = queue.repeatMode === QueueRepeatMode.TRACK ? '\nLooping this track.' : '';
    const artist = artistModes.get(interaction.guildId);
    const artistLine = artist ? `\nArtist mode: **${artist}**` : '';
    const upcomingCount = queuedTracks(queue).length;
    const queueLine = upcomingCount > 0 ? `\n${upcomingCount} song${upcomingCount === 1 ? '' : 's'} queued next.` : '';

    await interaction.reply(
      `Now playing: **${trackTitle(current)}**${requester}\n${progressBar || ''}${loopLine}${artistLine}${queueLine}`,
    );
    return;
  }

  if (commandName === 'tremove') {
    // Remove one queued song by its displayed position (1-based, matches /tqueue's list).
    const position = interaction.options.getInteger('position', true);
    const tracks = queuedTracks(queue);

    if (position < 1 || position > tracks.length) {
      await interaction.reply({
        content:
          tracks.length > 0
            ? `Give a position between 1 and ${tracks.length}.`
            : 'There are no queued songs to remove.',
        ephemeral: true,
      });
      return;
    }

    const removed = queue.node.remove(position - 1);

    await interaction.reply(
      removed ? `Removed **${trackTitle(removed)}** from the queue.` : 'Could not remove that track.',
    );
    return;
  }

  if (commandName === 'thistory') {
    // List the most recently played songs from this voice session.
    const history = getSessionHistory(interaction.guildId);

    if (history.length < 1) {
      await interaction.reply('No songs have been played yet this session.');
      return;
    }

    const recent = history.slice(-15).reverse();
    const lines = recent.map((track, index) => {
      const nowPlayingMarker = queue.currentTrack?.id === track.id ? ' (now playing)' : '';
      return `${index + 1}. ${trackTitle(track)}${nowPlayingMarker}`;
    });

    await interaction.reply(lines.join('\n'));
    return;
  }

  if (commandName === 'trelated') {
    // Find and queue a song related to the one currently playing.
    if (!queue.currentTrack) {
      await interaction.reply('Nothing is playing right now.');
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
      const seed = queue.currentTrack;
      const related = await findRelatedTrack(interaction.guildId, seed);

      if (!related) {
        await interaction.followUp(`Could not find a song related to **${trackTitle(seed)}**.`);
        return;
      }

      const result = await withRetry(() =>
        player.play(channel, related, {
          requestedBy: interaction.user,
          nodeOptions: playerNodeOptions(interaction.channel),
        }),
      );

      await interaction.followUp(
        `Related to **${trackTitle(seed)}** — queued: **${trackTitle(result.track)}**`,
      );
    } catch (error) {
      console.error(error);
      await interaction.followUp(`Could not find a related song: ${error.message}`);
    }

    return;
  }

}

// One safety net for every command. A command that fails should log and leave the bot
// running, never take the process down. 10062 "Unknown interaction" is the common one:
// Discord only allows 3 seconds to acknowledge a command, and a slow reply misses it.
client.on(Events.InteractionCreate, (interaction) => {
  // Discord stamps every interaction with a creation time and then gives us 3 seconds to
  // acknowledge it. Recording how old one already was when it reached this line is what
  // separates "the event arrived late" from "our reply was slow" — the two look identical
  // from the outside, and both show up as 10062 Unknown interaction.
  const ageOnArrival = Date.now() - interaction.createdTimestamp;

  handleInteraction(interaction).catch((error) => {
    const name = interaction.isChatInputCommand() ? `/${interaction.commandName}` : 'interaction';
    console.error(
      `Interaction handler error on ${name} (${ageOnArrival}ms old on arrival, ${Date.now() - interaction.createdTimestamp}ms by failure):`,
      error,
    );
  });
});

// discord.js reports client-level problems here. Without a listener, an emitted 'error'
// is rethrown and crashes the process.
client.on('error', (error) => {
  console.error('Discord client error:', error);
});

client.login(DISCORD_TOKEN).catch((error) => {
  console.error('Failed to log in to Discord. Check DISCORD_TOKEN in .env.', error);
  process.exit(1);
});
