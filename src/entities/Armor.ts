export type Element = "fire" | "water" | "lightning" | "ice" | "dragon";
export type StatusAilments = "paralysis" | "poison" | "blast" | "sleep";

interface ElementResistances {
  fire: number;
  water: number;
  lightning: number;
  ice: number;
  dragon: number;
}

class Hunter {
  attack: number;
  defense: number;

  resistances: ElementResistances;

  weapon: Weapon | null;
  head: Armor | null;
  chest: Armor | null;
  arms: Armor | null;
  legs: Armor | null;
  feet: Armor | null;
  charm: Charm | null;

  skills: Map<string, Skill>;
  skillLimitOverrides: Map<string, SkillMaxLevelOverride>;

  constructor(data: {
    attack: number;
    defense: number;
    resistances: ElementResistances;
    weapon: Weapon | null;
    head: Armor | null;
    chest: Armor | null;
    arms: Armor | null;
    legs: Armor | null;
    feet: Armor | null;
    charm: Charm | null;
    skills: Map<string, Skill>;
    skillOverrides: Map<string, SkillMaxLevelOverride>;
  }) {
    this.attack = data.attack;
    this.defense = data.defense;
    this.resistances = data.resistances;
    this.weapon = data.weapon;
    this.head = data.head;
    this.chest = data.chest;
    this.arms = data.arms;
    this.legs = data.legs;
    this.feet = data.feet;
    this.charm = data.charm;
    this.skills = data.skills;
    this.skillLimitOverrides = data.skillOverrides;
  }

  setDecoration(
    armorLocation: "head" | "chest" | "arms" | "legs" | "feet",
    decorationSlotIdx: number,
    decoration: Decoration | null
  ) {
    let armor: Armor | null = null;

    switch (armorLocation) {
      case "head":
        armor = this.head;
        break;
      case "arms":
        armor = this.arms;
        break;
      case "chest":
        armor = this.chest;
        break;
      case "legs":
        armor = this.legs;
        break;
      case "feet":
        armor = this.feet;
        break;
    }
    if (!armor) {
      throw new Error("No armor");
    }

    armor.setDecoration(decorationSlotIdx, decoration);
  }

  setWeapon(weapon: Weapon | null) {
    this.weapon = weapon;
  }

  setArmor(armorLocation: ArmorType, armor: Armor | null) {
    if (!armor) {
      this[armorLocation] = null;
      return;
    }

    if (armorLocation !== armor.type) {
      throw new Error("Armor type is not matching");
    }

    // remove all the stuff from the armor
    this.removeArmor(armorLocation);
    // add all the new stuff from the armor
    if (!armor) {
      this[armorLocation] = null;
    } else {
      this.addArmor(armorLocation, armor);
    }
  }

  removeArmor(armorLocation: ArmorType) {
    const armor = this[armorLocation];
    if (!armor) {
      return;
    }

    this.defense -= armor.defense;
    this.resistances.dragon -= armor.resistances.dragon;
    this.resistances.fire -= armor.resistances.fire;
    this.resistances.ice -= armor.resistances.ice;
    this.resistances.lightning -= armor.resistances.lightning;
    this.resistances.water -= armor.resistances.water;

    // armor innate skills
    for (const armorSkill of armor.innateSkills) {
      const skill = this.skills.get(armorSkill.name);
      if (!skill) {
        throw new Error("Armor skill not added in character skills");
      }
      skill.level -= armorSkill.level;
      if (skill.level === 0) {
        this.skills.delete(skill.name);
      }
    }

    // armor deco skills
    if (armor.decorationSlots) {
      for (const decorationSlot of armor.decorationSlots) {
        if (decorationSlot.slot) {
          for (const decoSkill of decorationSlot.slot.skills) {
            const skill = this.skills.get(decoSkill.name);
            if (!skill) {
              throw new Error(
                "Decoration skill not properly added to character"
              );
            }
            skill.level -= decoSkill.level;

            if (skill.level === 0) {
              this.skills.delete(skill.name);
            }
          }
        }
      }
    }

    // armor skill overrides
    if (armor.skillLimitOverrides) {
      for (const armorSkillOverride of armor.skillLimitOverrides) {
        const skillOverride = this.skillLimitOverrides.get(
          armorSkillOverride.name
        );
        if (!skillOverride) {
          throw new Error("Skill limit overrides not set on character skill");
        }
        skillOverride.level -= armorSkillOverride.level;
        if (skillOverride.level === 0) {
          this.skillLimitOverrides.delete(skillOverride.name);
        }
      }
    }

    this[armorLocation] = null;
  }

