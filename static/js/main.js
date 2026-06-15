/* ═══════════════════════════════════════════════════════════════════════════
   Smart Disaster Resource Allocation System — Frontend JavaScript
   ═══════════════════════════════════════════════════════════════════════════ */

// ── Sidebar Toggle (Mobile) ────────────────────────────────────────────────
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.classList.toggle('open');
}

// Close sidebar when clicking outside on mobile
document.addEventListener('click', function (e) {
    const sidebar = document.querySelector('.sidebar');
    const toggle = document.querySelector('.mobile-toggle');
    if (sidebar && sidebar.classList.contains('open') &&
        !sidebar.contains(e.target) && !toggle.contains(e.target)) {
        sidebar.classList.remove('open');
    }
});

// ── Tab System ─────────────────────────────────────────────────────────────
function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    const btn = document.querySelector(`[data-tab="${tabId}"]`);
    const content = document.getElementById(tabId);
    if (btn) btn.classList.add('active');
    if (content) content.classList.add('active');
}

document.addEventListener('DOMContentLoaded', function () {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            switchTab(this.dataset.tab);
        });
    });
});

// ── District Auto-Fill ─────────────────────────────────────────────────────
function onDistrictChange(selectEl) {
    const option = selectEl.options[selectEl.selectedIndex];
    const state = option.dataset.state || '';
    const lat = option.dataset.lat || '';
    const lon = option.dataset.lon || '';

    const stateEl = document.getElementById('state');
    const latEl = document.getElementById('latitude');
    const lonEl = document.getElementById('longitude');

    if (stateEl) stateEl.value = state;
    if (latEl) latEl.value = lat;
    if (lonEl) lonEl.value = lon;
}

// ── Number Formatting ──────────────────────────────────────────────────────
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
}

// ── Animated Counter ───────────────────────────────────────────────────────
function animateCounter(element, target, duration = 1500) {
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (target - start) * eased);

        element.textContent = formatNumber(current);

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

// Animate all counters on page load
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-counter]').forEach(el => {
        const target = parseInt(el.dataset.counter);
        if (!isNaN(target)) animateCounter(el, target);
    });
});

// ── Chart.js Dark Theme Defaults ───────────────────────────────────────────
if (typeof Chart !== 'undefined') {
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.padding = 16;
}

// ── Prediction Form AJAX ───────────────────────────────────────────────────
function submitPrediction(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    // Show loading
    const resultsDiv = document.getElementById('prediction-results');
    if (resultsDiv) {
        resultsDiv.innerHTML = '<div class="text-center"><div class="spinner"></div><p class="text-muted mt-2">Running ML predictions...</p></div>';
        resultsDiv.style.display = 'block';
    }

    fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
        .then(res => res.json())
        .then(result => {
            if (result.error) {
                showFlash(result.error, 'error');
                return;
            }
            renderPredictionResults(result);
        })
        .catch(err => {
            showFlash('Prediction failed: ' + err.message, 'error');
        });
}

function renderPredictionResults(result) {
    const container = document.getElementById('prediction-results');
    if (!container) return;

    const predictions = result.predictions;
    const metrics = result.metrics || {};
    const bestModel = result.best_model || 'xgboost';

    const modelLabels = {
        xgboost: 'XGBoost',
        random_forest: 'Random Forest',
        linear_regression: 'Linear Regression'
    };

    const modelColors = {
        xgboost: '#3b82f6',
        random_forest: '#10b981',
        linear_regression: '#f59e0b'
    };

    let html = '<h3 class="mb-3" style="font-size:1.1rem;">📊 Prediction Results</h3>';
    html += '<div class="prediction-grid">';

    for (const [modelName, preds] of Object.entries(predictions)) {
        const isBest = modelName === bestModel;
        const mets = metrics[modelName] || {};
        const avgR2 = mets.food_required
            ? ((mets.food_required.r2 + mets.medical_required.r2 + mets.shelter_required.r2) / 3).toFixed(4)
            : 'N/A';

        html += `
        <div class="prediction-card ${isBest ? 'best' : ''}">
            ${isBest ? '<div class="badge badge-emerald mb-1" style="margin-bottom:0.75rem">✓ Best Model</div>' : ''}
            <div class="model-name">${modelLabels[modelName] || modelName}</div>
            <div style="margin-bottom:0.75rem">
                <div class="text-muted" style="font-size:0.7rem;margin-bottom:0.25rem">FOOD REQUIRED</div>
                <div class="prediction-value" style="color:${modelColors[modelName]}">${formatNumber(preds.food_required)}</div>
            </div>
            <div style="margin-bottom:0.75rem">
                <div class="text-muted" style="font-size:0.7rem;margin-bottom:0.25rem">MEDICAL KITS</div>
                <div style="font-size:1.4rem;font-weight:700;color:var(--accent-rose)">${formatNumber(preds.medical_required)}</div>
            </div>
            <div style="margin-bottom:0.75rem">
                <div class="text-muted" style="font-size:0.7rem;margin-bottom:0.25rem">SHELTER UNITS</div>
                <div style="font-size:1.4rem;font-weight:700;color:var(--accent-emerald)">${formatNumber(preds.shelter_required)}</div>
            </div>
            <div class="metric" style="border-top:1px solid var(--border-color);padding-top:0.75rem;margin-top:0.5rem">
                <span class="text-muted">Avg R²:</span>
                <span class="fw-700" style="color:${parseFloat(avgR2) > 0.9 ? 'var(--accent-emerald)' : 'var(--accent-amber)'}">${avgR2}</span>
            </div>
        </div>`;
    }

    html += '</div>';

    // Comparison chart
    html += `
    <div class="card">
        <div class="card-header"><h3>📈 Model Comparison</h3></div>
        <div class="card-body">
            <div class="chart-container" style="min-height:280px">
                <canvas id="comparison-chart"></canvas>
            </div>
        </div>
    </div>`;

    container.innerHTML = html;
    container.style.display = 'block';

    // Render comparison chart
    setTimeout(() => renderComparisonChart(predictions, modelColors), 100);
}

