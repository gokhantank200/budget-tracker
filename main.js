// State Management
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let isDarkMode = localStorage.getItem('theme') === 'dark';

// DOM Elements
const themeToggleBtn = document.getElementById('themeToggleBtn');
const transactionForm = document.getElementById('transactionForm');
const totalBalanceEl = document.getElementById('totalBalance');
const monthlyIncomeEl = document.getElementById('monthlyIncome');
const monthlyExpenseEl = document.getElementById('monthlyExpense');
const transactionListEl = document.getElementById('transactionList');
const ctx = document.getElementById('monthlyChart').getContext('2d');

let chartInstance = null;

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

  // Event Listeners
  themeToggleBtn.addEventListener('click', toggleTheme);
  transactionForm.addEventListener('submit', addTransaction);

  // Render initial state
  updateUI();
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

// Render Table
function renderList() {
  transactionListEl.innerHTML = '';
  
  // Sort by date descending
  const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (sorted.length === 0) {
    transactionListEl.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--text-muted)">Henüz işlem bulunmamaktadır.</td></tr>`;
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

// Update Summary Cards
function updateSummary() {
  const currentMonthFilter = new Date().getMonth();
  const currentYearFilter = new Date().getFullYear();

  let totalIncome = 0;
  let totalExpense = 0;
  let monthlyIncome = 0;
  let monthlyExpense = 0;

  transactions.forEach(t => {
    const tDate = new Date(t.date);
    const isCurrentMonth = tDate.getMonth() === currentMonthFilter && tDate.getFullYear() === currentYearFilter;

    if (t.type === 'income') {
      totalIncome += t.amount;
      if (isCurrentMonth) monthlyIncome += t.amount;
    } else {
      totalExpense += t.amount;
      if (isCurrentMonth) monthlyExpense += t.amount;
    }
  });

  const totalBalance = totalIncome - totalExpense;

  // Format currency
  const formatCurrency = (amount) => `₺${amount.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

  totalBalanceEl.textContent = formatCurrency(totalBalance);
  monthlyIncomeEl.textContent = formatCurrency(monthlyIncome);
  monthlyExpenseEl.textContent = formatCurrency(monthlyExpense);

  // Update classes based on positive/negative
  totalBalanceEl.className = totalBalance >= 0 ? 'amount positive' : 'amount negative';
}

// Chart.js Setup
function updateChart() {
  // Calculate data by category/type for current month
  const currentMonthFilter = new Date().getMonth();
  const currentYearFilter = new Date().getFullYear();
  
  let income = 0;
  let expense = 0;

  transactions.forEach(t => {
    const tDate = new Date(t.date);
    if (tDate.getMonth() === currentMonthFilter && tDate.getFullYear() === currentYearFilter) {
      if (t.type === 'income') income += t.amount;
      if (t.type === 'expense') expense += t.amount;
    }
  });

  const textColor = getComputedStyle(document.body).getPropertyValue('--text-main').trim();
  const gridColor = getComputedStyle(document.body).getPropertyValue('--card-border').trim();
  const successColor = getComputedStyle(document.body).getPropertyValue('--success').trim();
  const dangerColor = getComputedStyle(document.body).getPropertyValue('--danger').trim();

  const data = {
    labels: ['Gelir', 'Gider'],
    datasets: [{
      data: [income, expense],
      backgroundColor: [successColor, dangerColor],
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
