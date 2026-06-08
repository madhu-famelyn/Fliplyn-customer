export const printViaRawBT = (orderDetails) => {
  if (!orderDetails) return;

  const isAndroid = /Android/i.test(navigator.userAgent);

  if (isAndroid) {
    try {
      // 1. Extract and sanitize values
      const stallName = (
        orderDetails.order_details?.[0]?.stall_name || "Stall"
      ).replace(/₹/g, "Rs.");
      
      const tokenNo =
        orderDetails.token_number ||
        (orderDetails.id ? orderDetails.id.toString().slice(-4) : "—");

      const createdAt = orderDetails.created_datetime
        ? new Date(orderDetails.created_datetime).toLocaleString("en-IN", {
            hour12: true,
            timeZone: "Asia/Kolkata",
          })
        : new Date().toLocaleString("en-IN", {
            hour12: true,
            timeZone: "Asia/Kolkata",
          });

      const totalCgst = Number(orderDetails.cgst ?? 0);
      const totalSgst = Number(orderDetails.sgst ?? 0);
      const totalGst = Number(orderDetails.total_gst ?? (totalCgst + totalSgst));
      const roundOff = Number(orderDetails.round_off ?? 0);
      const grandTotal = Number(orderDetails.total_amount ?? 0);
      const subtotal = grandTotal - roundOff;

      // 2. Define ESC/POS control commands
      const ESC = "\x1B";
      const GS = "\x1D";
      
      const init = ESC + "@";
      const center = ESC + "a\x01";
      const left = ESC + "a\x00";
      const boldOn = ESC + "E\x01";
      const boldOff = ESC + "E\x00";
      const doubleSize = GS + "!\x11"; // Double width + double height
      const normalSize = GS + "!\x00";
      const cut = GS + "V\x42\x00"; // Cut command: GS V 66 0 (feed paper and cut)

      // 3. Format print content (32-column width constraint for 58mm printer compatibility)
      let p = "";
      p += init;
      p += center;
      p += boldOn + doubleSize + stallName + "\n" + normalSize + boldOff;
      p += "\n";
      p += boldOn + "TOKEN NUMBER\n";
      p += doubleSize + tokenNo + "\n" + normalSize;
      p += boldOff;
      p += "\n";
      
      p += left;
      p += `Date: ${createdAt}\n`;
      p += "--------------------------------\n";
      p += "Item             Qty      Price \n";
      p += "--------------------------------\n";

      const items = orderDetails.order_details || [];
      items.forEach((item) => {
        let name = (item.name || "").replace(/₹/g, "Rs.");
        if (name.length > 16) {
          name = name.slice(0, 15) + ".";
        } else {
          name = name.padEnd(16, " ");
        }
        
        const qtyVal = Number(item.quantity ?? item.qty ?? 1);
        const qty = String(qtyVal).padStart(6, " ");
        
        const priceVal = Number(item.price ?? item.total ?? 0);
        const price = priceVal.toFixed(2).padStart(10, " ");
        
        p += `${name}${qty}${price}\n`;
      });

      p += "--------------------------------\n";
      
      const padLabel = (label, val) => {
        const valStr = Number(val).toFixed(2);
        const totalLen = 32;
        const padLen = totalLen - label.length;
        return label + valStr.padStart(padLen, " ") + "\n";
      };

      p += padLabel("CGST", totalCgst);
      p += padLabel("SGST", totalSgst);
      p += padLabel("Total GST", totalGst);
      p += padLabel("Total", subtotal);
      p += padLabel("Round Off", roundOff);
      p += "--------------------------------\n";
      
      p += boldOn;
      p += padLabel("Grand Total", grandTotal);
      p += boldOff;
      p += "--------------------------------\n";
      
      p += center;
      p += "Thank you!\n";
      p += "Please visit again\n\n\n\n";
      
      p += cut;

      // 4. Encode to UTF-8 bytes and then Base64
      let bytes;
      if (typeof TextEncoder !== "undefined") {
        bytes = new TextEncoder().encode(p);
      } else {
        bytes = new Uint8Array(p.length);
        for (let i = 0; i < p.length; i++) {
          bytes[i] = p.charCodeAt(i) & 0xff;
        }
      }

      const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
      const base64Data = btoa(binString);

      // 5. Trigger the RawBT intent
      const intentUrl = `intent:base64,${base64Data}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;
      window.location.href = intentUrl;
    } catch (e) {
      console.error("RawBT print generation failed, falling back to window.print():", e);
      window.print();
    }
  } else {
    // Non-Android platforms fall back to browser print
    window.print();
  }
};