function renderComparisonChart(predictions, colors) {
    const ctx = document.getElementById('comparison-chart');
    if (!ctx) return;

    const models = Object.keys(predictions);
    const labels = ['Food Required', 'Medical Kits', 'Shelter Units'];
    const targets = ['food_required', 'medical_required', 'shelter_required'];

    const datasets = models.map(model => ({
        label: model === 'xgboost' ? 'XGBoost' : model === 'random_forest' ? 'Random Forest' : 'Linear Regression',
        data: targets.map(t => predictions[model][t]),
        backgroundColor: colors[model] + '99',
        borderColor: colors[model],
        borderWidth: 2,
        borderRadius: 6,
    }));

    new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.04)' },
                    ticks: {
                        callback: v => formatNumber(v),
                    },
                },
                x: {
                    grid: { display: false },
                },
            },
        },
    });
}

// ── Custom Confirm Modal Functionality ─────────────────────────────────────
function showConfirmModal(message, onConfirm) {
    const modal = document.getElementById('custom-confirm-modal');
    const messageEl = document.getElementById('modal-message');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    
    if (!modal || !messageEl || !confirmBtn) {
        if (confirm(message)) onConfirm();
        return;
    }
    
    messageEl.textContent = message;
    modal.classList.add('open');
    
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    newConfirmBtn.addEventListener('click', () => {
        closeConfirmModal();
        onConfirm();
    });
}

function closeConfirmModal() {
    const modal = document.getElementById('custom-confirm-modal');
    if (modal) {
        modal.classList.remove('open');
    }
}

// ── Allocate Resources AJAX ────────────────────────────────────────────────
function allocateResources(disasterId) {
    showConfirmModal('Are you sure you want to allocate resources for this disaster?', () => {
        fetch('/api/allocate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ disaster_id: disasterId }),
        })
            .then(res => res.json())
            .then(result => {
                if (result.error) {
                    showFlash(result.error, 'error');
                } else {
                    showFlash(result.message || 'Resources allocated successfully!', 'success');
                    setTimeout(() => location.reload(), 1500);
                }
            })
            .catch(err => showFlash('Allocation failed: ' + err.message, 'error'));
    });
}


// ── Flash Messages ─────────────────────────────────────────────────────────
function showFlash(message, type = 'info') {
    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    const container = document.querySelector('.flash-messages') || createFlashContainer();

    const flash = document.createElement('div');
    flash.className = `flash-message ${type}`;
    flash.innerHTML = `<span>${icons[type] || 'ℹ'}</span> ${message}`;
    container.appendChild(flash);

    setTimeout(() => flash.remove(), 5000);
}

function createFlashContainer() {
    const container = document.createElement('div');
    container.className = 'flash-messages';
    const pageContent = document.querySelector('.page-content');
    if (pageContent) {
        pageContent.parentNode.insertBefore(container, pageContent);
    } else {
        document.body.appendChild(container);
    }
    return container;
}

