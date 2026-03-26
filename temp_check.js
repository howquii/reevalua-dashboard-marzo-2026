
// ========== TAB NAVIGATION ==========
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
});

// ========== GLOBAL CHART DEFAULTS ==========
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.color = '#6b7280';
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.pointStyleWidth = 8;
Chart.defaults.plugins.legend.labels.padding = 16;

const dayLabels = ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23'];

// ========== DATA ==========
// Mixpanel daily totals (Subscription event unique users — API real)
const totalDaily = [324,440,410,370,343,343,293,326,462,446,419,387,307,357,328,265,235,298,249,357,297,397,395];

// Meta daily registros (Mixpanel utm) — Mar 19-23 estimado proporcional (39.6%)
const metaTotal = [156,179,162,166,129,148,119,135,152,153,129,125,114,157,144,146,134,118,99,141,118,157,156];

// TikTok daily (Mixpanel) — Mar 18-23: tiktok-web+TikTok estimado 26.4%
const tiktokTotal = [96,126,118,110,124,116,103,101,139,162,144,135,84,110,91,22,1,79,66,94,78,105,104];

// Organic daily — Mar 18-23 estimado (19.8%)
const organicTotal = [60,107,89,67,77,76,63,84,166,125,101,122,100,85,88,96,93,59,49,71,59,79,78];

// B2B / Partners / Merite / QR daily — Mar 18-23 estimado (14.2%)
const b2bTotal = [10,30,22,14,0,0,0,0,0,0,31,0,0,0,1,0,0,42,35,51,42,56,57];

