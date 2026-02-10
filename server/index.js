const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');


const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

function ensureFile(fileName, defaultValue) {
  const p = path.join(dataDir, fileName);
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, JSON.stringify(defaultValue, null, 2), 'utf-8');
  }
}

ensureFile('users.json', []);
ensureFile('assets.json', []);
ensureFile('events.json', []);

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.use('/uploads', express.static(uploadsDir));

function nextId(rows) {
  return rows.reduce((m, x) => Math.max(m, Number(x?.id) || 0), 0) + 1;
}

function getCurrentUser() {
  const users = readJson('users.json');
  return users.find((u) => u.id === CURRENT_USER_ID) || null;
}

function releaseResult(details, problem) {
  const p =
    problem === 'warning'
      ? 'Проблема: предупреждение'
      : problem === 'alarm'
      ? 'Проблема: alarm'
      : 'Проблем не обнаружено';

  const d = String(details || '').trim();
  return d ? `${d} • ${p}` : p;
}

function readJson(fileName) {
  const p = path.join(dataDir, fileName);
  try {
    const raw = fs.readFileSync(p, 'utf-8');
    return raw.trim() ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('readJson failed:', fileName, e);
    return [];
  }
}

function writeJson(fileName, data) {
  const p = path.join(dataDir, fileName);
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8');
}

