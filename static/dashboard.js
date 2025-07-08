// API Configuration
const API_URL = 'http://localhost:5000/api';

// Global variables
let currentStore = '';
let charts = {};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    initializeNavigation();
    loadStores();
    loadOrdersPage();
});

// Navigation
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            switchPage(page);
            
            // Update active state
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
}

function switchPage(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // Show selected page
    document.getElementById(`${page}Page`).classList.add('active');
    
    // Load page data
    switch(page) {
        case 'orders':
            loadOrdersPage();
            break;
        case 'products':
            loadProductsPage();
            break;
        case 'revenue':
            loadRevenuePage();
            break;
    }
}

// Load stores for filter
async function loadStores() {
    try {
        const response = await fetch(`${API_URL}/stores`);
        const stores = await response.json();
        
        const storeFilter = document.getElementById('storeFilter');
        stores.forEach(store => {
            const option = document.createElement('option');
            option.value = store.storeID;
            option.textContent = store.city;
            storeFilter.appendChild(option);
        });
        
        // Add event listener
        storeFilter.addEventListener('change', (e) => {
            currentStore = e.target.value;
            // Reload current page
            const activePage = document.querySelector('.nav-link.active').dataset.page;
            switchPage(activePage);
        });
    } catch (error) {
        console.error('Error loading stores:', error);
    }
}

// Orders Page
async function loadOrdersPage() {
    try {
        // Load summary data
        const summaryResponse = await fetch(`${API_URL}/orders/summary${currentStore ? '?store_id=' + currentStore : ''}`);
        const summary = await summaryResponse.json();
        
        document.getElementById('totalPizzas').textContent = summary.pizza_orders.toLocaleString('de-DE');
        document.getElementById('totalOrders').textContent = summary.total_orders.toLocaleString('de-DE');
        document.getElementById('avgOrderValue').textContent = summary.avg_order_value.toFixed(2).replace('.', ',') + '€';
        
        // Load charts
        await loadOrdersByWeekdayChart();
        await loadOrdersByHourChart();
        await loadMonthlyOrdersChart();
        
        // Add weekday filter listener
        document.getElementById('weekdayFilter').addEventListener('change', loadOrdersByHourChart);
        
        // Add year button listeners
        document.querySelectorAll('.year-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.year-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                loadMonthlyOrdersChart();
            });
        });
    } catch (error) {
        console.error('Error loading orders page:', error);
    }
}

async function loadOrdersByWeekdayChart() {
    const response = await fetch(`${API_URL}/orders/by-weekday${currentStore ? '?store_id=' + currentStore : ''}`);
    const data = await response.json();
    
    const ctx = document.getElementById('ordersByWeekdayChart').getContext('2d');
    
    if (charts.ordersByWeekday) {
        charts.ordersByWeekday.destroy();
    }
    
    charts.ordersByWeekday = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.weekday),
            datasets: [{
                label: 'Anzahl Bestellungen',
                data: data.map(d => d.orders),
                backgroundColor: '#5DADE2',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        display: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

async function loadOrdersByHourChart() {
    const weekday = document.getElementById('weekdayFilter').value;
    const response = await fetch(`${API_URL}/orders/by-hour${currentStore ? '?store_id=' + currentStore : ''}${weekday ? '&weekday=' + weekday : ''}`);
    const data = await response.json();
    
    const ctx = document.getElementById('ordersByHourChart').getContext('2d');
    
    if (charts.ordersByHour) {
        charts.ordersByHour.destroy();
    }
    
    // Create datasets for different days if no specific day is selected
    const datasets = [];
    if (!weekday) {
        // For simplicity, just show one line for all days combined
        datasets.push({
            label: 'Alle Tage',
            data: data.map(d => d.orders),
            borderColor: '#3498db',
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            tension: 0.3
        });
    } else {
        datasets.push({
            label: weekday,
            data: data.map(d => d.orders),
            borderColor: '#3498db',
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            tension: 0.3
        });
    }
    
    charts.ordersByHour = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.hour + ':00'),
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                }
            }
        }
    });
}