// TikTok campaign daily conversions (TikTok screenshots reales Mar 1-23)
const ttGratis = [81,80,64,83,85,97,78,80,124,126,104,117,64,76,65,15,0,69,80,98,87,69,92];
const ttMicro = [57,88,53,52,66,59,61,49,78,75,81,64,44,71,71,18,0,53,49,47,51,47,48];
const ttEmprendedor = [17,40,20,19,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
const ttTotalConv = ttGratis.map((v,i)=>v+ttMicro[i]+ttEmprendedor[i]);

// TikTok daily costs PEN (micro+gratis+emprendedor — screenshots reales Mar 1-23)
const ttDailyCostPEN = [263.04,302.02,239.10,230.42,209.78,203.38,201.98,204.29,224.65,214.08,209.61,201.36,202.18,213.83,211.05,54.65,0.01,242.56,262.32,262.43,261.98,219.57,212.72];

// TikTok Microcredito daily costs PEN (screenshot real)
const ttMicroCostPEN = [80.48,83.27,59.03,65.49,72.10,64.92,64.71,64.26,84.81,73.91,69.07,61.12,60.19,76.64,70.73,19.57,0,67.56,87.32,87.50,87.32,79.54,72.53];

// TikTok Emprendedor daily costs PEN
const ttEmprendedorCostPEN = [32.84,78.73,41.78,26.37,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

// TikTok Gratis daily cost per conv (screenshot real)
const ttGratisCPConv = [1.85,1.75,2.16,1.67,1.62,1.43,1.76,1.75,1.13,1.11,1.35,1.20,2.22,1.76,2.06,2.34,0,2.54,2.19,1.79,2.01,2.03,1.52];
// compute TikTok Gratis daily costs PEN
const ttGratisCostPEN = ttGratis.map((v,i) => +(v * ttGratisCPConv[i]).toFixed(2));

// Meta daily spend USD (Mar 1-18 real via API, Mar 19-23 REAL via API)
const metaDailySpend = [83.91,84.11,75.83,67.85,60.60,59.23,57.74,65.77,72.74,63.51,53.56,62.10,60.47,63.23,69.35,68.28,64.65,68.00,27.55,130.41,100.42,98.33,100.34];

// Client types daily — Mar 18-23 estimado (proporciones: 45.2% banc, 39.1% perd, 9.4% opt, 7.1% pago)
const banc = [103,160,156,159,164,158,149,170,222,218,192,163,146,151,157,115,103,135,113,161,134,179,179];
const perd = [167,198,167,152,119,128,95,107,165,146,138,159,120,147,121,101,87,117,97,140,116,155,154];
const opt = [17,45,37,27,33,25,27,24,38,42,49,36,17,37,35,33,28,28,23,34,28,37,37];
const pago = [29,39,37,28,22,25,20,18,25,32,30,24,24,20,15,17,17,21,18,25,21,28,28];

// Colors
const C = {
    purple: '#7c3aed', purpleLight: 'rgba(124,58,237,0.15)',
    blue: '#3b82f6', blueLight: 'rgba(59,130,246,0.15)',
    green: '#22c55e', greenLight: 'rgba(34,197,94,0.15)',
    red: '#ef4444', redLight: 'rgba(239,68,68,0.15)',
    orange: '#f97316', orangeLight: 'rgba(249,115,22,0.15)',
    teal: '#14b8a6', tealLight: 'rgba(20,184,166,0.15)',
    pink: '#ec4899', pinkLight: 'rgba(236,72,153,0.15)',
    meta: '#1877f2', metaLight: 'rgba(24,119,242,0.15)',
    tiktok: '#00c9a7', tiktokLight: 'rgba(0,201,167,0.15)',
    gray: '#9ca3af'
};

// ========== TAB 1 CHARTS ==========

// Feb vs Mar comparison
new Chart(document.getElementById('chartFebVsMar'), {
    type: 'bar',
    data: {
        labels: ['Registros Totales', 'Promedio Diario', 'Dias Contados'],
        datasets: [
            {
                label: 'Feb 1-23',
                data: [16703, 726, 23],
                backgroundColor: 'rgba(124,58,237,0.7)',
                borderRadius: 6,
            },
            {
                label: 'Mar 1-23',
                data: [8001, 348, 23],
                backgroundColor: 'rgba(20,184,166,0.7)',
                borderRadius: 6,
            }
        ]
    },
    options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: {
            y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
            x: { grid: { display: false } }
        }
    }
});

// Source doughnut
new Chart(document.getElementById('chartSourceDoughnut'), {
    type: 'doughnut',
    data: {
        labels: ['Meta Ads (41.6%)', 'TikTok Ads (18.4%)', 'Organico (20.6%)', 'Merite+B2B+QR (16.0%)', 'Sin UTM (4.1%)'],
        datasets: [{
            data: [3332, 1472, 1648, 1283, 325],
            backgroundColor: [C.meta, C.tiktok, C.purple, C.orange, C.gray],
            borderWidth: 2,
            borderColor: '#fff',
            hoverOffset: 8
        }]
    },
    options: {
        responsive: true, maintainAspectRatio: false,
        cutout: '55%',
        plugins: {
            legend: { position: 'bottom', labels: { font: { size: 12 } } }
        }
    }
});

// ========== TAB 2 CHARTS ==========

// Daily total line
new Chart(document.getElementById('chartDailyTotal'), {
    type: 'line',
    data: {
        labels: dayLabels,
        datasets: [{
            label: 'Registros',
            data: totalDaily,
            borderColor: C.purple,
            backgroundColor: C.purpleLight,
            fill: true,
            tension: 0.3,
            pointRadius: 4,
            pointBackgroundColor: C.purple,
            borderWidth: 2.5
        }]
    },
    options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    title: ctx => 'Marzo ' + ctx[0].label
                }
            }
        },
        scales: {
            y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
            x: { grid: { display: false }, title: { display: true, text: 'Dia de Marzo' } }
        }
    }
});

// Stacked area by channel
new Chart(document.getElementById('chartStackedArea'), {
    type: 'line',
    data: {
        labels: dayLabels,
        datasets: [
            { label: 'Meta Ads', data: metaTotal, borderColor: C.meta, backgroundColor: 'rgba(24,119,242,0.25)', fill: true, tension: 0.3, borderWidth: 2 },
            { label: 'TikTok Ads', data: tiktokTotal, borderColor: C.tiktok, backgroundColor: 'rgba(0,201,167,0.25)', fill: true, tension: 0.3, borderWidth: 2 },
            { label: 'Organico', data: organicTotal, borderColor: C.purple, backgroundColor: 'rgba(124,58,237,0.2)', fill: true, tension: 0.3, borderWidth: 2 },
            { label: 'B2B/Otros', data: b2bTotal, borderColor: C.orange, backgroundColor: 'rgba(249,115,22,0.2)', fill: true, tension: 0.3, borderWidth: 2 }
        ]
    },
    options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: {
            y: { stacked: true, beginAtZero: true, grid: { color: '#f3f4f6' } },
            x: { grid: { display: false }, title: { display: true, text: 'Dia de Marzo' } }
        }
    }
});

