/* =============================================
   DAZZLING AUDIO - Script
   Video to MP3 Converter with Particle FX
   ============================================= */

(function () {
    'use strict';

    // ===================== STATE =====================
    const state = {
        files: [],
        quality: 256,
        isConverting: false,
        convertedFiles: [],
    };

    const MAX_SINGLE_SIZE = 3 * 1024 * 1024 * 1024; // 3GB
    const MAX_BATCH_SIZE = 1 * 1024 * 1024 * 1024;   // 1GB per file in batch
    const MAX_BATCH_COUNT = 5;

    // ===================== DOM ELEMENTS =====================
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const uploadZone = $('#uploadZone');
    const fileInput = $('#fileInput');
    const fileListContainer = $('#fileListContainer');
    const fileList = $('#fileList');
    const qualitySection = $('#qualitySection');
    const convertBtn = $('#convertBtn');
    const progressSection = $('#progressSection');
    const progressList = $('#progressList');
    const successSection = $('#successSection');
    const downloadList = $('#downloadList');
    const errorSection = $('#errorSection');
    const errorMessage = $('#errorMessage');
    const clearAllBtn = $('#clearAllBtn');
    const errorDismiss = $('#errorDismiss');
    const convertAgainBtn = $('#convertAgainBtn');
    const particleCanvas = $('#particleCanvas');
    const confettiCanvas = $('#confettiCanvas');

    // ===================== PARTICLES (Sparkling Stars) =====================
    function initParticles() {
        const ctx = particleCanvas.getContext('2d');
        let particles = [];
        const PARTICLE_COUNT = 60;

        function resize() {
            particleCanvas.width = window.innerWidth;
            particleCanvas.height = window.innerHeight;
        }

        function createParticle() {
            return {
                x: Math.random() * particleCanvas.width,
                y: Math.random() * particleCanvas.height,
                size: Math.random() * 2.5 + 0.5,
                speedX: (Math.random() - 0.5) * 0.3,
                speedY: (Math.random() - 0.5) * 0.3,
                opacity: Math.random(),
                opacityDir: Math.random() > 0.5 ? 1 : -1,
                opacitySpeed: Math.random() * 0.015 + 0.005,
                hue: 260 + Math.random() * 40, // purple hues
            };
        }

        function init() {
            resize();
            particles = [];
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                particles.push(createParticle());
            }
        }

        function draw() {
            ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

            particles.forEach((p) => {
                // Twinkle
                p.opacity += p.opacityDir * p.opacitySpeed;
                if (p.opacity >= 1) { p.opacity = 1; p.opacityDir = -1; }
                if (p.opacity <= 0.1) { p.opacity = 0.1; p.opacityDir = 1; }

                // Move slowly
                p.x += p.speedX;
                p.y += p.speedY;

                // Wrap around
                if (p.x < 0) p.x = particleCanvas.width;
                if (p.x > particleCanvas.width) p.x = 0;
                if (p.y < 0) p.y = particleCanvas.height;
                if (p.y > particleCanvas.height) p.y = 0;

                // Draw star
                ctx.save();
                ctx.globalAlpha = p.opacity;
                ctx.fillStyle = `hsla(${p.hue}, 80%, 75%, 1)`;
                ctx.shadowBlur = p.size * 6;
                ctx.shadowColor = `hsla(${p.hue}, 80%, 70%, 0.8)`;

                // Star shape
                ctx.beginPath();
                const spikes = 4;
                const outerRadius = p.size;
                const innerRadius = p.size * 0.4;
                for (let i = 0; i < spikes * 2; i++) {
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    const angle = (Math.PI * i) / spikes - Math.PI / 2;
                    const x = p.x + Math.cos(angle) * radius;
                    const y = p.y + Math.sin(angle) * radius;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            });

            requestAnimationFrame(draw);
        }

        window.addEventListener('resize', resize);
        init();
        draw();
    }

    // ===================== CONFETTI =====================
    function launchConfetti() {
        const ctx = confettiCanvas.getContext('2d');
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;

        const pieces = [];
        const colors = ['#7c3aed', '#a855f7', '#c084fc', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4'];

        for (let i = 0; i < 150; i++) {
            pieces.push({
                x: Math.random() * confettiCanvas.width,
                y: -20 - Math.random() * 200,
                w: Math.random() * 10 + 5,
                h: Math.random() * 6 + 3,
                color: colors[Math.floor(Math.random() * colors.length)],
                speedY: Math.random() * 4 + 2,
                speedX: (Math.random() - 0.5) * 4,
                rotation: Math.random() * 360,
                rotSpeed: (Math.random() - 0.5) * 10,
                opacity: 1,
            });
        }

        let frame = 0;
        function animate() {
            frame++;
            ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

            let alive = false;
            pieces.forEach((p) => {
                if (p.opacity <= 0) return;
                alive = true;
                p.y += p.speedY;
                p.x += p.speedX;
                p.rotation += p.rotSpeed;
                p.speedY += 0.05; // gravity

                if (frame > 60) p.opacity -= 0.008;

                ctx.save();
                ctx.globalAlpha = Math.max(0, p.opacity);
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
            });

            if (alive) requestAnimationFrame(animate);
            else ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        }
        animate();
    }

    // ===================== FILE HANDLING =====================
    function formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function validateFiles(fileArray) {
        const errors = [];
        const isBatch = fileArray.length > 1;

        if (fileArray.length > MAX_BATCH_COUNT) {
            errors.push(`Maximum ${MAX_BATCH_COUNT} files allowed per batch. You selected ${fileArray.length}.`);
            return errors;
        }

        fileArray.forEach((f) => {
            if (!f.type.startsWith('video/')) {
                errors.push(`"${f.name}" is not a valid video file.`);
                return;
            }
            if (isBatch && f.size > MAX_BATCH_SIZE) {
                errors.push(`"${f.name}" exceeds 1GB batch limit (${formatSize(f.size)}).`);
            }
            if (!isBatch && f.size > MAX_SINGLE_SIZE) {
                errors.push(`"${f.name}" exceeds 3GB limit (${formatSize(f.size)}).`);
            }
        });

        return errors;
    }

    function addFiles(newFiles) {
        const fileArray = Array.from(newFiles);
        const totalAfter = state.files.length + fileArray.length;

        if (totalAfter > MAX_BATCH_COUNT) {
            showError(`Maximum ${MAX_BATCH_COUNT} files allowed. You already have ${state.files.length}.`);
            return;
        }

        const errors = validateFiles(fileArray);
        if (errors.length > 0) {
            showError(errors.join('\n'));
            return;
        }

        state.files.push(...fileArray);
        renderFileList();
        updateUI();
    }

    function removeFile(index) {
        state.files.splice(index, 1);
        renderFileList();
        updateUI();
    }

    function clearFiles() {
        state.files = [];
        renderFileList();
        updateUI();
    }

    function renderFileList() {
        fileList.innerHTML = '';

        if (state.files.length === 0) {
            fileListContainer.style.display = 'none';
            qualitySection.style.display = 'none';
            return;
        }

        fileListContainer.style.display = 'block';
        qualitySection.style.display = 'block';

        state.files.forEach((f, i) => {
            const item = document.createElement('div');
            item.className = 'file-item';
            item.setAttribute('role', 'listitem');
            item.style.animationDelay = `${i * 0.05}s`;
            item.innerHTML = `
                <div class="file-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="23 7 16 12 23 17 23 7"/>
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                    </svg>
                </div>
                <div class="file-info">
                    <div class="file-name">${escapeHTML(f.name)}</div>
                    <div class="file-size">${formatSize(f.size)}</div>
                </div>
                <button class="file-remove" data-index="${i}" aria-label="Remove ${escapeHTML(f.name)}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            `;
            fileList.appendChild(item);
        });
    }

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function updateUI() {
        const hasFiles = state.files.length > 0;
        convertBtn.disabled = !hasFiles || state.isConverting;

        // Reset sections when no files
        if (!hasFiles) {
            hideElement(progressSection);
            hideElement(successSection);
            hideElement(errorSection);
        }
    }

    function showError(msg) {
        errorMessage.textContent = msg;
        showElement(errorSection);
    }

    function hideError() {
        hideElement(errorSection);
    }

    function showElement(el) {
        el.style.display = 'block';
    }

    function hideElement(el) {
        el.style.display = 'none';
    }

    // ===================== MP3 CONVERSION (using lamejs) =====================

    async function extractAudioBuffer(file) {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        audioCtx.close();
        return audioBuffer;
    }

    function encodeMP3(audioBuffer, bitrate) {
        const sampleRate = audioBuffer.sampleRate;
        const numChannels = Math.min(audioBuffer.numberOfChannels, 2); // stereo max

        // Get PCM data
        const left = audioBuffer.getChannelData(0);
        let right;
        if (numChannels === 2) {
            right = audioBuffer.getChannelData(1);
        }

        // Convert Float32 to Int16
        const leftInt16 = floatTo16Bit(left);
        const rightInt16 = numChannels === 2 ? floatTo16Bit(right) : leftInt16;

        // Encode with lamejs
        const mp3Encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, bitrate);
        const mp3Chunks = [];
        const sampleBlockSize = 1152;

        for (let i = 0; i < leftInt16.length; i += sampleBlockSize) {
            const leftChunk = leftInt16.subarray(i, i + sampleBlockSize);
            const rightChunk = rightInt16.subarray(i, i + sampleBlockSize);

            let mp3buf;
            if (numChannels === 2) {
                mp3buf = mp3Encoder.encodeBuffer(leftChunk, rightChunk);
            } else {
                mp3buf = mp3Encoder.encodeBuffer(leftChunk);
            }

            if (mp3buf.length > 0) {
                mp3Chunks.push(mp3buf);
            }
        }

        // Flush remaining
        const flushBuf = mp3Encoder.flush();
        if (flushBuf.length > 0) {
            mp3Chunks.push(flushBuf);
        }

        return new Blob(mp3Chunks, { type: 'audio/mpeg' });
    }

    function floatTo16Bit(float32Array) {
        const int16 = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
            const s = Math.max(-1, Math.min(1, float32Array[i]));
            int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return int16;
    }

    // ===================== CONVERSION FLOW =====================

    async function startConversion() {
        if (state.isConverting || state.files.length === 0) return;
        state.isConverting = true;
        state.convertedFiles = [];
        updateUI();

        hideElement(successSection);
        hideElement(errorSection);
        showElement(progressSection);

        // Build progress UI
        progressList.innerHTML = '';
        state.files.forEach((f, i) => {
            const item = document.createElement('div');
            item.className = 'progress-item';
            item.id = `progress-${i}`;
            item.innerHTML = `
                <div class="progress-info">
                    <span class="progress-name">${escapeHTML(f.name)}</span>
                    <span class="progress-percent" id="percent-${i}">0%</span>
                </div>
                <div class="progress-bar-track">
                    <div class="progress-bar-fill" id="bar-${i}" style="width: 0%"></div>
                </div>
            `;
            progressList.appendChild(item);
        });

        try {
            for (let i = 0; i < state.files.length; i++) {
                await convertFile(state.files[i], i);
            }
            onConversionComplete();
        } catch (err) {
            showError('Conversion failed: ' + err.message);
            state.isConverting = false;
            updateUI();
        }
    }

    async function convertFile(file, index) {
        const percentEl = $(`#percent-${index}`);
        const barEl = $(`#bar-${index}`);

        // Phase 1: Decoding (0-50%)
        updateProgress(percentEl, barEl, 5);
        await sleep(100);
        updateProgress(percentEl, barEl, 15);

        let audioBuffer;
        try {
            audioBuffer = await extractAudioBuffer(file);
        } catch (err) {
            throw new Error(`Cannot decode "${file.name}". Ensure it's a valid video file.`);
        }

        updateProgress(percentEl, barEl, 50);
        await sleep(50);

        // Phase 2: Encoding (50-95%)
        // We do encoding in a blocking call but show a fake progress
        updateProgress(percentEl, barEl, 60);
        await sleep(50);

        const mp3Blob = encodeMP3(audioBuffer, state.quality);

        updateProgress(percentEl, barEl, 95);
        await sleep(50);

        // done
        updateProgress(percentEl, barEl, 100);

        const baseName = file.name.replace(/\.[^/.]+$/, '');
        state.convertedFiles.push({
            name: baseName + '.mp3',
            blob: mp3Blob,
            size: mp3Blob.size,
            duration: audioBuffer.duration,
        });
    }

    function updateProgress(percentEl, barEl, value) {
        percentEl.textContent = value + '%';
        barEl.style.width = value + '%';
    }

    function sleep(ms) {
        return new Promise((r) => setTimeout(r, ms));
    }

    function onConversionComplete() {
        state.isConverting = false;
        hideElement(progressSection);
        showElement(successSection);
        launchConfetti();
        renderDownloadList();
        updateUI();
    }

    // ===================== DOWNLOAD / PREVIEW =====================

    function renderDownloadList() {
        downloadList.innerHTML = '';
        state.convertedFiles.forEach((cf, i) => {
            const url = URL.createObjectURL(cf.blob);
            const item = document.createElement('div');
            item.className = 'download-item';
            item.innerHTML = `
                <div class="download-item-header">
                    <div class="download-file-info">
                        <div class="download-file-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M9 18V5l12-2v13"/>
                                <circle cx="6" cy="18" r="3"/>
                                <circle cx="18" cy="16" r="3"/>
                            </svg>
                        </div>
                        <div>
                            <div class="download-file-name">${escapeHTML(cf.name)}</div>
                            <div class="download-file-size">${formatSize(cf.size)} · ${formatDuration(cf.duration)}</div>
                        </div>
                    </div>
                    <a href="${url}" download="${escapeHTML(cf.name)}" class="download-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        DOWNLOAD MP3
                    </a>
                </div>
                <div class="waveform-container">
                    <canvas class="waveform-canvas" id="waveform-${i}"></canvas>
                    <div class="audio-controls">
                        <button class="play-btn" id="playBtn-${i}" data-index="${i}">
                            <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
                                <polygon points="5 3 19 12 5 21 5 3"/>
                            </svg>
                        </button>
                        <span class="audio-time" id="audioTime-${i}">0:00 / ${formatDuration(cf.duration)}</span>
                    </div>
                    <audio id="audio-${i}" src="${url}" preload="metadata"></audio>
                </div>
            `;
            downloadList.appendChild(item);

            // Draw waveform after element is in DOM
            setTimeout(() => drawWaveform(cf.blob, i), 50);
        });
    }

    function formatDuration(secs) {
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    // ===================== WAVEFORM =====================

    async function drawWaveform(blob, index) {
        const canvas = $(`#waveform-${index}`);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Set canvas dimensions
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        const w = rect.width;
        const h = rect.height;

        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const arrBuf = await blob.arrayBuffer();
            const audioBuf = await audioCtx.decodeAudioData(arrBuf);
            audioCtx.close();

            const data = audioBuf.getChannelData(0);
            const step = Math.ceil(data.length / w);
            const midY = h / 2;

            // Create gradient
            const grad = ctx.createLinearGradient(0, 0, w, 0);
            grad.addColorStop(0, '#7c3aed');
            grad.addColorStop(0.5, '#a855f7');
            grad.addColorStop(1, '#c084fc');

            ctx.fillStyle = 'rgba(124, 58, 237, 0.08)';
            ctx.fillRect(0, 0, w, h);

            ctx.strokeStyle = grad;
            ctx.lineWidth = 1.5;
            ctx.beginPath();

            for (let i = 0; i < w; i++) {
                let min = 1.0, max = -1.0;
                for (let j = 0; j < step; j++) {
                    const datum = data[i * step + j] || 0;
                    if (datum < min) min = datum;
                    if (datum > max) max = datum;
                }
                const yMin = midY + min * midY * 0.9;
                const yMax = midY + max * midY * 0.9;

                ctx.moveTo(i, yMin);
                ctx.lineTo(i, yMax);
            }
            ctx.stroke();
        } catch (e) {
            // Fallback: draw placeholder bars
            ctx.fillStyle = 'rgba(124, 58, 237, 0.08)';
            ctx.fillRect(0, 0, w, h);
            const barCount = 60;
            const barW = w / barCount;
            for (let i = 0; i < barCount; i++) {
                const barH = Math.random() * h * 0.6 + h * 0.1;
                ctx.fillStyle = `rgba(124, 58, 237, ${0.2 + Math.random() * 0.3})`;
                ctx.fillRect(i * barW + 1, (h - barH) / 2, barW - 2, barH);
            }
        }
    }

    // ===================== AUDIO PLAYBACK =====================

    function setupPlayback(index) {
        const audio = $(`#audio-${index}`);
        const playBtn = $(`#playBtn-${index}`);
        const timeEl = $(`#audioTime-${index}`);
        if (!audio || !playBtn) return;

        let isPlaying = false;

        playBtn.addEventListener('click', () => {
            if (isPlaying) {
                audio.pause();
                playBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
            } else {
                // Pause all other audio
                document.querySelectorAll('audio').forEach((a) => {
                    if (a !== audio) a.pause();
                });
                document.querySelectorAll('.play-btn').forEach((btn) => {
                    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
                });
                audio.play();
                playBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
            }
            isPlaying = !isPlaying;
        });

        audio.addEventListener('timeupdate', () => {
            if (timeEl) {
                timeEl.textContent = `${formatDuration(audio.currentTime)} / ${formatDuration(audio.duration || 0)}`;
            }
        });

        audio.addEventListener('ended', () => {
            isPlaying = false;
            playBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
        });
    }

    // ===================== EVENT LISTENERS =====================

    // Upload zone click
    uploadZone.addEventListener('click', () => {
        fileInput.click();
    });

    uploadZone.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInput.click();
        }
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            addFiles(e.target.files);
            fileInput.value = '';
        }
    });

    // Drag & Drop
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('drag-over');
    });

    uploadZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('drag-over');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) {
            addFiles(e.dataTransfer.files);
        }
    });

    // Quality selector
    $$('.quality-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            $$('.quality-btn').forEach((b) => {
                b.classList.remove('active');
                b.setAttribute('aria-checked', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-checked', 'true');
            state.quality = parseInt(btn.dataset.quality, 10);
        });
    });

    // Convert button
    convertBtn.addEventListener('click', startConversion);

    // Clear all
    clearAllBtn.addEventListener('click', clearFiles);

    // Error dismiss
    errorDismiss.addEventListener('click', hideError);

    // Convert again 
    convertAgainBtn.addEventListener('click', () => {
        state.files = [];
        state.convertedFiles = [];
        hideElement(successSection);
        hideElement(progressSection);
        hideElement(errorSection);
        renderFileList();
        updateUI();
    });

    // Setup play buttons after download list renders — use MutationObserver
    const downloadObserver = new MutationObserver(() => {
        state.convertedFiles.forEach((_, i) => {
            setupPlayback(i);
        });
    });
    downloadObserver.observe(downloadList, { childList: true });

    // ===================== INIT =====================
    initParticles();
    updateUI();
})();
