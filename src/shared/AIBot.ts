import { BackendMethod, Allow, isBackend } from "remult";

const PET_PROFILES: Record<string, any> = {
  dog:        { energy: 5, space: 4, social: 5, upkeep: 3, budget: 4, travel: false },
  cat:        { energy: 3, space: 2, social: 3, upkeep: 2, budget: 3, travel: true },
  rabbit:     { energy: 2, space: 3, social: 2, upkeep: 4, budget: 3, travel: false },
  chicken:    { energy: 3, space: 4, social: 2, upkeep: 4, budget: 2, travel: false },
  parrot:     { energy: 4, space: 3, social: 5, upkeep: 5, budget: 5, travel: false },
  hamster:    { energy: 2, space: 1, social: 1, upkeep: 1, budget: 1, travel: true },
  reptile:    { energy: 1, space: 2, social: 1, upkeep: 3, budget: 3, travel: true },
  fish:       { energy: 1, space: 1, social: 1, upkeep: 2, budget: 2, travel: true },
  guinea_pig: { energy: 2, space: 2, social: 3, upkeep: 3, budget: 2, travel: false },
  turtle:     { energy: 1, space: 3, social: 1, upkeep: 4, budget: 3, travel: false }
};

const PET_INFO: Record<string, { desc: string, img: string }> = {
  dog: { desc: "Dogs are loyal companions who thrive on routine.<br><br><b>Feeding:</b> High-quality protein-based diet twice daily.<br><b>Care:</b> Daily walks, mental stimulation (toys/puzzles), and consistent training.<br><b>Pro Tip:</b> Keep their mind sharp with new tricks—a tired dog is a happy, well-behaved dog!", img: "dog.jpg" },
  cat: { desc: "Cats are independent but love affection.<br><br><b>Feeding:</b> Mix of wet food for hydration and quality dry food.<br><b>Care:</b> Scoop the litter box daily and provide vertical climbing spots like shelves or cat trees.<br><b>Pro Tip:</b> Use a laser pointer or feather wand to mimic hunting; it's the best way to bond with them.", img: "cat.jpg" },
  rabbit: { desc: "Rabbits are gentle, social animals.<br><br><b>Feeding:</b> 80% Timothy hay, plus daily fresh greens.<br><b>Care:</b> They need a secure area to roam and frequent interaction.<br><b>Pro Tip:</b> They are very clean, so you can actually litter-train them just like a cat!", img: "rabbit.jpg" },
  chicken: { desc: "Chickens are social birds with funny, unique personalities.<br><br><b>Feeding:</b> Quality layer pellets, grit, and safe kitchen scraps.<br><b>Care:</b> They need a predator-proof coop and a dry dust-bath area.<br><b>Pro Tip:</b> Hanging a head of cabbage in the coop provides hours of fun 'pecking' entertainment.", img: "chicken.jpg" },
  parrot: { desc: "Parrots are highly intelligent and very social.<br><br><b>Feeding:</b> Specialized pellets, fresh veggies, and fruits.<br><b>Care:</b> They need a large cage and at least 3-4 hours of human social time daily.<br><b>Pro Tip:</b> Always cover their cage at night to ensure they get 10-12 hours of uninterrupted sleep.", img: "parrot.jpg" },
  hamster: { desc: "Hamsters are quiet, nocturnal friends.<br><br><b>Feeding:</b> Hamster seed mix with fresh veggie bits.<br><b>Care:</b> Provide deep bedding for burrowing and a solid-surface wheel.<br><b>Pro Tip:</b> Scatter their food around the cage rather than putting it in a bowl; it keeps them active and busy foraging.", img: "hamster.jpg" },
  reptile: { desc: "Reptiles are fascinating, quiet observers.<br><br><b>Feeding:</b> Specific insect or plant diet based on species.<br><b>Care:</b> Strict UVB lighting and temperature gradients are vital.<br><b>Pro Tip:</b> Spend time monitoring their behavior early on; knowing what 'normal' looks like helps you spot health issues quickly.", img: "reptile.jpg" },
  fish: { desc: "Fish bring peace to any room.<br><br><b>Feeding:</b> High-quality flakes, fed in small amounts.<br><b>Care:</b> Weekly water partial-changes and consistent filtration.<br><b>Pro Tip:</b> Don't rush the nitrogen cycle when setting up the tank—give it time to stabilize before adding fish.", img: "fish.jpg" },
  guinea_pig: { desc: "Guinea pigs are sweet, vocal friends.<br><br><b>Feeding:</b> Unlimited hay, fresh greens, and Vitamin C supplements.<br><b>Care:</b> They need large floor space (no cages that are too small!) and a friend to play with.<br><b>Pro Tip:</b> They love hidey-holes; giving them a cardboard box makes them feel super safe.", img: "guinea.jpg" },
  turtle: { desc: "Turtles are slow, long-term companions.<br><br><b>Feeding:</b> Pellets, leafy greens, and occasional protein.<br><b>Care:</b> A large tank with a powerful filter is non-negotiable.<br><b>Pro Tip:</b> Keep a log of their growth and behavior—it's a great way to track their health over many years.", img: "turtle.jpg" }
};

