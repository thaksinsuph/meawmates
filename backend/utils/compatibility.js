export function calculateCompatibility(catA, catB) {
  let score = 0;

  if (catA.breed === catB.breed) score += 30;
  if (catA.color === catB.color) score += 20;

  // อายุใกล้กันยิ่งดี
  score += Math.max(0, 15 - Math.abs((catA.age || 0) - (catB.age || 0)) * 3);

  if (catA.personality && catB.personality &&
      catA.personality === catB.personality) {
    score += 20;
  }

  score += Math.floor(Math.random() * 10);

  return Math.min(score, 100);
}
