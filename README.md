# Padri Kalan community website · पडरी कलाँ सामुदायिक वेबसाइट

A free, bilingual (Hindi + English), community-run, multi-page website for Padri Kalan village, Bichhiya block, Unnao district, Uttar Pradesh.

It is a plain static site: HTML, CSS and a little JavaScript, with no build step, no database, no ads and no tracking. It works on cheap phones and slow networks, and keeps working offline after the first visit.

> **This is not a government website.** It is not run by the Gram Panchayat or any government office. A notice saying so appears at the top of every page.

---

## 1. What's in the site

The site has seven pages: `index.html` (home: welcome, page cards, latest 3 notices), `about.html` (About, Facts, History, Getting here), `temple.html` (Baleshwari Mandir), `gallery.html` (Photos and Stories), `services.html` (Services and helplines), `notices.html` (Notices and Village pride) and `contribute.html` (Contribute, Disclaimer, Sources).

| Section | What it shows |
|---|---|
| About | Name, location, administrative details (district, tehsil, block, census code, PIN) |
| Facts | Census 2011 population, literacy, work and farming figures, each with its source |
| History | Verified history of the Awadh region, Unnao district and Bichhiya block, plus a call for elders' stories |
| Baleshwari Mandir | The village temple of Maa Baleshwari Devi: map link, what still needs collecting, and confirmed facts from `data/temple.json` |
| Photo gallery | Photos with photographer credit and licence from `data/gallery.json`, plus a wishlist of photos to ask villagers for |
| Village stories | Elders' stories from `data/stories.json`, plus questions to ask elders |
| Getting here | Road, rail and air distances, neighbouring villages, schools and health centres |
| Services | Links to official government portals (land records, certificates, PM-KISAN, ration, pension, scholarships, grievances) and toll-free helplines |
| Notices | Village notices and events, read from `data/notices.json` |
| Village pride | People who made the village proud, shown **only** with their consent, read from `data/pride.json` |
| Contribute | How villagers can send stories, photos and corrections, and the rules for doing so |
| Disclaimer | Community-run notice, privacy note and the full source list |

Other features: a Hindi/English toggle (remembered per phone), dark mode, a printable layout, offline support (installable to the home screen), GitHub issue templates for corrections, and no cookies.

### Where the ideas came from