const CONVERSATIONAL_MAP: { bridge: string }[] = [
  { bridge: "Great! Let's get to know you. How would your friends describe your personality?" },
  { bridge: "Cool. And what's your vibe like—are you more high-energy or laid-back?" },
  { bridge: "Got it. What kind of home setup are you working with?" },
  { bridge: "Nice. Are you the type to want a super cuddly pet, or do you prefer some space?" },
  { bridge: "Fair enough. Do you find yourself traveling a lot?" },
  { bridge: "That makes sense. What kind of budget are you thinking for your new buddy?" },
  { bridge: "No worries! How do you feel about cleaning up after a pet?" },
  { bridge: "Haha, totally get that. What’s your biggest pet peeve when it comes to animals?" },
  { bridge: "Makes sense. How much time do you realistically have for a pet each week?" },
  { bridge: "Good to know! Do you have any kids or other pets already?" },
  { bridge: "Fun stuff. Do you want a pet that learns tricks?" },
  { bridge: "Got it! When hanging out at home, do you want a pet that’s active or one that’s happy chilling?" },
  { bridge: "Understood. How often is the place empty during the day?" },
  { bridge: "Lifespans vary a lot. Does that matter much to you?" },
  { bridge: "Some people love a noisy house! Are you into that?" },
  { bridge: "Regarding snacks and meals, do you want something simple?" },
  { bridge: "Just being real—are you cool with occasional surprise vet bills?" },
  { bridge: "Do you want a pet that can be handled easily?" },
  { bridge: "Big step! Are you ready for a long-term commitment?" },
  { bridge: "Almost done! What’s the main reason you’re looking for a pet?" }
];

const INDEX_LOGIC: Record<number, { trait: string, positive: number, negative: number }> = {
  3:  { trait: 'social', positive: 3, negative: -3 },
  10: { trait: 'upkeep', positive: 2, negative: -1 },
  14: { trait: 'energy', positive: 2, negative: -2 },
  16: { trait: 'budget', positive: 2, negative: -2 },
  18: { trait: 'upkeep', positive: 3, negative: -3 }
};

const userSessions: Record<string, any> = {};

