// ---------------------------------------------------------
// Compatibility Engine (Logic สำหรับคำนวณคะแนนความเข้ากันได้ของแมว)
// ---------------------------------------------------------

export const colorGroups = {
    warm: ["orange", "cream", "brown", "ginger", "gold", "tan"],
    cool: ["gray", "black", "blue", "silver"],
    neutral: ["white"],
    mixed: ["calico", "tabby"],
};

export const getColorGroup = (color) => {
    if (!color) return "neutral";
    const c = color.toLowerCase();
    for (const group in colorGroups) {
        if (colorGroups[group].some((g) => c.includes(g))) return group;
    }
    return "neutral";
};

export const breedMatch = {
    Persian: ["Ragdoll", "Himalayan", "British Shorthair"],
    Ragdoll: ["Persian", "British Shorthair"],
    Siamese: ["Burmese", "Oriental Shorthair"],
    Bengal: ["Abyssinian"],
    "British Shorthair": ["Scottish Fold", "Ragdoll"],
};

export const getBreedScore = (my, target) => {
    if (!my || !target) return 15;
    if (my === target) return 40; // สายพันธุ์เดียวกันได้คะแนนสูง
    if (breedMatch[my]?.includes(target)) return 30; // สายพันธุ์เข้ากันได้
    return 15;
};

export const getAgeScore = (my, target) => {
    if (!my || !target) return 5;
    const diff = Math.abs(my - target);
    if (diff === 0) return 20; // อายุเท่ากันเป๊ะ
    if (diff <= 2) return 17;
    if (diff <= 4) return 10;
    return 4;
};

export const getEnergyType = (breed) => {
    const energetic = ["Bengal", "Siamese", "Abyssinian"];
    const chill = ["Persian", "Ragdoll", "British Shorthair"];
    if (energetic.includes(breed)) return "energetic";
    if (chill.includes(breed)) return "chill";
    return "medium";
};

export const getEnergyScore = (my, target) => {
    // ดึงระดับพลังงานจากสายพันธุ์
    const myEnergy = getEnergyType(my);
    const targetEnergy = getEnergyType(target);
    
    if (myEnergy === "medium" || targetEnergy === "medium") return 12; // ถ้ามีคนกลางๆ ให้คะแนนกลางๆ
    if (myEnergy === targetEnergy) return 20; // ระดับพลังงานเหมือนกัน
    if (
        (myEnergy === "energetic" && targetEnergy === "chill") ||
        (myEnergy === "chill" && targetEnergy === "energetic")
    )
        return 6; // ระดับพลังงานต่างกันมาก
    return 14;
};

export const getGenderScore = (my, target) => {
    if (!my || !target) return 5;
    if (my === target) return 10; // เพศเดียวกัน
    if (my !== target) return 25; // เพศตรงข้ามได้คะแนนสูงกว่า (ตามเกณฑ์ของระบบ)
    return 5;
};

export const getNameVibe = (my, target) => {
    if (!my || !target) return 0;
    // คะแนนเล็กน้อยหากชื่อขึ้นต้นด้วยตัวอักษรเดียวกัน
    return my[0].toLowerCase() === target[0].toLowerCase() ? 5 : 0; 
};


/**
 * คำนวณคะแนนความเข้ากันได้รวมระหว่างแมว 2 ตัว
 * (คะแนนเต็ม: 40 + 10 + 20 + 20 + 5 + 25 = 120, แต่ถูกปรับให้ Max ที่ 100)
 * * @param {object} me - ข้อมูลแมวของผู้ใช้ (name, breed, color, age, gender)
 * @param {object} target - ข้อมูลแมวเป้าหมาย
 * @returns {number} Match Score (0 - 100)
 */
export const calculateMatchScore = (me, target) => {
    if (!me || !target) return 0;

    let score = 0;
    
    // 1. คะแนนสายพันธุ์ (Max 40)
    score += getBreedScore(me.breed, target.breed);

    // 2. คะแนนสี (Max 10)
    const myGroup = getColorGroup(me.color);
    const tgGroup = getColorGroup(target.color);
    score += myGroup === tgGroup ? 10 : 4;

    // 3. คะแนนอายุ (Max 20)
    score += getAgeScore(me.age, target.age);

    // 4. คะแนนพลังงาน (Max 20)
    score += getEnergyScore(me.breed, target.breed);

    // 5. คะแนนชื่อ (Max 5)
    score += getNameVibe(me.name, target.name);

    // 6. คะแนนเพศ (Max 25)
    score += getGenderScore(me.gender, target.gender);

    // ปรับคะแนนให้ไม่เกิน 100
    return Math.min(100, Math.max(0, Math.round(score)));
};