
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');
const themeToggleBtn = document.getElementById('theme-toggle');

if (localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    themeToggleLightIcon.classList.remove('hidden');
    document.documentElement.classList.add('dark');
} else {
    themeToggleDarkIcon.classList.remove('hidden');
    document.documentElement.classList.remove('dark');
}

themeToggleBtn.addEventListener('click', function() {
    themeToggleDarkIcon.classList.toggle('hidden');
    themeToggleLightIcon.classList.toggle('hidden');

    if (localStorage.getItem('color-theme')) {
        if (localStorage.getItem('color-theme') === 'light') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('color-theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('color-theme', 'light');
        }
    } else {
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('color-theme', 'light');
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('color-theme', 'dark');
        }
    }
    updateChartColors();
});


function formatNumber(num) {
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatCurrency(num) {
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}


function getLocalDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}


function getStartOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
}


function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Segunda = início
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
}

// Retorna início do mês
function getStartOfMonth(date) {
    const d = new Date(date);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
}


async function updateDashboardCards() {
    const now = new Date();
    const startOfDay = getStartOfDay(now);
    const startOfWeek = getStartOfWeek(now);
    const startOfMonth = getStartOfMonth(now);

    try {
      
        const { data: latest, error: errLatest } = await supabaseClient
            .from('leituras')
            .select('vazao, total, created_at')
            .order('created_at', { ascending: false })
            .limit(1);

        if (errLatest) throw errLatest;

        const fluxoEl = document.getElementById('fluxo-atual');
        const statusEl = document.getElementById('sensor-status');

        if (latest && latest.length > 0) {
            const leitura = latest[0];
            if (fluxoEl) fluxoEl.textContent = `${formatNumber(leitura.vazao)} L/min`;

            
            const lastTime = new Date(leitura.created_at);
            const diffSeconds = (now - lastTime) / 1000;

            if (statusEl) {
                if (diffSeconds < 30) {
                    statusEl.innerHTML = '<i class="fa-solid fa-circle text-green-400 text-xs mr-1 animate-pulse"></i>Sensor Online';
                } else if (diffSeconds < 120) {
                    statusEl.innerHTML = '<i class="fa-solid fa-circle text-yellow-400 text-xs mr-1"></i>Sem dados recentes';
                } else {
                    statusEl.innerHTML = '<i class="fa-solid fa-circle text-red-400 text-xs mr-1"></i>Sensor Offline';
                }
            }
        } else {
            if (fluxoEl) fluxoEl.textContent = '0.00 L/min';
            if (statusEl) statusEl.innerHTML = '<i class="fa-solid fa-circle text-gray-400 text-xs mr-1"></i>Sem dados';
        }

        
        const { data: todayData, error: errToday } = await supabaseClient
            .from('leituras')
            .select('total')
            .gte('created_at', startOfDay)
            .order('created_at', { ascending: true });

        if (errToday) throw errToday;

        let consumoHoje = 0;
        if (todayData && todayData.length > 1) {
            consumoHoje = todayData[todayData.length - 1].total - todayData[0].total;
        } else if (todayData && todayData.length === 1) {
            consumoHoje = todayData[0].total;
        }

        const consumoHojeEl = document.getElementById('consumo-hoje');
        const gastoHojeEl = document.getElementById('gasto-hoje');
        if (consumoHojeEl) consumoHojeEl.textContent = `${formatNumber(consumoHoje)} L`;
        if (gastoHojeEl) gastoHojeEl.textContent = `Gasto: R$ ${formatCurrency(consumoHoje * PRECO_POR_LITRO)}`;

       
        const { data: weekData, error: errWeek } = await supabaseClient
            .from('leituras')
            .select('total')
            .gte('created_at', startOfWeek)
            .order('created_at', { ascending: true });

        if (errWeek) throw errWeek;

        let consumoSemana = 0;
        if (weekData && weekData.length > 1) {
            consumoSemana = weekData[weekData.length - 1].total - weekData[0].total;
        } else if (weekData && weekData.length === 1) {
            consumoSemana = weekData[0].total;
        }

        const consumoSemanaEl = document.getElementById('consumo-semana');
        const gastoSemanaEl = document.getElementById('gasto-semana');
        if (consumoSemanaEl) consumoSemanaEl.textContent = `${formatNumber(consumoSemana)} L`;
        if (gastoSemanaEl) gastoSemanaEl.textContent = `Gasto: R$ ${formatCurrency(consumoSemana * PRECO_POR_LITRO)}`;

       
        const { data: monthData, error: errMonth } = await supabaseClient
            .from('leituras')
            .select('total')
            .gte('created_at', startOfMonth)
            .order('created_at', { ascending: true });

        if (errMonth) throw errMonth;

        let consumoMes = 0;
        if (monthData && monthData.length > 1) {
            consumoMes = monthData[monthData.length - 1].total - monthData[0].total;
        } else if (monthData && monthData.length === 1) {
            consumoMes = monthData[0].total;
        }

        const consumoMesEl = document.getElementById('consumo-mes');
        const gastoMesEl = document.getElementById('gasto-mes');
        if (consumoMesEl) consumoMesEl.textContent = `${formatNumber(consumoMes)} L`;
        if (gastoMesEl) gastoMesEl.textContent = `Gasto: R$ ${formatCurrency(consumoMes * PRECO_POR_LITRO)}`;

    } catch (err) {
        console.error('Erro ao atualizar cards:', err);
    }
}


let areaChart, lineChart;