export class AIBot {
  @BackendMethod({ allowed: Allow.everyone })
  static async processAnswer(userId: string, currentQuestionIndex: number, answerText: string) {
    if (!isBackend()) return { question: "Error", final: true, index: currentQuestionIndex };
    
    const text = answerText.toLowerCase();

    if (currentQuestionIndex === -1 && (text.includes("hi") || text.includes("hello") || text.includes("yes") || text.includes("ready") || text.includes("let's start"))) {
      userSessions[userId] = { 
        energy: 0, 
        space: 0, 
        social: 0, 
        upkeep: 0, 
        budget: 0, 
        travel: false, 
        awaitingInfo: false, 
        bestPet: "" 
      };
      return { question: CONVERSATIONAL_MAP[0].bridge, final: false, index: 0 };
    }

    if (!userSessions[userId]) {
      userSessions[userId] = { energy: 0, space: 0, social: 0, upkeep: 0, budget: 0, travel: false, awaitingInfo: false, bestPet: "" };
    }
    const scores = userSessions[userId];

    if (scores.awaitingInfo) {
      return text.match(/yes|sure|ok|please|yeah/) 
        ? { 
            question: `<b>Please Consider:</b> Adopting is a big commitment. ${PET_INFO[scores.bestPet].desc}`, 
            final: true, 
            index: 99,
            recommendedSpecies: scores.bestPet 
          }
        : { question: "No problem! Thanks for chatting with me. Bye!", final: true, index: 99 };
    }

    const adjust = (trait: string, val: number) => {
        const isNegated = /(don't|not|never|no |hardly|barely)\b/i.test(text);
        const change = isNegated ? -val : val;
        scores[trait] += change;
        console.log(`Debug: Trait [${trait}] adjusted by ${change}. Total: ${scores[trait]}`);
    };

    let inputMatched = false;
    if (currentQuestionIndex >= 0 && INDEX_LOGIC[currentQuestionIndex]) {
        const logic = INDEX_LOGIC[currentQuestionIndex];
        if (text.match(/yes|sure|yeah|i do|i want|ok/)) { scores[logic.trait] += logic.positive; inputMatched = true; }
        else if (text.match(/no|nope|don't|not/)) { scores[logic.trait] += logic.negative; inputMatched = true; }
    }

    const val = parseInt(text.match(/\d+/)?.[0] || "0");
    if (val > 0) {
        inputMatched = true;
        if (currentQuestionIndex === 5 && val > 100) scores.budget = 4;
        if (currentQuestionIndex === 12 && val > 6) scores.energy -= 2;
    }

    const keywords = [
        { regex: /active|high|run|play|walk|energetic|sporty|fit|fast|jog|bouncy|hyper|zoomies|busy|dynamic/, trait: 'energy', val: 3 },
        { regex: /lazy|chill|laid-back|calm|quiet|relaxed|sofa|sleepy|couch|sluggish|low-key|sedentary/, trait: 'energy', val: -3 },
        { regex: /apartment|small|condo|flat|tiny|room|studio|cramped/, trait: 'space', val: 1 },
        { regex: /house|yard|garden|backyard|big|large|spacious|farm/, trait: 'space', val: 4 },
        { regex: /cuddly|social|friendly|loving|affection|companion|hug|hold|family|extroverted/, trait: 'social', val: 3 },
        { regex: /independent|space|alone|distant|aloof|private|quiet|introvert|shy/, trait: 'social', val: -3 }
    ];

    for (const kw of keywords) {
        if (text.match(kw.regex)) { adjust(kw.trait, kw.val); inputMatched = true; }
    }

    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex >= CONVERSATIONAL_MAP.length) {
      let bestPet = "", minDiff = Infinity;
      let bestPetProfile: any = null;

      for (const [pet, profile] of Object.entries(PET_PROFILES)) {
        const diff = Math.abs(scores.energy - profile.energy) + 
                     Math.abs(scores.space - profile.space) + 
                     Math.abs(scores.social - profile.social) + 
                     Math.abs(scores.upkeep - profile.upkeep) + 
                     Math.abs(scores.budget - profile.budget);
        
        // Check if we found a strictly better profile match
        if (diff < minDiff) { 
          minDiff = diff; 
          bestPet = pet; 
          bestPetProfile = profile;
        } 
        // FIXED TIEBREAKER fallback metric: if variance yields an identical split, select the lower upkeep pet
        else if (diff === minDiff && bestPetProfile) {
          if (profile.upkeep < bestPetProfile.upkeep) {
            bestPet = pet;
            bestPetProfile = profile;
          }
        }
      }
      scores.awaitingInfo = true;
      scores.bestPet = bestPet;
      
      return { 
        question: `I’d recommend a ${bestPet.toUpperCase()}!<br><br><img src="/${PET_INFO[bestPet].img}" width="200" alt="Pet Image" /><br><br>Would you like to read my expert guide breakdown rules for this animal?`, 
        final: false, 
        index: nextIndex,
        recommendedSpecies: bestPet 
      };
    }
    
    return { question: CONVERSATIONAL_MAP[nextIndex].bridge, final: false, index: nextIndex };
  }
}