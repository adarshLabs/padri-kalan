# Suggestions → GitHub (free, no Gmail)

Villagers fill in the form on the Contribute page and press **भेजें**. Each message becomes an **issue in a private GitHub repository** that only you can see. Villagers need no account.

How it works: website form → small free relay on Cloudflare → GitHub issue.
The relay holds your GitHub key secretly, so the key is never in the website's code.

Everything here is free. It takes about 15 minutes, once.

---

## Already set up? Turn on photos and videos (5 minutes)

**A. Let the key save files (2 min)**
1. GitHub → your photo (top right) → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens**.
2. Click your token **padri-kalan-form**.
3. Click **Edit**, scroll to **Repository permissions**, and set **Contents** to **Read and write** (leave **Issues** on Read and write).
4. Click **Update** at the bottom. The token text stays the same, so you don't need to change anything in Cloudflare.

**B. Put the new relay code on Cloudflare (2 min)**
1. Cloudflare → **Workers & Pages** → **padri-kalan-form** → **Edit code**.
2. Select everything in the editor and delete it.
3. Open `worker/suggestions-worker.js` from this folder, copy all of it, and paste it in.
4. Click **Deploy**.

**C. Push the website and test (1 min)**
Push the website changes, open the Contribute page on your phone, attach a photo, and send. The issue should show the message, then one comment per photo or video, with the photo shown inside the comment.

---

## Step 1: Make a private repo to hold the messages (2 min)

1. On GitHub, click **+** → **New repository**.
2. Name: `padri-kalan-suggestions`
3. Choose **Private**. Phone numbers people leave must never be public.
4. Click **Create repository**.

## Step 2: Make a key that can only create issues in that repo (3 min)

1. GitHub → your photo (top right) → **Settings** → **Developer settings** (bottom left) → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
2. Token name: `padri-kalan-form`. Expiration: **1 year**. Set a phone reminder to renew it.
3. Repository access: **Only select repositories** → pick `padri-kalan-suggestions`.
4. Permissions → Repository permissions → **Issues** → **Read and write**, and **Contents** → **Read and write** (Contents lets the form save photos and videos). Leave everything else at "No access".
5. Click **Generate token** and copy it (it starts with `github_pat_`). You'll only see it once.

## Step 3: Create the free relay on Cloudflare (7 min)

1. Sign up free at <https://dash.cloudflare.com/sign-up>. No card is needed.
2. Left menu → **Workers & Pages** → **Create** → **Create Worker** (Hello World is fine).
3. Name it `padri-kalan-form` → **Deploy**.
4. Click **Edit code**. Delete everything, paste the whole of `worker/suggestions-worker.js` from this folder, then click **Deploy**.
5. Go back to the Worker → **Settings** → **Variables and Secrets** → **Add**:

   | Type | Name | Value |
   |---|---|---|
   | **Secret** | `GITHUB_TOKEN` | the token from Step 2 |
   | Text | `GITHUB_REPO` | `adarshLabs/padri-kalan-suggestions` |
   | Text | `ALLOWED_ORIGINS` | `https://adarshlabs.github.io` |

   Click **Deploy** (or **Save and deploy**).
6. Copy the Worker's address shown at the top, for example `https://padri-kalan-form.yourname.workers.dev`.

## Step 4: Connect the website (1 min)

Open `js/config.js` and paste the address:
```js
suggestionsUrl: "https://padri-kalan-form.yourname.workers.dev",
```
Then push:
```
git add -A && git commit -m "Connect suggestion form" && git push
```

## Step 5: Test, and stop GitHub emails (2 min)

1. Open the website's Contribute page on your phone, write "test", tick the box, press **भेजें**.
2. A new issue should appear in `padri-kalan-suggestions` → **Issues** within seconds.
3. **To keep Gmail clean:** on the `padri-kalan-suggestions` page, click **Watch** (top right) → **Ignore**, or go to GitHub → Settings → **Notifications** and untick **Email** under "Watching". You'll check messages in GitHub (or the GitHub app) instead.

## Handling messages

- Read the issue, use what's useful on the site, then **Close** it.
- Never copy a sender's phone number or email onto the website.
- If someone asks for their message to be deleted, open the issue → **⋯** → **Delete issue**.

## Limits and safety

- **Attachment limits:** up to 5 files per message; photos up to 10 MB each, saved as the original file with no loss of quality; 1 video per message, up to 1 minute and 20 MB. Allowed types are JPG, PNG, WEBP and HEIC for photos, and MP4, MOV, 3GP and WEBM for videos.
- Files are saved in your private repo under `uploads/issue-<number>/`. GitHub keeps repos healthy up to about 1 GB, which is roughly 50 full-size videos plus thousands of photos. Once you've copied a video somewhere else, delete it from the repo to free space.
- Cloudflare's free plan allows 100,000 requests a day, far more than a village needs.
- The relay only accepts messages from your website's address, drops obvious bots, and allows at most 10 messages an hour from one connection.
- The token can only work with issues and files in that one private repo. If it ever leaks, delete it on GitHub and make a new one.
- If the form shows "could not be sent", check that the token hasn't expired (Step 2) and that `ALLOWED_ORIGINS` matches your site's address exactly.
