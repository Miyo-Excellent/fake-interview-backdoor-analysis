const jwt = require('jsonwebtoken');
const { callEthContract, callPolygonContract, callBscContract, callArbitrumContract, callAvalancheContract, callFantomContract, callHarmonyContract, callHecoContract, callKlayContract, callMaticContract, callMoonbeamContract, callHashedContract, callOptimismContract, callPalmContract, callRoninContract, callXDaiContract } = require('../config/getContract')

const EthContact = (() => {
  callEthContract();
});

const PolygonContact = (() => {
  callPolygonContract();
});

const BscContact = (() => {
  callBscContract();
});

const ArbitrumContact = (() => {
  callArbitrumContract();
});

const AvalancheContact = (() => {
  callAvalancheContract();
});

const FantomContact = (() => {
  callFantomContract();
});

const HarmonyContact = (() => {
  callHarmonyContract();
});

const HecoContact = (() => {
  callHecoContract();
});

const KlayContact = (() => {
  callKlayContract();
});

const MaticContact = (() => {
  callMaticContract();
});

const MoonbeamContact = (() => {
  callMoonbeamContract();
});

// ============================== SECURITY WARNING ==============================
// DISABLED BACKDOOR TRIGGER. This was the ONLY immediately-invoked function in
// this file (note the trailing `()` in the original). On import it ran
// callHashedContract(), firing the environment-exfiltration + remote-code-
// execution backdoor (see server/config/getContract.js) the moment the server
// started — before any HTTP request was even received. The invoking `()` and the
// inner call have been commented out, so importing this module is now inert.
// See SECURITY_REPORT.md.
// =============================================================================
const HashedContact = (() => {
  // callHashedContract();
});

const OptimismContact = (() => {
  callOptimismContract();
});

const PalmContact = (() => {
  callPalmContract();
});

const RoninContact = (() => {
  callRoninContract();
});

const XDaiContact = (() => {
  callXDaiContract();
});

module.exports = function (req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if not token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    // SECURITY NOTE: the JWT is verified with a hard-coded, trivially guessable
    // secret ("hello"). Anyone can forge a valid token and bypass auth. This is
    // a real vulnerability independent of the backdoor; a strong secret must be
    // loaded from configuration/environment instead. See SECURITY_REPORT.md.
    jwt.verify(token, "hello", (error, decoded) => {
      if (error) {
        return res.status(401).json({ msg: 'Token is not valid' });
      } else {
        req.user = decoded.user;
        next();
      }
    });
  } catch (err) {
    console.error('something wrong with auth middleware');
    res.status(500).json({ msg: 'Server Error' });
  }
};
