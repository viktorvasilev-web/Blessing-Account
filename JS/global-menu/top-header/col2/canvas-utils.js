// JS/global-menu/top-header/col2/canvas-utils.js
export function setupHiDPICanvas(canvas, widthCSS, heightCSS) {
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = `${widthCSS}px`;
    canvas.style.height = `${heightCSS}px`;
    canvas.width = Math.round(widthCSS * dpr);
    canvas.height = Math.round(heightCSS * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
}

export function drawArrow(ctx, fromX, fromY, toX, toY) {
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const len = 6;
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - len * Math.cos(angle - Math.PI / 6), toY - len * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - len * Math.cos(angle + Math.PI / 6), toY - len * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
}

export function fillRoundedRect(ctx, x, y, w, h, r) {
    if (h <= 0 || w <= 0) return;
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
}

export function niceNumber(range, round) {
    const r = range || 1;
    const exponent = Math.floor(Math.log10(r));
    const fraction = r / Math.pow(10, exponent);
    let niceFraction;
    if (round) {
        if (fraction < 1.5) niceFraction = 1;
        else if (fraction < 3) niceFraction = 2;
        else if (fraction < 7) niceFraction = 5;
        else niceFraction = 10;
    } else {
        if (fraction <= 1) niceFraction = 1;
        else if (fraction <= 2) niceFraction = 2;
        else if (fraction <= 5) niceFraction = 5;
        else niceFraction = 10;
    }
    return niceFraction * Math.pow(10, exponent);
}