function initCharts() {
    const areaCanvas = document.getElementById('areaChart');
    const lineCanvas = document.getElementById('lineChart');
    if (!areaCanvas || !lineCanvas) return;

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#9ca3af' : '#6b7280';
    const gridColor = isDark ? '#374151' : '#e5e7eb';

    
    const ctxArea = areaCanvas.getContext('2d');
    const gradientArea = ctxArea.createLinearGradient(0, 0, 0, 400);
    gradientArea.addColorStop(0, 'rgba(30, 182, 255, 0.6)');
    gradientArea.addColorStop(1, 'rgba(30, 182, 255, 0.0)');

    areaChart = new Chart(ctxArea, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Consumo Mensal (L)',
                data: [],
                borderColor: '#1fb6ff',
                backgroundColor: gradientArea,
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#1fb6ff',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false, color: gridColor }, ticks: { color: textColor } },
                y: { grid: { color: gridColor, borderDash: [5, 5] }, ticks: { color: textColor } }
            }
        }
    });

    
    const ctxLine = lineCanvas.getContext('2d');
    lineChart = new Chart(ctxLine, {
        type: 'line',
        data: {
            labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
            datasets: [{
                label: 'Consumo Diário (L)',
                data: [0, 0, 0, 0, 0, 0, 0],
                borderColor: '#1fb6ff',
                backgroundColor: 'transparent',
                borderWidth: 2,
                tension: 0.4,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#1fb6ff',
                pointRadius: 4,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: textColor, boxWidth: 12, usePointStyle: true }
                }
            },
            scales: {
                x: { grid: { display: false, color: gridColor }, ticks: { color: textColor } },
                y: { grid: { color: gridColor, borderDash: [5, 5] }, ticks: { color: textColor } }
            }
        }
    });

    loadMonthlyChart();
    loadWeeklyChart();
}

async function loadMonthlyChart() {
    if (!areaChart) return;

    try {
        const now = new Date();
        const labels = [];
        const dataValues = [];
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
            const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

            labels.push(monthNames[d.getMonth()]);

            const { data, error } = await supabaseClient
                .from('leituras')
                .select('total')
                .gte('created_at', startOfMonth.toISOString())
                .lte('created_at', endOfMonth.toISOString())
                .order('created_at', { ascending: true });

            if (error) throw error;

            let consumo = 0;
            if (data && data.length > 1) {
                consumo = data[data.length - 1].total - data[0].total;
            } else if (data && data.length === 1) {
                consumo = data[0].total;
            }
            dataValues.push(parseFloat(consumo.toFixed(2)));
        }

        areaChart.data.labels = labels;
        areaChart.data.datasets[0].data = dataValues;
        areaChart.update();

    } catch (err) {
        console.error('Erro ao carregar gráfico mensal:', err);
    }
}

async function loadWeeklyChart() {
    if (!lineChart) return;

    try {
        const now = new Date();
        const day = now.getDay();
        const monday = new Date(now);
        monday.setDate(now.getDate() - day + (day === 0 ? -6 : 1));
        monday.setHours(0, 0, 0, 0);

        const dailyData = [0, 0, 0, 0, 0, 0, 0];

        for (let i = 0; i < 7; i++) {
            const dayStart = new Date(monday);
            dayStart.setDate(monday.getDate() + i);
            dayStart.setHours(0, 0, 0, 0);

            const dayEnd = new Date(dayStart);
            dayEnd.setHours(23, 59, 59, 999);

            if (dayStart > now) break;

            const { data, error } = await supabaseClient
                .from('leituras')
                .select('total')
                .gte('created_at', dayStart.toISOString())
                .lte('created_at', dayEnd.toISOString())
                .order('created_at', { ascending: true });

            if (error) throw error;

            if (data && data.length > 1) {
                dailyData[i] = parseFloat((data[data.length - 1].total - data[0].total).toFixed(2));
            } else if (data && data.length === 1) {
                dailyData[i] = parseFloat(data[0].total.toFixed(2));
            }
        }

        lineChart.data.datasets[0].data = dailyData;
        lineChart.update();

    } catch (err) {
        console.error('Erro ao carregar gráfico semanal:', err);
    }
}

function updateChartColors() {
    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#9ca3af' : '#6b7280';
    const gridColor = isDark ? '#374151' : '#e5e7eb';

    if (areaChart && lineChart) {
        areaChart.options.scales.x.ticks.color = textColor;
        areaChart.options.scales.y.ticks.color = textColor;
        areaChart.options.scales.x.grid.color = gridColor;
        areaChart.options.scales.y.grid.color = gridColor;
        areaChart.update();

        lineChart.options.scales.x.ticks.color = textColor;
        lineChart.options.scales.y.ticks.color = textColor;
        lineChart.options.scales.x.grid.color = gridColor;
        lineChart.options.scales.y.grid.color = gridColor;
        lineChart.options.plugins.legend.labels.color = textColor;
        lineChart.update();
    }
}


function subscribeRealtime() {
    supabaseClient
        .channel('leituras-realtime')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leituras' }, (payload) => {
            console.log('Nova leitura recebida:', payload.new);

            const fluxoEl = document.getElementById('fluxo-atual');
            const statusEl = document.getElementById('sensor-status');
            if (fluxoEl) fluxoEl.textContent = `${formatNumber(payload.new.vazao)} L/min`;
            if (statusEl) statusEl.innerHTML = '<i class="fa-solid fa-circle text-green-400 text-xs mr-1 animate-pulse"></i>Sensor Online';

            // Recalcular cards e gráficos
            updateDashboardCards();
            loadWeeklyChart();
        })
        .subscribe((status) => {
            console.log('Realtime status:', status);
        });
}



document.addEventListener('DOMContentLoaded', () => {
    initCharts();

    updateDashboardCards();

    subscribeRealtime();

    setInterval(updateDashboardCards, 15000);
});
