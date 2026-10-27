export function drawAlienSilhouette(ctx, alienId) {
  ctx.save();
  ctx.fillStyle = '#071404';
  ctx.beginPath();
  ctx.arc(256, 200, 35, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(216, 235, 80, 110);
  ctx.restore();
}