- **UK parish and village websites** (for example [Pillerton Hersey](https://pillertonherseypc.org.uk/), [Shabbington](https://shabbington-pc.gov.uk) and the feature list at [parishcouncil.net](https://www.parishcouncil.net/features.html)): a notices board, events calendar, local directory, maps, a links page to higher councils, an FAQ and a clear "who runs this" note.
- **Indian model villages** such as [Punsari, Gujarat](https://thebetterindia.com/112312/punsari-best-village-sarpanch-himanshu-patel): pride in the village's progress and keeping people informed.
- **[Mera Gaon Meri Dharohar](https://mgmd.gov.in/)** (Ministry of Culture): recording a village's heritage, stories and traditions.

---

## 2. Put it online for free with GitHub Pages (about 15 minutes)

GitHub Pages hosts static websites for free. Your site will be at `https://YOUR-USERNAME.github.io/padri-kalan/`.

### Step 1: Create the repository
1. Sign in at <https://github.com>.
2. Click **+** (top right), then **New repository**.
3. Repository name: `padri-kalan` (any name works; it becomes part of the address).
4. Choose **Public**. GitHub Pages is free for public repositories.
5. Leave "Add a README" **unticked**, then click **Create repository**.

### Step 2: Set your username in the site
Open `js/config.js` and change:
```js
githubUser: "YOUR-GITHUB-USERNAME",
githubRepo: "padri-kalan",
```
This is kept for your own reference; villagers never see GitHub.

### Step 3: Upload the files
**Option A, in the browser (easiest):**
1. On your new repo page, click **uploading an existing file**.
2. Open the `padri-kalan-website` folder on your Mac, select **everything inside it** (not the folder itself) and drag it into the browser.
   - Press `Cmd + Shift + .` in Finder to show hidden files, so `.nojekyll` and the `.github` folder are included.
3. Click **Commit changes**.

**Option B, with Terminal:**
```bash
cd ~/Desktop/Project/padri-kalan-website
git init
git add .
git commit -m "First version of Padri Kalan community website"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/padri-kalan.git
git push -u origin main
```

### Step 3b: Turn on the correction forms
The issue templates are in the `_github` folder (macOS blocked writing a `.github` folder from here). Rename it once: in Terminal run `cd ~/Desktop/Project/padri-kalan-website && mv _github .github`, then upload or push again. If you skip this, the site still works; corrections just open a blank GitHub issue.

### Step 4: Turn on GitHub Pages
1. In the repo, open **Settings**, then **Pages** (left menu).
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
3. Branch: **main**, folder: **/ (root)**. Click **Save**.
4. Wait 1–2 minutes, then refresh. The page shows your link: `https://YOUR-USERNAME.github.io/padri-kalan/`.

### Step 5 (optional): A nicer address
- **Free:** name the repo `YOUR-USERNAME.github.io` and the site lives at `https://YOUR-USERNAME.github.io/`. If you already use that name for a personal site, use a project repo as above or a separate GitHub account/organisation such as `padrikalan`, giving `https://padrikalan.github.io/`.
- **Paid (about ₹100–900 a year):** buy a domain such as `padrikalan.in`, then add it under **Settings → Pages → Custom domain**. Do **not** use `.gov.in`, `.nic.in` or anything that looks official.

### Other free hosts (if you ever want to move)
[Cloudflare Pages](https://pages.cloudflare.com/), [Netlify](https://www.netlify.com/) and [Vercel](https://vercel.com/) all host static sites free. Connect the same GitHub repo; no code changes are needed.

---

## 3. Updating the site

### Add a notice
Edit `data/notices.json` on GitHub (click the file, then the pencil icon). Copy an item and change it:
```json
{
  "date": "2026-12-05",
  "title": { "hi": "ग्राम सभा की बैठक", "en": "Gram Sabha meeting" },
  "body":  { "hi": "पंचायत भवन में सुबह 11 बजे।", "en": "At the Panchayat Bhawan, 11 am." },
  "source": "Gram Panchayat notice board"
}
```
Remember the comma between items. Click **Commit changes**; the site updates in about a minute.

### Add someone to the pride wall
Only after they (or a parent, if under 18) agree **in writing**, for example on WhatsApp. Add them to `data/pride.json` with `"consent": true`. Entries without `"consent": true` are never shown.

### Add a photo
Put the file in `images/` (about 1200 px wide, under 300 KB), then add it to `data/gallery.json` with the photographer's name, licence and `"permission": true`. See `images/README.md`. Never copy photos from Google, Facebook, YouTube or news sites.

### Add a story or temple fact
Add a story to `data/stories.json` with `"permission": true`. Add a temple fact (aarti time, mela date, founding) to `data/temple.json` with `"confirmed": true` once the priest, the temple committee or several elders confirm it.

### Change any text
Each page is a plain HTML file. The top bar, menu and footer are repeated in all seven pages, so if you change the menu, change it in every page. Each sentence appears twice, once inside `lang="hi"` and once inside `lang="en"`. Change both.

### After changing files
Open `sw.js` and bump `VERSION` (for example `pk-v1` to `pk-v2`), so phones that saved the site offline fetch the new copy.

### Preview on your Mac before uploading
```bash
cd ~/Desktop/Project/padri-kalan-website
python3 -m http.server 8000
```
Then open <http://localhost:8000>. (Opening `index.html` directly works too, but notices load only from a server.)

### Turn on the suggestion form (15 minutes, free, once)
Villagers send suggestions from the form on the Contribute page. They need no account, login or app. Each message becomes an issue in a **private** GitHub repo, so your Gmail stays clean. A small free Cloudflare relay holds the GitHub key, so it's never in the website's code.

Follow **[worker/SETUP.md](worker/SETUP.md)**. Until it's set up, the form politely says it isn't switched on yet.

(Alternative: paste a free Web3Forms key into `web3formsKey` to receive messages by email instead.)

**Photos:** the form asks people to mention they have photos and leave a phone number, so you or a village volunteer can collect them. If you're happy to make an email address public, put it in `contactEmail` and the page will show it for sending photos.

---

## 4. Staying within the law (please read)

| Rule | Why |
|---|---|
| Keep the "not a government website" notice | Pretending to be an official site can be an offence (impersonation and cheating under the Bharatiya Nyaya Sanhita, and the IT Act). |
| Never use the Ashoka emblem, state emblem, or government logos | Use of the State Emblem is restricted by the State Emblem of India (Prohibition of Improper Use) Act, 2005. |
| Only use photos you took or have permission for | Copyright Act, 1957. Photos from Google or other websites are not free to use. |
| Get consent before naming or showing a person; never post phone numbers, Aadhaar, caste, land or family details | Digital Personal Data Protection Act, 2023, and basic dignity. Children need a parent's consent. |
| Don't post anything defamatory, political or communal | Defamation and hate-speech laws; it also keeps the site something everyone can be proud of. |
| Cite a source for every fact | Keeps the site trustworthy; mark anything unconfirmed as such. |
| Remove content quickly if someone objects | Good practice, and it keeps you on the safe side of the IT Rules. |

Talking to the Gram Pradhan before launch is a good idea. Their blessing helps people trust and use the site, and they may share official notices for it.

---

## 5. File layout

```
padri-kalan-website/
├── index.html              home page
├── about.html              about, census facts, history, getting here
├── temple.html             Baleshwari Mandir
├── gallery.html            photos and stories
├── services.html           government links and helplines
├── notices.html            notices and village pride
├── contribute.html         contribute, disclaimer, sources
├── 404.html                "page not found"
├── css/style.css           design (light + dark)
├── js/config.js            ← your GitHub username, form link, share text
├── js/main.js              language toggle, notices, pride wall, share, offline
├── data/notices.json       ← village notices (edit this)
├── data/pride.json         ← village pride wall (edit this, consent only)
├── data/gallery.json       ← photos with credit + licence
├── data/stories.json       ← elders' stories
├── data/temple.json        ← confirmed Baleshwari Mandir facts
├── images/                 ← photo files go here
├── assets/icon.svg         original logo
├── manifest.webmanifest    lets people "Add to Home screen"
├── sw.js                   offline support
├── robots.txt, .nojekyll   hosting helpers
├── worker/                 free Cloudflare relay: form → private GitHub issues (see SETUP.md)
├── _github/ISSUE_TEMPLATE/ correction and contribution forms (rename to .github)
├── LICENSE                 MIT (code) + CC BY-SA 4.0 (text)
└── SOURCES.md              every fact and where it came from
```

---

## हिन्दी में संक्षेप

1. GitHub पर `padri-kalan` नाम से **Public** repository बनाएँ।
2. `js/config.js` में अपना GitHub username लिखें।
3. इस फ़ोल्डर की सारी फ़ाइलें repository में upload करें।
4. **Settings → Pages** में **main** branch और **/(root)** चुनकर Save करें।
5. 1–2 मिनट में वेबसाइट `https://आपका-username.github.io/padri-kalan/` पर खुल जाएगी। यह पूरी तरह मुफ़्त है।

सूचना जोड़ने के लिए `data/notices.json` बदलें। किसी व्यक्ति का नाम केवल उसकी लिखित अनुमति के बाद ही जोड़ें। कोई सरकारी चिह्न, दूसरों की फ़ोटो या निजी जानकारी न डालें।
