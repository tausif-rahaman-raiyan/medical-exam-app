# Medical Secret Files

Medical admission exam preparation platform with a Windows desktop build.

## Windows app

The GitHub Actions workflow builds two Windows x64 downloads:
- **Setup installer (.exe):** choose a custom installation folder during setup.
- **Portable (.exe):** run without installing; you can keep it on another drive or in a folder such as a synced Google Drive folder. Avoid running from a cloud-synced folder while files are actively syncing.

To build it, open **Actions → Medical Secret Files CI → Run workflow** (or push a commit). After it finishes, open the run and download the `Medical-Secret-Files-Windows-x64` artifact. GitHub stores the artifact for 30 days.

The Windows app icon is generated from `www/assets/icon.svg` during the build.

## Bengali AI proofreading

To enable automated Bengali spelling, grammar, punctuation and sentence-clarity review, add a repository secret named `GEMINI_API_KEY` in **Settings → Secrets and variables → Actions**. The workflow produces a `Bengali-AI-Proofreading-Report` artifact. The report flags suggestions only; it does not rewrite application files automatically. Without the secret, the optional proofreading job skips the AI request.

## Run locally

Prerequisite: Node.js 22 or newer.

1. Install dependencies: `npm install`
2. Set `GEMINI_API_KEY` in your local environment or `.env.local` for AI-powered features.
3. Run the development server: `npm run dev`
