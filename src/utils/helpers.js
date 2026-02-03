export function generateOrderId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `ORD-${timestamp}-${random}`;
}

export function formatDateTime(date) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
}

export function exportToCSV(orders) {
  let csvContent = "Order ID,Customer Name,Item Name,Quantity,Price,Total,Timestamp,Served,Paid,Closed\n";

  orders.forEach(order => {
    order.items.forEach(item => {
      csvContent += `${order.orderId},"${order.name}","${item.name}",${item.quantity},${item.price},${order.total},"${new Date(order.timestamp).toLocaleString()}",${order.served ? 'Yes' : 'No'},${order.paid ? 'Yes' : 'No'},${order.closed ? 'Yes' : 'No'}\n`;
    });
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'daily_report.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}