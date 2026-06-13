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
  { bridge: "Great! Let's get to know you. How would your friends describe your personality?" }, // 0
  { bridge: "Cool. And what's your vibe like—are you more high-energy or laid-back?" }, // 1
  { bridge: "Got it. What kind of home setup are you working with?" }, // 2
  { bridge: "Nice. Are you the type to want a super cuddly pet, or do you prefer some space?" }, // 3
  { bridge: "Fair enough. Do you find yourself traveling a lot?" }, // 4 (Mapped to travel boolean)
  { bridge: "That makes sense. What kind of budget are you thinking for your new buddy?" }, // 5 (Mapped to budget value parse)
  { bridge: "No worries! How do you feel about cleaning up after a pet?" }, // 6
  { bridge: "Haha, totally get that. What’s your biggest pet peeve when it comes to animals?" }, // 7
  { bridge: "Makes sense. How much time do you realistically have for a pet each week?" }, // 8
  { bridge: "Good to know! Do you have any kids or other pets already?" }, // 9
  { bridge: "Fun stuff. Do you want a pet that learns tricks?" }, // 10 (Mapped to upkeep)
  { bridge: "Got it! When hanging out at home, do you want a pet that’s active or one that’s happy chilling?" }, // 11
  { bridge: "Understood. How often is the place empty during the day?" }, // 12 (Mapped to hours logic)
  { bridge: "Lifespans vary a lot. Does that matter much to you?" }, // 13
  { bridge: "Some people love a noisy house! Are you into that?" }, // 14 (Mapped to energy)
  { bridge: "Regarding snacks and meals, do you want something simple?" }, // 15
  { bridge: "Just being real—are you cool with occasional surprise vet bills?" }, // 16 (Mapped to budget)
  { bridge: "Do you want a pet that can be handled easily?" }, // 17
  { bridge: "Big step! Are you ready for a long-term commitment?" }, // 18 (Mapped to upkeep)
  { bridge: "Almost done! What’s the main reason you’re looking for a pet?" } // 19
];

// Corrected index correlations matching the exact question being processed
const INDEX_LOGIC: Record<number, { trait: string, positive: number, negative: number, isBoolean?: boolean }> = {
  4:  { trait: 'travel', positive: 1, negative: 0, isBoolean: true },
  10: { trait: 'upkeep', positive: 2, negative: -1 }, 
  14: { trait: 'energy', positive: 2, negative: -2 }, 
  16: { trait: 'budget', positive: -2, negative: 2 }, // Vet bills: "Yes" requires higher budget availability, lowers matching compatibility with low budget numbers.
  18: { trait: 'upkeep', positive: 3, negative: -3 }  
};

const userSessions: Record<string, any> = {};

