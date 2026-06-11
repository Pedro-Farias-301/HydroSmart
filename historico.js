const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function formatNum(num) {
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatMoeda(num) {
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function getConsumoMes(year, month) {
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const { data, error } = await supabaseClient
        .from('leituras')
        .select('total')
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString())
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Erro ao buscar dados do mês:', error);
        return 0;
    }

    if (data && data.length > 1) {
        return data[data.length - 1].total - data[0].total;
    } else if (data && data.length === 1) {
        return data[0].total;
    }
    return 0;
}

async function loadHistoricoCards() {
    const now = new Date();

    for (let i = 1; i <= 3; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = d.getFullYear();
        const month = d.getMonth();

        const consumo = await getConsumoMes(year, month);
        const gasto = consumo * PRECO_POR_LITRO;

        const tituloEl = document.getElementById(`hist-mes${i}-titulo`);
        const volumeEl = document.getElementById(`hist-mes${i}-volume`);
        const valorEl = document.getElementById(`hist-mes${i}-valor`);

        if (tituloEl) tituloEl.textContent = `${monthNames[month]} / ${year}`;
        if (volumeEl) volumeEl.textContent = `${formatNum(consumo)} L`;
        if (valorEl) valorEl.textContent = `R$ ${formatMoeda(gasto)}`;
    }
}

async function loadHistoricoTabela() {
    const tbody = document.getElementById('historico-tbody');
    if (!tbody) return;

    const now = new Date();
    const meses = [];

    for (let i = 1; i <= 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const consumo = await getConsumoMes(d.getFullYear(), d.getMonth());
        meses.push({
            label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
            consumo: consumo,
            gasto: consumo * PRECO_POR_LITRO
        });
    }

    const consumos = meses.map(m => m.consumo).filter(c => c > 0);
    const media = consumos.length > 0 ? consumos.reduce((a, b) => a + b, 0) / consumos.length : 0;

    if (meses.every(m => m.consumo === 0)) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-8 text-center text-gray-400">
                    <i class="fa-solid fa-database mr-2"></i>Nenhum dado histórico encontrado
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = '';

    meses.forEach(mes => {
        if (mes.consumo === 0) return; 

        let statusHTML = '';
        if (media > 0) {
            const percentual = ((mes.consumo - media) / media) * 100;
            if (percentual > 15) {
                statusHTML = '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Acima da média</span>';
            } else if (percentual < -15) {
                statusHTML = '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Abaixo da média</span>';
            } else if (percentual > 5) {
                statusHTML = '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Atenção</span>';
            } else {
                statusHTML = '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Normal</span>';
            }
        }

        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors';
        tr.innerHTML = `
            <td class="px-6 py-4 font-semibold">${mes.label}</td>
            <td class="px-6 py-4">${formatNum(mes.consumo)} L</td>
            <td class="px-6 py-4 text-gray-900 dark:text-white font-medium">R$ ${formatMoeda(mes.gasto)}</td>
            <td class="px-6 py-4">${statusHTML}</td>
            <td class="px-6 py-4 text-right">
                <button class="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                    <i class="fa-solid fa-eye"></i>
                </button>
            </td>`;
        tbody.appendChild(tr);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadHistoricoCards();
    loadHistoricoTabela();
});
