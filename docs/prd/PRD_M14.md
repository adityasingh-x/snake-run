# PRD_Milestone 14 — SNAKE GROWTH RISK SYSTEM

Version: 2.0

Status: Approved For Planning

Assumption:

Zero external playtesters.

Validation relies on:

- Project owner
- Gameplay recordings
- Screenshots
- AI review
- Observable gameplay behavior

---

# 1. PURPOSE

Milestone 13 validated:

- Runner structure
- Runner feel
- Lane-based gameplay

Milestone 14 exists to answer:

"What makes Snake Run unique?"

Required Answer:

Growth-Based Risk Management

If growth is removed from the game and the game remains equally interesting, Milestone 14 has failed.

---

# 2. DESIGN PILLAR

Food is temptation.

Food is not:

- score
- progression
- cosmetic reward

Food is a decision.

Every food pickup must create:

Reward

- Risk

    ***

# 3. PRODUCT GOAL

Current State:

Food is always collected.

Desired State:

Food is sometimes collected.

Food is sometimes ignored.

The player must occasionally think:

"I want that food."

followed by:

"But taking it may kill me."

---

# 4. NON-GOALS

Do NOT:

- Add powerups
- Add achievements
- Add missions
- Add unlockables
- Add cosmetics
- Add monetization
- Add multiplayer
- Add progression systems

This milestone focuses entirely on growth.

---

# 5. SUCCESS QUESTION

Does growth change decisions?

Not:

Does growth increase score?

Not:

Does growth look good?

Required:

Does growth alter player behavior?

---

# 6. OBSERVABLE SUCCESS CRITERIA

Success must be measurable from recordings.

Success is achieved when recordings show:

A. Food intentionally skipped.

B. Food intentionally pursued despite danger.

C. Route choice influenced by growth opportunity.

D. Death caused by greed.

E. Long runs visibly protected.

---

# 7. FAILURE CRITERIA

Automatic failure if recordings show:

A. Food always collected.

B. Food never influences routes.

C. Growth only changes score.

D. Growth does not change behavior.

E. Length 3 and Length 30 play identically.

---

# 8. GROWTH TIERS

Tier 1

Length 3-9

Player Goal:

Learn systems.

Risk:

Low.

---

Tier 2

Length 10-19

Player Goal:

Begin investment.

Risk:

Moderate.

---

Tier 3

Length 20-29

Player Goal:

Protect run.

Risk:

High.

---

Tier 4

Length 30-49

Player Goal:

Maintain multiplier.

Risk:

Very High.

---

Tier 5

Length 50+

Player Goal:

Survive panic state.

Risk:

Extreme.

---

# 9. DESIGN REQUIREMENT

Each tier must feel different.

Not visually.

Mechanically.

Player behavior should change between tiers.

---

# 10. APPROVED RISK MECHANISMS

At least one required.

More than one recommended.

Mechanism A

Tail Pressure

Longer snake creates navigation constraints.

---

Mechanism B

Lane Commitment

Longer snake slows lane switching.

---

Mechanism C

Future Choice Restriction

Longer snake limits future options.

---

Mechanism D

Obstacle Density Pressure

Long snakes struggle more in dense sections.

---

Mechanism E

Multiplier Pressure

Player fears losing large multiplier.

---

# 11. REJECTED RISK MECHANISMS

Forbidden:

Random penalties.

Invisible penalties.

Artificial debuffs.

Unexplained punishments.

Growth must create risk naturally.

---

# 12. MULTIPLIER SYSTEM

Required.

Example:

Length 3 = x1

Length 10 = x2

Length 20 = x3

Length 30 = x4

Length 50 = x5

Values may change.

Principle may not.

---

# 13. HUD REQUIREMENTS

Player must always see:

Current Length

Current Multiplier

Next Milestone

Example:

Length 18

Multiplier x2

Next Milestone:
20

---

# 14. MILESTONE FEEDBACK

Length 10

Small celebration.

Length 20

Moderate celebration.

Length 30

Major celebration.

Length 50

Large celebration.

Required:

Visual feedback.

Audio feedback.

HUD feedback.

---

# 15. ROUTE DESIGN REQUIREMENTS

Every run should contain:

Safe Route

Risk Route

---

Safe Route

Lower reward.

Higher survival.

---

Risk Route

Higher reward.

Higher danger.

---

# 16. REQUIRED GAMEPLAY SCENARIOS

Scenario A

Food behind obstacle.

Player must commit.

---

Scenario B

Food in dangerous lane.

Safe lane available.

---

Scenario C

Food cluster.

Dangerous access.

---

Scenario D

Optional growth opportunity.

Player chooses.

---

# 17. GREED TEST

Recordings must show:

At least one moment where:

Ignoring food is correct.

At least one moment where:

Pursuing food is risky.

Without this:

Milestone fails.

---

# 18. RECORDING REQUIREMENTS

Required Evidence:

5 gameplay recordings.

Each recording:

Minimum 2 minutes.

Or until death.

Store in:

docs/Milestone 14-validation/

---

# 19. SCREENSHOT REQUIREMENTS

Capture:

Length 10

Length 20

Length 30

Length 50

If achievable.

Store in:

docs/Milestone 14-validation/

---

# 20. PROJECT OWNER VALIDATION

After reviewing recordings answer:

1. Did growth matter?

2. Did growth change routes?

3. Did growth create tension?

4. Did growth create memorable moments?

5. Would removing growth make the game worse?

---

# 21. PASS CRITERIA

Pass if:

Answer to all five questions:

YES

---

# 22. AI REVIEW REQUIREMENTS

Review agents must answer:

A. Does growth influence decisions?

B. Does growth influence routes?

C. Does growth influence survival?

D. Is growth visible to player?

E. Is growth desirable?

---

# 23. REVIEWER CHECKLIST

Gameplay

[ ] Growth changes behavior

Risk

[ ] Growth increases danger

Rewards

[ ] Growth increases value

Decision Making

[ ] Growth influences choices

Replayability

[ ] Growth creates memorable moments

---

# 24. QA CHECKLIST

[ ] Multipliers work

[ ] Milestones trigger

[ ] Feedback displays

[ ] Risk routes exist

[ ] Safe routes exist

[ ] Growth achievable

[ ] Growth meaningful

---

# 25. ACCEPTANCE CRITERIA

Required:

[ ] 5 gameplay recordings created

[ ] Validation screenshots captured

[ ] Growth changes decisions

[ ] Growth changes routes

[ ] Growth changes survival strategy

[ ] Growth creates tension

[ ] Growth creates replayability

[ ] Project owner answers YES to all validation questions

Milestone may not be closed until all criteria pass.

---

# 26. EXIT DECISION

At milestone completion answer:

"What makes Snake Run unique?"

Required Answer:

Growth-Based Risk Management

Any other answer indicates Milestone 14 has failed.