export class AIBot {
  @BackendMethod({ allowed: Allow.everyone })
  static async processAnswer(userId: string, currentQuestionIndex: number, answerText: string) {
    if (!isBackend()) return { question: "Error", final: true, index: currentQuestionIndex };
    
    const text = answerText.toLowerCase().trim();

    // Initialization logic
    if (currentQuestionIndex === -1 && (text.includes("hi") || text.includes("hello") || text.includes("yes") || text.includes("ready") || text.includes("let's start"))) {
      userSessions[userId] = { 
        energy: 3, // Baseline starter metrics (median scale value)
        space: 2, 
        social: 3, 
        upkeep: 3, 
        budget: 3, 
        travel: false, 
        awaitingInfo: false, 
        bestPet: "" 
      };
      return { question: CONVERSATIONAL_MAP[0].bridge, final: false, index: 0 };
    }

    if (!userSessions[userId]) {
      userSessions[userId] = { energy: 3, space: 2, social: 3, upkeep: 3, budget: 3, travel: false, awaitingInfo: false, bestPet: "" };
    }
    const scores = userSessions[userId];

    // Final guide step verification
    if (scores.awaitingInfo) {
      return text.match(/\b(yes|sure|ok|please|yeah|yep)\b/) 
        ? { 
            question: `<b>Please Consider:</b> Adopting is a big commitment. ${PET_INFO[scores.bestPet].desc}`, 
            final: true, 
            index: 99,
            recommendedSpecies: scores.bestPet 
          }
        : { question: "No problem! Thanks for chatting with me. Bye!", final: true, index: 99 };
    }

    let inputMatched = false;

    // Direct extraction for explicit Binary Yes/No configurations
    const isYes = /\b(yes|sure|yeah|i do|i want|ok|yep|true)\b/i.test(text);
    const isNo = /\b(no|nope|don't|not|never|false)\b/i.test(text);

    if (currentQuestionIndex >= 0 && INDEX_LOGIC[currentQuestionIndex]) {
        const logic = INDEX_LOGIC[currentQuestionIndex];
        if (isYes) { 
            if (logic.isBoolean) scores[logic.trait] = true;
            else scores[logic.trait] += logic.positive; 
            inputMatched = true; 
        } else if (isNo) { 
            if (logic.isBoolean) scores[logic.trait] = false;
            else scores[logic.trait] += logic.negative; 
            inputMatched = true; 
        }
    }

    // Number extraction validation metrics
    const numericValue = parseInt(text.match(/\d+/)?.[0] || "0");
    if (numericValue > 0) {
        inputMatched = true;
        if (currentQuestionIndex === 5) {
            if (numericValue > 500) scores.budget = 5;
            else if (numericValue > 150) scores.budget = 4;
            else if (numericValue > 50) scores.budget = 2;
            else scores.budget = 1;
        }
        if (currentQuestionIndex === 12 && numericValue > 6) {
             scores.energy -= 1; // Left alone for long hours: lower energy animal preferred
        }
    }

    // Parse open text if it hasn't matched a strict Yes/No condition yet
    if (!inputMatched) {
        const keywords = [
            { regex: /\b(active|high|run|play|walk|energetic|sporty|fit|jog|zoomies|dynamic)\b/, trait: 'energy', val: 2 },
            { regex: /\b(lazy|chill|laid-back|calm|quiet|relaxed|sofa|sleepy|couch|low-key)\b/, trait: 'energy', val: -2 },
            { regex: /\b(apartment|small|condo|flat|tiny|room|studio|cramped)\b/, trait: 'space', val: -1 }, // Subtract to look for lower space profiles
            { regex: /\b(house|yard|garden|backyard|big|large|spacious|farm)\b/, trait: 'space', val: 2 },
            { regex: /\b(cuddly|social|friendly|loving|affection|companion|hug|hold|family)\b/, trait: 'social', val: 2 },
            { regex: /\b(independent|space|alone|distant|aloof|private|introvert|shy)\b/, trait: 'social', val: -2 }
        ];

        for (const kw of keywords) {
            const matchResult = text.match(kw.regex);
            if (matchResult) {
                // Positional negation context matching check
                const matchIndex = matchResult.index || 0;
                const contextualPrefix = text.substring(0, matchIndex).trim();
                const isNegated = /\b(don't|not|never|no)\b\s*$/i.test(contextualPrefix);
                
                const modifier = isNegated ? -kw.val : kw.val;
                scores[kw.trait] += modifier;
            }
        }
    }

    // Bound metrics scales securely between minimum 1 and maximum 5 values
    for (const key of ['energy', 'space', 'social', 'upkeep', 'budget']) {
        scores[key] = Math.max(1, Math.min(5, scores[key]));
    }

    const nextIndex = currentQuestionIndex + 1;
    
    // Evaluate ultimate choices when reaching map limits
    if (nextIndex >= CONVERSATIONAL_MAP.length) {
      let bestPet = "";
      let minDiff = Infinity;
      let bestPetProfile: any = null;

      for (const [pet, profile] of Object.entries(PET_PROFILES)) {
        // Evaluate Travel Restrictions Exclusion Rule
        if (scores.travel === false && profile.travel === true) {
            continue; // Skip matching easily transportable animals if user never travels
        }

        // Manhattan Distance Calculation
        const diff = Math.abs(scores.energy - profile.energy) + 
                     Math.abs(scores.space - profile.space) + 
                     Math.abs(scores.social - profile.social) + 
                     Math.abs(scores.upkeep - profile.upkeep) + 
                     Math.abs(scores.budget - profile.budget);
        
        if (diff < minDiff) { 
          minDiff = diff; 
          bestPet = pet; 
          bestPetProfile = profile;
        } 
        else if (diff === minDiff && bestPetProfile) {
          // Tiebreaker: pick lower maintenance pet
          if (profile.upkeep < bestPetProfile.upkeep) {
            bestPet = pet;
            bestPetProfile = profile;
          }
        }
      }
      
      // Fallback in case travel filtering completely zeroed alternatives out
      if (!bestPet) {
         bestPet = "cat"; 
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