/**
 * The prompt a person pastes into Claude (Cowork or Claude Code, with the
 * Claude Chrome extension) to have it fetch their LinkedIn archive and hand
 * it to ApplyMaster.
 *
 * Claude only moves the file. It never unzips or reads the archive: the
 * ApplyMaster page reads it in the browser. And the import page, opened with
 * via=claude, shows only a count — not names or companies — so nothing in
 * the person's network appears in Claude's screenshots either.
 */
export function claudeImportPrompt(origin: string) {
  const upload = `${origin}/network?import=linkedin&step=upload&via=claude`
  return `To get your LinkedIn connections into ApplyMaster without doing it by hand, paste this into Claude Cowork or Claude Code and leave your computer on.

Claude never opens or reads your LinkedIn archive. It only hands the file to ApplyMaster, which reads it in your browser, and the import page it uses shows only a count — so none of your connections are ever seen by the model.


## Instructions for Claude

Everything from here down is addressed to you, the agent.

Own the whole job: request my LinkedIn data archive, wait for it, download it, and upload it to ApplyMaster. After the one-time setup in Phase 0, I should not have to do anything — no checking, no clicking, no decisions. Keep questions and interruptions to the absolute minimum.


## Phase 0: One-time setup

First tell me you are gathering a few permissions so you can fetch my LinkedIn archive and give it to ApplyMaster, and that everything after that runs on its own.

- Check that you can list my Downloads folder, where the archive will land, and that you can stage a file from Downloads into this session (file uploads only accept session-staged files, not raw device paths).
- Check for the Claude Chrome extension. If it is missing, just tell me to install it from https://chromewebstore.google.com/detail/claude/fcoeoabgfenejglbffodgkkbkcdhcgfn — no further detail. If only one browser is available, use it without asking.
- Open two tabs at once: ${upload} and https://www.linkedin.com/mypreferences/d/download-my-data. Check I am signed in to both. Ask me to sign in only if I am not.

Treat these as already approved, so you never stop mid-run to ask:
- Requesting the archive from LinkedIn.
- Downloading it.
- Uploading it to ApplyMaster and clicking the "Import … connections" button.

What still stops you, always: anything needing my password, a CAPTCHA, or a two-factor code. LinkedIn sometimes asks for a password to confirm an archive request. If it does, tell me, let me do only that step, then carry on automatically.


## Phase 1: Request the archive

Go to https://www.linkedin.com/mypreferences/d/download-my-data.

First check what is already there. If an archive is ready to download, use it and skip to Phase 3.

Otherwise select "Download larger data archive, including connections, verifications, contacts, account history…" — the complete export, not the category picker, which leaves connections out. Then click Request archive. Click elements by reference, not screen coordinates; this page reflows and coordinate clicks silently miss.

Note LinkedIn's stated wait (often "about 24 hours"); it sets the deadline in Phase 5.

If the request fails with "Something went wrong. Try refreshing the page.", reload and retry up to 3 times with a short pause. If it still fails, check whether a recent or pending archive already exists. Only if all of that fails, tell me the request is not going through and stop. Do not loop.


## Phase 2: Wait for it

Right after requesting, set two recurring wake-ups in this conversation:
- every 10 minutes, ending after 50 minutes;
- every hour, with no end — turn it off once the import is done.

Each time you check, refresh the LinkedIn page first; its state does not update until the page is reloaded.


## Phase 3: Download

Download the archive to Downloads and note its filename and size.

Never open the ZIP: do not unzip it, parse it, or read anything out of it.


## Phase 4: Upload to ApplyMaster

Go to ${upload}. It opens on the upload step of the LinkedIn import.

Find the file input in the drop zone by reference (its id is li-file) and upload the session-staged ZIP. Wait for the page to read it. It will then show how many connections it found and a button labelled "Import N connections".

- If the page says the archive has no Connections.csv, LinkedIn sent a smaller archive. Keep watching LinkedIn on the schedule above until the larger archive arrives, then try again.
- Otherwise click "Import N connections" and wait for "Your network is in".

File size limit: uploads through the extension are capped at 10 MB. If the archive is larger, tell me its size and ask me to drop it in myself — the page will be open and ready.

When done, report only: the archive name and size, and the numbers ApplyMaster showed (added, updated, already up to date). That is the only message I want when everything works.

Me pasting this is my explicit permission to request my LinkedIn archive and give it to ApplyMaster. Do not ask for it again.


## Phase 5: If LinkedIn fails

If no usable archive arrives within LinkedIn's stated wait, or ApplyMaster cannot read the one that does, request one replacement archive if LinkedIn allows it and repeat Phases 2 to 4. Do not ask me to manage the retry.

If the replacement also fails, stop and tell me what was requested and when, what LinkedIn returned, and what the upload showed.


## Phase 6: Clean up

Only after the import is done, suggest — but do not do — these:
- Delete the archive from Downloads. Never delete it yourself.
- Remove the wake-ups you created.

Wait for me to say which ones I want.
`
}
