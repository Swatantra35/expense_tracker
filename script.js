let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let chart = null;

const addBtn = document.getElementById("addBtn");
const list = document.getElementById("expenseList");
const totalEl = document.getElementById("total");

// Category icons and colors
const categoryConfig = {
  Food: { icon: "🍔", color: "#FF6B6B" },
  Travel: { icon: "✈️", color: "#4ECDC4" },
  Shopping: { icon: "🛍️", color: "#45B7D1" },
  Bills: { icon: "💡", color: "#96CEB4" },
  Entertainment: { icon: "🎬", color: "#FFEAA7" },
  Health: { icon: "🏥", color: "#DDA0DD" },
  Education: { icon: "📚", color: "#98D8C8" },
  Other: { icon: "📦", color: "#F7DC6F" },
};

// Set today's date as default
document.getElementById("date").valueAsDate = new Date();

function animateValue(element, start, end, duration) {
  const startTime = performance.now();
  const startValue = start;
  const endValue = end;

  function updateValue(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const currentValue =
      startValue + (endValue - startValue) * easeOutCubic(progress);
    element.textContent = Math.round(currentValue * 100) / 100;

    if (progress < 1) {
      requestAnimationFrame(updateValue);
    }
  }

  requestAnimationFrame(updateValue);
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function renderExpenses() {
  const oldTotal = parseFloat(totalEl.textContent) || 0;

  if (expenses.length === 0) {
    list.innerHTML =
      '<div class="empty-state">No expenses yet. Add your first expense above!</div>';
    animateValue(totalEl, oldTotal, 0, 800);
    drawChart();
    return;
  }

  list.innerHTML = "";
  let total = 0;

  expenses.forEach((exp, i) => {
    total += exp.amount;
    const config = categoryConfig[exp.category] || categoryConfig["Other"];
    const dateFormatted = new Date(exp.date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });

    const listItem = document.createElement("li");
    listItem.className = "expense-item";
    listItem.style.animationDelay = `${i * 0.1}s`;

    listItem.innerHTML = `
      <div class="expense-info">
        <div class="expense-title">${exp.title}</div>
        <div class="expense-details">
          <span class="expense-amount">₹${exp.amount.toFixed(2)}</span>
          <span class="expense-category">${config.icon} ${exp.category}</span>
          <span class="expense-date">${dateFormatted}</span>
        </div>
      </div>
      <button class="delete-btn" onclick="deleteExpense(${i})" title="Delete expense">
        🗑️
      </button>
    `;

    list.appendChild(listItem);
  });

  // Animate total change
  animateValue(totalEl, oldTotal, total, 800);

  localStorage.setItem("expenses", JSON.stringify(expenses));
  drawChart();
}

function deleteExpense(index) {
  const expenseItem = list.children[index];

  // Add delete animation
  expenseItem.style.animation = "slideOutRight 0.3s ease-in forwards";

  setTimeout(() => {
    expenses.splice(index, 1);
    renderExpenses();
  }, 300);
}

function showNotification(message, type = "success") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 25px;
    background: ${type === "success" ? "#4ECDC4" : "#FF6B6B"};
    color: white;
    border-radius: 10px;
    font-weight: 500;
    z-index: 1000;
    animation: slideInRight 0.3s ease-out;
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOutRight 0.3s ease-in forwards";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

addBtn.addEventListener("click", () => {
  const title = document.getElementById("title").value.trim();
  const amount = parseFloat(document.getElementById("amount").value);
  const category = document.getElementById("category").value;
  const date = document.getElementById("date").value;

  if (!title) {
    showNotification("Please enter an expense title", "error");
    document.getElementById("title").focus();
    return;
  }

  if (!amount || amount <= 0) {
    showNotification("Please enter a valid amount", "error");
    document.getElementById("amount").focus();
    return;
  }

  if (!date) {
    showNotification("Please select a date", "error");
    document.getElementById("date").focus();
    return;
  }

  // Add expense with animation
  expenses.push({ title, amount, category, date });

  // Clear form
  document.getElementById("title").value = "";
  document.getElementById("amount").value = "";
  document.getElementById("date").valueAsDate = new Date();

  // Add button click animation
  addBtn.style.transform = "scale(0.95)";
  setTimeout(() => {
    addBtn.style.transform = "";
  }, 150);

  renderExpenses();
  showNotification(`Added "${title}" for ₹${amount.toFixed(2)}`);
});

// Allow Enter key to add expense
document.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && e.target.tagName !== "BUTTON") {
    addBtn.click();
  }
});

function drawChart() {
  const categories = {};
  const colors = [];

  expenses.forEach((e) => {
    categories[e.category] = (categories[e.category] || 0) + e.amount;
  });

  const labels = Object.keys(categories);
  labels.forEach((category) => {
    const config = categoryConfig[category] || categoryConfig["Other"];
    colors.push(config.color);
  });

  const ctx = document.getElementById("expenseChart").getContext("2d");

  // Destroy existing chart
  if (chart) {
    chart.destroy();
  }

  if (labels.length === 0) {
    // Clear canvas when no data
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.font = "16px Poppins";
    ctx.fillStyle = "#666";
    ctx.textAlign = "center";
    ctx.fillText(
      "No data to display",
      ctx.canvas.width / 2,
      ctx.canvas.height / 2
    );
    return;
  }

  chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels.map((label) => {
        const config = categoryConfig[label] || categoryConfig["Other"];
        return `${config.icon} ${label}`;
      }),
      datasets: [
        {
          data: Object.values(categories),
          backgroundColor: colors,
          borderWidth: 3,
          borderColor: "#fff",
          hoverBorderWidth: 5,
          hoverOffset: 10,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            padding: 20,
            font: {
              family: "Poppins",
              size: 12,
              weight: "500",
            },
            color: "#333",
          },
        },
        tooltip: {
          backgroundColor: "rgba(0,0,0,0.8)",
          titleFont: {
            family: "Poppins",
            size: 14,
            weight: "600",
          },
          bodyFont: {
            family: "Poppins",
            size: 12,
          },
          callbacks: {
            label: function (context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((context.raw / total) * 100).toFixed(1);
              return `₹${context.raw.toFixed(2)} (${percentage}%)`;
            },
          },
        },
      },
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 1000,
        easing: "easeOutCubic",
      },
    },
  });
}

// Add CSS animations for notifications
const style = document.createElement("style");
style.textContent = `
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(100px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes slideOutRight {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(100px);
    }
  }
`;
document.head.appendChild(style);

// Initialize app
renderExpenses();
