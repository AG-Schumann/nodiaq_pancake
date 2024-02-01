var config = {};


// This file contains all the experiment-specific configurations.

// where your website will be running
config.host = 'localhost';
config.port = 8901;

// Connection to MongoDB
config.mongo_uri = process.env.NODIAQ_MONGO_URI

// GitHub Auth
// If you want to restrict people from changing stuff through the website, set use_authentication=true.
// Currently, only an authentication via membership in a GitHub organization is possible. This means all public members
// of the organization defined in github_org can log in to change things
config.use_authentication = true;
config.github_org = process.env.NODIAQ_GITHUB_ORG;
config.github_oauth_client_id = process.env.NODIAQ_GITHUB_CLIENT_ID;
config.github_oauth_client_secret = process.env.NODIAQ_GITHUB_CLIENT_SECRET;
config.github_callback_url = process.env.NODIAQ_GITHUB_CALLBACK_URI;

module.exports = config;
