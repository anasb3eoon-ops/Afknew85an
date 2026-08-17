const setText = (id, value) => {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
};

const formatMode = (value) => {
  if (!value) return 'demo';
  return value === 'live' ? 'live' : 'demo';
};

const updateStatus = (data) => {
  setText('statusText', data.online ? 'مُشغّل' : 'متوقف');
  setText('systemStatus', data.online ? 'Online' : 'Offline');
  setText('totalSent', Number(data.totalSent || 0));
  setText('activeTasks', Object.values(data.tasks || {}).reduce((sum, item) => sum + Number(item || 0), 0));
  setText('lastActive', `آخر نشاط: ${data.lastActive || 'لا يوجد نشاط'}`);
  setText('memoryUsage', data.memory || '0 MB');
  setText('botTag', data.botTag || 'غير متصل');
  setText('voiceState', data.voiceEnabled ? 'مفعّل' : 'موقف');
  setText('chatState', data.chatEnabled ? 'مفعّل' : 'موقف');
  setText('planBState', data.planBRunning ? 'نشط' : 'متوقف');
  setText('modeState', formatMode(data.mode));
  setText('systemMode', formatMode(data.mode));

  const taskEntries = [
    ['countTask1', Number((data.tasks && data.tasks.task1) || 0), 'barTask1'],
    ['countTask2', Number((data.tasks && data.tasks.task2) || 0), 'barTask2'],
    ['countTask3', Number((data.tasks && data.tasks.task3) || 0), 'barTask3'],
    ['countTask4', Number((data.tasks && data.tasks.planB) || 0), 'barTask4']
  ];

  const maxValue = Math.max(...taskEntries.map(([, value]) => value), 1);

  taskEntries.forEach(([countId, value, barId]) => {
    const bar = document.getElementById(barId);
    const count = document.getElementById(countId);
    if (bar) bar.style.width = `${(value / maxValue) * 100}%`;
    if (count) count.textContent = value;
  });
};

const updateConfig = (config) => {
  const channelList = [
    ['Guild ID', config.guildId],
    ['AFK', config.afkChannelId],
    ['Control', config.controlChannelId],
    ['Target', config.targetGuildId]
  ];

  const list = document.getElementById('channelList');
  if (!list) return;
  list.innerHTML = channelList
    .map(([label, value]) => `<li><span>${label}</span><strong>${value || 'غير متاح'}</strong></li>`)
    .join('');
};

const loadDashboardData = async () => {
  try {
    const [statusRes, configRes] = await Promise.all([
      fetch('/api/status'),
      fetch('/api/config')
    ]);

    const status = await statusRes.json();
    const config = await configRes.json();
    updateStatus(status);
    updateConfig(config);
  } catch (error) {
    setText('statusText', 'وضع تجريبي');
    setText('systemStatus', 'Demo');
    setText('lastActive', 'آخر نشاط: لا يوجد بيانات حية');
    setText('botTag', 'BotForge Demo');
    setText('voiceState', 'غير معروف');
    setText('chatState', 'غير معروف');
    setText('planBState', 'غير معروف');
    setText('modeState', 'demo');
    setText('systemMode', 'demo');
    setText('totalSent', 0);
    setText('activeTasks', 0);
    setText('memoryUsage', '0 MB');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  loadDashboardData();

  // Buttons
  const btnRefresh = document.getElementById('btnRefresh');
  const btnStartStop = document.getElementById('btnStartStop');

  if (btnRefresh) btnRefresh.addEventListener('click', () => loadDashboardData());

  if (btnStartStop) btnStartStop.addEventListener('click', async () => {
    try {
      // read current status to decide action
      const res = await fetch('/api/status');
      const json = await res.json();
      if (json.online) {
        await fetch('/api/stop', { method: 'POST' });
      } else {
        await fetch('/api/start', { method: 'POST' });
      }
      await loadDashboardData();
    } catch (e) {
      console.error(e);
      alert('خطأ أثناء إرسال الطلب');
    }
  });

  // command chips
  document.querySelectorAll('.chip[data-action]').forEach(btn => {
    btn.addEventListener('click', async (ev) => {
      const action = btn.getAttribute('data-action');
      try {
        if (action === 'start') await fetch('/api/start', { method: 'POST' });
        else if (action === 'stop') await fetch('/api/stop', { method: 'POST' });
        else if (action === 'status') await loadDashboardData();
        else if (action === 'planb') {
          // toggle planB: read status then start/stop
          const statusRes = await fetch('/api/status');
          const statusJson = await statusRes.json();
          if (statusJson.planBRunning) await fetch('/api/planb/stop', { method: 'POST' });
          else await fetch('/api/planb/start', { method: 'POST' });
        }
        else if (action === 'toggle-chat') await fetch('/api/toggle-chat', { method: 'POST' });
        else if (action === 'toggle-voice') await fetch('/api/toggle-voice', { method: 'POST' });

        await loadDashboardData();
      } catch (e) {
        console.error(e);
        alert('فشل تنفيذ الأمر');
      }
    });
  });

});
