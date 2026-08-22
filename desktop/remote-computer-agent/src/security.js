const crypto = require('node:crypto');
const keytar = require('keytar');

const SERVICE = 'NexusPlus.RemoteComputer';
const ACCOUNT = 'device-identity';

async function loadOrCreateIdentity() {
  const stored = await keytar.getPassword(SERVICE, ACCOUNT);
  if (stored) return JSON.parse(stored);

  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const identity = {
    algorithm: 'Ed25519',
    publicKey: publicKey.export({ type: 'spki', format: 'der' }).toString('base64'),
    privateKey: privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64'),
  };
  await keytar.setPassword(SERVICE, ACCOUNT, JSON.stringify(identity));
  return identity;
}

function signChallenge(identity, challenge) {
  const privateKey = crypto.createPrivateKey({ key: Buffer.from(identity.privateKey, 'base64'), format: 'der', type: 'pkcs8' });
  return crypto.sign(null, Buffer.from(challenge, 'utf8'), privateKey).toString('base64');
}

function verifySignature(publicKeyBase64, challenge, signatureBase64) {
  const publicKey = crypto.createPublicKey({ key: Buffer.from(publicKeyBase64, 'base64'), format: 'der', type: 'spki' });
  return crypto.verify(null, Buffer.from(challenge, 'utf8'), publicKey, Buffer.from(signatureBase64, 'base64'));
}

module.exports = { loadOrCreateIdentity, signChallenge, verifySignature };
