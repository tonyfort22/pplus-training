# Thibault Nutrition Pack, Structured Summary

- Source extract: `nutrition-pdfs-extract.md`
- Source folder: `/Users/anthonyfortugno/Desktop/thibault_training_program/nutrition`
- Purpose: reusable nutrition reference for future PPLUS product and content design

---

## What this packet is
This nutrition set is not just one meal plan.
It is a small nutrition education system for hockey athletes.

It includes:
- fundamentals of calories and macronutrients
- game day fueling guidance
- grocery and meal-planning help
- eating out guidance
- youth nutrition guidance
- practical implementation advice

So if we build a nutrition feature later, it should probably feel like:
- education
- planning
- practical execution support
not just a static macro calculator

---

## Main themes across the nutrition PDFs

### 1. Calories are the bodyweight foundation
The Calories PDF makes the base rule very clear:
- calorie balance drives bodyweight change
- food quality still matters
- both total intake and food composition matter

Key concepts pulled from the extract:
- hypercaloric = gaining weight
- maintenance = maintaining weight
- hypocaloric = losing weight
- protein/carbs = 4 calories per gram
- fats = 9 calories per gram

Product implication:
- future nutrition tools should separate:
  - bodyweight goal
  - daily intake target
  - food quality guidance

### 2. Carbohydrates are framed as hockey fuel
The carbohydrate material is very explicit that hockey is glycolytic and carb-driven.

Key ideas:
- carbs support on-ice performance
- carbs support recovery and glycogen repletion
- carbs help hydration and muscular/nervous system performance
- intake should change with activity demands

The extract includes simple ranges like:
- non-training day carbs per pound of bodyweight
- training day carbs per pound of bodyweight

Product implication:
- a future nutrition feature should likely be activity-sensitive, not static
- training day vs rest day nutrition matters

### 3. Protein supports recovery and body composition
Even without reading every protein page line here, the packet structure clearly treats protein as a foundational performance input alongside calories and carbs.

Product implication:
- protein should likely be one of the first-class tracked/intuitive concepts in any later nutrition experience

### 4. Fats are part of the complete system, not the villain
The packet includes a dedicated fats document, which suggests the system wants athletes to understand fats properly rather than avoid them blindly.

Product implication:
- the nutrition feature should teach balanced intake, not bro-science restriction

### 5. Nutrition is practical only if it is planned
The meal planning material is one of the strongest product signals in the whole packet.

Repeated message:
- athletes fail when they try to wing it
- meal planning lowers stress
- preparation matters more than perfect intention

Practical approaches mentioned:
- batch cooking
- prepping proteins and carbs in bulk
- washing/chopping ingredients in advance
- planning for travel, tournaments, and busy weeks
- using leftovers intentionally
- making food the easy default option

Product implication:
- future nutrition UX should help with behavior and planning
- not just macro theory

### 6. Game day nutrition deserves its own surface
There is a dedicated `Game Day Nutrition` PDF.
That is a strong signal that game-day fueling should not be buried inside generic meal advice.

Product implication:
- future app could have a dedicated game-day checklist or game-day nutrition timeline

### 7. Eating out guidance matters because real life matters
There is a dedicated `Eating-Out-Guide` PDF.
That means the nutrition system expects athletes to live in the real world, not eat perfect homemade meals forever.

Product implication:
- future app should handle practical contexts:
  - restaurant meals
  - travel
  - tournaments
  - busy school/work days

### 8. Grocery support is part of execution
There is a `Grocery List` PDF.
This tells us the system values translation from theory to buying behavior.

Product implication:
- a later nutrition feature could include:
  - grocery templates
  - food category lists
  - prep-friendly shopping suggestions

### 9. Youth athletes need different framing
There is a dedicated `Youth Nutrition Guide`.
That matters a lot.

Product implication:
- if PPLUS later supports younger athletes and parents,
  the nutrition experience may need:
  - youth-safe framing
  - parent-facing guidance
  - simpler implementation advice

### 10. The nutrition system is educational and actionable
The packet overall feels like it wants to do both:
- teach principles
- give concrete behavior strategies

That means a strong feature later would probably include both:
- learning content
- simple action tools

---

## Good future nutrition feature directions

### A. Nutrition education library
Simple cards or modules for:
- calories
- carbs
- protein
- fats
- hydration
- game day fueling
- recovery nutrition

### B. Goal-based nutrition guidance
Potential modes:
- build lean mass
- maintain while improving body composition
- reduce body fat
- support training performance

### C. Training day vs rest day guidance
This came through clearly in the carb guidance.
Potential feature:
- different intake recommendations depending on training load / session day

### D. Meal planning support
Potential feature:
- weekly prep workflow
- batch cooking suggestions
- simple meal building templates
- “what to prep this week” guidance

### E. Game day feature
Potential feature:
- pre-game fueling checklist
- during-day reminders
- post-game recovery suggestions

### F. Parent / youth mode
Potential feature:
- youth athlete nutrition guidance
- parent-friendly grocery and planning help

---

## Schema/product implications later
If we ever build nutrition properly, the system may eventually want entities like:
- nutrition_guides
- nutrition_topics
- nutrition_goal_profiles
- meal_planning_templates
- grocery_list_templates
- game_day_protocols
- athlete_nutrition_preferences

But for now, the more important takeaway is product shape:
- this should be a guided education + planning system
- not just a calorie number screen

---

## Best takeaways for PPLUS
If we use this packet well later, the nutrition feature should probably:
- connect food to hockey performance
- distinguish training days from non-training days
- make meal prep easier
- include game-day guidance
- support realistic eating, not fantasy perfection
- teach enough to build athlete buy-in

---

## Included docs worth revisiting later
- Calories
- Carbohydrates
- Protein
- Fats
- Game Day Nutrition
- Easy Meal Planning Strategies For Hockey
- Eating-Out-Guide
- Grocery List
- Putting it all together
- Youth Nutrition Guide
- cheatsheet_masterclass_nutrition

---

## Suggested later feature ideas
- nutrition education tab
- game-day nutrition checklist
- training day vs off day intake guidance
- simple macro explainer, not obsessive tracking first
- grocery list generator
- meal prep planner
- youth/parent nutrition support mode
