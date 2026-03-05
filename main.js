// State Management
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let isDarkMode = localStorage.getItem('theme') === 'dark';

// Current Filter State
const currentDate = new Date();
let selectedYear = currentDate.getFullYear();
let selectedMonth = currentDate.getMonth(); // 0-11

// DOM Elements
const themeToggleBtn = document.getElementById('themeToggleBtn');
const transactionForm = document.getElementById('transactionForm');
const totalBalanceEl = document.getElementById('totalBalance');
const monthlyIncomeEl = document.getElementById('monthlyIncome');
const monthlyExpenseEl = document.getElementById('monthlyExpense');
const transactionListEl = document.getElementById('transactionList');
const ctx = document.getElementById('monthlyChart').getContext('2d');

const monthSelector = document.getElementById('monthSelector');
const dashboardView = document.getElementById('dashboardView');
const historyView = document.getElementById('historyView');
const viewHistoryBtn = document.getElementById('viewHistoryBtn');
const backBtn = document.getElementById('backBtn');
const historyMonthName = document.getElementById('historyMonthName');

let chartInstance = null;

const monthNames = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

// Initialize App
function init() {
  // Theme setup
  if (isDarkMode) {
    document.body.setAttribute('data-theme', 'dark');
    themeToggleBtn.textContent = '☀️';
  } else {
    document.body.removeAttribute('data-theme');
    themeToggleBtn.textContent = '🌙';
  }

  // Set month selector to current month
  const monthString = (selectedMonth + 1).toString().padStart(2, '0');
  monthSelector.value = `${selectedYear}-${monthString}`;

  // Event Listeners
  themeToggleBtn.addEventListener('click', toggleTheme);
  transactionForm.addEventListener('submit', addTransaction);
  
  monthSelector.addEventListener('change', (e) => {
    if (e.target.value) {
      const [year, month] = e.target.value.split('-');
      selectedYear = parseInt(year);
      selectedMonth = parseInt(month) - 1;
      updateUI();
    }
  });

  viewHistoryBtn.addEventListener('click', showHistoryView);
  backBtn.addEventListener('click', showDashboardView);

  // Render initial state
  updateUI();
}

// View Management
function showHistoryView() {
  dashboardView.classList.add('hidden');
  historyView.classList.remove('hidden');
  historyMonthName.textContent = `${monthNames[selectedMonth]} ${selectedYear}`;
}

function showDashboardView() {
  historyView.classList.add('hidden');
  dashboardView.classList.remove('hidden');
}

// Theme Toggle
function toggleTheme() {
  isDarkMode = !isDarkMode;
  if (isDarkMode) {
    document.body.setAttribute('data-theme', 'dark');
    themeToggleBtn.textContent = '☀️';
    localStorage.setItem('theme', 'dark');
  } else {
    document.body.removeAttribute('data-theme');
    themeToggleBtn.textContent = '🌙';
    localStorage.setItem('theme', 'light');
  }
  updateChart(); // Redraw chart for theme colors
}

// Add Transaction
function addTransaction(e) {
  e.preventDefault();
  
  const type = document.getElementById('type').value;
  const description = document.getElementById('description').value;
  const amount = parseFloat(document.getElementById('amount').value);
  const date = document.getElementById('date').value;

  if (description.trim() === '' || isNaN(amount) || amount <= 0 || !date) {
    alert('Lütfen geçerli bilgiler giriniz.');
    return;
  }

  const transaction = {
    id: generateID(),
    type,
    description,
    amount,
    date
  };

  transactions.push(transaction);
  saveToLocalStorage();
  updateUI();

  // Reset Form
  transactionForm.reset();
  // Set date to today by default
  document.getElementById('date').valueAsDate = new Date();
}

// Generate Random ID
function generateID() {
  return Math.floor(Math.random() * 100000000).toString(16);
}

// Delete Transaction
function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveToLocalStorage();
  updateUI();
}

// Save to LocalStorage
function saveToLocalStorage() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Update DOM and Charts
function updateUI() {
  renderList();
  updateSummary();
  updateChart();
}

