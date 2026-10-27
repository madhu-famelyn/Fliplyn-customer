import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Renders a fixed-width copy of the sheet (so phones and desktops give the same PDF),
// breaks pages only between table rows and repeats the table header on each page.
export async function exportSheetToPdf(sourceEl, fileName) {
  const clone = sourceEl.cloneNode(true);
  clone.classList.add("pdf-export");
  clone.querySelectorAll(".no-print").forEach((el) => el.remove());
  document.body.appendChild(clone);

  try {
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      windowWidth: 1200,
    });

    const pdf = new jsPDF("p", "mm", "a4");
    const margin = 10;
    const printWidth = pdf.internal.pageSize.getWidth() - margin * 2;
    const pageContentMm = pdf.internal.pageSize.getHeight() - margin * 2;

    const cloneRect = clone.getBoundingClientRect();
    const mmPerPx = printWidth / cloneRect.width;
    const canvasPerPx = canvas.height / cloneRect.height;
    const pageContentPx = pageContentMm / mmPerPx;

    const relTop = (el) => el.getBoundingClientRect().top - cloneRect.top;
    const relBottom = (el) => el.getBoundingClientRect().bottom - cloneRect.top;

    const thead = clone.querySelector("thead");
    const headerTop = thead ? relTop(thead) : 0;
    const headerBottom = thead ? relBottom(thead) : 0;
    const headerHeight = headerBottom - headerTop;
    const rowBottoms = Array.from(clone.querySelectorAll("tbody tr")).map(relBottom);
    const totalHeight = cloneRect.height;

    const drawSlice = (fromPx, toPx, yMm) => {
      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = Math.max(1, Math.round((toPx - fromPx) * canvasPerPx));
      const ctx = slice.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(
        canvas,
        0, Math.round(fromPx * canvasPerPx), canvas.width, slice.height,
        0, 0, slice.width, slice.height
      );
      pdf.addImage(slice.toDataURL("image/png"), "PNG", margin, yMm, printWidth, (toPx - fromPx) * mmPerPx);
    };

    let start = 0;
    let page = 0;
    while (start < totalHeight - 1) {
      if (page > 0) pdf.addPage();
      const repeatHeader = page > 0 && thead;
      const pageStart = start;
      const limit = pageStart + pageContentPx - (repeatHeader ? headerHeight : 0);

      let end = totalHeight;
      if (limit < totalHeight) {
        const fit = rowBottoms.filter((b) => b > pageStart + 1 && b <= limit);
        end = fit.length ? fit[fit.length - 1] : limit;
      }

      let y = margin;
      if (repeatHeader) {
        drawSlice(headerTop, headerBottom, y);
        y += headerHeight * mmPerPx;
      }
      drawSlice(start, end, y);

      start = end;
      page += 1;
    }

    pdf.save(fileName);
  } finally {
    document.body.removeChild(clone);
  }
}