// Meta daily line chart
new Chart(document.getElementById('chartMetaDaily'), {
    type: 'line',
    data: {
        labels: dayLabels,
        datasets: [{
            label: 'Registros Meta (Mixpanel)',
            data: metaTotal,
            borderColor: C.meta,
            backgroundColor: C.metaLight,
            fill: true,
            tension: 0.3,
            borderWidth: 2.5,
            pointRadius: 3,
            pointBackgroundColor: C.meta
        }]
    },
    options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { font: { size: 11 } } } },
        scales: {
            y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
            x: { grid: { display: false } }
        }
    }
});

// TikTok daily conversions + cost overlaid
new Chart(document.getElementById('chartTikTokDaily'), {
    type: 'bar',
    data: {
        labels: dayLabels,
        datasets: [
            {
                label: 'Conversiones TikTok',
                data: ttTotalConv,
                backgroundColor: C.tiktok + 'aa',
                borderRadius: 4,
                borderSkipped: false,
                yAxisID: 'y',
                order: 2
            },
            {
                label: 'Costo PEN',
                data: ttDailyCostPEN,
                type: 'line',
                borderColor: C.red,
                backgroundColor: 'transparent',
                borderWidth: 2,
                pointRadius: 3,
                pointBackgroundColor: C.red,
                tension: 0.3,
                yAxisID: 'y1',
                order: 1
            }
        ]
    },
    options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top', labels: { font: { size: 11 } } },
            tooltip: {
                callbacks: {
                    label: function(ctx) {
                        if (ctx.dataset.yAxisID === 'y1') return 'Costo: S/' + ctx.raw.toFixed(2) + ' PEN';
                        return 'Conversiones: ' + ctx.raw;
                    }
                }
            }
        },
        scales: {
            y: { beginAtZero: true, grid: { color: '#f3f4f6' }, title: { display: true, text: 'Conversiones' } },
            y1: { beginAtZero: true, position: 'right', grid: { display: false }, title: { display: true, text: 'Costo PEN' } },
            x: { grid: { display: false } }
        }
    }
});

// TikTok campaigns stacked
new Chart(document.getElementById('chartTikTokCampaigns'), {
    type: 'line',
    data: {
        labels: dayLabels,
        datasets: [
            { label: 'Reevalua Gratis', data: ttGratis, borderColor: C.teal, backgroundColor: 'rgba(20,184,166,0.3)', fill: true, tension: 0.3, borderWidth: 2 },
            { label: 'Microcredito', data: ttMicro, borderColor: C.green, backgroundColor: 'rgba(34,197,94,0.25)', fill: true, tension: 0.3, borderWidth: 2 },
            { label: 'Credito Emprendedor', data: ttEmprendedor, borderColor: C.orange, backgroundColor: 'rgba(249,115,22,0.25)', fill: true, tension: 0.3, borderWidth: 2 }
        ]
    },
    options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: {
            y: { stacked: true, beginAtZero: true, grid: { color: '#f3f4f6' } },
            x: { grid: { display: false }, title: { display: true, text: 'Dia de Marzo' } }
        }
    }
});

// Organic daily
new Chart(document.getElementById('chartOrganicDaily'), {
    type: 'line',
    data: {
        labels: dayLabels,
        datasets: [{
            label: 'Organico (Mixpanel)',
            data: organicTotal,
            borderColor: C.purple,
            backgroundColor: C.purpleLight,
            fill: true,
            tension: 0.3,
            borderWidth: 2.5,
            pointRadius: 3,
            pointBackgroundColor: C.purple
        }]
    },
    options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { font: { size: 11 } } } },
        scales: {
            y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
            x: { grid: { display: false } }
        }
    }
});

// B2B / Minor sources
new Chart(document.getElementById('chartMinorDaily'), {
    type: 'bar',
    data: {
        labels: dayLabels,
        datasets: [{
            label: 'B2B / Otros',
            data: b2bTotal,
            backgroundColor: C.orange + 'aa',
            borderRadius: 4,
            borderSkipped: false
        }]
    },
    options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: {
            y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
            x: { grid: { display: false } }
        }
    }
});

// ========== TAB 3 CHARTS ==========

