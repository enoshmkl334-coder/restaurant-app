const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verify a Google ID token issued by the client.
 * @param {string} token - credential returned by Google SDK
 * @returns {Promise<import('google-auth-library').LoginTicket>}
 */
async function verifyGoogleToken(token) {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  return ticket;
}

module.exports = { verifyGoogleToken };
