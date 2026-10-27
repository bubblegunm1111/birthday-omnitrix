// Preloads the 7 generated high-resolution 2D Omnitrix screen textures
// and composites them with the sliding mechanical shutter blades & damaged energy cracks!

import { drawAlienSilhouette } from './omnitrixSilhouetteFallback';

const FACE_IMAGES = {};
const ALIEN_IDS = [
  'fourarms',
  'xlr8',
  'cannonbolt',
  'alienx',
  'heatblast',
  'diamondhead',
  'ghostfreak',
  'upgrade',
];

export function preloadOmnitrixFaceImages() {
  ALIEN_IDS.forEach((id) => {
    if (!FACE_IMAGES[id]) {
      const img = new Image();
      img.src = `/textures/face_${id}.jpg`;
      FACE_IMAGES[id] = img;
    }
  });
}

export function renderOmnitrixFaceplate(
  ctx,
  {
    openFactor = 1, // 0 = closed hourglass, 1 = open diamond with high-res generated 2D interface!
    alienId = 'upgrade',
    damaged = false,
  }
) {
  ctx.clearRect(0, 0, 512, 512);

  const img = FACE_IMAGES[alienId];
  const isImageReady = img && img.complete && img.naturalWidth > 0;

  // 1. Draw the High-Res Generated 2D Omnitrix Interface Image inside the circular screen!
  ctx.save();
  ctx.beginPath();
  ctx.arc(256, 256, 246, 0, Math.PI * 2);
  ctx.clip();

  if (isImageReady) {
    // Slight zoom-in pulse as the diamond opens
    const zoom = 1.04 + (1 - openFactor) * 0.12;
    const drawSize = 512 * zoom;
    const offset = (512 - drawSize) / 2;
    ctx.drawImage(img, offset, offset, drawSize, drawSize);
  } else {
    // Fallback while image loads
    const bgGrad = ctx.createRadialGradient(256, 256, 10, 256, 256, 235);
    bgGrad.addColorStop(0, '#dcff26');
    bgGrad.addColorStop(0.65, '#88ff00');
    bgGrad.addColorStop(1, '#329900');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 512, 512);
    if (openFactor > 0.05) {
      drawAlienSilhouette(ctx, alienId);
    }
  }

  // 2. Mechanical Sliding Hourglass Shutter Blades!
  // When openFactor == 1: blades are retracted completely off to the left/right so the full generated 2D diamond interface shines through!
  // When openFactor == 0: the two dark metallic triangular blades meet precisely in the center, forming the iconic closed Omnitrix Hourglass!
  if (openFactor < 0.98) {
    const slideOffset = openFactor * 260;

    // When closed/closing, draw the classic bright green Omnitrix hourglass background triangles (top and bottom)
    if (openFactor < 0.65) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, (1 - openFactor) * 1.5);
      
      const grad = ctx.createRadialGradient(256, 256, 10, 256, 256, 240);
      grad.addColorStop(0, '#eaff6a');
      grad.addColorStop(0.5, '#88ff00');
      grad.addColorStop(1, '#55aa00');
      ctx.fillStyle = grad;

      // Top green triangle
      ctx.beginPath();
      ctx.moveTo(-10, -10);
      ctx.lineTo(522, -10);
      ctx.lineTo(256, 256);
      ctx.closePath();
      ctx.fill();

      // Bottom green triangle
      ctx.beginPath();
      ctx.moveTo(-10, 522);
      ctx.lineTo(522, 522);
      ctx.lineTo(256, 256);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    ctx.fillStyle = '#141c19';
    ctx.strokeStyle = '#d8e8e2';
    ctx.lineWidth = 14;
    ctx.lineJoin = 'miter';

    // Left Sliding Shutter Blade (extends past the border to completely seal the seam)
    ctx.save();
    ctx.translate(-slideOffset, 0);
    ctx.beginPath();
    ctx.moveTo(-40, -40);
    ctx.lineTo(257, 256);
    ctx.lineTo(-40, 552);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Right Sliding Shutter Blade (extends past the border to completely seal the seam)
    ctx.save();
    ctx.translate(slideOffset, 0);
    ctx.beginPath();
    ctx.moveTo(552, -40);
    ctx.lineTo(255, 256);
    ctx.lineTo(552, 552);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();

  // 3. Outer Crisp Metallic White/Silver Framing Ring
  ctx.strokeStyle = '#e2f0ea';
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.arc(256, 256, 238, 0, Math.PI * 2);
  ctx.stroke();

  // 4. Optional Damaged Fracture Lines
  if (damaged) {
    ctx.save();
    ctx.strokeStyle = '#ff3b30';
    ctx.shadowColor = '#ff3b30';
    ctx.shadowBlur = 12;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(150, 110);
    ctx.lineTo(220, 195);
    ctx.lineTo(195, 250);
    ctx.lineTo(280, 320);
    ctx.stroke();
    ctx.restore();
  }
}
