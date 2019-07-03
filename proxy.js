const querystring = require("querystring");
const SocksAgent = require("socks5-https-client/lib/Agent");

function createProxy(socksUrl) {
  const { server, port, pass, user } = querystring.parse(socksUrl);
  return new SocksAgent({
    socksHost: server,
    socksPort: port,
    socksUsername: user,
    socksPassword: pass
  });
}

module.exports = createProxy;