  addArmor(armorLocation: ArmorType, armor: Armor) {
    if (this[armorLocation] !== null) {
      this.removeArmor(armorLocation);
    }

    this.defense += armor.defense;
    this.resistances.dragon += armor.resistances.dragon;
    this.resistances.fire += armor.resistances.fire;
    this.resistances.ice += armor.resistances.ice;
    this.resistances.lightning += armor.resistances.lightning;
    this.resistances.water += armor.resistances.water;

    // add innate skills
    for (const armorSkill of armor.innateSkills) {
      const existingSkill = this.skills.get(armorSkill.name);
      if (existingSkill) {
        existingSkill.level + armorSkill.level;
      } else {
        this.skills.set(armorSkill.name, { ...armorSkill });
      }
    }

    // add deco skills
    if (armor.decorationSlots) {
      for (const slot of armor.decorationSlots) {
        if (!slot.slot) {
          continue;
        }

        for (const armorSkill of slot.slot.skills) {
          const existingSkill = this.skills.get(armorSkill.name);
          if (existingSkill) {
            existingSkill.level + armorSkill.level;
          } else {
            this.skills.set(armorSkill.name, { ...armorSkill });
          }
        }
      }
    }
    // add skill Limit overrides
    for (const skillLimitOverride of armor.skillLimitOverrides) {
      const existingOverride = this.skillLimitOverrides.get(
        skillLimitOverride.name
      );

      if (existingOverride) {
        existingOverride.level += skillLimitOverride.level;
      } else {
        this.skillLimitOverrides.set(skillLimitOverride.name, {
          ...skillLimitOverride,
        });
      }
    }

    this[armorLocation] = armor;
  }
}

function handleSkillSideEffect(hunter: Hunter, skill: Skill) {}

type ArmorType = "head" | "chest" | "arms" | "legs" | "feet";

class Armor {
  name: string;
  defense: number;
  type: ArmorType;
  level: number;
  levelLimit: number;
  resistances: ElementResistances;
  innateSkills: Skill[];
  skillLimitOverrides: SkillMaxLevelOverride[];
  decorationSlots: DecorationSlot[] | null;

  constructor(data: {
    name: string;
    defense: number;
    type: ArmorType;
    level: number;
    levelLimit: number;
    resistances: ElementResistances;
    innateSkills: Skill[];
    skilLimitOverrides: SkillMaxLevelOverride[];
    decorationSlots: DecorationSlot[] | null;
  }) {
    this.name = data.name;
    this.defense = data.defense;
    this.type = data.type;
    this.level = data.level;
    this.levelLimit = data.levelLimit;
    this.resistances = data.resistances;
    this.innateSkills = data.innateSkills;
    this.skillLimitOverrides = data.skilLimitOverrides;
    this.decorationSlots = data.decorationSlots;
  }

  setDecoration(decorationSlotIdx: number, decoration: Decoration | null) {
    if (!this.decorationSlots) {
      throw new Error("No decoration slots");
    }

    const slot = this.decorationSlots[decorationSlotIdx];
    if (!slot) {
      throw new Error("Invalid decoration slot index");
    }
  }
}

class Charm {
  constructor(
    public level: number,
    public leveLimit: number,
    public skill: Skill
  ) {}
}

class Weapon {
  constructor(
    public attack: string,
    public defense: number,
    public decorationSlots: DecorationSlot[] | null,
    public element: Element | null,
    public statusAilment: StatusAilments | null
  ) {}
}

class DecorationSlot {
  constructor(public level: number, public slot: null | Decoration) {}

  setDecoration(decoration: Decoration | null) {
    if (!decoration) {
      this.slot = decoration;
      return;
    }

    if (decoration.level > this.level) {
      throw new Error("Decoration level is higher than slot level");
    }

    this.slot = decoration;
  }
}

class Decoration {
  level: number;
  skills: Skill[];
  constructor(data: { skills: Skill[]; level: number }) {
    if (data.level < 4 && data.skills.length > 1) {
      throw new Error("Invalid decoration skills");
    }

    this.level = data.level;
    this.skills = data.skills;
  }
}

class Skill {
  level: number;
  maxLevel: number;
  name: string;

  constructor(data: { level: number; maxLevel: number; name: string }) {
    this.level = data.level;
    this.maxLevel = data.maxLevel;
    this.name = data.name;
  }
}

class SkillMaxLevelOverride {
  name: string;
  skillName: string;
  newMaxLevel: number;
  level: number;
  activationLevel: number;

  constructor(data: {
    level: number;
    skillName: string;
    name: string;
    newMaxLevel: number;
    activationLevel: number;
  }) {
    this.name = data.name;
    this.skillName = data.skillName;
    this.level = data.level;
    this.activationLevel = data.activationLevel;
    this.newMaxLevel = data.newMaxLevel;
  }
}