// ── Leaflet Map Initialization ─────────────────────────────────────────────
function initDisasterMap(disasters, warehouses) {
    const mapEl = document.getElementById('disaster-map');
    if (!mapEl) return;

    const map = L.map('disaster-map', {
        zoomControl: true,
        scrollWheelZoom: true,
    }).setView([22.5, 80], 5);

    // Light tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© CartoDB © OpenStreetMap',
        subdomains: 'abcd',
        maxZoom: 19,
    }).addTo(map);

    // Severity colour scale
    function getSeverityColor(sev) {
        if (sev >= 8) return '#f43f5e';
        if (sev >= 6) return '#f97316';
        if (sev >= 4) return '#f59e0b';
        return '#10b981';
    }

    // Disaster markers
    if (disasters && disasters.length) {
        disasters.forEach(d => {
            const color = getSeverityColor(d.severity);
            const marker = L.circleMarker([d.latitude, d.longitude], {
                radius: Math.max(6, d.severity * 1.2),
                fillColor: color,
                color: color,
                weight: 2,
                opacity: 0.9,
                fillOpacity: 0.5,
            }).addTo(map);

            marker.bindPopup(`
                <h4>${d.disaster_type}</h4>
                <p><strong>District:</strong> ${d.district}, ${d.state}</p>
                <p><strong>Severity:</strong> ${d.severity}/10</p>
                <p><strong>Population:</strong> ${Number(d.population_affected).toLocaleString()}</p>
                <p><strong>Status:</strong> ${d.status || 'Active'}</p>
            `);
        });
    }

    // Warehouse markers
    if (warehouses && warehouses.length) {
        const whIcon = L.divIcon({
            className: 'custom-warehouse-icon',
            html: '<div style="background:#3b82f6;width:12px;height:12px;border-radius:3px;border:2px solid #fff;box-shadow:0 0 6px rgba(59,130,246,0.5)"></div>',
            iconSize: [12, 12],
            iconAnchor: [6, 6],
        });

        warehouses.forEach(wh => {
            const marker = L.marker([wh.latitude, wh.longitude], { icon: whIcon }).addTo(map);
            marker.bindPopup(`
                <h4>🏭 ${wh.warehouse_name || wh.warehouse_id}</h4>
                <p><strong>Location:</strong> ${wh.district}, ${wh.state}</p>
                <p><strong>Food Stock:</strong> ${Number(wh.food_stock).toLocaleString()}</p>
                <p><strong>Medical Stock:</strong> ${Number(wh.medical_stock).toLocaleString()}</p>
                <p><strong>Shelter Stock:</strong> ${Number(wh.shelter_stock).toLocaleString()}</p>
            `);
        });
    }

    return map;
}

// ── Dashboard Charts ───────────────────────────────────────────────────────
function renderDashboardCharts(data) {
    if (!data) return;

    // Disaster Type Distribution (Doughnut)
    const dtCtx = document.getElementById('disaster-type-chart');
    if (dtCtx && data.type_distribution) {
        new Chart(dtCtx, {
            type: 'doughnut',
            data: {
                labels: data.type_distribution.labels,
                datasets: [{
                    data: data.type_distribution.values,
                    backgroundColor: [
                        '#3b82f6', '#10b981', '#f59e0b',
                        '#f43f5e', '#8b5cf6', '#06b6d4'
                    ],
                    borderWidth: 0,
                    hoverOffset: 8,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: { position: 'bottom', labels: { padding: 12 } },
                },
            },
        });
    }

    // Resource Demand Bar Chart (Predicted vs. Allocated)
    const rdCtx = document.getElementById('resource-demand-chart');
    if (rdCtx && data.resource_totals) {
        new Chart(rdCtx, {
            type: 'bar',
            data: {
                labels: ['Food', 'Medical', 'Shelter'],
                datasets: [
                    {
                        label: 'Predicted Demand',
                        data: [
                            data.resource_totals.food,
                            data.resource_totals.medical,
                            data.resource_totals.shelter,
                        ],
                        backgroundColor: 'rgba(59, 130, 246, 0.45)',
                        borderColor: '#3b82f6',
                        borderWidth: 2,
                        borderRadius: 6,
                    },
                    {
                        label: 'Allocated Resources',
                        data: [
                            data.resource_allocated ? data.resource_allocated.food : 0,
                            data.resource_allocated ? data.resource_allocated.medical : 0,
                            data.resource_allocated ? data.resource_allocated.shelter : 0,
                        ],
                        backgroundColor: 'rgba(16, 185, 129, 0.45)',
                        borderColor: '#10b981',
                        borderWidth: 2,
                        borderRadius: 6,
                    }
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true, labels: { color: '#475569', padding: 10 } },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.06)' },
                        ticks: { callback: v => formatNumber(v) },
                    },
                    x: { grid: { display: false } },
                },
            },
        });
    }

    // Severity Distribution
    const sevCtx = document.getElementById('severity-chart');
    if (sevCtx && data.severity_distribution) {
        new Chart(sevCtx, {
            type: 'bar',
            data: {
                labels: data.severity_distribution.labels,
                datasets: [{
                    label: 'Disasters',
                    data: data.severity_distribution.values,
                    backgroundColor: data.severity_distribution.labels.map(s => {
                        if (s >= 8) return '#f43f5e99';
                        if (s >= 6) return '#f9731699';
                        if (s >= 4) return '#f59e0b99';
                        return '#10b98199';
                    }),
                    borderRadius: 4,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.06)' },
                    },
                    x: {
                        grid: { display: false },
                        title: { display: true, text: 'Severity Level' },
                    },
                },
            },
        });
    }
}
