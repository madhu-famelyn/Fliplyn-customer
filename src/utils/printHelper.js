export const printViaRawBT = (orderDetails) => {
  if (!orderDetails) return;

  const stallName = orderDetails.order_details?.[0]?.stall_name || "Stall Name";
  const tokenNo = orderDetails.token_number || orderDetails.id?.slice(0, 4) || "0000";

  // Static GSTIN as requested
  const gstin = "36AAVFN1793L1ZE";

  // Helper to format Date exactly as DD/MM/YYYY hh:mm AM/PM
  const formatDate = (dateStr) => {
    try {
      const d = dateStr ? new Date(dateStr) : new Date();
      const options = {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata"
      };

      const formatter = new Intl.DateTimeFormat("en-IN", options);
      const parts = formatter.formatToParts(d);

      let day = "", month = "", year = "", hour = "", minute = "", period = "";
      parts.forEach(p => {
        if (p.type === "day") day = p.value;
        else if (p.type === "month") month = p.value;
        else if (p.type === "year") year = p.value;
        else if (p.type === "hour") hour = p.value;
        else if (p.type === "minute") minute = p.value;
        else if (p.type === "dayPeriod") period = p.value.toUpperCase();
      });

      return `${day}/${month}/${year} ${hour}:${minute} ${period}`;
    } catch (e) {
      return new Date().toLocaleString();
    }
  };

  const createdAt = formatDate(orderDetails.created_datetime);

  const items = orderDetails.order_details || [];
  const totalCgst = Number(orderDetails.cgst ?? 0);
  const totalSgst = Number(orderDetails.sgst ?? 0);
  const totalGst = Number(orderDetails.total_gst ?? (totalCgst + totalSgst));
  const roundOff = Number(orderDetails.round_off ?? 0);
  const grandTotal = Number(orderDetails.total_amount ?? 0);
  const subtotal = grandTotal - roundOff;

  // ESC/POS Command Constants
  const ESC = 0x1B;
  const commands = [];

  // Initialize printer
  commands.push(ESC, 0x40);

  const addText = (text) => {
    for (let i = 0; i < text.length; i++) {
      commands.push(text.charCodeAt(i));
    }
  };

  const addBytes = (...bytes) => {
    commands.push(...bytes);
  };

  const formatRow = (label, val) => {
    const spaces = 32 - label.length - val.length;
    return label + " ".repeat(spaces > 0 ? spaces : 1) + val + "\n";
  };

  // 1. Dining Option & Payment Mode (Dine-In | Paid (UPI))
  const payMethod = orderDetails.payment_group || orderDetails.payment_method || "UPI";
  addBytes(ESC, 0x61, 0x01); // Center alignment
  addBytes(ESC, 0x45, 0x01); // Bold on
  addText(`Dine-In | Paid (${payMethod.toUpperCase()})\n`);
  addBytes(ESC, 0x45, 0x00); // Bold off
  addText("--------------------------------\n");

  // 2. Stall Name
  addBytes(ESC, 0x45, 0x01); // Bold on
  addText(stallName + "\n");

  // 3. Token No
  addText(`Token No: ${tokenNo}\n`);
  addBytes(ESC, 0x45, 0x00); // Bold off
  addText("--------------------------------\n");

  // 4. Date and GSTIN
  addBytes(ESC, 0x61, 0x00); // Align left
  addText(`Date: ${createdAt}\n`);
  addText(`GSTIN: ${gstin}\n`);
  addText("--------------------------------\n");

  // 5. Column Headers
  addBytes(ESC, 0x45, 0x01); // Bold on
  addText("Item Name            Qty. Price(Rs)\n");
  addBytes(ESC, 0x45, 0x00); // Bold off
  addText("--------------------------------\n");

  // 6. Items
  items.forEach(item => {
    // 32 Columns layout: Name (18 chars) | Qty (4 chars) | Price (10 chars)
    const name = (item.name || "").substring(0, 18).padEnd(18, ' ');
    const qty = (item.quantity ?? "").toString().padStart(4, ' ');
    const rawPriceVal = item.price !== undefined ? item.price : (item.total !== undefined ? item.total : 0);
    const priceVal = Number(rawPriceVal ?? 0);
    const price = priceVal.toFixed(2).padStart(10, ' ');
    addText(`${name}${qty}${price}\n`);
  });
  addText("--------------------------------\n");

  // 7. Taxes (Always print even if 0)
  addText(formatRow("CGST:", totalCgst.toFixed(2)));
  addText(formatRow("SGST:", totalSgst.toFixed(2)));
  addText(formatRow("Total GST:", totalGst.toFixed(2)));
  addText("--------------------------------\n");

  // 8. Total (Rs)
  addText(formatRow("Total (Rs):", subtotal.toFixed(2)));
  addText("--------------------------------\n");

  // 9. Round Off (Rs)
  const roundOffVal = roundOff >= 0 ? `(+) ${roundOff.toFixed(2)}` : `(-) ${Math.abs(roundOff).toFixed(2)}`;
  addText(formatRow("Round Off (Rs):", roundOffVal));
  addText("--------------------------------\n");

  // 10. Grand Total (Rs) (Bold)
  addBytes(ESC, 0x45, 0x01); // Bold on
  addText(formatRow("Grand Total (Rs):", grandTotal.toFixed(2)));
  addBytes(ESC, 0x45, 0x00); // Bold off
  addText("--------------------------------\n");

  // 11. Footer (Reduced feed)
  addBytes(ESC, 0x61, 0x01); // Center
  addText("Thank You!\n\n\n");

  // Convert to Base64 and trigger redirect/websocket print
  const uint8Array = new Uint8Array(commands);

  let fallbackTriggered = false;
  const triggerFallback = () => {
    if (fallbackTriggered) return;
    fallbackTriggered = true;

    let binaryString = "";
    for (let i = 0; i < uint8Array.length; i++) {
      binaryString += String.fromCharCode(uint8Array[i]);
    }
    const base64Data = window.btoa(binaryString);
    window.location.href = "rawbt:base64," + encodeURIComponent(base64Data);
  };

  // Try background WebSocket printing first to prevent opening the RawBT popup/screen
  try {
    const ws = new WebSocket("ws://127.0.0.1:40213/");
    ws.binaryType = "arraybuffer";

    const timeout = setTimeout(() => {
      console.warn("WebSocket print timeout, falling back to intent link...");
      ws.close();
      triggerFallback();
    }, 400);

    ws.onopen = () => {
      clearTimeout(timeout);
      ws.send(uint8Array.buffer);
      ws.close();
      console.log("Printed silently via WebSocket");
    };

    ws.onerror = (err) => {
      clearTimeout(timeout);
      console.warn("WebSocket print error, falling back to intent link:", err);
      triggerFallback();
    };
  } catch (e) {
    console.warn("WebSocket print setup error, falling back to intent link:", e);
    triggerFallback();
  }
};
