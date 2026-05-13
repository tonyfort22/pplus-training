# Off-Season Domination 26 Guide, Structured Summary

- Source extract: `off-season-domination-26-guide-extract.md`
- Original PDF: `/Users/anthonyfortugno/Desktop/thibault_training_program/Off-Season+Domination+26+Guide.pdf`
- Purpose: reusable product summary for PPLUS planning, onboarding, and athlete guidance

---

## What this guide is
This is the parent guide for the Off-Season Domination 26 training system.

It explains:
- how to schedule training phases depending on available offseason length
- why deloads matter
- how to organize the training week
- how to interpret the workout sheets
- how conditioning fits into the system
- broader FAQ-style guidance around using the program properly

---

## Core product ideas from the guide

### 1. The system is phase-based
The guide frames the program as a phased offseason system, not just a pile of workouts.

That means the app should treat this as:
- a structured multi-phase progression
- with ordering and intent per phase
- not a flat workout library only

### 2. Offseason duration changes the schedule
The guide gives different schedules depending on how long the athlete has before camp/tryouts.

Examples mentioned in the extract:
- 27 weeks
- 24 weeks
- 22 weeks
- 20 weeks
- 18 weeks
- 16 weeks
- 14 weeks
- 12 weeks
- 10 weeks
- 8 weeks
- 6 weeks
- 4 weeks

So the app may eventually need:
- a schedule builder based on available offseason length
- phase trimming/skipping logic
- backward planning from season start / tryout date

### 3. Deloads are mandatory, not optional
The guide repeatedly reinforces that deloads are a planned part of the program.

Key ideas:
- performance improves during recovery, not during the session itself
- athletes often wait too long before deloading
- if you feel like you need a deload, you are already late
- the last lactic phase is especially fatiguing
- finishing the offseason with a deload helps athletes arrive at camp fresher physically and mentally

Product implication:
- deload weeks should be modeled explicitly in planning
- the app should not treat deloads as a random skipped week
- future UX could explain why a deload exists instead of making it feel like downtime

### 4. The program should be adapted to the athlete's timeline
The guide is not saying every athlete must run the exact same calendar.

It is saying:
- use as many phases as possible
- but do not switch phases too quickly
- phase lengths may need shortening or skipping depending on available time

Product implication:
- the app should support adaptive assignment logic
- not every athlete gets the same exact phase duration

### 5. Burnout prevention matters
The guide explicitly warns against jumping into structured offseason training too soon after the season ends.

Main message:
- take roughly 2 to 3 weeks away from structured training after the season
- stay active, but do not rush into the plan
- starting too early can create burnout and disrupt progression later

Product implication:
- onboarding should include offseason timing guidance
- the app may need a pre-program buffer / reset period concept

---

## Practical system rules implied by the guide

### Scheduling logic
The guide suggests this planning flow:
1. determine when the athlete must be ready for camp or tryouts
2. work backward from that date
3. choose the longest practical path through the phases
4. insert deloads at the proper times
5. ensure the final deload leaves the athlete fresh for the next season

### Phase logic
The program should support:
- complete phase progression when enough time exists
- partial progression when time is shorter
- skipping early phases when the offseason is very short
- still preserving the late-phase prep logic

### Athlete education logic
The app should eventually teach:
- why rest matters
- why deloads are performance-enhancing, not “lost time”
- why phase order matters
- why the offseason plan must fit the athlete's real calendar

---

## Likely future app uses

### Onboarding
Use this content to build:
- "When should I start?"
- "How many weeks do I have?"
- "Which phases should I run?"
- "Why is there a deload week?"

### Program setup flow
Potential future feature:
- athlete enters season end date and next camp/tryout date
- app recommends which phases to run and how long

### Education/help screens
Potential future feature:
- explainer cards for deloads
- phase overview cards
- FAQ/help content

### Schema/planning relevance
This guide supports the schema idea that we need:
- program source
- phase ordering
- adaptable phase assignment
- explicit deload handling
- athlete-specific schedule copies

---

## Strongest takeaways for PPLUS
If we build around this source properly, the app should understand that:
- the plan is a guided offseason system
- phases have intended order
- phase duration is conditional
- deloads are part of the prescription
- the schedule should be personalized to the offseason window

That is more important than just importing workouts.

---

## Suggested later feature ideas
- offseason timeline calculator
- recommended phase path generator
- deload education card or banner
- "ready for camp" backward planner
- phase explanation screens inside the assigned program
