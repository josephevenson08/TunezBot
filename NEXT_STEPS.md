# TunezBot Next Steps

Notes from a conversation with my professor about keeping TunezBot working when YouTube refuses to serve it. Keywords he mentioned: **proxies, validating cookies for requests, HTTP requests, curl/wget**.

## Where things stand (Aug 18)

The bot stopped playing music. What the Aug 18 testing showed:

```text
rick astley        0 bytes
fortunate son      0 bytes
"me at the zoo"    252,182 bytes
```

- **The Pi's IP is not blocked.** An unrestricted upload downloads fine.
- **Commercial music is being refused**, with `403 Forbidden` on the media fetch.
- yt-dlp is already the latest stable release, and `--no-cache-dir` and six different player clients all still gave 0 bytes.

So the question is not "how do I hide my IP," it is "how do I make my requests look like a real, signed-in viewer." That changes the order of the professor's keywords: **cookies come first, proxies are a fallback.**

## 1. Understand the HTTP requests involved

Every search and every song is an HTTP request to YouTube. Things to understand:

- [ ] **Status codes:** `200` OK, `403` forbidden (what we are getting now), `429` rate limited
- [ ] **Request headers:** `User-Agent` and `Cookie`. These are what YouTube looks at to decide whether you are a browser or a bot
- [ ] **Response headers:** `Set-Cookie`, `Retry-After`
- [ ] Why a **signed-in** request can get music that an anonymous request cannot

## 2. Use curl and the yt-dlp binary to diagnose

Keep the Aug 18 approach of testing with Discord removed entirely. These run on the Pi from the TunezBot folder.

- [ ] Check that the Pi can reach YouTube and see the status code:

```bash
curl -I https://www.youtube.com
```

- [ ] Byte-count test, with the same flags the bot uses. 0 means refused:

```bash
./node_modules/youtube-dl-exec/bin/yt-dlp --js-runtimes node --no-cache-dir -f bestaudio -o - "https://www.youtube.com/watch?v=dQw4w9WgXcQ" | wc -c
```

- [ ] Run the same test with `--cookies cookies.txt` added (after step 3). **If the byte count goes from 0 to millions, cookies are the fix.**
- [ ] Only if the control video ("me at the zoo") also starts failing, test a proxy with curl before touching the bot:

```bash
curl -x http://proxyhost:port -I https://www.youtube.com
```

`wget` does similar things to curl but is mostly used for downloading files.

## 3. Add optional cookie support (main fix to try)

- [ ] Add `cookies.txt` to `.gitignore` **before** the file exists in the project. It is a secret, like the Discord token
- [ ] Create a **throwaway Google account** for the bot. Do not use a personal account, because accounts used this way can get flagged
- [ ] Export that account's YouTube cookies to `cookies.txt` (Netscape format). yt-dlp's docs recommend exporting from a private/incognito window and then closing it, because YouTube rotates cookies on open browser sessions and the exported ones stop working
- [ ] Copy `cookies.txt` to the Pi with `scp`, not through git
- [ ] Run the byte-count test from step 2 with `--cookies cookies.txt`
- [ ] If it works, add a `YTDLP_COOKIES_FILE` setting to `.env` and `.env.example`
- [ ] Pass it as the `cookies` option to both yt-dlp calls in `index.js` (`spawnYoutubeDl` and `searchYoutube`), only when the setting is filled in

### Validating the cookies

Cookies expire or get revoked, and the failure looks exactly like today's: 0 bytes and a 403. The bot should say so instead of making me diagnose it again.

- [ ] On startup, run the byte-count check against one known commercial track and kill yt-dlp once some audio arrives
- [ ] If nothing arrives, log a clear warning like `YouTube cookies look expired or rejected, re-export cookies.txt`
- [ ] Do not just check that the file exists. A `--simulate` lookup can succeed while the actual download still gets 0 bytes, so only real bytes prove the cookies work

## 4. Proxy support (fallback, probably not needed)

A proxy sends the bot's requests out through a different IP address. The Pi is on home internet with a residential IP, and Aug 18 showed that IP is not blocked, so a proxy should not change anything right now.

- [ ] Only revisit this if unrestricted videos start failing too, or if the bot moves to a cloud host again (see the AWS hosting postmortem in the vault)
- [ ] If needed: add `YTDLP_PROXY` to `.env` and `.env.example` and pass it as the `proxy` option to the yt-dlp calls

## 5. Record it

- [ ] Add a "Troubleshooting YouTube blocks" section to `RASPBERRY_PI_SETUP.md` with the byte-count test and the cookie refresh steps
- [ ] Mention the new optional `.env` settings in `README.md`
- [ ] Write up the result in the `TunezBot-Brain` vault, including whether cookies worked or not

## Things to keep in mind

- This bot depends on a platform that actively works to stop exactly what it does, so it will break again sometimes. Cookies are another way it can fail, not a permanent fix, which is why validation matters.
- Getting around YouTube's bot detection is a gray area under YouTube's Terms of Service. It's fine for a personal one-server bot, but worth knowing.
- Never commit `cookies.txt`, proxy credentials, or the Discord token.

## Suggested order

1. Read up on HTTP status codes and headers
2. Run the byte-count test on the Pi to confirm music is still refused
3. Export cookies from a throwaway account and rerun the test with `--cookies`
4. If that works, wire cookies into the bot and add the startup validation
5. Leave proxies alone unless the control video starts failing
6. Update the docs and the vault
