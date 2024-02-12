# Nodiaq light: Lightweight DAQ UI #

**Jaron Grigat**

Last Update: 2024-02-12
University of Freiburg

## Brief ##
[Nodiaq](https://github.com/XENONnT/nodiaq) was developed as a user interface for the XENONnT DAQ and XENONnT shift management.
nodiaq_light is meant for experiments that run the same DAQ but are much simpler (e.g. only one detector instead of three, one reader/event builder instead of multiple, ...).

## Installation ##

- Install nodejs and npm (ubuntu something like apt install nodejs npm)
- In source directory 'npm install' to install dependencies
- There are two options to configure the website:
  - **Option 1:** specify the following environment variables:
    - NODIAQ_HOST
    - NODIAQ_PORT
    - NODIAQ_MONGO_URI
    - NODIAQ_DAQ_DB
    - NODIAQ_GITHUB_ORG
    - NODIAQ_GITHUB_CLIENT_ID
    - NODIAQ_GITHUB_CLIENT_SECRET
    - NODIAQ_GITHUB_CALLBACK_URI
  - **Option 2:** specify the same options in `config/config.js`
- If you want to use environment variables but want to give them different names for some reason, change the names in the config/config.js file, accordingly.

## Authentication System ##

The default user authentication works as follows:
-  Users log in with their GitHub ID.
-  If they are a public member of the specified `config.github_org`, they will be able to access the website.

You can shut off the user management completely by setting `config.use_authentication = false;`

If you want a user management system but can't use the one described above, help yourself! You will probably have to change the following files:
  - `config/passport.js`: Check out [passport.js](https://www.passportjs.org/)
  - `routes/auth.js`: This is where the logic with the organisation members is. You could also probably use a whitelist of allowed users or something along those lines.
  - `routes/common.js`: Maybe you want to add something to the `ensureAuthenticated` function here and don't use passport at all.