// Render Table (Filtered by Month)
function renderList() {
  transactionListEl.innerHTML = '';
  
  // Filter by selected month and year
  const filtered = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  // Sort by date descending
  const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (sorted.length === 0) {
    transactionListEl.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--text-muted)">Bu ay için henüz işlem bulunmamaktadır.</td></tr>`;
    return;
  }

  sorted.forEach(t => {
    const tr = document.createElement('tr');
    const dateObj = new Date(t.date);
    const formattedDate = dateObj.toLocaleDateString('tr-TR');
    
    const sign = t.type === 'income' ? '+' : '-';
    const amountClass = t.type === 'income' ? 'positive' : 'negative';
    const typeLabel = t.type === 'income' ? 'Gelir' : 'Gider';

    tr.innerHTML = `
      <td>${formattedDate}</td>
      <td>${t.description}</td>
      <td><span class="${amountClass}" style="font-size:0.9rem">${typeLabel}</span></td>
      <td class="${amountClass}">${sign}₺${t.amount.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
      <td>
        <button class="delete-btn" onclick="deleteTransaction('${t.id}')">Sil</button>
      </td>
    `;
    transactionListEl.appendChild(tr);
  });
}

// Update Summary Cards (Filtered by Month)
function updateSummary() {
  let monthlyIncome = 0;
  let monthlyExpense = 0;

  transactions.forEach(t => {
    const tDate = new Date(t.date);
    const isSelectedMonth = tDate.getMonth() === selectedMonth && tDate.getFullYear() === selectedYear;

    if (isSelectedMonth) {
      if (t.type === 'income') {
        monthlyIncome += t.amount;
      } else {
        monthlyExpense += t.amount;
      }
    }
  });

  const totalBalance = monthlyIncome - monthlyExpense;

  // Format currency
  const formatCurrency = (amount) => `₺${amount.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

  totalBalanceEl.textContent = formatCurrency(totalBalance);
  monthlyIncomeEl.textContent = formatCurrency(monthlyIncome);
  monthlyExpenseEl.textContent = formatCurrency(monthlyExpense);

  // Update classes based on positive/negative
  totalBalanceEl.className = totalBalance >= 0 ? 'amount positive' : 'amount negative';
}

// Chart.js Setup (Filtered by Month)
function updateChart() {
  let income = 0;
  let expense = 0;

  transactions.forEach(t => {
    const tDate = new Date(t.date);
    if (tDate.getMonth() === selectedMonth && tDate.getFullYear() === selectedYear) {
      if (t.type === 'income') income += t.amount;
      if (t.type === 'expense') expense += t.amount;
    }
  });
  
  // Update canvas opacity if no data
  if (income === 0 && expense === 0) {
      // Create empty chart placeholder if desired, or let it render 0s
      income = 0.01; // tiny wedge to keep chart rendering, or just leave it blank
      expense = 0.01; // Not ideal, but Chart.js usually handles 0s gracefully
  }

  const textColor = getComputedStyle(document.body).getPropertyValue('--text-main').trim();
  const successColor = getComputedStyle(document.body).getPropertyValue('--success').trim();
  const dangerColor = getComputedStyle(document.body).getPropertyValue('--danger').trim();
  const mutedColor = getComputedStyle(document.body).getPropertyValue('--text-muted').trim();

  // Revert 0.01 dummy data check if truly no data
  let chartDataValues = [income, expense];
  let bgColors = [successColor, dangerColor];
  
  if (income <= 0.01 && expense <= 0.01) {
    chartDataValues = [1];
    bgColors = [mutedColor + '40']; // transparent mutted
  } else {
    // Reset to exact values
    let totalActIncome = income <= 0.01 ? 0 : income;
    let totalActExpense = expense <= 0.01 ? 0 : expense;
    chartDataValues = [totalActIncome, totalActExpense];
  }

  const data = {
    labels: (income <= 0.01 && expense <= 0.01) ? ['Veri Yok'] : ['Gelir', 'Gider'],
    datasets: [{
      data: chartDataValues,
      backgroundColor: bgColors,
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  const config = {
    type: 'doughnut',
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: textColor,
            font: { family: "'Inter', sans-serif", size: 14 }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              if (income <= 0.01 && expense <= 0.01) return 'Bu ay için veri yok';
              let label = context.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed !== null) {
                label += new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(context.parsed);
              }
              return label;
            }
          }
        }
      },
      cutout: '70%',
    }
  };

  if (chartInstance) {
    chartInstance.destroy();
  }

  // Only draw if there are canvas elements
  if (ctx) {
    chartInstance = new Chart(ctx, config);
  }
}

// Set default date when page loads
document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('date');
    if(dateInput && !dateInput.value) {
        dateInput.valueAsDate = new Date();
    }
});

// Start the app
init();
