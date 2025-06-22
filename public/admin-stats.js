// admin-stats.js – גרסה מלאה עם ניתוח לפי מוצר, מידה, צבע, כולל גרפים וסיכומים

document.addEventListener("DOMContentLoaded", async () => {
  const username = sessionStorage.getItem("user");
  const role = sessionStorage.getItem("role") || "user";
  if (!username || role !== "admin") return (window.location.href = "/");

  const startInput = document.getElementById("start-date");
  const endInput = document.getElementById("end-date");
  const typeSelect = document.getElementById("type-filter");
  const filterBtn = document.getElementById("filter-btn");
  const summaryBody = document.getElementById("summary-body");
  const barChartCtx = document.getElementById("barChart").getContext("2d");
  const liveChartCtx = document.getElementById("liveChart").getContext("2d");

  let barChart, liveChart;

  filterBtn.addEventListener("click", loadData);

  async function loadData() {
    try {
      const res = await fetch("/report-data");
      const data = await res.json();

      const startDate = startInput.value ? new Date(startInput.value) : null;
      const endDate = endInput.value ? new Date(endInput.value) : null;
      const typeFilter = typeSelect.value;

      const filtered = data.filter(row => {
        const [product, size, color, qty, date, time, type] = row;
        const rowDate = new Date(date);
        const passDate = (!startDate || rowDate >= startDate) && (!endDate || rowDate <= endDate);
        const passType = !typeFilter || type === typeFilter;
        return passDate && passType;
      });

      const summaryMap = new Map();
      const stockMap = new Map();

      filtered.forEach(row => {
        const [product, size, color, qtyStr, , , type] = row;
        const key = `${product} | ${size} | ${color}`;
        const qty = parseFloat(qtyStr);

        const current = summaryMap.get(key) || { יצור: 0, מכירה: 0 };
        if (type === "ייצור") current.יצור += qty;
        else if (type === "מכירה") current.מכירה += Math.abs(qty);
        summaryMap.set(key, current);

        const stock = stockMap.get(key) || 0;
        stockMap.set(key, stock + qty);
      });

      summaryBody.innerHTML = "";
      const labels = [], valuesY = [], valuesR = [], liveLabels = [], liveValues = [];

      for (const [key, value] of summaryMap.entries()) {
        const stock = stockMap.get(key);
        summaryBody.innerHTML += `<tr><td>${key}</td><td>${value.יצור}</td><td>${value.מכירה}</td><td>${stock}</td></tr>`;
        labels.push(key);
        valuesY.push(value.יצור);
        valuesR.push(value.מכירה);
        liveLabels.push(key);
        liveValues.push(stock);
      }

      if (barChart) barChart.destroy();
      if (liveChart) liveChart.destroy();

      barChart = new Chart(barChartCtx, {
        type: "bar",
        data: {
          labels,
          datasets: [
            { label: "ייצור", data: valuesY, backgroundColor: "#2196F3" },
            { label: "מכירה", data: valuesR, backgroundColor: "#f44336" },
          ],
        },
      });

      liveChart = new Chart(liveChartCtx, {
        type: "bar",
        data: {
          labels: liveLabels,
          datasets: [
            { label: "מלאי נוכחי", data: liveValues, backgroundColor: "#4CAF50" },
          ],
        },
      });
    } catch (err) {
      console.error("שגיאה בטעינת נתונים", err);
    }
  }

  loadData();
});