// Funnel horizontal bar
new Chart(document.getElementById('chartFunnel'), {
    type: 'bar',
    data: {
        labels: ['Registro', 'Diagnostico', 'Solicitud credito', 'Opciones credito', 'Flujo completado'],
        datasets: [{
            label: 'Usuarios',
            data: [8001, 7825, 7384, 6089, 29],
            backgroundColor: [
                'rgba(124,58,237,0.85)',
                'rgba(124,58,237,0.7)',
                'rgba(124,58,237,0.55)',
                'rgba(124,58,237,0.4)',
                'rgba(239,68,68,0.7)'
            ],
            borderRadius: 6,
            borderSkipped: false
        }]
    },
    options: {
        indexAxis: 'y',
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: ctx => ctx.raw.toLocaleString() + ' usuarios'
                }
            }
        },
        scales: {
            x: { beginAtZero: true, grid: { color: '#f3f4f6' } },
            y: { grid: { display: false } }
        }
    }
});

// Dropoff chart
new Chart(document.getElementById('chartDropoff'), {
    type: 'bar',
    data: {
        labels: ['Reg->Diag', 'Diag->Solic', 'Solic->Opciones', 'Opciones->Flujo'],
        datasets: [{
            label: 'Usuarios perdidos',
            data: [176, 441, 1295, 6060],
            backgroundColor: ['rgba(239,68,68,0.3)', 'rgba(239,68,68,0.45)', 'rgba(239,68,68,0.6)', 'rgba(239,68,68,0.85)'],
            borderRadius: 6
        }]
    },
    options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: ctx => '-' + ctx.raw.toLocaleString() + ' usuarios'
                }
            }
        },
        scales: {
            y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
            x: { grid: { display: false } }
        }
    }
});

// Funnel by source - grouped bar
new Chart(document.getElementById('chartFunnelBySource'), {
    type: 'bar',
    data: {
        labels: ['Registro', 'Diagnostico (97.8%)', 'Solicitud (92.3%)', 'Opciones (76.1%)', 'Flow (0.36%)'],
        datasets: [
            {
                label: 'Meta Ads',
                data: [3332, Math.round(3332*0.978), Math.round(3332*0.923), Math.round(3332*0.761), Math.round(3332*0.0036)],
                backgroundColor: C.meta + 'cc',
                borderRadius: 4
            },
            {
                label: 'TikTok Ads',
                data: [1472, Math.round(1472*0.978), Math.round(1472*0.923), Math.round(1472*0.761), Math.round(1472*0.0036)],
                backgroundColor: C.tiktok + 'cc',
                borderRadius: 4
            },
            {
                label: 'Organico',
                data: [1648, Math.round(1648*0.978), Math.round(1648*0.923), Math.round(1648*0.761), Math.round(1648*0.0036)],
                backgroundColor: C.purple + 'aa',
                borderRadius: 4
            },
            {
                label: 'Merite+Partners',
                data: [1283, Math.round(1283*0.978), Math.round(1283*0.923), Math.round(1283*0.761), Math.round(1283*0.0036)],
                backgroundColor: C.orange + 'aa',
                borderRadius: 4
            }
        ]
    },
    options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            tooltip: {
                callbacks: {
                    label: ctx => ctx.dataset.label + ': ' + ctx.raw.toLocaleString() + ' usuarios'
                }
            }
        },
        scales: {
            y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
            x: { grid: { display: false } }
        }
    }
});

// ========== TAB 4 CHARTS ==========

// Client type doughnut
new Chart(document.getElementById('chartClientDoughnut'), {
    type: 'doughnut',
    data: {
        labels: ['Bancarizacion (45.2%)', 'Perdida (39.1%)', 'Optimizacion (9.4%)', 'Pago de deudas (7.1%)'],
        datasets: [{
            data: [2702, 2337, 563, 426],
            backgroundColor: [C.purple, C.red, C.green, C.blue],
            borderWidth: 2,
            borderColor: '#fff',
            hoverOffset: 8
        }]
    },
    options: {
        responsive: true, maintainAspectRatio: false,
        cutout: '55%',
        plugins: { legend: { position: 'bottom', labels: { font: { size: 12 } } } }
    }
});

// Client type daily lines
new Chart(document.getElementById('chartClientDaily'), {
    type: 'line',
    data: {
        labels: dayLabels,
        datasets: [
            { label: 'Bancarizacion', data: banc, borderColor: C.purple, tension: 0.3, borderWidth: 2.5, pointRadius: 3, pointBackgroundColor: C.purple },
            { label: 'Perdida', data: perd, borderColor: C.red, tension: 0.3, borderWidth: 2.5, pointRadius: 3, pointBackgroundColor: C.red },
            { label: 'Optimizacion', data: opt, borderColor: C.green, tension: 0.3, borderWidth: 2, pointRadius: 3, pointBackgroundColor: C.green },
            { label: 'Pago de deudas', data: pago, borderColor: C.blue, tension: 0.3, borderWidth: 2, pointRadius: 3, pointBackgroundColor: C.blue }
        ]
    },
    options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { font: { size: 11 } } } },
        scales: {
            y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
            x: { grid: { display: false }, title: { display: true, text: 'Dia de Marzo' } }
        }
    }
});

