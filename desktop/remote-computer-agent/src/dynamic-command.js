function normalize(text) { return String(text || '').trim().replace(/\s+/g, ' ').toLowerCase(); }

function parseDynamicCommand(transcript) {
  const raw = String(transcript || '').trim();
  const t = normalize(raw);
  if (/^(unmute|unmute me|turn (the )?microphone on|turn on (the )?mic)$/.test(t)) return { intent: 'meeting.unmute', raw };
  if (/^(mute|mute me|turn (the )?microphone off|turn off (the )?mic)$/.test(t)) return { intent: 'meeting.mute', raw };
  if (/^(turn on (the )?video|start (the )?camera|camera on)$/.test(t)) return { intent: 'meeting.video.on', raw };
  if (/^(turn off (the )?video|stop (the )?camera|camera off)$/.test(t)) return { intent: 'meeting.video.off', raw };
  const message = t.match(/^(?:whatsapp\s+)?send(?: a)? message(?: to)?\s+(.+?)\s*(?:saying|that says)\s+(.+)$/i);
  if (message) return { intent: 'messaging.send', raw, target: message[1], payload: message[2] };
  const play = t.match(/^play\s+(.+?)(?:\s+video)?$/i);
  if (play) return { intent: 'media.play.search', raw, query: play[1] };
  if (/^(lock|lock computer|lock the computer)$/.test(t)) return { intent: 'system.lock', raw };
  return { intent: 'unknown', raw };
}

module.exports = { parseDynamicCommand };