function avatarUrl(avatarFile) {
  if (!avatarFile) return null;
  return `/uploads/${avatarFile}`;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const CURRENT_USER_ID = 4;

app.get('/api/users', (req, res) => {
  const users = readJson('users.json').map(u => ({
    id: u.id,
    login: u.login,
    displayName: u.displayName,
    avatarUrl: avatarUrl(u.avatarFile),
  }));
  res.json(users);
});

app.get('/api/users/me', (req, res) => {
  const users = readJson('users.json');
  const me = users.find(u => u.id === CURRENT_USER_ID);
  if (!me) return res.status(404).json({ error: 'me not found' });

  res.json({
    id: me.id,
    login: me.login,
    displayName: me.displayName,
    avatarUrl: avatarUrl(me.avatarFile),
  });
});

app.get('/api/assets', (req, res) => {
  const users = readJson('users.json');
  const assets = readJson('assets.json');

  const out = assets.map(a => {
    const busyUser = a.busyByUserId
      ? users.find(u => u.id === a.busyByUserId)
      : null;
  const isMine = a.status === 'busy' && a.busyByUserId === CURRENT_USER_ID;

  return {
    id: a.id,
    type: a.type ?? 'unknown',
    name: a.name ?? '',
    room: a.room ?? '',
    status: a.status ?? 'free',
    counts: a.counts ?? { warnings: 0, alarms: 0 },
    isMine,
    busyBy: busyUser
          ? {
              id: busyUser.id,
              login: busyUser.login,
              displayName: busyUser.displayName,
              avatarUrl: avatarUrl(busyUser.avatarFile),
            }
          : null,
    };
  });

  res.json(out);
});

app.get('/api/assets/:id', (req, res) => {
  const id = req.params.id;
  const users = readJson('users.json');
  const assets = readJson('assets.json');

  const a = assets.find(x => String(x.id) === id);
  if (!a) return res.status(404).json({ error: 'asset not found' });

  const busyUser = a.busyByUserId ? users.find(u => u.id === a.busyByUserId) : null;
  const isMine = a.status === 'busy' && a.busyByUserId === CURRENT_USER_ID;

  res.json({
    id: a.id,
    type: a.type ?? 'unknown',
    name: a.name ?? '',
    room: a.room ?? '',
    status: a.status ?? 'free',
    counts: a.counts ?? { warnings: 0, alarms: 0 },
    isMine,
    description: {
      erpGuid: a.description?.erpGuid ?? '',
      serialNumber: a.description?.serialNumber ?? '',
      passportId: a.description?.passportId ?? '',
      className: a.description?.className ?? '',
      manufacturer: a.description?.manufacturer ?? '',
    },
    busyBy: busyUser
      ? {
          id: busyUser.id,
          login: busyUser.login,
          displayName: busyUser.displayName,
          avatarUrl: avatarUrl(busyUser.avatarFile),
        }
      : null,
  });
});

app.get('/api/assets/:id/events', (req, res) => {
  const id = req.params.id;
  const events = readJson('events.json').filter(e => String(e.assetId) === id);
  res.json(events);
});

app.get('/api/assets/:id/events/meta', (req, res) => {
  const id = req.params.id;
  const events = readJson('events.json').filter(e => String(e.assetId) === id);

  const workTypes = Array.from(new Set(events.map(e => e.type).filter(Boolean))).sort();
  const userLogins = Array.from(new Set(events.map(e => e.userLogin).filter(Boolean))).sort();

  const users = readJson('users.json');
  const usersOut = userLogins.map(login => {
    const u = users.find(x => x.login === login);
    return {
      login,
      displayName: u?.displayName ?? login,
      avatarUrl: avatarUrl(u?.avatarFile ?? null),
    };
  });

  res.json({ workTypes, users: usersOut });
});

app.post('/api/assets/:id/claim', (req, res) => {
  const id = req.params.id;

  const assets = readJson('assets.json');
  const asset = assets.find((a) => String(a.id) === id);
  if (!asset) return res.status(404).json({ error: 'asset not found' });

  if (asset.status === 'busy') {
    return res.status(409).json({ error: 'already busy' });
  }

  const me = getCurrentUser();
  if (!me) return res.status(404).json({ error: 'me not found' });

  asset.status = 'busy';
  asset.busyByUserId = CURRENT_USER_ID;

  const events = readJson('events.json');
  events.push({
    id: nextId(events),
    assetId: asset.id,
    ts: new Date().toISOString(),
    type: 'Занятие',
    result: 'Устройство занято',
    userLogin: me.login,
    problem: 'none',
  });

  writeJson('assets.json', assets);
  writeJson('events.json', events);

  res.json({ ok: true });
});


app.post('/api/assets/:id/release', (req, res) => {
  const id = req.params.id;
  const { workType, details = '', problem = 'none' } = req.body || {};

  const allowedProblems = new Set(['none', 'warning', 'alarm']);
  if (!workType || typeof workType !== 'string' || !workType.trim()) {
    return res.status(400).json({ error: 'workType is required' });
  }
  if (!allowedProblems.has(problem)) {
    return res.status(400).json({ error: 'invalid problem value' });
  }

  const assets = readJson('assets.json');
  const asset = assets.find((a) => String(a.id) === id);
  if (!asset) return res.status(404).json({ error: 'asset not found' });

  if (asset.status !== 'busy') {
    return res.status(409).json({ error: 'already free' });
  }

  if (asset.busyByUserId !== CURRENT_USER_ID) {
    return res.status(403).json({ error: 'not your asset' });
  }

  const me = getCurrentUser();
  if (!me) return res.status(404).json({ error: 'me not found' });

  asset.counts = {
    warnings: problem === 'warning' ? 1 : 0,
    alarms: problem === 'alarm' ? 1 : 0,
  };

  asset.totals = asset.totals || { warnings: 0, alarms: 0 };
  if (problem === 'warning') asset.totals.warnings += 1;
  if (problem === 'alarm') asset.totals.alarms += 1;

  asset.status = 'free';
  asset.busyByUserId = null;

  const events = readJson('events.json');
  events.push({
    id: nextId(events),
    assetId: asset.id,
    ts: new Date().toISOString(),
    type: workType.trim(),
    result: releaseResult(details, problem),
    userLogin: me.login,
    problem,
  });

  writeJson('assets.json', assets);
  writeJson('events.json', events);

  res.json({ ok: true });
});



app.post('/api/users/me/avatar', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const users = readJson('users.json');
    const me = users.find(u => u.id === CURRENT_USER_ID);
    if (!me) return res.status(404).json({ error: 'me not found' });

    const fileName = `avatar_${CURRENT_USER_ID}.jpg`;
    const outPath = path.join(__dirname, 'uploads', fileName);

    await sharp(req.file.buffer)
      .rotate()
      .resize(256, 256, { fit: 'cover' })
      .jpeg({ quality: 85 })
      .toFile(outPath);

    me.avatarFile = fileName;
    writeJson('users.json', users);

    res.json({ avatarUrl: avatarUrl(me.avatarFile) });
  } catch (e) {
    console.error('avatar upload failed', e);
    res.status(500).json({ error: 'avatar upload failed' });
  }
});

const clientDir = path.join(__dirname, 'public');
if (fs.existsSync(clientDir)) {
  app.use(express.static(clientDir));
  app.get(/^(?!\/api|\/uploads).*/, (req, res) => {
    res.sendFile(path.join(clientDir, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

app.use((err, req, res, next) => {
  console.error('API ERROR:', err);
  res.status(500).json({ error: 'Internal Server Error', details: String(err?.message || err) });
});