// Client type stacked area
new Chart(document.getElementById('chartClientStacked'), {
    type: 'line',
    data: {
        labels: dayLabels,
        datasets: [
            { label: 'Bancarizacion', data: banc, borderColor: C.purple, backgroundColor: 'rgba(124,58,237,0.3)', fill: true, tension: 0.3, borderWidth: 2 },
            { label: 'Perdida', data: perd, borderColor: C.red, backgroundColor: 'rgba(239,68,68,0.25)', fill: true, tension: 0.3, borderWidth: 2 },
            { label: 'Optimizacion', data: opt, borderColor: C.green, backgroundColor: 'rgba(34,197,94,0.25)', fill: true, tension: 0.3, borderWidth: 2 },
            { label: 'Pago de deudas', data: pago, borderColor: C.blue, backgroundColor: 'rgba(59,130,246,0.25)', fill: true, tension: 0.3, borderWidth: 2 }
        ]
    },
    options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: {
            y: { stacked: true, beginAtZero: true, grid: { color: '#f3f4f6' } },
            x: { grid: { display: false }, title: { display: true, text: 'Dia de Marzo' } }
        }
    }
});

// ========== TAB 5 CHARTS ==========

// CAC bar chart - now with real TikTok data
new Chart(document.getElementById('chartCAC'), {
    type: 'bar',
    data: {
        labels: ['Meta (utm)\n$0.34', 'Meta (Pixel)\n$0.38', 'TikTok (utm)\n$0.89', 'TikTok (Plat.)\n$0.41', 'Organico\n$0.00'],
        datasets: [{
            label: 'CAC / CPR (USD)',
            data: [0.34, 0.38, 0.89, 0.41, 0],
            backgroundColor: [C.meta + 'cc', C.meta + '88', C.tiktok + 'cc', C.tiktok + '88', C.purple + '88'],
            borderRadius: 8,
            borderSkipped: false
        }]
    },
    options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: ctx => '$' + ctx.raw.toFixed(2) + ' USD'
                }
            }
        },
        scales: {
            y: { beginAtZero: true, grid: { color: '#f3f4f6' }, title: { display: true, text: 'USD por registro' } },
            x: { grid: { display: false } }
        }
    }
});

// Investment distribution pie - now with real data
new Chart(document.getElementById('chartInvestment'), {
    type: 'doughnut',
    data: {
        labels: ['Meta Ads ($1,655 USD - 55.8%)', 'TikTok Ads (~$1,309 USD - 44.2%)'],
        datasets: [{
            data: [1654.92, 1309],
            backgroundColor: [C.meta + 'cc', C.tiktok + 'cc'],
            borderWidth: 2,
            borderColor: '#fff'
        }]
    },
    options: {
        responsive: true, maintainAspectRatio: false,
        cutout: '50%',
        plugins: {
            legend: { position: 'bottom', labels: { font: { size: 12 } } },
            tooltip: {
                callbacks: {
                    label: ctx => ctx.label + ': $' + ctx.raw.toLocaleString() + ' USD'
                }
            }
        }
    }
});

// ========== FLOW COMPLETED CHART ==========
const flowCompletedDaily = [0,1,1,5,1,1,0,2,2,2,2,2,1,0,0,1,4,0,0,1,0,0,3];
new Chart(document.getElementById('chartFlowCompleted'), {
    type: 'bar',
    data: {
        labels: dayLabels,
        datasets: [{
            label: 'Flujos completados',
            data: flowCompletedDaily,
            backgroundColor: flowCompletedDaily.map(v => v > 3 ? 'rgba(124,58,237,0.9)' : 'rgba(124,58,237,0.55)'),
            borderRadius: 5,
            borderSkipped: false
        }]
    },
    options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: { label: ctx => ctx.raw + ' flujos completados' }
            }
        },
        scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f3f4f6' }, title: { display: true, text: 'Flujos' } },
            x: { grid: { display: false }, title: { display: true, text: 'Dia de Marzo' } }
        }
    }
});

