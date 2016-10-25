# Tools

First run `./downloadChanges.js`, then run `./downloadPackages.js`, then run `highQualityUsers.js`, finally run `enrichUserDataNpm.js`.

This downloads the skimdb changeset, uses that to download the package data, which is then reduced down into a reliable set of user data that can be resolved back to npm usernames, which is then used to scrape the npm website for github/twitter/etc. profile information.
