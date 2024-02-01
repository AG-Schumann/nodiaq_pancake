const config = require('../config/config')

function ensureAuthenticated(req, res, next) {
  //var is_subnet = req.ip.startsWith(process.env.PRIVILEDGED_SUBNET);
  if (!config.use_authentication) { return next(); }
  return req.isAuthenticated() ? next() : res.redirect('/login');
}

function GetRenderConfig(req) {

  // TODO: fix this for DAQ website. Do we even need it?
  var render_config = {};
  render_config.experiment = config.experiment_name;
  if (req.user) render_config.username = req.user.displayName; else render_config.username = 'Login';
  render_config.hide_login = !config.use_authentication;
  if (config.use_authentication)
    render_config.github_org = config.github_org;
  return render_config;
}

module.exports = {ensureAuthenticated, GetRenderConfig};
