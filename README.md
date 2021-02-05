# Troubadour

![Logo.png](Logo.png)

Troubadour is an application that allows you to listen to audio series, podcasts and I guess audiobooks too!

**Please note that Troubadour is at a really early stage of development and thus might be really buggy!**

Nevertheless, feel free to submit an issue if you were to encounter a bug, specifying how it could be reproduced if possible.

## Features
- Listen to files from your computer or from the Internet
- Remembers when you stopped
- Easily get back to your last listen
- Import and export from M3U8 files!
    - Kinda limited at the moment, but definitely going to get better
- Supports multiple themes (check out the settings menu!)

## How to use
### Binaries
Binaries for the beta version are available [here](https://github.com/lacaulac/troubadour/releases).
Future updates shouldn't break compatibility, but mind that it could happen. In that case, a notice would be present in the release notes.

### From source
You need to have NW.js installed and in your path.

- `npm install` or `yarn`
- `nw .`

If you want to package your own version, you can use the following command:

`npm run dist`

You can make changes to `package.json` in order to customise the packaging options.

## What it's made of

- NW.js for most of it (https://nwjs.io)
- Vue.js (https://vuejs.org/)
- Bulma for the UI (https://bulma.io/)
- Awesome Bulma themes (https://jenil.github.io/bulmaswatch/)
- A fantastic logo made by [Arthur "A3lfyr" Reiter](https://github.com/A3lfyr/)
- A lot of love
- Way too much time on my hands