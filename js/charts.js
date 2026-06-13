// Графики для статистики
function initCharts() {
    // График эффективности
    const efficiencyCtx = document.getElementById('efficiency-chart');
    if (efficiencyCtx) {
        const techNames = machineryData.map(tech => tech.name.substring(0, 15) + '...');
        const efficiencies = machineryData.map(tech => tech.efficiency);
        
        new Chart(efficiencyCtx, {
            type: 'bar',
            data: {
                labels: techNames,
                datasets: [{
                    label: 'Эффективность (%)',
                    data: efficiencies,
                    backgroundColor: machineryData.map(tech => 
                        tech.status === 'working' ? '#4caf50' :
                        tech.status === 'idle' ? '#ff9800' : '#f44336'
                    ),
                    borderColor: '#333',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Процент эффективности'
                        }
                    }
                }
            }
        });
    }
    
    // График распределения по статусам
    const statusCtx = document.getElementById('status-chart');
    if (statusCtx) {
        const statusCount = {
            working: machineryData.filter(t => t.status === 'working').length,
            idle: machineryData.filter(t => t.status === 'idle').length,
            repair: machineryData.filter(t => t.status === 'repair').length
        };
        
        new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: ['В работе', 'Простой', 'Ремонт'],
                datasets: [{
                    data: [statusCount.working, statusCount.idle, statusCount.repair],
                    backgroundColor: ['#4caf50', '#ff9800', '#f44336'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

// Обновляем документ
document.addEventListener('DOMContentLoaded', function() {
    // Ваш существующий код...
    
    // Добавляем инициализацию графиков
    setTimeout(initCharts, 500); // Даем время на загрузку данных
});