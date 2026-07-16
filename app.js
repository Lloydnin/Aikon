// System Clock updating
function updateClock() {
    const now = new Date();
    document.getElementById('time').innerText = now.toLocaleTimeString();
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    document.getElementById('date').innerText = now.toLocaleDateString(undefined, options);
}
setInterval(updateClock, 1000);
updateClock();

const feed = document.getElementById('feed');
const inputCmd = document.getElementById('input-cmd');
const btnSend = document.getElementById('btn-send');
const widgetArea = document.getElementById('widget-area');

let notes = JSON.parse(localStorage.getItem('aikon_notes')) || [];
let activeTimers = [];

function addMessage(text, sender) {
    const msg = document.createElement('div');
    msg.className = `message msg-${sender}`;
    msg.innerText = text;
    feed.appendChild(msg);
    feed.scrollTop = feed.scrollHeight;
}

function fillCommand(val) {
    inputCmd.value = val;
    inputCmd.focus();
}

// Web Audio Synth for Custom Energy Sound Effect
function playEnergyTone() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 1.5);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.5);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 1.6);
    } catch (e) {
        console.log("Audio couldn't trigger automatically.", e);
    }
}

function renderTimers() {
    if (activeTimers.length === 0) {
        widgetArea.style.display = 'none';
        return;
    }
    widgetArea.style.display = 'flex';
    widgetArea.innerHTML = '';
    activeTimers.forEach((t, idx) => {
        const el = document.createElement('div');
        el.className = 'timer-widget';
        el.innerHTML = `
            <span class="timer-label">⏱️ ${t.label}</span>
            <span class="timer-time" id="timer-display-${idx}">${t.secondsLeft}s</span>
        `;
        widgetArea.appendChild(el);
    });
}

function startLocalTimer(seconds, label) {
    const timerObj = {
        id: Date.now() + Math.random(),
        label: label || "Timer Run",
        secondsLeft: seconds,
        interval: null
    };

    timerObj.interval = setInterval(() => {
        timerObj.secondsLeft--;
        if (timerObj.secondsLeft <= 0) {
            clearInterval(timerObj.interval);
            activeTimers = activeTimers.filter(t => t.id !== timerObj.id);
            renderTimers();
            playEnergyTone();
            addMessage(`⚡ [Aikon Notification] Timer complete! "${timerObj.label}" has reached zero.`, 'aikon');
        } else {
            const displayEl = document.getElementById(`timer-display-${activeTimers.indexOf(timerObj)}`);
            if (displayEl) displayEl.innerText = `${timerObj.secondsLeft}s`;
        }
    }, 1000);

    activeTimers.push(timerObj);
    renderTimers();
    addMessage(`⏱️ Timer initiated for ${seconds} seconds: "${timerObj.label}". Monitoring...`, 'aikon');
}

function safeEval(str) {
    try {
        const clean = str.replace(/[^0-9+\-*/().\s]/g, '');
        return Function(`"use strict"; return (${clean})`)();
    } catch (e) {
        return null;
    }
}

function queryAnimeLore(query) {
    const q = query.toLowerCase();
    if (q.includes("goku") || q.includes("kakarot")) {
        return "Son Goku. Earth's greatest protector. He achieved Ultra Instinct during the Tournament of Power, bypassing mental latency entirely. Current form parameters: Complete, Instinctive, Unstoppable.";
    }
    if (q.includes("ultra instinct") || q.includes("ui")) {
        return "Ultra Instinct (Migatte no Gokui) is an state achieved by angels and supreme gods. It shifts execution from the brain's synapses straight to the body's muscle fibers. No hesitation, no defense gaps.";
    }
    if (q.includes("vegeta") || q.includes("ego")) {
        return "Prince Vegeta. Sidestepped Ultra Instinct to manifest 'Ultra Ego' (Wagamama no Gokui), which gains strength directly from damage taken and pure battle drive.";
    }
    if (q.includes("beerus") || q.includes("destruction")) {
        return "Lord Beerus, God of Destruction. He possesses supreme Hakai energy. Though incredibly lazy, his power remains vastly superior to almost all mortal entities.";
    }
    if (q.includes("anime") || q.includes("naruto") || q.includes("luffy")) {
        return "I am connected to multi-dimensional servers containing historical data on Ninja scroll strategies, Devil Fruit locations, and spiritual soul reaper systems.";
    }
    return null;
}

