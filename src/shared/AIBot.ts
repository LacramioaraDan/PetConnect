import { BackendMethod, Allow, isBackend } from "remult";

export class AIBot {
  @BackendMethod({ allowed: Allow.everyone })
  static async askPetBot(userMessage: string) {
    if (!isBackend()) return;

    // 1. Clean and normalize string input - explicitly stripping straight and curly quotes
    const msg = userMessage.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?'"‘’“”]/g, " ").trim();
    const words = msg.split(/\s+/).filter(w => w.length > 0);

    // 2. High-Capacity Master Database broken down into fine-grained profiles
    const responses = {
      greeting: [
        "Hello fellow animal lover! 🐾 I am Buddy, your AI Pet Care Advisor. Ask me anything about specific pet diets, grooming, training, baby animal care, or health safety!",
        "Hi there! Woof! 🐕 Welcome to Buddy's Pet Knowledge Base. What kind of animal companion are we taking care of today?"
      ],
      medical_emergency: [
        "🚨 **CRITICAL VET EMERGENCY PROTOCOL:** This situation indicates an active physical trauma, choking, accidental poisoning, internal bleeding, acute refusal to eat food, or severe medical illness. Please do not attempt home remedies or wait to see if symptoms improve! Secure your animal safely in a carrier, find the closest 24/7 emergency veterinary hospital, and transport them immediately. 🐾🏥"
      ],
      toxic_alert: [
        "🛑 **TOXICITY WARNING:** Common human foods like onions, garlic, chives, chocolate, grapes, raisins, avocados, caffeine, macadamia nuts, and xylitol (birch sugar) cause rapid organ failure or fatal blood conditions in domestic pets. If your pet has swallowed any of these, contact an Emergency Vet or Pet Poison Control immediately! ❌"
      ],
      raw_diet_warning: [
        "🥩⚠️ **RAW FOOD & BONE DISCLOSURE:** Feeding raw meats introduces a high risk of bacterial infections like Salmonella or E. coli. Keep in mind: while raw bones are soft enough for some animals to chew, **cooked bones** crystallize and splinter into razor-sharp shards that can easily tear an animal's stomach or intestinal lining! Never feed cooked bones."
      ],

      // --- 🐕 DOG PROFILES ---
      dog_diet: [
        "🐕 **Dog Diet & Nutrition:** Adult dogs thrive on premium commercial kibble or wet food split into two structured meals a day (morning and night). Ensure the first ingredient is a real animal protein (like chicken, beef, or lamb). Avoid toxic human items like chocolate, grapes, onions, or raisins!"
      ],
      dog_baby: [
        "🍼🐕 **Puppy Care & Weaning:** Young puppies require smaller, highly nutrient-dense premium commercial puppy food 3-4 times a day to support rapid skeletal growth. If weaning from milk (around 4-8 weeks), mix their kibble with warm water or puppy milk replacer to form a soft mash before transitioning to dry food."
      ],
      dog_grooming: [
        "🧴🐕 **Dog Grooming & Hygiene:** Dogs should be bathed every 4-6 weeks using an animal-safe, pH-balanced oatmeal shampoo. Brush their coat 2-3 times a week to remove dead fur. Clip their nails carefully at a 45-degree angle, making sure to stay strictly above the pink internal blood vessel (the quick)."
      ],
      dog_behavior: [
        "🧸🐕 **Dog Behavior & Enrichment:** Destructive behaviors like chewing on furniture or excessive barking are signs of boredom or separation anxiety. Use interactive puzzle toys, provide safe rubber chews (like Kongs filled with pet-safe peanut butter), and ensure they get plenty of physical exercise."
      ],
      dog_training: [
        "🍖🐕 **Dog Training & Housebreaking:** Take your puppy or dog to their designated outdoor bathroom spot immediately upon waking, 20 minutes after meals, and after intense play. Reward them with a treat and high-pitched praise within 2 seconds of them finishing. Consistency is everything!"
      ],

      // --- 🐈 CAT PROFILES ---
      cat_diet: [
        "🐈 **Cat Diet & Nutrition:** Cats are strict, obligate carnivores, meaning they require meat to survive. They must have animal proteins and a vital amino acid called taurine. Incorporate wet food daily into their diet to protect their kidneys and ensure they stay properly hydrated."
      ],
      cat_baby: [
        "🍼🐈 **Kitten Care & Nutrition:** Kittens develop rapidly and require specialized commercial kitten food formulated with high protein, fat, and DHA for brain development. Feed them 3-4 tiny meals a day. Always ensure they stay warm, and provide a low-sided litter box that is easy for short legs to climb into!"
      ],
      cat_grooming: [
        "🪥🐈 **Cat Grooming & Hygiene:** While cats groom themselves, long-haired breeds need daily brushing to prevent painful mats and minimize hairballs. If you must give a cat a bath, use warm water and scoop it gently with a cup instead of using a loud, running shower sprayer to avoid starting a panic."
      ],
      cat_behavior: [
        "🛋️🐈 **Cat Behavior & Scratching:** Scratching is a natural instinct used to shed claw sheaths and mark territory. To save your curtains and furniture, provide sturdy vertical sisal scratching posts. Sprinkle them with catnip and reward your cat when they choose the post over your furniture!"
      ],
      cat_training: [
        "📦🐈 **Cat Litter Box Training:** Place the litter box in a quiet, low-traffic location away from their food bowls. Clean the box daily. If a cat suddenly starts missing the litter box, clean the spot with an enzymatic cleaner to remove the scent, and ensure the box is easily accessible."
      ],

      // --- 🐇 RABBIT PROFILES ---
      rabbit_diet: [
        "🐇 **Rabbit Nutrition:** A rabbit's diet must consist of 80% unlimited fresh Timothy hay to keep their complex digestive system running smoothly. Supplement with fresh leafy greens (like romaine lettuce or cilantro) and a small, restricted portion of pellets daily."
      ],
      rabbit_baby: [
        "🍼🐇 **Young Rabbit Nutrition:** Unlike adult rabbits, young bunnies under 6 months old need unlimited **Alfalfa hay** alongside their pellets. Alfalfa provides the extra calcium and protein essential for developing bones. Gradually introduce tiny amounts of leafy greens one at a time."
      ],
      rabbit_grooming: [
        "🧼🐇 **Rabbit Grooming & Care:** Rabbits shed heavily every few months and should be brushed regularly to prevent them from ingesting loose fur, which causes a dangerous blockage called GI Stasis. Never submerge a rabbit in water—baths cause psychological shock and heart failure!"
      ],
      rabbit_behavior: [
        "🪵🐇 **Rabbit Behavior & Chewing:** Rabbits possess teeth that grow continuously throughout their lifespan. They *must* chew constantly to wear them down. Provide unlimited hay, safe wood chew blocks, and cardboard tubes to keep their teeth healthy and prevent wire-chewing."
      ],
      rabbit_environment: [
        "🏠🐇 **Rabbit Environment & Housing:** Rabbits need a spacious enclosure where they can hop at least three times across. They should get hours of daily exercise outside of their cage. Always rabbit-proof your home by covering electrical cords with plastic tubing!"
      ],

      // --- 🐹 HAMSTER PROFILES ---
      hamster_diet: [
        "🐹 **Hamster Nutrition:** Feed your hamster a high-quality commercial pellet and seed mix. Supplement with tiny pieces of fresh vegetables like broccoli or cucumbers. Avoid sugary treats and sweet fruits, as hamsters are highly susceptible to diabetes!"
      ],
      hamster_baby: [
        "🍼🐹 **Young Hamster Care:** Growing hamsters need a diet slightly higher in protein. Supplement their commercial hamster blocks with tiny bits of hard-boiled egg or plain cooked chicken once a week. Ensure their water bottle nozzle is low enough for them to reach comfortably."
      ],
      hamster_hygiene: [
        "🏜️🐹 **Hamster Hygiene & Sand Baths:** Never wash a hamster with water, as it strips their fur of natural oils and causes fatal chills. Instead, provide a small dish filled with specialized reptile sand (no dust) so they can take natural sand baths to stay clean."
      ],
      hamster_behavior: [
        "🎡🐹 **Hamster Enrichment:** Hamsters are nocturnal and have immense energy, running miles every night. Provide a solid-surface exercise wheel (minimum 8-11 inches depending on the breed) to prevent spinal curvature. Avoid wire wheels, which catch and break their fragile legs."
      ],

      // --- 🐷 PIG PROFILES ---
      pig_diet: [
        "🐷 **Pig Nutrition:** Pet pigs require a specialized commercial pig pellet that is low in fat and protein to prevent obesity. Supplement their meals with fresh leafy vegetables. Never feed them processed human table scraps or salty foods."
      ],
      pig_baby: [
        "🍼🐷 **Piglet Care:** Young piglets under 8 weeks need specialized starter pellets. Because they cannot regulate their internal body temperature well, they must have a warm, draft-free indoor nesting area with a safe heat lamp option set up away from flammable bedding."
      ],
      pig_behavior: [
        "🌱🐷 **Pig Behavior & Rooting:** Pigs have an unyielding, powerful instinct to 'root'—plowing and digging into the dirt with their snouts to explore. If confined to an apartment or indoor room without dirt access, they will become destructive and destroy your carpets and floors."
      ],
      pig_environment: [
        "🏡🐷 **Pig Housing Space:** Pigs grow incredibly large and heavy over 3 years. They are entirely unsuited for apartment living. They require a secure outdoor yard with a shaded area, plenty of space to roam, and dirt or mud to wallow in to keep cool."
      ],

      // --- 🐴 HORSE PROFILES ---
      horse_diet: [
        "🐴 **Horse Nutrition:** Horses require high-quality forage (pasture grass or timothy hay) making up roughly 1.5% to 2% of their total body weight daily. They must have continuous access to fresh, clean water and a specialized salt lick block for trace minerals."
      ],
      horse_baby: [
        "🍼🐴 **Foal Nutrition & Care:** A nursing foal receives all its nutrients from the mare's milk. By 2-3 months old, they will begin nibbling grass and hay. If you are handling an orphaned foal, they require a dedicated equine milk replacer fed via bottle or bucket—never feed them cow's milk!"
      ],
      horse_grooming: [
        "🪮🐴 **Horse Grooming & Hoof Care:** Use a curry comb in circular motions to loosen dirt from their coat, followed by a stiff brush. Crucially, use a hoof pick daily to clear debris and stones from their hooves to prevent painful infections like thrush."
      ],
      horse_environment: [
        "🌲🐴 **Horse Environment:** Horses need an extensive pasture or paddock to run, a secure shelter or stall to escape severe weather conditions, and routine hoof maintenance from a professional farrier every 6-8 weeks without fail!"
      ],

      // --- 🐹 GUINEA_PIG PROFILES ---
      guinea_pig_diet: [
        "🐹 **Guinea Pig Diet:** Guinea pigs cannot synthesize their own Vitamin C! They must be fed high-quality guinea pig pellets enriched with Vitamin C, unlimited fresh timothy hay, and daily fresh vegetables like bell peppers."
      ],
      guinea_pig_baby: [
        "🍼🐹 **Young Guinea Pig Care:** Baby guinea pigs are born fully furred with open eyes and can eat solid foods within days. Feed them unlimited alfalfa hay alongside guinea pig starter pellets for their first 6 months to support their structural development."
      ],

      // --- 🦦 FERRET PROFILES ---
      ferret_diet: [
        "🦦 **Ferret Diet:** Ferrets are strict carnivores with an incredibly fast metabolism. They need a diet very high in animal protein and fat, but extremely low in fiber and carbohydrates. Use premium commercial ferret kibble."
      ],
      ferret_baby: [
        "🍼🦦 **Kit (Baby Ferret) Diet:** Young ferrets (kits) grow incredibly fast. Under 12 weeks old, soften their high-protein ferret pellets with warm water or low-sodium chicken broth into a mushy paste to help them chew and digest it easily."
      ],

      // --- 🪶 AVIAN / BIRD PROFILES ---
      bird_diet: [
        "🦜 **Bird Nutrition:** Avoid all-seed diets, which cause fatal fatty liver disease in birds. Feed a base of premium pellets (70%) combined with fresh vegetables (leafy greens, carrots, bell peppers) and occasional fruits. Ensure they have fresh water daily."
      ],
      bird_baby: [
        "🍼🪶 **Chicks & Baby Bird Nutrition:** Young hand-fed birds require a highly specialized commercial avian formula mixed with warm water to a precise temperature (usually around 38°C-41°C or 102°F-105°F). Feeding it cold will cause food to rot inside their crop, which is fatal. Backyard chicks require commercial 'chick starter' crumbles."
      ],
      bird_behavior: [
        "🪀🦜 **Bird Enrichment & Stress:** Birds are highly social and intelligent. They require a large cage with plenty of foraging toys, safe wood to shred, and puzzles. Without mental stimulation, birds can develop severe depression and start plucking out their own feathers."
      ],
      bird_environment: [
        "⚠️🦜 **Avian Safety Notice:** Birds have an incredibly sensitive respiratory system. Keep their cage entirely out of the kitchen! Fumes released from heated non-stick Teflon cookware pots and pans are completely odorless to humans but instantly fatal to birds."
      ],

      // =========================================================================
      // --- 🐍 SPECIFIC REPTILE PROFILES (HIGH PRECISION EXPANSION) ---
      // =========================================================================
      snake_diet: [
        "🐍 **Snake Nutrition:** Adult snakes are strict carnivores and should be fed an appropriately sized frozen-thawed rodent (mice or rats) once every 1-2 weeks. Never feed them live prey, as rodents can fight back and inflict severe, infected bite wounds on your snake!"
      ],
      snake_baby: [
        "🍼🐍 **Baby Snake Care:** Hatchling snakes require small 'pinkie mice' every 5-7 days to power their growth spurts. Ensure their temperature gradient features a warm hide box at 30°C-32°C (86°F-90°F) so their digestive enzymes can break down the bone and muscle tissue of their prey without regurgitation."
      ],
      snake_environment: [
        "🌿🐍 **Snake Enclosure & Safety:** Snakes are master escape artists! They require an absolutely secure terrarium with locking lid clips. Provide at least two identical hiding boxes (one on the warm basking side and one on the cool side) so they can feel safe without compromising their internal temperature regulation."
      ],

      // --- 🐢 TURTLE / TORTOISE PROFILES ---
      turtle_diet: [
        "🐢 **Turtle & Tortoise Nutrition:** Aquatic turtles need commercial floating pellets, small feeder shrimp, and leafy greens. Land tortoises are strict herbivores and require a high-fiber diet of calcium-rich weeds, grasses, and leafy green vegetation—never feed tortoises cat or dog food!"
      ],
      turtle_baby: [
        "🍼🐢 **Baby Turtle & Hatchling Care:** Juvenile turtles need daily feeding with high-protein hatchling pellets and micro-crickets dusted with Calcium and D3 powder. Their shell is still soft and developing; they *must* have an active UVB bulb over a completely dry basking dock to prevent shell rot and soft shell disease."
      ],
      turtle_environment: [
        "🫧🐢 **Turtle Enclosure Specs:** Aquatic turtles need a high-powered water canister filter rated for double their tank size, as they are incredibly messy eaters. Maintain water temperatures at 24°C-26°C (75°F-78°F) using an aquarium heater protected by a plastic guard to prevent shell burns."
      ],

      // --- 🦎 LIZARD / GECKO PROFILES ---
      lizard_diet: [
        "🦎 **Lizard & Gecko Nutrition:** Bearded dragons and iguanas require a daily mix of fresh chopped greens (mustard greens, escarole) and live gut-loaded crickets or dubia roaches. Smaller geckos (like crested geckos) thrive on specialized commercial powdered fruit paste formulas."
      ],
      lizard_baby: [
        "🍼🦎 **Baby Lizard Management:** Young growing lizards shed their skin constantly and have extremely high calcium needs. Feed them tiny, highly active live insects dusted with calcium powder every single day. Keep humidity dialed in precisely to ensure clean sheds without retaining skin on their fragile toes, which can cut off circulation."
      ],
      lizard_environment: [
        "☀️🦎 **Lizard Lighting & Gradients:** Diurnal lizards (like chameleons and bearded dragons) require high-output linear UVB lamps stretched across their enclosure. Change the UVB bulbs every 6 months even if they are still shining, as the invisible UV spectrum degrades over time, leading directly to Metabolic Bone Disease."
      ],

      // --- 🐸 AMPHIBIAN PROFILES ---
      amphibian_care: [
        "🐸 **Amphibian Care:** Frogs and salamanders eat live insects and absorb water directly through their highly porous skin. Because of this, you must never handle them with dry hands or lotions, and their enclosure water must always be treated with an aquarium dechlorinator to strip out harmful chemicals."
      ],

      // --- 🐠 AQUATIC / FISH PROFILES ---
      fish_diet: [
        "🐠 **Fish Nutrition:** Feed aquarium fish high-quality flakes or pellets specific to their species, but only give them what they can consume completely within 2 minutes. Excess uneaten food sinks to the bottom, rots, and releases deadly toxins into the tank."
      ],
      fish_baby: [
        "🍼🐠 **Fish Fry (Baby Fish) Nutrition:** Baby fish (fry) are too small to consume standard adult flakes. They must be fed specialized foods like live baby brine shrimp, infusoria, or finely crushed powdered fry food multiple times a day. Keep them isolated in a breeder box so adult fish don't eat them!"
      ],
      fish_environment: [
        "🫧🐠 **Aquarium Chemistry:** The most vital rule of fishkeeping is maintaining stable water chemistry. Before adding fish, your aquarium must undergo a 'nitrogen cycle' to establish beneficial bacteria that break down toxic fish waste (Ammonia and Nitrites) into safe Nitrates. Perform weekly 20% water changes using a gravel vacuum."
      ],

      // --- 🍼 GLOBAL ORPHAN NEONATAL BACKUP ---
      mammals_baby: [
        "🍼 **Orphaned Baby Mammal Care:** Newborn or unweaned baby mammals cannot digest regular cow's milk! It causes severe stomach bloating, diarrhea, and fatal dehydration. They require a specialized, species-appropriate commercial Milk Replacer fed warm at regular, frequent intervals. Keep them under a gentle, regulated heat source, as infants cannot regulate their own body heat."
      ],

      // --- 🗺️ FULL SPEC-GROUNDED COARSE CLASS SAFETY NETS ---
      mammals_general: [
        "🐾 **General Mammal Care:** Ensure this mammal has consistent access to clean water, a specialized commercial dry/wet diet, proper shelter, secure habitat enrichment to prevent distress, and safe items to chew on to support dental hygiene."
      ],
      birds_general: [
        "🦜 **General Avian Care:** Birds require a large enclosure to stretch their wings, a diverse pellet and fresh vegetable diet to avoid liver disease, and plenty of toys to prevent boredom. Never place them near non-stick cookware fumes, which are toxic to their lungs!"
      ],
      birds_baby_backup: [
        "🐤 **General Young Avian Care:** Baby birds and chicks require specialized heat regulation via a brooder or heat plate until their adult feathers grow in completely. Feed them specialized starter crumbles high in protein and keep their bedding clean and bone dry."
      ],
      reptiles_general: [
        "🦎 **General Reptile Care:** Reptiles need a thermostat-regulated thermal gradient setup (a warm basking zone and a separate cool zone) alongside specialized UVB lighting arrays to digest their food and avoid Metabolic Bone Disease."
      ],
      reptiles_baby_backup: [
        "🦎🍼 **General Juvenile Reptile Care:** Young growing reptiles have high metabolic demands. They need daily feeding of smaller, easily digestible gut-loaded prey dusted with essential calcium and D3 powders under constant, functional UVB photoperiods."
      ],
      amphibians_general: [
        "🐸 **General Amphibian Care:** Amphibians absorb water and air parameters directly through their porous skin. Never handle them with chemical lotions or dry hands, and always treat their water with an explicit aquarium dechlorinator."
      ],
      amphibians_baby_backup: [
        "🦫🐸 **Tadpole & Juvenile Amphibian Care:** Larval stages (like tadpoles) are strictly aquatic and typically require herbivorous feeding like powdered algae or specialized tadpole pellets. Ensure pristine water parameters with zero traces of chlorine as they undergo metamorphosis."
      ],
      fish_general: [
        "🐠 **General Aquatic Care:** Ensure the aquarium filter system is fully cycled before adding any specimens to handle toxic Ammonia waste. Perform weekly 20% partial water changes, and never use standard household soaps anywhere near the tank setup!"
      ],

      // --- STRUCTURAL ENCLOSURES ---
      behavior_problems: [
        "🧸 **Behavior Redirection:** Destructive scratching, wire chewing, or digging are caused by boredom or pent-up energy. Never physically punish your pet. Instead, redirect them toward appropriate toys or scratching posts and increase daily exercise!"
      ],
      grooming_dental: [
        "🧴🚿 **Hygiene & Grooming:** Always use animal-specific, pH-balanced shampoos. When trimming claws or nails, look for the pink internal blood vessel (the quick) and clip strictly *above* it to avoid cosmic accidents."
      ],
      training_housebreaking: [
        "🍖 **Training & Housebreaking:** Set an unyielding daily schedule for potty breaks. Reward your pet with a high-value treat and enthusiastic praise within 2 seconds of them doing the right action. Consistency is everything!"
      ],
      fallback: [
        "That's a wonderful question! 🐾 For specific medical, nutritional, or health concerns, I always highly recommend checking in with a licensed professional veterinarian."
      ]
    };

    const pickRandom = (arr: string[]) => arr[arr.length * Math.random() | 0];

    // Check greetings instantly
    if (words.some(w => ["hi", "hello", "hey", "greetings"].includes(w))) {
      return pickRandom(responses.greeting);
    }

    const toxicIngredients = ["onion", "onions", "garlic", "chive", "chives", "chocolate", "grape", "grapes", "raisin", "raisins", "avocado", "caffeine", "poisonous", "poison"];
    
    // Core Boolean Condition Extractors
    const hasBoneWord = words.some(w => ["bone", "bones"].includes(w));
    const hasRawWord = words.some(w => ["raw"].includes(w));
    
    const isNewbornContext = words.some(w => ["newborn", "orphan", "unweaned", "infant", "motherless", "replacer"].includes(w));
    const isGeneralBabyContext = words.some(w => ["baby", "young", "puppy", "kitten", "chick", "chicks", "foal", "kit", "kits", "piglet", "fry", "tadpole", "hatchling", "hatchlings"].includes(w));
    
    // Context Topic Extractors
    const isDietQuery = words.some(w => ["eat", "feed", "food", "diet", "nutrition", "hungry", "menu", "meals", "meal", "chicken", "meat", "grass", "hay", "flakes", "crumbles", "formula", "mouse", "mice", "pinkie", "pinkies", "insects", "crickets", "roaches"].includes(w));
    const isGroomingQuery = words.some(w => ["shampoo", "bath", "stain", "clip", "nail", "nails", "skin", "teeth", "brush", "groom", "fur", "coat", "hygiene", "wash", "clean"].includes(w));
    const isBehaviorQuery = words.some(w => ["cord", "electrical", "sofa", "furniture", "curtain", "curtains", "rooting", "chewing", "scratch", "bite", "biting", "chew", "anxiety", "bark", "barking", "dig", "digging", "bored", "enrichment", "toy", "toys", "plucking", "feather", "escape", "escaping"].includes(w));
    const isTrainingQuery = words.some(w => ["train", "sit", "listen", "crate", "howl", "housebreak", "potty", "pee", "poop", "accidents", "accident", "litter", "box"].includes(w));

    // Specific Animal Matchers - Explicitly Separated Reptile Token Filters
    const isGuineaPig = msg.includes("guinea pig") || msg.includes("guineapig");
    const isSnake = words.some(w => ["snake", "snakes", "python", "boa", "ball python", "cornsnake", "corn snake"].includes(w));
    const isTurtle = words.some(w => ["turtle", "turtles", "tortoise", "tortoises", "hatchling"].includes(w));
    const isLizard = words.some(w => ["lizard", "lizards", "gecko", "chameleon", "bearded dragon", "iguana"].includes(w));
    
    const isDog = words.some(w => ["dog", "puppy", "canine", "hound", "mutt"].includes(w));
    const isCat = words.some(w => ["cat", "kitten", "feline"].includes(w));
    const isRabbit = words.some(w => ["rabbit", "bunny", "hare"].includes(w));
    const isHamster = words.some(w => ["hamster", "mouse", "rat", "chinchilla", "gerbil", "rodent"].includes(w));
    const isPig = !isGuineaPig && words.some(w => ["pig", "piglet", "swine", "hogs", "hog"].includes(w));
    const isHorse = words.some(w => ["horse", "mare", "stallion", "equine", "hoof", "hooves", "foal"].includes(w));
    const isFerret = words.some(w => ["ferret", "kit", "kits"].includes(w));
    const isBird = words.some(w => ["bird", "birds", "parrot", "budgie", "canary", "cockatiel", "finch", "chicken", "hen", "rooster", "coop", "feather", "duck", "goose", "pigeon", "chick", "chicks"].includes(w));
    const isReptile = isSnake || isTurtle || isLizard || words.some(w => ["reptile", "terrarium", "temperature", "uvb", "basking"].includes(w));
    const isAmphibian = words.some(w => ["frog", "toad", "amphibian", "salamander", "newt", "axolotl", "tadpole"].includes(w));
    const isFish = words.some(w => ["fish", "goldfish", "betta", "aquarium", "tank", "water", "filter", "guppy", "fry"].includes(w));

    // Emergency Crisis Evaluations
    const trueEmergencyKeywords = ["sick", "hurt", "injury", "injured", "bleed", "bleeding", "vomit", "vomiting", "pain", "wound", "limp", "broken", "cough", "coughing", "dying", "fever", "poison", "lethargic", "blood", "pus", "infection", "choking", "swallowed", "emergency"];
    const hasEmergencyWord = words.some(w => trueEmergencyKeywords.includes(w));
    const isSwallowedEmergency = words.some(w => ["swallowed", "choking", "emergency"].includes(w)) || (hasBoneWord && !hasRawWord);
    const hasIngestedToxicItem = toxicIngredients.some(t => words.includes(t)) && (words.some(w => ["ate", "eaten", "swallowed", "consumed", "ingested"].includes(w)));
    const isRedFluidEmergency = words.includes("red") && words.some(w => ["pee", "peeing", "pees", "poop", "poops", "pooping", "vomit", "vomits", "vomiting", "liquid", "fluid", "urine"].includes(w));
    const isFoodRefusalEmergency = (words.includes("dont") || words.includes("doesnt") || words.includes("not") || words.includes("stop") || words.includes("stopped")) && (words.includes("eat") || words.includes("drink") || words.includes("eating") || words.includes("drinking")) && (isHorse || isPig || isDog || isCat);

    // ⭐ PRIORITY 1: GLOBAL CLINICAL EMERGENCIES & CRISES
    if (isSwallowedEmergency || hasIngestedToxicItem || isRedFluidEmergency || isFoodRefusalEmergency || (hasEmergencyWord && (!isTrainingQuery || words.includes("sick") || words.includes("pain")))) {
      return pickRandom(responses.medical_emergency);
    }

    // 🛑 PRIORITY 2: PASSIVE TOXIC DISCLOSURES
    if (toxicIngredients.some(t => words.includes(t))) {
      return pickRandom(responses.toxic_alert);
    }

    // 🥩 PRIORITY 3: RAW DIET CHECKERS
    if (hasRawWord || words.includes("salmonella")) {
      return pickRandom(responses.raw_diet_warning);
    }

    // 🧴 PRIORITY 4: HYGIENE & GROOMING
    if (words.some(w => ["shampoo", "bath", "stain", "clip", "nail", "nails", "skin", "teeth", "brush", "groom"].includes(w))) {
      return pickRandom(responses.grooming_dental);
    }

    // 🧸 PRIORITY 5: BEHAVIOR & CHEWING PREVENTIONS
    if (words.some(w => ["cord", "electrical", "sofa", "furniture", "curtain", "curtains", "rooting", "chewing", "scratch", "bite", "biting", "chew", "anxiety"].includes(w))) {
      return pickRandom(responses.behavior_problems);
    }

    // 🍼 PRIORITY 6: STRICT ORPHAN NEONATAL FILTER
    if (isNewbornContext && (isDog || isCat || isRabbit || isHamster || isGuineaPig || isPig || isHorse || isFerret)) {
      return pickRandom(responses.mammals_baby);
    }

    // =========================================================================
    // 🎯 PRIORITY 7: HIGH-PRECISION ANIMAL SPECIFIC ROUTER
    // =========================================================================
    if (isGuineaPig) {
      if (isGeneralBabyContext) return pickRandom(responses.guinea_pig_baby);
      if (isDietQuery) return pickRandom(responses.guinea_pig_diet);
    }
    
    // --- Detailed Snake Sub-Router ---
    if (isSnake) {
      if (isGeneralBabyContext) return pickRandom(responses.snake_baby);
      if (isDietQuery) return pickRandom(responses.snake_diet);
      if (isBehaviorQuery || isGroomingQuery || words.includes("tank") || words.includes("hide") || words.includes("escape")) return pickRandom(responses.snake_environment);
    }
    
    // --- Detailed Turtle Sub-Router ---
    if (isTurtle) {
      if (isGeneralBabyContext) return pickRandom(responses.turtle_baby);
      if (isDietQuery) return pickRandom(responses.turtle_diet);
      if (isBehaviorQuery || isGroomingQuery || words.includes("filter") || words.includes("dock") || words.includes("water") || words.includes("heater")) return pickRandom(responses.turtle_environment);
    }
    
    // --- Detailed Lizard Sub-Router ---
    if (isLizard) {
      if (isGeneralBabyContext) return pickRandom(responses.lizard_baby);
      if (isDietQuery) return pickRandom(responses.lizard_diet);
      if (isBehaviorQuery || isGroomingQuery || words.includes("lamp") || words.includes("uvb") || words.includes("lighting") || words.includes("shed")) return pickRandom(responses.lizard_environment);
    }

    if (isDog) {
      if (isGeneralBabyContext || isNewbornContext) return pickRandom(responses.dog_baby);
      if (isDietQuery) return pickRandom(responses.dog_diet);
      if (isGroomingQuery) return pickRandom(responses.dog_grooming);
      if (isBehaviorQuery) return pickRandom(responses.dog_behavior);
      if (isTrainingQuery) return pickRandom(responses.dog_training);
    }
    if (isCat) {
      if (isGeneralBabyContext || isNewbornContext) return pickRandom(responses.cat_baby);
      if (isDietQuery) return pickRandom(responses.cat_diet);
      if (isGroomingQuery) return pickRandom(responses.cat_grooming);
      if (isBehaviorQuery) return pickRandom(responses.cat_behavior);
      if (isTrainingQuery) return pickRandom(responses.cat_training);
    }
    if (isRabbit) {
      if (isGeneralBabyContext) return pickRandom(responses.rabbit_baby);
      if (isDietQuery) return pickRandom(responses.rabbit_diet);
      if (isGroomingQuery) return pickRandom(responses.rabbit_grooming);
      if (isBehaviorQuery) return pickRandom(responses.rabbit_behavior);
      if (isTrainingQuery || words.includes("cage") || words.includes("enclosure")) return pickRandom(responses.rabbit_environment);
    }
    if (isHamster) {
      if (isGeneralBabyContext) return pickRandom(responses.hamster_baby);
      if (isDietQuery) return pickRandom(responses.hamster_diet);
      if (isGroomingQuery) return pickRandom(responses.hamster_hygiene);
      if (isBehaviorQuery) return pickRandom(responses.hamster_behavior);
    }
    if (isPig) {
      if (isGeneralBabyContext || isNewbornContext) return pickRandom(responses.pig_baby);
      if (isDietQuery) return pickRandom(responses.pig_diet);
      if (isBehaviorQuery) return pickRandom(responses.pig_behavior);
      if (isTrainingQuery || words.includes("apartment") || words.includes("yard")) return pickRandom(responses.pig_environment);
    }
    if (isHorse) {
      if (isGeneralBabyContext || isNewbornContext) return pickRandom(responses.horse_baby);
      if (isDietQuery) return pickRandom(responses.horse_diet);
      if (isGroomingQuery) return pickRandom(responses.horse_grooming);
      if (words.includes("farrier") || words.includes("paddock") || words.includes("pasture") || words.includes("shelter")) return pickRandom(responses.horse_environment);
    }
    if (isFerret) {
      if (isGeneralBabyContext) return pickRandom(responses.ferret_baby);
      if (isDietQuery) return pickRandom(responses.ferret_diet);
    }
    if (isBird) {
      if (isGeneralBabyContext || isNewbornContext) return pickRandom(responses.bird_baby);
      if (isDietQuery) return pickRandom(responses.bird_diet);
      if (isBehaviorQuery) return pickRandom(responses.bird_behavior);
      if (isGroomingQuery || words.includes("kitchen") || words.includes("teflon") || words.includes("fumes")) return pickRandom(responses.bird_environment);
    }
    if (isAmphibian) {
      if (isGeneralBabyContext || isNewbornContext) return pickRandom(responses.amphibians_baby_backup);
      return pickRandom(responses.amphibian_care);
    }
    if (isFish) {
      if (isGeneralBabyContext || isNewbornContext) return pickRandom(responses.fish_baby);
      if (isDietQuery) return pickRandom(responses.fish_diet);
      if (isBehaviorQuery || isGroomingQuery || words.includes("chemistry") || words.includes("cycle") || words.includes("change")) return pickRandom(responses.fish_environment);
    }

    // =========================================================================
    // 🗺️ PRIORITY 8: COARSE-GRAINED CLASS SAFETY NETS
    // =========================================================================
    if (isReptile) {
      if (isGeneralBabyContext) return pickRandom(responses.reptiles_baby_backup);
      return pickRandom(responses.reptiles_general);
    }
    if (isBird) {
      if (isGeneralBabyContext) return pickRandom(responses.birds_baby_backup);
      return pickRandom(responses.birds_general);
    }
    if (isAmphibian) {
      if (isGeneralBabyContext) return pickRandom(responses.amphibians_baby_backup);
      return pickRandom(responses.amphibians_general);
    }
    if (isFish) {
      if (isGeneralBabyContext) return pickRandom(responses.fish_baby);
      return pickRandom(responses.fish_general);
    }
    if (isDog || isCat || isRabbit || isHamster || isGuineaPig || isPig || isHorse || isFerret) {
      if (isGeneralBabyContext || isNewbornContext) return pickRandom(responses.mammals_baby);
      return pickRandom(responses.mammals_general);
    }

    if (isTrainingQuery) return pickRandom(responses.training_housebreaking);

    // Universal default fallback
    return pickRandom(responses.fallback);
  }
}