async function loadMonthlyOrdersChart() {
    const activeYear = document.querySelector('.year-btn.active').dataset.year;
    const response = await fetch(`${API_URL}/orders/monthly?year=${activeYear}${currentStore ? '&store_id=' + currentStore : ''}`);
    const data = await response.json();
    
    const ctx = document.getElementById('monthlyOrdersChart').getContext('2d');
    
    if (charts.monthlyOrders) {
        charts.monthlyOrders.destroy();
    }
    
    charts.monthlyOrders = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.month),
            datasets: [{
                label: activeYear,
                data: data.map(d => d.orders),
                borderColor: '#f39c12',
                backgroundColor: 'rgba(243, 156, 18, 0.1)',
                tension: 0.3,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Products Page
async function loadProductsPage() {
    try {
        // Load summary
        const summaryResponse = await fetch(`${API_URL}/products/summary`);
        const summary = await summaryResponse.json();
        
        document.querySelectorAll('.kpi-value-large')[0].textContent = summary.product_count;
        document.querySelectorAll('.kpi-value-large')[1].textContent = summary.size_count;
        document.querySelectorAll('.kpi-value-large')[2].textContent = summary.category_count;
        document.querySelectorAll('.kpi-value-large')[3].textContent = summary.avg_sales_per_pizza.toFixed(1).replace('.', ',');
        
        // Load charts
        await loadSalesByPizzaChart();
        await loadSizeDistributionChart();
        await loadCategoryDistributionChart();
        await loadProductDetails();
    } catch (error) {
        console.error('Error loading products page:', error);
    }
}

async function loadSalesByPizzaChart() {
    const response = await fetch(`${API_URL}/products/sales-by-pizza`);
    const data = await response.json();
    
    const ctx = document.getElementById('salesByPizzaChart').getContext('2d');
    
    if (charts.salesByPizza) {
        charts.salesByPizza.destroy();
    }
    
    charts.salesByPizza = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.name),
            datasets: [{
                data: data.map(d => d.sales),
                backgroundColor: [
                    '#34495e', '#3498db', '#2ecc71', '#f39c12', 
                    '#e74c3c', '#9b59b6', '#1abc9c', '#95a5a6', '#d35400'
                ]
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true
                }
            }
        }
    });
}

async function loadSizeDistributionChart() {
    const response = await fetch(`${API_URL}/products/by-size`);
    const data = await response.json();
    
    const ctx = document.getElementById('sizeDistributionChart').getContext('2d');
    
    if (charts.sizeDistribution) {
        charts.sizeDistribution.destroy();
    }
    
    charts.sizeDistribution = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.map(d => d.size),
            datasets: [{
                data: data.map(d => d.count),
                backgroundColor: ['#34495e', '#7f8c8d', '#bdc3c7', '#ecf0f1']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

async function loadCategoryDistributionChart() {
    const response = await fetch(`${API_URL}/products/by-category`);
    const data = await response.json();
    
    const ctx = document.getElementById('categoryDistributionChart').getContext('2d');
    
    if (charts.categoryDistribution) {
        charts.categoryDistribution.destroy();
    }
    
    charts.categoryDistribution = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.map(d => d.category),
            datasets: [{
                data: data.map(d => d.count),
                backgroundColor: ['#3498db', '#e74c3c', '#f39c12']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

async function loadProductDetails() {
    const response = await fetch(`${API_URL}/products/details`);
    const products = await response.json();
    
    const tbody = document.getElementById('productTableBody');
    tbody.innerHTML = '';
    
    products.forEach(product => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>${product.ingredients || 'N/A'}</td>
            <td>${product.launch}</td>
            <td>${product.time_since_launch}</td>
        `;
    });
}

// Revenue Page
async function loadRevenuePage() {
    try {
        // Load summary
        const summaryResponse = await fetch(`${API_URL}/revenue/summary${currentStore ? '?store_id=' + currentStore : ''}`);
        const summary = await summaryResponse.json();
        
        document.getElementById('totalRevenue').textContent = summary.total_revenue.toLocaleString('de-DE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + ' €';
        document.getElementById('revenueGrowth').textContent = (summary.growth >= 0 ? '+' : '') + summary.growth.toFixed(1).replace('.', ',') + '%';
        document.getElementById('revenuePerOrder').textContent = summary.revenue_per_order.toFixed(2).replace('.', ',') + ' €';
        
        // Load charts
        await loadRevenueByWeekdayChart();
        await loadYearlyRevenueChart();
    } catch (error) {
        console.error('Error loading revenue page:', error);
    }
}

async function loadRevenueByWeekdayChart() {
    const response = await fetch(`${API_URL}/revenue/by-weekday${currentStore ? '?store_id=' + currentStore : ''}`);
    const data = await response.json();
    
    const ctx = document.getElementById('revenueByWeekdayChart').getContext('2d');
    
    if (charts.revenueByWeekday) {
        charts.revenueByWeekday.destroy();
    }
    
    charts.revenueByWeekday = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.map(d => d.weekday + ' (' + d.percentage + '%)'),
            datasets: [{
                data: data.map(d => d.revenue),
                backgroundColor: [
                    '#e74c3c', '#f39c12', '#f1c40f', '#2ecc71', 
                    '#3498db', '#9b59b6', '#34495e'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

async function loadYearlyRevenueChart() {
    const response = await fetch(`${API_URL}/revenue/yearly${currentStore ? '?store_id=' + currentStore : ''}`);
    const data = await response.json();
    
    const ctx = document.getElementById('yearlyRevenueChart').getContext('2d');
    
    if (charts.yearlyRevenue) {
        charts.yearlyRevenue.destroy();
    }
    
    charts.yearlyRevenue = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.year),
            datasets: [{
                label: 'Jahresumsatz',
                data: data.map(d => d.revenue),
                backgroundColor: '#34495e',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString('de-DE') + ' €';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}