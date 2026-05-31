let fuelLogs = JSON.parse(localStorage.getItem('fuelLogs')) || [];
let priceChart = null;

document.getElementById('fuel-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const price = parseFloat(document.getElementById('price').value);
    const total = parseFloat(document.getElementById('total').value);
    const km = parseInt(document.getElementById('km').value);
    const liters = total / price;
    const date = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });

    const newLog = { price, total, km, liters, date, timestamp: Date.now() };
    fuelLogs.push(newLog);
    
    fuelLogs.sort((a, b) => b.timestamp - a.timestamp);
    
    saveAndRefresh();
    this.reset();
});

function saveAndRefresh() {
    localStorage.setItem('fuelLogs', JSON.stringify(fuelLogs));
    renderLogs();
    renderChart();
    calculateStats();
}

function renderLogs() {
    const container = document.getElementById('log-container');
    container.innerHTML = '';

    if(fuelLogs.length === 0) {
        container.innerHTML = `<p class="text-center text-sm text-slate-500 py-6">Nessun dato registrato</p>`;
        return;
    }

    fuelLogs.forEach((log, index) => {
        let kmPerLiterText = "--";
        if (index < fuelLogs.length - 1) {
            const previousLog = fuelLogs[index + 1];
            const kmDriven = log.km - previousLog.km;
            if (kmDriven > 0) {
                kmPerLiterText = (kmDriven / log.liters).toFixed(2) + " km/L";
            }
        }

        const div = document.createElement('div');
        div.className = "bg-slate-800/60 border border-slate-700/40 rounded-xl p-3.5 flex justify-between items-center";
        div.innerHTML = `
            <div>
                <p class="text-sm font-semibold text-slate-200">${log.total.toFixed(2)} € @ ${log.price.toFixed(3)}€/L</p>
                <p class="text-xs text-slate-400">${log.date} • ${log.km} km totali</p>
            </div>
            <div class="text-right">
                <span class="text-xs font-bold px-2 py-1 rounded bg-slate-900 text-cyan-400 border border-slate-700">${kmPerLiterText}</span>
            </div>
        `;
        container.appendChild(div);
    });
}

function calculateStats() {
    if(fuelLogs.length < 2) return;
    const totalLiters = fuelLogs.slice(0, -1).reduce((sum, log) => sum + log.liters, 0);
    const totalKm = fuelLogs[0].km - fuelLogs[fuelLogs.length - 1].km;
    
    if(totalKm > 0 && totalLiters > 0) {
        const avg = (totalKm / totalLiters).toFixed(2);
        document.getElementById('stats-badge').innerText = `${avg} km/L Medi`;
    }
}

function renderChart() {
    const ctx = document.getElementById('priceChart').getContext('2d');
    const chartData = [...fuelLogs].reverse();

    const labels = chartData.map(l => l.date);
    const prices = chartData.map(l => l.price);

    if (priceChart) priceChart.destroy();

    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Prezzo Carburante',
                data: prices,
                borderColor: '#10b981',
                borderWidth: 2,
                backgroundColor: 'rgba(16, 185, 129, 0.05)',
                fill: true,
                tension: 0.3,
                pointRadius: 4,
                pointBackgroundColor: '#10b981'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } },
                y: { grid: { color: 'rgba(148, 163, 184, 0.05)' }, ticks: { color: '#94a3b8', font: { size: 10 } } }
            }
        }
    });
}

function exportData() {
    let csvContent = "data:text/csv;charset=utf-8,Data,Prezzo al Litro,Spesa Totale,Chilometri\n";
    fuelLogs.forEach(log => {
        csvContent += `${log.date},${log.price},${log.total},${log.km}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "fueltrack_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function clearAllData() {
    if(confirm("Sei sicuro di voler cancellare tutto lo storico? L'azione è irreversibile.")) {
        fuelLogs = [];
        saveAndRefresh();
    }
}

window.onload = function() {
    saveAndRefresh();
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(err => console.log("SW error:", err));
    }
};
