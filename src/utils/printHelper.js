export const printViaRawBT = (orderDetails) => {
  if (!orderDetails) return;

  const stallName = orderDetails.order_details?.[0]?.stall_name || "Stall Name";
  const tokenNo = orderDetails.token_number || orderDetails.id?.slice(0, 4) || "0000";
  
  const createdAt = orderDetails.created_datetime 
    ? new Date(orderDetails.created_datetime).toLocaleString("en-IN", { hour12: true, timeZone: "Asia/Kolkata" })
    : new Date().toLocaleString();

  const items = orderDetails.order_details || [];
  const totalCgst = orderDetails.cgst ?? 0;
  const totalSgst = orderDetails.sgst ?? 0;
  const totalGst = orderDetails.total_gst ?? (totalCgst + totalSgst);
  const roundOff = orderDetails.round_off ?? 0;
  const grandTotal = orderDetails.total_amount ?? 0;
  const subtotal = grandTotal - roundOff;

  // ESC/POS Command Constants
  const ESC = 0x1B;
  const GS = 0x1D;
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

  // 1. Stall Name (Center, Bold, Double Size)
  addBytes(ESC, 0x61, 0x01); // Center alignment
  addBytes(GS, 0x21, 0x11);  // Double width & height
  addBytes(ESC, 0x45, 0x01); // Bold on
  addText(stallName + "\n");
  addBytes(GS, 0x21, 0x00);  // Reset size
  addBytes(ESC, 0x45, 0x00); // Bold off
  addText("--------------------------------\n");

  // 2. Large Token Number
  addText("YOUR TOKEN NUMBER\n\n");
  addBytes(GS, 0x21, 0x22);  // Quad size (extra large)
  addBytes(ESC, 0x45, 0x01); // Bold
  addText(tokenNo + "\n\n");
  addBytes(GS, 0x21, 0x00);  // Normal size
  addBytes(ESC, 0x45, 0x00); // Bold off

  // 3. Date
  addBytes(ESC, 0x61, 0x00); // Align left
  addText(`Date: ${createdAt}\n`);
  addText("--------------------------------\n");

  // 4. Items Header (Bold)
  addBytes(ESC, 0x45, 0x01);
  addText("Item                 Qty   Price\n");
  addBytes(ESC, 0x45, 0x00);
  addText("--------------------------------\n");

  // 5. Items
  items.forEach(item => {
    const name = item.name.substring(0, 18).padEnd(18, ' ');
    const qty = item.quantity.toString().padStart(3, ' ');
    const priceVal = item.price !== undefined ? item.price : (item.total !== undefined ? item.total : 0);
    const price = priceVal.toFixed(2).padStart(8, ' ');
    addText(`${name}${qty}${price}\n`);
  });
  addText("--------------------------------\n");

  // 6. Summary Rows
  const formatRow = (label, val) => {
    const spaces = 32 - label.length - val.length;
    return label + " ".repeat(spaces > 0 ? spaces : 1) + val + "\n";
  };
  addText(formatRow("CGST", totalCgst.toFixed(2)));
  addText(formatRow("SGST", totalSgst.toFixed(2)));
  addText(formatRow("Total GST", totalGst.toFixed(2)));
  addText(formatRow("Subtotal", subtotal.toFixed(2)));
  addText(formatRow("Round Off", roundOff.toFixed(2)));
  addText("--------------------------------\n");

  // 7. Grand Total (Bold)
  addBytes(ESC, 0x45, 0x01);
  addText(formatRow("GRAND TOTAL", `Rs ${grandTotal.toFixed(2)}`));
  addBytes(ESC, 0x45, 0x00);
  addText("--------------------------------\n\n");

  // 8. Footer & Feed Paper
  addBytes(ESC, 0x61, 0x01); // Center
  addText("Thank You!\n\n\n\n");

  // Convert to Base64 and invoke RawBT Intent
  const uint8Array = new Uint8Array(commands);
  let binaryString = "";
  for (let i = 0; i < uint8Array.length; i++) {
    binaryString += String.fromCharCode(uint8Array[i]);
  }
  const base64Data = window.btoa(binaryString);

  window.location.href = "rawbt:base64," + base64Data;
};