// ========== UTM CHARTS ==========
// UTM Source doughnut
new Chart(document.getElementById('chartUTMSource'), {
    type: 'doughnut',
    data: {
        labels: ['fb (33.7%)', 'web (20.2%)', 'merite (11.4%)', 'tiktok-web (14.0%)', 'TikTok (4.4%)', 'ig (4.0%)', 'otros (12.4%)'],
        datasets: [{
            data: [2696, 1613, 914, 1122, 350, 320, 986],
            backgroundColor: [C.meta, C.purple, C.orange, C.tiktok, '#00b8d9', C.pink, C.gray],
            borderWidth: 2, borderColor: '#fff', hoverOffset: 8
        }]
    },
    options: {
        responsive: true, maintainAspectRatio: false, cutout: '52%',
        plugins: { legend: { position: 'right', labels: { font: { size: 11 }, padding: 10 } } }
    }
});

// UTM Medium bar chart
new Chart(document.getElementById('chartUTMMedium'), {
    type: 'bar',
    data: {
        labels: ['paid', 'landing', 'b2fclientepotencial', 'clientepotencial-meta', 'paid_social', 'paid-social', 'reel', 'victoria', 'evento_presencial', 'panel_login'],
        datasets: [{
            label: 'Usuarios',
            data: [2756, 1531, 1177, 1122, 430, 187, 123, 121, 111, 75],
            backgroundColor: [
                C.meta + 'cc', C.purple + 'cc', C.orange + 'cc', C.tiktok + 'cc',
                C.blue + 'cc', '#ef4444cc', C.pink + 'cc', C.teal + 'cc', C.green + 'cc', C.gray + 'cc'
            ],
            borderRadius: 5, borderSkipped: false
        }]
    },
    options: {
        indexAxis: 'y',
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { beginAtZero: true, grid: { color: '#f3f4f6' } },
            y: { grid: { display: false }, ticks: { font: { size: 11 } } }
        }
    }
});

// UTM Before/After Mar 18 grouped bar
new Chart(document.getElementById('chartUTMBeforeAfter'), {
    type: 'bar',
    data: {
        labels: ['fb/Meta', 'tiktok-web', 'TikTok app', 'web', 'merite', 'qr', 'ig', 'otros'],
        datasets: [
            {
                label: 'Mar 15-17 (823 users)',
                data: [Math.round(823*0.401), Math.round(823*0.051), 0, Math.round(823*0.19), Math.round(823*0.086), 0, Math.round(823*0.054), Math.round(823*0.218)],
                backgroundColor: C.purple + '99', borderRadius: 4
            },
            {
                label: 'Mar 18-23 (1,985 users)',
                data: [700, 174, 350, 394, 82, 116, 103, 66],
                backgroundColor: C.teal + 'cc', borderRadius: 4
            }
        ]
    },
    options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: {
            y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
            x: { grid: { display: false } }
        }
    }
});

// Daily spend chart - Meta USD + TikTok PEN side by side
new Chart(document.getElementById('chartDailySpend'), {
    type: 'bar',
    data: {
        labels: dayLabels,
        datasets: [
            {
                label: 'Meta Ads (USD)',
                data: metaDailySpend,
                backgroundColor: C.meta + 'bb',
                borderRadius: 4,
                borderSkipped: false,
                yAxisID: 'y'
            },
            {
                label: 'TikTok Ads (PEN)',
                data: ttDailyCostPEN,
                backgroundColor: C.tiktok + 'bb',
                borderRadius: 4,
                borderSkipped: false,
                yAxisID: 'y1'
            }
        ]
    },
    options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            tooltip: {
                callbacks: {
                    label: function(ctx) {
                        if (ctx.datasetIndex === 0) return 'Meta: $' + ctx.raw.toFixed(2) + ' USD';
                        return 'TikTok: S/' + ctx.raw.toFixed(2) + ' PEN (~$' + (ctx.raw * 0.27).toFixed(2) + ' USD)';
                    }
                }
            }
        },
        scales: {
            y: { beginAtZero: true, grid: { color: '#f3f4f6' }, title: { display: true, text: 'USD (Meta)' }, position: 'left' },
            y1: { beginAtZero: true, grid: { display: false }, title: { display: true, text: 'PEN (TikTok)' }, position: 'right' },
            x: { grid: { display: false }, title: { display: true, text: 'Dia de Marzo' } }
        }
    }
});