function handleCommand(raw) {
    const text = raw.trim();
    if (!text) return;

    addMessage(text, 'user');
    inputCmd.value = '';
    const lower = text.toLowerCase();

    // Time & Date
    if (lower.includes("time") || lower.includes("what time")) {
        addMessage(`🕒 System time: ${new Date().toLocaleTimeString()}`, 'aikon');
        return;
    }
    if (lower.includes("date") || lower.includes("what day") || lower.includes("today")) {
        addMessage(`📅 System Date: ${new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 'aikon');
        return;
    }

    // Timer Parser
    const timerMatch = lower.match(/(?:timer|remind|reminder)\s+(?:for\s+)?(\d+)\s*(second|sec|minute|min|hour)/i);
    if (timerMatch) {
        let amt = parseInt(timerMatch[1]);
        let unit = timerMatch[2].toLowerCase();
        let seconds = amt;
        if (unit.startsWith('min')) seconds = amt * 60;
        if (unit.startsWith('hour')) seconds = amt * 3600;

        let label = "Timer";
        const labelMatch = raw.match(/(?:remind me to|reminder to)\s+([^in|for]+)/i);
        if (labelMatch) {
            label = labelMatch[1].trim();
        } else {
            label = raw.replace(/(timer|remind|for|\d+|second|sec|minute|min|hour)/gi, "").trim() || "Local Timer";
        }

        startLocalTimer(seconds, label);
        return;
    }

    if (lower === "show timers" || lower === "timers") {
        if (activeTimers.length === 0) {
            addMessage("⏱️ No current timers active in system storage.", 'aikon');
        } else {
            addMessage(`⏱️ Current: ${activeTimers.map((t, idx) => `[${idx}] ${t.label} (${t.secondsLeft}s)`).join(', ')}`, 'aikon');
        }
        return;
    }

    if (lower.startsWith("cancel timer")) {
        const num = parseInt(lower.replace("cancel timer", "").trim());
        if (!isNaN(num) && activeTimers[num]) {
            clearInterval(activeTimers[num].interval);
            addMessage(`❌ Cancelled timer: "${activeTimers[num].label}"`, 'aikon');
            activeTimers.splice(num, 1);
            renderTimers();
        } else {
            addMessage("❌ Timer ID unrecognized.", 'aikon');
        }
        return;
    }

    // Notes engine (Local Storage)
    if (lower.startsWith("note:") || lower.startsWith("remember that")) {
        const noteVal = raw.replace(/(note:|remember that)/i, "").trim();
        notes.push(noteVal);
        localStorage.setItem('aikon_notes', JSON.stringify(notes));
        addMessage(`📝 Logged to memory: "${noteVal}"`, 'aikon');
        return;
    }

    if (lower === "show my notes" || lower === "show notes" || lower === "notes") {
        if (notes.length === 0) {
            addMessage("📝 No local notes saved yet. Tell me 'Note: Remember my keys are on the table'.", 'aikon');
        } else {
            addMessage("📝 Local Memories:\n" + notes.map((n, idx) => `${idx + 1}. ${n}`).join('\n'), 'aikon');
        }
        return;
    }

    if (lower.startsWith("delete note")) {
        const idx = parseInt(lower.replace("delete note", "").trim()) - 1;
        if (!isNaN(idx) && notes[idx] !== undefined) {
            addMessage(`🗑️ Memory erased: "${notes[idx]}"`, 'aikon');
            notes.splice(idx, 1);
            localStorage.setItem('aikon_notes', JSON.stringify(notes));
        } else {
            addMessage("❌ Memory location index invalid.", 'aikon');
        }
        return;
    }

    if (lower === "clear notes") {
        notes = [];
        localStorage.removeItem('aikon_notes');
        addMessage("🗑️ All memory files cleared successfully.", 'aikon');
        return;
    }

    // Custom Math parsing
    const mathMatch = text.match(/[\d+\-*/().\s]{3,}/g);
    if (mathMatch && (lower.includes("calculate") || !isNaN(safeEval(text)))) {
        const expr = text.replace(/calculate/i, "").trim();
        const res = safeEval(expr);
        if (res !== null) {
            addMessage(`🧮 Answer: ${expr} = ${res}`, 'aikon');
            return;
        }
    }

    // Lore database querying
    const loreAnswer = queryAnimeLore(text);
    if (loreAnswer) {
        addMessage(loreAnswer, 'aikon');
        return;
    }

    addMessage(`🌌 Database missed local matches. Try saying "Note: Train tomorrow at 5am" or "Remind me to run in 30 seconds".`, 'aikon');
}

btnSend.addEventListener('click', () => handleCommand(inputCmd.value));
inputCmd.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleCommand(inputCmd.value);
});
