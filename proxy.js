const querystring = require("querystring");
const SocksAgent = require("socks5-https-client/lib/Agent");
const { SOCKS_URL } = require("./settings");

const { server, port, pass, user } = querystring.parse(SOCKS_URL);

const socksAgent = new SocksAgent({
  socksHost: server,
  socksPort: port,
  socksUsername: user,
  socksPassword: pass
});

module.exports = socksAgent;
